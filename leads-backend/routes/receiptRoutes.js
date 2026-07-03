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

// Generate receipt number
const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `RCP-${year}${month}${day}-${random}`;
};

// Generate receipt for booking
router.post("/generate/:bookingId", async (req, res) => {
    const bookingId = req.params.bookingId;
    const { 
        customer_name, 
        phone, 
        yatra_name, 
        seats, 
        rate_per_seat,
        total_amount,
        discount,
        advance_amount,
        balance_amount,
        payment_mode,
        received_by
    } = req.body;

    const receiptNumber = generateReceiptNumber();

    try {
        // Check if receipt already exists
        const [existing] = await pool.query(
            "SELECT * FROM receipts WHERE booking_id = ?",
            [bookingId]
        );

        if (existing.length > 0) {
            return res.json(existing[0]);
        }

        // Insert receipt
        const [result] = await pool.query(
            `INSERT INTO receipts 
            (booking_id, receipt_number, customer_name, phone, yatra_name, 
             seats, rate_per_seat, total_amount, discount, advance_amount, 
             balance_amount, payment_mode, received_by, receipt_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                bookingId,
                receiptNumber,
                customer_name,
                phone,
                yatra_name,
                seats,
                rate_per_seat,
                total_amount,
                discount || 0,
                advance_amount,
                balance_amount,
                payment_mode || 'Cash',
                received_by || 'GMC'
            ]
        );

        // Update booking with receipt info
        await pool.query(
            "UPDATE yatra_bookings SET receipt_number = ?, receipt_generated = 1, receipt_date = NOW(), payment_mode = ? WHERE id = ?",
            [receiptNumber, payment_mode || 'Cash', bookingId]
        );

        const [newReceipt] = await pool.query(
            "SELECT * FROM receipts WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json(newReceipt[0]);
    } catch (error) {
        console.error("Error generating receipt:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get receipt by booking ID
router.get("/booking/:bookingId", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM receipts WHERE booking_id = ?",
            [req.params.bookingId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching receipt:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get receipt by ID
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM receipts WHERE id = ?",
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Receipt not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching receipt:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all receipts
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM receipts ORDER BY created_at DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching receipts:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
