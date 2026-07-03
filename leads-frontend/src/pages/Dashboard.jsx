import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../services/dashboardService";
import { getActivities } from "../services/activityService";
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
    const dataInterval = setInterval(loadData, 30000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        getDashboardStats(),
        getActivities(),
      ]);
      setStats(statsData);
      setActivities(activitiesData.slice(0, 6));
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const customerDistributionData = {
    labels: ['Daily Reach', 'Do Not Reach', 'Unsubscribed'],
    datasets: [
      {
        data: [stats.dailyReach, stats.doNotReach, stats.unsubscribed],
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
        data: [stats.totalCustomers, stats.templates, stats.messages, stats.totalYatras, stats.totalBookings],
        backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'],
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Activities',
        data: [12, 19, 15, 22, 28, 18, 24],
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
          padding: 15,
          font: { size: 10, weight: '500' },
          color: '#64748b',
        },
      },
    },
  };

  const getActivityBadge = (activity) => {
    const text = activity?.toLowerCase() || '';
    if (text.includes('created') || text.includes('add')) return 'Created';
    if (text.includes('updated') || text.includes('edited')) return 'Updated';
    if (text.includes('deleted') || text.includes('removed')) return 'Deleted';
    if (text.includes('sent') || text.includes('broadcast')) return 'Sent';
    if (text.includes('login')) return 'Login';
    if (text.includes('logout')) return 'Logout';
    return 'Action';
  };

  const getBadgeColor = (activity) => {
    const text = activity?.toLowerCase() || '';
    if (text.includes('created') || text.includes('add')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (text.includes('updated') || text.includes('edited')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (text.includes('deleted') || text.includes('removed')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (text.includes('sent') || text.includes('broadcast')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (text.includes('login')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (text.includes('logout')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 p-4 md:p-6">
      {/* Animated Background */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-40 left-1/4 w-48 h-48 bg-pink-200/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="max-w-7xl mx-auto space-y-5 relative z-10">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-200/50 animate-pulse">
                📊
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                  {greeting}
                </h1>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-white/50 flex items-center gap-2 w-full md:w-auto justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-xs text-slate-600">{currentTime}</span>
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  '⟳ Refresh'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Premium Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Customers", value: stats.totalCustomers, icon: "👥", change: "+12%", gradient: "from-indigo-500 to-indigo-600" },
            { title: "Daily Reach", value: stats.dailyReach, icon: "📧", change: "+8%", gradient: "from-emerald-500 to-emerald-600" },
            { title: "Templates", value: stats.templates, icon: "📝", change: "+3", gradient: "from-violet-500 to-violet-600" },
            { title: "Messages Sent", value: stats.messages, icon: "💬", change: "+45%", gradient: "from-cyan-500 to-cyan-600" },
          ].map((item, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-br ${item.gradient} rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-2xl opacity-90 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    {item.change}
                  </span>
                </div>
                <p className="text-3xl font-bold mt-3 tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-white/20 rounded animate-pulse"></span>
                  ) : (
                    item.value
                  )}
                </p>
                <p className="text-white/80 text-xs mt-0.5 font-medium uppercase tracking-wider">{item.title}</p>
                <div className="mt-3 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-white/50 rounded-full animate-pulse"
                    style={{ width: `${65 + index * 7}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-yellow-200/50 animate-bounce">
              ⚡
            </div>
            <h2 className="text-base font-bold text-slate-700">Quick Actions</h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              { to: "/customers", label: "Add Customer", color: "from-yellow-400 to-yellow-500", icon: "👤" },
              { to: "/templates", label: "Create Template", color: "from-slate-700 to-slate-800", icon: "📄" },
              { to: "/automation", label: "Run Automation", color: "from-emerald-400 to-emerald-500", icon: "⚙️" },
              { to: "/broadcast", label: "Send Broadcast", color: "from-violet-400 to-violet-500", icon: "📱" },
              { to: "/reports", label: "View Reports", color: "from-orange-400 to-orange-500", icon: "📈" },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={`group relative overflow-hidden bg-gradient-to-r ${action.color} px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>{action.icon}</span>
                  {action.label}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Group Distribution + Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <span className="text-lg">📊</span> Customer Distribution
              <span className="text-xs text-slate-400 ml-2">Total: {stats.totalCustomers}</span>
            </h3>
            {[
              { title: "Daily Reach", value: stats.dailyReach, color: "emerald", icon: "✅", bg: "bg-emerald-50" },
              { title: "Do Not Reach", value: stats.doNotReach, color: "rose", icon: "⛔", bg: "bg-rose-50" },
              { title: "Unsubscribed", value: stats.unsubscribed, color: "gray", icon: "📤", bg: "bg-slate-50" },
            ].map((item) => (
              <div key={item.title} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center text-2xl`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`text-xl font-bold text-${item.color}-600`}>
                        {loading ? (
                          <span className="inline-block w-12 h-6 bg-slate-200 rounded animate-pulse"></span>
                        ) : (
                          item.value
                        )}
                      </p>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {stats.totalCustomers > 0 ? Math.round((item.value / stats.totalCustomers) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{item.title}</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 bg-${item.color}-500`}
                    style={{ width: `${stats.totalCustomers > 0 ? (item.value / stats.totalCustomers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Activity Overview</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">30 days</span>
              </div>
              <div className="h-36">
                <Bar data={activityData} options={{
                  ...chartOptions,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                  },
                }} />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Weekly Trend</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">This week</span>
              </div>
              <div className="h-28">
                <Line data={trendData} options={{
                  ...chartOptions,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                  },
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
                📋
              </div>
              <h2 className="text-base font-bold text-slate-700">Recent Activities</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">{activities.length}</span>
            </div>
            <Link to="/activity" className="text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1 hover:gap-2">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-3 bg-slate-100 rounded w-48 mt-1"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">No recent activities</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 transition-all duration-200 border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    {item.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700">{item.username}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getBadgeColor(item.activity)}`}>
                        {getActivityBadge(item.activity)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{item.activity}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Premium */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
          <div className="text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} GMC Leads CRM — All rights reserved</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                System Online
              </span>
              <span className="text-slate-300">|</span>
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-semibold">v3.0</span>
              <span className="text-slate-300">|</span>
              <span>⚡ Powered by GMC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
