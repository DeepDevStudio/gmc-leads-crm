const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL TEMPLATES
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM templates ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching templates:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE TEMPLATE
=========================
*/
router.post("/", async (req, res) => {
    const { template_name, interest_name, message, status } = req.body;

    if (!template_name || !message) {
        return res.status(400).json({ error: "Template name and message are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO templates (template_name, interest_name, message, status)
             VALUES (?, ?, ?, ?)`,
            [template_name, interest_name || null, message, status || 'Active']
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Template created successfully"
        });
    } catch (err) {
        console.error("Error creating template:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE TEMPLATE
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { template_name, interest_name, message, status } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE templates 
             SET template_name = ?, interest_name = ?, message = ?, status = ?
             WHERE id = ?`,
            [template_name, interest_name || null, message, status || 'Active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Template not found" });
        }

        res.json({
            success: true,
            message: "Template updated successfully"
        });
    } catch (err) {
        console.error("Error updating template:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE TEMPLATE
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM templates WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Template not found" });
        }

        res.json({
            success: true,
            message: "Template deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting template:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
