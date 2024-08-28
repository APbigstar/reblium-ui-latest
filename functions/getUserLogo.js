const express = require("express");
const serverless = require("serverless-http");
const mysql = require('mysql2/promise');

const app = express();
const router = express.Router();
app.use(express.json());


router.get("/", async (req, res) => {
    const user_info_id = req.query.user_info_id;

    if (!user_info_id) {
        return res.status(400).send("User info ID is required.");
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        });

        const query = 'SELECT logo FROM User_Logos WHERE user_info_id = ?';
        const [rows] = await connection.execute(query, [user_info_id]);

        if (rows.length > 0) {
            const logo = rows[0].logo;
            res.send(logo);  // Send the Base64 string
        } else {
            res.status(404).send('Logo not found');
        }
    } catch (error) {
        console.error('Failed to retrieve logo:', error);
        res.status(500).send('Server error');
    }
});

app.use(`/.netlify/functions/getUserLogo`, router);

module.exports = app;
module.exports.handler = serverless(app);
