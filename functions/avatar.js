const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2/promise");

const app = express();
const router = express.Router();
app.use(express.json()); // Add this line to parse the request body as JSON

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

router.post("/addAvatar", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { avatarName, user_info_id } = req.body;

    // Perform the database query to add the avatar details to the Avatar table
    const addAvatarQuery =
      "INSERT INTO Avatar (Avatar_Name, User_Info_id) VALUES (?, ?)";
    const [result] = await connection.execute(addAvatarQuery, [
      avatarName,
      user_info_id,
    ]);
    // Get the inserted avatar_id
    const avatarId = result.insertId;

    // Send the inserted avatar_id in the response
    res.json({ message: "Avatar added successfully", saveavatar: avatarId });
  } catch (error) {
    console.error("Error executing database query:", error);
    res
      .status(500)
      .json({ error: "Error processing the request", details: error });
  } finally {
    // Close the database connection
    connection.end();
  }
});

router.post("/addPersonalizedAvatar", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { avatarName, user_info_id } = req.body; 

    // Perform the database query to add the avatar details to the Avatar table
    const addAvatarQuery = 'INSERT INTO PersonalizedAvatar (Avatar_Name, User_Info_id) VALUES (?, ?)';
    const [result] = await connection.execute(addAvatarQuery, [avatarName, user_info_id]);
    // Get the inserted avatar_id
    const avatarId = result.insertId;

    // Send the inserted avatar_id in the response
    res.json({ message: 'Avatar added successfully', saveavatar: avatarId });

  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ error: 'Error processing the request', details: error });
  } finally {
    // Close the database connection
    connection.end();
  }
});

router.delete("/deleteAvatar/:avatarId", async (req, res) => {
  const avatarId = req.params.avatarId;
  const { userId } = req.body;

  let connection;
  try {
    connection = await getConnection();
    // Perform the database query to delete the avatar with the given avatarId
    const deleteAvatarChatSettingQuery = 'DELETE FROM User_Chat_Setting WHERE avatar_id = ? AND user_id = ?';
    await connection.execute(deleteAvatarChatSettingQuery, [avatarId, userId]);

    const deleteAvatarQuery = 'DELETE FROM Avatar WHERE id = ?';
    await connection.execute(deleteAvatarQuery, [avatarId]);

    // If the deletion is successful, send a success message in the response
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ error: 'Error processing the request', details: error });
  } finally {
    // Close the database connection
    connection.end();
  }
});

router.get("/getUserAvatars", async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    // Get the user_info_id from the query parameters
    const { user_info_id } = req.query;
    const fetchAvatarsQuery = 'SELECT id, Avatar_Name, Avatar_Image, Avatar FROM Avatar WHERE User_Info_id = ?';
    const [rows] = await connection.execute(fetchAvatarsQuery, [user_info_id]);
    res.json(rows);
  } catch (error) {
    console.error('Error executing database query:', error);
    res.status(500).json({ error: 'Error processing the request' });
  } finally {
    connection.end();
  }
});

router.get('/getUserAvatar/:id', async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    const fetchAvatarQuery = 'SELECT * FROM Avatar WHERE id = ?';
    const [rows] = await connection.execute(fetchAvatarQuery, [id]);
    
    if (rows.length > 0) {
      res.json({ avatarData: rows[0] });
    } else {
      res.status(404).send('Avatar not found');
    }
  } catch (error) {
    console.error('Error retrieving avatar:', error);
    res.status(500).json({ error: 'Error processing the request', details: error });
  } finally {
    await connection.release();
  }
});


// Mount the router at the base path for your function
app.use(`/.netlify/functions/avatar`, router);

// Export the app wrapped with serverless-http
module.exports = app;
module.exports.handler = serverless(app);
