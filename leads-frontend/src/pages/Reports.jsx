import { useEffect, useState } from "react";
import {
  getReportStats,
  getEmployeeStats,
} from "../services/reportService";
import api from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function Reports() {
  const [report, setReport] = useState({
    totalMessages: 0,
    templateStats: [],
    recentMessages: [],
    recentActivity: [],
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
  const [campaignPerformance, setCampaignPerformance] = useState([]);
  const [templateStats, setTemplateStats] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [yatraRevenue, setYatraRevenue] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // ===== DATE RANGE FILTER =====
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ===== DARK MODE =====
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    loadAllData();
  }, [dateFrom, dateTo]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await loadReport();
      await loadEmployees();
      await loadCustomerStats();
      await loadInterestDistribution();
      await loadRevenueStats();
      await loadCampaignPerformance();
      await loadTemplateStats();
      await loadDailyActivity();
      await loadYatraRevenue();
      await loadCustomerGrowth();
    } catch (error) {
      console.error("Error loading data:", error);
      showMessage("Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const response = await api.get(`/reports?${params.toString()}`);
      const data = response.data || {};
      setReport({
        totalMessages: data.totalMessages || 0,
        templateStats: Array.isArray(data.templateStats) ? data.templateStats : [],
        recentMessages: Array.isArray(data.recentMessages) ? data.recentMessages : [],
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      });
    } catch (error) {
      console.error("Error loading report:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployeeStats();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading employees:", error);
      setEmployees([]);
    }
  };

  const loadCustomerStats = async () => {
    try {
      const [daily, doNot, unsub] = await Promise.all([
        api.get("/customers/group/Daily Reach"),
        api.get("/customers/group/Do Not Reach"),
        api.get("/customers/group/Unsubscribed"),
      ]);
      const dailyData = Array.isArray(daily.data) ? daily.data : [];
      const doNotData = Array.isArray(doNot.data) ? doNot.data : [];
      const unsubData = Array.isArray(unsub.data) ? unsub.data : [];
      const total = dailyData.length + doNotData.length + unsubData.length;
      setCustomerStats({
        total,
        dailyReach: dailyData.length,
        doNotReach: doNotData.length,
        unsubscribed: unsubData.length,
      });
    } catch (error) {
      console.error("Error loading customer stats:", error);
    }
  };

  const loadInterestDistribution = async () => {
    try {
      const response = await api.get("/reports/interest-distribution");
      const data = response.data;
      // Ensure data is an array
      if (Array.isArray(data)) {
        setInterestDistribution(data);
      } else {
        setInterestDistribution([]);
      }
    } catch (error) {
      console.error("Error loading interest distribution:", error);
      setInterestDistribution([]);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const response = await api.get(`/reports/revenue-stats?${params.toString()}`);
      const data = response.data || {};
      setRevenueStats({
        totalRevenue: data.totalRevenue || 0,
        totalBookings: data.totalBookings || 0,
        totalYatras: data.totalYatras || 0,
        totalTrips: data.totalTrips || 0,
      });
    } catch (error) {
      console.error("Error loading revenue stats:", error);
    }
  };

  const loadCampaignPerformance = async () => {
    try {
      const response = await api.get("/reports/campaign-performance");
      const data = response.data;
      if (Array.isArray(data)) {
        setCampaignPerformance(data);
      } else {
        setCampaignPerformance([]);
      }
    } catch (error) {
      console.error("Error loading campaign performance:", error);
      setCampaignPerformance([]);
    }
  };

  const loadTemplateStats = async () => {
    try {
      const response = await api.get("/reports/template-stats");
      const data = response.data;
      if (Array.isArray(data)) {
        setTemplateStats(data);
      } else {
        setTemplateStats([]);
      }
    } catch (error) {
      console.error("Error loading template stats:", error);
      setTemplateStats([]);
    }
  };

  const loadDailyActivity = async () => {
    try {
      const response = await api.get("/reports/daily-activity");
      const data = response.data;
      if (Array.isArray(data)) {
        setDailyActivity(data);
      } else {
        setDailyActivity([]);
      }
    } catch (error) {
      console.error("Error loading daily activity:", error);
      setDailyActivity([]);
    }
  };

  const loadYatraRevenue = async () => {
    try {
      const response = await api.get("/reports/yatras");
      const data = response.data;
      if (Array.isArray(data)) {
        setYatraRevenue(data);
      } else {
        setYatraRevenue([]);
      }
    } catch (error) {
      console.error("Error loading yatra revenue:", error);
      setYatraRevenue([]);
    }
  };

  const loadCustomerGrowth = async () => {
    try {
      const response = await api.get("/reports/customer-growth?months=6");
      const data = response.data;
      if (Array.isArray(data)) {
        setCustomerGrowth(data);
      } else {
        setCustomerGrowth([]);
      }
    } catch (error) {
      console.error("Error loading customer growth:", error);
      setCustomerGrowth([]);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const exportReport = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Customers', customerStats.total],
      ['Daily Reach', customerStats.dailyReach],
      ['Do Not Reach', customerStats.doNotReach],
      ['Unsubscribed', customerStats.unsubscribed],
      ['Total Yatras', revenueStats.totalYatras || 0],
      ['Total Bookings', revenueStats.totalBookings || 0],
      ['Total Revenue', `₹${revenueStats.totalRevenue || 0}`],
      ['Total Trips', revenueStats.totalTrips || 0],
      ['Total Messages', report.totalMessages || 0],
    ];

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    if (interestDistribution.length > 0) {
      csv += '\n\nInterest Distribution\n';
      csv += 'Interest,Customers,Percentage\n';
      interestDistribution.forEach(item => {
        csv += `${item.interest_name || 'Unknown'},${item.count || 0},${item.percentage || 0}%\n`;
      });
    }

    if (campaignPerformance.length > 0) {
      csv += '\n\nCampaign Performance\n';
      csv += 'Campaign,Status,Recipients\n';
      campaignPerformance.forEach(c => {
        csv += `${c.campaign_name},${c.status},${c.total_recipients || 0}\n`;
      });
    }

    if (yatraRevenue.length > 0) {
      csv += '\n\nRevenue by Yatra\n';
      csv += 'Yatra,Bookings,Revenue,Average\n';
      yatraRevenue.forEach(y => {
        csv += `${y.yatra_name},${y.bookings || 0},₹${y.revenue || 0},₹${Math.round(y.avg_amount || 0)}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage("📥 Report exported successfully!", "success");
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ===== CHART DATA =====
  const getBarChartColors = () => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(168, 85, 247, 0.8)',
    ];
    return colors;
  };

  const getChartColors = () => {
    return {
      border: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
      grid: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    };
  };

  const chartColors = getChartColors();

  // Customer Distribution Pie Chart
  const customerDistributionData = {
    labels: ['Daily Reach', 'Do Not Reach', 'Unsubscribed'],
    datasets: [{
      data: [customerStats.dailyReach, customerStats.doNotReach, customerStats.unsubscribed],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(107, 114, 128, 0.8)'],
      borderColor: ['rgb(59, 130, 246)', 'rgb(239, 68, 68)', 'rgb(107, 114, 128)'],
      borderWidth: 2,
    }]
  };

  // Revenue by Yatra Bar Chart
  const yatraRevenueData = {
    labels: yatraRevenue.slice(0, 10).map(y => y.yatra_name?.substring(0, 20) || 'Unknown'),
    datasets: [{
      label: 'Revenue (₹)',
      data: yatraRevenue.slice(0, 10).map(y => y.revenue || 0),
      backgroundColor: getBarChartColors(),
      borderColor: 'rgba(255,255,255,0.5)',
      borderWidth: 1,
    }]
  };

  // Interest Distribution Doughnut Chart
  const interestChartData = {
    labels: interestDistribution.slice(0, 8).map(i => i.interest_name || 'Unknown'),
    datasets: [{
      data: interestDistribution.slice(0, 8).map(i => i.count || 0),
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(14, 165, 233, 0.8)', 'rgba(168, 85, 247, 0.8)'],
      borderColor: 'rgba(255,255,255,0.5)',
      borderWidth: 2,
    }]
  };

  // Customer Growth Line Chart
  const growthData = {
    labels: customerGrowth.map(g => g.month ? formatDate(g.month + '-01') : ''),
    datasets: [{
      label: 'New Customers',
      data: customerGrowth.map(g => g.new_customers || 0),
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      pointBackgroundColor: 'rgb(59, 130, 246)',
    }]
  };

  return (
    <div className={`space-y-6 p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">📊 Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Complete business analytics dashboard</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            📥 Export Report
          </button>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-4 py-2 rounded-lg transition dark:text-white disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">📅 Date Range:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear
          </button>
          {(dateFrom || dateTo) && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {dateFrom ? `From: ${formatDate(dateFrom)}` : ''}
              {dateFrom && dateTo ? ' | ' : ''}
              {dateTo ? `To: ${formatDate(dateTo)}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Customers</p>
          <p className="text-2xl font-bold dark:text-white">{customerStats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Daily Reach</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{customerStats.dailyReach}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Do Not Reach</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{customerStats.doNotReach}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Unsubscribed</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{customerStats.unsubscribed}</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">₹{revenueStats.totalRevenue || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Bookings</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{revenueStats.totalBookings || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Yatras</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{revenueStats.totalYatras || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Trips</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{revenueStats.totalTrips || 0}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">👥 Customer Distribution</h2>
          {customerStats.total > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Pie 
                data={customerDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: isDarkMode ? '#e5e7eb' : '#1f2937',
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">🎯 Top Interests</h2>
          {interestDistribution.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={interestChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: isDarkMode ? '#e5e7eb' : '#1f2937',
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No interest data available</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">💰 Revenue by Yatra</h2>
          {yatraRevenue.length > 0 ? (
            <div className="h-64">
              <Bar 
                data={yatraRevenueData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: chartColors.grid,
                      }
                    },
                    x: {
                      ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: chartColors.grid,
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No yatra revenue data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📈 Customer Growth (6 Months)</h2>
          {customerGrowth.length > 0 ? (
            <div className="h-64">
              <Line 
                data={growthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: chartColors.grid,
                      }
                    },
                    x: {
                      ticks: {
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: chartColors.grid,
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No growth data available</p>
          )}
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📈 Campaign Performance</h2>
        {campaignPerformance.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No campaign data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Campaign</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {campaignPerformance.map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-white">{campaign.campaign_name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600 dark:text-gray-300">{campaign.total_recipients || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue by Yatra Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">💰 Revenue Breakdown by Yatra</h2>
        {yatraRevenue.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No yatra revenue data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Yatra Name</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Bookings</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {yatraRevenue.map((yatra, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-white font-medium">{yatra.yatra_name}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600 dark:text-gray-300">{yatra.bookings || 0}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-green-600 dark:text-green-400">₹{yatra.revenue || 0}</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-300">₹{Math.round(yatra.avg_amount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">🔄 Recent Activity</h2>
        {report.recentActivity?.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {report.recentActivity?.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-800 dark:text-white">{activity.activity}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">👤 {activity.username || 'Unknown'}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(activity.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
