const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL CAMPAIGNS (with search, filter & limit)
=========================
*/
router.get("/", async (req, res) => {
    const { search, status, limit } = req.query;

    try {
        let query = "SELECT * FROM campaigns";
        let conditions = [];
        let params = [];

        if (search) {
            conditions.push("(campaign_name LIKE ? OR message LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            conditions.push("status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id DESC";

        if (limit) {
            query += " LIMIT ?";
            params.push(parseInt(limit));
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching campaigns:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CAMPAIGN ANALYTICS
=========================
*/
router.get("/:id/analytics", async (req, res) => {
    const { id } = req.params;

    try {
        const [campaign] = await db.query(
            "SELECT * FROM campaigns WHERE id = ?",
            [id]
        );

        if (campaign.length === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const [analytics] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN responded_at IS NOT NULL THEN 1 ELSE 0 END) as responded,
                SUM(CASE WHEN converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted
             FROM campaign_analytics 
             WHERE campaign_id = ?`,
            [id]
        );

        res.json({
            campaign: campaign[0],
            analytics: analytics[0] || { total: 0, sent: 0, opened: 0, responded: 0, converted: 0 }
        });
    } catch (err) {
        console.error("Error fetching campaign analytics:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE CAMPAIGN
=========================
*/
router.post("/", async (req, res) => {
    const { 
        campaign_name, 
        message, 
        template_id, 
        target_interests, 
        target_groups, 
        status,
        scheduled_at 
    } = req.body;

    if (!campaign_name || !message) {
        return res.status(400).json({ error: "Campaign name and message are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO campaigns 
             (campaign_name, message, template_id, target_interests, target_groups, status, scheduled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                campaign_name, 
                message, 
                template_id || null, 
                target_interests || null, 
                target_groups || 'Daily Reach', 
                status || 'Draft',
                scheduled_at || null
            ]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Campaign created successfully"
        });
    } catch (err) {
        console.error("Error creating campaign:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE CAMPAIGN
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        campaign_name, 
        message, 
        template_id, 
        target_interests, 
        target_groups, 
        status,
        scheduled_at 
    } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE campaigns 
             SET campaign_name = ?, message = ?, template_id = ?, target_interests = ?, target_groups = ?, status = ?, scheduled_at = ?
             WHERE id = ?`,
            [
                campaign_name, 
                message, 
                template_id || null, 
                target_interests || null, 
                target_groups || 'Daily Reach', 
                status || 'Draft',
                scheduled_at || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.json({
            success: true,
            message: "Campaign updated successfully"
        });
    } catch (err) {
        console.error("Error updating campaign:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DUPLICATE CAMPAIGN
=========================
*/
router.post("/:id/duplicate", async (req, res) => {
    const { id } = req.params;

    try {
        const [campaign] = await db.query(
            "SELECT * FROM campaigns WHERE id = ?",
            [id]
        );

        if (campaign.length === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const orig = campaign[0];
        const [result] = await db.query(
            `INSERT INTO campaigns 
             (campaign_name, message, template_id, target_interests, target_groups, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                `${orig.campaign_name} (Copy)`,
                orig.message,
                orig.template_id,
                orig.target_interests,
                orig.target_groups,
                'Draft'
            ]
        );

        res.json({
            success: true,
            id: result.insertId,
            message: "Campaign duplicated successfully"
        });
    } catch (err) {
        console.error("Error duplicating campaign:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET AUDIENCE PREVIEW
=========================
*/
router.post("/:id/audience-preview", async (req, res) => {
    const { id } = req.params;

    try {
        const [campaign] = await db.query(
            "SELECT * FROM campaigns WHERE id = ?",
            [id]
        );

        if (campaign.length === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const campaignData = campaign[0];
        let query = `
            SELECT id, customer_name, mobile_number, interests, location_type 
            FROM customers 
            WHERE 1=1
        `;
        let params = [];

        if (campaignData.target_groups) {
            query += ` AND group_type = ?`;
            params.push(campaignData.target_groups);
        }

        if (campaignData.target_interests) {
            const interests = campaignData.target_interests.split(', ').filter(Boolean);
            const interestConditions = interests.map(() => `interests LIKE ?`).join(' OR ');
            query += ` AND (${interestConditions})`;
            interests.forEach(i => params.push(`%${i}%`));
        }

        const [recipients] = await db.query(query, params);

        res.json({
            total: recipients.length,
            preview: recipients.slice(0, 10)
        });
    } catch (err) {
        console.error("Error getting audience preview:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
SEND CAMPAIGN
=========================
*/
router.post("/:id/send", async (req, res) => {
    const { id } = req.params;

    try {
        const [campaign] = await db.query(
            "SELECT * FROM campaigns WHERE id = ?",
            [id]
        );

        if (campaign.length === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        const campaignData = campaign[0];
        let query = `
            SELECT id, customer_name, mobile_number 
            FROM customers 
            WHERE 1=1
        `;
        let params = [];

        if (campaignData.target_groups) {
            query += ` AND group_type = ?`;
            params.push(campaignData.target_groups);
        }

        if (campaignData.target_interests) {
            const interests = campaignData.target_interests.split(', ').filter(Boolean);
            const interestConditions = interests.map(() => `interests LIKE ?`).join(' OR ');
            query += ` AND (${interestConditions})`;
            interests.forEach(i => params.push(`%${i}%`));
        }

        const [recipients] = await db.query(query, params);

        // Insert into campaign_analytics
        if (recipients.length > 0) {
            const values = recipients.map(r => [id, r.id]);
            await db.query(
                `INSERT INTO campaign_analytics (campaign_id, customer_id) VALUES ?`,
                [values]
            );
        }

        await db.query(
            `UPDATE campaigns 
             SET total_recipients = ?, sent_count = ?, sent_at = NOW(), status = 'Sent'
             WHERE id = ?`,
            [recipients.length, recipients.length, id]
        );

        res.json({
            success: true,
            total_recipients: recipients.length,
            message: `Campaign sent to ${recipients.length} customers`
        });
    } catch (err) {
        console.error("Error sending campaign:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
========================= DELETE CAMPAIGN
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM campaigns WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.json({
            success: true,
            message: "Campaign deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting campaign:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
