const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET TEMPLATE CATEGORIES (Must be before /:id routes)
=========================
*/
router.get("/categories", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT category FROM templates WHERE category IS NOT NULL AND category != '' ORDER BY category"
        );
        res.json(rows.map(r => r.category));
    } catch (err) {
        console.error("Error fetching template categories:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET ALL TEMPLATES (with search & filter)
=========================
*/
router.get("/", async (req, res) => {
    const { search, category, status } = req.query;

    try {
        let query = "SELECT * FROM templates";
        let conditions = [];
        let params = [];

        if (search) {
            conditions.push("(template_name LIKE ? OR message LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            conditions.push("category = ?");
            params.push(category);
        }

        if (status) {
            conditions.push("status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id DESC";

        const [rows] = await db.query(query, params);
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
    const { template_name, category, message, variables, interest_name, status } = req.body;

    if (!template_name || !message) {
        return res.status(400).json({ error: "Template name and message are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO templates (template_name, category, message, variables, interest_name, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [template_name, category || 'General', message, variables || null, interest_name || null, status || 'Active']
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
    const { template_name, category, message, variables, interest_name, status } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE templates 
             SET template_name = ?, category = ?, message = ?, variables = ?, interest_name = ?, status = ?
             WHERE id = ?`,
            [template_name, category || 'General', message, variables || null, interest_name || null, status || 'Active', id]
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
DUPLICATE TEMPLATE
=========================
*/
router.post("/:id/duplicate", async (req, res) => {
    const { id } = req.params;

    try {
        const [template] = await db.query(
            "SELECT * FROM templates WHERE id = ?",
            [id]
        );

        if (template.length === 0) {
            return res.status(404).json({ error: "Template not found" });
        }

        const orig = template[0];
        const [result] = await db.query(
            `INSERT INTO templates (template_name, category, message, variables, interest_name, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [`${orig.template_name} (Copy)`, orig.category, orig.message, orig.variables, orig.interest_name, orig.status]
        );

        res.json({
            success: true,
            id: result.insertId,
            message: "Template duplicated successfully"
        });
    } catch (err) {
        console.error("Error duplicating template:", err);
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
