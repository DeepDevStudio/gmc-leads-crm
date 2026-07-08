import { useEffect, useState } from "react";
import { getActivities } from "../services/activityService";
import api from "../services/api";
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
  FaFilter,
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
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sortBy, setSortBy] = useState("count");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [activityStats, setActivityStats] = useState({
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    byUser: [],
    commonActivities: []
  });

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

  // Stats
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalUsers: 0,
    avgPerUser: 0,
    mostActiveUser: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [activities, users, userActivityCounts]);

  const calculateStats = () => {
    const totalActivities = activities.length;
    const totalUsers = users.length;
    const avgPerUser = totalUsers > 0 ? Math.round(totalActivities / totalUsers) : 0;
    
    let maxCount = 0;
    let mostActiveUser = '';
    Object.entries(userActivityCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveUser = name;
      }
    });

    setStats({ totalActivities, totalUsers, avgPerUser, mostActiveUser });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const activityData = await getActivities();
      setActivities(Array.isArray(activityData) ? activityData : []);

      const userResponse = await api.get('/users');
      const usersList = userResponse.data || [];
      setUsers(Array.isArray(usersList) ? usersList : []);

      const roles = {};
      const details = {};
      (Array.isArray(usersList) ? usersList : []).forEach(user => {
        roles[user.username] = user.role || 'team';
        details[user.username] = {
          full_name: user.full_name || user.username,
          whatsapp_number: user.whatsapp_number || 'N/A',
          role: user.role || 'team',
          created_at: user.created_at,
          is_active: user.is_active,
        };
      });
      setUserRoles(roles);
      setUserDetails(details);

      const counts = {};
      (Array.isArray(activityData) ? activityData : []).forEach(item => {
        if (item.username) {
          counts[item.username] = (counts[item.username] || 0) + 1;
        }
      });
      setUserActivityCounts(counts);

      // Load activity stats
      try {
        const statsResponse = await api.get('/activity/stats');
        const statsData = statsResponse.data || {};
        setActivityStats({
          total: statsData.total || 0,
          today: statsData.today || 0,
          week: statsData.week || 0,
          month: statsData.month || 0,
          byUser: Array.isArray(statsData.byUser) ? statsData.byUser : [],
          commonActivities: Array.isArray(statsData.commonActivities) ? statsData.commonActivities : []
        });
      } catch (error) {
        console.error("Error loading activity stats:", error);
        setActivityStats({
          total: 0,
          today: 0,
          week: 0,
          month: 0,
          byUser: [],
          commonActivities: []
        });
      }

      // Load activity types
      try {
        const typesResponse = await api.get('/activity/types');
        const typesData = typesResponse.data || [];
        setActivityTypes(Array.isArray(typesData) ? typesData : []);
      } catch (error) {
        console.error("Error loading activity types:", error);
        setActivityTypes([]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      showMessage("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async (username) => {
    try {
      const response = await api.get(`/activity/user/${username}`);
      const data = response.data || [];
      setSelectedUserActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading user activities:", error);
      setSelectedUserActivities([]);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const exportActivity = () => {
    if (filteredUsers.length === 0) {
      showMessage("No data to export", "error");
      return;
    }

    const headers = ['#', 'User', 'Full Name', 'Role', 'Activity Count', 'WhatsApp', 'Status'];
    const rows = filteredUsers.map((user, index) => [
      index + 1,
      user.username,
      userDetails[user.username]?.full_name || user.username,
      userRoles[user.username] || 'team',
      userActivityCounts[user.username] || 0,
      userDetails[user.username]?.whatsapp_number || 'N/A',
      userDetails[user.username]?.is_active ? 'Active' : 'Inactive'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\n📊 SUMMARY\n';
    csv += `Total Activities,${stats.totalActivities}\n`;
    csv += `Total Users,${stats.totalUsers}\n`;
    csv += `Average per User,${stats.avgPerUser}\n`;
    csv += `Most Active User,${stats.mostActiveUser}\n`;
    csv += `Activities Today,${activityStats.today || 0}\n`;
    csv += `Activities This Week,${activityStats.week || 0}\n`;
    csv += `Activities This Month,${activityStats.month || 0}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage("📥 Activity exported successfully!", "success");
  };

  useEffect(() => {
    let result = Array.isArray(users) ? [...users] : [];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(user =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)
      );
    }

    if (filterRole) {
      result = result.filter(user => (user.role || 'team') === filterRole);
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
    setCurrentPage(1);
  }, [users, search, filterRole, sortBy, sortOrder, userActivityCounts]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
      case 'developer': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      case 'team': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      'Created': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Updated': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Deleted': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Sent': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'Switched': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Logged': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return types[type] || types['Logged'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-blue-500" /> Activity Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track user activity and performance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportActivity}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            📥 Export
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-4 py-2 rounded-lg transition dark:text-white disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Activities</p>
          <p className="text-2xl font-bold dark:text-white">{stats.totalActivities}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active Users</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalUsers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Avg per User</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgPerUser}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Most Active</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 truncate">{stats.mostActiveUser || 'N/A'}</p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Today</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activityStats.today || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">This Week</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activityStats.week || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">This Month</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activityStats.month || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{activityStats.total || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="team">Team Member</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
          >
            <option value="">All Activity Types</option>
            {Array.isArray(activityTypes) && activityTypes.map((type, index) => (
              <option key={index} value={type.type}>
                {type.type} ({type.count})
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
          >
            <option value="count">Sort by Activity</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition dark:text-white"
          >
            {sortOrder === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>
        </div>
        {(filterType || filterDateFrom || filterDateTo) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Active Filters:</span>
            {filterType && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs flex items-center gap-1">
                Type: {filterType}
                <button onClick={() => setFilterType("")} className="hover:text-red-500">✕</button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterType("");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activity data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Role</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Activities</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">WhatsApp</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {search || filterRole || filterType ? 'No users match your filters' : 'No users found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      const count = userActivityCounts[user.username] || 0;
                      const details = userDetails[user.username] || {};
                      const role = userRoles[user.username] || 'team';
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{globalIndex}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">
                            @{user.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {details.full_name || user.username}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(role)} border`}>
                              {role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${count > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                              {count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {details.whatsapp_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                loadUserActivities(user.username);
                                setShowProfileModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                            >
                              <FaEye className="inline mr-1" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border dark:border-slate-600 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                  >
                    Next →
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border dark:border-slate-600 rounded-lg px-2 py-1 dark:bg-slate-700 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">👤 User Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Username:</span>
                <span className="text-sm text-gray-800 dark:text-white font-bold">@{selectedUser.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Full Name:</span>
                <span className="text-sm text-gray-800 dark:text-white">{userDetails[selectedUser.username]?.full_name || selectedUser.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Role:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(userRoles[selectedUser.username] || 'team')}`}>
                  {userRoles[selectedUser.username] || 'team'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Activities:</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{userActivityCounts[selectedUser.username] || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">WhatsApp:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{userDetails[selectedUser.username]?.whatsapp_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Joined:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{formatDate(userDetails[selectedUser.username]?.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${userDetails[selectedUser.username]?.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {userDetails[selectedUser.username]?.is_active ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              
              {/* Recent Activities */}
              {selectedUserActivities.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📋 Recent Activities</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {selectedUserActivities.slice(0, 10).map((activity, idx) => {
                      const type = activity.activity?.split(' ')[0] || 'Logged';
                      return (
                        <div key={idx} className="text-xs flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadge(type)}`}>
                              {type}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">{activity.activity}</span>
                          </div>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px]">{formatDateTime(activity.created_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
