const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ACTIVITIES (for sidebar notifications)
=========================
*/
router.get("/", async (req, res) => {
    const { limit = 10 } = req.query;

    try {
        const [rows] = await db.query(
            `SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?`,
            [parseInt(limit)]
        );
        // Always return an array
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching activities:", err);
        res.json([]);
    }
});

/*
=========================
GET ALL ACTIVITIES (with filters)
=========================
*/
router.get("/all", async (req, res) => {
    const { search, user, type, date_from, date_to, limit = 50, offset = 0 } = req.query;

    try {
        let query = "SELECT * FROM activity_logs";
        let conditions = [];
        let params = [];

        if (search) {
            conditions.push("(username LIKE ? OR activity LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        if (user) {
            conditions.push("username = ?");
            params.push(user);
        }

        if (type) {
            conditions.push("activity LIKE ?");
            params.push(`%${type}%`);
        }

        if (date_from) {
            conditions.push("created_at >= ?");
            params.push(date_from);
        }

        if (date_to) {
            conditions.push("created_at <= ?");
            params.push(date_to + " 23:59:59");
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(query, params);

        let countQuery = "SELECT COUNT(*) as total FROM activity_logs";
        if (conditions.length > 0) {
            countQuery += " WHERE " + conditions.join(" AND ");
        }
        const [countResult] = await db.query(countQuery, params.slice(0, -2));

        res.json({
            data: rows || [],
            pagination: {
                total: countResult[0]?.total || 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (err) {
        console.error("Error fetching activities:", err);
        res.json({ data: [], pagination: { total: 0, limit: 0, offset: 0 } });
    }
});

/*
=========================
GET LAST LOGIN FOR USER
=========================
*/
router.get("/user/:userId/last", async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT * FROM activity_logs 
             WHERE user_id = ? AND (activity LIKE 'Logged%' OR activity LIKE 'Login%') 
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ created_at: null, message: "First time login" });
        }
    } catch (err) {
        console.error("Error fetching last login:", err);
        res.json({ created_at: null, message: "Not available" });
    }
});

/*
=========================
GET ACTIVITY TYPES
=========================
*/
router.get("/types", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT DISTINCT 
                SUBSTRING_INDEX(activity, ' ', 1) as type,
                COUNT(*) as count
             FROM activity_logs
             GROUP BY type
             ORDER BY count DESC`
        );
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching activity types:", err);
        res.json([]);
    }
});

/*
=========================
CREATE ACTIVITY
=========================
*/
router.post("/create", async (req, res) => {
    const { user_id, username, activity } = req.body;

    if (!username || !activity) {
        return res.status(400).json({ error: "Username and activity are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO activity_logs (user_id, username, activity) VALUES (?, ?, ?)",
            [user_id || null, username, activity]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Activity created successfully"
        });
    } catch (err) {
        console.error("Error creating activity:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET ACTIVITIES BY USER
=========================
*/
router.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const [rows] = await db.query(
            "SELECT * FROM activity_logs WHERE username = ? ORDER BY id DESC LIMIT ? OFFSET ?",
            [username, parseInt(limit), parseInt(offset)]
        );
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching user activities:", err);
        res.json([]);
    }
});

/*
=========================
GET ACTIVITY STATS
=========================
*/
router.get("/stats", async (req, res) => {
    try {
        const [total] = await db.query("SELECT COUNT(*) as total FROM activity_logs");
        
        const [byUser] = await db.query(
            "SELECT username, COUNT(*) as count FROM activity_logs GROUP BY username ORDER BY count DESC LIMIT 10"
        );
        
        const [today] = await db.query(
            "SELECT COUNT(*) as today FROM activity_logs WHERE DATE(created_at) = CURDATE()"
        );
        
        const [week] = await db.query(
            "SELECT COUNT(*) as week FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );

        const [month] = await db.query(
            "SELECT COUNT(*) as month FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );

        const [common] = await db.query(
            "SELECT activity, COUNT(*) as count FROM activity_logs GROUP BY activity ORDER BY count DESC LIMIT 10"
        );

        res.json({
            total: total[0]?.total || 0,
            today: today[0]?.today || 0,
            week: week[0]?.week || 0,
            month: month[0]?.month || 0,
            byUser: byUser || [],
            commonActivities: common || []
        });
    } catch (err) {
        console.error("Error fetching activity stats:", err);
        res.json({
            total: 0,
            today: 0,
            week: 0,
            month: 0,
            byUser: [],
            commonActivities: []
        });
    }
});

/*
========================= MARK ACTIVITY AS READ
=========================
*/
router.patch("/:id/read", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE activity_logs SET read = 1 WHERE id = ?",
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error marking activity as read:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
