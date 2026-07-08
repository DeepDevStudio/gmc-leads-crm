import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCustomer, updateCustomerGroup } from "../services/customerService";
import { createActivity, getActivities } from "../services/activityService";
import { getInterests } from "../services/interestService";
import { getCustomerInterests, addCustomerInterest, removeCustomerInterest } from "../services/customerInterestService";

function CustomerProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [activities, setActivities] = useState([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [lastContacted, setLastContacted] = useState(null);
  const [customerInterests, setCustomerInterests] = useState([]);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editedNote, setEditedNote] = useState("");
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");

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
    loadCustomer();
    loadAllInterests();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomer(id);
      setCustomer(data);
      setSelectedGroup(data.group_type || 'Daily Reach');
      
      const savedNotes = JSON.parse(localStorage.getItem(`customer_notes_${id}`) || "[]");
      setNotes(savedNotes);
      
      const lastContact = localStorage.getItem(`customer_last_contacted_${id}`);
      if (lastContact) {
        setLastContacted(new Date(lastContact));
      }
      
      loadActivities();
      loadCustomerInterests();
    } catch (error) {
      console.error("Error loading customer:", error);
      setError("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerInterests = async () => {
    try {
      const data = await getCustomerInterests(id);
      setCustomerInterests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading customer interests:", error);
      setCustomerInterests([]);
    }
  };

  const loadAllInterests = async () => {
    try {
      const data = await getInterests();
      setAllInterests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading all interests:", error);
      setAllInterests([]);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getActivities();
      const customerActivities = Array.isArray(data) ? data.filter(
        (activity) => activity.customer_id === parseInt(id) || 
        activity.details?.includes(`Customer: ${customer?.customer_name}`) ||
        activity.activity?.includes(customer?.customer_name)
      ) : [];
      setActivities(customerActivities.slice(0, 10));
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const changeGroup = async (group) => {
    try {
      await updateCustomerGroup(id, group);
      loadCustomer();
      
      const user = JSON.parse(localStorage.getItem("user"));
      await createActivity({
        user_id: user?.id || null,
        username: user?.username || "system",
        activity: `Changed customer group to ${group} for ${customer?.customer_name}`,
      });
      showMessage(`Group changed to "${group}"`, "success");
      setShowEditGroup(false);
    } catch (error) {
      console.error("Error changing group:", error);
      showMessage("Failed to change group", "error");
    }
  };

  const addNote = () => {
    if (!newNote.trim()) {
      showMessage("Please enter a note", "error");
      return;
    }

    const updatedNotes = [...notes, {
      id: Date.now(),
      text: newNote.trim(),
      date: new Date().toISOString(),
      author: JSON.parse(localStorage.getItem("user"))?.username || "system"
    }];
    setNotes(updatedNotes);
    localStorage.setItem(`customer_notes_${id}`, JSON.stringify(updatedNotes));
    setNewNote("");
    setShowNoteForm(false);
    showMessage("Note added successfully!", "success");
  };

  const deleteNote = (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`customer_notes_${id}`, JSON.stringify(updatedNotes));
    showMessage("Note deleted", "info");
  };

  const startEditingNote = (note) => {
    setEditingNoteIndex(note.id);
    setEditedNote(note.text);
  };

  const saveEditedNote = (noteId) => {
    const updatedNotes = notes.map(n => 
      n.id === noteId ? { ...n, text: editedNote.trim(), date: new Date().toISOString() } : n
    );
    setNotes(updatedNotes);
    localStorage.setItem(`customer_notes_${id}`, JSON.stringify(updatedNotes));
    setEditingNoteIndex(null);
    setEditedNote("");
    showMessage("Note updated!", "success");
  };

  const updateLastContacted = () => {
    const now = new Date();
    setLastContacted(now);
    localStorage.setItem(`customer_last_contacted_${id}`, now.toISOString());
    showMessage("Last contacted updated!", "success");
  };

  const handleAddInterest = async () => {
    if (!selectedInterest) {
      showMessage("Please select an interest", "error");
      return;
    }
    try {
      await addCustomerInterest(id, selectedInterest);
      loadCustomerInterests();
      setSelectedInterest("");
      showMessage(`Interest "${selectedInterest}" added!`, "success");
    } catch (error) {
      console.error("Error adding interest:", error);
      showMessage("Failed to add interest", "error");
    }
  };

  const handleRemoveInterest = async (interestId) => {
    if (!window.confirm("Remove this interest?")) return;
    try {
      await removeCustomerInterest(interestId);
      loadCustomerInterests();
      showMessage("Interest removed", "info");
    } catch (error) {
      console.error("Error removing interest:", error);
      showMessage("Failed to remove interest", "error");
    }
  };

  const getGroupColor = (group) => {
    switch(group) {
      case "Daily Reach": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      case "Do Not Reach": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
      case "Unsubscribed": return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
      default: return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'dark' : ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow border p-12 text-center ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <p className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{error || "Customer not found"}</p>
        <button
          onClick={() => navigate("/customers")}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-xl font-semibold transition"
        >
          ← Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message Toast */}
      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === "success" 
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700" 
            : message.type === "warning"
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700"
            : message.type === "info"
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👤 Customer Profile</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>View and manage customer details</p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className={`px-4 py-2 rounded-xl transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          ← Back
        </button>
      </div>

      {/* Customer Info */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-6`}>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white shadow-lg">
            {customer.customer_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{customer.customer_name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getGroupColor(customer.group_type)}`}>
                {customer.group_type}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>📱 {customer.mobile_number}</p>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>📍 {customer.location_type || "N/A"}</p>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>📅 Joined: {formatDate(customer.created_at)}</p>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>🔄 Last Contacted: {lastContacted ? new Date(lastContacted).toLocaleDateString() : "Never"}</p>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🏷️ Interests</h3>
            <div className="flex gap-2">
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className={`border p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Add Interest...</option>
                {allInterests.map((interest) => (
                  <option key={interest.id} value={interest.interest_name}>
                    {interest.interest_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddInterest}
                className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {customerInterests.length === 0 ? (
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>No interests added yet</p>
            ) : (
              customerInterests.map((ci) => (
                <div key={ci.id} className={`${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} px-3 py-1 rounded-full flex items-center gap-2 text-sm`}>
                  {ci.interest_name}
                  <button
                    onClick={() => handleRemoveInterest(ci.id)}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-wrap gap-3">
          <button
            onClick={updateLastContacted}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            📞 Update Last Contacted
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEditGroup(!showEditGroup)}
              className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              🔄 Change Group
            </button>
            {showEditGroup && (
              <div className={`absolute top-full left-0 mt-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border p-2 z-10 min-w-[180px]`}>
                {['Daily Reach', 'Do Not Reach', 'Unsubscribed'].map((group) => (
                  <button
                    key={group}
                    onClick={() => changeGroup(group)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                      customer.group_type === group 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                        : isDarkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {group}
                    {customer.group_type === group && (
                      <span className="ml-2 text-xs text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            to={`/customers/${id}/edit`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            ✏️ Edit Customer
          </Link>
        </div>
      </div>

      {/* Notes Section */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📝 Notes</h3>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            {showNoteForm ? "Cancel" : "+ Add Note"}
          </button>
        </div>

        {showNoteForm && (
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-4 mb-4`}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
              rows="3"
              placeholder="Write a note..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={addNote}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-center py-4`}>No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} rounded-xl p-3 border`}>
                {editingNoteIndex === note.id ? (
                  <div>
                    <textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                      rows="2"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveEditedNote(note.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteIndex(null);
                          setEditedNote("");
                        }}
                        className={`px-3 py-1 rounded-lg text-sm transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{note.text}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(note.date).toLocaleString()} • by {note.author || "system"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingNote(note)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activities */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-6`}>
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>📋 Recent Activities</h3>
        {activities.length === 0 ? (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-center py-4`}>No activities recorded</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} rounded-xl p-3 border flex justify-between items-center`}>
                <div>
                  <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{activity.activity}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>by {activity.username || "system"}</p>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerProfilePage;
