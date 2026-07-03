const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET DASHBOARD STATS
=========================
*/
router.get("/stats", async (req, res) => {
    try {
        // Customer stats
        const [customers] = await db.query("SELECT COUNT(*) as total FROM customers");
        const [dailyReach] = await db.query("SELECT COUNT(*) as count FROM customers WHERE group_type = 'Daily Reach'");
        const [doNotReach] = await db.query("SELECT COUNT(*) as count FROM customers WHERE group_type = 'Do Not Reach'");
        const [unsubscribed] = await db.query("SELECT COUNT(*) as count FROM customers WHERE group_type = 'Unsubscribed'");

        // Template stats
        const [templates] = await db.query("SELECT COUNT(*) as total FROM templates");

        // Yatra stats
        const [yatras] = await db.query("SELECT COUNT(*) as total FROM yatra_master");

        // Booking stats
        const [bookings] = await db.query("SELECT COUNT(*) as total FROM yatra_trip_customers");

        // Message stats (from message_logs)
        const [messages] = await db.query("SELECT COUNT(*) as total FROM message_logs");

        // Activity stats
        const [activities] = await db.query("SELECT COUNT(*) as total FROM activity_logs");
        const [recentActivities] = await db.query("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 5");

        // Trip stats
        const [trips] = await db.query("SELECT COUNT(*) as total FROM yatra_trips");

        // Recent broadcasts (last 5)
        const [recentBroadcasts] = await db.query(
            "SELECT * FROM message_logs ORDER BY sent_at DESC LIMIT 5"
        );

        res.json({
            totalCustomers: customers[0]?.total || 0,
            dailyReach: dailyReach[0]?.count || 0,
            doNotReach: doNotReach[0]?.count || 0,
            unsubscribed: unsubscribed[0]?.count || 0,
            totalActivities: activities[0]?.total || 0,
            recentActivities: recentActivities || [],
            templates: templates[0]?.total || 0,
            totalYatras: yatras[0]?.total || 0,
            totalBookings: bookings[0]?.total || 0,
            messages: messages[0]?.total || 0,
            totalTrips: trips[0]?.total || 0,
            recentBroadcasts: recentBroadcasts || []
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET ACTIVITY LOGS
=========================
*/
router.get("/activities", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 20"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching activities:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET WEEKLY TREND
=========================
*/
router.get("/trend", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM activity_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching trend data:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
