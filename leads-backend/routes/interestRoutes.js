const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL INTERESTS (with search, filter & pagination)
=========================
*/
router.get("/", async (req, res) => {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = "SELECT * FROM interests";
        let countQuery = "SELECT COUNT(*) as total FROM interests";
        let conditions = [];
        let params = [];

        // Search
        if (search) {
            conditions.push("interest_name LIKE ?");
            params.push(`%${search}%`);
        }

        // Category filter
        if (category) {
            conditions.push("category = ?");
            params.push(category);
        }

        // Status filter
        if (status === 'active') {
            conditions.push("is_active = 1");
        } else if (status === 'inactive') {
            conditions.push("is_active = 0");
        }

        if (conditions.length > 0) {
            const whereClause = " WHERE " + conditions.join(" AND ");
            query += whereClause;
            countQuery += whereClause;
        }

        query += " ORDER BY interest_name LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);

        const [rows] = await db.query(query, params);
        const [countResult] = await db.query(countQuery, params.slice(0, -2));

        res.json({
            data: rows,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error("Error fetching interests:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET INTEREST CATEGORIES
=========================
*/
router.get("/categories", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT category FROM interests WHERE category IS NOT NULL AND category != '' ORDER BY category"
        );
        res.json(rows.map(r => r.category));
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE INTEREST
=========================
*/
router.post("/", async (req, res) => {
    const { interest_name, category, description, is_active } = req.body;

    if (!interest_name) {
        return res.status(400).json({ error: "Interest name is required" });
    }

    try {
        // Check for duplicate
        const [existing] = await db.query(
            "SELECT id FROM interests WHERE interest_name = ?",
            [interest_name]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Interest already exists" });
        }

        const [result] = await db.query(`
            INSERT INTO interests (interest_name, category, description, is_active) 
            VALUES (?, ?, ?, ?)
        `, [
            interest_name, 
            category || null, 
            description || null, 
            is_active !== undefined ? is_active : 1
        ]);

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
    const { interest_name, category, description, is_active } = req.body;

    if (!interest_name) {
        return res.status(400).json({ error: "Interest name is required" });
    }

    try {
        // Check if interest exists
        const [existing] = await db.query(
            "SELECT id FROM interests WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: "Interest not found" });
        }

        // Check for duplicate name (excluding current)
        const [duplicate] = await db.query(
            "SELECT id FROM interests WHERE interest_name = ? AND id != ?",
            [interest_name, id]
        );

        if (duplicate.length > 0) {
            return res.status(400).json({ error: "Interest name already exists" });
        }

        let query = "UPDATE interests SET interest_name = ?, category = ?, description = ?";
        let params = [interest_name, category || null, description || null];

        if (is_active !== undefined) {
            query += ", is_active = ?";
            params.push(is_active);
        }

        query += " WHERE id = ?";
        params.push(id);

        const [result] = await db.query(query, params);

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
        // Check if interest exists
        const [existing] = await db.query(
            "SELECT id, interest_name FROM interests WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: "Interest not found" });
        }

        // Check if interest is used by any customer
        const [used] = await db.query(
            "SELECT COUNT(*) as count FROM customer_interests WHERE interest_id = ?",
            [id]
        );

        if (used[0].count > 0) {
            return res.status(400).json({ 
                error: `Cannot delete "${existing[0].interest_name}" because it is assigned to ${used[0].count} customer(s)` 
            });
        }

        const [result] = await db.query(
            "DELETE FROM interests WHERE id = ?",
            [id]
        );

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
