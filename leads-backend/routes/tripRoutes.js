const express = require("express");
const router = express.Router();
const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmc_leads',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET: All trips
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM trips ORDER BY start_date DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Single trip with bookings
router.get("/:id", async (req, res) => {
    try {
        const tripId = req.params.id;

        const [tripRows] = await pool.query(
            "SELECT * FROM trips WHERE id = ?",
            [tripId]
        );

        if (tripRows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        const [bookingRows] = await pool.query(
            "SELECT * FROM trip_bookings WHERE trip_id = ? ORDER BY created_at DESC",
            [tripId]
        );

        res.json({
            trip: tripRows[0],
            bookings: bookingRows,
        });
    } catch (error) {
        console.error("Error fetching trip details:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Create new trip
router.post("/", async (req, res) => {
    const { title, location, start_date, end_date, description } = req.body;

    if (!title || !location || !start_date || !end_date) {
        return res.status(400).json({
            error: "Missing required fields: title, location, start_date, end_date",
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO trips (title, location, start_date, end_date, description)
             VALUES (?, ?, ?, ?, ?)`,
            [title, location, start_date, end_date, description || null]
        );

        res.status(201).json({
            id: result.insertId,
            message: "Trip created successfully!",
        });
    } catch (error) {
        console.error("Error creating trip:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Add booking to trip
router.post("/:id/bookings", async (req, res) => {
    const tripId = req.params.id;
    const {
        customer_name,
        phone,
        seats,
        ticket_price,
        discount,
        advance,
        advance_received_by,
        notes,
    } = req.body;

    if (!customer_name || !phone || !seats || !ticket_price) {
        return res.status(400).json({
            error: "Missing required fields: customer_name, phone, seats, ticket_price",
        });
    }

    const totalCost = (seats * ticket_price) - (discount || 0);
    const balance = totalCost - (advance || 0);

    try {
        const [result] = await pool.query(
            `INSERT INTO trip_bookings 
             (trip_id, customer_name, phone, seats, ticket_price, discount, 
              total_cost, advance, balance, advance_received_by, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tripId,
                customer_name,
                phone,
                seats,
                ticket_price,
                discount || 0,
                totalCost,
                advance || 0,
                balance,
                advance_received_by || 'Rajeev',
                notes || null,
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: "Booking added successfully!",
            total_cost: totalCost,
            balance: balance,
        });
    } catch (error) {
        console.error("Error adding booking:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Delete a trip
router.delete("/:id", async (req, res) => {
    try {
        const tripId = req.params.id;

        await pool.query("DELETE FROM trip_bookings WHERE trip_id = ?", [tripId]);
        await pool.query("DELETE FROM trips WHERE id = ?", [tripId]);

        res.json({ message: "Trip deleted successfully!" });
    } catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
