const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

/*
=========================
GET ALL USERS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, username, full_name, role, whatsapp_number, is_active, created_at
            FROM users
            ORDER BY id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET USER BY ID
=========================
*/
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT id, username, full_name, role, whatsapp_number, is_active, created_at
            FROM users
            WHERE id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE USER (with bcrypt)
=========================
*/
router.post("/", async (req, res) => {
    const { username, password, full_name, role, whatsapp_number, is_active } = req.body;

    if (!username || !password || !full_name) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
    }

    try {
        // Check if username exists
        const [existing] = await db.query(
            "SELECT id FROM users WHERE username = ?",
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(`
            INSERT INTO users (username, password, full_name, role, whatsapp_number, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            username, 
            hashedPassword, 
            full_name, 
            role || 'team', 
            whatsapp_number || '', 
            is_active !== undefined ? is_active : 1
        ]);

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "User created successfully"
        });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE USER (with optional password change)
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { username, full_name, role, whatsapp_number, is_active, password } = req.body;

    try {
        let updateQuery = `
            UPDATE users 
            SET username = ?, full_name = ?, role = ?, whatsapp_number = ?, is_active = ?
        `;
        let params = [username, full_name, role, whatsapp_number || '', is_active !== undefined ? is_active : 1];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += `, password = ?`;
            params.push(hashedPassword);
        }

        updateQuery += ` WHERE id = ?`;
        params.push(id);

        const [result] = await db.query(updateQuery, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            message: "User updated successfully"
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE USER STATUS
=========================
*/
router.patch("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        const [result] = await db.query(
            "UPDATE users SET is_active = ? WHERE id = ?",
            [is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            message: `User ${is_active === 1 ? 'activated' : 'deactivated'} successfully`
        });
    } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE USER
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CHANGE PASSWORD
=========================
*/
router.post("/change-password", async (req, res) => {
    const { user_id, current_password, new_password } = req.body;

    if (!user_id || !current_password || !new_password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    try {
        // Get user with current password
        const [rows] = await db.query(
            "SELECT id, password FROM users WHERE id = ?",
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const user = rows[0];
        const isValid = await bcrypt.compare(current_password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, user_id]
        );

        res.json({
            success: true,
            message: "Password changed successfully!"
        });
    } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
