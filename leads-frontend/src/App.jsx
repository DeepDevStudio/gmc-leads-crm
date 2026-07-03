import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import CustomerMasterPage from "./pages/CustomerMasterPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import YatraMasterPage from "./pages/YatraMasterPage";
import YatraBookingPage from "./pages/YatraBookingPage";
import DailyReach from "./pages/DailyReach";
import DoNotReach from "./pages/DoNotReach";
import Unsubscribed from "./pages/Unsubscribed";
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import InterestMasterPage from "./pages/InterestMasterPage";
import CampaignsPage from "./pages/CampaignsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AutomationPage from "./pages/AutomationPage";
import BroadcastPage from "./pages/BroadcastPage";
import Reports from "./pages/Reports";
import ActivityPage from "./pages/ActivityPage";
import BulkImportPage from "./pages/BulkImportPage";

function App() {
    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={user ? <Layout /> : <LoginPage />}>
                    <Route index element={<Dashboard />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="customers/create" element={<CustomerMasterPage />} />
                    <Route path="customers/:id" element={<CustomerProfilePage />} />
                    <Route path="yatras" element={<YatraMasterPage />} />
                    <Route path="yatra-bookings" element={<YatraBookingPage />} />
                    <Route path="trips" element={<TripsPage />} />
                    <Route path="trips/:id" element={<TripDetailsPage />} />
                    <Route path="daily-reach" element={<DailyReach />} />
                    <Route path="do-not-reach" element={<DoNotReach />} />
                    <Route path="unsubscribed" element={<Unsubscribed />} />
                    <Route path="interests" element={<InterestMasterPage />} />
                    <Route path="campaigns" element={<CampaignsPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="automation" element={<AutomationPage />} />
                    <Route path="broadcast" element={<BroadcastPage />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="bulk-import" element={<BulkImportPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
