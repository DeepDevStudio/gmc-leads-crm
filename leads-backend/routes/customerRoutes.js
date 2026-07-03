const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL CUSTOMERS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM customers ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMERS BY GROUP
=========================
*/
router.get("/group/:group", async (req, res) => {
    const { group } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE group_type = ? ORDER BY customer_name",
            [group]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching customers by group:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMER COUNT BY GROUP
=========================
*/
router.get("/count/group", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT group_type, COUNT(*) as count FROM customers GROUP BY group_type"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching group counts:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
BULK UPDATE CUSTOMER GROUP - MUST BE BEFORE /:id ROUTES!
=========================
*/
router.put("/bulk/group", async (req, res) => {
    const { ids, group_type } = req.body;

    if (!ids || ids.length === 0) {
        return res.status(400).json({ error: "No customer IDs provided" });
    }

    if (!group_type) {
        return res.status(400).json({ error: "Group type is required" });
    }

    try {
        const placeholders = ids.map(() => '?').join(',');
        const query = `UPDATE customers SET group_type = ? WHERE id IN (${placeholders})`;
        const params = [group_type, ...ids];

        const [result] = await db.query(query, params);

        res.json({
            success: true,
            updated: result.affectedRows,
            message: `${result.affectedRows} customers updated to "${group_type}"`
        });
    } catch (err) {
        console.error("Error bulk updating customer group:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMER BY ID
=========================
*/
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE CUSTOMER
=========================
*/
router.post("/", async (req, res) => {
    const { customer_name, mobile_number, interests, location_type, group_type } = req.body;

    if (!customer_name || !mobile_number) {
        return res.status(400).json({ error: "Customer name and mobile number are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO customers (customer_name, mobile_number, interests, location_type, group_type)
             VALUES (?, ?, ?, ?, ?)`,
            [customer_name, mobile_number, interests || null, location_type || null, group_type || 'Daily Reach']
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Customer created successfully"
        });
    } catch (err) {
        console.error("Error creating customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE CUSTOMER
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { customer_name, mobile_number, interests, location_type, group_type } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE customers 
             SET customer_name = ?, mobile_number = ?, interests = ?, location_type = ?, group_type = ?
             WHERE id = ?`,
            [customer_name, mobile_number, interests || null, location_type || null, group_type || 'Daily Reach', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
            success: true,
            message: "Customer updated successfully"
        });
    } catch (err) {
        console.error("Error updating customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE CUSTOMER GROUP
=========================
*/
router.put("/:id/group", async (req, res) => {
    const { id } = req.params;
    const { group_type } = req.body;

    if (!group_type) {
        return res.status(400).json({ error: "Group type is required" });
    }

    try {
        const [result] = await db.query(
            "UPDATE customers SET group_type = ? WHERE id = ?",
            [group_type, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
            success: true,
            message: "Customer group updated successfully"
        });
    } catch (err) {
        console.error("Error updating customer group:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE CUSTOMER
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM customers WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
SEARCH CUSTOMERS
=========================
*/
router.get("/search/:phone", async (req, res) => {
    const { phone } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM customers WHERE mobile_number LIKE ? LIMIT 1",
            [`%${phone}`]
        );

        if (rows.length === 0) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            customer: rows[0]
        });
    } catch (err) {
        console.error("Error searching customer:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
