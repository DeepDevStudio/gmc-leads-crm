const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL EMPLOYEES (Users with role = team or employee)
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, username, full_name, role, whatsapp_number, is_active, created_at FROM users WHERE role IN ('team', 'employee') ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching employees:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET EMPLOYEE STATS
=========================
*/
router.get("/stats", async (req, res) => {
    try {
        const [total] = await db.query("SELECT COUNT(*) as total FROM users WHERE role IN ('team', 'employee')");
        const [active] = await db.query("SELECT COUNT(*) as active FROM users WHERE role IN ('team', 'employee') AND is_active = 1");
        const [inactive] = await db.query("SELECT COUNT(*) as inactive FROM users WHERE role IN ('team', 'employee') AND is_active = 0");
        
        res.json({
            total: total[0]?.total || 0,
            active: active[0]?.active || 0,
            inactive: inactive[0]?.inactive || 0
        });
    } catch (err) {
        console.error("Error fetching employee stats:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
