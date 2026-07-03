const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL INTERESTS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM interests ORDER BY interest_name"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching interests:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE INTEREST
=========================
*/
router.post("/", async (req, res) => {
    const { interest_name } = req.body;

    if (!interest_name) {
        return res.status(400).json({ error: "Interest name is required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO interests (interest_name) VALUES (?)",
            [interest_name]
        );
        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Interest created successfully"
        });
    } catch (err) {
        console.error("Error creating interest:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE INTEREST
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { interest_name } = req.body;

    if (!interest_name) {
        return res.status(400).json({ error: "Interest name is required" });
    }

    try {
        const [result] = await db.query(
            "UPDATE interests SET interest_name = ? WHERE id = ?",
            [interest_name, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Interest not found" });
        }

        res.json({
            success: true,
            message: "Interest updated successfully"
        });
    } catch (err) {
        console.error("Error updating interest:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE INTEREST
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM interests WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Interest not found" });
        }

        res.json({
            success: true,
            message: "Interest deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting interest:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
