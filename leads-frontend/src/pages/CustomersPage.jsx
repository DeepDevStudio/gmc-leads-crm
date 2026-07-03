import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getCustomers,
  deleteCustomer,
  updateCustomer,
} from "../services/customerService";
import { getInterests } from "../services/interestService";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Bulk Actions
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Get unique locations for filter
  const uniqueLocations = [...new Set(customers.map(c => c.location_type).filter(Boolean))];

  useEffect(() => {
    loadCustomers();
    loadInterests();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterests = async () => {
    try {
      const data = await getInterests();
      setInterests(data);
    } catch (error) {
      console.error(error);
    }
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
      alert("Customer Updated");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete Customer?");
    if (!confirmDelete) return;
    try {
      await deleteCustomer(id);
      loadCustomers();
    } catch (error) {
      console.error(error);
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

  // Bulk Actions
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      const currentIds = currentItems.map(c => c.id);
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
      alert("Please select customers first");
      return;
    }
    const confirmDelete = window.confirm(`Delete ${selectedCustomers.length} customers?`);
    if (!confirmDelete) return;
    
    Promise.all(selectedCustomers.map(id => deleteCustomer(id)))
      .then(() => {
        loadCustomers();
        setSelectedCustomers([]);
        setSelectAll(false);
        alert("Customers deleted successfully");
      })
      .catch(error => console.error(error));
  };

  const handleBulkGroupChange = async (group) => {
    if (selectedCustomers.length === 0) {
      alert("Please select customers first");
      return;
    }
    const confirmChange = window.confirm(`Move ${selectedCustomers.length} customers to "${group}"?`);
    if (!confirmChange) return;

    try {
      await Promise.all(selectedCustomers.map(id => 
        axios.patch(`/api/customers/${id}/group`, { group_type: group })
      ));
      loadCustomers();
      setSelectedCustomers([]);
      setSelectAll(false);
      alert(`Moved ${selectedCustomers.length} customers to "${group}"`);
    } catch (error) {
      console.error(error);
      alert("Failed to move customers");
    }
  };

  // Export CSV - All or Selected
  const handleExportCSV = (exportSelected = false) => {
    const customersToExport = exportSelected && selectedCustomers.length > 0
      ? customers.filter(c => selectedCustomers.includes(c.id))
      : customers;

    if (customersToExport.length === 0) {
      alert(exportSelected ? "No customers selected to export" : "No customers to export");
      return;
    }

    const headers = ["ID", "Name", "Mobile", "Interests", "Location", "Group", "Created At"];
    const rows = customersToExport.map(c => [
      c.id,
      c.customer_name || "",
      c.mobile_number || "",
      c.interests || "",
      c.location_type || "",
      c.group_type || "",
      c.created_at || ""
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = exportSelected 
      ? `selected_customers_${new Date().toISOString().split("T")[0]}.csv`
      : `customers_${new Date().toISOString().split("T")[0]}.csv`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    if (exportSelected) {
      setSelectedCustomers([]);
      setSelectAll(false);
    }
  };

  // Filter by group, location, interest, and search
  const getFilteredCustomers = () => {
    let filtered = customers;

    if (search) {
      filtered = filtered.filter(
        (customer) =>
          customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          customer.mobile_number?.includes(search) ||
          customer.interests?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterGroup !== "All") {
      filtered = filtered.filter((c) => c.group_type === filterGroup);
    }

    if (filterLocation !== "All") {
      filtered = filtered.filter((c) => c.location_type === filterLocation);
    }

    if (filterInterest !== "All") {
      filtered = filtered.filter((c) => c.interests?.includes(filterInterest));
    }

    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalCustomers = customers.length;
  const dailyReach = customers.filter((c) => c.group_type === "Daily Reach").length;
  const doNotReach = customers.filter((c) => c.group_type === "Do Not Reach").length;
  const unsubscribed = customers.filter((c) => c.group_type === "Unsubscribed").length;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-red-500",
    ];
    let hash = 0;
    for (let i = 0; i < name?.length || 0; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Reset filters
  const resetFilters = () => {
    setFilterGroup("All");
    setFilterLocation("All");
    setFilterInterest("All");
    setSearch("");
  };

  const hasActiveFilters = filterGroup !== "All" || filterLocation !== "All" || filterInterest !== "All" || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Customers</h1>
          <p className="text-gray-500">Manage CRM Customers</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {selectedCustomers.length > 0 && (
            <button
              onClick={() => handleExportCSV(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2"
            >
              📤 Export Selected ({selectedCustomers.length})
            </button>
          )}
          <button
            onClick={() => handleExportCSV(false)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition"
          >
            📥 Export All
          </button>
          <Link
            to="/customers/create"
            className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-xl font-semibold transition"
          >
            + Add Customer
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-blue-500 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <h2 className="text-3xl font-bold text-blue-600">{totalCustomers}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-green-500 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Daily Reach</p>
          <h2 className="text-3xl font-bold text-green-600">{dailyReach}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-red-500 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Do Not Reach</p>
          <h2 className="text-3xl font-bold text-red-600">{doNotReach}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-gray-500 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Unsubscribed</p>
          <h2 className="text-3xl font-bold text-gray-600">{unsubscribed}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow border p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Group Filter */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="border rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-400"
          >
            <option value="All">All Groups</option>
            <option value="Daily Reach">Daily Reach</option>
            <option value="Do Not Reach">Do Not Reach</option>
            <option value="Unsubscribed">Unsubscribed</option>
          </select>

          {/* Location Filter */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-400"
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Interest Filter */}
          <select
            value={filterInterest}
            onChange={(e) => setFilterInterest(e.target.value)}
            className="border rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-400"
          >
            <option value="All">All Interests</option>
            {interests.map((interest) => (
              <option key={interest.id} value={interest.interest_name}>
                {interest.interest_name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by Name, Mobile, or Interest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-xl p-2 pl-8 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-700">
            {selectedCustomers.length} selected
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleBulkGroupChange(e.target.value);
                e.target.value = "";
              }
            }}
            className="border rounded-lg p-2 text-sm"
            defaultValue=""
          >
            <option value="">Move to Group...</option>
            <option value="Daily Reach">Daily Reach</option>
            <option value="Do Not Reach">Do Not Reach</option>
            <option value="Unsubscribed">Unsubscribed</option>
          </select>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Delete Selected
          </button>
          <button
            onClick={() => handleExportCSV(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            📤 Export Selected
          </button>
          <button
            onClick={() => {
              setSelectedCustomers([]);
              setSelectAll(false);
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading customers...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow border p-12 text-center">
          <p className="text-gray-500 text-lg">No customers found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? "Try adjusting your search" : "Click Add Customer to create one"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-yellow-400">
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Interests</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Group</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(
                              customer.customer_name
                            )}`}
                          >
                            {getInitials(customer.customer_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-blue-600 hover:underline">
                              {customer.mobile_number}
                            </div>
                            <div className="text-sm text-gray-600">
                              {customer.customer_name || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {customer.interests ? (
                            customer.interests.split(",").map((interest, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                              >
                                {interest.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No interests</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.location_type === "Delhi NCR"
                              ? "bg-blue-100 text-blue-700"
                              : customer.location_type === "Delhi"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {customer.location_type || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.group_type === "Daily Reach"
                              ? "bg-green-100 text-green-700"
                              : customer.group_type === "Do Not Reach"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.group_type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-100 transition"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-100 transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Customer</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              value={editingCustomer.mobile_number}
              onChange={(e) =>
                setEditingCustomer({
                  ...editingCustomer,
                  mobile_number: e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-yellow-400"
              placeholder="Mobile Number"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              value={editingCustomer.customer_name}
              onChange={(e) =>
                setEditingCustomer({
                  ...editingCustomer,
                  customer_name: e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-yellow-400"
              placeholder="Customer Name"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
            <select
              onChange={handleEditInterestChange}
              className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select Interest</option>
              {interests.map((interest) => (
                <option key={interest.id} value={interest.interest_name}>
                  {interest.interest_name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {selectedEditInterests.map((interest) => (
                <div
                  key={interest}
                  className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeEditInterest(interest)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEdit}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setSelectedEditInterests([]);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
