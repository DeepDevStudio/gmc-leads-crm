import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./layout/Layout";

import ActivityPage
  from "./pages/ActivityPage";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import CustomerMasterPage from "./pages/CustomerMasterPage";
import InterestMasterPage from "./pages/InterestMasterPage";
import CampaignsPage from "./pages/CampaignsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AutomationPage from "./pages/AutomationPage";
import Reports
  from "./pages/Reports";

import BroadcastPage
  from "./pages/BroadcastPage";

  import CustomerProfilePage
from "./pages/CustomerProfilePage";

import YatraMasterPage
from "./pages/YatraMasterPage";

import YatraBookingPage
  from "./pages/YatraBookingPage";

function DailyReach() {
  return <h1>Daily Reach</h1>;
}

function DoNotReach() {
  return <h1>Do Not Reach</h1>;
}

function Unsubscribed() {
  return <h1>Unsubscribed</h1>;
}




function Settings() {
  return <h1>Settings</h1>;
}

function App() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/"
          element={
            user
              ? <Layout />
              : <LoginPage />
          }
        >

          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="customers"
            element={<CustomersPage />}
          />

          <Route
            path="customers/create"
            element={
              <CustomerMasterPage />
            }
          />

          <Route
  path="customers/:id"
  element={
    <CustomerProfilePage />
  }
/>

          <Route
            path="daily-reach"
            element={<DailyReach />}
          />

          <Route
            path="do-not-reach"
            element={<DoNotReach />}
          />

          <Route
            path="unsubscribed"
            element={<Unsubscribed />}
          />

          <Route
            path="templates"
            element={
              <TemplatesPage />
            }
          />

          <Route
            path="automation"
            element={
              <AutomationPage />
            }
          />

          <Route
            path="broadcast"
            element={
              <BroadcastPage />
            }
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

          <Route
            path="activity"
            element={
              <ActivityPage />
            }
          />

          <Route
            path="interests"
            element={
              <InterestMasterPage />
            }
          />

          <Route
            path="campaigns"
            element={
              <CampaignsPage />
            }
          />

          <Route
  path="yatras"
  element={
    <YatraMasterPage />
  }
/>


<Route
  path="/yatra-bookings"
  element={<YatraBookingPage />}
/>
          

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;