const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

/*
=========================
LOGIN USER
=========================
*/
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                whatsapp_number: user.whatsapp_number,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
VERIFY TOKEN
=========================
*/
router.get("/verify", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await db.query(
            "SELECT id, username, full_name, role, email FROM users WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }

        res.json({
            success: true,
            user: rows[0]
        });
    } catch (err) {
        console.error("Error verifying token:", err);
        res.status(401).json({ error: "Invalid token" });
    }
});

/*
=========================
CHANGE PASSWORD
=========================
*/
router.post("/change-password", async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE users SET password = ? WHERE username = ?",
            [hashedPassword, username]
        );

        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
FORGOT PASSWORD
=========================
*/
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const [rows] = await db.query(
            "SELECT id, username, full_name FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "No user found with this email" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Save token to database
        await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            [resetToken, expiresAt, rows[0].id]
        );

        res.json({
            success: true,
            message: "Password reset link sent to your email"
        });
    } catch (err) {
        console.error("Error in forgot password:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
RESET PASSWORD
=========================
*/
router.post("/reset-password", async (req, res) => {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
        return res.status(400).json({ error: "Token and new password are required" });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
        const [rows] = await db.query(
            "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
            [hashedPassword, rows[0].id]
        );

        res.json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
