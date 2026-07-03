const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET REPORT DATA
=========================
*/
router.get("/", async (req, res) => {
    try {
        // Total customers
        const [totalCustomers] = await db.query("SELECT COUNT(*) as total FROM customers");
        
        // Total yatras
        const [totalYatras] = await db.query("SELECT COUNT(*) as total FROM yatra_master");
        
        // Total bookings
        const [totalBookings] = await db.query("SELECT COUNT(*) as total FROM yatra_trip_customers");
        
        // Total revenue
        const [totalRevenue] = await db.query("SELECT SUM(total_amount) as total FROM yatra_trip_customers");
        
        // Recent activity
        const [recentActivity] = await db.query(
            "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 10"
        );

        res.json({
            totalCustomers: totalCustomers[0]?.total || 0,
            totalYatras: totalYatras[0]?.total || 0,
            totalBookings: totalBookings[0]?.total || 0,
            totalRevenue: totalRevenue[0]?.total || 0,
            recentActivity: recentActivity || []
        });
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMER REPORT
=========================
*/
router.get("/customers", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT group_type, COUNT(*) as count FROM customers GROUP BY group_type"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching customer report:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET YATRA REPORT
=========================
*/
router.get("/yatras", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ym.yatra_name, COUNT(ytc.id) as bookings, SUM(ytc.total_amount) as revenue
             FROM yatra_master ym
             LEFT JOIN yatra_trip_customers ytc ON ym.id = ytc.yatra_trip_id
             GROUP BY ym.id
             ORDER BY revenue DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching yatra report:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET INTEREST DISTRIBUTION
=========================
*/
router.get("/interest-distribution", async (req, res) => {
    try {
        // Get all interests
        const [interests] = await db.query("SELECT id, interest_name FROM interests ORDER BY interest_name");

        // Get customer counts per interest
        const results = [];
        let totalCustomersWithInterests = 0;

        for (const interest of interests) {
            const [count] = await db.query(
                `SELECT COUNT(*) as count FROM customers WHERE interests LIKE ?`,
                [`%${interest.interest_name}%`]
            );
            const countValue = count[0]?.count || 0;
            totalCustomersWithInterests += countValue;
            results.push({
                interest_name: interest.interest_name,
                count: countValue
            });
        }

        // Calculate percentages
        const finalResults = results.map(item => ({
            ...item,
            percentage: totalCustomersWithInterests > 0 
                ? Math.round((item.count / totalCustomersWithInterests) * 100) 
                : 0
        }));

        // Sort by count descending
        finalResults.sort((a, b) => b.count - a.count);

        res.json(finalResults);
    } catch (err) {
        console.error("Error fetching interest distribution:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET REVENUE STATS
=========================
*/
router.get("/revenue-stats", async (req, res) => {
    try {
        // Total revenue from yatra_trip_customers
        const [totalRevenue] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers");
        
        // Total bookings (customers in trips)
        const [totalBookings] = await db.query("SELECT COUNT(*) as total FROM yatra_trip_customers");
        
        // Total yatras
        const [totalYatras] = await db.query("SELECT COUNT(*) as total FROM yatra_master");
        
        // Total trips
        const [totalTrips] = await db.query("SELECT COUNT(*) as total FROM yatra_trips");

        res.json({
            totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
            totalBookings: totalBookings[0]?.total || 0,
            totalYatras: totalYatras[0]?.total || 0,
            totalTrips: totalTrips[0]?.total || 0
        });
    } catch (err) {
        console.error("Error fetching revenue stats:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
