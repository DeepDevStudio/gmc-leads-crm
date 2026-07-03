const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL CAMPAIGNS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM campaigns ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching campaigns:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE CAMPAIGN
=========================
*/
router.post("/", async (req, res) => {
    const { campaign_name, message, template_id, target_interests, target_groups, status } = req.body;

    if (!campaign_name || !message) {
        return res.status(400).json({ error: "Campaign name and message are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO campaigns 
             (campaign_name, message, template_id, target_interests, target_groups, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [campaign_name, message, template_id || null, target_interests || null, target_groups || 'Daily Reach', status || 'Draft']
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
    const { campaign_name, message, template_id, target_interests, target_groups, status } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE campaigns 
             SET campaign_name = ?, message = ?, template_id = ?, target_interests = ?, target_groups = ?, status = ?
             WHERE id = ?`,
            [campaign_name, message, template_id || null, target_interests || null, target_groups || 'Daily Reach', status || 'Draft', id]
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
DELETE CAMPAIGN
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

        // Get recipients based on target_groups and target_interests
        let query = `
            SELECT id, customer_name, mobile_number 
            FROM customers 
            WHERE 1=1
        `;

        if (campaignData.target_groups) {
            query += ` AND group_type = '${campaignData.target_groups}'`;
        }

        if (campaignData.target_interests) {
            const interests = campaignData.target_interests.split(',').map(i => i.trim());
            const interestConditions = interests.map(i => {
                return `interests LIKE '%${i.replace(/'/g, "''")}%'`;
            }).join(' OR ');
            query += ` AND (${interestConditions})`;
        }

        const [recipients] = await db.query(query);

        // Update campaign with recipient count and sent time
        await db.query(
            `UPDATE campaigns 
             SET total_recipients = ?, sent_at = NOW(), status = 'Sent'
             WHERE id = ?`,
            [recipients.length, id]
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

module.exports = router;
