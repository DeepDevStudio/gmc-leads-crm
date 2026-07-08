import { useEffect, useState } from "react";
import { getYatras, createYatra, deleteYatra, updateYatra } from "../services/yatraService";
import { createActivity } from "../services/activityService";
import api from "../services/api";

function YatraMasterPage() {
  const [yatras, setYatras] = useState([]);
  const [tripCounts, setTripCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    yatra_name: "",
    start_date: "",
    end_date: "",
    rate_per_seat: "",
    status: "active",
  });
  const [message, setMessage] = useState(null);

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
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    totalTrips: 0,
  });

  useEffect(() => {
    loadYatras();
    loadTripCounts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [yatras, tripCounts]);

  const calculateStats = () => {
    const total = yatras.length;
    const today = new Date();
    
    const active = yatras.filter(y => {
      const start = new Date(y.start_date);
      const end = new Date(y.end_date);
      return today >= start && today <= end;
    }).length;
    
    const upcoming = yatras.filter(y => {
      const start = new Date(y.start_date);
      return today < start;
    }).length;
    
    const completed = yatras.filter(y => {
      const end = new Date(y.end_date);
      return today > end;
    }).length;
    
    const totalTrips = Object.values(tripCounts).reduce((a, b) => a + b, 0);

    setStats({ total, active, upcoming, completed, totalTrips });
  };

  const loadYatras = async () => {
    try {
      setLoading(true);
      const data = await getYatras();
      setYatras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading yatras:", error);
      showMessage("Failed to load yatras", "error");
      setYatras([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTripCounts = async () => {
    try {
      const response = await api.get("/yatra-bookings/trips");
      const trips = Array.isArray(response.data) ? response.data : [];
      const counts = {};
      trips.forEach(trip => {
        counts[trip.yatra_id] = (counts[trip.yatra_id] || 0) + 1;
      });
      setTripCounts(counts);
    } catch (error) {
      console.error("Error loading trip counts:", error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async () => {
    if (!formData.yatra_name.trim()) {
      showMessage("Please enter Yatra name", "error");
      return;
    }
    if (!formData.start_date) {
      showMessage("Please select start date", "error");
      return;
    }
    if (!formData.end_date) {
      showMessage("Please select end date", "error");
      return;
    }
    if (!formData.rate_per_seat || formData.rate_per_seat <= 0) {
      showMessage("Please enter a valid rate", "error");
      return;
    }

    setActionLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (editingId) {
        await updateYatra(editingId, formData);
        await createActivity({
          user_id: user?.id || null,
          username: user?.username || "system",
          activity: `Updated Yatra: ${formData.yatra_name}`,
        });
        showMessage("✅ Yatra updated successfully!");
      } else {
        await createYatra(formData);
        await createActivity({
          user_id: user?.id || null,
          username: user?.username || "system",
          activity: `Added Yatra: ${formData.yatra_name}`,
        });
        showMessage("✅ Yatra added successfully!");
      }

      resetForm();
      loadYatras();
      loadTripCounts();
    } catch (error) {
      console.error("Error saving yatra:", error);
      showMessage("Failed to save yatra", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (yatra) => {
    setEditingId(yatra.id);
    setFormData({
      yatra_name: yatra.yatra_name,
      start_date: yatra.start_date ? yatra.start_date.split("T")[0] : "",
      end_date: yatra.end_date ? yatra.end_date.split("T")[0] : "",
      rate_per_seat: yatra.rate_per_seat,
      status: yatra.status || "active",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will also remove associated trips.`)) return;
    setActionLoading(true);
    try {
      await deleteYatra(id);
      const user = JSON.parse(localStorage.getItem("user"));
      await createActivity({
        user_id: user?.id || null,
        username: user?.username || "system",
        activity: `Deleted Yatra: ${name}`,
      });
      showMessage("🗑️ Yatra deleted successfully!");
      loadYatras();
      loadTripCounts();
    } catch (error) {
      console.error("Error deleting yatra:", error);
      showMessage("Failed to delete yatra", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const yatra = yatras.find(y => y.id === id);
    
    setActionLoading(true);
    try {
      await updateYatra(id, { ...yatra, status: newStatus });
      const user = JSON.parse(localStorage.getItem("user"));
      await createActivity({
        user_id: user?.id || null,
        username: user?.username || "system",
        activity: `${newStatus === 'active' ? 'Activated' : 'Deactivated'} Yatra: ${yatra.yatra_name}`,
      });
      showMessage(`✅ Yatra ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      loadYatras();
    } catch (error) {
      console.error("Error toggling status:", error);
      showMessage("Failed to update status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      yatra_name: "",
      start_date: "",
      end_date: "",
      rate_per_seat: "",
      status: "active",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (yatra) => {
    const today = new Date();
    const start = new Date(yatra.start_date);
    const end = new Date(yatra.end_date);
    
    if (yatra.status === 'inactive') {
      return { label: "Inactive", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
    }
    if (today < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (today > end) return { label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    return { label: "Active", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  };

  const filteredYatras = yatras.filter(yatra =>
    yatra.yatra_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportYatras = () => {
    if (filteredYatras.length === 0) {
      showMessage("No yatras to export", "error");
      return;
    }

    const headers = ['#', 'Yatra Name', 'Start Date', 'End Date', 'Rate', 'Trips', 'Status'];
    const rows = filteredYatras.map((yatra, index) => [
      index + 1,
      yatra.yatra_name,
      formatDate(yatra.start_date),
      formatDate(yatra.end_date),
      yatra.rate_per_seat,
      tripCounts[yatra.id] || 0,
      getStatus(yatra).label,
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Yatras,${filteredYatras.length}\n`;
    csv += `Active,${stats.active}\n`;
    csv += `Upcoming,${stats.upcoming}\n`;
    csv += `Completed,${stats.completed}\n`;
    csv += `Total Trips,${stats.totalTrips}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yatras_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${filteredYatras.length} yatras`, "success");
  };

  return (
    <div className={`space-y-6 p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "error"
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-blue-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Yatras</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{stats.total}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-yellow-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Active</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.active}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-blue-400`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Upcoming</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-green-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-purple-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Trips</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTrips}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🚐 Yatra Master</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage all yatra packages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportYatras}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            📥 Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? '✕ Cancel' : '+ Add Yatra'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
            {editingId ? (
              <>✏️ Edit Yatra</>
            ) : (
              <>➕ Add New Yatra</>
            )}
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <input
              name="yatra_name"
              placeholder="Yatra Name *"
              value={formData.yatra_name}
              onChange={handleChange}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
            />
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
            />
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
            />
            <input
              type="number"
              name="rate_per_seat"
              placeholder="Rate per seat (₹) *"
              value={formData.rate_per_seat}
              onChange={handleChange}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
            />
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingId ? "📝 Update Yatra" : "💾 Save Yatra"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className={`px-6 py-3 rounded-xl font-semibold transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search yatras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full border p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className={`absolute right-4 top-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading yatras...</p>
          </div>
        </div>
      ) : filteredYatras.length === 0 ? (
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-12 text-center`}>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>No yatras found</p>
          <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>
            {search ? "Try adjusting your search" : "Click 'Add Yatra' to create your first yatra"}
          </p>
        </div>
      ) : (
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDarkMode ? 'bg-slate-700' : 'bg-gradient-to-r from-gray-800 to-gray-900'} text-white`}>
                  <th className="p-3 text-left text-sm font-medium">#</th>
                  <th className="p-3 text-left text-sm font-medium">Yatra</th>
                  <th className="p-3 text-left text-sm font-medium">Start</th>
                  <th className="p-3 text-left text-sm font-medium">End</th>
                  <th className="p-3 text-left text-sm font-medium">Rate</th>
                  <th className="p-3 text-left text-sm font-medium">Trips</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredYatras.map((item, index) => {
                  const status = getStatus(item);
                  const tripCount = tripCounts[item.id] || 0;
                  
                  return (
                    <tr key={item.id} className={`border-b ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition`}>
                      <td className={`p-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{index + 1}</td>
                      <td className={`p-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.yatra_name}</td>
                      <td className={`p-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(item.start_date)}</td>
                      <td className={`p-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(item.end_date)}</td>
                      <td className={`p-3 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₹{item.rate_per_seat}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tripCount > 0 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                            : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                        }`}>
                          {tripCount} {tripCount === 1 ? "trip" : "trips"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status || 'active')}
                            disabled={actionLoading}
                            className={`px-2 py-1 rounded text-xs transition text-white ${
                              item.status === 'active' 
                                ? 'bg-gray-500 hover:bg-gray-600' 
                                : 'bg-green-500 hover:bg-green-600'
                            } disabled:opacity-50`}
                            title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {item.status === 'active' ? '🔴' : '🟢'}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.yatra_name)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default YatraMasterPage;
