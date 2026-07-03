const express = require("express");
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmc_leads',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET: Pickup locations by interest
router.get("/by-interest/:interestId", async (req, res) => {
    try {
        const interestId = req.params.interestId;
        const [rows] = await pool.query(
            "SELECT * FROM pickup_locations WHERE interest_id = ? OR interest_id IS NULL ORDER BY location_name",
            [interestId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching pickup locations:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Add new pickup location
router.post("/", async (req, res) => {
    const { location_name, interest_id } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO pickup_locations (location_name, interest_id) VALUES (?, ?)",
            [location_name, interest_id]
        );
        res.status(201).json({
            id: result.insertId,
            message: "Pickup location added successfully!"
        });
    } catch (error) {
        console.error("Error adding pickup location:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
