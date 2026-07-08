#!/bin/bash

echo "🔧 COMPLETE BROADCAST PAGE FIX"
echo "================================="

# 1. Stop duplicate whatsapp-ws (if exists)
echo "🛑 Stopping duplicate whatsapp-ws..."
pm2 stop whatsapp-ws 2>/dev/null
pm2 delete whatsapp-ws 2>/dev/null

# 2. Create/repair database tables
echo "📊 Creating database tables..."
mysql -u gmcuser -p'Gmc@123' gmc_crm << 'EOF'
-- Drop and recreate message_logs
DROP TABLE IF EXISTS message_logs;
CREATE TABLE message_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile_number VARCHAR(20),
    message TEXT,
    status VARCHAR(50) DEFAULT 'Sent',
    team_member VARCHAR(100),
    customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile (mobile_number),
    INDEX idx_team_member (team_member),
    INDEX idx_created (created_at)
);

-- Create broadcast_logs
CREATE TABLE IF NOT EXISTS broadcast_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_member VARCHAR(100),
    recipient VARCHAR(20),
    message TEXT,
    status VARCHAR(50) DEFAULT 'Sent',
    message_parts VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_team_member (team_member),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- Create customer_opt_out_logs
CREATE TABLE IF NOT EXISTS customer_opt_out_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    reason TEXT,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id)
);

-- Create presets
CREATE TABLE IF NOT EXISTS presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add columns to customers if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opted_out BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMP NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opted_out_reason TEXT NULL;
EOF

# 3. Create/update route files
echo "📝 Creating route files..."

# Create whatsappRoutes.js
cat > /var/www/gmc-leads-crm/leads-backend/routes/whatsappRoutes.js << 'EOF'
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/logs", async (req, res) => {
    try {
        const [tables] = await db.query("SHOW TABLES LIKE 'message_logs'");
        if (tables.length === 0) {
            await db.query(`
                CREATE TABLE message_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    mobile_number VARCHAR(20),
                    message TEXT,
                    status VARCHAR(50) DEFAULT 'Sent',
                    team_member VARCHAR(100),
                    customer_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_mobile (mobile_number),
                    INDEX idx_team_member (team_member),
                    INDEX idx_created (created_at)
                )
            `);
            return res.json([]);
        }
        const [rows] = await db.query("SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 100");
        res.json(rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.json([]);
    }
});

router.post("/send", async (req, res) => {
    const { phone, message, team_member, customer_id } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: "Phone and message are required" });
    }
    try {
        const [result] = await db.query(
            "INSERT INTO message_logs (mobile_number, message, status, team_member, customer_id) VALUES (?, ?, 'Queued', ?, ?)",
            [phone, message, team_member || 'Unknown', customer_id || null]
        );
        res.json({ success: true, message: "Message logged", id: result.insertId });
    } catch (err) {
        console.error("Error logging message:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
EOF

# 4. Restart gmc-crm
echo "🔄 Restarting gmc-crm..."
pm2 restart gmc-crm

# 5. Wait for WebSocket to start
sleep 5

# 6. Build frontend
echo "🏗️ Building frontend..."
cd /var/www/gmc-leads-crm/leads-frontend
npm run build

# 7. Restart frontend
echo "🔄 Restarting gmc-frontend..."
pm2 restart gmc-frontend

# 8. Check status
echo "📊 Service Status:"
pm2 list

# 9. Check if WebSocket is running on port 6001
echo "🔍 Checking WebSocket on port 6001..."
sudo netstat -tulpn | grep 6001

# 10. Check WebSocket logs
echo "📋 WebSocket logs:"
pm2 logs gmc-crm --lines 15 --nostream | grep -i "websocket"

echo ""
echo "✅ FIX COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "1. Refresh your browser (Ctrl+F5)"
echo "2. Open Broadcast page"
echo "3. Check if members show QR codes"
echo "4. Test sending a broadcast"
