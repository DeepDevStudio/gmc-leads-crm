require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ===== STATIC FILES (for uploaded images) =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerInterestRoutes = require("./routes/customerInterestRoutes");
const interestRoutes = require("./routes/interestRoutes");
const templateRoutes = require("./routes/templateRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const automationRoutes = require("./routes/automationRoutes");
const autoBroadcastRoutes = require("./routes/autoBroadcastRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const activityRoutes = require("./routes/activityRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const presetRoutes = require("./routes/presetRoutes");
const bulkImportRoutes = require("./routes/bulkImportRoutes");
const yatraRoutes = require("./routes/yatraRoutes");
const yatraBookingRoutes = require("./routes/yatraBookingRoutes");
const yatraDetailsRoutes = require("./routes/yatraDetailsRoutes");
const tripRoutes = require("./routes/tripRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const whatsappCloudRoutes = require("./routes/whatsappCloudRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer-interests", customerInterestRoutes);
app.use("/api/interests", interestRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/auto-broadcast", autoBroadcastRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/activity", activityRoutes);  // ← FIX: Added singular route for frontend
app.use("/api/settings", settingsRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/presets", presetRoutes);
app.use("/api/bulk-import", bulkImportRoutes);
app.use("/api/yatras", yatraRoutes);
app.use("/api/yatra-bookings", yatraBookingRoutes);
app.use("/api/yatra-details", yatraDetailsRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp-cloud", whatsappCloudRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/pickup-points", pickupRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/notifications", notificationsRoutes);

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===== WHATSAPP WEB - TEMPORARILY DISABLED =====
// const { Client, LocalAuth } = require('whatsapp-web.js');
// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: {
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     }
// });

// client.on('ready', () => {
//     console.log('✅ WhatsApp Web client is ready!');
// });

// client.on('authenticated', (session) => {
//     console.log('✅ WhatsApp authenticated!');
// });

// client.on('auth_failure', (msg) => {
//     console.error('❌ WhatsApp authentication failed:', msg);
// });

// client.on('qr', (qr) => {
//     console.log('📱 Scan this QR code to connect WhatsApp:');
//     console.log(qr);
// });

// client.initialize().catch(err => {
//     console.error('❌ WhatsApp initialization error:', err.message);
// });

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'gmc_crm'}`);
    console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
});
