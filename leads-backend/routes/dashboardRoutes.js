const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ===== GET DASHBOARD STATS =====
router.get("/stats", async (req, res) => {
    try {
        const [totalCustomers] = await db.query("SELECT COUNT(*) as count FROM customers");
        const [dailyReach] = await db.query("SELECT COUNT(*) as count FROM customers WHERE group_type = 'Daily Reach'");
        const [doNotReach] = await db.query("SELECT COUNT(*) as count FROM customers WHERE group_type = 'Do Not Reach'");
        const [totalTrips] = await db.query("SELECT COUNT(*) as count FROM trips");
        const [totalYatras] = await db.query("SELECT COUNT(*) as count FROM yatra_master");
        const [recentActivity] = await db.query(
            "SELECT COUNT(*) as count FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );
        const [recentMessages] = await db.query(
            "SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 5"
        );
        
        res.json({
            totalCustomers: totalCustomers[0]?.count || 0,
            dailyReach: dailyReach[0]?.count || 0,
            doNotReach: doNotReach[0]?.count || 0,
            totalTrips: totalTrips[0]?.count || 0,
            totalYatras: totalYatras[0]?.count || 0,
            recentActivity: recentActivity[0]?.count || 0,
            recentMessages: recentMessages || []
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== GET DASHBOARD TREND =====
router.get("/trend", async (req, res) => {
    try {
        // Get bookings trend for last 7 days
        const [rows] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM yatra_bookings 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching dashboard trend:", err);
        // If table doesn't exist, return empty array
        res.json([]);
    }
});

// ===== GET CHART DATA =====
router.get("/chart", async (req, res) => {
    try {
        const [growth] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM customers 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        
        res.json({
            growth: growth || []
        });
    } catch (err) {
        console.error("Error fetching chart data:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
