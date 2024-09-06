const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");

const app = express();
const router = express.Router();
app.use(express.json());

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    const [existingUsers] = await connection.execute(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString("hex");
    const verificationCode = Math.floor(
      10000 + Math.random() * 90000
    ).toString();

    const insertUserQuery =
      "INSERT INTO Users (name, email, password, verification_token, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?)";
    await connection.execute(insertUserQuery, [
      name,
      email,
      hashedPassword,
      verificationToken,
      verificationCode,
      false,
    ]);

    const msg = {
      to: email,
      from: "your-verified-sender@example.com",
      subject: "Verify Your Email",
      text: `Hello ${name}, please verify your email by clicking on this link: ${process.env.FRONTEND_URL}/verify?token=${verificationToken} or use this code: ${verificationCode}`,
      html: `<p>Hello ${name},</p><p>Please verify your email by clicking on this link: <a href="${process.env.FRONTEND_URL}/verify?token=${verificationToken}">Verify Email</a> or use this code: <strong>${verificationCode}</strong></p>`,
    };

    await sgMail.send(msg);

    res.status(201).json({
      message:
        "User registered. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error executing database query:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    connection.end();
  }
});

// Verification endpoint
router.post("/verify", async (req, res) => {
  const { token, code } = req.body;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    let query, params;
    if (token) {
      query = "SELECT * FROM Users WHERE verification_token = ?";
      params = [token];
    } else if (code) {
      query = "SELECT * FROM Users WHERE verification_code = ?";
      params = [code];
    } else {
      return res
        .status(400)
        .json({ error: "Verification token or code is required" });
    }

    const [users] = await connection.execute(query, params);

    if (users.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid verification token or code" });
    }

    await connection.execute(
      "UPDATE users SET is_verified = true, verification_token = NULL, verification_code = NULL WHERE id = ?",
      [users[0].id]
    );

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Error during verification:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    connection.end();
  }
});

// Sign-in route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set in the environment variables");
    return res.status(500).json({ error: "Internal server error" });
  }

  // Create a database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Find user with the given email
    const [users] = await connection.execute(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // Check if the user is verified
    if (!user.is_verified) {
      return res
        .status(400)
        .json({ error: "Please verify your email before signing in" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Create and sign a JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Sign-in successful", token });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    // Close the database connection
    connection.end();
  }
});

app.use(`/.netlify/functions/auth`, router);

module.exports = app;
module.exports.handler = serverless(app);
