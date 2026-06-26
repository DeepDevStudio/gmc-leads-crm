import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    phone: '',
    seats: 1,
    ticket_price: 0,
    discount: 0,
    advance: 0,
    notes: ''
  });

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/trips/${id}`);
      setTrip(response.data.trip);
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewBooking({
      ...newBooking,
      [e.target.name]: e.target.value
    });
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/trips/${id}/bookings`, newBooking);
      setNewBooking({
        customer_name: '',
        phone: '',
        seats: 1,
        ticket_price: 0,
        discount: 0,
        advance: 0,
        notes: ''
      });
      setShowBookingForm(false);
      fetchTripDetails();
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Failed to add booking. Please try again.');
    }
  };

  const calculateTotal = (booking) => {
    const total = (booking.seats * booking.ticket_price) - booking.discount;
    return total;
  };

  const calculateBalance = (booking) => {
    const total = calculateTotal(booking);
    return total - booking.advance;
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Trip not found</p>
        <button
          onClick={() => navigate('/trips')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Trips
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/trips')}
          className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1"
        >
          ← Back to Trips
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{trip.title}</h1>
            <p className="text-gray-600">{trip.location}</p>
            <p className="text-sm text-gray-500">
              📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </p>
          </div>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <span className="text-xl">+</span> Add Booking
          </button>
        </div>
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Add New Booking</h2>
          <form onSubmit={handleAddBooking}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Full name"
                  value={newBooking.customer_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone number"
                  value={newBooking.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Seats *
                </label>
                <input
                  type="number"
                  name="seats"
                  min="1"
                  value={newBooking.seats}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Price (₹) *
                </label>
                <input
                  type="number"
                  name="ticket_price"
                  min="0"
                  step="0.01"
                  value={newBooking.ticket_price}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  step="0.01"
                  value={newBooking.discount}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Payment (₹) *
                </label>
                <input
                  type="number"
                  name="advance"
                  min="0"
                  step="0.01"
                  value={newBooking.advance}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Any special notes..."
                  value={newBooking.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
              >
                Save Booking
              </button>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Bookings ({bookings.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Seats</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Discount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Advance</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No bookings yet. Click "Add Booking" to add one!
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const total = calculateTotal(booking);
                  const balance = calculateBalance(booking);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{booking.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{booking.phone}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">{booking.seats}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">₹{booking.ticket_price}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">₹{booking.discount}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">₹{total}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">₹{booking.advance}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          ₹{balance}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TripDetailsPage;