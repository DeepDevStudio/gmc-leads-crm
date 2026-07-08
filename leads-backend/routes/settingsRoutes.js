const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET SETTINGS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM company_settings LIMIT 1
        `);
        
        if (rows.length === 0) {
            // Return default settings if none exist
            return res.json({
                companyName: 'Get Me Cab',
                email: 'info@getmecab.com',
                phone: '+91 9876543210',
                contactNumber: '+91 9015430550',
                address: 'Delhi, India',
                whatsappNumber: '',
                autoReply: false,
                autoReplyMessage: 'Thank you for your message! We will get back to you shortly.'
            });
        }
        
        // Convert snake_case to camelCase
        const settings = rows[0];
        res.json({
            companyName: settings.company_name,
            email: settings.email,
            phone: settings.phone,
            contactNumber: settings.contact_number,
            address: settings.address,
            whatsappNumber: settings.whatsapp_number,
            autoReply: settings.auto_reply === 1,
            autoReplyMessage: settings.auto_reply_message
        });
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE SETTINGS
=========================
*/
router.put("/", async (req, res) => {
    const {
        companyName,
        email,
        phone,
        contactNumber,
        address,
        whatsappNumber,
        autoReply,
        autoReplyMessage
    } = req.body;

    try {
        // Check if settings exist
        const [existing] = await db.query(`
            SELECT id FROM company_settings LIMIT 1
        `);

        if (existing.length === 0) {
            // Insert new settings
            await db.query(`
                INSERT INTO company_settings (
                    company_name, email, phone, contact_number, address,
                    whatsapp_number, auto_reply, auto_reply_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                companyName,
                email,
                phone,
                contactNumber,
                address,
                whatsappNumber || '',
                autoReply ? 1 : 0,
                autoReplyMessage || ''
            ]);
        } else {
            // Update existing settings
            await db.query(`
                UPDATE company_settings SET
                    company_name = ?,
                    email = ?,
                    phone = ?,
                    contact_number = ?,
                    address = ?,
                    whatsapp_number = ?,
                    auto_reply = ?,
                    auto_reply_message = ?
                WHERE id = ?
            `, [
                companyName,
                email,
                phone,
                contactNumber,
                address,
                whatsappNumber || '',
                autoReply ? 1 : 0,
                autoReplyMessage || '',
                existing[0].id
            ]);
        }

        res.json({
            success: true,
            message: "Settings saved successfully!"
        });
    } catch (err) {
        console.error("Error saving settings:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
