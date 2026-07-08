const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../config/db");

function formatPhoneNumber(number) {
    if (!number) return number;
    let cleaned = number.replace(/[\s\-]/g, '').replace(/^\+/, '');
    if (cleaned.length === 10 && /^[0-9]{10}$/.test(cleaned)) {
        cleaned = '91' + cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.substring(1);
    }
    return cleaned;
}

router.post("/send", async (req, res) => {
    const { phone, message, team_member, customer_id } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: "Phone and message are required" });
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log(`📤 Sending via Cloud API to ${formattedPhone}: ${message.substring(0, 30)}...`);

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        console.error("❌ WhatsApp Cloud API credentials not configured!");
        return res.status(500).json({ 
            error: "WhatsApp Cloud API not configured. Please check .env file." 
        });
    }

    try {
        const response = await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: { body: message }
            }
        });

        await db.query(
            "INSERT INTO message_logs (mobile_number, message, status, team_member, customer_id) VALUES (?, ?, 'Sent via Cloud', ?, ?)",
            [phone, message, team_member || 'WhatsApp Cloud', customer_id || null]
        );

        console.log(`✅ Cloud API sent to ${formattedPhone}`);
        res.json({ 
            success: true, 
            id: response.data.messages?.[0]?.id,
            formatted_number: formattedPhone,
            message: "Message sent via WhatsApp Cloud API"
        });
    } catch (err) {
        console.error("❌ Cloud API error:", err.response?.data || err.message);
        res.status(500).json({ 
            error: err.response?.data?.error?.message || err.message 
        });
    }
});

router.post("/broadcast", async (req, res) => {
    const { target_group, interests, yatra, message, team_member } = req.body;
    
    console.log(`📤 Sending broadcast via Cloud API...`);
    
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        return res.status(500).json({ 
            error: "WhatsApp Cloud API not configured. Please check .env file." 
        });
    }

    try {
        let query = "SELECT * FROM customers WHERE 1=1";
        const params = [];

        if (target_group && target_group !== 'All') {
            query += " AND group_type = ?";
            params.push(target_group);
        }

        if (interests && interests.length > 0) {
            const placeholders = interests.map(() => '?').join(',');
            query += ` AND interests IN (${placeholders})`;
            params.push(...interests);
        }

        if (yatra) {
            query += " AND interests LIKE ?";
            params.push(`%${yatra}%`);
        }

        query += " LIMIT 100";
        
        const [customers] = await db.query(query, params);
        console.log(`📊 Found ${customers.length} customers for Cloud API broadcast`);
        
        if (customers.length === 0) {
            return res.json({ success: true, sent: 0, failed: 0, total: 0 });
        }
        
        let sent = 0;
        let failed = 0;
        const errors = [];

        for (const customer of customers) {
            if (customer.mobile_number) {
                const formattedPhone = formatPhoneNumber(customer.mobile_number);
                
                try {
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        data: {
                            messaging_product: 'whatsapp',
                            to: formattedPhone,
                            type: 'text',
                            text: { body: message }
                        }
                    });

                    sent++;
                    console.log(`✅ Cloud API sent to ${formattedPhone} (${sent}/${customers.length})`);

                    await db.query(
                        "INSERT INTO message_logs (mobile_number, message, status, team_member, customer_id) VALUES (?, ?, 'Sent via Cloud', ?, ?)",
                        [customer.mobile_number, message, team_member || 'WhatsApp Cloud', customer.id]
                    );
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (err) {
                    failed++;
                    const errorMsg = err.response?.data?.error?.message || err.message;
                    errors.push({ customer: customer.customer_name, error: errorMsg });
                    console.error(`❌ Failed to send to ${formattedPhone}:`, errorMsg);
                }
            }
        }

        console.log(`✅ Cloud API broadcast complete: ${sent} sent, ${failed} failed`);
        res.json({ 
            success: true, 
            sent, 
            failed, 
            total: customers.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error("❌ Cloud API broadcast error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
