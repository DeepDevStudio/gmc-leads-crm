const express = require("express");
const router = express.Router();
const db = require("../config/db");
const whatsappCloud = require("../services/whatsappCloudService");

/*
=========================
PREVIEW BROADCAST RECIPIENTS
=========================
*/
router.post("/preview", async (req, res) => {
    const { interests, group, yatra } = req.body;

    if ((!interests || interests.length === 0) && !yatra) {
        return res.json({ count: 0, customers: [] });
    }

    let conditions = [];
    let query = `
        SELECT id, customer_name, mobile_number, interests, group_type
        FROM customers
        WHERE 1=1
    `;

    if (interests && interests.length > 0) {
        const interestConditions = interests.map(i => {
            return `interests LIKE '%${i.replace(/'/g, "''")}%'`;
        }).join(' OR ');
        conditions.push(`(${interestConditions})`);
    }

    if (yatra) {
        conditions.push(`
            id IN (
                SELECT customer_id 
                FROM yatra_trip_customers 
                WHERE yatra_trip_id IN (
                    SELECT id FROM yatra_trips WHERE yatra_id IN (
                        SELECT id FROM yatra_master WHERE yatra_name = '${yatra.replace(/'/g, "''")}'
                    )
                )
            )
        `);
    }

    if (group) {
        conditions.push(`group_type = '${group}'`);
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY customer_name`;

    try {
        const [rows] = await db.query(query);
        res.json({
            count: rows.length,
            customers: rows
        });
    } catch (err) {
        console.error("Error in preview:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
SEND BROADCAST (WhatsApp Cloud API)
=========================
*/
router.post("/send", async (req, res) => {
    const { interests, yatra, group, message, template_id, team_member } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    let conditions = [];
    let query = `
        SELECT id, customer_name, mobile_number, interests, group_type
        FROM customers
        WHERE 1=1
    `;

    if (interests && interests.length > 0) {
        const interestConditions = interests.map(i => {
            return `interests LIKE '%${i.replace(/'/g, "''")}%'`;
        }).join(' OR ');
        conditions.push(`(${interestConditions})`);
    }

    if (yatra) {
        conditions.push(`
            id IN (
                SELECT customer_id 
                FROM yatra_trip_customers 
                WHERE yatra_trip_id IN (
                    SELECT id FROM yatra_trips WHERE yatra_id IN (
                        SELECT id FROM yatra_master WHERE yatra_name = '${yatra.replace(/'/g, "''")}'
                    )
                )
            )
        `);
    }

    if (group) {
        conditions.push(`group_type = '${group}'`);
    }

    if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
    }

    try {
        const [customers] = await db.query(query);

        if (customers.length === 0) {
            return res.json({ total: 0, sent: 0, failed: 0, message: "No customers found" });
        }

        const sender = team_member || 'system';

        const result = await whatsappCloud.sendBulkMessages(
            customers,
            message,
            (progress) => {
                console.log(`Progress: ${progress.sent}/${progress.total} sent`);
            }
        );

        // Log each message
        for (const customer of customers) {
            const status = result.errors.some(e => e.phone === customer.mobile_number) ? 'Failed' : 'Sent';
            await db.query(
                `INSERT INTO message_logs (customer_id, mobile_number, message, status, team_member) 
                 VALUES (?, ?, ?, ?, ?)`,
                [customer.id, customer.mobile_number, message, status, sender]
            );
        }

        res.json({
            total: result.total,
            sent: result.sent,
            failed: result.failed,
            errors: result.errors,
            team_member: sender
        });
    } catch (err) {
        console.error("Error in send:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
SEND BATCH (For Team Members)
=========================
*/
router.post("/send-batch", async (req, res) => {
    const { customers, message, team_member } = req.body;

    if (!customers || customers.length === 0) {
        return res.status(400).json({ error: "No customers provided" });
    }

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    const sender = team_member || 'system';

    try {
        const result = await whatsappCloud.sendBulkMessages(
            customers,
            message,
            (progress) => {
                console.log(`${sender}: ${progress.sent}/${progress.total} sent`);
            }
        );

        // Log each message
        for (const customer of customers) {
            const status = result.errors.some(e => e.phone === customer.mobile_number) ? 'Failed' : 'Sent';
            await db.query(
                `INSERT INTO message_logs (customer_id, mobile_number, message, status, team_member) 
                 VALUES (?, ?, ?, ?, ?)`,
                [customer.id, customer.mobile_number, message, status, sender]
            );
        }

        res.json({
            sent: result.sent,
            failed: result.failed,
            total: result.total,
            errors: result.errors,
            team_member: sender
        });
    } catch (err) {
        console.error("Error in send-batch:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET BROADCAST LOGS
=========================
*/
router.get("/logs", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ml.*, c.customer_name 
            FROM message_logs ml
            LEFT JOIN customers c ON ml.customer_id = c.id
            ORDER BY ml.sent_at DESC 
            LIMIT 50
        `);
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET TEAM STATS
=========================
*/
router.get("/team-stats", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                team_member,
                COUNT(*) as total_sent,
                SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
                MAX(sent_at) as last_sent
            FROM message_logs
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY team_member
            ORDER BY total_sent DESC
        `);
        res.json(rows || []);
    } catch (err) {
        console.error("Error fetching team stats:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
