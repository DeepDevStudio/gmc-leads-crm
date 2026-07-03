import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { updateCustomerGroup, bulkUpdateCustomerGroup } from "../services/customerService";

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
  const [message, setMessage] = useState({ text: "", type: "" });
  const [counts, setCounts] = useState({ dailyReach: 0, doNotReach: 0, unsubscribed: 0 });

  useEffect(() => {
    loadCustomers();
    loadCounts();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await axios.get(`/api/customers/group/${groupType}`);
      setCustomers(res.data);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load customers", "error");
    }
  };

  const loadCounts = async () => {
    try {
      const [daily, doNot, unsub] = await Promise.all([
        axios.get("/api/customers/group/daily-reach"),
        axios.get("/api/customers/group/do-not-reach"),
        axios.get("/api/customers/group/unsubscribed"),
      ]);
      setCounts({
        dailyReach: daily.data.length,
        doNotReach: doNot.data.length,
        unsubscribed: unsub.data.length,
      });
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkMove = async (group) => {
    if (selectedIds.length === 0) {
      showMessage("Please select at least one customer", "error");
      return;
    }

    const action = group === "Daily Reach" ? "Move" : "Move";
    if (!window.confirm(`${action} ${selectedIds.length} customers to "${group}"?`)) return;

    setLoading(true);
    try {
      await bulkUpdateCustomerGroup(selectedIds, group);
      setSelectedIds([]);
      await loadCustomers();
      await loadCounts();
      showMessage(`${selectedIds.length} customers moved to ${group}`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to move customers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveOne = async (id, group) => {
    const action = group === "Daily Reach" ? "Reactivate" : "Move";
    if (!window.confirm(`${action} this customer to "${group}"?`)) return;

    try {
      await updateCustomerGroup(id, group);
      await loadCustomers();
      await loadCounts();
      showMessage(`Customer ${action.toLowerCase()}d successfully`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to move customer", "error");
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    customer.mobile_number?.includes(search)
  );

  const getColorClasses = () => {
    switch(color) {
      case 'green': return 'bg-green-50 border-green-200 text-green-700';
      case 'red': return 'bg-red-50 border-red-200 text-red-700';
      case 'gray': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getTableHeaderColor = () => {
    switch(color) {
      case 'green': return 'bg-green-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'gray': return 'bg-gray-600 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Message Toast */}
      {message.text && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{icon} {title}</h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-4 py-3 flex-1 md:w-72 outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={loadCustomers}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-3 rounded-xl transition"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/daily-reach"
          className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 hover:shadow-lg transition"
        >
          <h3 className="text-green-700 font-semibold">📧 Daily Reach</h3>
          <p className="text-4xl font-bold mt-3 text-green-600">{counts.dailyReach}</p>
          <p className="text-sm text-gray-500 mt-1">Active customers</p>
        </Link>
        <Link
          to="/do-not-reach"
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 hover:shadow-lg transition"
        >
          <h3 className="text-red-700 font-semibold">🚫 Do Not Reach</h3>
          <p className="text-4xl font-bold mt-3 text-red-600">{counts.doNotReach}</p>
          <p className="text-sm text-gray-500 mt-1">Inactive customers</p>
        </Link>
        <Link
          to="/unsubscribed"
          className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
        >
          <h3 className="text-gray-700 font-semibold">📤 Unsubscribed</h3>
          <p className="text-4xl font-bold mt-3 text-gray-600">{counts.unsubscribed}</p>
          <p className="text-sm text-gray-500 mt-1">Unsubscribed customers</p>
        </Link>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-700">{selectedIds.length} selected</span>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => handleBulkMove(moveToGroup)}
            className={`px-4 py-2 rounded-lg text-white transition ${
              color === 'green' ? 'bg-red-500 hover:bg-red-600' :
              color === 'red' ? 'bg-green-500 hover:bg-green-600' :
              'bg-green-500 hover:bg-green-600'
            }`}
          >
            {moveToLabel}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg transition"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={getTableHeaderColor()}>
              <tr>
                <th className="p-4 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                    className="w-4 h-4"
                  />
                </th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Mobile</th>
                <th className="p-4 text-left">Interests</th>
                <th className="p-4 text-left">Location</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectOne(customer.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-800">{customer.customer_name}</td>
                    <td className="p-4 text-gray-600">{customer.mobile_number}</td>
                    <td className="p-4 max-w-xs truncate">
                      {customer.interests ? (
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {customer.interests.length > 30
                            ? customer.interests.substring(0, 30) + "..."
                            : customer.interests}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.location_type === "Delhi NCR" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {customer.location_type || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition inline-block"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleMoveOne(customer.id, moveToGroup)}
                        className={`px-3 py-1 rounded-lg text-sm transition text-white ${
                          color === 'green' ? 'bg-red-500 hover:bg-red-600' :
                          color === 'red' ? 'bg-green-500 hover:bg-green-600' :
                          'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {buttonLabel}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerGroupPage;

