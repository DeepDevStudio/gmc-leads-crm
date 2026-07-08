const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ===== GET MESSAGE LOGS =====
router.get("/logs", async (req, res) => {
    const { limit = 50 } = req.query;
    try {
        const [rows] = await db.query(
            `SELECT * FROM broadcast_logs 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [parseInt(limit)]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching message logs:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== SEND SINGLE MESSAGE =====
router.post("/send", async (req, res) => {
    const { phone, message, team_member } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: "Phone and message are required" });
    }
    
    try {
        // Log the message
        await db.query(
            `INSERT INTO broadcast_logs 
             (team_member, recipient, message, status, message_parts) 
             VALUES (?, ?, ?, 'Sent', ?)`,
            [team_member || 'Manual', phone, message, 'Single']
        );
        
        res.json({ 
            success: true, 
            message: "Message logged successfully",
            recipient: phone
        });
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
