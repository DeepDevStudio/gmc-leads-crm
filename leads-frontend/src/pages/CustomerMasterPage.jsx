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
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formChanged, setFormChanged] = useState(false);
  
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [newInterestName, setNewInterestName] = useState("");
  const [addingInterest, setAddingInterest] = useState(false);

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
  }, []);

  const loadInterests = async () => {
    try {
      const data = await getInterests();
      // Ensure data is an array
      setInterests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading interests:", error);
      setInterests([]);
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
    setIsExistingCustomer(false);
    setFormChanged(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormChanged(true);
    if (name === "location_type" && value === "Outside Delhi NCR") {
      setFormData({ ...formData, location_type: value, group_type: "Do Not Reach" });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (!value || selectedInterests.includes(value)) return;
    setFormChanged(true);
    setSelectedInterests([...selectedInterests, value]);
    e.target.value = "";
  };

  const removeInterest = (interest) => {
    setFormChanged(true);
    setSelectedInterests(selectedInterests.filter((i) => i !== interest));
  };

  // ===== PHONE NUMBER HANDLING WITH AUTO-FILL =====
  const handleMobileChange = async (e) => {
    const mobile = e.target.value.replace(/\D/g, '');
    
    setFormData({ ...formData, mobile_number: mobile });
    setFormChanged(true);

    if (mobile.length < 10) {
      setExistingCustomer(null);
      setIsExistingCustomer(false);
      return;
    }

    if (mobile.length === 10) {
      setCheckingNumber(true);
      try {
        const result = await checkCustomer(mobile);
        
        if (result && result.exists && result.customer) {
          const customer = result.customer;
          setExistingCustomer(customer);
          setIsExistingCustomer(true);
          
          setFormData({
            customer_name: customer.customer_name || "",
            mobile_number: customer.mobile_number || mobile,
            interests: customer.interests || "",
            location_type: customer.location_type || "Delhi NCR",
            group_type: customer.group_type || "Daily Reach",
          });
          
          if (customer.interests) {
            setSelectedInterests(customer.interests.split(", ").filter(Boolean));
          } else {
            setSelectedInterests([]);
          }
          
          showMessage(`✅ Customer found: ${customer.customer_name}`, "success");
        } else {
          setExistingCustomer(null);
          setIsExistingCustomer(false);
          setFormData({
            customer_name: "",
            mobile_number: mobile,
            interests: "",
            location_type: "Delhi NCR",
            group_type: "Daily Reach",
          });
          setSelectedInterests([]);
          showMessage("📝 New customer - Fill in the details", "info");
        }
      } catch (error) {
        console.error("Error checking customer:", error);
        setExistingCustomer(null);
        setIsExistingCustomer(false);
      } finally {
        setCheckingNumber(false);
      }
    }
  };

  // ===== CANCEL WITH CONFIRMATION =====
  const handleCancel = () => {
    if (formChanged) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        return;
      }
    }
    navigate("/customers");
  };

  // ===== SAVE & ADD ANOTHER =====
  const handleSaveAndAddAnother = async () => {
    await handleSubmitInternal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSubmitInternal(false);
  };

  const handleSubmitInternal = async (addAnother = false) => {
    if (!formData.customer_name.trim()) {
      showMessage("Please enter customer name", "error");
      return;
    }
    
    if (!formData.mobile_number || formData.mobile_number.length !== 10) {
      showMessage("Please enter a valid 10-digit phone number", "error");
      return;
    }

    if (isExistingCustomer && existingCustomer) {
      if (!window.confirm(`Customer "${existingCustomer.customer_name}" already exists. Do you want to update?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const customerData = {
        ...formData,
        interests: selectedInterests.join(", "),
      };

      await createCustomer(customerData);
      
      await createActivity({
        user_id: user?.id || null,
        username: user?.username || "admin",
        activity: `${isExistingCustomer ? 'Updated' : 'Added'} Customer: ${formData.customer_name}`,
      });

      showMessage(`✅ ${isExistingCustomer ? 'Updated' : 'Added'} customer: ${formData.customer_name}!`, "success");
      
      if (addAnother) {
        resetForm();
        setLoading(false);
        // Focus on phone input
        document.getElementById('phoneInput')?.focus();
      } else {
        setTimeout(() => navigate("/customers"), 1500);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      showMessage("Failed to save customer", "error");
      setLoading(false);
    }
  };

  const handleCreateInterest = async () => {
    if (!newInterestName.trim()) {
      showMessage("Please enter an interest name", "error");
      return;
    }

    setAddingInterest(true);
    try {
      await createInterest({ interest_name: newInterestName.trim() });
      await loadInterests();
      setNewInterestName("");
      setShowInterestModal(false);
      showMessage(`✅ Interest "${newInterestName.trim()}" created!`, "success");
    } catch (error) {
      console.error("Error creating interest:", error);
      showMessage("Failed to create interest", "error");
    } finally {
      setAddingInterest(false);
    }
  };

  return (
    <div className={`p-6 max-w-3xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${
          message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' :
          message.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700' :
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={handleCancel} 
          className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition`}
        >
          ← Back
        </button>
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {isExistingCustomer ? '✏️ Edit Customer' : '➕ Add New Customer'}
        </h1>
      </div>

      {/* Existing Customer Alert */}
      {isExistingCustomer && existingCustomer && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-semibold">Customer Found: {existingCustomer.customer_name}</p>
              <p className="text-sm text-green-600 dark:text-green-300">Phone: {existingCustomer.mobile_number} | Group: {existingCustomer.group_type}</p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">Fields auto-filled. Update details below.</p>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Indicator */}
      {!isExistingCustomer && formData.mobile_number.length === 10 && !checkingNumber && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <span className="text-xl">📝</span>
            <div>
              <p className="font-semibold">New Customer</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">This phone number is not in your database yet.</p>
            </div>
          </div>
        </div>
      )}

      {/* Checking Indicator */}
      {checkingNumber && (
        <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 mb-6`}>
          <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Checking customer...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="space-y-4">
          {/* Phone Number - Primary field */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="phoneInput"
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleMobileChange}
                placeholder="Enter 10-digit phone number"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'
                } ${isExistingCustomer ? 'opacity-80' : ''}`}
                maxLength="10"
                required
              />
              {formData.mobile_number.length === 10 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isExistingCustomer ? (
                    <span className="text-green-500 text-sm font-medium">✅ Found</span>
                  ) : (
                    <span className="text-blue-500 text-sm font-medium">📝 New</span>
                  )}
                </div>
              )}
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Type a 10-digit phone number to auto-fill existing customer details</p>
          </div>

          {/* Customer Name */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'
              } ${isExistingCustomer ? 'opacity-80' : ''}`}
              required
              readOnly={isExistingCustomer}
            />
            {isExistingCustomer && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Auto-filled from existing record</p>}
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</label>
            <select
              name="location_type"
              value={formData.location_type}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
              } ${isExistingCustomer ? 'opacity-80' : ''}`}
              disabled={isExistingCustomer}
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Outside Delhi NCR">Outside Delhi NCR</option>
            </select>
            {isExistingCustomer && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Auto-filled from existing record</p>}
          </div>

          {/* Group */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Group</label>
            <select
              name="group_type"
              value={formData.group_type}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
              } ${isExistingCustomer ? 'opacity-80' : ''}`}
              disabled={isExistingCustomer}
            >
              <option value="Daily Reach">Daily Reach</option>
              <option value="Do Not Reach">Do Not Reach</option>
              <option value="Unsubscribed">Unsubscribed</option>
            </select>
            {isExistingCustomer && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Auto-filled from existing record</p>}
          </div>

          {/* Interests */}
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Interests</label>
            <div className="flex gap-2">
              <select
                onChange={handleInterestChange}
                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'
                }`}
                value=""
              >
                <option value="">Select an interest...</option>
                {Array.isArray(interests) && interests
                  .filter(i => !selectedInterests.includes(i.interest_name))
                  .map((interest) => (
                    <option key={interest.id} value={interest.interest_name}>
                      {interest.interest_name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => setShowInterestModal(true)}
                className={`px-4 py-2 rounded-lg transition text-sm ${
                  isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                + New
              </button>
            </div>
            {selectedInterests.length > 0 && (
              <div className={`flex flex-wrap gap-1 mt-2 p-2 rounded-lg border ${
                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}>
                {selectedInterests.map((interest) => (
                  <span
                    key={interest}
                    className={`${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded-full text-sm flex items-center gap-1`}
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : isExistingCustomer ? '💾 Update Customer' : '💾 Save Customer'}
          </button>
          {!isExistingCustomer && (
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              💾 Save & Add Another
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className={`px-6 py-2 rounded-lg transition ${
              isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* New Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg max-w-md w-full p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Create New Interest</h3>
              <button
                onClick={() => setShowInterestModal(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} text-xl`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Interest Name</label>
                <input
                  type="text"
                  value={newInterestName}
                  onChange={(e) => setNewInterestName(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'
                  }`}
                  placeholder="Enter interest name..."
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateInterest}
                disabled={addingInterest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                {addingInterest ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowInterestModal(false)}
                className={`px-6 py-2 rounded-lg transition ${
                  isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
                }`}
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
