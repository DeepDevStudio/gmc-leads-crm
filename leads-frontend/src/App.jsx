import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./layout/Layout";

import ActivityPage from "./pages/ActivityPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import CustomerMasterPage from "./pages/CustomerMasterPage";
import InterestMasterPage from "./pages/InterestMasterPage";
import CampaignsPage from "./pages/CampaignsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AutomationPage from "./pages/AutomationPage";
import Reports from "./pages/Reports";
import BroadcastPage from "./pages/BroadcastPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import YatraMasterPage from "./pages/YatraMasterPage";
import YatraBookingPage from "./pages/YatraBookingPage";
import DailyReach from "./pages/DailyReach";
import DoNotReach from "./pages/DoNotReach";
import Unsubscribed from "./pages/Unsubscribed";

// NEW: Import your Trips/Camping pages
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";

function Settings() {
  return <h1>Settings</h1>;
}

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes (with Layout) */}
        <Route
          path="/"
          element={user ? <Layout /> : <LoginPage />}
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Customer Management */}
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/create" element={<CustomerMasterPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />

          {/* Customer Lists */}
          <Route path="daily-reach" element={<DailyReach />} />
          <Route path="do-not-reach" element={<DoNotReach />} />
          <Route path="unsubscribed" element={<Unsubscribed />} />

          {/* Templates & Automation */}
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="broadcast" element={<BroadcastPage />} />

          {/* Reports & Activity */}
          <Route path="reports" element={<Reports />} />
          <Route path="activity" element={<ActivityPage />} />

          {/* Interests & Campaigns */}
          <Route path="interests" element={<InterestMasterPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />

          {/* Yatra (Trip) Management - EXISTING */}
          <Route path="yatras" element={<YatraMasterPage />} />
          <Route path="yatra-bookings" element={<YatraBookingPage />} />

          {/* NEW: Trips/Camping Management */}
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailsPage />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;