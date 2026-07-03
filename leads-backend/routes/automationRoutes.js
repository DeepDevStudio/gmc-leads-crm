const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL AUTOMATION RULES
=========================
*/
router.get("/rules", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ar.*, t.template_name 
            FROM automation_rules ar
            LEFT JOIN templates t ON ar.template_id = t.id
            ORDER BY ar.id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching rules:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE AUTOMATION RULE
=========================
*/
router.post("/rules", async (req, res) => {
    const { rule_name, trigger_type, target_group, target_interest, target_yatra, template_id, custom_message, status } = req.body;

    if (!rule_name) {
        return res.status(400).json({ error: "Rule name is required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO automation_rules 
             (rule_name, trigger_type, target_group, target_interest, target_yatra, template_id, custom_message, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rule_name, trigger_type, target_group, target_interest || null, target_yatra || null, template_id || null, custom_message || null, status || 'Active']
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Automation rule created successfully"
        });
    } catch (err) {
        console.error("Error creating rule:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE AUTOMATION RULE
=========================
*/
router.delete("/rules/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM automation_rules WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Rule not found" });
        }

        res.json({
            success: true,
            message: "Automation rule deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting rule:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
TOGGLE AUTOMATION RULE STATUS
=========================
*/
router.patch("/rules/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const [result] = await db.query(
            "UPDATE automation_rules SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Rule not found" });
        }

        res.json({
            success: true,
            message: `Rule ${status === 'Active' ? 'activated' : 'deactivated'} successfully`
        });
    } catch (err) {
        console.error("Error toggling rule status:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET AUTOMATION LOGS
=========================
*/
router.get("/logs", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT al.*, ar.rule_name, c.customer_name 
            FROM automation_logs al
            LEFT JOIN automation_rules ar ON al.rule_id = ar.id
            LEFT JOIN customers c ON al.customer_id = c.id
            ORDER BY al.id DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
RUN AUTOMATION
=========================
*/
router.post("/run", async (req, res) => {
    const { rule_id } = req.body;

    try {
        let ruleCondition = rule_id ? `AND id = ${rule_id}` : '';
        const [rules] = await db.query(
            `SELECT * FROM automation_rules WHERE status = 'Active' ${ruleCondition}`
        );

        if (rules.length === 0) {
            return res.json([]);
        }

        let allResults = [];

        for (const rule of rules) {
            let customerQuery = `
                SELECT c.* 
                FROM customers c
                WHERE 1=1
            `;

            if (rule.target_group) {
                customerQuery += ` AND c.group_type = '${rule.target_group}'`;
            }

            if (rule.target_interest) {
                customerQuery += ` AND c.interests LIKE '%${rule.target_interest}%'`;
            }

            if (rule.target_yatra) {
                customerQuery += `
                    AND c.id IN (
                        SELECT customer_id 
                        FROM yatra_trip_customers 
                        WHERE yatra_trip_id IN (
                            SELECT id FROM yatra_trips WHERE yatra_id IN (
                                SELECT id FROM yatra_master WHERE yatra_name = '${rule.target_yatra}'
                            )
                        )
                    )
                `;
            }

            const [customers] = await db.query(customerQuery);

            let template = null;
            if (rule.template_id) {
                const [templateRows] = await db.query(
                    "SELECT * FROM templates WHERE id = ?",
                    [rule.template_id]
                );
                template = templateRows.length > 0 ? templateRows[0] : null;
            }

            for (const customer of customers) {
                const result = {
                    customer_id: customer.id,
                    customer_name: customer.customer_name,
                    mobile_number: customer.mobile_number,
                    interest: rule.target_interest || customer.interests?.split(',')[0]?.trim() || 'All',
                    template_name: template ? template.template_name : 'Custom Message',
                    message: rule.custom_message || (template ? template.message : ''),
                    rule_id: rule.id,
                    rule_name: rule.rule_name
                };

                if (result.message) {
                    allResults.push(result);

                    await db.query(
                        `INSERT INTO automation_logs (rule_id, customer_id, template_id, message_sent)
                         VALUES (?, ?, ?, ?)`,
                        [rule.id, customer.id, rule.template_id || null, result.message]
                    );
                }
            }
        }

        res.json(allResults);
    } catch (err) {
        console.error("Error running automation:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
