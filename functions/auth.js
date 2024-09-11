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
const path = require('path');

const app = express();
const router = express.Router();
app.use(express.json());
app.use(passport.initialize());

require("dotenv").config();

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

// Create a transporter using Mailtrap credentials
// let transporter = nodemailer.createTransport({
//   host: process.env.MAILTRAP_HOST,
//   port: process.env.MAILTRAP_PORT,
//   auth: {
//     user: process.env.MAILTRAP_USER,
//     pass: process.env.MAILTRAP_PASS,
//   },
// });

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Replace with your SMTP server
  port: process.env.SMTP_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER, // Replace with your email
    pass: process.env.SMTP_PASS, // Replace with your password
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
  },
});

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString("hex");

    const insertUserQuery =
      "INSERT INTO Users (name, email, password, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)";

    await connection.execute(insertUserQuery, [
      name,
      email,
      // hashedPassword,
      password,
      verificationToken,
      false,
    ]);

    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;

    let mailOptions = {
      from: '"Reblium Cloud" <noreply@reblium.com>',
      to: email,
      subject: "Verify Your Reblium Cloud Account",
      text: `Hello ${name}, please verify your email by clicking on this link: ${verificationLink}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email for Reblium Cloud</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <main>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://drive.google.com/file/d/1OpxTYLWNlsVT5BKuwJ7FmsNI0PoB04JN/view?usp=sharing/reblium_logo_black.png" alt="Reblium Logo" style="max-width: 100px;">
                    </div>
                    <h2 style="text-align: center;">Verify your email for Reblium Cloud</h2>
                    <p>Hello ${name},</p>
                    <p>Click below to verify your email address. If you didn't request this verification, you can ignore this email.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #00b8d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    </div>
                    <p>Thanks,<br>Reblium Assistant</p>
                </main>
                <footer style="text-align: center; margin-top: 30px; font-size: 0.9em;">
                    <p>We're here to help!</p>
                    <p>Visit our help center to learn more about our service and to leave feedback and suggestions.</p>
                </footer>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Signup successful. Please check your email for verification.",
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

router.post("/request-code", async (req, res) => {
  const { email, name } = req.body;

  let connection;
  try {
    connection = await getConnection();
    const [users] = await connection.execute(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const verificationCode = Math.floor(
      10000 + Math.random() * 90000
    ).toString();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute(
      "UPDATE Users SET verification_code = ?, verification_code_expires = ? WHERE email = ?",
      [verificationCode, expirationTime, email]
    );

    let mailOptions = {
      from: '"Reblium Cloud" <noreply@reblium.com>',
      to: email,
      subject: "Your Verification Code for Reblium Cloud",
      text: `Your verification code is: ${verificationCode}. This code will expire in 15 minutes.`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email for Reblium Cloud</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <main>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://drive.google.com/file/d/1OpxTYLWNlsVT5BKuwJ7FmsNI0PoB04JN/view?usp=sharing/reblium_logo_black.png" alt="Reblium Logo" style="max-width: 100px;">
                    </div>
                    <h2 style="text-align: center;">Confirm your code for Reblium Cloud</h2>
                    <p>Hello ${name},</p>
                    <p>Enter the code ${verificationCode} to confirm your email.</p>
                    <p><strong>This code will expire in 15 minutes.</strong></p>
                    <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
                    <p>Thanks,<br>Reblium Cloud Team</p>
                </main>
                <footer style="text-align: center; margin-top: 30px; font-size: 0.9em;">
                    <p>We're here to help!</p>
                    <p>Visit our help center to learn more about our service and to leave feedback and suggestions.</p>
                </footer>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({
      error: "Error sending verification code",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/verify", async (req, res) => {
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
      // query = "SELECT * FROM Users WHERE verification_code = ? AND verification_code_expires > NOW()";
      params = [code];
    } else {
      return res
        .status(400)
        .json({ error: "Verification token or code is required" });
    }

    const [users] = await connection.execute(query, params);

    if (users.length === 0) {
      if (code) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      } else {
        return res.status(400).json({ error: "Invalid verification token" });
      }
    }

    await connection.execute(
      "UPDATE Users SET is_verified = true, verification_token = NULL, verification_code = NULL WHERE id = ?",
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
    if (connection) connection.release();
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

    if (!user.is_verified) {
      return res
        .status(400)
        .json({ error: "Please verify your email before signing in" });
    }

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

    res.json({ message: "Sign-in successful", token, userId: user.id, email: user.email });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error.message });
  } finally {
    // Close the database connection
    connection.release();
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
      connection.release();
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
    connection.release();
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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      let conn;
      try {
        conn = await getConnection();
        const user = await socialLoginHandler(
          conn,
          {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0].value,
          },
          "google_id"
        );
        return cb(null, user);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        return cb(error);
      } finally {
        if (conn) conn.release();
      }
    }
  )
);

// // Facebook Strategy
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/facebook/callback`,
//       profileFields: ["id", "emails", "name", "picture.type(large)"],
//     },
//     async (accessToken, refreshToken, profile, cb) => {
//       let conn;
//       try {
//         conn = await getConnection();
//         const user = await socialLoginHandler(
//           conn,
//           {
//             id: profile.id,
//             email: profile.emails[0].value,
//             name: `${profile.name.givenName} ${profile.name.familyName}`,
//             picture: profile.photos[0].value,
//           },
//           "facebook_id"
//         );
//         return cb(null, user);
//       } catch (error) {
//         console.error("Error in Facebook Strategy:", error);
//         return cb(error);
//       } finally {
//         if (conn) conn.release();
//       }
//     }
//   )
// );

// // Apple Strategy
// passport.use(new AppleStrategy({
//   clientID: process.env.APPLE_CLIENT_ID,
//   teamID: process.env.APPLE_TEAM_ID,
//   callbackURL: `${process.env.BACKEND_URL}/.netlify/functions/auth/apple/callback`,
//   keyID: process.env.APPLE_KEY_ID,
//   privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
// }, async (req, accessToken, refreshToken, idToken, profile, cb) => {
//   let conn;
//   try {
//     conn = await getConnection();
//     const user = await socialLoginHandler(conn, {
//       id: idToken.sub,
//       email: idToken.email,
//       name: idToken.email.split('@')[0], // Apple doesn't provide name, using email username as fallback
//       picture: null // Apple doesn't provide profile picture
//     }, 'apple_id');
//     return cb(null, user);
//   } catch (error) {
//     console.error("Error in Apple Strategy:", error);
//     return cb(error);
//   } finally {
//     if (conn) conn.release();
//   }
// }));

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

// // Facebook login route
// router.get(
//   "/facebook",
//   passport.authenticate("facebook", { scope: ["email"] })
// );
// // Facebook callback route
// router.get(
//   "/facebook/callback",
//   passport.authenticate("facebook", { failureRedirect: "/login" }),
//   function (req, res) {
//     const token = jwt.sign(
//       { userId: req.user.id, email: req.user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
//   }
// );

// // Apple login route
// router.get("/apple", passport.authenticate("apple"));
// // Apple callback route
// router.get(
//   "/apple/callback",
//   passport.authenticate("apple", { failureRedirect: "/login" }),
//   function (req, res) {
//     const token = jwt.sign(
//       { userId: req.user.id, email: req.user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
//   }
// );

// Discord login route
router.get("/discord", passport.authenticate("discord"));

// Discord callback route
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
