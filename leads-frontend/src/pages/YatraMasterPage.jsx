import { useEffect, useState } from "react";
import { getYatras, createYatra, deleteYatra, updateYatra } from "../services/yatraService";
import { createActivity } from "../services/activityService";
import axios from "axios";

function YatraMasterPage() {
  const [yatras, setYatras] = useState([]);
  const [tripCounts, setTripCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    yatra_name: "",
    start_date: "",
    end_date: "",
    rate_per_seat: "",
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadYatras();
    loadTripCounts();
  }, []);

  const loadYatras = async () => {
    try {
      setLoading(true);
      const data = await getYatras();
      setYatras(data);
    } catch (error) {
      console.error("Error loading yatras:", error);
      showMessage("Failed to load yatras", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadTripCounts = async () => {
    try {
      const response = await axios.get("/api/yatra-bookings/trips");
      const trips = response.data || [];
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
    }
  };

  const handleEdit = (yatra) => {
    setEditingId(yatra.id);
    setFormData({
      yatra_name: yatra.yatra_name,
      start_date: yatra.start_date ? yatra.start_date.split("T")[0] : "",
      end_date: yatra.end_date ? yatra.end_date.split("T")[0] : "",
      rate_per_seat: yatra.rate_per_seat,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will also remove associated trips.`)) return;
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
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      yatra_name: "",
      start_date: "",
      end_date: "",
      rate_per_seat: "",
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
    
    if (today < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (today > end) return { label: "Completed", color: "bg-green-100 text-green-700" };
    return { label: "Active", color: "bg-yellow-100 text-yellow-700" };
  };

  const filteredYatras = yatras.filter(yatra =>
    yatra.yatra_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalYatras = yatras.length;
  const activeYatras = yatras.filter(y => {
    const today = new Date();
    const start = new Date(y.start_date);
    const end = new Date(y.end_date);
    return today >= start && today <= end;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🚐 Yatra Master</h1>
          <p className="text-gray-500">Manage all yatra packages</p>
        </div>
        <div className="flex gap-3">
          <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium">
            📊 Total: {totalYatras}
          </span>
          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium">
            🔥 Active: {activeYatras}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-green-100 text-green-700 border border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {editingId ? (
            <>✏️ Edit Yatra</>
          ) : (
            <>➕ Add New Yatra</>
          )}
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <input
            name="yatra_name"
            placeholder="Yatra Name *"
            value={formData.yatra_name}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          />
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          />
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          />
          <input
            name="rate_per_seat"
            placeholder="Rate per seat (₹) *"
            value={formData.rate_per_seat}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold transition"
          >
            {editingId ? "📝 Update Yatra" : "💾 Save Yatra"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search yatras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 p-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading yatras...</p>
          </div>
        </div>
      ) : filteredYatras.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No yatras found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? "Try adjusting your search" : "Click 'Save Yatra' to add your first yatra"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
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
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 text-gray-400 text-sm">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.yatra_name}</td>
                      <td className="p-3 text-gray-600 text-sm">{formatDate(item.start_date)}</td>
                      <td className="p-3 text-gray-600 text-sm">{formatDate(item.end_date)}</td>
                      <td className="p-3 font-semibold text-gray-800">₹{item.rate_per_seat}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tripCount > 0 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-gray-100 text-gray-400"
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.yatra_name)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
                          >
                            🗑️ Delete
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
