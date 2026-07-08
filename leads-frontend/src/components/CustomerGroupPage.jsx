import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { updateCustomerGroup, bulkUpdateCustomerGroup } from "../services/customerService";
import { createActivity } from "../services/activityService";

const CustomerGroupPage = ({ 
  title, 
  description, 
  groupType, 
  color, 
  headerColor,
  moveToGroup,
  moveToLabel,
  buttonLabel,
  icon 
}) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [counts, setCounts] = useState({ dailyReach: 0, doNotReach: 0, unsubscribed: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterInterest, setFilterInterest] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [lastAction, setLastAction] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  
  // ===== Move to any group dropdown =====
  const [selectedMoveGroup, setSelectedMoveGroup] = useState(moveToGroup);

  // ===== Group Statistics =====
  const [groupStats, setGroupStats] = useState({
    totalInGroup: 0,
    percentageOfTotal: 0,
    avgInterestsPerCustomer: 0,
    topLocations: [],
    topInterests: [],
    recentActivity: 0
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

  useEffect(() => {
    loadCustomers();
    loadCounts();
  }, []);

  useEffect(() => {
    calculateGroupStats();
  }, [customers, counts]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/group/${groupType}`);
      setCustomers(res.data || []);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const [daily, doNot, unsub] = await Promise.all([
        api.get("/customers/group/Daily Reach"),
        api.get("/customers/group/Do Not Reach"),
        api.get("/customers/group/Unsubscribed"),
      ]);
      setCounts({
        dailyReach: daily.data?.length || 0,
        doNotReach: doNot.data?.length || 0,
        unsubscribed: unsub.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  // ===== Calculate Group Statistics =====
  const calculateGroupStats = () => {
    const totalInGroup = customers.length;
    const totalAllGroups = counts.dailyReach + counts.doNotReach + counts.unsubscribed;
    const percentageOfTotal = totalAllGroups > 0 ? Math.round((totalInGroup / totalAllGroups) * 100) : 0;

    // Top locations
    const locationCounts = {};
    customers.forEach(c => {
      const loc = c.location_type || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top interests
    const interestCounts = {};
    customers.forEach(c => {
      if (c.interests) {
        const interests = c.interests.split(',').map(i => i.trim());
        interests.forEach(interest => {
          if (interest) {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
          }
        });
      }
    });
    const topInterests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Average interests per customer
    const totalInterests = Object.values(interestCounts).reduce((a, b) => a + b, 0);
    const avgInterestsPerCustomer = totalInGroup > 0 ? (totalInterests / totalInGroup) : 0;

    // Recent activity (customers added in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = customers.filter(c => new Date(c.created_at) >= sevenDaysAgo).length;

    setGroupStats({
      totalInGroup,
      percentageOfTotal,
      avgInterestsPerCustomer: Math.round(avgInterestsPerCustomer * 10) / 10,
      topLocations,
      topInterests,
      recentActivity
    });
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCustomers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ===== Move to any group =====
  const handleBulkMove = async (group) => {
    if (selectedIds.length === 0) {
      showMessage("Please select at least one customer", "error");
      return;
    }

    const targetGroup = group || selectedMoveGroup;
    const customerCount = selectedIds.length;
    const confirmMsg = `Move ${customerCount} customer${customerCount > 1 ? 's' : ''} to "${targetGroup}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await bulkUpdateCustomerGroup(selectedIds, targetGroup);
      
      await createActivity({
        user_id: user?.id || 1,
        username: user?.username || 'admin',
        activity: `Moved ${customerCount} customer${customerCount > 1 ? 's' : ''} from "${groupType}" to "${targetGroup}"`
      });
      
      setLastAction({
        type: 'bulk_move',
        count: customerCount,
        from: groupType,
        to: targetGroup,
        ids: [...selectedIds]
      });
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 6000);
      
      setSelectedIds([]);
      await loadCustomers();
      await loadCounts();
      calculateGroupStats();
      showMessage(`✅ ${customerCount} customer${customerCount > 1 ? 's' : ''} moved to ${targetGroup}`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to move customers", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveOne = async (id, group) => {
    const targetGroup = group || selectedMoveGroup;
    if (!window.confirm(`Move this customer to "${targetGroup}"?`)) return;

    setActionLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const customer = customers.find(c => c.id === id);
      
      await updateCustomerGroup(id, targetGroup);
      
      await createActivity({
        user_id: user?.id || 1,
        username: user?.username || 'admin',
        activity: `Moved customer "${customer?.customer_name}" from "${groupType}" to "${targetGroup}"`
      });
      
      setLastAction({
        type: 'single_move',
        customerId: id,
        customerName: customer?.customer_name,
        from: groupType,
        to: targetGroup
      });
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 6000);
      
      await loadCustomers();
      await loadCounts();
      calculateGroupStats();
      showMessage(`✅ Customer moved to ${targetGroup}`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to move customer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    
    try {
      if (lastAction.type === 'bulk_move' && lastAction.ids) {
        await bulkUpdateCustomerGroup(lastAction.ids, lastAction.from);
        const user = JSON.parse(localStorage.getItem('user'));
        await createActivity({
          user_id: user?.id || 1,
          username: user?.username || 'admin',
          activity: `Undo: Moved ${lastAction.count} customer${lastAction.count > 1 ? 's' : ''} back to "${lastAction.from}"`
        });
      } else if (lastAction.type === 'single_move' && lastAction.customerId) {
        await updateCustomerGroup(lastAction.customerId, lastAction.from);
        const user = JSON.parse(localStorage.getItem('user'));
        await createActivity({
          user_id: user?.id || 1,
          username: user?.username || 'admin',
          activity: `Undo: Moved customer "${lastAction.customerName}" back to "${lastAction.from}"`
        });
      }
      
      setShowUndo(false);
      setLastAction(null);
      await loadCustomers();
      await loadCounts();
      calculateGroupStats();
      showMessage("↩️ Action undone successfully!", "success");
    } catch (error) {
      console.error("Error undoing action:", error);
      showMessage("Failed to undo action", "error");
    }
  };

  // ===== Bulk Export Selected =====
  const exportSelectedCustomers = () => {
    if (selectedIds.length === 0) {
      showMessage("Please select at least one customer to export", "error");
      return;
    }

    const selectedCustomers = customers.filter(c => selectedIds.includes(c.id));
    
    const headers = ['#', 'Name', 'Mobile', 'Interests', 'Location', 'Group', 'Created At'];
    const rows = selectedCustomers.map((customer, index) => [
      index + 1,
      customer.customer_name || '',
      customer.mobile_number || '',
      customer.interests || 'None',
      customer.location_type || 'N/A',
      customer.group_type || title,
      new Date(customer.created_at).toLocaleDateString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\n📊 SUMMARY\n';
    csv += `Total Selected,${selectedCustomers.length}\n`;
    csv += `Group,${title}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupType.replace(/\s/g, '_')}_selected_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${selectedCustomers.length} selected customers`, "success");
  };

  // ===== Export All =====
  const exportAllCustomers = () => {
    if (filteredCustomers.length === 0) {
      showMessage("No customers to export", "error");
      return;
    }

    const headers = ['#', 'Name', 'Mobile', 'Interests', 'Location', 'Group', 'Created At'];
    const rows = filteredCustomers.map((customer, index) => [
      index + 1,
      customer.customer_name || '',
      customer.mobile_number || '',
      customer.interests || 'None',
      customer.location_type || 'N/A',
      customer.group_type || title,
      new Date(customer.created_at).toLocaleDateString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\n📊 SUMMARY\n';
    csv += `Total Customers,${filteredCustomers.length}\n`;
    csv += `Group,${title}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupType.replace(/\s/g, '_')}_all_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${filteredCustomers.length} customers`, "success");
  };

  // ===== GET COLOR CLASSES =====
  const getColorClasses = () => {
    switch(color) {
      case 'green': return 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400';
      case 'red': return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400';
      case 'gray': return 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300';
      default: return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400';
    }
  };

  const getTableHeaderColor = () => {
    switch(color) {
      case 'green': return 'bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white';
      case 'red': return 'bg-gradient-to-r from-red-600 to-red-700 dark:from-red-800 dark:to-red-900 text-white';
      case 'gray': return 'bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white';
      default: return 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white';
    }
  };

  const getGroupBadge = (group) => {
    switch(group) {
      case 'Daily Reach': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'Do Not Reach': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
      case 'Unsubscribed': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // ===== FILTER AND PAGINATE =====
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                         customer.mobile_number?.includes(search);
    const matchesInterest = filterInterest === "" || 
                           (customer.interests && customer.interests.toLowerCase().includes(filterInterest.toLowerCase()));
    const matchesLocation = filterLocation === "" || 
                           (customer.location_type && customer.location_type.toLowerCase().includes(filterLocation.toLowerCase()));
    return matchesSearch && matchesInterest && matchesLocation;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCustomers = customers.length;

  const getCurrentGroupCount = () => {
    switch(groupType) {
      case 'Daily Reach': return counts.dailyReach;
      case 'Do Not Reach': return counts.doNotReach;
      case 'Unsubscribed': return counts.unsubscribed;
      default: return totalCustomers;
    }
  };

  const uniqueLocations = [...new Set(customers.map(c => c.location_type).filter(Boolean))];
  const uniqueInterests = [...new Set(customers.map(c => c.interests).filter(Boolean))];

  // All available groups for dropdown
  const allGroups = ['Daily Reach', 'Do Not Reach', 'Unsubscribed'];

  return (
    <div className={`space-y-6 p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Undo Snackbar */}
      {showUndo && lastAction && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 dark:bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-fadeIn">
          <span>
            {lastAction.type === 'bulk_move' 
              ? `Moved ${lastAction.count} customers to "${lastAction.to}"`
              : `Moved "${lastAction.customerName}" to "${lastAction.to}"`
            }
          </span>
          <button
            onClick={handleUndo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
          >
            ↩️ Undo
          </button>
          <button
            onClick={() => setShowUndo(false)}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{icon} {title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-400 dark:text-gray-500">Total: {totalCustomers} customers</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGroupBadge(groupType)}`}>
              {groupType} Group
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              📊 {getCurrentGroupCount()} customers in this group
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="🔍 Search by name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border dark:border-slate-600 rounded-xl px-4 py-3 flex-1 md:w-72 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />
          <button
            onClick={exportAllCustomers}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition"
          >
            📥 Export All
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={exportSelectedCustomers}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition"
            >
              📥 Export Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => {
              loadCustomers();
              loadCounts();
            }}
            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-4 py-3 rounded-xl transition dark:text-white"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* ===== GROUP STATISTICS SECTION ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total in Group</p>
          <p className="text-2xl font-bold dark:text-white">{groupStats.totalInGroup}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{groupStats.percentageOfTotal}% of total customers</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Recent Additions</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{groupStats.recentActivity}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Added in last 7 days</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Avg Interests</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{groupStats.avgInterestsPerCustomer}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Per customer</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Top Location</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate">
            {groupStats.topLocations.length > 0 ? groupStats.topLocations[0].name : 'N/A'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {groupStats.topLocations.length > 0 ? `${groupStats.topLocations[0].count} customers` : ''}
          </p>
        </div>
      </div>

      {/* Top Locations & Interests */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📍 Top Locations</h4>
          {groupStats.topLocations.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No data</p>
          ) : (
            <div className="space-y-1">
              {groupStats.topLocations.map((loc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{loc.name}</span>
                  <span className="font-medium text-gray-800 dark:text-white">{loc.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border border-gray-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🏷️ Top Interests</h4>
          {groupStats.topInterests.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No data</p>
          ) : (
            <div className="space-y-1">
              {groupStats.topInterests.map((interest, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{interest.name}</span>
                  <span className="font-medium text-gray-800 dark:text-white">{interest.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards - Showing Customer Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/daily-reach"
          className={`bg-green-50 dark:bg-green-900/20 border-2 rounded-2xl p-6 hover:shadow-lg transition ${
            groupType === 'Daily Reach' ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-700' : 'border-green-200 dark:border-green-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-green-700 dark:text-green-400 font-semibold">📧 Daily Reach</h3>
              <p className="text-4xl font-bold mt-3 text-green-600 dark:text-green-400">{counts.dailyReach}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active customers</p>
            </div>
            {groupType === 'Daily Reach' && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Current</span>
            )}
          </div>
        </Link>
        <Link
          to="/do-not-reach"
          className={`bg-red-50 dark:bg-red-900/20 border-2 rounded-2xl p-6 hover:shadow-lg transition ${
            groupType === 'Do Not Reach' ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-700' : 'border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-red-700 dark:text-red-400 font-semibold">🚫 Do Not Reach</h3>
              <p className="text-4xl font-bold mt-3 text-red-600 dark:text-red-400">{counts.doNotReach}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inactive customers</p>
            </div>
            {groupType === 'Do Not Reach' && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Current</span>
            )}
          </div>
        </Link>
        <Link
          to="/unsubscribed"
          className={`bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl p-6 hover:shadow-lg transition ${
            groupType === 'Unsubscribed' ? 'border-gray-500 ring-2 ring-gray-200 dark:ring-gray-600' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-700 dark:text-gray-300 font-semibold">📤 Unsubscribed</h3>
              <p className="text-4xl font-bold mt-3 text-gray-600 dark:text-gray-400">{counts.unsubscribed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unsubscribed customers</p>
            </div>
            {groupType === 'Unsubscribed' && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Current</span>
            )}
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterInterest}
          onChange={(e) => {
            setFilterInterest(e.target.value);
            setCurrentPage(1);
          }}
          className="border dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="">All Interests</option>
          {uniqueInterests.slice(0, 20).map((interest) => (
            <option key={interest} value={interest}>{interest}</option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={(e) => {
            setFilterLocation(e.target.value);
            setCurrentPage(1);
          }}
          className="border dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="">All Locations</option>
          {uniqueLocations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
        {(filterInterest || filterLocation) && (
          <button
            onClick={() => {
              setFilterInterest("");
              setFilterLocation("");
              setCurrentPage(1);
            }}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-3 py-3"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-4 flex flex-wrap items-center gap-4 animate-fadeIn">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            ✅ {selectedIds.length} customer{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <span className="text-gray-400">|</span>
          
          {/* ===== Move to any group dropdown ===== */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Move to:</span>
            <select
              value={selectedMoveGroup}
              onChange={(e) => setSelectedMoveGroup(e.target.value)}
              className="border dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              {allGroups.map((group) => (
                <option key={group} value={group} disabled={group === groupType}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => handleBulkMove(selectedMoveGroup)}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-lg text-white transition ${
              selectedMoveGroup === 'Do Not Reach' ? 'bg-red-500 hover:bg-red-600' :
              selectedMoveGroup === 'Unsubscribed' ? 'bg-gray-500 hover:bg-gray-600' :
              'bg-green-500 hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {actionLoading ? '⏳ Processing...' : `Move to ${selectedMoveGroup}`}
          </button>
          
          <button
            onClick={() => setSelectedIds([])}
            className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 px-4 py-2 rounded-lg transition dark:text-white"
          >
            Clear Selection
          </button>
          <button
            onClick={handleSelectAllFiltered}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
          >
            {selectedIds.length === filteredCustomers.length 
              ? 'Deselect All' : `Select All ${filteredCustomers.length}`
            }
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customers...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={getTableHeaderColor()}>
                  <tr>
                    <th className="p-4 text-left w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-4 text-left">#</th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Mobile</th>
                    <th className="p-4 text-left">Interests</th>
                    <th className="p-4 text-left">Location</th>
                    <th className="p-4 text-left">Group</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {search || filterInterest || filterLocation ? 'No customers match your filters' : 'No customers found in this group'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr key={customer.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(customer.id)}
                              onChange={() => handleSelectOne(customer.id)}
                              className="w-4 h-4 dark:bg-slate-700"
                            />
                          </td>
                          <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{globalIndex}</td>
                          <td className="p-4 font-medium text-gray-800 dark:text-white">{customer.customer_name}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{customer.mobile_number}</td>
                          <td className="p-4 max-w-xs truncate">
                            {customer.interests ? (
                              <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                {customer.interests.length > 30
                                  ? customer.interests.substring(0, 30) + "..."
                                  : customer.interests}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-sm">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              customer.location_type === "Delhi NCR" 
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}>
                              {customer.location_type || "N/A"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupBadge(customer.group_type || groupType)}`}>
                              {customer.group_type || groupType}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowModal(true);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                              >
                                👁️ Quick View
                              </button>
                              <button
                                onClick={() => handleMoveOne(customer.id)}
                                disabled={actionLoading}
                                className={`px-3 py-1 rounded-lg text-sm transition text-white ${
                                  selectedMoveGroup === 'Do Not Reach' ? 'bg-red-500 hover:bg-red-600' :
                                  selectedMoveGroup === 'Unsubscribed' ? 'bg-gray-500 hover:bg-gray-600' :
                                  'bg-green-500 hover:bg-green-600'
                                } disabled:opacity-50`}
                              >
                                Move to {selectedMoveGroup}
                              </button>
                            </div>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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

      {/* Quick Actions Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 text-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">Total in this group</span>
          <span className="block text-lg font-bold" style={{ color: color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : '#6b7280' }}>
            {totalCustomers}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 text-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">Selected</span>
          <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{selectedIds.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 text-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">Showing</span>
          <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">{filteredCustomers.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 text-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">Current Group</span>
          <span className={`block text-lg font-bold ${color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {groupType}
          </span>
        </div>
      </div>

      {/* Customer Quick View Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">👤 Customer Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{selectedCustomer.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{selectedCustomer.mobile_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interests</p>
                <p className="text-gray-800 dark:text-white">{selectedCustomer.interests || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-gray-800 dark:text-white">{selectedCustomer.location_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Group</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupBadge(selectedCustomer.group_type || groupType)}`}>
                  {selectedCustomer.group_type || groupType}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-gray-800 dark:text-white">
                  {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                to={`/customers/${selectedCustomer.id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition"
              >
                View Full Profile →
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-4 py-2 rounded-lg transition dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerGroupPage;
