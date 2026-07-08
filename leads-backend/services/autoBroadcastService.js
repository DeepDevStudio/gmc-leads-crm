const db = require("../config/db");
const WebSocket = require('ws');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 15;
const PAUSE_MINUTES = parseInt(process.env.PAUSE_MINUTES) || 30;
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 250;

const activeBroadcasts = new Map();

// ============================================
// START AUTO BROADCAST
// ============================================
async function startAutoBroadcast(memberId, memberName, filters, message) {
    const broadcastId = `${memberId}_${Date.now()}`;
    
    try {
        const customers = await getFilteredCustomers(filters);
        
        if (customers.length === 0) {
            return { success: false, message: "No customers found matching the criteria" };
        }

        const todaySent = await getTodaySent(memberName);
        const remaining = DAILY_LIMIT - todaySent;
        
        if (remaining <= 0) {
            return { 
                success: false, 
                message: `${memberName} has reached daily limit of ${DAILY_LIMIT} messages` 
            };
        }

        const customersToSend = customers.slice(0, remaining);
        const totalBatches = Math.ceil(customersToSend.length / BATCH_SIZE);

        activeBroadcasts.set(broadcastId, {
            memberId,
            memberName,
            customers: customersToSend,
            currentBatch: 0,
            totalBatches,
            sentCount: 0,
            failedCount: 0,
            status: 'running',
            message,
            filters,
            startTime: new Date(),
            lastBatchTime: null,
            isPaused: false
        });

        // Start processing
        processNextBatch(broadcastId);

        return {
            success: true,
            broadcastId,
            totalCustomers: customersToSend.length,
            totalBatches,
            batchSize: BATCH_SIZE,
            pauseMinutes: PAUSE_MINUTES,
            estimatedHours: Math.ceil((totalBatches * PAUSE_MINUTES) / 60)
        };
    } catch (error) {
        console.error('Error starting auto broadcast:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PROCESS NEXT BATCH
// ============================================
async function processNextBatch(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (!broadcast || broadcast.status === 'completed' || broadcast.status === 'paused' || broadcast.status === 'stopped') {
        return;
    }

    if (broadcast.isPaused) {
        console.log(`⏸️ Broadcast ${broadcastId} paused`);
        return;
    }

    const { customers, currentBatch, totalBatches, message, memberName } = broadcast;
    
    const start = currentBatch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, customers.length);
    const batch = customers.slice(start, end);

    if (batch.length === 0) {
        broadcast.status = 'completed';
        await logBroadcastComplete(broadcastId);
        return;
    }

    console.log(`📤 ${memberName}: Sending batch ${currentBatch + 1}/${totalBatches} (${batch.length} customers)`);

    const results = await sendBatch(batch, message, memberName);
    
    broadcast.currentBatch++;
    broadcast.sentCount += results.sent;
    broadcast.failedCount += results.failed;
    broadcast.lastBatchTime = new Date();

    await logBatchCompletion(broadcastId, batch.length, results.sent, results.failed);

    if (broadcast.currentBatch >= totalBatches) {
        broadcast.status = 'completed';
        await logBroadcastComplete(broadcastId);
        console.log(`✅ ${memberName}: Broadcast complete! ${broadcast.sentCount} messages sent, ${broadcast.failedCount} failed`);
        return;
    }

    console.log(`⏰ ${memberName}: Pausing for ${PAUSE_MINUTES} minutes... (${broadcast.currentBatch}/${totalBatches} batches complete)`);
    setTimeout(() => {
        processNextBatch(broadcastId);
    }, PAUSE_MINUTES * 60 * 1000);
}

// ============================================
// SEND BATCH
// ============================================
async function sendBatch(customers, message, memberName) {
    let sent = 0;
    let failed = 0;
    
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
        return { sent: 0, failed: customers.length };
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
                        message: personalizeMessage(message, customer)
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
                        `INSERT INTO broadcast_logs 
                         (team_member, recipient, message, status, message_parts) 
                         VALUES (?, ?, ?, 'Sent', 'Auto Broadcast')`,
                        [memberName, customer.mobile_number, personalizeMessage(message, customer)]
                    );
                } else {
                    failed++;
                    await db.query(
                        `INSERT INTO broadcast_logs 
                         (team_member, recipient, message, status, message_parts) 
                         VALUES (?, ?, ?, 'Failed', 'Auto Broadcast')`,
                        [memberName, customer.mobile_number, personalizeMessage(message, customer)]
                    );
                }
            } catch (error) {
                failed++;
                console.error(`❌ Failed to send to ${customer.mobile_number}:`, error.message);
                await db.query(
                    `INSERT INTO broadcast_logs 
                     (team_member, recipient, message, status, message_parts) 
                     VALUES (?, ?, ?, 'Failed', 'Auto Broadcast')`,
                    [memberName, customer.mobile_number, personalizeMessage(message, customer)]
                );
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    if (ws) ws.close();
    return { sent, failed };
}

