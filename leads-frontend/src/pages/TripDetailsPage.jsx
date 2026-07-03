import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/yatra-bookings/trips/${id}`);
      setTrip(response.data);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const totalCustomers = customers.length;
  const totalSeats = customers.reduce((sum, c) => sum + (c.total_seats || 0), 0);
  const totalAmount = customers.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const totalAdvance = customers.reduce((sum, c) => sum + (c.advance_amount || 0), 0);
  const totalBalance = customers.reduce((sum, c) => sum + (c.balance_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error || 'Trip not found'}</p>
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
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/trips')}
        className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1"
      >
        ← Back to Trips
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{trip.trip_name}</h1>
            <p className="text-gray-600">🚌 {trip.yatra_name}</p>
            <p className="text-sm text-gray-500 mt-1">
              📅 {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </p>
            <p className="text-sm text-gray-500">
              💰 Rate: ₹{trip.rate_per_seat}/seat
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Seats</p>
            <p className="text-lg font-bold">
              {trip.booked_seats || 0} / {trip.total_seats}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              (trip.booked_seats || 0) >= (trip.total_seats || 0) 
                ? 'bg-red-100 text-red-700' 
                : (trip.booked_seats || 0) > 0 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {(trip.booked_seats || 0) >= (trip.total_seats || 0) 
                ? 'Full' 
                : (trip.booked_seats || 0) > 0 
                ? 'Partial' 
                : 'Empty'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Customers</p>
            <p className="text-xl font-bold text-blue-600">{totalCustomers}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Total Seats</p>
            <p className="text-xl font-bold text-green-600">{totalSeats}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-purple-600">₹{totalAmount}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Total Advance</p>
            <p className="text-xl font-bold text-emerald-600">₹{totalAdvance}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Total Balance</p>
            <p className="text-xl font-bold text-orange-600">₹{totalBalance}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Customers ({totalCustomers})
          </h2>
          <button
            onClick={() => navigate('/yatra-bookings')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm transition"
          >
            Manage Bookings →
          </button>
        </div>
        
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No customers booked for this trip yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Seats</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Travelers</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Advance</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{customer.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold">{customer.total_seats}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.travelers?.map((t, i) => (
                        <div key={i} className="text-xs border-b border-gray-100 py-0.5">
                          {t.traveler_name} ({t.relation}, {t.gender}, {t.age || 'N/A'} yrs)
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold">₹{customer.total_amount}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">₹{customer.advance_amount}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">₹{customer.balance_amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-yellow-50 border-t-2 border-yellow-400">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-sm font-bold text-gray-800">TOTALS</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-800">{totalSeats}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-purple-600">₹{totalAmount}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-600">₹{totalAdvance}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-red-600">₹{totalBalance}</td>
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
