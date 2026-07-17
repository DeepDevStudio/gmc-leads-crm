const express = require('express');
const router = express.Router();

// Get notifications
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            notifications: [],
            unreadCount: 0
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get last login
router.get('/last-login', async (req, res) => {
    try {
        res.json({
            success: true,
            lastLogin: new Date().toISOString(),
            message: 'Last login fetched successfully'
        });
    } catch (err) {
        console.error('Error fetching last login:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
