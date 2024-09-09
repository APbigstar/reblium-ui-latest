const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const router = express.Router();
app.use(express.json());
app.use(passport.initialize());

require("dotenv").config();
// // Set up SendGrid
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
  },
});

// Verify transporter
transporter.verify(function (error, success) {
  if (error) {
    console.log("Transporter verification error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const [existingUsers] = await connection.execute(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString("hex");
    const verificationCode = Math.floor(
      10000 + Math.random() * 90000
    ).toString();

    const insertUserQuery =
      "INSERT INTO Users (name, email, password, verification_token, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?)";

    await connection.execute(insertUserQuery, [
      name,
      email,
      //   hashedPassword,
      password,
      verificationToken,
      verificationCode,
      false,
    ]);

    // const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    // const msg = {
    //   to: email,
    //   from: {
    //     email: 'noreply@reblium.com',
    //     name: 'Reblium'
    //   },
    //   subject: "Verify Your Reblium Account",
    //   text: `Hello ${name}, please verify your email by clicking on this link: ${verificationUrl} or use this code: ${verificationCode}`,
    //   html: `
    //     <p>Hello ${name},</p>
    //     <p>Please verify your email by clicking on this link:
    //        <a href="${verificationUrl}">Verify Email</a>
    //     </p>
    //     <p>Or use this verification code: <strong>${verificationCode}</strong></p>
    //   `,
    // };

    // await sgMail.send(msg);

    // res.status(201).json({
    //   message:
    //     "User registered. Please check your email to verify your account.",
    // });
    res.status(201).json({
      message: "User registered. You can login",
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
  console.log("Verification Function");

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
      "UPDATE Users SET is_verified = true WHERE id = ?",
      [users[0].id]
    );

    res.json({
      message: "Email verified successfully. You can now log in.",
      success: true,
    });
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

  console.log(email, password);

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
      "SELECT * FROM Users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // if (!user.is_verified) {
    //   return res
    //     .status(400)
    //     .json({ error: "Please verify your email before signing in" });
    // }

    // Check password
    // const isMatch = await bcrypt.compare(password, user.password);

    // if (!isMatch) {
    //   return res.status(400).json({ error: "Invalid email or password" });
    // }

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

router.get("/validate-token", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  let connection;
  try {
    // Establish database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Query the database for the user
    const [users] = await connection.execute(
      "SELECT id, email FROM Users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Return user data (excluding sensitive information like password)
    res.json({
      id: user.id,
      email: user.email,
      // Add any other user fields you want to include
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401).json({ error: "Invalid token" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

router.get("/checkUserExists", async (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [user_id]
    );

    if (rows.length > 0) {
      res.json({
        exists: true,
      });
    } else {
      res.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error("Error executing database query:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    connection.end();
  }
});

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
        });

        const [users] = await connection.execute(
          "SELECT * FROM Users WHERE google_id = ?",
          [profile.id]
        );

        let user;
        if (users.length === 0) {
          // User doesn't exist, create a new user
          const [result] = await connection.execute(
            "INSERT INTO Users (google_id, email, name) VALUES (?, ?, ?)",
            [profile.id, profile.emails[0].value, profile.displayName]
          );
          user = {
            id: result.insertId,
            email: profile.emails[0].value,
            name: profile.displayName,
          };
        } else {
          user = users[0];
        }

        connection.end();
        return cb(null, user);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        return cb(error);
      }
    }
  )
);

// Google login route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback route
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Error in Google callback:", err);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`
      );
    }
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=user_not_found`
      );
    }
    try {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      // Redirect to frontend with the token
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      console.error("Error creating token:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=token_creation_failed`
      );
    }
  })(req, res, next);
});

app.use(`/.netlify/functions/auth`, router);

module.exports = app;
module.exports.handler = serverless(app);
