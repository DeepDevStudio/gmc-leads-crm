const express = require("express");
const router = express.Router();
const db = require("../config/db");
const {
    startBatchProcessing,
    getBatchStatus,
    stopBatch,
    getMemberLimits,
    updateMemberLimit,
    activeBatches
} = require("../services/batchService");

// ============================================
// START BATCH
// ============================================
router.post("/start", async (req, res) => {
    const { ruleId, memberName, filters, message } = req.body;
    
    if (!ruleId || !memberName || !filters || !message) {
        return res.status(400).json({ 
            error: "Missing required fields: ruleId, memberName, filters, message" 
        });
    }

    const result = await startBatchProcessing(ruleId, memberName, filters, message);
    
    if (!result.success) {
        return res.status(400).json(result);
    }
    
    res.json(result);
});

// ============================================
// GET BATCH STATUS
// ============================================
router.get("/status/:batchId", (req, res) => {
    const status = getBatchStatus(req.params.batchId);
    if (!status) {
        return res.status(404).json({ error: "Batch not found" });
    }
    res.json(status);
});

// ============================================
// STOP BATCH
// ============================================
router.post("/stop/:batchId", (req, res) => {
    const result = stopBatch(req.params.batchId);
    res.json(result);
});

// ============================================
// GET ALL ACTIVE BATCHES
// ============================================
router.get("/active", (req, res) => {
    const batches = [];
    for (const [id, batch] of activeBatches) {
        if (batch.status === 'running') {
            batches.push({
                batchId: id,
                memberName: batch.memberName,
                progress: Math.round((batch.sentCount / batch.customers.length) * 100),
                sentCount: batch.sentCount,
                totalCustomers: batch.customers.length
            });
        }
    }
    res.json(batches);
});

// ============================================
// GET MEMBER LIMITS
// ============================================
router.get("/limits", async (req, res) => {
    try {
        const limits = await getMemberLimits();
        res.json(limits);
    } catch (error) {
        console.error('Error getting member limits:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// UPDATE MEMBER LIMITS
// ============================================
router.put("/limits/:memberName", async (req, res) => {
    const { memberName } = req.params;
    const { dailyLimit, batchSize, pauseMinutes } = req.body;
    
    try {
        const result = await updateMemberLimit(memberName, dailyLimit, batchSize, pauseMinutes);
        res.json(result);
    } catch (error) {
        console.error('Error updating member limit:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET MEMBER TODAY'S SENT
// ============================================
router.get("/member/:memberName/today", async (req, res) => {
    const { memberName } = req.params;
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) as sent FROM broadcast_logs WHERE team_member = ? AND DATE(created_at) = CURDATE() AND status = 'Sent'",
            [memberName]
        );
        res.json({ sent: rows[0]?.sent || 0 });
    } catch (error) {
        console.error('Error getting today sent:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
