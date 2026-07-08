const express = require("express");
const router = express.Router();
const db = require("../config/db");
const cron = require('node-cron');
const WebSocket = require('ws');

// ============================================
// HELPERS
// ============================================
function formatPhoneNumber(number) {
    if (!number) return number;
    let cleaned = number.replace(/[^0-9]/g, '');
    if (!cleaned) return number;
    if (cleaned.length === 10) return '91' + cleaned;
    if (cleaned.startsWith('0') && cleaned.length === 11) return '91' + cleaned.substring(1);
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 11) return cleaned;
    if (cleaned.length >= 10 && !cleaned.startsWith('91')) return '91' + cleaned;
    return cleaned;
}

function personalizeMessage(message, customer) {
    if (!message) return message;
    return message
        .replace(/{name}/g, customer.customer_name || 'Customer')
        .replace(/{phone}/g, customer.mobile_number || '')
        .replace(/{interest}/g, customer.interests || 'All')
        .replace(/{location}/g, customer.location_type || 'Delhi NCR')
        .replace(/{yatra}/g, customer.interests || 'Yatra');
}

// ============================================
// GET ALL RULES
// ============================================
router.get("/rules", async (req, res) => {
    const { category, status } = req.query;
    try {
        let query = `
            SELECT ar.*, t.template_name, t.message as template_content
            FROM automation_rules ar
            LEFT JOIN templates t ON ar.template_id = t.id
            WHERE 1=1
        `;
        let params = [];

        if (category && category !== 'all') {
            query += " AND ar.category = ?";
            params.push(category);
        }

        if (status && status !== 'all') {
            query += " AND ar.status = ?";
            params.push(status);
        }

        query += " ORDER BY ar.id DESC";

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching rules:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// GET RULE BY ID
// ============================================
router.get("/rules/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT ar.*, t.template_name, t.message as template_content
             FROM automation_rules ar
             LEFT JOIN templates t ON ar.template_id = t.id
             WHERE ar.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Rule not found" });
        }

        const [exclusions] = await db.query(
            "SELECT customer_id FROM rule_exclusions WHERE rule_id = ?",
            [id]
        );

        res.json({
            ...rows[0],
            exclusions: exclusions.map(e => e.customer_id)
        });
    } catch (err) {
        console.error("Error fetching rule:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// CREATE RULE
// ============================================
router.post("/rules", async (req, res) => {
    const {
        rule_name,
        category,
        trigger_type,
        schedule_time,
        schedule_cron,
        delay_days,
        target_group,
        target_interest,
        target_yatra,
        template_id,
        custom_message,
        status,
        exclusions,
        auto_start,
        batch_size,
        pause_minutes,
        member_name,
        rest_minutes,
        extra_rest_after,
        extra_rest_minutes,
        daily_limit,
        distribution_type,
        send_strategy,
        members
    } = req.body;

    if (!rule_name) {
        return res.status(400).json({ error: "Rule name is required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO automation_rules (
                rule_name, category, trigger_type, schedule_time, schedule_cron, delay_days,
                target_group, target_interest, target_yatra, template_id,
                custom_message, status, auto_start, batch_size, pause_minutes, member_name,
                rest_minutes, extra_rest_after, extra_rest_minutes, daily_limit,
                distribution_type, send_strategy, members
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                rule_name,
                category || 'general',
                trigger_type || 'manual',
                schedule_time || null,
                schedule_cron || null,
                delay_days || 0,
                target_group || 'Daily Reach',
                target_interest || null,
                target_yatra || null,
                template_id || null,
                custom_message || null,
                status || 'Active',
                auto_start || 0,
                parseInt(batch_size) || 5,
                parseInt(pause_minutes) || 60,
                member_name || 'All Members',
                parseInt(rest_minutes) || 60,
                parseInt(extra_rest_after) || 10,
                parseInt(extra_rest_minutes) || 30,
                parseInt(daily_limit) || 250,
                distribution_type || 'balanced',
                send_strategy || 'round_robin',
                members || 'Member 1,Member 2,Member 3,Member 4'
            ]
        );

        const ruleId = result.insertId;

        if (exclusions && exclusions.length > 0) {
            for (const customerId of exclusions) {
                await db.query(
                    "INSERT INTO rule_exclusions (rule_id, customer_id) VALUES (?, ?)",
                    [ruleId, customerId]
                );
            }
        }

        if (auto_start && schedule_cron) {
            scheduleRule(ruleId, schedule_cron);
        }

        res.status(201).json({
            success: true,
            id: ruleId,
            message: "Rule created successfully"
        });
    } catch (err) {
        console.error("Error creating rule:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// UPDATE RULE
// ============================================
router.put("/rules/:id", async (req, res) => {
    const { id } = req.params;
    const {
        rule_name,
        category,
        trigger_type,
        schedule_time,
        schedule_cron,
        delay_days,
        target_group,
        target_interest,
        target_yatra,
        template_id,
        custom_message,
        status,
        exclusions,
        auto_start,
        batch_size,
        pause_minutes,
        member_name,
        rest_minutes,
        extra_rest_after,
        extra_rest_minutes,
        daily_limit,
        distribution_type,
        send_strategy,
        members
    } = req.body;

    if (!rule_name) {
        return res.status(400).json({ error: "Rule name is required" });
    }

    try {
        await db.query(
            `UPDATE automation_rules SET
                rule_name = ?,
                category = ?,
                trigger_type = ?,
                schedule_time = ?,
                schedule_cron = ?,
                delay_days = ?,
                target_group = ?,
                target_interest = ?,
                target_yatra = ?,
                template_id = ?,
                custom_message = ?,
                status = ?,
                auto_start = ?,
                batch_size = ?,
                pause_minutes = ?,
                member_name = ?,
                rest_minutes = ?,
                extra_rest_after = ?,
                extra_rest_minutes = ?,
                daily_limit = ?,
                distribution_type = ?,
                send_strategy = ?,
                members = ?
            WHERE id = ?`,
            [
                rule_name,
                category || 'general',
                trigger_type || 'manual',
                schedule_time || null,
                schedule_cron || null,
                delay_days || 0,
                target_group || 'Daily Reach',
                target_interest || null,
                target_yatra || null,
                template_id || null,
                custom_message || null,
                status || 'Active',
                auto_start || 0,
                parseInt(batch_size) || 5,
                parseInt(pause_minutes) || 60,
                member_name || 'All Members',
                parseInt(rest_minutes) || 60,
                parseInt(extra_rest_after) || 10,
                parseInt(extra_rest_minutes) || 30,
                parseInt(daily_limit) || 250,
                distribution_type || 'balanced',
                send_strategy || 'round_robin',
                members || 'Member 1,Member 2,Member 3,Member 4',
                id
            ]
        );

        await db.query("DELETE FROM rule_exclusions WHERE rule_id = ?", [id]);
        if (exclusions && exclusions.length > 0) {
            for (const customerId of exclusions) {
                await db.query(
                    "INSERT INTO rule_exclusions (rule_id, customer_id) VALUES (?, ?)",
                    [id, customerId]
                );
            }
        }

        if (auto_start && schedule_cron) {
            unscheduleRule(id);
            scheduleRule(id, schedule_cron);
        } else {
            unscheduleRule(id);
        }

        res.json({
            success: true,
            message: "Rule updated successfully"
        });
    } catch (err) {
        console.error("Error updating rule:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// DELETE RULE
// ============================================
router.delete("/rules/:id", async (req, res) => {
    const { id } = req.params;
    try {
        unscheduleRule(id);
        await db.query("DELETE FROM rule_exclusions WHERE rule_id = ?", [id]);
        await db.query("DELETE FROM automation_rules WHERE id = ?", [id]);
        
        res.json({
            success: true,
            message: "Rule deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting rule:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// EXECUTE RULE
// ============================================
router.post("/rules/:id/execute", async (req, res) => {
    const { id } = req.params;
    const { memberName } = req.body;
    
    try {
        const [rows] = await db.query(
            `SELECT ar.*, t.message as template_content 
             FROM automation_rules ar
             LEFT JOIN templates t ON ar.template_id = t.id
             WHERE ar.id = ? AND ar.status = 'Active'`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Active rule not found" });
        }

        const rule = rows[0];
        const result = await executeRule(rule, memberName || rule.member_name || 'Member 1');
        
        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error("Error executing rule:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// EXECUTE RULE FUNCTION
// ============================================
async function executeRule(rule, memberName) {
    console.log(`🔄 Executing rule: ${rule.rule_name} (${rule.id}) by ${memberName}`);
    
    try {
        let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
        const params = [];

        if (rule.target_group && rule.target_group !== 'All' && rule.target_group !== '') {
            query += " AND group_type = ?";
            params.push(rule.target_group);
        }

        if (rule.target_interest) {
            query += " AND interests LIKE ?";
            params.push(`%${rule.target_interest}%`);
        }

        if (rule.target_yatra) {
            query += " AND interests LIKE ?";
            params.push(`%${rule.target_yatra}%`);
        }

        const [exclusions] = await db.query(
            "SELECT customer_id FROM rule_exclusions WHERE rule_id = ?",
            [rule.id]
        );
        const exclusionIds = exclusions.map(e => e.customer_id);
        
        if (exclusionIds.length > 0) {
            query += ` AND id NOT IN (${exclusionIds.map(() => '?').join(',')})`;
            params.push(...exclusionIds);
        }

        query += " LIMIT ?";
        params.push(rule.batch_size || 15);

        const [customers] = await db.query(query, params);

        if (customers.length === 0) {
            await logExecution(rule.id, 0, 'No customers found', 'completed');
            return { success: true, sent: 0, failed: 0, message: "No customers found" };
        }

        let message = rule.custom_message;
        if (rule.template_id) {
            const [template] = await db.query(
                "SELECT message as template_content FROM templates WHERE id = ?",
                [rule.template_id]
            );
            if (template.length > 0 && template[0].template_content) {
                message = template[0].template_content;
            }
        }

        if (!message) {
            await logExecution(rule.id, 0, 'No message content', 'failed');
            return { success: false, error: "No message content found" };
        }

        let sent = 0;
        let failed = 0;
        const errors = [];

        let ws = null;
        try {
            ws = new WebSocket('ws://localhost:6001');
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                ws.on('open', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                ws.on('error', reject);
            });
        } catch (err) {
            console.error('❌ WebSocket connection failed:', err.message);
            await logExecution(rule.id, 0, `WebSocket error: ${err.message}`, 'failed');
            return { success: false, sent: 0, failed: customers.length, error: err.message };
        }

        for (const customer of customers) {
            if (customer.mobile_number) {
                const formattedPhone = formatPhoneNumber(customer.mobile_number);
                const personalizedMessage = personalizeMessage(message, customer);
                
                try {
                    const result = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('Message send timeout')), 30000);
                        
                        ws.send(JSON.stringify({
                            type: 'send_message',
                            memberName: memberName || 'Member 1',
                            phone: formattedPhone,
                            message: personalizedMessage
                        }));
                        
                        ws.once('message', (data) => {
                            clearTimeout(timeout);
                            try {
                                const response = JSON.parse(data.toString());
                                resolve({
                                    success: response.success === true || 
                                            response.status === 'success' || 
                                            response.sent === true
                                });
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                    
                    if (result.success) {
                        sent++;
                        await db.query(
                            "INSERT INTO automation_logs (rule_id, customer_id, message_sent, sent_count, status, sent_at) VALUES (?, ?, ?, ?, 'Sent', NOW())",
                            [rule.id, customer.id, personalizedMessage, 1]
                        );
                    } else {
                        failed++;
                        await db.query(
                            "INSERT INTO automation_logs (rule_id, customer_id, message_sent, sent_count, status, error_message, sent_at) VALUES (?, ?, ?, ?, 'Failed', ?, NOW())",
                            [rule.id, customer.id, personalizedMessage, 0, 'Send failed']
                        );
                        errors.push({ customer: customer.customer_name, phone: customer.mobile_number });
                    }
                } catch (err) {
                    failed++;
                    await db.query(
                        "INSERT INTO automation_logs (rule_id, customer_id, message_sent, sent_count, status, error_message, sent_at) VALUES (?, ?, ?, ?, 'Failed', ?, NOW())",
                        [rule.id, customer.id, personalizedMessage, 0, err.message]
                    );
                    errors.push({ customer: customer.customer_name, phone: customer.mobile_number, error: err.message });
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (ws) ws.close();

        const status = sent > 0 && failed === 0 ? 'completed' : (sent > 0 ? 'partial' : 'failed');
        await logExecution(rule.id, sent + failed, `Sent: ${sent}, Failed: ${failed}`, status);

        console.log(`✅ Rule ${rule.rule_name} executed: ${sent} sent, ${failed} failed`);
        
        return { 
            success: true, 
            sent, 
            failed, 
            total: customers.length,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error) {
        console.error('Error executing rule:', error);
        await logExecution(rule.id, 0, `Error: ${error.message}`, 'failed');
        return { success: false, error: error.message };
    }
}

// ============================================
// LOG EXECUTION
// ============================================
async function logExecution(ruleId, sentCount, message, status) {
    try {
        await db.query(
            `INSERT INTO automation_logs (rule_id, sent_count, message_sent, status, executed_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [ruleId, sentCount, message || 'Execution completed', status || 'completed']
        );
    } catch (err) {
        console.error('Error logging execution:', err);
    }
}

// ============================================
// SCHEDULER
// ============================================
const scheduledJobs = new Map();

function scheduleRule(ruleId, cronExpression) {
    if (!cronExpression) return;
    try {
        unscheduleRule(ruleId);
        const job = cron.schedule(cronExpression, async () => {
            console.log(`⏰ Running scheduled rule ${ruleId}`);
            try {
                const [rows] = await db.query(
                    `SELECT * FROM automation_rules WHERE id = ? AND status = 'Active'`,
                    [ruleId]
                );
                if (rows.length > 0) {
                    const customers = await getCustomersForRule(rows[0]);
                    if (customers.length > 0) {
                        await executeRule(rows[0], rows[0].member_name || 'Member 1');
                    }
                }
            } catch (err) {
                console.error(`Error executing scheduled rule ${ruleId}:`, err);
            }
        });
        scheduledJobs.set(ruleId, job);
    } catch (err) {
        console.error(`Error scheduling rule ${ruleId}:`, err);
    }
}

function unscheduleRule(ruleId) {
    if (scheduledJobs.has(ruleId)) {
        const job = scheduledJobs.get(ruleId);
        job.stop();
        scheduledJobs.delete(ruleId);
    }
}

// ============================================
// GET CUSTOMERS FOR RULE
// ============================================
async function getCustomersForRule(rule) {
    let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
    const params = [];

    if (rule.target_group && rule.target_group !== 'All' && rule.target_group !== '') {
        query += " AND group_type = ?";
        params.push(rule.target_group);
    }

    if (rule.target_interest) {
        query += " AND interests LIKE ?";
        params.push(`%${rule.target_interest}%`);
    }

    if (rule.target_yatra) {
        query += " AND interests LIKE ?";
        params.push(`%${rule.target_yatra}%`);
    }

    const [exclusions] = await db.query(
        "SELECT customer_id FROM rule_exclusions WHERE rule_id = ?",
        [rule.id]
    );
    const exclusionIds = exclusions.map(e => e.customer_id);
    
    if (exclusionIds.length > 0) {
        query += ` AND id NOT IN (${exclusionIds.map(() => '?').join(',')})`;
        params.push(...exclusionIds);
    }

    const [rows] = await db.query(query, params);
    return rows;
}

// ============================================
// GET LOGS
// ============================================
router.get("/logs", async (req, res) => {
    const { rule_id, limit = 50 } = req.query;
    try {
        let query = `
            SELECT al.*, ar.rule_name 
            FROM automation_logs al
            LEFT JOIN automation_rules ar ON al.rule_id = ar.id
            WHERE 1=1
        `;
        const params = [];

        if (rule_id) {
            query += " AND al.rule_id = ?";
            params.push(rule_id);
        }

        query += " ORDER BY al.executed_at DESC LIMIT ?";
        params.push(parseInt(limit));

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// GET STATS
// ============================================
router.get("/stats", async (req, res) => {
    try {
        const [totalRules] = await db.query("SELECT COUNT(*) as count FROM automation_rules");
        const [activeRules] = await db.query("SELECT COUNT(*) as count FROM automation_rules WHERE status = 'Active'");
        const [totalExecutions] = await db.query("SELECT COUNT(*) as count FROM automation_logs");
        const [totalSent] = await db.query("SELECT SUM(sent_count) as total FROM automation_logs");
        
        const [performance] = await db.query(`
            SELECT 
                ar.rule_name,
                COUNT(al.id) as executions,
                SUM(al.sent_count) as total_sent,
                SUM(CASE WHEN al.status = 'completed' THEN 1 ELSE 0 END) as successful
            FROM automation_logs al
            JOIN automation_rules ar ON al.rule_id = ar.id
            WHERE al.executed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY al.rule_id
            ORDER BY total_sent DESC
            LIMIT 5
        `);

        res.json({
            totalRules: totalRules[0]?.count || 0,
            activeRules: activeRules[0]?.count || 0,
            totalExecutions: totalExecutions[0]?.count || 0,
            totalSent: totalSent[0]?.total || 0,
            performance: performance || []
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// INITIALIZE SCHEDULED RULES
// ============================================
async function initScheduledRules() {
    try {
        const [rows] = await db.query(
            "SELECT * FROM automation_rules WHERE status = 'Active' AND auto_start = 1 AND schedule_cron IS NOT NULL"
        );
        for (const rule of rows) {
            scheduleRule(rule.id, rule.schedule_cron);
        }
        console.log(`⏰ Initialized ${rows.length} scheduled rules`);
    } catch (err) {
        console.error("Error initializing scheduled rules:", err);
    }
}

setTimeout(initScheduledRules, 5000);

module.exports = router;
