import { useEffect, useState } from "react";
import { getYatras, createYatra, deleteYatra, updateYatra } from "../services/yatraService";
import { createActivity } from "../services/activityService";
import api from "../services/api";
import { FaUpload, FaTrash, FaPlus, FaEdit, FaImage, FaStar, FaMapMarkedAlt } from 'react-icons/fa';

function YatraMasterPage() {
  const [yatras, setYatras] = useState([]);
  const [tripCounts, setTripCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    yatra_name: "",
    start_date: "",
    end_date: "",
    start_time: "",
    return_time: "",
    image_url: "",
    rate_per_seat: "",
    status: "active",
  });
  const [message, setMessage] = useState(null);

  // ===== DETAILS MODAL STATE =====
  const [selectedYatraId, setSelectedYatraId] = useState(null);
  const [selectedYatraName, setSelectedYatraName] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Itinerary state
  const [itinerary, setItinerary] = useState([]);
  const [newItinerary, setNewItinerary] = useState({ 
    day_number: '', 
    title: '', 
    description: '', 
    description_hi: '',
    inclusion: '', 
    inclusion_hi: '',
    exclusion: '', 
    exclusion_hi: '',
    notes: '', 
    notes_hi: '' 
  });
  
  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState({ customer_name: '', rating: 5, comment: '' });
  
  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [newGalleryImage, setNewGalleryImage] = useState({ image_url: '', caption: '' });
  const [uploadingGallery, setUploadingGallery] = useState(false);

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
    active: 0,
    upcoming: 0,
    completed: 0,
    totalTrips: 0,
  });

  useEffect(() => {
    loadYatras();
    loadTripCounts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [yatras, tripCounts]);

  const calculateStats = () => {
    const total = yatras.length;
    const today = new Date();
    
    const active = yatras.filter(y => {
      const start = new Date(y.start_date);
      const end = new Date(y.end_date);
      return today >= start && today <= end;
    }).length;
    
    const upcoming = yatras.filter(y => {
      const start = new Date(y.start_date);
      return today < start;
    }).length;
    
    const completed = yatras.filter(y => {
      const end = new Date(y.end_date);
      return today > end;
    }).length;
    
    const totalTrips = Object.values(tripCounts).reduce((a, b) => a + b, 0);

    setStats({ total, active, upcoming, completed, totalTrips });
  };

  const loadYatras = async () => {
    try {
      setLoading(true);
      const data = await getYatras();
      setYatras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading yatras:", error);
      showMessage("Failed to load yatras", "error");
      setYatras([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTripCounts = async () => {
    try {
      const response = await api.get("/yatra-bookings/trips");
      const trips = Array.isArray(response.data) ? response.data : [];
      const counts = {};
      trips.forEach(trip => {
        counts[trip.yatra_id] = (counts[trip.yatra_id] || 0) + 1;
      });
      setTripCounts(counts);
    } catch (error) {
      console.error("Error loading trip counts:", error);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (yatra) => {
    setEditingId(yatra.id);
    setFormData({
      yatra_name: yatra.yatra_name || "",
      start_date: yatra.start_date || "",
      end_date: yatra.end_date || "",
      start_time: yatra.start_time || "",
      return_time: yatra.return_time || "",
      image_url: yatra.image_url || "",
      rate_per_seat: yatra.rate_per_seat || "",
      status: yatra.status || "active",
    });
    setShowForm(true);
  };

  // ===== IMAGE UPLOAD HANDLER =====
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size should be less than 5MB', 'error');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await fetch('http://31.97.62.121:5000/api/uploads/yatra-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Server response:', text);
        throw new Error(`Server returned ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, image_url: result.imageUrl }));
        showMessage('Image uploaded successfully!', 'success');
      } else {
        showMessage(result.error || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Failed to upload image: ' + error.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (formData.image_url && window.confirm('Remove this image?')) {
      setFormData(prev => ({ ...prev, image_url: '' }));
      showMessage('Image removed', 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingId) {
        await updateYatra(editingId, formData);
        showMessage("Yatra updated successfully!", "success");
      } else {
        await createYatra(formData);
        showMessage("Yatra created successfully!", "success");
      }
      setFormData({
        yatra_name: "",
        start_date: "",
        end_date: "",
        start_time: "",
        return_time: "",
        image_url: "",
        rate_per_seat: "",
        status: "active",
      });
      setEditingId(null);
      setShowForm(false);
      loadYatras();
      loadTripCounts();
    } catch (error) {
      console.error("Error saving yatra:", error);
      showMessage("Failed to save yatra: " + (error.response?.data?.error || error.message), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete yatra "${name}"? This will remove all associated trips.`)) return;
    
    try {
      setActionLoading(true);
      await deleteYatra(id);
      showMessage("Yatra deleted successfully!", "success");
      loadYatras();
      loadTripCounts();
    } catch (error) {
      console.error("Error deleting yatra:", error);
      showMessage("Failed to delete yatra", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      yatra_name: "",
      start_date: "",
      end_date: "",
      start_time: "",
      return_time: "",
      image_url: "",
      rate_per_seat: "",
      status: "active",
    });
    setEditingId(null);
    setShowForm(false);
  };

  // ============================================
  // DETAILS MODAL FUNCTIONS
  // ============================================

  const openDetailsModal = async (yatraId, yatraName) => {
    setSelectedYatraId(yatraId);
    setSelectedYatraName(yatraName);
    setShowDetailsModal(true);
    await loadYatraDetails(yatraId);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedYatraId(null);
    setSelectedYatraName('');
    setItinerary([]);
    setTestimonials([]);
    setGallery([]);
  };

  const loadYatraDetails = async (yatraId) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/yatra-details/${yatraId}`);
      const data = response.data;
      setItinerary(data.itinerary || []);
      setTestimonials(data.testimonials || []);
      setGallery(data.gallery || []);
    } catch (error) {
      console.error('Error loading yatra details:', error);
      showMessage('Failed to load yatra details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  // ===== ITINERARY CRUD =====
  const handleAddItinerary = async () => {
    if (!newItinerary.title) {
      showMessage('Title is required', 'error');
      return;
    }

    try {
      const response = await api.post(`/yatra-details/${selectedYatraId}/itinerary`, newItinerary);
      if (response.data.success) {
        showMessage('Itinerary added successfully', 'success');
        setNewItinerary({ 
          day_number: '', 
          title: '', 
          description: '', 
          description_hi: '',
          inclusion: '', 
          inclusion_hi: '',
          exclusion: '', 
          exclusion_hi: '',
          notes: '', 
          notes_hi: '' 
        });
        loadYatraDetails(selectedYatraId);
      }
    } catch (error) {
      console.error('Error adding itinerary:', error);
      showMessage('Failed to add itinerary', 'error');
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (!window.confirm('Delete this itinerary item?')) return;
    try {
      await api.delete(`/yatra-details/itinerary/${id}`);
      showMessage('Itinerary deleted', 'success');
      loadYatraDetails(selectedYatraId);
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      showMessage('Failed to delete itinerary', 'error');
    }
  };

  // ===== TESTIMONIALS CRUD =====
  const handleAddTestimonial = async () => {
    if (!newTestimonial.customer_name || !newTestimonial.comment) {
      showMessage('Customer name and comment are required', 'error');
      return;
    }

    try {
      const response = await api.post(`/yatra-details/${selectedYatraId}/testimonials`, newTestimonial);
      if (response.data.success) {
        showMessage('Testimonial added successfully', 'success');
        setNewTestimonial({ customer_name: '', rating: 5, comment: '' });
        loadYatraDetails(selectedYatraId);
      }
    } catch (error) {
      console.error('Error adding testimonial:', error);
      showMessage('Failed to add testimonial', 'error');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await api.delete(`/yatra-details/testimonials/${id}`);
      showMessage('Testimonial deleted', 'success');
      loadYatraDetails(selectedYatraId);
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showMessage('Failed to delete testimonial', 'error');
    }
  };

  // ===== GALLERY CRUD =====
  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size should be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingGallery(true);
    try {
      const response = await fetch('http://31.97.62.121:5000/api/uploads/yatra-image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.success) {
        setNewGalleryImage({ ...newGalleryImage, image_url: result.imageUrl });
        showMessage('Image uploaded successfully!', 'success');
      } else {
        showMessage(result.error || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Failed to upload image', 'error');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleAddGallery = async () => {
    if (!newGalleryImage.image_url) {
      showMessage('Please upload an image first', 'error');
      return;
    }

    try {
      const response = await api.post(`/yatra-details/${selectedYatraId}/gallery`, newGalleryImage);
      if (response.data.success) {
        showMessage('Gallery image added successfully', 'success');
        setNewGalleryImage({ image_url: '', caption: '' });
        loadYatraDetails(selectedYatraId);
      }
    } catch (error) {
      console.error('Error adding gallery image:', error);
      showMessage('Failed to add gallery image', 'error');
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      await api.delete(`/yatra-details/gallery/${id}`);
      showMessage('Gallery image deleted', 'success');
      loadYatraDetails(selectedYatraId);
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      showMessage('Failed to delete gallery image', 'error');
    }
  };

  const filteredYatras = yatras.filter(yatra =>
    yatra.yatra_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🚌 Yatra Master</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage all yatras and tour packages
          </p>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-2xl font-bold text-blue-500">{stats.total}</div>
          <div className="text-sm">Total Yatras</div>
        </div>
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          <div className="text-sm">Active</div>
        </div>
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-2xl font-bold text-yellow-500">{stats.upcoming}</div>
          <div className="text-sm">Upcoming</div>
        </div>
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-2xl font-bold text-gray-500">{stats.completed}</div>
          <div className="text-sm">Completed</div>
        </div>
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-2xl font-bold text-purple-500">{stats.totalTrips}</div>
          <div className="text-sm">Total Trips</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search & Add */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search yatras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
        />
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              yatra_name: "",
              start_date: "",
              end_date: "",
              start_time: "",
              return_time: "",
              image_url: "",
              rate_per_seat: "",
              status: "active",
            });
            setShowForm(!showForm);
          }}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          {showForm ? '✕ Close' : '+ Add Yatra'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`p-6 rounded-lg shadow mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">{editingId ? '✏️ Edit Yatra' : '➕ Add New Yatra'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Yatra Name *</label>
                <input
                  type="text"
                  name="yatra_name"
                  value={formData.yatra_name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate per Seat (₹)</label>
                <input
                  type="number"
                  name="rate_per_seat"
                  value={formData.rate_per_seat}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  step="100"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'active'}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  step="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Return Time (Approx)</label>
                <input
                  type="text"
                  name="return_time"
                  value={formData.return_time || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 7-8 PM"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Yatra Image</label>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="imageUpload"
                      className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition ${
                        uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <FaUpload className="mr-2" />
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </label>
                    <span className="text-xs text-gray-500 ml-2">(JPG, PNG, GIF, WebP - Max 5MB)</span>
                  </div>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition"
                    >
                      <FaTrash className="mr-1" /> Remove
                    </button>
                  )}
                </div>
                {formData.image_url && (
                  <div className="mt-3">
                    <img 
                      src={formData.image_url.startsWith('http') ? formData.image_url : `http://31.97.62.121:5000${formData.image_url}`}
                      alt="Yatra Preview" 
                      className="h-40 w-full max-w-xs object-cover rounded-lg border border-gray-300"
                      onError={(e) => { 
                        e.target.src = '';
                        e.target.alt = 'Invalid image URL';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : editingId ? 'Update Yatra' : 'Create Yatra'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Yatra List */}
      <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Image</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Yatra Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Return Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Trips</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredYatras.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-gray-500">
                    No yatras found
                  </td>
                </tr>
              ) : (
                filteredYatras.map((yatra) => (
                  <tr key={yatra.id} className={`border-t ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 text-sm">{yatra.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {yatra.image_url ? (
                        <img 
                          src={yatra.image_url.startsWith('http') ? yatra.image_url : `http://31.97.62.121:5000${yatra.image_url}`}
                          alt={yatra.yatra_name} 
                          className="h-12 w-12 object-cover rounded-lg"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{yatra.yatra_name}</td>
                    <td className="px-4 py-3 text-sm">{yatra.start_date ? new Date(yatra.start_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm">{yatra.start_time || '-'}</td>
                    <td className="px-4 py-3 text-sm">{yatra.end_date ? new Date(yatra.end_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-sm">{yatra.return_time || '-'}</td>
                    <td className="px-4 py-3 text-sm">₹{yatra.rate_per_seat}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        yatra.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        yatra.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        yatra.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {yatra.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{tripCounts[yatra.id] || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleEdit(yatra)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(yatra.id, yatra.yatra_name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                        >
                          🗑️ Delete
                        </button>
                        <button
                          onClick={() => openDetailsModal(yatra.id, yatra.yatra_name)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                        >
                          📋 Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* DETAILS MODAL */}
      {/* ============================================ */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                📋 Manage Details: <span className="text-purple-500">{selectedYatraName}</span>
              </h2>
              <button
                onClick={closeDetailsModal}
                className="text-red-500 hover:text-red-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4">Loading details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ===== ITINERARY SECTION ===== */}
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <FaMapMarkedAlt className="mr-2 text-purple-500" /> Itinerary
                  </h3>
                  
                  <div className="mb-2 text-sm text-gray-500">
                    <span className="inline-block mr-4">📅 <strong>1. Itinerary</strong></span>
                    <span className="inline-block mr-4">✅ <strong>2. Inclusions</strong></span>
                    <span className="inline-block mr-4">❌ <strong>3. Exclusions</strong></span>
                    <span className="inline-block">📝 <strong>4. Notes</strong></span>
                    <span className="inline-block ml-4 text-purple-600">🌐 <strong>English & Hindi</strong></span>
                  </div>
                  
                  {/* Add Itinerary Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="Day Number (optional - auto assigned)"
                      value={newItinerary.day_number}
                      onChange={(e) => setNewItinerary({ ...newItinerary, day_number: e.target.value })}
                      className={`p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <input
                      type="text"
                      placeholder="Title *"
                      value={newItinerary.title}
                      onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
                      className={`p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-purple-600">📅 Itinerary (English)</label>
                      <textarea
                        placeholder="Day-wise plan, activities, schedule (Shift+Enter)"
                        value={newItinerary.description}
                        onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-purple-600">📅 Itinerary (हिंदी)</label>
                      <textarea
                        placeholder="यात्रा कार्यक्रम, गतिविधियाँ, शेड्यूल"
                        value={newItinerary.description_hi}
                        onChange={(e) => setNewItinerary({ ...newItinerary, description_hi: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-600">✅ Inclusions (English)</label>
                      <textarea
                        placeholder="What's included"
                        value={newItinerary.inclusion}
                        onChange={(e) => setNewItinerary({ ...newItinerary, inclusion: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-600">✅ Inclusions (हिंदी)</label>
                      <textarea
                        placeholder="क्या शामिल है"
                        value={newItinerary.inclusion_hi}
                        onChange={(e) => setNewItinerary({ ...newItinerary, inclusion_hi: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-red-600">❌ Exclusions (English)</label>
                      <textarea
                        placeholder="What's NOT included"
                        value={newItinerary.exclusion}
                        onChange={(e) => setNewItinerary({ ...newItinerary, exclusion: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-red-600">❌ Exclusions (हिंदी)</label>
                      <textarea
                        placeholder="क्या शामिल नहीं है"
                        value={newItinerary.exclusion_hi}
                        onChange={(e) => setNewItinerary({ ...newItinerary, exclusion_hi: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-yellow-600">📝 Notes (English)</label>
                      <textarea
                        placeholder="What to do / What NOT to do"
                        value={newItinerary.notes}
                        onChange={(e) => setNewItinerary({ ...newItinerary, notes: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-yellow-600">📝 Notes (हिंदी)</label>
                      <textarea
                        placeholder="क्या करें / क्या न करें"
                        value={newItinerary.notes_hi}
                        onChange={(e) => setNewItinerary({ ...newItinerary, notes_hi: e.target.value })}
                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows="2"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddItinerary}
                    className="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition w-full"
                  >
                    <FaPlus className="inline mr-2" /> Add Day
                  </button>

                  {/* Itinerary List */}
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {itinerary.length === 0 ? (
                      <p className="text-gray-500 text-sm">No itinerary added yet</p>
                    ) : (
                      itinerary.map((item) => (
                        <div key={item.id} className={`flex justify-between items-start p-2 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <strong>Day {item.day_number}:</strong>
                              <span>{item.title}</span>
                            </div>
                            {item.description && <p className="text-sm text-gray-500 whitespace-pre-line mt-1">📅 EN: {item.description}</p>}
                            {item.description_hi && <p className="text-sm text-purple-600 whitespace-pre-line mt-1">📅 HI: {item.description_hi}</p>}
                            {item.inclusion && <p className="text-sm text-green-600 whitespace-pre-line mt-1">✅ EN: {item.inclusion}</p>}
                            {item.inclusion_hi && <p className="text-sm text-green-600 whitespace-pre-line mt-1">✅ HI: {item.inclusion_hi}</p>}
                            {item.exclusion && <p className="text-sm text-red-600 whitespace-pre-line mt-1">❌ EN: {item.exclusion}</p>}
                            {item.exclusion_hi && <p className="text-sm text-red-600 whitespace-pre-line mt-1">❌ HI: {item.exclusion_hi}</p>}
                            {item.notes && <p className="text-sm text-yellow-600 whitespace-pre-line mt-1">📝 EN: {item.notes}</p>}
                            {item.notes_hi && <p className="text-sm text-yellow-600 whitespace-pre-line mt-1">📝 HI: {item.notes_hi}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteItinerary(item.id)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ===== TESTIMONIALS SECTION ===== */}
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <FaStar className="mr-2 text-yellow-500" /> Testimonials
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={newTestimonial.customer_name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, customer_name: e.target.value })}
                      className={`p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <select
                      value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                      className={`p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </select>
                    <button
                      onClick={handleAddTestimonial}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      <FaPlus className="inline mr-1" /> Add Testimonial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Comment"
                    value={newTestimonial.comment}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />

                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {testimonials.length === 0 ? (
                      <p className="text-gray-500 text-sm">No testimonials yet</p>
                    ) : (
                      testimonials.map((item) => (
                        <div key={item.id} className={`flex justify-between items-start p-2 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div>
                            <div className="text-yellow-500 text-sm">{'⭐'.repeat(Math.min(item.rating || 5, 5))}</div>
                            <p className="text-sm">"{item.comment}"</p>
                            <p className="text-xs text-gray-500">- {item.customer_name}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteTestimonial(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ===== GALLERY SECTION ===== */}
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <FaImage className="mr-2 text-green-500" /> Gallery
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      className="hidden"
                      id="galleryUpload"
                      disabled={uploadingGallery}
                    />
                    <label
                      htmlFor="galleryUpload"
                      className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition ${
                        uploadingGallery ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <FaUpload className="mr-2" />
                      {uploadingGallery ? 'Uploading...' : 'Choose Image'}
                    </label>
                    <input
                      type="text"
                      placeholder="Caption"
                      value={newGalleryImage.caption}
                      onChange={(e) => setNewGalleryImage({ ...newGalleryImage, caption: e.target.value })}
                      className={`flex-1 min-w-[150px] p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <button
                      onClick={handleAddGallery}
                      disabled={!newGalleryImage.image_url}
                      className={`px-4 py-2 rounded-lg transition ${
                        newGalleryImage.image_url 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <FaPlus className="inline mr-1" /> Add Image
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                    {gallery.length === 0 ? (
                      <p className="text-gray-500 text-sm col-span-4">No gallery images yet</p>
                    ) : (
                      gallery.map((item) => (
                        <div key={item.id} className={`relative rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <img 
                            src={`http://31.97.62.121:5000${item.image_url}`}
                            alt={item.caption || 'Gallery image'}
                            className="w-full h-24 object-cover"
                            onError={(e) => { e.target.src = ''; }}
                          />
                          {item.caption && (
                            <div className="text-xs p-1 text-center truncate">{item.caption}</div>
                          )}
                          <button
                            onClick={() => handleDeleteGallery(item.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default YatraMasterPage;
