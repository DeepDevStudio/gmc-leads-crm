const express = require('express');
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

// Check if WhatsApp number exists
router.post('/check-number', async (req, res) => {
    const { whatsapp_number } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM whatsapp_sessions WHERE whatsapp_number = ?',
            [whatsapp_number]
        );
        if (rows.length > 0) {
            res.json({ 
                exists: true, 
                member_name: rows[0].member_name,
                whatsapp_number: rows[0].whatsapp_number
            });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking number:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save member name for WhatsApp number
router.post('/save-member', async (req, res) => {
    const { whatsapp_number, member_name, session_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO whatsapp_sessions (session_id, whatsapp_number, member_name, is_verified) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE member_name = ?, is_verified = 1',
            [session_id, whatsapp_number, member_name, member_name]
        );
        res.json({ success: true, message: 'Member saved successfully!' });
    } catch (error) {
        console.error('Error saving member:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all WhatsApp sessions
router.get('/sessions', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM whatsapp_sessions ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
