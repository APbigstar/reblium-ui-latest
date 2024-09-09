const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const AppleStrategy = require("passport-apple").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;

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

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to get a connection from the pool
const getConnection = async () => {
  return await pool.getConnection();
};

const configureStrategy = (Strategy, options, verifyFunction) => {
  return new Strategy(
    options,
    async (accessToken, refreshToken, profile, cb) => {
      let conn;
      try {
        conn = await getConnection();
        const user = await verifyFunction(conn, profile);
        return cb(null, user);
      } catch (error) {
        console.error(`Error in ${Strategy.name}:`, error);
        return cb(error);
      } finally {
        if (conn) conn.release();
      }
    }
  );
};

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  let connection;
  try {
    connection = await getConnection();
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

  let connection;
  try {
    connection = await getConnection();
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

  let connection;
  try {
    connection = await getConnection();
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
    connection = await getConnection();

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

  let connection;
  try {
    connection = await getConnection();
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

// Helper function to handle social login logic
const socialLoginHandler = async (conn, profile, socialIdField) => {
  const [existingUsers] = await conn.execute(
    "SELECT * FROM Users WHERE email = ?",
    [profile.email]
  );

  let user;
  if (existingUsers.length > 0) {
    // User exists, update their social ID and other relevant info
    user = existingUsers[0];
    await conn.execute(
      `UPDATE Users SET ${socialIdField} = ?, name = ?, profile_picture = ?, is_verified = 1 WHERE id = ?`,
      [profile.id, profile.name, profile.picture, user.id]
    );
  } else {
    // User doesn't exist, create a new user
    const [result] = await conn.execute(
      `INSERT INTO Users (email, name, ${socialIdField}, profile_picture, is_verified) VALUES (?, ?, ?, ?, 1)`,
      [profile.email, profile.name, profile.id, profile.picture]
    );
    user = {
      id: result.insertId,
      email: profile.email,
      name: profile.name,
    };
  }

  return user;
};

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/google/callback`,
}, async (accessToken, refreshToken, profile, cb) => {
  let conn;
  try {
    conn = await getConnection();
    const user = await socialLoginHandler(conn, {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0].value
    }, 'google_id');
    return cb(null, user);
  } catch (error) {
    console.error("Error in Google Strategy:", error);
    return cb(error);
  } finally {
    if (conn) conn.release();
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, cb) => {
  let conn;
  try {
    conn = await getConnection();
    const user = await socialLoginHandler(conn, {
      id: profile.id,
      email: profile.emails[0].value,
      name: `${profile.name.givenName} ${profile.name.familyName}`,
      picture: profile.photos[0].value
    }, 'facebook_id');
    return cb(null, user);
  } catch (error) {
    console.error("Error in Facebook Strategy:", error);
    return cb(error);
  } finally {
    if (conn) conn.release();
  }
}));

// Apple Strategy
passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: process.env.APPLE_TEAM_ID,
  callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/apple/callback`,
  keyID: process.env.APPLE_KEY_ID,
  privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
}, async (req, accessToken, refreshToken, idToken, profile, cb) => {
  let conn;
  try {
    conn = await getConnection();
    const user = await socialLoginHandler(conn, {
      id: idToken.sub,
      email: idToken.email,
      name: idToken.email.split('@')[0], // Apple doesn't provide name, using email username as fallback
      picture: null // Apple doesn't provide profile picture
    }, 'apple_id');
    return cb(null, user);
  } catch (error) {
    console.error("Error in Apple Strategy:", error);
    return cb(error);
  } finally {
    if (conn) conn.release();
  }
}));

// Discord Strategy
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/discord/callback`,
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, cb) => {
  let conn;
  try {
    conn = await getConnection();
    const user = await socialLoginHandler(conn, {
      id: profile.id,
      email: profile.email,
      name: profile.username,
      picture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
    }, 'discord_id');
    return cb(null, user);
  } catch (error) {
    console.error("Error in Discord Strategy:", error);
    return cb(error);
  } finally {
    if (conn) conn.release();
  }
}));

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

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

router.get("/apple", passport.authenticate("apple"));

router.get(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login" }),
  function (req, res) {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

router.get("/discord", passport.authenticate("discord"));

router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/login" }),
  function (req, res) {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

app.use(`/.netlify/functions/auth`, router);

module.exports = app;
module.exports.handler = serverless(app);
