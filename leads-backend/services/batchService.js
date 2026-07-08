const db = require("../config/db");
const axios = require("axios");

// Batch configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 15;
const PAUSE_MINUTES = parseInt(process.env.PAUSE_MINUTES) || 30;
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 250;

// Store active batches
const activeBatches = new Map();

// ============================================
// START BATCH PROCESSING
// ============================================
async function startBatchProcessing(ruleId, memberName, filters, message) {
    const batchId = `${memberName}_${Date.now()}`;
    
    try {
        // Get customers matching filters
        const customers = await getFilteredCustomers(filters);
        
        if (customers.length === 0) {
            return { success: false, message: "No customers found" };
        }

        // Check daily limit
        const todaySent = await getTodaySent(memberName);
        const remaining = DAILY_LIMIT - todaySent;
        
        if (remaining <= 0) {
            return { 
                success: false, 
                message: `${memberName} has reached daily limit of ${DAILY_LIMIT} messages` 
            };
        }

        // Limit to remaining capacity
        const customersToSend = customers.slice(0, remaining);
        const totalBatches = Math.ceil(customersToSend.length / BATCH_SIZE);

        // Store batch info
        activeBatches.set(batchId, {
            ruleId,
            memberName,
            customers: customersToSend,
            currentBatch: 0,
            totalBatches,
            sentCount: 0,
            failedCount: 0,
            status: 'running',
            message,
            filters,
            startTime: new Date()
        });

        // Start processing
        processNextBatch(batchId);

        return {
            success: true,
            batchId,
            totalCustomers: customersToSend.length,
            totalBatches,
            batchSize: BATCH_SIZE,
            pauseMinutes: PAUSE_MINUTES,
            estimatedHours: Math.ceil((totalBatches * PAUSE_MINUTES) / 60)
        };
    } catch (error) {
        console.error('Error starting batch:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PROCESS NEXT BATCH
// ============================================
async function processNextBatch(batchId) {
    const batch = activeBatches.get(batchId);
    if (!batch || batch.status !== 'running') return;

    const { customers, currentBatch, totalBatches, sentCount, message, memberName } = batch;
    
    const start = currentBatch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, customers.length);
    const batchCustomers = customers.slice(start, end);

    if (batchCustomers.length === 0 || sentCount >= DAILY_LIMIT) {
        batch.status = 'completed';
        await logBatchComplete(batchId);
        console.log(`✅ ${memberName}: Batch complete! ${batch.sentCount} messages sent`);
        return;
    }

    console.log(`📤 ${memberName}: Sending batch ${currentBatch + 1}/${totalBatches} (${batchCustomers.length} customers)`);

    // Send messages
    const results = await sendBatch(batchCustomers, message, memberName);
    
    batch.currentBatch++;
    batch.sentCount += results.sent;
    batch.failedCount += results.failed;
    batch.lastBatchTime = new Date();

    // Log batch completion
    await logBatchCompletion(batchId, batchCustomers.length, results.sent, results.failed);

    // Check if complete
    if (batch.currentBatch >= totalBatches || batch.sentCount >= DAILY_LIMIT) {
        batch.status = 'completed';
        await logBatchComplete(batchId);
        console.log(`✅ ${memberName}: Batch complete! ${batch.sentCount} messages sent`);
        return;
    }

    // Schedule next batch after pause
    console.log(`⏰ ${memberName}: Pausing for ${PAUSE_MINUTES} minutes...`);
    setTimeout(() => {
        processNextBatch(batchId);
    }, PAUSE_MINUTES * 60 * 1000);
}

// ============================================
// SEND A BATCH (Using WebSocket)
// ============================================
async function sendBatch(customers, message, memberName) {
    let sent = 0;
    let failed = 0;
    
    console.log(`📤 ${memberName}: Starting batch for ${customers.length} customers`);
    
    // Get WebSocket module
    let wsModule = null;
    try {
        wsModule = require('../websocket-simple');
    } catch (err) {
        console.error('❌ WebSocket module not found:', err.message);
        return { sent: 0, failed: customers.length };
    }

    // Check if member is connected
    const sock = wsModule.connections.get(memberName);
    if (!sock) {
        console.error(`❌ ${memberName} is not connected`);
        console.log(`📊 Available:`, Array.from(wsModule.connections.keys()));
        return { sent: 0, failed: customers.length };
    }

    console.log(`✅ ${memberName} is connected, sending messages...`);

    for (const customer of customers) {
        if (!customer.mobile_number) {
            console.log(`⚠️ ${customer.customer_name || 'Unknown'} has no phone number`);
            continue;
        }
        
        try {
            const phoneNumber = formatPhoneNumber(customer.mobile_number);
            console.log(`📤 Sending to: ${customer.mobile_number} -> ${phoneNumber}`);
            
            // Use the WebSocket module's send function
            const result = await wsModule.sendWhatsAppMessage(memberName, phoneNumber, message);
            
            if (result && result.success) {
                sent++;
                console.log(`✅ Sent to ${phoneNumber} (${sent}/${customers.length})`);
                
                await db.query(
                    `INSERT INTO broadcast_logs 
                     (team_member, recipient, message, status, message_parts) 
                     VALUES (?, ?, ?, 'Sent via Batch', ?)`,
                    [memberName, customer.mobile_number, message, 'Batch']
                );
            } else {
                failed++;
                console.error(`❌ Failed to send to ${phoneNumber}:`, result?.error || 'Unknown error');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            failed++;
            console.error(`❌ Failed to send to ${customer.mobile_number}:`, error.message);
        }
    }

    console.log(`📊 ${memberName}: Batch complete - ${sent} sent, ${failed} failed`);
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
// GET TODAY'S SENT COUNT
// ============================================
async function getTodaySent(memberName) {
    const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM broadcast_logs WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'",
        [memberName]
    );
    return rows[0]?.count || 0;
}

// ============================================
// GET BATCH STATUS
// ============================================
function getBatchStatus(batchId) {
    const batch = activeBatches.get(batchId);
    if (!batch) return null;
    
    return {
        status: batch.status,
        memberName: batch.memberName,
        totalCustomers: batch.customers.length,
        totalBatches: batch.totalBatches,
        currentBatch: batch.currentBatch,
        sentCount: batch.sentCount,
        failedCount: batch.failedCount,
        progress: Math.round((batch.sentCount / batch.customers.length) * 100),
        startTime: batch.startTime,
        lastBatchTime: batch.lastBatchTime
    };
}

// ============================================
// STOP BATCH
// ============================================
function stopBatch(batchId) {
    const batch = activeBatches.get(batchId);
    if (batch) {
        batch.status = 'stopped';
        return { success: true, message: "Batch stopped" };
    }
    return { success: false, message: "Batch not found" };
}

// ============================================
// GET MEMBER LIMITS
// ============================================
async function getMemberLimits() {
    const [rows] = await db.query(
        "SELECT * FROM member_limits ORDER BY member_name"
    );
    return rows;
}

// ============================================
// UPDATE MEMBER LIMITS
// ============================================
async function updateMemberLimit(memberName, dailyLimit, batchSize, pauseMinutes) {
    await db.query(
        `INSERT INTO member_limits (member_name, daily_limit, batch_size, pause_minutes) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         daily_limit = VALUES(daily_limit), 
         batch_size = VALUES(batch_size), 
         pause_minutes = VALUES(pause_minutes)`,
        [memberName, dailyLimit, batchSize, pauseMinutes]
    );
    return { success: true };
}

// ============================================
// FORMAT PHONE NUMBER
// ============================================
function formatPhoneNumber(number) {
    if (!number) return number;
    let cleaned = number.replace(/[\s\-]/g, '').replace(/^\+/, '');
    if (cleaned.length === 10 && /^[0-9]{10}$/.test(cleaned)) {
        cleaned = '91' + cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.substring(1);
    }
    if (cleaned.length >= 11 && cleaned.length <= 15) {
        if (/^[1-9][0-9]{10,14}$/.test(cleaned)) {
            return cleaned;
        }
    }
    return cleaned;
}

// ============================================
// LOG BATCH COMPLETION
// ============================================
async function logBatchCompletion(batchId, batchSize, sent, failed) {
    const batch = activeBatches.get(batchId);
    if (!batch) return;

    await db.query(
        `INSERT INTO automation_logs 
         (rule_name, trigger_type, recipients, sent_count, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [`Batch - ${batch.memberName} (Batch ${batch.currentBatch})`, 
         'batch', batchSize, sent, failed > 0 ? 'Partial' : 'Completed']
    );
}

async function logBatchComplete(batchId) {
    const batch = activeBatches.get(batchId);
    if (!batch) return;

    await db.query(
        `INSERT INTO automation_logs 
         (rule_name, trigger_type, recipients, sent_count, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [`Batch Complete - ${batch.memberName}`, 
         'batch', batch.customers.length, batch.sentCount, 'Completed']
    );

    // Store in batch_executions
    await db.query(
        `INSERT INTO batch_executions 
         (rule_id, member_name, batch_number, total_sent, status, completed_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [batch.ruleId, batch.memberName, batch.currentBatch, batch.sentCount, 'Completed']
    );
}

module.exports = {
    startBatchProcessing,
    getBatchStatus,
    stopBatch,
    getMemberLimits,
    updateMemberLimit,
    activeBatches
};
