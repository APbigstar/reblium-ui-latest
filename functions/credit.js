const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");
const axios = require("axios"); // You'll need to install this package
const { retrievePaymentIntent, createCustomer, createPaymentIntent } = require("./stripeLib"); // Adjust the path as needed

const app = express();
const router = express.Router();
app.use(express.json());

router.post("/confirmCreditPaymentIntent", async (req, res) => {
  const creditData = { 12: 100, 30: 250, 60: 500, 96: 800 };

  // Get the database connection details from environment variables
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
    const { payment_intent_id, amount, userId } = req.body;

    if (!payment_intent_id || !amount) {
      return res
        .status(400)
        .json({ success: false, error: "Missing payment_intent_id or amount" });
    }

    const payment_intent = await retrievePaymentIntent(payment_intent_id);

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
      payment_intent.customer === customer_id &&
      payment_intent.status === "succeeded"
    ) {
      // Check if user credit exists
      const [existingUserCredit] = await connection.execute(
        "SELECT * FROM User_Credits WHERE user_id = ?",
        [userId]
      );

      if (existingUserCredit.length > 0) {
        const totalAmount = existingUserCredit[0].amount + creditData[amount];
        await connection.execute(
          "UPDATE User_Credits SET amount = ? WHERE user_id = ?",
          [totalAmount, userId]
        );
      } else {
        await connection.execute(
          "INSERT INTO User_Credits (user_id, amount) VALUES (?, ?)",
          [userId, creditData[Number(amount)]]
        );
      }

      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    // Close the database connection
    connection.end();
  }
});

router.post("/createCreditPaymentIntent", async (req, res) => {
  // Get the database connection details from environment variables
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
    const { amount, userId, userEmail } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "Missing amount" });
    }

    // Check if stripe customer exists
    const [stripeCustomer] = await connection.execute(
      "SELECT customer_id FROM Stripe_Customer WHERE user_id = ?",
      [userId]
    );

    let customer_id = "";
    if (stripeCustomer.length === 0) {
      const customer = await createCustomer(userEmail);
      customer_id = customer.id;
      await connection.execute(
        "INSERT INTO Stripe_Customer (customer_id, user_id) VALUES (?, ?)",
        [customer_id, userId]
      );
    } else {
      customer_id = stripeCustomer[0].customer_id;
    }

    const payment_intent = await createPaymentIntent(
      Math.round(amount * 100),
      customer_id,
      userEmail
    );

    res.json({
      success: true,
      data: { client_secret: payment_intent?.client_secret },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    // Close the database connection
    connection.end();
  }
});

router.get("/getUserCreditAmount", async (req, res) => {
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
    const checkUserExistingCredits =
      "SELECT amount FROM User_Credits WHERE user_id = ?";
    const [rows] = await connection.execute(checkUserExistingCredits, [
      user_id,
    ]);

    const getCurrentUserPlan = `
      SELECT plan_id, id, created_at
      FROM User_Plans 
      WHERE user_id = ? 
        AND is_active = 1 
        AND (status = 'open' OR status = 'active') 
        AND expires_at IS NULL
    `;

    const [planRows] = await connection.execute(getCurrentUserPlan, [user_id]);

    console.log(planRows)

    if (rows.length === 0) {
      res.json({ exists: false });
    } else {
      const creditAmount = rows[0].amount;
      if (planRows.length > 0) {
        res.json({ exists: true, amount: creditAmount, createdAt: planRows[0].created_at });
      } else {
        res.json({ exists: true, amount: creditAmount });
      }
    }
  } catch (error) {
    console.error("Error executing database query:", error);
    res.status(500).json({ error: "Error processing the request" });
  } finally {
    connection.end();
  }
});

router.post("/updateUserCreditAmount", async (req, res) => {
  // Retrieve environment variables
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
  });

  try {
    const { user_id, amount, premium } = req.body;
    let premuim_value = "";

    if (!user_id || amount === undefined) {
      return res
        .status(400)
        .json({ error: "Missing user_id or amount in request body" });
    }

    const [currentCredits] = await connection.execute(
      "SELECT amount, premium_status FROM User_Credits WHERE user_id = ? FOR UPDATE",
      [user_id]
    );

    if (currentCredits.length === 0) {
      if (premium == "premium" || premium == "pro") {
        await connection.execute(
          "INSERT INTO User_Credits (user_id, amount, premium_status) VALUES(?, ?, ?)",
          [user_id, amount, premium]
        );
        return res.json({ success: true, updatedAmount: amount });
      }
    } else {
      const currentAmount = currentCredits[0].amount;
      let newAmount;

      if (premium == "") {
        newAmount = currentAmount + amount;
        premuim_value = "free";
      }
      if (
        currentCredits[0].premium_status == "free" &&
        (premium == "premium" || premium == "pro")
      ) {
        newAmount = currentAmount + amount;
        premuim_value = premium;
      }

      if (newAmount < 0) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      await connection.execute(
        "UPDATE User_Credits SET amount = ?, premium_status = ? WHERE user_id = ?",
        [newAmount, premuim_value, user_id]
      );

      res.json({ success: true, updatedAmount: newAmount });
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error executing database query:", error);
    res.status(500).json({ error: "Error processing the request" });
  } finally {
    connection.end();
  }
});

// Mount the router at the base path for your function
app.use(`/.netlify/functions/credit`, router);

// Export the app wrapped with serverless-http
module.exports = app;
module.exports.handler = serverless(app);
