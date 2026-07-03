import { useEffect, useState } from "react";
import {
  getInterests,
  createInterest,
  updateInterest,
  deleteInterest,
} from "../services/interestService";

function InterestMasterPage() {
  const [interests, setInterests] = useState([]);
  const [interestName, setInterestName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const data = await getInterests();
      setInterests(data);
    } catch (error) {
      console.error(error);
      showMessage("Failed to load interests", "error");
    } finally {
      setLoading(false);
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

    try {
      await createInterest({ interest_name: interestName.trim() });
      setInterestName("");
      loadInterests();
      showMessage(`✅ "${interestName.trim()}" added successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to add interest", "error");
    }
  };

  const handleEdit = (interest) => {
    setEditingId(interest.id);
    setEditingName(interest.interest_name);
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) {
      showMessage("Please enter an interest name", "error");
      return;
    }

    try {
      await updateInterest(id, { interest_name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      loadInterests();
      showMessage(`✅ Interest updated successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to update interest", "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteInterest(id);
      loadInterests();
      showMessage(`🗑️ "${name}" deleted successfully!`, "success");
    } catch (error) {
      console.error(error);
      showMessage("Failed to delete interest", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const filteredInterests = interests.filter(interest =>
    interest.interest_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏷️ Interest Master</h1>
          <p className="text-gray-500">Manage customer interests and categories</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-bold text-gray-800">{interests.length}</span> interests
        </div>
      </div>

      {/* Message */}
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

      {/* Add Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={interestName}
            onChange={(e) => setInterestName(e.target.value)}
            placeholder="Enter Interest Name..."
            className="flex-1 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 rounded-xl font-semibold transition"
          >
            + Add Interest
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search interests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-2">Loading interests...</p>
          </div>
        ) : filteredInterests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? "No interests match your search" : "No interests found. Add your first interest above!"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <th className="p-3 text-left text-sm font-medium">#</th>
                <th className="p-3 text-left text-sm font-medium">Interest Name</th>
                <th className="p-3 text-left text-sm font-medium">Created At</th>
                <th className="p-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterests.map((interest, index) => (
                <tr key={interest.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 text-gray-500">{index + 1}</td>
                  <td className="p-3">
                    {editingId === interest.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border rounded-lg p-1 px-3 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{interest.interest_name}</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(interest.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    {editingId === interest.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(interest.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg text-sm transition"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded-lg text-sm transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(interest)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(interest.id, interest.interest_name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InterestMasterPage;
