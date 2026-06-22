require("dotenv").config();

const express = require("express");
const cors = require("cors");

const whatsappClient =
  require("./whatsapp");

const whatsappRoutes =
  require("./routes/whatsappRoutes");

const sendCustomerRoute =
  require("./routes/sendCustomerRoute");

  const sendBulkRoute =
  require("./routes/sendBulkRoute");

const authRoutes =
  require(
    "./routes/authRoutes"
  );

const customerRoutes =
  require("./routes/customerRoutes");

  const interestRoutes =
  require("./routes/interestRoutes");

  const campaignRoutes =
  require("./routes/campaignRoutes");

  const templateRoutes =
  require("./routes/templateRoutes");

  const automationRoutes =
  require("./routes/automationRoutes");

  const activityRoutes =
  require(
    "./routes/activityRoutes"
  );

  const dashboardRoutes =
  require(
    "./routes/dashboardRoutes"
  );

  const reportRoutes =
  require(
    "./routes/reportRoutes"
  );

  const broadcastRoutes =
  require(
    "./routes/broadcastRoutes"
  );

const yatraRoutes =
  require("./routes/yatraRoutes");

 const yatraBookingRoutes =
  require("./routes/yatraBookingRoutes"); 

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/interests",
  interestRoutes
);

app.use(
  "/api/campaigns",
  campaignRoutes
);

app.use(
  "/api/templates",
  templateRoutes
);

app.use(
  "/api/whatsapp",
  whatsappRoutes
);

app.use(
  "/api/send-customer",
  sendCustomerRoute
);

app.use(
  "/api/send-bulk",
  sendBulkRoute
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/automation",
  automationRoutes
);

app.use(
  "/api/activity",
  activityRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/broadcast",
  broadcastRoutes
);

app.use(
  "/api/yatras",
  yatraRoutes
);

app.use(
  "/api/yatra-bookings",
  yatraBookingRoutes
);

const PORT =
  process.env.PORT || 6000;

app.get("/", (req, res) => {
  res.send("Leads Backend Working");
});

// whatsappClient.initialize();

app.listen(PORT, () => {
  console.log(
    `Leads Server Running On ${PORT}`
  );
});