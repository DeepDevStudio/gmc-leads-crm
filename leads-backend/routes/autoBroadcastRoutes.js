const express = require("express");
const router = express.Router();
const db = require("../config/db");
const WebSocket = require('ws');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 15;
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 250;

// ============================================
// GET ALL MEMBERS STATS
// ============================================
router.get("/members/stats", async (req, res) => {
    try {
        const members = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];
        const stats = [];
        
        for (const member of members) {
            const [todayRows] = await db.query(
                `SELECT COUNT(*) as today_sent 
                 FROM broadcast_logs 
                 WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'`,
                [member]
            );
            
            const todaySent = todayRows[0]?.today_sent || 0;
            const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 250;
            
            stats.push({
                memberName: member,
                todaySent,
                dailyLimit,
                remaining: Math.max(0, dailyLimit - todaySent)
            });
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting members stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET MEMBER STATS BY NAME
// ============================================
router.get("/member/:memberName/stats", async (req, res) => {
    const { memberName } = req.params;
    try {
        const [todayRows] = await db.query(
            `SELECT COUNT(*) as today_sent 
             FROM broadcast_logs 
             WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'`,
            [memberName]
        );
        
        const todaySent = todayRows[0]?.today_sent || 0;
        const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 250;
        
        res.json({
            memberName,
            todaySent,
            dailyLimit,
            remaining: Math.max(0, dailyLimit - todaySent)
        });
    } catch (error) {
        console.error('Error getting member stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET BROADCAST STATUS
// ============================================
router.get("/status/:broadcastId", async (req, res) => {
    const { broadcastId } = req.params;
    
    try {
        const [rows] = await db.query(
            "SELECT * FROM auto_broadcast_jobs WHERE broadcast_id = ?",
            [broadcastId]
        );
        
        if (rows.length > 0) {
            const job = rows[0];
            const progress = job.total_customers > 0 ? Math.round((job.sent_count / job.total_customers) * 100) : 0;
            
            // Get member distribution if available
            let members = [];
            try {
                const [memberStats] = await db.query(
                    `SELECT team_member as name, COUNT(*) as sent 
                     FROM broadcast_logs 
                     WHERE broadcast_id = ? AND status = 'Sent'
                     GROUP BY team_member`,
                    [broadcastId]
                );
                members = memberStats || [];
            } catch (e) {
                console.error('Error getting member stats:', e);
            }
            
            return res.json({
                status: job.status || 'running',
                totalCustomers: job.total_customers || 0,
                totalBatches: job.total_batches || 0,
                currentBatch: job.current_batch || 0,
                sentCount: job.sent_count || 0,
                failedCount: job.failed_count || 0,
                progress: progress,
                members: members,
                startTime: job.created_at,
                completedAt: job.completed_at
            });
        }
        
        res.json({
            status: 'completed',
            totalCustomers: 0,
            totalBatches: 0,
            currentBatch: 0,
            sentCount: 0,
            failedCount: 0,
            progress: 100,
            members: []
        });
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// START AUTO BROADCAST WITH QUEUE
// ============================================
router.post("/start-queue", async (req, res) => {
    const { memberId, memberName, filters, message, attachment, attachment_name, attachment_type, batchSize, pauseSeconds } = req.body;
    
    if (!memberId || !memberName || !filters || !message) {
        return res.status(400).json({ 
            error: "Missing required fields: memberId, memberName, filters, message" 
        });
    }

    try {
        let query = "SELECT * FROM customers WHERE 1=1 AND opted_out = 0";
        const params = [];

        if (filters.target_group && filters.target_group !== 'All' && filters.target_group !== '') {
            query += " AND group_type = ?";
            params.push(filters.target_group);
        }

        if (filters.target_interest && filters.target_interest !== '') {
            query += " AND interests LIKE ?";
            params.push(`%${filters.target_interest}%`);
        }

        if (filters.target_yatra && filters.target_yatra !== '' && filters.target_yatra !== 'All Yatras') {
            query += " AND interests LIKE ?";
            params.push(`%${filters.target_yatra}%`);
        }

        // Get today's sent count for this member
        const [todayRows] = await db.query(
            `SELECT COUNT(*) as today_sent 
             FROM broadcast_logs 
             WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'`,
            [memberName]
        );
        const todaySent = todayRows[0]?.today_sent || 0;
        const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 250;
        const remaining = Math.max(0, dailyLimit - todaySent);
        
        if (remaining <= 0) {
            return res.json({ 
                success: false, 
                message: `${memberName} has reached daily limit of ${dailyLimit} messages` 
            });
        }

        query += " LIMIT ?";
        params.push(Math.min(250, remaining));

        const [customers] = await db.query(query, params);
        
        if (customers.length === 0) {
            return res.json({ 
                success: false, 
                message: "No customers found matching the criteria" 
            });
        }

        const batchSize_ = parseInt(batchSize) || 15;
        const totalBatches = Math.ceil(customers.length / batchSize_);
        const broadcastId = `${memberId}_${Date.now()}`;

        // Create broadcast record in database
        await db.query(
            `INSERT INTO auto_broadcast_jobs 
             (broadcast_id, member_name, total_customers, total_batches, status, created_at) 
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [broadcastId, memberName, customers.length, totalBatches]
        );

        // Store customer IDs for processing
        const customerIds = customers.map(c => c.id);
        await db.query(
            `INSERT INTO auto_broadcast_customers (broadcast_id, customer_id, processed) 
             VALUES ${customerIds.map(() => '(?, ?, 0)').join(',')}`,
            [broadcastId, ...customerIds]
        );

        res.json({
            success: true,
            broadcastId,
            totalCustomers: customers.length,
            totalBatches,
            batchSize: batchSize_,
            pauseSeconds: parseInt(pauseSeconds) || 30,
            estimatedHours: Math.ceil((totalBatches * (parseInt(pauseSeconds) || 30)) / 3600)
        });
    } catch (error) {
        console.error('Error starting auto broadcast queue:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PROCESS BATCH
// ============================================
router.post("/process-batch/:broadcastId", async (req, res) => {
    const { broadcastId } = req.params;
    const { batchNumber, batchSize } = req.body;
    
    try {
        // Get broadcast job
        const [jobRows] = await db.query(
            "SELECT * FROM auto_broadcast_jobs WHERE broadcast_id = ?",
            [broadcastId]
        );
        
        if (jobRows.length === 0) {
            return res.status(404).json({ error: "Broadcast job not found" });
        }
        
        const job = jobRows[0];
        const memberName = job.member_name;
        const totalCustomers = job.total_customers;
        const start = (batchNumber - 1) * batchSize;
        const end = Math.min(start + batchSize, totalCustomers);
        
        // Get customers for this batch
        const [customers] = await db.query(
            `SELECT c.* FROM customers c
             JOIN auto_broadcast_customers abc ON c.id = abc.customer_id
             WHERE abc.broadcast_id = ? AND abc.processed = 0
             LIMIT ? OFFSET ?`,
            [broadcastId, end - start, start]
        );
        
        let sent = 0;
        let failed = 0;
        
        // Send each message
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
            return res.status(500).json({ 
                error: 'WebSocket service not available',
                details: err.message
            });
        }
        
        for (const customer of customers) {
            if (customer.mobile_number) {
                const formattedPhone = customer.mobile_number.startsWith('91') ? 
                    customer.mobile_number : 
                    '91' + customer.mobile_number.replace(/[^0-9]/g, '');
                
                try {
                    const result = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('Message send timeout')), 30000);
                        
                        ws.send(JSON.stringify({
                            type: 'send_message',
                            memberName: memberName,
                            phone: formattedPhone,
                            message: job.message || 'Default message'
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
                            "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts, broadcast_id) VALUES (?, ?, ?, 'Sent', 'Batch', ?)",
                            [memberName, customer.mobile_number, job.message || 'Default message', broadcastId]
                        );
                    } else {
                        failed++;
                        await db.query(
                            "INSERT INTO broadcast_logs (team_member, recipient, message, status, message_parts, broadcast_id) VALUES (?, ?, ?, 'Failed', 'Batch', ?)",
                            [memberName, customer.mobile_number, job.message || 'Default message', broadcastId]
                        );
                    }
                    
                    // Mark as processed
                    await db.query(
                        "UPDATE auto_broadcast_customers SET processed = 1 WHERE broadcast_id = ? AND customer_id = ?",
                        [broadcastId, customer.id]
                    );
                    
                } catch (err) {
                    failed++;
                    console.error(`Failed to send to ${customer.mobile_number}:`, err.message);
                    await db.query(
                        "UPDATE auto_broadcast_customers SET processed = 1, error = ? WHERE broadcast_id = ? AND customer_id = ?",
                        [err.message, broadcastId, customer.id]
                    );
                }
            }
        }
        
        if (ws) ws.close();
        
        // Update job progress
        await db.query(
            `UPDATE auto_broadcast_jobs 
             SET current_batch = ?, sent_count = sent_count + ?, failed_count = failed_count + ?, 
                 progress = (sent_count / total_customers) * 100, status = 'running'
             WHERE broadcast_id = ?`,
            [batchNumber, sent, failed, broadcastId]
        );
        
        // Check if complete
        const [updatedJob] = await db.query(
            "SELECT * FROM auto_broadcast_jobs WHERE broadcast_id = ?",
            [broadcastId]
        );
        
        const isComplete = updatedJob[0].current_batch >= updatedJob[0].total_batches;
        if (isComplete) {
            await db.query(
                "UPDATE auto_broadcast_jobs SET status = 'completed', completed_at = NOW() WHERE broadcast_id = ?",
                [broadcastId]
            );
        }
        
        res.json({
            success: true,
            broadcastId,
            batchNumber,
            sent,
            failed,
            total: customers.length,
            isComplete: isComplete
        });
        
    } catch (error) {
        console.error('Error processing batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PAUSE BROADCAST
// ============================================
router.post("/pause/:broadcastId", async (req, res) => {
    const { broadcastId } = req.params;
    try {
        await db.query(
            "UPDATE auto_broadcast_jobs SET status = 'paused' WHERE broadcast_id = ?",
            [broadcastId]
        );
        res.json({ success: true, message: "Broadcast paused" });
    } catch (error) {
        console.error('Error pausing broadcast:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// RESUME BROADCAST
// ============================================
router.post("/resume/:broadcastId", async (req, res) => {
    const { broadcastId } = req.params;
    try {
        await db.query(
            "UPDATE auto_broadcast_jobs SET status = 'running' WHERE broadcast_id = ?",
            [broadcastId]
        );
        res.json({ success: true, message: "Broadcast resumed" });
    } catch (error) {
        console.error('Error resuming broadcast:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// STOP BROADCAST
// ============================================
router.post("/stop/:broadcastId", async (req, res) => {
    const { broadcastId } = req.params;
    try {
        await db.query(
            "UPDATE auto_broadcast_jobs SET status = 'stopped' WHERE broadcast_id = ?",
            [broadcastId]
        );
        res.json({ success: true, message: "Broadcast stopped" });
    } catch (error) {
        console.error('Error stopping broadcast:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET ACTIVE BROADCASTS
// ============================================
router.get("/active", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM auto_broadcast_jobs WHERE status IN ('pending', 'running', 'paused') ORDER BY created_at DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error('Error getting active broadcasts:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
