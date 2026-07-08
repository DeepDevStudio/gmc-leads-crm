import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCustomers,
  deleteCustomer,
  updateCustomer,
  bulkUpdateCustomerGroup,
} from "../services/customerService";
import { getInterests } from "../services/interestService";
import api from "../services/api";

function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [interests, setInterests] = useState([]);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterInterest, setFilterInterest] = useState("All");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedEditInterests, setSelectedEditInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [message, setMessage] = useState({ text: "", type: "" });
  
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
    dailyReach: 0,
    doNotReach: 0,
    unsubscribed: 0
  });
  
  // Bulk Actions
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ===== QUICK VIEW MODAL =====
  const [viewCustomer, setViewCustomer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const uniqueLocations = [...new Set(
    Array.isArray(customers) ? customers.map(c => c.location_type).filter(Boolean) : []
  )];

  useEffect(() => {
    loadCustomers();
    loadInterests();
    loadStats();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      // Ensure data is an array
      const customerArray = Array.isArray(data) ? data : [];
      setCustomers(customerArray);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load customers", "error");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInterests = async () => {
    try {
      const data = await getInterests();
      setInterests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setInterests([]);
    }
  };

  const loadStats = async () => {
    try {
      const [daily, doNot, unsub] = await Promise.all([
        api.get("/customers/group/Daily Reach"),
        api.get("/customers/group/Do Not Reach"),
        api.get("/customers/group/Unsubscribed"),
      ]);
      setStats({
        total: (daily.data?.length || 0) + (doNot.data?.length || 0) + (unsub.data?.length || 0),
        dailyReach: daily.data?.length || 0,
        doNotReach: doNot.data?.length || 0,
        unsubscribed: unsub.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleEdit = async () => {
    try {
      await updateCustomer(editingCustomer.id, {
        ...editingCustomer,
        interests: selectedEditInterests.join(", "),
      });
      loadCustomers();
      setEditingCustomer(null);
      setSelectedEditInterests([]);
      showMessage("✅ Customer updated successfully!", "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to update customer", "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    setActionLoading(true);
    try {
      await deleteCustomer(id);
      loadCustomers();
      loadStats();
      showMessage(`🗑️ "${name}" deleted!`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to delete customer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    const existingInterests = customer.interests ? customer.interests.split(", ") : [];
    setSelectedEditInterests(existingInterests);
  };

  const handleEditInterestChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    if (selectedEditInterests.includes(value)) return;
    setSelectedEditInterests([...selectedEditInterests, value]);
    e.target.value = "";
  };

  const removeEditInterest = (interest) => {
    setSelectedEditInterests(selectedEditInterests.filter((i) => i !== interest));
  };

  const openViewModal = (customer) => {
    setViewCustomer(customer);
    setShowViewModal(true);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      const currentIds = paginatedCustomers.map(c => c.id);
      setSelectedCustomers(currentIds);
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (id) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(cid => cid !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) {
      showMessage("Please select customers first", "error");
      return;
    }
    if (!window.confirm(`Delete ${selectedCustomers.length} customers?`)) return;
    setActionLoading(true);
    
    Promise.all(selectedCustomers.map(id => deleteCustomer(id)))
      .then(() => {
        loadCustomers();
        loadStats();
        setSelectedCustomers([]);
        setSelectAll(false);
        showMessage(`🗑️ ${selectedCustomers.length} customers deleted!`, "success");
      })
      .catch(error => {
        console.error(error);
        showMessage("Failed to delete customers", "error");
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const handleBulkGroupChange = async (group) => {
    if (selectedCustomers.length === 0) {
      showMessage("Please select customers first", "error");
      return;
    }
    if (!window.confirm(`Move ${selectedCustomers.length} customers to "${group}"?`)) return;
    setActionLoading(true);

    try {
      await bulkUpdateCustomerGroup(selectedCustomers, group);
      loadCustomers();
      loadStats();
      setSelectedCustomers([]);
      setSelectAll(false);
      showMessage(`✅ ${selectedCustomers.length} customers moved to ${group}`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to move customers", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const exportSelectedCustomers = () => {
    if (selectedCustomers.length === 0) {
      showMessage("Please select customers to export", "error");
      return;
    }

    const selectedData = customers.filter(c => selectedCustomers.includes(c.id));
    const headers = ['#', 'Name', 'Phone', 'Interest', 'Location', 'Group', 'Created At'];
    const rows = selectedData.map((customer, index) => [
      index + 1,
      customer.customer_name || '',
      customer.mobile_number || '',
      customer.interests || 'None',
      customer.location_type || 'N/A',
      customer.group_type || 'Daily Reach',
      new Date(customer.created_at).toLocaleDateString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Selected,${selectedData.length}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_selected_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${selectedData.length} selected customers`, "success");
  };

  const exportAllCustomers = () => {
    const filtered = getFilteredCustomers();
    if (filtered.length === 0) {
      showMessage("No customers to export", "error");
      return;
    }

    const headers = ['#', 'Name', 'Phone', 'Interest', 'Location', 'Group', 'Created At'];
    const rows = filtered.map((customer, index) => [
      index + 1,
      customer.customer_name || '',
      customer.mobile_number || '',
      customer.interests || 'None',
      customer.location_type || 'N/A',
      customer.group_type || 'Daily Reach',
      new Date(customer.created_at).toLocaleDateString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Customers,${filtered.length}\n`;
    csv += `Daily Reach,${filtered.filter(c => c.group_type === 'Daily Reach').length}\n`;
    csv += `Do Not Reach,${filtered.filter(c => c.group_type === 'Do Not Reach').length}\n`;
    csv += `Unsubscribed,${filtered.filter(c => c.group_type === 'Unsubscribed').length}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_all_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${filtered.length} customers`, "success");
  };

  const getFilteredCustomers = () => {
    // Ensure customers is an array
    if (!Array.isArray(customers)) return [];
    
    let filtered = customers;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.mobile_number?.includes(search)
      );
    }

    if (filterGroup !== "All") {
      filtered = filtered.filter(c => c.group_type === filterGroup);
    }

    if (filterLocation !== "All") {
      filtered = filtered.filter(c => c.location_type === filterLocation);
    }

    if (filterInterest !== "All") {
      filtered = filtered.filter(c => c.interests?.includes(filterInterest));
    }

    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getGroupBadge = (group) => {
    switch(group) {
      case 'Daily Reach': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Do Not Reach': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Unsubscribed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-blue-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Customers</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{stats.total}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-green-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Daily Reach</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.dailyReach}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-red-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Do Not Reach</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.doNotReach}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-gray-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Unsubscribed</p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.unsubscribed}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Customers</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage your customer database</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total: {Array.isArray(customers) ? customers.length : 0} customers</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedCustomers.length > 0 && (
            <button 
              onClick={exportSelectedCustomers} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              📥 Export Selected ({selectedCustomers.length})
            </button>
          )}
          <Link to="/customers/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            + Add Customer
          </Link>
          <Link to="/bulk-import" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
            📤 Bulk Import
          </Link>
          <button onClick={exportAllCustomers} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
            📥 Export All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 mb-4 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
            />
          </div>
          <select 
            value={filterGroup} 
            onChange={(e) => setFilterGroup(e.target.value)} 
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="All">All Groups</option>
            <option value="Daily Reach">Daily Reach</option>
            <option value="Do Not Reach">Do Not Reach</option>
            <option value="Unsubscribed">Unsubscribed</option>
          </select>
          <select 
            value={filterLocation} 
            onChange={(e) => setFilterLocation(e.target.value)} 
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select 
            value={filterInterest} 
            onChange={(e) => setFilterInterest(e.target.value)} 
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="All">All Interests</option>
            {interests.map(interest => (
              <option key={interest.id} value={interest.interest_name}>{interest.interest_name}</option>
            ))}
          </select>
          <button 
            onClick={loadCustomers} 
            className={`px-4 py-2 rounded-lg transition text-sm ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            🔄 Refresh
          </button>
        </div>

        {selectedCustomers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>✅ {selectedCustomers.length} selected</span>
            <button onClick={() => handleBulkGroupChange('Daily Reach')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition" disabled={actionLoading}>
              Move to Daily Reach
            </button>
            <button onClick={() => handleBulkGroupChange('Do Not Reach')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition" disabled={actionLoading}>
              Move to Do Not Reach
            </button>
            <button onClick={() => handleBulkGroupChange('Unsubscribed')} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition" disabled={actionLoading}>
              Move to Unsubscribed
            </button>
            <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition" disabled={actionLoading}>
              🗑️ Delete All
            </button>
            <button onClick={() => { setSelectedCustomers([]); setSelectAll(false); }} className={`px-3 py-1 rounded text-sm transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Customer Table */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading customers...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectAll} 
                        onChange={handleSelectAll} 
                        className="w-4 h-4 text-blue-600 rounded dark:bg-slate-600" 
                      />
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>#</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Name</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Interest</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Location</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Group</th>
                    <th className={`px-4 py-3 text-center text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {search || filterGroup !== 'All' || filterLocation !== 'All' || filterInterest !== 'All'
                          ? 'No customers match your filters'
                          : 'No customers found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr key={customer.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition`}>
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedCustomers.includes(customer.id)} 
                              onChange={() => handleSelectCustomer(customer.id)} 
                              className="w-4 h-4 text-blue-600 rounded dark:bg-slate-600" 
                            />
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{globalIndex}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <button 
                              onClick={() => openViewModal(customer)} 
                              className={`hover:text-blue-600 dark:hover:text-blue-400 transition`}
                            >
                              {customer.customer_name || 'Unknown'}
                            </button>
                          </td>
                          <td className={`px-4 py-3 text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.mobile_number}</td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate">
                            {customer.interests ? (
                              <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                {customer.interests.length > 20 ? customer.interests.substring(0, 20) + '...' : customer.interests}
                              </span>
                            ) : (
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>None</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.location_type || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupBadge(customer.group_type)}`}>
                              {customer.group_type || 'Daily Reach'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              <button onClick={() => openViewModal(customer)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition" title="View">👁️</button>
                              <button onClick={() => openEditModal(customer)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition" title="Edit">✏️</button>
                              <button onClick={() => handleDelete(customer.id, customer.customer_name)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition" title="Delete" disabled={actionLoading}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={`flex flex-wrap justify-between items-center p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`px-3 py-1 border rounded-lg ${isDarkMode ? 'border-slate-600 text-white hover:bg-slate-700' : 'hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 border rounded-lg ${currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : isDarkMode ? 'border-slate-600 text-white hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`px-3 py-1 border rounded-lg ${isDarkMode ? 'border-slate-600 text-white hover:bg-slate-700' : 'hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    Next →
                  </button>
                </div>
                <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Show:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                    className={`border rounded-lg px-2 py-1 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
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

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>✏️ Edit Customer</h3>
              <button onClick={() => { setEditingCustomer(null); setSelectedEditInterests([]); }} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} text-xl`}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name</label>
                <input 
                  type="text" 
                  value={editingCustomer.customer_name || ''} 
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, customer_name: e.target.value })} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone</label>
                <input 
                  type="text" 
                  value={editingCustomer.mobile_number || ''} 
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile_number: e.target.value })} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</label>
                <input 
                  type="text" 
                  value={editingCustomer.location_type || ''} 
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, location_type: e.target.value })} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Group</label>
                <select 
                  value={editingCustomer.group_type || 'Daily Reach'} 
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, group_type: e.target.value })} 
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="Daily Reach">Daily Reach</option>
                  <option value="Do Not Reach">Do Not Reach</option>
                  <option value="Unsubscribed">Unsubscribed</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Interests</label>
                <div className="flex gap-2 mb-2">
                  <select 
                    onChange={handleEditInterestChange} 
                    className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`} 
                    value=""
                  >
                    <option value="">Add interest...</option>
                    {interests.filter(i => !selectedEditInterests.includes(i.interest_name)).map((interest) => (
                      <option key={interest.id} value={interest.interest_name}>{interest.interest_name}</option>
                    ))}
                  </select>
                </div>
                {selectedEditInterests.length > 0 && (
                  <div className={`flex flex-wrap gap-1 p-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    {selectedEditInterests.map((interest) => (
                      <span key={interest} className={`${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded-full text-sm flex items-center gap-1`}>
                        {interest}
                        <button type="button" onClick={() => removeEditInterest(interest)} className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">💾 Save Changes</button>
              <button onClick={() => { setEditingCustomer(null); setSelectedEditInterests([]); }} className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && viewCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👤 Customer Details</h3>
              <button onClick={() => setShowViewModal(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} text-xl`}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{viewCustomer.customer_name}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{viewCustomer.mobile_number}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Interests</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{viewCustomer.interests || 'None'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{viewCustomer.location_type || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Group</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupBadge(viewCustomer.group_type)}`}>
                  {viewCustomer.group_type || 'Daily Reach'}
                </span>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created At</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{formatDate(viewCustomer.created_at)}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link to={`/customers/${viewCustomer.id}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition">
                View Full Profile →
              </Link>
              <button onClick={() => setShowViewModal(false)} className={`flex-1 px-4 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
