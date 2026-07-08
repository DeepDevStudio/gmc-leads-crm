require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerInterestRoutes = require("./routes/customerInterestRoutes");
const interestRoutes = require("./routes/interestRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const templateRoutes = require("./routes/templateRoutes");
const automationRoutes = require("./routes/automationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const yatraRoutes = require("./routes/yatraRoutes");
const yatraBookingRoutes = require("./routes/yatraBookingRoutes");
const tripRoutes = require("./routes/tripRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const presetRoutes = require("./routes/presetRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const userRoutes = require("./routes/userRoutes");
const sendCustomerRoute = require("./routes/sendCustomerRoute");
const sendBulkRoute = require("./routes/sendBulkRoute");
const whatsappCloudRoutes = require("./routes/whatsappCloudRoutes");
const autoBroadcastRoutes = require("./routes/autoBroadcastRoutes");
const batchRoutes = require("./routes/batchRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer-interests", customerInterestRoutes);
app.use("/api/interests", interestRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp-cloud", whatsappCloudRoutes);
app.use("/api/send-customer", sendCustomerRoute);
app.use("/api/send-bulk", sendBulkRoute);
app.use("/api/automation", automationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/yatras", yatraRoutes);
app.use("/api/yatra-bookings", yatraBookingRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/presets", presetRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auto-broadcast", autoBroadcastRoutes);
app.use("/api/batch", batchRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'gmc_crm'}`);
    console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
});

db.getConnection()
    .then(() => {
        console.log("✅ Leads Database Connected");
    })
    .catch((err) => {
        console.error("❌ Database Connection Failed:", err.message);
    });
