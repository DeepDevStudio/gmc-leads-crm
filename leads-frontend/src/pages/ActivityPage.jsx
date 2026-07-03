import { useEffect, useState } from "react";
import { getActivities } from "../services/activityService";
import axios from "axios";
import {
  FaSearch,
  FaUserTag,
  FaUsers,
  FaChartLine,
  FaTimes,
  FaEye,
  FaUserCheck,
  FaUserClock,
  FaSortAmountDown,
  FaSortAmountUp,
  FaPhone,
} from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";

function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [userActivityCounts, setUserActivityCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sortBy, setSortBy] = useState("count");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const activityData = await getActivities();
      setActivities(activityData);

      const userResponse = await axios.get('/api/users');
      const usersList = userResponse.data;
      setUsers(usersList);

      const roles = {};
      const details = {};
      usersList.forEach(user => {
        roles[user.username] = user.role || 'employee';
        details[user.username] = {
          full_name: user.full_name || user.username,
          whatsapp_number: user.whatsapp_number || 'N/A',
          role: user.role || 'employee',
          created_at: user.created_at,
          is_active: user.is_active,
        };
      });
      setUserRoles(roles);
      setUserDetails(details);

      const counts = {};
      activityData.forEach(item => {
        if (item.username) {
          counts[item.username] = (counts[item.username] || 0) + 1;
        }
      });
      setUserActivityCounts(counts);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(user =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)
      );
    }

    if (filterRole) {
      result = result.filter(user => (user.role || 'employee') === filterRole);
    }

    if (sortBy === "count") {
      result.sort((a, b) => {
        const countA = userActivityCounts[a.username] || 0;
        const countB = userActivityCounts[b.username] || 0;
        return sortOrder === "desc" ? countB - countA : countA - countB;
      });
    } else if (sortBy === "name") {
      result.sort((a, b) => {
        const nameA = (a.full_name || a.username).toLowerCase();
        const nameB = (b.full_name || b.username).toLowerCase();
        return sortOrder === "desc" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      });
    }

    setFilteredUsers(result);
  }, [search, filterRole, users, userActivityCounts, sortBy, sortOrder]);

  const getUserActivities = (username) => {
    return activities.filter(item => item.username === username);
  };

  const getUserStats = (username) => {
    const userActivities = getUserActivities(username);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCount = userActivities.filter(item => new Date(item.created_at) >= today).length;
    const weekCount = userActivities.filter(item => new Date(item.created_at) >= weekStart).length;
    const monthCount = userActivities.filter(item => new Date(item.created_at) >= monthStart).length;

    const created = userActivities.filter(item => 
      item.activity?.toLowerCase().includes('created') || 
      item.activity?.toLowerCase().includes('add')
    ).length;
    const updated = userActivities.filter(item => 
      item.activity?.toLowerCase().includes('updated') || 
      item.activity?.toLowerCase().includes('edited')
    ).length;
    const deleted = userActivities.filter(item => 
      item.activity?.toLowerCase().includes('deleted') || 
      item.activity?.toLowerCase().includes('removed')
    ).length;
    const sent = userActivities.filter(item => 
      item.activity?.toLowerCase().includes('sent') || 
      item.activity?.toLowerCase().includes('broadcast')
    ).length;

    return {
      total: userActivities.length,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      created,
      updated,
      deleted,
      sent
    };
  };

  const getRoleBadge = (role) => {
    const map = {
      'admin': { label: 'Admin', color: 'bg-gradient-to-r from-red-500 to-red-600', icon: '👑' },
      'manager': { label: 'Manager', color: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '📊' },
      'employee': { label: 'Employee', color: 'bg-gradient-to-r from-slate-500 to-slate-600', icon: '👤' }
    };
    return map[role] || map['employee'];
  };

  const getActivityType = (activity) => {
    const text = activity?.toLowerCase() || '';
    const types = [
      { keywords: ['created', 'add'], label: 'Created', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
      { keywords: ['updated', 'edited'], label: 'Updated', color: 'bg-blue-100 text-blue-700', icon: '📝' },
      { keywords: ['deleted', 'removed'], label: 'Deleted', color: 'bg-rose-100 text-rose-700', icon: '🗑️' },
      { keywords: ['sent', 'broadcast'], label: 'Sent', color: 'bg-purple-100 text-purple-700', icon: '📤' },
      { keywords: ['login'], label: 'Login', color: 'bg-indigo-100 text-indigo-700', icon: '🔐' },
      { keywords: ['logout'], label: 'Logout', color: 'bg-slate-100 text-slate-600', icon: '🚪' },
    ];
    const match = types.find(t => t.keywords.some(k => text.includes(k)));
    return match || { label: 'Activity', color: 'bg-slate-100 text-slate-600', icon: '📋' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openUserProfile = (username) => {
    setSelectedUser(username);
    setShowProfileModal(true);
  };

  const closeUserProfile = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterRole("");
    setSortBy("count");
    setSortOrder("desc");
  };

  const totalUsers = users.length;
  const totalActivities = activities.length;
  const activeUsers = users.filter(u => userActivityCounts[u.username] > 0).length;

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: <FaUsers />, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Total Activities', value: totalActivities, icon: <FaChartLine />, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Active Users', value: activeUsers, icon: <FaUserCheck />, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Inactive Users', value: totalUsers - activeUsers, icon: <FaUserClock />, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', text: 'text-slate-600' },
  ];

  // User Profile Modal Component
  const UserProfileModal = () => {
    if (!selectedUser) return null;
    const userData = userDetails[selectedUser] || {};
    const stats = getUserStats(selectedUser);
    const userActivities = getUserActivities(selectedUser)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const role = getRoleBadge(userData.role || 'employee');
    const recentActivities = userActivities.slice(0, 20);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || selectedUser)}&background=random&size=120&bold=true`;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
            <button
              onClick={closeUserProfile}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 rounded-full hover:bg-white/10"
            >
              <FaTimes className="text-xl" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={userData.full_name}
                  className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white/30 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                  {stats.total > 0 ? (
                    <span className="w-3 h-3 bg-emerald-500 rounded-full block animate-pulse"></span>
                  ) : (
                    <span className="w-3 h-3 bg-slate-300 rounded-full block"></span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{userData.full_name || selectedUser}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium text-white ${role.color}`}>
                    {role.icon} {role.label}
                  </span>
                  <span className="text-white/60 text-sm">@{selectedUser}</span>
                  {userData.whatsapp_number && userData.whatsapp_number !== 'N/A' && (
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <FaPhone className="text-xs" /> {userData.whatsapp_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center border border-blue-200/50">
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Today</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center border border-purple-200/50">
              <p className="text-2xl font-bold text-purple-600">{stats.week}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">This Week</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 text-center border border-yellow-200/50">
              <p className="text-2xl font-bold text-yellow-600">{stats.month}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">This Month</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 text-center border border-emerald-200/50">
              <p className="text-2xl font-bold text-emerald-600">{stats.total}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total</p>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">📊 Activity Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200/50">
                <p className="text-lg font-bold text-emerald-600">{stats.created}</p>
                <p className="text-[10px] text-slate-500 font-medium">Created</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200/50">
                <p className="text-lg font-bold text-blue-600">{stats.updated}</p>
                <p className="text-[10px] text-slate-500 font-medium">Updated</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-200/50">
                <p className="text-lg font-bold text-rose-600">{stats.deleted}</p>
                <p className="text-[10px] text-slate-500 font-medium">Deleted</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200/50">
                <p className="text-lg font-bold text-purple-600">{stats.sent}</p>
                <p className="text-[10px] text-slate-500 font-medium">Sent</p>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">🕐 Recent Activities ({userActivities.length})</h3>
            {recentActivities.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No activities found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {recentActivities.map((item) => {
                  const type = getActivityType(item.activity);
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${type.color}`}>
                        {type.icon} {type.label}
                      </span>
                      <span className="text-sm text-slate-600 flex-1 truncate">{item.activity}</span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(item.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // User Card Component with Profile Pic
  const UserCard = ({ user }) => {
    const username = user.username;
    const stats = getUserStats(username);
    const role = getRoleBadge(user.role || 'employee');
    const isActive = stats.total > 0;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || username)}&background=random&size=50&bold=true`;

    return (
      <div
        onClick={() => openUserProfile(username)}
        className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={user.full_name}
              className="w-12 h-12 rounded-xl shadow-md object-cover"
            />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 truncate">
                {user.full_name || user.username}
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${role.color} ml-2`}>
                {role.icon} {role.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">@{user.username}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-medium text-slate-600">
                📊 {stats.total}
              </span>
              <span className="text-xs text-slate-400">
                📅 {stats.today} today
              </span>
              <span className="text-xs text-slate-400">
                📆 {stats.week} this week
              </span>
            </div>
          </div>
          <FaEye className="text-slate-300 group-hover:text-indigo-500 transition text-sm mt-1 opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              👥
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Activity Tracker</h1>
              <p className="text-white/70 text-sm">Monitor and track all user activities across the system</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <HiOutlineRefresh className="text-base" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} rounded-xl border border-white/50 shadow-sm p-3.5 hover:shadow-md transition-all hover:-translate-y-0.5`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-white/80 shadow-sm flex items-center justify-center ${stat.text}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.text}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-yellow-500 transition" />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition placeholder:text-slate-400"
            />
          </div>
          <div className="relative group">
            <FaUserTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-yellow-500 transition" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none appearance-none transition"
            >
              <option value="">All Roles</option>
              <option value="admin">👑 Admin</option>
              <option value="manager">📊 Manager</option>
              <option value="employee">👤 Employee</option>
            </select>
          </div>
          <div className="relative group">
            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-yellow-500 transition" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none appearance-none transition"
            >
              <option value="count">Sort by Activity</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 transition flex items-center justify-center gap-2"
            >
              {sortOrder === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
              {sortOrder === "desc" ? "Desc" : "Asc"}
            </button>
            {(search || filterRole || sortBy !== "count" || sortOrder !== "desc") && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-sm font-medium transition flex items-center gap-1"
              >
                <FaTimes className="text-xs" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-yellow-500"></div>
          <p className="text-slate-400 text-sm mt-3">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-slate-600 font-medium text-lg">No users found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && <UserProfileModal />}
    </div>
  );
}

export default ActivityPage;