// ============================================
// GET FILTERED CUSTOMERS
// ============================================
async function getFilteredCustomers(filters) {
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

    query += " ORDER BY id LIMIT 1000";

    const [rows] = await db.query(query, params);
    return rows;
}

// ============================================
// GET TODAY SENT
// ============================================
async function getTodaySent(memberName) {
    const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM broadcast_logs WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'",
        [memberName]
    );
    return rows[0]?.count || 0;
}

// ============================================
// PERSONALIZE MESSAGE
// ============================================
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
// LOG BATCH COMPLETION
// ============================================
async function logBatchCompletion(broadcastId, batchSize, sent, failed) {
    await db.query(
        `INSERT INTO automation_logs 
         (rule_name, trigger_type, recipients, sent_count, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [`Auto Broadcast - Batch ${broadcastId}`, 'auto', batchSize, sent, failed > 0 ? 'Partial' : 'Completed']
    );
}

// ============================================
// LOG BROADCAST COMPLETE
// ============================================
async function logBroadcastComplete(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (!broadcast) return;

    await db.query(
        `INSERT INTO automation_logs 
         (rule_name, trigger_type, recipients, sent_count, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [`Auto Broadcast Complete - ${broadcast.memberName}`, 'auto', broadcast.customers.length, broadcast.sentCount, 'Completed']
    );
}

// ============================================
// GET BROADCAST STATUS
// ============================================
function getBroadcastStatus(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (!broadcast) return null;
    
    return {
        status: broadcast.status,
        memberName: broadcast.memberName,
        totalCustomers: broadcast.customers.length,
        totalBatches: broadcast.totalBatches,
        currentBatch: broadcast.currentBatch,
        sentCount: broadcast.sentCount,
        failedCount: broadcast.failedCount,
        startTime: broadcast.startTime,
        lastBatchTime: broadcast.lastBatchTime,
        progress: Math.round((broadcast.sentCount / broadcast.customers.length) * 100)
    };
}

// ============================================
// STOP BROADCAST
// ============================================
function stopBroadcast(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (broadcast) {
        broadcast.status = 'stopped';
        broadcast.stoppedAt = new Date();
        return { 
            success: true, 
            message: `Broadcast stopped. ${broadcast.sentCount} messages sent.` 
        };
    }
    return { success: false, message: "Broadcast not found" };
}

// ============================================
// PAUSE BROADCAST
// ============================================
function pauseBroadcast(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (broadcast) {
        broadcast.isPaused = true;
        broadcast.status = 'paused';
        return { success: true, message: "Broadcast paused" };
    }
    return { success: false, message: "Broadcast not found" };
}

// ============================================
// RESUME BROADCAST
// ============================================
function resumeBroadcast(broadcastId) {
    const broadcast = activeBroadcasts.get(broadcastId);
    if (broadcast) {
        broadcast.isPaused = false;
        broadcast.status = 'running';
        // Resume processing
        processNextBatch(broadcastId);
        return { success: true, message: "Broadcast resumed" };
    }
    return { success: false, message: "Broadcast not found" };
}

// ============================================
// GET ALL ACTIVE BROADCASTS
// ============================================
function getAllActiveBroadcasts() {
    const result = [];
    for (const [id, broadcast] of activeBroadcasts) {
        if (broadcast.status === 'running' || broadcast.status === 'paused') {
            result.push({
                broadcastId: id,
                memberName: broadcast.memberName,
                progress: Math.round((broadcast.sentCount / broadcast.customers.length) * 100),
                sentCount: broadcast.sentCount,
                totalCustomers: broadcast.customers.length,
                status: broadcast.status,
                isPaused: broadcast.isPaused
            });
        }
    }
    return result;
}

// ============================================
// EXPORT
// ============================================
module.exports = {
    startAutoBroadcast,
    getBroadcastStatus,
    stopBroadcast,
    pauseBroadcast,
    resumeBroadcast,
    getAllActiveBroadcasts,
    activeBroadcasts
};
