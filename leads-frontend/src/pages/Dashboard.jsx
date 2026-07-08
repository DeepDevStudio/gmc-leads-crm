import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardStats, getWeeklyTrend } from "../services/dashboardService";
import { getActivities } from "../services/activityService";
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
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FaPlus, FaBell, FaTimes } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    dailyReach: 0,
    doNotReach: 0,
    unsubscribed: 0,
    templates: 0,
    activities: 0,
    messages: 0,
    totalYatras: 0,
    totalBookings: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [trendData, setTrendData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Activities',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({
    today: 0,
    week: 0,
    month: 0,
  });

  // ===== NOTIFICATIONS =====
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // ===== QUICK ACTIONS =====
  const [showQuickActions, setShowQuickActions] = useState(false);

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
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning ☀️');
    else if (hour < 17) setGreeting('Good Afternoon 🌤️');
    else setGreeting('Good Evening 🌙');

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    loadData();
    loadNotifications();
    loadRecentCampaigns();
    loadRevenueSummary();
    const dataInterval = setInterval(loadData, 60000);
    const notificationInterval = setInterval(loadNotifications, 30000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
      clearInterval(notificationInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData, trendData] = await Promise.all([
        getDashboardStats(),
        getActivities(),
        getWeeklyTrend().catch(() => null),
      ]);
      
      // Safely set stats with fallback values
      setStats({
        totalCustomers: statsData?.totalCustomers || 0,
        dailyReach: statsData?.dailyReach || 0,
        doNotReach: statsData?.doNotReach || 0,
        unsubscribed: statsData?.unsubscribed || 0,
        templates: statsData?.templates || 0,
        activities: statsData?.activities || 0,
        messages: statsData?.messages || 0,
        totalYatras: statsData?.totalYatras || 0,
        totalBookings: statsData?.totalBookings || 0,
      });
      
      setActivities(Array.isArray(activitiesData) ? activitiesData.slice(0, 6) : []);
      
      if (trendData && typeof trendData === 'object') {
        const labels = Array.isArray(trendData.labels) ? trendData.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = Array.isArray(trendData.data) ? trendData.data : [0, 0, 0, 0, 0, 0, 0];
        
        setTrendData({
          labels: labels,
          datasets: [
            {
              label: 'Activities',
              data: data,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#6366f1',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        });
      }
      
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.get('/activity?limit=10');
      const data = response.data || [];
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      const unread = notificationsArray.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadRecentCampaigns = async () => {
    try {
      const response = await api.get('/campaigns?limit=5');
      const data = response.data || [];
      setRecentCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading recent campaigns:', error);
      setRecentCampaigns([]);
    }
  };

  const loadRevenueSummary = async () => {
    try {
      const response = await api.get('/reports/revenue-stats');
      const data = response.data || {};
      setRevenueSummary({
        today: data.today || 0,
        week: data.week || 0,
        month: data.month || 0,
      });
    } catch (error) {
      console.error('Error loading revenue summary:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    if (!notif.read) {
      api.patch(`/activity/${notif.id}/read`).catch(console.error);
    }
    if (notif.activity && notif.activity.includes('Customer')) {
      navigate('/customers');
    } else if (notif.activity && notif.activity.includes('Trip')) {
      navigate('/trips');
    } else if (notif.activity && notif.activity.includes('Yatra')) {
      navigate('/yatras');
    } else if (notif.activity && notif.activity.includes('Broadcast')) {
      navigate('/broadcast');
    } else {
      navigate('/activity');
    }
  };

  // ===== FIXED: formatTimeAgo with null checking =====
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diff = Math.floor((now - date) / (1000 * 60));
      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
      if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Just now';
    }
  };

  // ===== FIXED: Safe number formatting =====
  const safeFormat = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const customerDistributionData = {
    labels: ['Daily Reach', 'Do Not Reach', 'Unsubscribed'],
    datasets: [
      {
        data: [stats.dailyReach || 0, stats.doNotReach || 0, stats.unsubscribed || 0],
        backgroundColor: ['#10b981', '#ef4444', '#6b7280'],
        borderWidth: 0,
      },
    ],
  };

  const activityData = {
    labels: ['Customers', 'Templates', 'Messages', 'Yatras', 'Bookings'],
    datasets: [
      {
        label: 'Count',
        data: [
          stats.totalCustomers || 0, 
          stats.templates || 0, 
          stats.messages || 0, 
          stats.totalYatras || 0, 
          stats.totalBookings || 0
        ],
        backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'],
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 11 },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: { size: 11 },
        },
      },
    },
    cutout: '70%',
  };

  const exportDashboard = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Customers', safeFormat(stats.totalCustomers)],
      ['Daily Reach', safeFormat(stats.dailyReach)],
      ['Do Not Reach', safeFormat(stats.doNotReach)],
      ['Unsubscribed', safeFormat(stats.unsubscribed)],
      ['Total Activities', safeFormat(stats.activities)],
      ['Messages Sent', safeFormat(stats.messages)],
      ['Total Yatras', safeFormat(stats.totalYatras)],
      ['Total Bookings', safeFormat(stats.totalBookings)],
      ['Templates', safeFormat(stats.templates)],
      ['Revenue Today', `₹${safeFormat(revenueSummary.today)}`],
      ['Revenue This Week', `₹${safeFormat(revenueSummary.week)}`],
      ['Revenue This Month', `₹${safeFormat(revenueSummary.month)}`],
      ['Generated On', new Date().toLocaleString()],
    ];

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const quickActions = [
    { label: 'Add Customer', path: '/customers/create', icon: '👤', color: 'blue' },
    { label: 'Create Trip', path: '/trips', icon: '🚌', color: 'green' },
    { label: 'New Yatra', path: '/yatras', icon: '🗺️', color: 'purple' },
    { label: 'Send Broadcast', path: '/broadcast', icon: '📢', color: 'orange' },
    { label: 'Bulk Import', path: '/bulk-import', icon: '📤', color: 'teal' },
    { label: 'Create Campaign', path: '/campaigns', icon: '📊', color: 'pink' },
  ];

  const handleQuickAction = (path) => {
    setShowQuickActions(false);
    navigate(path);
  };

  // ===== FIXED: Safe notification date display =====
  const formatNotificationDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Just now';
    }
  };

  if (loading && !stats.totalCustomers) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDarkMode ? 'dark' : ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {greeting} 👋
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentTime} • Last updated: {lastUpdated || 'Just now'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportDashboard}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            📥 Export
          </button>
          <button
            onClick={loadData}
            className={`px-4 py-2 rounded-lg transition text-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
          {error}
          <button
            onClick={loadData}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-green-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Today's Revenue</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{safeFormat(revenueSummary.today)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-blue-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>This Week</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{safeFormat(revenueSummary.week)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-purple-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>This Month</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{safeFormat(revenueSummary.month)}</p>
        </div>
      </div>

      {/* Stats Cards - USING FIXED safeFormat */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-blue-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Customers</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{safeFormat(stats.totalCustomers)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Daily Reach</p>
          <p className="text-2xl font-bold text-green-600">{safeFormat(stats.dailyReach)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-red-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Do Not Reach</p>
          <p className="text-2xl font-bold text-red-600">{safeFormat(stats.doNotReach)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-gray-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Unsubscribed</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{safeFormat(stats.unsubscribed)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-yellow-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Messages Sent</p>
          <p className="text-2xl font-bold text-yellow-600">{safeFormat(stats.messages)}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-4 border-l-4 border-purple-500 hover:shadow-lg transition`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Yatra Bookings</p>
          <p className="text-2xl font-bold text-purple-600">{safeFormat(stats.totalBookings)}</p>
        </div>
      </div>

      {/* Notifications Bell */}
      <div className="relative" ref={notificationRef}>
        <button
          className={`relative p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell className={`${isDarkMode ? 'text-slate-300' : 'text-gray-600'} text-lg`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <div className={`absolute right-0 mt-2 w-80 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border py-1 z-50 max-h-96 overflow-y-auto`}>
            <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No notifications</p>
            ) : (
              notifications.map((notif, index) => (
                <div 
                  key={index} 
                  className={`px-4 py-2 ${isDarkMode ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-gray-50 border-gray-100'} border-b last:border-0 cursor-pointer transition-colors`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{notif.activity || notif.message || 'Notification'}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'} mt-0.5`}>
                    {formatNotificationDate(notif.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>📊 Customer Distribution</h3>
          <div className="h-64">
            <Doughnut data={customerDistributionData} options={doughnutOptions} />
          </div>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>📈 Weekly Activity Trend</h3>
          <div className="h-64">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>📊 Overall Statistics</h3>
          <div className="h-64">
            <Bar data={activityData} options={chartOptions} />
          </div>
        </div>
        {/* Recent Campaigns */}
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📢 Recent Campaigns</h3>
            <Link to="/campaigns" className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              View All →
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-center py-4`}>No campaigns yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentCampaigns.map((campaign, index) => (
                <div key={index} className={`flex items-center justify-between p-2 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg`}>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{campaign.campaign_name || 'Unnamed Campaign'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      campaign.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      campaign.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {campaign.status || 'Draft'}
                    </span>
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    {campaign.total_recipients || 0} recipients
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🔄 Recent Activity</h3>
          <Link to="/activity" className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View All →
          </Link>
        </div>
        {activities.length === 0 ? (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-center py-4`}>No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                    {activity.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{activity.activity || 'Activity'}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>👤 {activity.username || 'Unknown'}</p>
                  </div>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formatTimeAgo(activity.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 text-center`}>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Yatras</span>
          <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{safeFormat(stats.totalYatras)}</span>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 text-center`}>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Bookings</span>
          <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">{safeFormat(stats.totalBookings)}</span>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 text-center`}>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Activities</span>
          <span className="block text-lg font-bold text-yellow-600 dark:text-yellow-400">{safeFormat(stats.activities)}</span>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 text-center`}>
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Templates</span>
          <span className="block text-lg font-bold text-green-600 dark:text-green-400">{safeFormat(stats.templates)}</span>
        </div>
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative">
          {showQuickActions && (
            <div className="absolute bottom-16 right-0 space-y-2 animate-fadeIn">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.path)}
                  className={`w-48 flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                    action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    action.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                    action.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    action.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                    action.color === 'teal' ? 'bg-teal-600 hover:bg-teal-700' :
                    'bg-pink-600 hover:bg-pink-700'
                  }`}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110 ${
              showQuickActions 
                ? 'bg-red-500 hover:bg-red-600 rotate-45' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
            } text-white`}
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
