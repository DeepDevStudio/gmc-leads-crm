const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET CUSTOMER INTERESTS
=========================
*/
router.get("/:customerId", async (req, res) => {
    const { customerId } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT ci.*, i.interest_name
            FROM customer_interests ci
            LEFT JOIN interests i ON ci.interest_id = i.id
            WHERE ci.customer_id = ?
            ORDER BY i.interest_name
        `, [customerId]);

        res.json(rows);
    } catch (err) {
        console.error("Error fetching customer interests:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
ADD CUSTOMER INTEREST
=========================
*/
router.post("/", async (req, res) => {
    const { customer_id, interest_name } = req.body;

    if (!customer_id || !interest_name) {
        return res.status(400).json({ error: "Customer ID and interest name are required" });
    }

    try {
        // Check if interest exists
        let [interestRows] = await db.query(
            "SELECT id FROM interests WHERE interest_name = ?",
            [interest_name]
        );

        let interestId;
        if (interestRows.length === 0) {
            // Create interest if it doesn't exist
            const [result] = await db.query(
                "INSERT INTO interests (interest_name) VALUES (?)",
                [interest_name]
            );
            interestId = result.insertId;
        } else {
            interestId = interestRows[0].id;
        }

        // Check if already assigned
        const [existing] = await db.query(
            "SELECT id FROM customer_interests WHERE customer_id = ? AND interest_id = ?",
            [customer_id, interestId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Interest already assigned to customer" });
        }

        const [result] = await db.query(
            "INSERT INTO customer_interests (customer_id, interest_id) VALUES (?, ?)",
            [customer_id, interestId]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Interest added to customer successfully"
        });
    } catch (err) {
        console.error("Error adding customer interest:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
REMOVE CUSTOMER INTEREST
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM customer_interests WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Customer interest not found" });
        }

        res.json({
            success: true,
            message: "Interest removed from customer successfully"
        });
    } catch (err) {
        console.error("Error removing customer interest:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
