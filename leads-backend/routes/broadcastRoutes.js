const express = require("express");
const router = express.Router();
const db = require("../config/db");
const WebSocket = require('ws');

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

// ===== ASSIGN NUMBER TO MEMBER =====
router.post("/assign-number", async (req, res) => {
    const { memberName, phoneNumber } = req.body;
    
    if (!memberName || !phoneNumber) {
        return res.status(400).json({ error: "Member name and phone number required" });
    }
    
    try {
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        const finalNumber = cleaned.length === 10 ? '91' + cleaned : cleaned;
        
        const ws = new WebSocket('ws://localhost:6001');
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
            ws.on('open', () => {
                clearTimeout(timeout);
                ws.send(JSON.stringify({
                    type: 'assign_number',
                    memberName: memberName,
                    phoneNumber: finalNumber
                }));
                resolve();
            });
            ws.on('error', reject);
        });
        
        ws.close();
        res.json({ 
            success: true, 
            message: `Number ${finalNumber} assigned to ${memberName}` 
        });
    } catch (err) {
        console.error('Error assigning number:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===== PREVIEW =====
router.post("/preview", async (req, res) => {
    const { target_group, interests, yatra } = req.body;
    
    try {
        let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
        const params = [];

        if (target_group && target_group !== 'All' && target_group !== '') {
            query += " AND group_type = ?";
            params.push(target_group);
        }

        if (interests && interests.length > 0) {
            const placeholders = interests.map(() => '?').join(',');
            query += ` AND interests IN (${placeholders})`;
            params.push(...interests);
        }

        if (yatra && yatra !== '' && yatra !== 'All Yatras') {
            query += " AND interests LIKE ?";
            params.push(`%${yatra}%`);
        }

        query += " LIMIT 1000";
        
        const [rows] = await db.query(query, params);
        res.json({ customers: rows, count: rows.length });
    } catch (err) {
        console.error("Error previewing broadcast:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== SEND =====
router.post("/send", async (req, res) => {
    const { target_group, interests, yatra, message, team_member, attachment, attachment_name, attachment_type, message_parts } = req.body;
    
    const memberName = team_member || 'Member 1';
    console.log(`📤 Sending via WebSocket for ${memberName}...`);
    if (attachment) {
        console.log(`📎 Attachment: ${attachment_name || 'unnamed'} (${attachment_type || 'unknown'})`);
    }
    
    try {
        let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
        const params = [];

        if (target_group && target_group !== 'All' && target_group !== '') {
            query += " AND group_type = ?";
            params.push(target_group);
        }

        if (interests && interests.length > 0) {
            const placeholders = interests.map(() => '?').join(',');
            query += ` AND interests IN (${placeholders})`;
            params.push(...interests);
        }

        if (yatra && yatra !== '' && yatra !== 'All Yatras') {
            query += " AND interests LIKE ?";
            params.push(`%${yatra}%`);
        }

        query += " LIMIT 250";
        
        const [customers] = await db.query(query, params);
        console.log(`📊 Found ${customers.length} customers`);
        
        if (customers.length === 0) {
            return res.json({ success: true, sent: 0, failed: 0, total: 0, message: "No customers found" });
        }
        
        let ws = null;
        try {
            ws = new WebSocket('ws://localhost:6001');
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                ws.on('open', () => {
                    clearTimeout(timeout);
                    console.log('✅ WebSocket connected');
                    resolve();
                });
                ws.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        } catch (err) {
            console.error('❌ WebSocket connection failed:', err.message);
            return res.status(500).json({ 
                error: 'WebSocket service not available. Please make sure WhatsApp WebSocket is running.',
                details: err.message
            });
        }
        
        let sent = 0;
        let failed = 0;
        const errors = [];

        for (const customer of customers) {
            if (customer.mobile_number) {
                const formattedPhone = formatPhoneNumber(customer.mobile_number);
                console.log(`📤 Sending to: ${customer.mobile_number} -> ${formattedPhone}`);
                
                try {
                    const result = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Message send timeout'));
                        }, 30000);
                        
                        ws.send(JSON.stringify({
                            type: 'send_message',
                            memberName: memberName,
                            phone: formattedPhone,
                            message: message,
                            attachment: attachment || null,
                            attachment_name: attachment_name || null,
                            attachment_type: attachment_type || null
                        }));
                        
                        ws.once('message', (data) => {
                            clearTimeout(timeout);
                            try {
                                const response = JSON.parse(data.toString());
                                console.log('📥 WebSocket response:', response);
                                const isSuccess = response.success === true || 
                                                response.status === 'success' || 
                                                response.sent === true ||
                                                (response.type === 'message_result' && response.success === true);
                                resolve({
                                    success: isSuccess,
                                    error: response.error || response.message || null,
                                    data: response
                                });
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                    
                    if (result && result.success === true) {
                        sent++;
                        console.log(`✅ Sent to ${formattedPhone} (${sent}/${customers.length})`);

                        try {
                            await db.query(
                                "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts) VALUES (?, ?, ?, 'Sent', ?)",
                                [memberName, customer.mobile_number, message, message_parts || 'Single']
                            );
                            console.log(`📝 Log saved for ${formattedPhone}`);
                        } catch (logErr) {
                            console.error(`❌ Failed to save log for ${formattedPhone}:`, logErr.message);
                        }
                    } else {
                        failed++;
                        const errorMsg = result?.error || 'Unknown error';
                        console.error(`❌ Failed to send to ${formattedPhone}:`, errorMsg);
                        errors.push({ 
                            customer: customer.customer_name, 
                            phone: customer.mobile_number, 
                            error: errorMsg 
                        });
                        
                        try {
                            await db.query(
                                "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts) VALUES (?, ?, ?, 'Failed', ?)",
                                [memberName, customer.mobile_number, message, message_parts || 'Single']
                            );
                        } catch (logErr) {
                            console.error(`❌ Failed to save failed log for ${formattedPhone}:`, logErr.message);
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (err) {
                    failed++;
                    console.error(`❌ Failed to send to ${formattedPhone}:`, err.message);
                    errors.push({ 
                        customer: customer.customer_name, 
                        phone: customer.mobile_number, 
                        error: err.message 
                    });
                    
                    try {
                        await db.query(
                            "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts) VALUES (?, ?, ?, 'Failed', ?)",
                            [memberName, customer.mobile_number, message, message_parts || 'Single']
                        );
                    } catch (logErr) {
                        console.error(`❌ Failed to save failed log for ${formattedPhone}:`, logErr.message);
                    }
                }
            }
        }

        if (ws) {
            ws.close();
        }
        
        console.log(`✅ Broadcast complete: ${sent} sent, ${failed} failed`);
        res.json({ 
            success: true, 
            sent, 
            failed, 
            total: customers.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error("❌ Error sending broadcast:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== RETRY FAILED MESSAGES =====
router.post("/retry", async (req, res) => {
    const { logs } = req.body;
    
    if (!logs || logs.length === 0) {
        return res.status(400).json({ error: "No logs to retry" });
    }
    
    try {
        let retried = 0;
        let failed = 0;
        
        for (const logId of logs) {
            try {
                const [rows] = await db.query(
                    "SELECT * FROM broadcast_logs WHERE id = ? AND status = 'Failed'",
                    [logId]
                );
                
                if (rows.length === 0) continue;
                
                const log = rows[0];
                const formattedPhone = formatPhoneNumber(log.recipient);
                
                let ws = null;
                try {
                    ws = new WebSocket('ws://localhost:6001');
                    
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                        ws.on('open', () => {
                            clearTimeout(timeout);
                            ws.send(JSON.stringify({
                                type: 'send_message',
                                memberName: log.team_member || 'Member 1',
                                phone: formattedPhone,
                                message: log.message
                            }));
                            resolve();
                        });
                        ws.on('error', reject);
                    });
                    
                    await db.query(
                        "UPDATE broadcast_logs SET status = 'Sent' WHERE id = ?",
                        [logId]
                    );
                    retried++;
                    
                    if (ws) ws.close();
                    
                } catch (err) {
                    console.error(`Failed to retry log ${logId}:`, err.message);
                    failed++;
                }
            } catch (err) {
                console.error(`Error retrying log ${logId}:`, err.message);
                failed++;
            }
        }
        
        res.json({ success: true, sent: retried, failed: failed });
    } catch (err) {
        console.error("Error in retry:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== AUTO SEND BALANCED (Load Balancing) =====
router.post("/auto-send-balanced", async (req, res) => {
    const { target_group, interests, yatra, message, attachment, attachment_name, attachment_type, members } = req.body;
    
    if (!members || members.length === 0) {
        return res.status(400).json({ error: "No members specified" });
    }
    
    try {
        let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
        const params = [];

        if (target_group && target_group !== 'All' && target_group !== '') {
            query += " AND group_type = ?";
            params.push(target_group);
        }

        if (interests && interests.length > 0) {
            const placeholders = interests.map(() => '?').join(',');
            query += ` AND interests IN (${placeholders})`;
            params.push(...interests);
        }

        if (yatra && yatra !== '' && yatra !== 'All Yatras') {
            query += " AND interests LIKE ?";
            params.push(`%${yatra}%`);
        }

        query += " LIMIT 1000";
        
        const [customers] = await db.query(query, params);
        console.log(`📊 Found ${customers.length} customers for balanced send`);
        
        if (customers.length === 0) {
            return res.json({ success: true, sent: 0, failed: 0, total: 0, message: "No customers found" });
        }
        
        const customersPerMember = Math.ceil(customers.length / members.length);
        const distribution = {};
        let sent = 0;
        let failed = 0;
        
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            const start = i * customersPerMember;
            const end = Math.min(start + customersPerMember, customers.length);
            const customerBatch = customers.slice(start, end);
            distribution[member] = customerBatch.length;
            
            if (customerBatch.length > 0) {
                try {
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
                        console.error(`❌ WebSocket connection failed for ${member}:`, err.message);
                        failed += customerBatch.length;
                        continue;
                    }
                    
                    let memberSent = 0;
                    let memberFailed = 0;
                    
                    for (const customer of customerBatch) {
                        if (customer.mobile_number) {
                            const formattedPhone = formatPhoneNumber(customer.mobile_number);
                            
                            try {
                                const result = await new Promise((resolve, reject) => {
                                    const timeout = setTimeout(() => reject(new Error('Message send timeout')), 30000);
                                    
                                    ws.send(JSON.stringify({
                                        type: 'send_message',
                                        memberName: member,
                                        phone: formattedPhone,
                                        message: message,
                                        attachment: attachment || null,
                                        attachment_name: attachment_name || null,
                                        attachment_type: attachment_type || null
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
                                    memberSent++;
                                    await db.query(
                                        "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts) VALUES (?, ?, ?, 'Sent', 'Balanced')",
                                        [member, customer.mobile_number, message]
                                    );
                                } else {
                                    memberFailed++;
                                    await db.query(
                                        "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts) VALUES (?, ?, ?, 'Failed', 'Balanced')",
                                        [member, customer.mobile_number, message]
                                    );
                                }
                            } catch (err) {
                                memberFailed++;
                                console.error(`Failed to send to ${formattedPhone}:`, err.message);
                            }
                        }
                    }
                    
                    sent += memberSent;
                    failed += memberFailed;
                    if (ws) ws.close();
                    
                    console.log(`✅ ${member}: ${memberSent} sent, ${memberFailed} failed (${customerBatch.length} customers)`);
                    
                } catch (err) {
                    console.error(`Error sending for ${member}:`, err.message);
                    failed += customerBatch.length;
                }
            }
        }
        
        res.json({ 
            success: true, 
            sent, 
            failed, 
            total: customers.length,
            distribution 
        });
    } catch (err) {
        console.error("Error in balanced auto-send:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== ANALYTICS =====
router.get("/analytics", async (req, res) => {
    try {
        const [dailyStats] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed
            FROM broadcast_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        const [memberPerformance] = await db.query(`
            SELECT 
                team_member,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
                ROUND(SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
            FROM broadcast_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY team_member
        `);
        
        const [statusDistribution] = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM broadcast_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY status
        `);
        
        const statusObj = { sent: 0, failed: 0, pending: 0 };
        statusDistribution.forEach(item => {
            if (item.status === 'Sent') statusObj.sent = item.count;
            else if (item.status === 'Failed') statusObj.failed = item.count;
            else statusObj.pending += item.count;
        });
        
        res.json({
            dailyStats,
            memberPerformance,
            statusDistribution: statusObj
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: err.message });
    }
});

// ===== AUTO-ASSIGN =====
router.post("/auto-assign", async (req, res) => {
    try {
        const [customers] = await db.query(
            "SELECT * FROM customers WHERE group_type = 'Daily Reach' AND opted_out = 0 LIMIT 1000"
        );
        res.json({ assigned: customers.length });
    } catch (err) {
        console.error("Error auto-assigning:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
