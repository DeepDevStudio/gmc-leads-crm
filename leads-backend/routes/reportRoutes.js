const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET REPORT DATA (with date filters)
=========================
*/
router.get("/", async (req, res) => {
    const { date_from, date_to } = req.query;

    try {
        let dateCondition = "";
        let params = [];

        if (date_from && date_to) {
            dateCondition = " AND created_at BETWEEN ? AND ?";
            params.push(date_from, date_to + " 23:59:59");
        } else if (date_from) {
            dateCondition = " AND created_at >= ?";
            params.push(date_from);
        } else if (date_to) {
            dateCondition = " AND created_at <= ?";
            params.push(date_to + " 23:59:59");
        }

        const [totalCustomers] = await db.query("SELECT COUNT(*) as total FROM customers");
        const [totalYatras] = await db.query("SELECT COUNT(*) as total FROM yatra_master");
        
        let bookingQuery = "SELECT COUNT(*) as total FROM yatra_trip_customers";
        if (dateCondition) {
            bookingQuery += " WHERE 1=1" + dateCondition;
        }
        const [totalBookings] = await db.query(bookingQuery, params);
        
        let revenueQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers";
        if (dateCondition) {
            revenueQuery += " WHERE 1=1" + dateCondition;
        }
        const [totalRevenue] = await db.query(revenueQuery, params);
        
        const [recentActivity] = await db.query(
            "SELECT * FROM activity_logs ORDER BY id DESC LIMIT 10"
        );

        res.json({
            totalCustomers: totalCustomers[0]?.total || 0,
            totalYatras: totalYatras[0]?.total || 0,
            totalBookings: totalBookings[0]?.total || 0,
            totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
            recentActivity: recentActivity || []
        });
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET EMPLOYEE ACTIVITY REPORT
=========================
*/
router.get("/employees", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                id,
                username,
                full_name,
                role,
                is_active,
                created_at,
                (SELECT COUNT(*) FROM activity_logs WHERE user_id = users.id) as activity_count,
                (SELECT MAX(created_at) FROM activity_logs WHERE user_id = users.id) as last_active
             FROM users 
             WHERE role IN ('team', 'employee') 
             ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching employee report:", err);
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
GET TEMPLATE USAGE STATS
=========================
*/
router.get("/template-stats", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                template_name,
                category,
                usage_count,
                status,
                created_at
             FROM templates 
             ORDER BY usage_count DESC 
             LIMIT 20`
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching template stats:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CAMPAIGN PERFORMANCE
=========================
*/
router.get("/campaign-performance", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                c.id,
                c.campaign_name,
                c.status,
                c.total_recipients,
                c.created_at
             FROM campaigns c
             WHERE c.status IN ('Sent', 'Completed')
             ORDER BY c.created_at DESC 
             LIMIT 20`
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching campaign performance:", err);
        res.json([]);
    }
});

/*
=========================
GET YATRA REPORT (Revenue by Yatra)
=========================
*/
router.get("/yatras", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                ym.yatra_name, 
                COUNT(ytc.id) as bookings, 
                COALESCE(SUM(ytc.total_amount), 0) as revenue,
                COALESCE(AVG(ytc.total_amount), 0) as avg_amount,
                MAX(ytc.total_amount) as max_amount,
                MIN(ytc.total_amount) as min_amount
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
        const [interests] = await db.query("SELECT id, interest_name FROM interests ORDER BY interest_name");

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

        const finalResults = results.map(item => ({
            ...item,
            percentage: totalCustomersWithInterests > 0 
                ? Math.round((item.count / totalCustomersWithInterests) * 100) 
                : 0
        }));

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
    const { date_from, date_to } = req.query;

    try {
        let dateCondition = "";
        let params = [];

        if (date_from && date_to) {
            dateCondition = " WHERE created_at BETWEEN ? AND ?";
            params.push(date_from, date_to + " 23:59:59");
        } else if (date_from) {
            dateCondition = " WHERE created_at >= ?";
            params.push(date_from);
        } else if (date_to) {
            dateCondition = " WHERE created_at <= ?";
            params.push(date_to + " 23:59:59");
        }

        let revenueQuery = "SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers" + dateCondition;
        let bookingQuery = "SELECT COUNT(*) as total FROM yatra_trip_customers" + dateCondition;
        
        const [totalRevenue] = await db.query(revenueQuery, params);
        const [totalBookings] = await db.query(bookingQuery, params);
        const [totalYatras] = await db.query("SELECT COUNT(*) as total FROM yatra_master");
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

/*
=========================
GET REVENUE SUMMARY (Today, Week, Month)
=========================
*/
router.get("/revenue-summary", async (req, res) => {
    try {
        const [today] = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers WHERE DATE(created_at) = CURDATE()"
        );
        
        const [week] = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers WHERE YEARWEEK(created_at) = YEARWEEK(NOW())"
        );
        
        const [month] = await db.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM yatra_trip_customers WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())"
        );

        res.json({
            today: parseFloat(today[0]?.total || 0),
            week: parseFloat(week[0]?.total || 0),
            month: parseFloat(month[0]?.total || 0)
        });
    } catch (err) {
        console.error("Error fetching revenue summary:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET DAILY ACTIVITY STATS
=========================
*/
router.get("/daily-activity", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COUNT(DISTINCT username) as unique_users
             FROM activity_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching daily activity:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMER GROWTH
=========================
*/
router.get("/customer-growth", async (req, res) => {
    const { months = 6 } = req.query;

    try {
        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as new_customers
             FROM customers
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`,
            [parseInt(months)]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching customer growth:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
