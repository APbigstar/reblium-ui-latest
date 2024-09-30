const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");
const axios = require("axios");
const { subHours, compareAsc, format } = require("date-fns");
const {
  createCustomer,
  createSubscription,
  cancelSubscription,
  retrieveSubscription,
  retrievePaymentIntent,
  updateSubscriptionEndPeriod
} = require("./stripeLib"); 

const app = express();
const router = express.Router();

app.use(express.json());

router.post("/confirmPlanPaymentIntent", async (req, res) => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { payment_intent_id, userId } = req.body;

    if (!payment_intent_id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing payment_intent_id" });
    }

    const payment_intent = await retrievePaymentIntent(payment_intent_id);

    // Fetch user plan
    const [userPlans] = await connection.execute(
      "SELECT * FROM User_Plans WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );

    if (userPlans.length === 0) {
      return res
        .status(500)
        .json({ success: false, error: "Error fetching user plan" });
    }

    // Fetch stripe customer
    const [stripeCustomer] = await connection.execute(
      "SELECT customer_id FROM Stripe_Customer WHERE user_id = ?",
      [userId]
    );

    if (stripeCustomer.length === 0) {
      return res
        .status(500)
        .json({ success: false, error: "Error fetching stripe customer" });
    }

    const customer_id = stripeCustomer[0].customer_id;

    if (
      userPlans[0] &&
      payment_intent.customer === customer_id &&
      payment_intent.status === "succeeded"
    ) {
      await connection.execute(
        "UPDATE User_Plans SET is_active = 1 WHERE id = ?",
        [userPlans[0].id]
      );

      return res.json({ success: true });
    }
    return res.json({ success: false });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

router.post("/cancelSubscription", async (req, res) => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { user_plan_id, userId } = req.body;

    if (!user_plan_id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing user_plan_id" });
    }

    const [userPlans] = await connection.execute(
      "SELECT * FROM User_Plans WHERE id = ?",
      [user_plan_id]
    );

    if (userPlans.length === 0) {
      return res
        .status(500)
        .json({ success: false, error: "Error fetching user plan" });
    }

    const userPlan = userPlans[0];

    if (userPlan.is_active) {
      const subscription = await updateSubscriptionEndPeriod(
        userPlan.provider_id,
        true
      );
      const expiresAt = format(
        new Date(subscription.cancel_at * 1000),
        "MM/dd/yyyy, hh:mm:ss a"
      );

      await connection.execute(
        "UPDATE User_Plans SET expires_at = ?, complete = 1, is_active = 0 WHERE id = ?",
        [expiresAt, user_plan_id]
      );


      await connection.execute(
        "UPDATE User_Credits SET premium_status = ? WHERE user_id = ?",
        ['free', userId]
      )

      return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

router.post("/createSubscription", async (req, res) => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { plan_id, userId, userEmail } = req.body;

    if (!plan_id) {
      return res.status(400).json({ success: false, error: "Missing plan_id" });
    }

    // Fetch plan details
    const [plans] = await connection.execute(
      "SELECT * FROM Plans WHERE id = ?",
      [plan_id]
    );
    if (plans.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }
    const plan = plans[0];

    // Fetch user plans
    const [userPlans] = await connection.execute(
      "SELECT * FROM User_Plans WHERE user_id = ? AND plan_id = ? AND complete = 0 ORDER BY id DESC",
      [userId, plan_id]
    );

    // Fetch or create Stripe customer
    let [stripeCustomers] = await connection.execute(
      "SELECT customer_id FROM Stripe_Customer WHERE user_id = ?",
      [userId]
    );
    let customer_id;

    if (stripeCustomers.length === 0) {
      const customer = await createCustomer(userEmail);
      customer_id = customer.id;
      await connection.execute(
        "INSERT INTO Stripe_Customer (customer_id, user_id) VALUES (?, ?)",
        [customer_id, userId]
      );
    } else {
      customer_id = stripeCustomers[0].customer_id;
    }

    let isTrial = false;
    let clientSecret = "";

    if (userPlans.length === 0) {
      const subscription = await createSubscription(
        customer_id,
        plan.product_id,
        userEmail
      );
      const { subscription_id, status, is_trial, client_secret } = subscription;
      await connection.execute(
        "INSERT INTO User_Plans (plan_id, user_id, provider_id, status) VALUES (?, ?, ?, ?)",
        [plan_id, userId, subscription_id, status]
      );
      isTrial = is_trial;
      clientSecret = client_secret;
    } else {
      const creationTime = new Date(userPlans[0].created_at);
      const currentTimeMinusTwoHours = subHours(new Date(), 22);

      if (compareAsc(creationTime, currentTimeMinusTwoHours) < 0) {
        await cancelSubscription(userPlans[0].provider_id);
        await connection.execute("DELETE FROM User_Plans WHERE id = ?", [
          userPlans[0].id,
        ]);
        const subscription = await createSubscription(
          customer_id,
          plan.product_id,
          userEmail
        );
        const { subscription_id, status, is_trial, client_secret } =
          subscription;
        await connection.execute(
          "INSERT INTO User_Plans (plan_id, user_id, provider_id, status) VALUES (?, ?, ?, ?)",
          [plan_id, userId, subscription_id, status]
        );
        isTrial = is_trial;
        clientSecret = client_secret;
      } else {
        const subscription = await retrieveSubscription(
          userPlans[0].provider_id
        );
        clientSecret = subscription.latest_invoice.payment_intent.client_secret;
      }
    }

    res.json({
      success: true,
      data: { client_secret: clientSecret, is_trial: isTrial },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

router.post("/updateSubscription", async (req, res) => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { user_plan_id, plan_id } = req.body;

    if (!user_plan_id || !plan_id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing plan_id or user_plan_id" });
    }

    // Fetch plan details
    const [plans] = await connection.execute(
      "SELECT * FROM plans WHERE id = ?",
      [plan_id]
    );

    if (plans.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }
    const plan = plans[0];

    // Fetch user plan details
    const [userPlans] = await connection.execute(
      "SELECT * FROM User_Plans WHERE id = ?",
      [user_plan_id]
    );

    if (userPlans.length === 0) {
      return res
        .status(500)
        .json({ success: false, error: "Error fetching user plan" });
    }
    const userPlan = userPlans[0];

    if (userPlan.plan_id !== plan.id) {
      await modifySubscription(userPlan.provider_id, plan.product_id);
      await connection.execute(
        "UPDATE User_Plans SET plan_id = ?, expires_at = NULL WHERE id = ?",
        [plan.id, user_plan_id]
      );
    } else {
      await updateSubscriptionEndPeriod(userPlan.provider_id, false);
      await connection.execute(
        "UPDATE User_Plans SET expires_at = NULL WHERE id = ?",
        [user_plan_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    await connection.end();
  }
});

router.get("/getSelectedSubscription", async (req, res) => {
  // Retrieve environment variables
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { user_id } = req.query;
    const getCurrentUserPlan = `
      SELECT plan_id, id
      FROM User_Plans 
      WHERE user_id = ? 
        AND is_active = 1 
        AND (status = 'open' OR status = 'active') 
        AND expires_at IS NULL
    `;
    const [rows] = await connection.execute(getCurrentUserPlan, [user_id]);

    if (rows.length === 0) {
      res.json({ exists: false });
    } else {
      const planId = rows[0].plan_id;
      const userPlanId = rows[0].id;
      res.json({ exists: true, plan: planId, userPlanId: userPlanId });
    }
  } catch (error) {
    console.error("Error executing database query:", error);
    res.status(500).json({ error: "Error processing the request" });
  } finally {
    connection.end();
  }
});

app.use("/.netlify/functions/premium", router);

module.exports = app;
module.exports.handler = serverless(app);
