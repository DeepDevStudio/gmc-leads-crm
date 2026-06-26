import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Trips = () => {
    const [trips, setTrips] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newTrip, setNewTrip] = useState({ title: '', location: '', start_date: '', end_date: '' });
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Fetch trips
    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const res = await axios.get('/api/trips');
            setTrips(res.data);
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
    };

    const handleAddTrip = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/trips', newTrip);
            setNewTrip({ title: '', location: '', start_date: '', end_date: '' });
            setShowForm(false);
            fetchTrips();
        } catch (error) {
            console.error('Error adding trip:', error);
        }
    };

    const handleTripClick = (trip) => {
        setSelectedTrip(trip);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Trips</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    + Add Trip
                </button>
            </div>

            {/* Add Trip Form */}
            {showForm && (
                <form onSubmit={handleAddTrip} className="mb-6 p-4 border rounded">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Title (e.g., Rishikesh Camping)"
                            className="p-2 border rounded"
                            value={newTrip.title}
                            onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            className="p-2 border rounded"
                            value={newTrip.location}
                            onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            className="p-2 border rounded"
                            value={newTrip.start_date}
                            onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            className="p-2 border rounded"
                            value={newTrip.end_date}
                            onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Save Trip
                    </button>
                </form>
            )}

            {/* Trips List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip) => (
                    <div
                        key={trip.id}
                        className="border rounded p-4 cursor-pointer hover:shadow-lg transition"
                        onClick={() => handleTripClick(trip)}
                    >
                        <h2 className="text-xl font-semibold">{trip.title}</h2>
                        <p className="text-gray-600">{trip.location}</p>
                        <p className="text-sm text-gray-500">
                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Trip Details Modal */}
            {selectedTrip && <TripDetails trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}
        </div>
    );
};

// Trip Details Component
const TripDetails = ({ trip, onClose }) => {
    const [bookings, setBookings] = useState([]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [newBooking, setNewBooking] = useState({
        customer_name: '',
        phone: '',
        seats: 1,
        ticket_price: 0,
        discount: 0,
        advance: 0
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await axios.get(`/api/trips/${trip.id}`);
            setBookings(res.data.bookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleAddBooking = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/trips/${trip.id}/bookings`, newBooking);
            setNewBooking({ customer_name: '', phone: '', seats: 1, ticket_price: 0, discount: 0, advance: 0 });
            setShowBookingForm(false);
            fetchBookings();
        } catch (error) {
            console.error('Error adding booking:', error);
        }
    };

    const calculateTotals = (booking) => {
        const total = (booking.seats * booking.ticket_price) - booking.discount;
        const balance = total - booking.advance;
        return { total, balance };
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{trip.title}</h2>
                    <button onClick={onClose} className="text-red-500 text-xl">&times;</button>
                </div>

                <button
                    onClick={() => setShowBookingForm(!showBookingForm)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                >
                    + Add Booking
                </button>

                {/* Booking Form */}
                {showBookingForm && (
                    <form onSubmit={handleAddBooking} className="mb-4 p-4 border rounded">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                className="p-2 border rounded"
                                value={newBooking.customer_name}
                                onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                className="p-2 border rounded"
                                value={newBooking.phone}
                                onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Seats"
                                className="p-2 border rounded"
                                value={newBooking.seats}
                                onChange={(e) => setNewBooking({ ...newBooking, seats: parseInt(e.target.value) })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Ticket Price"
                                className="p-2 border rounded"
                                value={newBooking.ticket_price}
                                onChange={(e) => setNewBooking({ ...newBooking, ticket_price: parseFloat(e.target.value) })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Discount"
                                className="p-2 border rounded"
                                value={newBooking.discount}
                                onChange={(e) => setNewBooking({ ...newBooking, discount: parseFloat(e.target.value) })}
                            />
                            <input
                                type="number"
                                placeholder="Advance"
                                className="p-2 border rounded"
                                value={newBooking.advance}
                                onChange={(e) => setNewBooking({ ...newBooking, advance: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <button type="submit" className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            Save Booking
                        </button>
                    </form>
                )}

                {/* Bookings Table */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border text-left">Name</th>
                            <th className="p-2 border text-left">Number</th>
                            <th className="p-2 border text-center">Seats</th>
                            <th className="p-2 border text-right">Price</th>
                            <th className="p-2 border text-right">Discount</th>
                            <th className="p-2 border text-right">Total</th>
                            <th className="p-2 border text-right">Advance</th>
                            <th className="p-2 border text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => {
                            const { total, balance } = calculateTotals(booking);
                            return (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="p-2 border">{booking.customer_name}</td>
                                    <td className="p-2 border">{booking.phone}</td>
                                    <td className="p-2 border text-center">{booking.seats}</td>
                                    <td className="p-2 border text-right">₹{booking.ticket_price}</td>
                                    <td className="p-2 border text-right">₹{booking.discount}</td>
                                    <td className="p-2 border text-right">₹{total}</td>
                                    <td className="p-2 border text-right">₹{booking.advance}</td>
                                    <td className="p-2 border text-right">₹{balance}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Trips;