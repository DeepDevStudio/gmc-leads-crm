require("dotenv").config();

const express = require("express");
const cors = require("cors");

const whatsappClient = require("./whatsapp");

const whatsappRoutes = require("./routes/whatsappRoutes");
const sendCustomerRoute = require("./routes/sendCustomerRoute");
const sendBulkRoute = require("./routes/sendBulkRoute");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
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

// NEW: Trip routes for camping/trips
const tripRoutes = require("./routes/tripRoutes");

// ============================================
// CREATE APP FIRST (BEFORE USING IT!)
// ============================================
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// ALL ROUTES GO HERE (AFTER app is created)
// ============================================

app.use("/api/customers", customerRoutes);
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

// NEW: Trip routes for camping/trips
app.use("/api/trips", tripRoutes);

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