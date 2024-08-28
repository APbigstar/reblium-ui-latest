const express = require("express");
const mysql = require('mysql2/promise');
const serverless = require("serverless-http");

const app = express();
app.use(express.json()); // to parse JSON-encoded bodies

const router = express.Router();

router.post('/', async (req, res) => {
    const user_info_id = req.query.user_info_id;
    const imageData = req.body.image;

    if (!imageData) {
        return res.status(400).send("No image data provided.");
    }
    if (!user_info_id) {
        return res.status(400).send("User info ID is required.");
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
        });
        const query = 'INSERT INTO User_Logos (user_info_id, logo) VALUES (?, ?) ON DUPLICATE KEY UPDATE logo = VALUES(logo);';
        await connection.execute(query, [user_info_id, imageData]);

        res.send({ message: 'Logo uploaded successfully' });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).send('Server error');
    }
});

app.use(`/.netlify/functions/uploadLogo`, router);

module.exports = app;
module.exports.handler = serverless(app);
