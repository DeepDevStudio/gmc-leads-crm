import { useEffect, useState } from "react";
import axios from "axios";
import {
  getReportStats,
  getEmployeeStats,
} from "../services/reportService";

function Reports() {
  const [report, setReport] = useState({
    totalMessages: 0,
    templateStats: [],
    recentMessages: [],
  });

  const [employees, setEmployees] = useState([]);
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    dailyReach: 0,
    doNotReach: 0,
    unsubscribed: 0,
  });
  const [interestDistribution, setInterestDistribution] = useState([]);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalYatras: 0,
    totalTrips: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
    loadEmployees();
    loadCustomerStats();
    loadInterestDistribution();
    loadRevenueStats();
  }, []);

  const loadReport = async () => {
    try {
      const data = await getReportStats();
      setReport(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployeeStats();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCustomerStats = async () => {
    try {
      const [daily, doNot, unsub] = await Promise.all([
        axios.get("/api/customers/group/daily-reach"),
        axios.get("/api/customers/group/do-not-reach"),
        axios.get("/api/customers/group/unsubscribed"),
      ]);
      const total = daily.data.length + doNot.data.length + unsub.data.length;
      setCustomerStats({
        total,
        dailyReach: daily.data.length,
        doNotReach: doNot.data.length,
        unsubscribed: unsub.data.length,
      });
    } catch (error) {
      console.error("Error loading customer stats:", error);
    }
  };

  const loadInterestDistribution = async () => {
    try {
      const response = await axios.get("/api/reports/interest-distribution");
      setInterestDistribution(response.data);
    } catch (error) {
      console.error("Error loading interest distribution:", error);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const response = await axios.get("/api/reports/revenue-stats");
      setRevenueStats(response.data);
    } catch (error) {
      console.error("Error loading revenue stats:", error);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">📊 Reports</h1>
        <p className="text-gray-500 mt-2">Complete business analytics dashboard</p>
      </div>

      {/* Customer Summary Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">👥 Customer Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Customers</p>
            <h2 className="text-4xl font-bold text-blue-600">{customerStats.total}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">📧 Daily Reach</p>
            <h2 className="text-4xl font-bold text-green-600">{customerStats.dailyReach}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">🚫 Do Not Reach</p>
            <h2 className="text-4xl font-bold text-red-600">{customerStats.doNotReach}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">📤 Unsubscribed</p>
            <h2 className="text-4xl font-bold text-gray-600">{customerStats.unsubscribed}</h2>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">💰 Revenue Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h2 className="text-4xl font-bold text-yellow-600">
              ₹{revenueStats.totalRevenue.toLocaleString()}
            </h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <h2 className="text-4xl font-bold text-purple-600">{revenueStats.totalBookings}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Yatras</p>
            <h2 className="text-4xl font-bold text-indigo-600">{revenueStats.totalYatras}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Trips</p>
            <h2 className="text-4xl font-bold text-orange-600">{revenueStats.totalTrips}</h2>
          </div>
        </div>
      </div>

      {/* Interest Distribution */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">🏷️ Interest Distribution</h2>
          <p className="text-gray-500 text-sm">Number of customers interested in each package</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <th className="p-3 text-left text-sm font-medium">Interest</th>
                <th className="p-3 text-left text-sm font-medium">Customers</th>
                <th className="p-3 text-left text-sm font-medium">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {interestDistribution.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">
                    No interest data available
                  </td>
                </tr>
              ) : (
                interestDistribution.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-800">{item.interest_name}</td>
                    <td className="p-3 font-bold text-gray-700">{item.count}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{item.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Analytics */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📱 WhatsApp Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Total Messages Sent</p>
            <h2 className="text-4xl font-bold text-yellow-500">{report.totalMessages}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Templates Used</p>
            <h2 className="text-4xl font-bold text-green-600">{report.templateStats.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">Recent Messages</p>
            <h2 className="text-4xl font-bold text-blue-600">{report.recentMessages.length}</h2>
          </div>
        </div>
      </div>

      {/* Template Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">📝 Template Performance</h2>
          <p className="text-gray-500 text-sm">Most used templates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <th className="p-3 text-left text-sm font-medium">Template</th>
                <th className="p-3 text-left text-sm font-medium">Messages Sent</th>
                <th className="p-3 text-left text-sm font-medium">Usage %</th>
              </tr>
            </thead>
            <tbody>
              {report.templateStats.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">
                    No template data available
                  </td>
                </tr>
              ) : (
                report.templateStats.map((item, index) => {
                  const percentage = report.totalMessages > 0 
                    ? Math.round((item.total / report.totalMessages) * 100) 
                    : 0;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">{item.template_name}</td>
                      <td className="p-3 font-bold text-gray-700">{item.total}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">👨‍💼 Employee Performance</h2>
          <p className="text-gray-500 text-sm">Activities by team members</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <th className="p-3 text-left text-sm font-medium">Employee</th>
                <th className="p-3 text-left text-sm font-medium">Activities</th>
                <th className="p-3 text-left text-sm font-medium">Activity %</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">
                    No employee data available
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => {
                  const totalActivities = employees.reduce((sum, e) => sum + (e.total || 0), 0);
                  const percentage = totalActivities > 0 
                    ? Math.round((employee.total / totalActivities) * 100) 
                    : 0;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">{employee.username}</td>
                      <td className="p-3 font-bold text-gray-700">{employee.total}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">📨 Recent Messages</h2>
          <p className="text-gray-500 text-sm">Latest WhatsApp messages sent</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <th className="p-3 text-left text-sm font-medium">Customer</th>
                <th className="p-3 text-left text-sm font-medium">Mobile</th>
                <th className="p-3 text-left text-sm font-medium">Template</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.recentMessages.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No recent messages found
                  </td>
                </tr>
              ) : (
                report.recentMessages.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-800">{item.customer_name}</td>
                    <td className="p-3 text-gray-600">{item.mobile_number}</td>
                    <td className="p-3 text-gray-600">{item.template_name}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === "Sent" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
