const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL ACTIVITIES
=========================
*/
router.get("/all", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM activity_logs ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching activities:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE ACTIVITY
=========================
*/
router.post("/create", async (req, res) => {
    const { user_id, username, activity } = req.body;

    if (!username || !activity) {
        return res.status(400).json({ error: "Username and activity are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO activity_logs (user_id, username, activity) VALUES (?, ?, ?)",
            [user_id || null, username, activity]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Activity created successfully"
        });
    } catch (err) {
        console.error("Error creating activity:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET ACTIVITIES BY USER
=========================
*/
router.get("/user/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM activity_logs WHERE username = ? ORDER BY id DESC LIMIT 50",
            [username]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching user activities:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
