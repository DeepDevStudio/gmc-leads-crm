import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [yatras, setYatras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYatra, setFilterYatra] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const [stats, setStats] = useState({
    totalTrips: 0,
    ongoingTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [trips]);

  const calculateStats = () => {
    const totalTrips = trips.length;
    const ongoingTrips = trips.filter(t => {
      const status = getTripStatus(t.start_date, t.end_date);
      return status.label === 'Ongoing';
    }).length;
    const upcomingTrips = trips.filter(t => {
      const status = getTripStatus(t.start_date, t.end_date);
      return status.label === 'Upcoming';
    }).length;
    const completedTrips = trips.filter(t => {
      const status = getTripStatus(t.start_date, t.end_date);
      return status.label === 'Completed';
    }).length;
    const totalCustomers = trips.reduce((sum, t) => sum + (t.customerCount || 0), 0);
    const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

    setStats({
      totalTrips,
      ongoingTrips,
      upcomingTrips,
      completedTrips,
      totalCustomers,
      totalRevenue
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsRes, yatrasRes] = await Promise.all([
        api.get('/yatra-bookings/trips'),
        api.get('/yatras')
      ]);
      
      if (Array.isArray(tripsRes.data)) {
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
      return { label: 'Completed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: '✅' };
    } else if (start <= today && end >= today) {
      return { label: 'Ongoing', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🔄' };
    } else {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '📅' };
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateTripStatus = async (tripId, status) => {
    setActionLoading(true);
    try {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;

      await api.put(`/yatra-bookings/trips/${tripId}`, {
        ...trip,
        status: status
      });
      showMessage(`Trip status updated to ${status}!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating trip status:', error);
      showMessage('Failed to update trip status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const exportTrips = () => {
    if (filteredTrips.length === 0) {
      showMessage('No trips to export', 'error');
      return;
    }

    const headers = ['#', 'Trip Name', 'Yatra', 'Start Date', 'End Date', 'Customers', 'Revenue', 'Status'];
    const rows = filteredTrips.map((trip, index) => [
      index + 1,
      trip.trip_name || trip.title || 'N/A',
      trip.yatra_name || 'N/A',
      formatDate(trip.start_date),
      formatDate(trip.end_date),
      trip.customerCount || 0,
      `₹${(trip.revenue || 0).toFixed(2)}`,
      getTripStatus(trip.start_date, trip.end_date).label
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += `Total Trips,${filteredTrips.length}\n`;
    csv += `Ongoing,${filteredTrips.filter(t => getTripStatus(t.start_date, t.end_date).label === 'Ongoing').length}\n`;
    csv += `Upcoming,${filteredTrips.filter(t => getTripStatus(t.start_date, t.end_date).label === 'Upcoming').length}\n`;
    csv += `Completed,${filteredTrips.filter(t => getTripStatus(t.start_date, t.end_date).label === 'Completed').length}\n`;
    csv += `Total Customers,${filteredTrips.reduce((sum, t) => sum + (t.customerCount || 0), 0)}\n`;
    csv += `Total Revenue,₹${filteredTrips.reduce((sum, t) => sum + (t.revenue || 0), 0).toFixed(2)}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage(`📥 Exported ${filteredTrips.length} trips`, 'success');
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.trip_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.yatra_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYatra = filterYatra === 'all' || trip.yatra_id === parseInt(filterYatra);
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = getTripStatus(trip.start_date, trip.end_date);
      matchesStatus = status.label.toLowerCase() === filterStatus;
    }

    let matchesDate = true;
    if (dateRange.start && trip.start_date) {
      const tripStart = new Date(trip.start_date);
      const filterStart = new Date(dateRange.start);
      if (tripStart < filterStart) matchesDate = false;
    }
    if (dateRange.end && trip.end_date) {
      const tripEnd = new Date(trip.end_date);
      const filterEnd = new Date(dateRange.end);
      if (tripEnd > filterEnd) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesYatra && matchesDate;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDarkMode ? 'dark' : ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-blue-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Trips</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{stats.totalTrips}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-green-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Ongoing</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.ongoingTrips}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-blue-400`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Upcoming</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.upcomingTrips}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-gray-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Completed</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.completedTrips}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-purple-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Customers</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.totalCustomers}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-3 border-l-4 border-yellow-500`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Revenue</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">₹{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
          {error}
          <button onClick={fetchData} className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 mb-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="all">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterYatra}
            onChange={(e) => setFilterYatra(e.target.value)}
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="all">All Yatras</option>
            {yatras.map(yatra => (
              <option key={yatra.id} value={yatra.id}>
                {yatra.yatra_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className={`border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
          />
          <button
            onClick={exportTrips}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            📥 Export
          </button>
          <button
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrips.map((trip) => {
          const status = getTripStatus(trip.start_date, trip.end_date);
          const totalRevenue = trip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0;
          const customerCount = trip.customers?.length || 0;
          const bookedSeats = trip.booked_seats || 0;
          const totalSeats = trip.total_seats || 0;

          return (
            <div
              key={trip.id}
              className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow-md border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} hover:shadow-lg transition cursor-pointer overflow-hidden`}
              onClick={() => handleTripClick(trip.id)}
            >
              <div className={`${isDarkMode ? 'bg-gradient-to-r from-slate-700 to-slate-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white p-3`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{trip.trip_name || trip.title}</h3>
                    <p className="text-xs opacity-90">{trip.yatra_name || 'Yatra Trip'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ml-2 flex-shrink-0`}>
                    {status.icon} {status.label}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>📅 Start:</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(trip.start_date)}</div>
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>📅 End:</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(trip.end_date)}</div>
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>💺 Seats:</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{bookedSeats}/{totalSeats}</div>
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>👥 Customers:</div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{customerCount}</div>
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>💰 Revenue:</div>
                  <div className="text-green-600 dark:text-green-400 font-bold">₹{totalRevenue.toFixed(2)}</div>
                </div>

                {totalSeats > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${(bookedSeats / totalSeats) * 100}%` }}
                    ></div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTripClick(trip.id);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                  >
                    📋 View
                  </button>
                  
                  {customerCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showMessage(`Exporting ${customerCount} customers...`, 'info');
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition"
                    >
                      📥 Export
                    </button>
                  )}

                  {status.label !== 'Completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTripStatus(trip.id, 'completed');
                      }}
                      disabled={actionLoading}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                    >
                      ✅ Complete
                    </button>
                  )}

                  {status.label === 'Completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateTripStatus(trip.id, 'active');
                      }}
                      disabled={actionLoading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                    >
                      🔄 Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className={`col-span-full text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
            {searchTerm || filterStatus !== 'all' || dateRange.start || dateRange.end ? (
              <div>
                <p className="text-lg">No trips match your filters</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div>
                <p className="text-lg">No trips found</p>
                <p className="text-sm mt-2">Create your first trip from the Yatra Bookings page</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsPage;
