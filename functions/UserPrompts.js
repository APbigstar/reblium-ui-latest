const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");

const app = express();
const router = express.Router();
app.use(express.json());

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Helper function to get a connection from the pool
const getConnection = async () => {
  return await pool.getConnection();
};

router.get("/getUserPrompts", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const { user_id, avatar_id } = req.query;

    if (!user_id || !avatar_id) {
      return res.json({ success: false });
    }

    // Perform the database query to add the avatar details to the Avatar table
    const getUserPromptQuery =
      "SELECT * FROM User_Chat_Setting WHERE user_id = ? AND avatar_id = ?";
    const [result] = await connection.execute(getUserPromptQuery, [
      user_id,
      avatar_id,
    ]);

    if (result.length > 0) {
      res.json({ success: true, data: result[0] });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error executing database query:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error });
  } finally {
    connection.release();
  }
});

router.post("/insertUserPrompts", async (req, res) => {
  const { user_id, prompts, avatar_id, welcomeMessage } = req.body;

  let connection;
  try {

    if (!user_id || !avatar_id) {
      return res.status(200).json({
        success: false,
        message: "Failed to save prompts",
      });
    }

    connection = await getConnection();
    const [existingUsers] = await connection.execute(
      "SELECT * FROM User_Chat_Setting WHERE user_id = ? AND avatar_id = ?",
      [user_id, avatar_id]
    );

    if (existingUsers.length > 0) {
      await connection.execute(
        `UPDATE User_Chat_Setting SET prompts = ?, welcome_message = ? WHERE user_id = ? AND avatar_id = ?`,
        [prompts, welcomeMessage, user_id, avatar_id]
      );
    } else {
      await connection.execute(
        `INSERT INTO User_Chat_Setting (user_id, prompts, welcome_message, avatar_id, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [user_id, prompts, welcomeMessage, avatar_id]
      );
    }

    res.status(200).json({
      success: true,
      message: "Saved your chat settings successfully",
    });
  } catch (error) {
    console.error("Error executing database query:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.use(`/.netlify/functions/UserPrompts`, router);

module.exports = app;
module.exports.handler = serverless(app);
