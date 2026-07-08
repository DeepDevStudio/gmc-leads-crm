import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const TripDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [seats, setSeats] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editFormData, setEditFormData] = useState({
    trip_name: '',
    start_date: '',
    end_date: '',
    total_seats: '',
    status: 'active'
  });
  const [message, setMessage] = useState(null);

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
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/yatra-bookings/trips/${id}`);
      const data = response.data;
      setTrip(data);
      
      // Parse customers data
      const parsedCustomers = (data.customers || []).map(customer => ({
        ...customer,
        total_seats: parseInt(customer.total_seats) || 1,
        total_amount: parseFloat(customer.total_amount) || 0,
        advance_amount: parseFloat(customer.advance_amount) || 0,
        balance_amount: parseFloat(customer.balance_amount) || 0,
        seat_numbers: customer.seat_numbers ? 
          (Array.isArray(customer.seat_numbers) ? customer.seat_numbers : customer.seat_numbers.split(',').map(s => parseInt(s.trim()))) : 
          []
      }));
      setCustomers(parsedCustomers);
      setSeats(data.seats || []);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ===== UPDATE TRIP =====
  const handleEditTrip = () => {
    if (trip) {
      setEditFormData({
        trip_name: trip.trip_name || '',
        start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '',
        end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : '',
        total_seats: trip.total_seats || '',
        status: trip.status || 'active'
      });
      setShowEditTrip(true);
    }
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/yatra-bookings/trips/${id}`, editFormData);
      showMessage('✅ Trip updated successfully!', 'success');
      setShowEditTrip(false);
      fetchTripDetails();
    } catch (error) {
      console.error('Error updating trip:', error);
      showMessage('Failed to update trip', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  // ===== EXPORT CUSTOMERS =====
  const exportCustomers = () => {
    if (customers.length === 0) {
      showMessage('No customers to export', 'error');
      return;
    }

    const headers = ['#', 'Customer', 'Phone', 'Seats', 'Seat Numbers', 'Total (₹)', 'Advance (₹)', 'Balance (₹)', 'Location'];
    const rows = customers.map((customer, index) => [
      index + 1,
      customer.customer_name || '',
      customer.phone || '',
      customer.total_seats || 0,
      customer.seat_numbers?.join(', ') || 'N/A',
      parseFloat(customer.total_amount || 0).toFixed(2),
      parseFloat(customer.advance_amount || 0).toFixed(2),
      parseFloat(customer.balance_amount || 0).toFixed(2),
      customer.location || 'N/A'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    csv += '\n\n📊 SUMMARY\n';
    csv += `Total Customers,${customers.length}\n`;
    csv += `Total Seats,${customers.reduce((sum, c) => sum + (parseInt(c.total_seats) || 0), 0)}\n`;
    csv += `Total Revenue,₹${customers.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0).toFixed(2)}\n`;
    csv += `Total Advance,₹${customers.reduce((sum, c) => sum + (parseFloat(c.advance_amount) || 0), 0).toFixed(2)}\n`;
    csv += `Total Balance,₹${customers.reduce((sum, c) => sum + (parseFloat(c.balance_amount) || 0), 0).toFixed(2)}\n`;
    csv += `Exported On,${new Date().toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip_${trip?.trip_name || 'customers'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage('📥 Customers exported successfully!', 'success');
  };

  // ===== PRINT TRIP DETAILS =====
  const printTripDetails = () => {
    window.print();
  };

  // Calculate totals with proper parsing
  const totalCustomers = customers.length;
  const totalSeats = customers.reduce((sum, c) => sum + (parseInt(c.total_seats) || 0), 0);
  const totalAmount = customers.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0);
  const totalAdvance = customers.reduce((sum, c) => sum + (parseFloat(c.advance_amount) || 0), 0);
  const totalBalance = customers.reduce((sum, c) => sum + (parseFloat(c.balance_amount) || 0), 0);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'dark' : ''}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className={`p-6 text-center ${isDarkMode ? 'dark' : ''}`}>
        <p className={`${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{error || 'Trip not found'}</p>
        <button
          onClick={() => navigate('/trips')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Trips
        </button>
      </div>
    );
  }

  const bookedSeats = parseInt(trip.booked_seats) || 0;
  const totalTripSeats = parseInt(trip.total_seats) || 0;
  const isFull = bookedSeats >= totalTripSeats && totalTripSeats > 0;
  const statusColor = isFull ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : bookedSeats > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  const statusLabel = isFull ? 'Full' : bookedSeats > 0 ? 'Partial' : 'Empty';

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700` : `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700`}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={() => navigate('/trips')}
        className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mb-4 inline-flex items-center gap-1 transition`}
      >
        ← Back to Trips
      </button>

      {/* Trip Details */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{trip.trip_name}</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>🚌 {trip.yatra_name || 'Yatra Trip'}</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              💰 Rate: ₹{parseFloat(trip.rate_per_seat || 0).toFixed(2)}/seat
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seats</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : ''}`}>
              {bookedSeats} / {totalTripSeats}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleEditTrip}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ✏️ Edit Trip
          </button>
          <button
            onClick={() => setShowSeatMap(!showSeatMap)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            {showSeatMap ? 'Hide Seat Map' : '🗺️ Seat Map'}
          </button>
          <button
            onClick={exportCustomers}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            📥 Export Customers
          </button>
          <button
            onClick={printTripDetails}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            🖨️ Print
          </button>
          <Link
            to="/yatra-bookings"
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm transition"
          >
            📋 Manage Bookings
          </Link>
        </div>

        {/* Edit Trip Form */}
        {showEditTrip && (
          <div className={`mt-4 p-4 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>✏️ Edit Trip</h3>
            <form onSubmit={handleUpdateTrip}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Trip Name</label>
                  <input
                    type="text"
                    name="trip_name"
                    value={editFormData.trip_name}
                    onChange={handleEditChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Total Seats</label>
                  <input
                    type="number"
                    name="total_seats"
                    value={editFormData.total_seats}
                    onChange={handleEditChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editFormData.start_date}
                    onChange={handleEditChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={editFormData.end_date}
                    onChange={handleEditChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditChange}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditTrip(false)}
                  className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-blue-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customers</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>{totalCustomers}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-green-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Seats</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-green-600'}`}>{totalSeats}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-purple-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-purple-600'}`}>₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-emerald-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Advance</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-600'}`}>₹{totalAdvance.toFixed(2)}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-orange-50'} p-3 rounded-lg text-center`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Balance</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-orange-600'}`}>₹{totalBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Seat Map */}
      {showSeatMap && seats.length > 0 && (
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🗺️ Seat Map</h3>
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400 border border-green-600"></div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400 border border-red-600"></div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Booked</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {seats.map((seat) => {
              const isBooked = seat.is_booked === 1;
              const customerName = seat.customer_name || '';
              return (
                <div
                  key={seat.id || seat.seat_number}
                  className={`p-2 rounded-lg text-center text-xs border-2 ${isBooked ? 'bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-700' : 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-700'}`}
                  title={isBooked ? `Booked by: ${customerName}` : 'Available'}
                >
                  <div className={`font-bold ${isDarkMode ? 'text-white' : ''}`}>{seat.seat_number}</div>
                  {isBooked && (
                    <div className={`text-[8px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-full`}>
                      {customerName.split(' ')[0] || 'Booked'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={`text-center mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Seats: {seats.length} | Booked: {seats.filter(s => s.is_booked === 1).length} | Available: {seats.filter(s => s.is_booked !== 1).length}
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow-md overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Customers ({totalCustomers})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportCustomers}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition"
            >
              📥 Export
            </button>
          </div>
        </div>
        
        {customers.length === 0 ? (
          <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No customers booked for this trip yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>#</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone</th>
                  <th className={`px-4 py-3 text-center text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Seats</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Seat Numbers</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Travelers</th>
                  <th className={`px-4 py-3 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total</th>
                  <th className={`px-4 py-3 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Advance</th>
                  <th className={`px-4 py-3 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Balance</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {customers.map((customer, index) => (
                  <tr key={customer.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition`}>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{index + 1}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{customer.customer_name}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.phone}</td>
                    <td className={`px-4 py-3 text-sm text-center font-bold ${isDarkMode ? 'text-white' : ''}`}>{customer.total_seats}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {customer.seat_numbers && customer.seat_numbers.length > 0 ? (
                        <span className={`${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded text-xs font-medium`}>
                          {customer.seat_numbers.join(', ')}
                        </span>
                      ) : (
                        <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {customer.travelers?.map((t, i) => (
                        <div key={i} className={`text-xs border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-100'} py-0.5`}>
                          {t.traveler_name} ({t.relation}, {t.gender}, {t.age || 'N/A'} yrs)
                        </div>
                      ))}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${isDarkMode ? 'text-white' : ''}`}>
                      ₹{parseFloat(customer.total_amount || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ₹{parseFloat(customer.advance_amount || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      ₹{parseFloat(customer.balance_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={`${isDarkMode ? 'bg-slate-700 border-t-2 border-yellow-500' : 'bg-yellow-50 border-t-2 border-yellow-400'}`}>
                <tr>
                  <td colSpan="3" className={`px-4 py-3 text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>TOTALS</td>
                  <td className={`px-4 py-3 text-sm text-center font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalSeats}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    ₹{totalAmount.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{totalAdvance.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    ₹{totalBalance.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailsPage;
