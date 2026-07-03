import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createActivity } from "../services/activityService";
import { createCustomer, checkCustomer } from "../services/customerService";
import { getInterests, createInterest } from "../services/interestService";

function CustomerMasterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: "",
    mobile_number: "",
    interests: "",
    location_type: "Delhi NCR",
    group_type: "Daily Reach",
  });

  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // New Interest Modal
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [newInterestName, setNewInterestName] = useState("");
  const [addingInterest, setAddingInterest] = useState(false);
  
  // Bulk Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const data = await getInterests();
      setInterests(data);
    } catch (error) {
      console.error("Error loading interests:", error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      mobile_number: "",
      interests: "",
      location_type: "Delhi NCR",
      group_type: "Daily Reach",
    });
    setSelectedInterests([]);
    setExistingCustomer(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "location_type" && value === "Outside Delhi NCR") {
      setFormData({
        ...formData,
        location_type: value,
        group_type: "Do Not Reach",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    if (selectedInterests.includes(value)) return;
    setSelectedInterests([...selectedInterests, value]);
    e.target.value = "";
  };

  const removeInterest = (interest) => {
    setSelectedInterests(selectedInterests.filter((i) => i !== interest));
  };

  const handleMobileChange = async (e) => {
    const mobile = e.target.value;
    setFormData({
      ...formData,
      mobile_number: mobile,
    });

    if (mobile.length < 10) {
      setExistingCustomer(null);
      return;
    }

    try {
      const result = await checkCustomer(mobile);
      if (result.exists) {
        setExistingCustomer(result.customer);
        showMessage("⚠️ Customer already exists", "warning");
      } else {
        setExistingCustomer(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ==================== CREATE NEW INTEREST ====================
  const handleCreateInterest = async () => {
    if (!newInterestName.trim()) {
      showMessage("Please enter an interest name", "error");
      return;
    }

    setAddingInterest(true);
    try {
      await createInterest({ interest_name: newInterestName.trim() });
      showMessage(`Interest "${newInterestName}" created successfully!`, "success");
      setNewInterestName("");
      setShowInterestModal(false);
      loadInterests();
    } catch (error) {
      console.error("Error creating interest:", error);
      showMessage("Failed to create interest", "error");
    } finally {
      setAddingInterest(false);
    }
  };

  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = async () => {
    if (existingCustomer) {
      showMessage("This customer already exists! Duplicate entry not allowed.", "error");
      return;
    }

    if (!formData.customer_name.trim()) {
      showMessage("Please enter customer name", "error");
      return;
    }

    if (formData.mobile_number.length < 10) {
      showMessage("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        mobile_number: formData.mobile_number,
        interests: selectedInterests.join(", "),
        location_type: formData.location_type,
        group_type: formData.group_type,
      };

      const result = await createCustomer(payload);
      
      // Create activity log
      const user = JSON.parse(localStorage.getItem("user"));
      await createActivity({
        user_id: user?.id || null,
        username: user?.username || "system",
        activity: `Added Customer: ${formData.customer_name}`,
      });

      showMessage(`✅ Customer "${formData.customer_name}" created successfully!`, "success");
      resetForm();
      
      // Navigate to customers list after short delay
      setTimeout(() => navigate("/customers"), 1500);
    } catch (error) {
      console.error("Error creating customer:", error);
      showMessage("❌ Failed to create customer", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== BULK IMPORT ====================
  const handleBulkImport = async () => {
    // Implementation for bulk import
    showMessage("Bulk import feature coming soon!", "info");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Message Toast */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${
          message.type === "success" 
            ? "bg-green-100 text-green-700 border border-green-200" 
            : message.type === "warning"
            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
            : message.type === "info"
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "bg-red-100 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">➕ Add Customer</h1>
          <p className="text-gray-500 mt-1">Add a new customer to the CRM</p>
        </div>
        <button
          onClick={() => navigate("/customers")}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl transition"
        >
          ← Back to Customers
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Duplicate Warning */}
          {existingCustomer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-700 font-medium">⚠️ Customer already exists</p>
              <p className="text-yellow-600 text-sm">
                {existingCustomer.customer_name} - {existingCustomer.mobile_number}
              </p>
              <button
                type="button"
                onClick={() => {
                  setExistingCustomer(null);
                  setFormData({
                    ...formData,
                    customer_name: "",
                    mobile_number: "",
                  });
                }}
                className="text-yellow-700 underline text-sm mt-1"
              >
                Continue anyway?
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleMobileChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                required
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="Full name"
                required
              />
            </div>

            {/* Interests */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interests
              </label>
              <div className="flex gap-2">
                <select
                  onChange={handleInterestChange}
                  className="flex-1 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                  <option value="">Select Interest</option>
                  {interests.map((interest) => (
                    <option key={interest.id} value={interest.interest_name}>
                      {interest.interest_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowInterestModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition"
                >
                  + Add
                </button>
              </div>
              
              {/* Selected Interests */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedInterests.map((interest) => (
                  <div
                    key={interest}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
              >
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Delhi">Delhi</option>
                <option value="Outside Delhi NCR">Outside Delhi NCR</option>
                <option value="Noida">Noida</option>
                <option value="Gurgaon">Gurgaon</option>
                <option value="Faridabad">Faridabad</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group
              </label>
              <select
                name="group_type"
                value={formData.group_type}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
              >
                <option value="Daily Reach">Daily Reach</option>
                <option value="Do Not Reach">Do Not Reach</option>
                <option value="Unsubscribed">Unsubscribed</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.group_type === "Do Not Reach" && "Customers outside Delhi NCR are automatically set to 'Do Not Reach'"}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading || !!existingCustomer}
              className={`bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-semibold transition ${
                (loading || !!existingCustomer) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "💾 Save Customer"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Add Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">Create New Interest</h2>
            <input
              type="text"
              value={newInterestName}
              onChange={(e) => setNewInterestName(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none mb-4"
              placeholder="Enter interest name"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateInterest}
                disabled={addingInterest}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {addingInterest ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowInterestModal(false);
                  setNewInterestName("");
                }}
                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-xl font-semibold transition"
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

export default CustomerMasterPage;
