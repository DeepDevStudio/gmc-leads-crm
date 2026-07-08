import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [yatras, setYatras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYatra, setFilterYatra] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsRes, yatrasRes] = await Promise.all([
        axios.get('/api/yatra-bookings/trips'),
        axios.get('/api/yatras')
      ]);
      
      if (Array.isArray(tripsRes.data)) {
        // Calculate revenue for each trip
        const tripsWithRevenue = tripsRes.data.map(trip => ({
          ...trip,
          revenue: trip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0,
          customerCount: trip.customers?.length || 0
        }));
        setTrips(tripsWithRevenue);
      } else {
        setTrips([]);
        setError('Received unexpected data format from server.');
      }
      
      if (Array.isArray(yatrasRes.data)) {
        setYatras(yatrasRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check your backend connection.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = (id) => {
    navigate(`/trips/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getTripStatus = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
    } else if (start <= today && end >= today) {
      return { label: 'Ongoing', color: 'bg-green-100 text-green-700' };
    } else {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    }
  };

  const handleDeleteTrip = async (id, name) => {
    if (!window.confirm(`Delete trip "${name}"? This will remove all customers and travelers.`)) return;

    try {
      await axios.delete(`/api/yatra-bookings/trips/${id}`);
      showMessage('Trip deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting trip:', error);
      showMessage('Failed to delete trip', 'error');
    }
  };

  const showMessage = (text, type = 'success') => {
    // Simple alert for now
    alert(text);
  };

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const name = (trip.trip_name || '').toLowerCase();
      const yatra = (trip.yatra_name || '').toLowerCase();
      if (!name.includes(search) && !yatra.includes(search)) {
        return false;
      }
    }
    if (filterYatra !== 'all' && trip.yatra_id !== parseInt(filterYatra)) {
      return false;
    }
    if (filterStatus !== 'all') {
      const status = getTripStatus(trip.start_date, trip.end_date).label.toLowerCase();
      if (status !== filterStatus) {
        return false;
      }
    }
    return true;
  });

  // Summary stats
  const totalTrips = trips.length;
  const totalSeats = trips.reduce((sum, t) => sum + (t.total_seats || 0), 0);
  const bookedSeats = trips.reduce((sum, t) => sum + (t.booked_seats || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalCustomers = trips.reduce((sum, t) => sum + (t.customerCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🎒 Yatra Trips</h1>
          <p className="text-gray-500 text-sm">Manage all yatra trips and customer bookings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/yatra-bookings')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <span className="text-xl">+</span> Go to Bookings
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Trips</p>
          <p className="text-2xl font-bold text-blue-600">{totalTrips}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Seats</p>
          <p className="text-2xl font-bold text-green-600">{totalSeats}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Booked Seats</p>
          <p className="text-2xl font-bold text-purple-600">{bookedSeats}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Available Seats</p>
          <p className="text-2xl font-bold text-orange-600">{totalSeats - bookedSeats}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-emerald-500">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by trip or yatra name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg p-2 text-sm flex-1 min-w-[150px] focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select
          value={filterYatra}
          onChange={(e) => setFilterYatra(e.target.value)}
          className="border rounded-lg p-2 text-sm min-w-[200px] focus:ring-2 focus:ring-yellow-400 outline-none"
        >
          <option value="all">📌 All Yatras</option>
          {yatras.map((yatra) => (
            <option key={yatra.id} value={yatra.id}>
              {yatra.yatra_name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
        >
          <option value="all">All Status</option>
          <option value="upcoming">📅 Upcoming</option>
          <option value="ongoing">🟢 Ongoing</option>
          <option value="completed">✅ Completed</option>
        </select>
        {(filterYatra !== 'all' || filterStatus !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterYatra('all');
              setFilterStatus('all');
            }}
            className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm transition"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Trips Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading trips...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No trips found</p>
          <p className="text-gray-400 text-sm">Go to Bookings to create your first yatra trip!</p>
          <button
            onClick={() => navigate('/yatra-bookings')}
            className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg transition"
          >
            Go to Bookings →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => {
            const status = getTripStatus(trip.start_date, trip.end_date);
            const booked = trip.booked_seats || 0;
            const total = trip.total_seats || 0;
            const available = total - booked;
            const revenue = trip.revenue || 0;
            const customerCount = trip.customerCount || 0;
            
            return (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-yellow-400 overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-yellow-600 transition">
                        {trip.trip_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        🚌 {trip.yatra_name}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </p>
                  
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-bold text-blue-600">{total}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Booked</p>
                      <p className="text-sm font-bold text-green-600">{booked}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Available</p>
                      <p className={`text-sm font-bold ${available > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {available}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Customers: <span className="font-bold text-gray-600">{customerCount}</span></p>
                      <p className="text-xs text-gray-400">Revenue: <span className="font-bold text-emerald-600">₹{revenue.toFixed(0)}</span></p>
                    </div>
                    <span className="text-yellow-600 text-sm font-medium group-hover:translate-x-1 transition">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
