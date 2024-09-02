const express = require("express");
const serverless = require("serverless-http");
const mysql = require('mysql2/promise');
const { format } = require('date-fns');
const { constructWebhookEvent } = require("./stripeLib"); 

const app = express();
const router = express.Router();
app.use(express.json());

router.post("/", async (req, res) => {
  const { invoice_id, provider_id, user_plan_id } = req.body;

  // Get the database connection details from environment variables
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  // Create a database connection
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
  });

  try {
    // Check if user plan invoice exists
    const [existingInvoices] = await connection.execute(
      'SELECT * FROM User_Plan_Invoice WHERE invoice_id = ? AND provider_id = ?',
      [invoice_id, provider_id]
    );

    if (existingInvoices.length > 0) {
      res.json(existingInvoices[0]);
      return;
    }

    // If no existing invoice, create a new one
    const [result] = await connection.execute(
      'INSERT INTO User_Plan_Invoice (invoice_id, provider_id, user_plan_id) VALUES (?, ?, ?)',
      [invoice_id, provider_id, user_plan_id]
    );

    const newInvoiceId = result.insertId;
    res.json({ id: newInvoiceId, invoice_id, provider_id, user_plan_id });

  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ error: 'Error processing the request', details: error });
  } finally {
    // Close the database connection
    connection.end();
  }
});

// Mount the router at the base path for your function
app.use(`/.netlify/functions/getUserPlanInvoice`, router);

// Export the app wrapped with serverless-http
module.exports = app;
module.exports.handler = serverless(app);