const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all preset messages
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM preset_messages ORDER BY id"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching preset messages:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create preset message
router.post("/", async (req, res) => {
    const { name, message } = req.body;
    
    if (!name || !message) {
        return res.status(400).json({ error: "Name and message are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO preset_messages (name, message) VALUES (?, ?)",
            [name, message]
        );
        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Preset message created successfully"
        });
    } catch (err) {
        console.error("Error creating preset message:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update preset message
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, message } = req.body;

    try {
        await db.query(
            "UPDATE preset_messages SET name = ?, message = ? WHERE id = ?",
            [name, message, id]
        );
        res.json({
            success: true,
            message: "Preset message updated successfully"
        });
    } catch (err) {
        console.error("Error updating preset message:", err);
        res.status(500).json({ error: err.message });
    }
});

// Delete preset message
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "DELETE FROM preset_messages WHERE id = ?",
            [id]
        );
        res.json({
            success: true,
            message: "Preset message deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting preset message:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
