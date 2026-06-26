import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TripDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    phone: '',
    seats: 1,
    ticket_price: 0,
    discount: 0,
    advance: 0,
    advance_received_by: 'Rajeev',
    notes: ''
  });
  const [newExpense, setNewExpense] = useState({
    expense_name: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [newBalance, setNewBalance] = useState({
    amount: 0,
    mode: 'Cash',
    balance_date: new Date().toISOString().split('T')[0]
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
      setExpenses(response.data.expenses || []);
      setBalances(response.data.balances || []);
    } catch (error) {
      console.error('Error fetching trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== BOOKING FUNCTIONS ====================
  const handleBookingInputChange = (e) => {
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
        advance_received_by: 'Rajeev',
        notes: ''
      });
      setShowBookingForm(false);
      fetchTripDetails();
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Failed to add booking. Please try again.');
    }
  };

  // ==================== EXPENSE FUNCTIONS ====================
  const handleExpenseInputChange = (e) => {
    setNewExpense({
      ...newExpense,
      [e.target.name]: e.target.value
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/trips/${id}/expenses`, newExpense);
      setNewExpense({
        expense_name: '',
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0]
      });
      setShowExpenseForm(false);
      fetchTripDetails();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await axios.delete(`/api/trips/expenses/${expenseId}`);
      fetchTripDetails();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense.');
    }
  };

  // ==================== BALANCE FUNCTIONS ====================
  const handleBalanceInputChange = (e) => {
    setNewBalance({
      ...newBalance,
      [e.target.name]: e.target.value
    });
  };

  const handleAddBalance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/trips/${id}/balances`, newBalance);
      setNewBalance({
        amount: 0,
        mode: 'Cash',
        balance_date: new Date().toISOString().split('T')[0]
      });
      setShowBalanceForm(false);
      fetchTripDetails();
    } catch (error) {
      console.error('Error adding balance:', error);
      alert('Failed to add balance. Please try again.');
    }
  };

  const handleDeleteBalance = async (balanceId) => {
    if (!confirm('Delete this balance entry?')) return;
    try {
      await axios.delete(`/api/trips/balances/${balanceId}`);
      fetchTripDetails();
    } catch (error) {
      console.error('Error deleting balance:', error);
      alert('Failed to delete balance.');
    }
  };

  // ==================== CALCULATIONS ====================
  const calculateTotal = (booking) => {
    return (booking.seats * booking.ticket_price) - booking.discount;
  };

  const calculateBalance = (booking) => {
    return calculateTotal(booking) - booking.advance;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Totals
  const totalSeats = bookings.reduce((sum, b) => sum + b.seats, 0);
  const totalAmount = bookings.reduce((sum, b) => sum + calculateTotal(b), 0);
  const totalAdvance = bookings.reduce((sum, b) => sum + b.advance, 0);
  const totalBalance = bookings.reduce((sum, b) => sum + calculateBalance(b), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalBalances = balances.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const netBalance = totalBalances - totalExpenses;

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

      {/* ==================== BOOKING FORM ==================== */}
      {showBookingForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Add New Booking</h2>
          <form onSubmit={handleAddBooking}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input type="text" name="customer_name" placeholder="Full name" value={newBooking.customer_name} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="text" name="phone" placeholder="Phone number" value={newBooking.phone} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Seats *</label>
                <input type="number" name="seats" min="1" value={newBooking.seats} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (₹) *</label>
                <input type="number" name="ticket_price" min="0" step="0.01" value={newBooking.ticket_price} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                <input type="number" name="discount" min="0" step="0.01" value={newBooking.discount} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (₹) *</label>
                <input type="number" name="advance" min="0" step="0.01" value={newBooking.advance} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Received By *</label>
                <select name="advance_received_by" value={newBooking.advance_received_by} onChange={handleBookingInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                  <option value="Rajeev">Rajeev</option>
                  <option value="Sanjeev">Sanjeev</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" placeholder="Any special notes..." value={newBooking.notes} onChange={handleBookingInputChange} rows="2" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">Save Booking</button>
              <button type="button" onClick={() => setShowBookingForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== BOOKINGS TABLE ==================== */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Bookings ({bookings.length})</h2>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Received By</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No bookings yet.</td>
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
                      <td className="px-4 py-3 text-sm text-left text-gray-600">{booking.advance_received_by || 'Rajeev'}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>₹{balance}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {bookings.length > 0 && (
              <tfoot className="bg-yellow-50 border-t-2 border-yellow-400">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-800">TOTALS</td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-800">{totalSeats}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-800"></td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-800"></td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">₹{totalAmount}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">₹{totalAdvance}</td>
                  <td className="px-4 py-3 text-sm text-left font-bold text-gray-800"></td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">₹{totalBalance}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ==================== EXPENSES SECTION ==================== */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Expenses (₹{totalExpenses})</h2>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <span className="text-xl">+</span> Add Expense
          </button>
        </div>

        {showExpenseForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name *</label>
                <input type="text" name="expense_name" placeholder="e.g., Petrol" value={newExpense.expense_name} onChange={handleExpenseInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" name="amount" min="0" step="0.01" value={newExpense.amount} onChange={handleExpenseInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" name="expense_date" value={newExpense.expense_date} onChange={handleExpenseInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">Save</button>
                <button type="button" onClick={() => setShowExpenseForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No expenses added yet.</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{expense.expense_name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">₹{expense.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== BALANCES SECTION ==================== */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Balances (₹{totalBalances})</h2>
          <button
            onClick={() => setShowBalanceForm(!showBalanceForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <span className="text-xl">+</span> Add Balance
          </button>
        </div>

        {showBalanceForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleAddBalance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" name="amount" min="0" step="0.01" value={newBalance.amount} onChange={handleBalanceInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode *</label>
                <select name="mode" value={newBalance.mode} onChange={handleBalanceInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required>
                  <option value="Cash">Cash</option>
                  <option value="Rajeev">Rajeev</option>
                  <option value="Sanjeev">Sanjeev</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" name="balance_date" value={newBalance.balance_date} onChange={handleBalanceInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">Save</button>
                <button type="button" onClick={() => setShowBalanceForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mode</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No balances added yet.</td>
                </tr>
              ) : (
                balances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">₹{balance.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{balance.mode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(balance.balance_date)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button onClick={() => handleDeleteBalance(balance.id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== NET BALANCE SUMMARY ==================== */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-blue-600">₹{totalAmount}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">₹{totalExpenses}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Total Balances</p>
            <p className="text-2xl font-bold text-green-600">₹{totalBalances}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border-2 border-blue-300">
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netBalance}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetailsPage;
