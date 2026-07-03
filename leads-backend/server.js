require("dotenv").config();

const express = require("express");
const cors = require("cors");

const whatsappClient = require("./whatsapp");

const sendCustomerRoute = require("./routes/sendCustomerRoute");
const sendBulkRoute = require("./routes/sendBulkRoute");
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

// Trip routes for camping/trips
const tripRoutes = require("./routes/tripRoutes");

// WhatsApp routes (ONLY ONCE!)
const whatsappRoutes = require("./routes/whatsappRoutes");

// Receipt routes
const receiptRoutes = require("./routes/receiptRoutes");

// User routes
const userRoutes = require("./routes/userRoutes");

// Bulk Import routes
const bulkImportRoutes = require("./routes/bulkImportRoutes");

// ============================================
// CREATE APP FIRST (BEFORE USING IT!)
// ============================================
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// ALL ROUTES GO HERE (AFTER app is created)
// ============================================

app.use("/api/customers", customerRoutes);
app.use("/api/customers", customerInterestRoutes);
app.use("/api/interests", interestRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/send-customer", sendCustomerRoute);
app.use("/api/send-bulk", sendBulkRoute);
app.use("/api/auth", authRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/yatras", yatraRoutes);
app.use("/api/yatra-bookings", yatraBookingRoutes);

// Trip routes for camping/trips
app.use("/api/trips", tripRoutes);

// Receipt routes
app.use("/api/receipts", receiptRoutes);

// User routes
app.use("/api/users", userRoutes);

// Bulk Import routes
app.use("/api/bulk-import", bulkImportRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Leads Backend Working");
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Leads Server Running On ${PORT}`);
});

// Uncomment this when WhatsApp is ready
// whatsappClient.initialize();
