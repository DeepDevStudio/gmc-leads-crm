import { useEffect, useState } from "react";
import {
  getInterests,
  createInterest,
  updateInterest,
  deleteInterest,
} from "../services/interestService";
import api from "../services/api";

function InterestMasterPage() {
  const [interests, setInterests] = useState([]);
  const [interestName, setInterestName] = useState("");
  const [interestCategory, setInterestCategory] = useState("");
  const [interestDescription, setInterestDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customerCounts, setCustomerCounts] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [stats, setStats] = useState({
    totalInterests: 0,
    activeInterests: 0,
    inactiveInterests: 0,
    totalCustomers: 0,
    mostPopularInterest: '',
    mostPopularCount: 0
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
    loadInterests();
    loadCustomerCounts();
    loadCategories();
  }, [currentPage, filterStatus, filterCategory, searchTerm]);

  useEffect(() => {
    if (interests.length > 0) {
      const totalInterests = interests.length;
      const activeInterests = interests.filter(i => i.is_active !== 0).length;
      const inactiveInterests = interests.filter(i => i.is_active === 0).length;
      let maxCount = 0;
      let maxInterest = '';
      interests.forEach(interest => {
        const count = customerCounts[interest.id] || 0;
        if (count > maxCount) {
          maxCount = count;
          maxInterest = interest.interest_name;
        }
      });

      setStats({
        totalInterests,
        activeInterests,
        inactiveInterests,
        totalCustomers: Object.values(customerCounts).reduce((a, b) => a + b, 0),
        mostPopularInterest: maxInterest,
        mostPopularCount: maxCount
      });
    }
  }, [interests, customerCounts]);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const response = await api.get(`/interests?${params.toString()}`);
      const data = response.data;
      
      if (data.data) {
        setInterests(data.data);
        setTotalItems(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setInterests(data || []);
        setTotalItems(data?.length || 0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(error);
      showMessage("Failed to load interests", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/interests/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCustomerCounts = async () => {
    try {
      const response = await api.get('/customers');
      const customers = response.data || [];
      
      const counts = {};
      customers.forEach(customer => {
        if (customer.interests) {
          const interestIds = customer.interests.split(',').map(id => parseInt(id.trim()));
          interestIds.forEach(id => {
            if (id) {
              counts[id] = (counts[id] || 0) + 1;
            }
          });
        }
      });
      setCustomerCounts(counts);
    } catch (error) {
      console.error('Error loading customer counts:', error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interestName.trim()) {
      showMessage("Please enter an interest name", "error");
      return;
    }

    setActionLoading(true);
    try {
      await createInterest({ 
        interest_name: interestName.trim(),
        category: interestCategory || null,
        description: interestDescription || null,
        is_active: 1
      });
      setInterestName("");
      setInterestCategory("");
      setInterestDescription("");
      loadInterests();
      loadCustomerCounts();
      showMessage(`✅ "${interestName.trim()}" added successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage(error.response?.data?.error || "Failed to add interest", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (interest) => {
    setEditingId(interest.id);
    setEditingName(interest.interest_name);
    setEditingCategory(interest.category || "");
    setEditingDescription(interest.description || "");
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) {
      showMessage("Please enter an interest name", "error");
      return;
    }

    setActionLoading(true);
    try {
      await updateInterest(id, { 
        interest_name: editingName.trim(),
        category: editingCategory || null,
        description: editingDescription || null
      });
      setEditingId(null);
      setEditingName("");
      setEditingCategory("");
      setEditingDescription("");
      loadInterests();
      loadCustomerCounts();
      showMessage(`✅ Interest updated successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage(error.response?.data?.error || "Failed to update interest", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ Delete "${name}"?\n\nThis will also remove this interest from all customers who have it assigned.\n\nThis action cannot be undone!`)) return;
    setActionLoading(true);
    try {
      await deleteInterest(id);
      loadInterests();
      loadCustomerCounts();
      showMessage(`🗑️ "${name}" deleted!`, "success");
    } catch (error) {
      console.error(error);
      showMessage(error.response?.data?.error || "Failed to delete interest", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? 'activate' : 'deactivate';
    if (!window.confirm(`⚠️ ${action} this interest?\n\nThis will ${action} it for all customers.`)) return;
    
    setActionLoading(true);
    try {
      await updateInterest(id, { is_active: newStatus });
      loadInterests();
      showMessage(`✅ Interest ${action}d successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage(`Failed to ${action} interest`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedInterests.length === 0) {
      showMessage("Please select interests to delete", "error");
      return;
    }
    if (!window.confirm(`⚠️ Delete ${selectedInterests.length} interests?\n\nThis action cannot be undone!`)) return;
    setActionLoading(true);
    
    Promise.all(selectedInterests.map(id => deleteInterest(id)))
      .then(() => {
        setSelectedInterests([]);
        loadInterests();
        loadCustomerCounts();
        showMessage(`🗑️ ${selectedInterests.length} interests deleted!`, "success");
      })
      .catch(error => {
        console.error(error);
        showMessage("Failed to delete interests", "error");
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  const exportInterests = () => {
    const exportData = interests.length > 0 ? interests : [];
    if (exportData.length === 0) {
      showMessage("No interests to export", "error");
      return;
    }

    const headers = ['#', 'Interest Name', 'Category', 'Description', 'Customer Count', 'Status', 'Created At'];
    const rows = exportData.map((interest, index) => [
      index + 1,
      interest.interest_name,
      interest.category || '-',
      interest.description || '-',
      customerCounts[interest.id] || 0,
      interest.is_active !== 0 ? 'Active' : 'Inactive',
      new Date(interest.created_at).toLocaleDateString('en-IN')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Interests,${exportData.length}\n`;
    csv += `Active Interests,${stats.activeInterests}\n`;
    csv += `Inactive Interests,${stats.inactiveInterests}\n`;
    csv += `Total Customers,${stats.totalCustomers}\n`;
    csv += `Most Popular Interest,${stats.mostPopularInterest} (${stats.mostPopularCount} customers)\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interests_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${exportData.length} interests`, "success");
  };

  const handleSelectAll = () => {
    if (selectedInterests.length === interests.length) {
      setSelectedInterests([]);
    } else {
      setSelectedInterests(interests.map(i => i.id));
    }
  };

  const handleSelectInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingCategory("");
    setEditingDescription("");
  };

  const getInterestColor = (name) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700',
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700',
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
      'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Interests</p>
          <p className="text-2xl font-bold dark:text-white">{stats.totalInterests}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeInterests}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Inactive</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactiveInterests}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Customers</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Most Popular</p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 truncate">{stats.mostPopularInterest || 'N/A'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{stats.mostPopularCount} customers</p>
        </div>
      </div>

      {/* Add Interest Form */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">➕ Add New Interest</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">Total: {totalItems} interests</span>
        </div>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-3">
          <input
            type="text"
            value={interestName}
            onChange={(e) => setInterestName(e.target.value)}
            placeholder="Interest name..."
            className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-white"
            required
          />
          <input
            type="text"
            value={interestCategory}
            onChange={(e) => setInterestCategory(e.target.value)}
            placeholder="Category (e.g., Travel, Spiritual)"
            className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-white"
          />
          <input
            type="text"
            value={interestDescription}
            onChange={(e) => setInterestDescription(e.target.value)}
            placeholder="Description (optional)"
            className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-white"
          />
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 w-full md:w-auto"
            >
              {actionLoading ? 'Adding...' : 'Add Interest'}
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">💡 Interests are used to categorize customers for targeted campaigns</p>
      </div>

      {/* Search, Filters and Actions */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Search interests..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={exportInterests}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          📥 Export
        </button>
        {selectedInterests.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            🗑️ Delete Selected ({selectedInterests.length})
          </button>
        )}
        <button
          onClick={() => {
            setCurrentPage(1);
            loadInterests();
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition dark:bg-slate-600 dark:hover:bg-slate-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Interest List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Loading interests...</p>
            </div>
          </div>
        ) : interests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' ? 'No interests match your filters' : 'No interests found'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' ? 'Try adjusting your filters' : 'Add your first interest using the form above'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedInterests.length === interests.length && interests.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded dark:bg-slate-700"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Interest Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Customers</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {interests.map((interest, index) => {
                    const isEditing = editingId === interest.id;
                    const customerCount = customerCounts[interest.id] || 0;
                    const colorClass = getInterestColor(interest.interest_name);
                    const isActive = interest.is_active !== 0;

                    return (
                      <tr key={interest.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedInterests.includes(interest.id)}
                            onChange={() => handleSelectInterest(interest.id)}
                            className="w-4 h-4 text-blue-600 rounded dark:bg-slate-700"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full p-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass} border`}>
                              {interest.interest_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCategory}
                              onChange={(e) => setEditingCategory(e.target.value)}
                              placeholder="Category"
                              className="w-full p-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                          ) : (
                            interest.category || <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              placeholder="Description"
                              className="w-full p-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                          ) : (
                            interest.description || <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${customerCount > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                            {customerCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(interest.id, interest.is_active)}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30'}`}
                          >
                            {isActive ? '🟢 Active' : '🔴 Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleUpdate(interest.id)}
                                disabled={actionLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition dark:bg-slate-600 dark:hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleEdit(interest)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(interest.id, interest.interest_name)}
                                disabled={actionLoading}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} interests
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm dark:text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InterestMasterPage;
