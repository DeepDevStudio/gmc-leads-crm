import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const YatraBookingPage = () => {
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

    const [yatras, setYatras] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchPhone, setSearchPhone] = useState('');
    const [foundCustomer, setFoundCustomer] = useState(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [travelers, setTravelers] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [message, setMessage] = useState(null);
    const [extraExpensesList, setExtraExpensesList] = useState([]);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [pickupPoints, setPickupPoints] = useState([]);
    const [searchTrip, setSearchTrip] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showCustomerHistory, setShowCustomerHistory] = useState(null);
    const [showSeatMap, setShowSeatMap] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);
    const [loadingTrip, setLoadingTrip] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Form data for new trip
    const [tripFormData, setTripFormData] = useState({
        yatra_id: '',
        trip_name: '',
        start_date: '',
        end_date: '',
        total_seats: '',
        status: 'active'
    });
    const [showTripForm, setShowTripForm] = useState(false);
    const [editingTrip, setEditingTrip] = useState(null);
    const [showEditTripForm, setShowEditTripForm] = useState(false);

    // Form data for adding customer to trip
    const [customerFormData, setCustomerFormData] = useState({
        customer_id: '',
        customer_name: '',
        phone: '',
        location: '',
        pickup_point: '',
        customer_age: '',
        customer_gender: 'Male',
        total_seats: 1,
        base_amount: 0,
        total_amount: 0,
        advance_amount: '',
        balance_amount: 0,
        advance_collected_by: 'GMC',
        advance_collected_date: '',
        referral_id: '',
        payment_mode: 'Cash',
        remarks: '',
        discount: '',
        discount_given_by: 'GMC',
    });
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showEditCustomerForm, setShowEditCustomerForm] = useState(false);

    // For editing customer
    const [editExtraExpensesList, setEditExtraExpensesList] = useState([]);
    const [editNewExpenseName, setEditNewExpenseName] = useState('');
    const [editNewExpenseAmount, setEditNewExpenseAmount] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalTrips: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeTrips: 0,
        completedTrips: 0
    });

    // Pickup points based on yatra name
    const pickupPointsMap = {
        'Vrindavan • Bhandirvan • Bansivat Yatra Package': [
            'GetMeYatra Office, Rohini Sector-22',
            'Rithala Metro Station',
            'Madhuban Chowk',
            'Peera Garhi Chowk',
            'Janakpuri East Metro Station',
            'Rajouri Garden Metro Station',
            'Dhaula Kuan (Moti Bagh Gurudwara)',
            'Ashram Chowk',
            'Sarita Vihar',
            'NHPC Chowk Metro Station',
            'Bata Chowk, Faridabad'
        ],
        'Sawaria Seth • Nathdwara • Pushkar • Khatu Shyam Ji': [
            'GetMeYatra Office, Rohini Sector-22',
            'Rithala Metro Station',
            'Peera Garhi Chowk',
            'Janakpuri East Metro Station',
            'Rajouri Garden Metro Station',
            'Dhaula Kuan Metro Station',
            'IFFCO Chowk'
        ],
        'Manali • Sissu • Kasol • Manikaran Tour Package': [
            'Akshardham Metro Station',
            'Kashmere Gate Bus Stand',
            'Tis Hazari Metro Station',
            'Karol Bagh Metro Station',
            'Shadipur Metro Station',
            'Rajouri Garden Metro Station',
            'Janakpuri East Metro Station',
            'Peeragarhi Chowk',
            'Madhuban Chowk',
            'Karnal Bypass'
        ],
        'Haridwar – Rishikesh Same Day Yatra': [
            'Janakpuri East Metro Station',
            'Peera Garhi Chowk',
            'Madhuban Chowk',
            'Burari Bus Stop (Bypass)',
            'Kashmere Gate Metro Station',
            'Shastri Park Bus Stand',
            'Welcome Metro Station',
            'Dilshad Garden Metro Station',
            'Mohan Nagar Metro Station'
        ],
        'Haridwar, Rishikesh Camping Tour': [
            'Janakpuri East Metro Station',
            'Peera Garhi Chowk',
            'Madhuban Chowk',
            'Burari Bus Stop (Bypass)',
            'Kashmere Gate Metro Station',
            'Shastri Park Bus Stand',
            'Welcome Metro Station',
            'Dilshad Garden Metro Station',
            'Mohan Nagar Metro Station'
        ],
        'default': [
            'GetMeYatra Office, Rohini Sector-22',
            'Rithala Metro Station',
            'Janakpuri East Metro Station',
            'Rajouri Garden Metro Station',
            'Peera Garhi Chowk',
            'Dhaula Kuan Metro Station'
        ]
    };

    useEffect(() => {
        loadData();
        loadPickupPoints();
    }, []);

    // Calculate stats whenever trips change
    useEffect(() => {
        calculateStats();
    }, [trips]);

    const calculateStats = () => {
        const totalTrips = trips.length;
        const activeTrips = trips.filter(t => t.status === 'active').length;
        const completedTrips = trips.filter(t => t.status === 'completed').length;
        const totalRevenue = trips.reduce((sum, trip) => {
            return sum + (trip.customers?.reduce((s, c) => s + (parseFloat(c.total_amount) || 0), 0) || 0);
        }, 0);
        const totalBookings = trips.reduce((sum, trip) => sum + (trip.customers?.length || 0), 0);

        setStats({
            totalTrips,
            totalBookings,
            totalRevenue,
            activeTrips,
            completedTrips
        });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [yatrasRes, tripsRes, customersRes] = await Promise.all([
                api.get('/yatras'),
                api.get('/yatra-bookings/trips'),
                api.get('/customers')
            ]);
            setYatras(Array.isArray(yatrasRes.data) ? yatrasRes.data : []);
            setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : []);
            setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('Failed to load data', 'error');
            setYatras([]);
            setTrips([]);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPickupPoints = async () => {
        try {
            const response = await api.get('/yatra-bookings/pickup-points');
            setPickupPoints(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error loading pickup points:', error);
            setPickupPoints([]);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
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

    const getPickupPointsForYatra = (yatraName) => {
        if (!yatraName) return pickupPointsMap['default'];
        const key = Object.keys(pickupPointsMap).find(k => 
            yatraName.toLowerCase().includes(k.toLowerCase()) || 
            k.toLowerCase().includes(yatraName.toLowerCase())
        );
        return pickupPointsMap[key] || pickupPointsMap['default'];
    };

    const handleTripInputChange = (e) => {
        const { name, value } = e.target;
        setTripFormData({ ...tripFormData, [name]: value });

        if (name === 'yatra_id') {
            const selectedYatra = Array.isArray(yatras) ? yatras.find(y => y.id === parseInt(value)) : null;
            if (selectedYatra) {
                const startDate = selectedYatra.start_date ? new Date(selectedYatra.start_date).toISOString().split('T')[0] : '';
                const endDate = selectedYatra.end_date ? new Date(selectedYatra.end_date).toISOString().split('T')[0] : '';
                const dateStr = startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const tripName = dateStr ? `${selectedYatra.yatra_name} - ${dateStr}` : selectedYatra.yatra_name;
                
                setTripFormData(prev => ({
                    ...prev,
                    start_date: startDate,
                    end_date: endDate,
                    trip_name: tripName,
                    total_seats: selectedYatra.total_seats || 53
                }));
            }
        }
    };

    // ===== CREATE TRIP =====
    const handleCreateTrip = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/yatra-bookings/trips', tripFormData);
            showMessage('Trip created successfully!', 'success');
            setTripFormData({
                yatra_id: '',
                trip_name: '',
                start_date: '',
                end_date: '',
                total_seats: '',
                status: 'active'
            });
            setShowTripForm(false);
            loadData();
        } catch (error) {
            console.error('Error creating trip:', error);
            showMessage('Failed to create trip', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== EDIT TRIP =====
    const handleEditTrip = (trip) => {
        setEditingTrip(trip);
        setTripFormData({
            yatra_id: trip.yatra_id,
            trip_name: trip.trip_name,
            start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '',
            end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : '',
            total_seats: trip.total_seats,
            status: trip.status || 'active'
        });
        setShowEditTripForm(true);
    };

    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/yatra-bookings/trips/${editingTrip.id}`, tripFormData);
            showMessage('Trip updated successfully!', 'success');
            setShowEditTripForm(false);
            setEditingTrip(null);
            setTripFormData({
                yatra_id: '',
                trip_name: '',
                start_date: '',
                end_date: '',
                total_seats: '',
                status: 'active'
            });
            loadData();
        } catch (error) {
            console.error('Error updating trip:', error);
            showMessage('Failed to update trip', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== DELETE TRIP =====
    const handleDeleteTrip = async (id, name) => {
        if (!window.confirm(`Delete trip "${name}"? This will remove all customers and travelers.`)) return;

        try {
            await api.delete(`/yatra-bookings/trips/${id}`);
            showMessage('Trip deleted successfully!', 'success');
            if (selectedTripId === id) {
                setSelectedTrip(null);
                setSelectedTripId(null);
            }
            loadData();
        } catch (error) {
            console.error('Error deleting trip:', error);
            showMessage('Failed to delete trip', 'error');
        }
    };

    // ===== UPDATE TRIP STATUS =====
    const handleUpdateTripStatus = async (tripId, status) => {
        try {
            const trip = trips.find(t => t.id === tripId);
            if (!trip) return;

            await api.put(`/yatra-bookings/trips/${tripId}`, {
                ...trip,
                status: status
            });
            showMessage(`Trip status updated to ${status}!`, 'success');
            loadData();
            if (selectedTripId === tripId) {
                setSelectedTrip({ ...selectedTrip, status });
            }
        } catch (error) {
            console.error('Error updating trip status:', error);
            showMessage('Failed to update trip status', 'error');
        }
    };

    // ===== SELECT TRIP (FIXED) =====
    const handleSelectTrip = async (tripId) => {
        // Reset all states before loading new trip
        setSelectedTrip(null);
        setShowAddCustomer(false);
        setSelectedSeats([]);
        setExtraExpensesList([]);
        setEditExtraExpensesList([]);
        setShowCustomerHistory(null);
        setTravelers([]);
        setShowSeatMap(false);
        
        setLoadingTrip(true);
        
        try {
            const response = await api.get(`/yatra-bookings/trips/${tripId}`);
            const tripData = response.data;
            
            // Set the trip data
            setSelectedTrip(tripData);
            setSelectedTripId(tripId);
            
            // Reset customer form
            setCustomerFormData({
                customer_id: '',
                customer_name: '',
                phone: '',
                location: '',
                pickup_point: '',
                customer_age: '',
                customer_gender: 'Male',
                total_seats: 1,
                base_amount: 0,
                total_amount: 0,
                advance_amount: '',
                balance_amount: 0,
                advance_collected_by: 'GMC',
                advance_collected_date: '',
                referral_id: '',
                payment_mode: 'Cash',
                remarks: '',
                discount: '',
                discount_given_by: 'GMC',
            });
            
            console.log('Trip loaded:', tripData.trip_name, 'Customers:', tripData.customers?.length || 0);
        } catch (error) {
            console.error('Error loading trip:', error);
            showMessage('Failed to load trip details: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoadingTrip(false);
        }
    };

    // ===== PHONE SEARCH =====
    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setSearchPhone(phone);

        if (phone.length === 10) {
            const customer = Array.isArray(customers) ? customers.find(c => c.mobile_number === phone) : null;
            if (customer) {
                setFoundCustomer(customer);
                setIsNewCustomer(false);
                setCustomerFormData({
                    ...customerFormData,
                    customer_id: customer.id,
                    customer_name: customer.customer_name || '',
                    phone: customer.mobile_number,
                    location: customer.location_type || '',
                });
            } else {
                setFoundCustomer(null);
                setIsNewCustomer(true);
                setCustomerFormData({
                    ...customerFormData,
                    customer_id: '',
                    customer_name: '',
                    phone: phone,
                    location: '',
                });
            }
        }
    };

    const handleCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerFormData({ ...customerFormData, [name]: value });
    };

    // ===== TRAVELER FUNCTIONS =====
    const addTraveler = () => {
        setTravelers([...travelers, { traveler_name: '', phone: '', age: '', gender: 'Male', relation: 'Friend' }]);
        setSelectedSeats([]);
    };

    const removeTraveler = (index) => {
        const newTravelers = travelers.filter((_, i) => i !== index);
        setTravelers(newTravelers);
        setSelectedSeats([]);
    };

    const updateTraveler = (index, field, value) => {
        const newTravelers = [...travelers];
        newTravelers[index][field] = value;
        setTravelers(newTravelers);
        setSelectedSeats([]);
    };

    // Edit Traveler Functions
    const addEditTraveler = () => {
        const currentTravelers = travelers || [];
        setTravelers([...currentTravelers, { traveler_name: '', phone: '', age: '', gender: 'Male', relation: 'Friend' }]);
    };

    const removeEditTraveler = (index) => {
        const currentTravelers = travelers || [];
        const newTravelers = currentTravelers.filter((_, i) => i !== index);
        setTravelers(newTravelers);
    };

    const updateEditTraveler = (index, field, value) => {
        const currentTravelers = travelers || [];
        const newTravelers = [...currentTravelers];
        newTravelers[index][field] = value;
        setTravelers(newTravelers);
    };

    // ===== EXTRA EXPENSES =====
    const addExtraExpense = () => {
        if (!newExpenseName.trim() || !newExpenseAmount || parseFloat(newExpenseAmount) <= 0) {
            showMessage('Please enter expense name and amount', 'error');
            return;
        }
        setExtraExpensesList([
            ...extraExpensesList,
            { name: newExpenseName.trim(), amount: parseFloat(newExpenseAmount) }
        ]);
        setNewExpenseName('');
        setNewExpenseAmount('');
    };

    const removeExtraExpense = (index) => {
        const newList = extraExpensesList.filter((_, i) => i !== index);
        setExtraExpensesList(newList);
    };

    const addEditExtraExpense = () => {
        if (!editNewExpenseName.trim() || !editNewExpenseAmount || parseFloat(editNewExpenseAmount) <= 0) {
            showMessage('Please enter expense name and amount', 'error');
            return;
        }
        setEditExtraExpensesList([
            ...editExtraExpensesList,
            { name: editNewExpenseName.trim(), amount: parseFloat(editNewExpenseAmount) }
        ]);
        setEditNewExpenseName('');
        setEditNewExpenseAmount('');
    };

    const removeEditExtraExpense = (index) => {
        const newList = editExtraExpensesList.filter((_, i) => i !== index);
        setEditExtraExpensesList(newList);
    };

    const getTotalExtraExpenses = () => {
        return extraExpensesList.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const getEditTotalExtraExpenses = () => {
        return editExtraExpensesList.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const getTotalSeats = () => {
        return 1 + travelers.length;
    };

    // ===== SEAT SELECTION =====
    const toggleSeat = (seatNumber) => {
        const totalSeats = getTotalSeats();
        if (selectedSeats.includes(seatNumber)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
        } else if (selectedSeats.length < totalSeats) {
            setSelectedSeats([...selectedSeats, seatNumber]);
        } else {
            showMessage(`Please select exactly ${totalSeats} seats`, 'error');
        }
    };

    const getPickupPoints = () => {
        if (selectedTrip?.yatra_name) {
            const points = getPickupPointsForYatra(selectedTrip.yatra_name);
            return points;
        }
        return pickupPointsMap['default'];
    };

    // ===== SEAT RENDER FUNCTION =====
    const renderSeats = (seats, isEditMode = false, editingCustomerId = null) => {
        if (!seats || seats.length === 0) {
            return (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No seats available
                </div>
            );
        }

        const rows = [];
        for (let i = 0; i < seats.length; i += 4) {
            rows.push(seats.slice(i, i + 4));
        }

        const lastRow = rows[rows.length - 1];
        const hasOddLastRow = lastRow && lastRow.length === 1;

        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-center gap-6 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-600"></div>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-400 border border-red-600"></div>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Booked</span>
                    </div>
                </div>

                <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-300'} rounded-2xl p-4 border-2`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className={`${isDarkMode ? 'bg-slate-600' : 'bg-gray-700'} text-white px-6 py-2 rounded-lg text-sm font-medium`}>
                            🚗 DRIVER
                        </div>
                        {hasOddLastRow && (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`}>Last Seat:</span>
                                {lastRow.map((seat) => {
                                    const isBooked = isEditMode 
                                        ? seat.is_booked === 1 && seat.customer_trip_id !== editingCustomerId
                                        : seat.is_booked === 1;
                                    const isSelected = selectedSeats.includes(seat.seat_number);
                                    
                                    let bgColor = 'bg-green-500 hover:bg-green-600';
                                    let textColor = 'text-white';
                                    let borderColor = 'border-green-600';
                                    
                                    if (isBooked) {
                                        bgColor = 'bg-red-400 cursor-not-allowed';
                                        borderColor = 'border-red-600';
                                    } else if (isSelected) {
                                        bgColor = 'bg-yellow-400 hover:bg-yellow-500';
                                        borderColor = 'border-yellow-600';
                                    }

                                    return (
                                        <button
                                            key={seat.id || seat.seat_number}
                                            type="button"
                                            disabled={isBooked}
                                            onClick={() => toggleSeat(seat.seat_number)}
                                            className={`
                                                w-10 h-10 rounded-lg border-2 font-bold text-sm
                                                transition-all duration-200
                                                ${bgColor} ${textColor} ${borderColor}
                                                ${!isBooked && !isSelected ? 'hover:scale-105 hover:shadow-lg' : ''}
                                                ${isSelected ? 'scale-105 shadow-lg' : ''}
                                                ${isBooked ? 'opacity-70' : ''}
                                            `}
                                        >
                                            {seat.seat_number}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {rows.map((row, rowIndex) => {
                            const isLastRow = rowIndex === rows.length - 1;
                            const isSingleSeatRow = isLastRow && row.length === 1;
                            
                            if (isSingleSeatRow) {
                                return null;
                            }

                            const leftSeats = row.slice(0, 2);
                            const rightSeats = row.slice(2, 4);

                            return (
                                <div key={rowIndex} className="flex items-center justify-center gap-8">
                                    <div className="flex gap-2">
                                        {leftSeats.map((seat) => {
                                            const isBooked = isEditMode 
                                                ? seat.is_booked === 1 && seat.customer_trip_id !== editingCustomerId
                                                : seat.is_booked === 1;
                                            const isSelected = selectedSeats.includes(seat.seat_number);
                                            
                                            let bgColor = 'bg-green-500 hover:bg-green-600';
                                            let textColor = 'text-white';
                                            let borderColor = 'border-green-600';
                                            
                                            if (isBooked) {
                                                bgColor = 'bg-red-400 cursor-not-allowed';
                                                borderColor = 'border-red-600';
                                            } else if (isSelected) {
                                                bgColor = 'bg-yellow-400 hover:bg-yellow-500';
                                                borderColor = 'border-yellow-600';
                                            }

                                            return (
                                                <button
                                                    key={seat.id || seat.seat_number}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => toggleSeat(seat.seat_number)}
                                                    className={`
                                                        w-12 h-12 rounded-lg border-2 font-bold text-sm
                                                        transition-all duration-200
                                                        ${bgColor} ${textColor} ${borderColor}
                                                        ${!isBooked && !isSelected ? 'hover:scale-105 hover:shadow-lg' : ''}
                                                        ${isSelected ? 'scale-105 shadow-lg' : ''}
                                                        ${isBooked ? 'opacity-70' : ''}
                                                    `}
                                                >
                                                    {seat.seat_number}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={`w-4 h-12 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'} rounded border ${isDarkMode ? 'border-slate-500' : 'border-gray-300'}`}></div>

                                    <div className="flex gap-2">
                                        {rightSeats.map((seat) => {
                                            const isBooked = isEditMode 
                                                ? seat.is_booked === 1 && seat.customer_trip_id !== editingCustomerId
                                                : seat.is_booked === 1;
                                            const isSelected = selectedSeats.includes(seat.seat_number);
                                            
                                            let bgColor = 'bg-green-500 hover:bg-green-600';
                                            let textColor = 'text-white';
                                            let borderColor = 'border-green-600';
                                            
                                            if (isBooked) {
                                                bgColor = 'bg-red-400 cursor-not-allowed';
                                                borderColor = 'border-red-600';
                                            } else if (isSelected) {
                                                bgColor = 'bg-yellow-400 hover:bg-yellow-500';
                                                borderColor = 'border-yellow-600';
                                            }

                                            return (
                                                <button
                                                    key={seat.id || seat.seat_number}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => toggleSeat(seat.seat_number)}
                                                    className={`
                                                        w-12 h-12 rounded-lg border-2 font-bold text-sm
                                                        transition-all duration-200
                                                        ${bgColor} ${textColor} ${borderColor}
                                                        ${!isBooked && !isSelected ? 'hover:scale-105 hover:shadow-lg' : ''}
                                                        ${isSelected ? 'scale-105 shadow-lg' : ''}
                                                        ${isBooked ? 'opacity-70' : ''}
                                                    `}
                                                >
                                                    {seat.seat_number}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} w-8 text-center`}>
                                        Row {rowIndex + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center mt-4">
                    {selectedSeats.length === 0 && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            💡 Click on available seats to select them
                        </p>
                    )}
                    {selectedSeats.length > 0 && selectedSeats.length < getTotalSeats() && (
                        <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} font-medium`}>
                            ⚠️ Selected {selectedSeats.length} of {getTotalSeats()} seats needed
                        </p>
                    )}
                    {selectedSeats.length === getTotalSeats() && (
                        <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                            ✅ All {getTotalSeats()} seats selected! Seats: {selectedSeats.join(', ')}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // ===== SEND WHATSAPP =====
    const sendWhatsApp = async (customer) => {
        if (!customer.phone || customer.phone.length !== 10) {
            showMessage('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        const message = `🙏 *GetMeYatra Booking Confirmation* 🙏

Hi *${customer.customer_name || 'Customer'}*,

Your booking has been confirmed for *${selectedTrip?.trip_name || 'Yatra Trip'}*!

📅 Dates: ${formatDate(selectedTrip?.start_date)} - ${formatDate(selectedTrip?.end_date)}
🪑 Seats: ${customer.seat_numbers?.join(', ') || 'Not assigned'}
💺 Total Seats: ${customer.total_seats}
💰 Total Amount: ₹${parseFloat(customer.total_amount || 0).toFixed(2)}
💵 Advance Paid: ₹${parseFloat(customer.advance_amount || 0).toFixed(2)}
💰 Balance: ₹${parseFloat(customer.balance_amount || 0).toFixed(2)}

📍 Pickup Point: ${customer.pickup_point || 'TBD'}

*Thank you for choosing GetMeYatra!* 🚀
For queries, contact: +919999999999`;

        try {
            const response = await api.post('/whatsapp/send-message', {
                phone: customer.phone,
                message: message,
                customer_id: customer.id,
                trip_id: selectedTrip?.id
            });

            if (response.data.success) {
                showMessage(`WhatsApp message sent to ${customer.customer_name}!`, 'success');
            } else {
                showMessage('Failed to send WhatsApp message', 'error');
            }
        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            showMessage('Failed to send WhatsApp message', 'error');
        }
    };

    // ===== GENERATE PAYMENT RECEIPT =====
    const generateReceipt = (customer) => {
        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt - ${customer.customer_name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #1a56db; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .receipt-details { margin: 20px 0; }
        .receipt-details table { width: 100%; border-collapse: collapse; }
        .receipt-details td { padding: 8px; border-bottom: 1px solid #eee; }
        .receipt-details .label { font-weight: bold; color: #555; }
        .total-row { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; border-top: 1px solid #ddd; padding-top: 15px; }
        .status-paid { color: green; font-weight: bold; }
        .status-pending { color: orange; font-weight: bold; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏔️ GetMeYatra</h1>
        <p>Payment Receipt</p>
        <p><strong>Receipt #:</strong> ${customer.id}-${Date.now()}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
    </div>

    <div class="receipt-details">
        <h3>Customer Details</h3>
        <table>
            <tr><td class="label">Name</td><td>${customer.customer_name}</td></tr>
            <tr><td class="label">Phone</td><td>${customer.phone}</td></tr>
            <tr><td class="label">Location</td><td>${customer.location || 'N/A'}</td></tr>
            <tr><td class="label">Pickup Point</td><td>${customer.pickup_point || 'N/A'}</td></tr>
        </table>
    </div>

    <div class="receipt-details">
        <h3>Trip Details</h3>
        <table>
            <tr><td class="label">Trip Name</td><td>${selectedTrip?.trip_name}</td></tr>
            <tr><td class="label">Dates</td><td>${formatDate(selectedTrip?.start_date)} - ${formatDate(selectedTrip?.end_date)}</td></tr>
            <tr><td class="label">Total Seats</td><td>${customer.total_seats}</td></tr>
            <tr><td class="label">Seat Numbers</td><td>${customer.seat_numbers?.join(', ') || 'N/A'}</td></tr>
        </table>
    </div>

    <div class="receipt-details">
        <h3>Payment Summary</h3>
        <table>
            <tr><td class="label">Total Amount</td><td>₹${parseFloat(customer.total_amount || 0).toFixed(2)}</td></tr>
            <tr><td class="label">Advance Paid</td><td>₹${parseFloat(customer.advance_amount || 0).toFixed(2)}</td></tr>
            <tr><td class="label">Discount</td><td>₹${parseFloat(customer.discount || 0).toFixed(2)}</td></tr>
            <tr class="total-row"><td>Balance Due</td><td>₹${parseFloat(customer.balance_amount || 0).toFixed(2)}</td></tr>
        </table>
    </div>

    <div style="text-align: center; margin: 20px 0;">
        <span class="${parseFloat(customer.balance_amount || 0) <= 0 ? 'status-paid' : 'status-pending'}">
            ${parseFloat(customer.balance_amount || 0) <= 0 ? '✅ FULLY PAID' : '⚠️ PENDING PAYMENT'}
        </span>
    </div>

    <div class="footer">
        <p>Thank you for choosing GetMeYatra!</p>
        <p>For queries, contact: +919999999999</p>
        <p style="font-size: 0.8em; color: #999;">This is a system generated receipt.</p>
    </div>
</body>
</html>
        `;

        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(receiptHTML);
            win.document.close();
            win.print();
            showMessage('Receipt generated successfully!', 'success');
        } else {
            showMessage('Please allow popups to generate receipt', 'error');
        }
    };

    // ===== VIEW CUSTOMER HISTORY =====
    const viewCustomerHistory = async (customerId) => {
        try {
            const response = await api.get(`/yatra-bookings/customer-history/${customerId}`);
            setShowCustomerHistory(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching customer history:', error);
            showMessage('Failed to load customer history', 'error');
            setShowCustomerHistory([]);
        }
    };

    // ===== ADD CUSTOMER TO TRIP =====
    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const totalSeats = 1 + travelers.length;
            const baseAmount = selectedTrip?.rate_per_seat || 0;
            const totalAmount = totalSeats * baseAmount;
            const advanceAmount = parseFloat(customerFormData.advance_amount) || 0;
            const totalExtraExpenses = getTotalExtraExpenses();
            const discountAmount = parseFloat(customerFormData.discount) || 0;
            const balanceAmount = totalAmount + totalExtraExpenses - advanceAmount - discountAmount;

            if (!customerFormData.customer_name.trim()) {
                showMessage('Please enter customer name', 'error');
                setLoading(false);
                return;
            }

            if (!customerFormData.phone || customerFormData.phone.length !== 10) {
                showMessage('Please enter a valid 10-digit phone number', 'error');
                setLoading(false);
                return;
            }

            if (selectedSeats.length !== totalSeats) {
                showMessage(`Please select exactly ${totalSeats} seats`, 'error');
                setLoading(false);
                return;
            }

            for (const traveler of travelers) {
                if (!traveler.traveler_name.trim()) {
                    showMessage('Please enter name for all travelers', 'error');
                    setLoading(false);
                    return;
                }
            }

            const allTravelers = [
                {
                    traveler_name: customerFormData.customer_name,
                    phone: customerFormData.phone,
                    age: customerFormData.customer_age || null,
                    gender: customerFormData.customer_gender || 'Male',
                    relation: 'Self'
                },
                ...travelers
            ];

            let customerId = customerFormData.customer_id;
            if (isNewCustomer && !customerId) {
                const customerRes = await api.post('/customers', {
                    customer_name: customerFormData.customer_name || 'Unknown',
                    mobile_number: customerFormData.phone,
                    interests: '',
                    location_type: customerFormData.location || 'Delhi NCR'
                });
                customerId = customerRes.data.id;
                const customersRes = await api.get('/customers');
                setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
            }

            const seatsToSend = selectedSeats.map(Number);

            const payload = {
                customer_id: customerId || null,
                customer_name: customerFormData.customer_name,
                phone: customerFormData.phone,
                location: customerFormData.location,
                pickup_point: customerFormData.pickup_point,
                total_seats: totalSeats,
                selected_seats: seatsToSend,
                base_amount: baseAmount,
                total_amount: totalAmount + totalExtraExpenses,
                advance_amount: advanceAmount,
                balance_amount: balanceAmount,
                advance_collected_by: customerFormData.advance_collected_by || 'GMC',
                advance_collected_date: customerFormData.advance_collected_date || null,
                referral_id: customerFormData.referral_id || null,
                payment_mode: customerFormData.payment_mode || 'Cash',
                remarks: customerFormData.remarks,
                travelers: allTravelers,
                extra_expenses: extraExpensesList.map(e => ({
                    expense_name: e.name,
                    expense_amount: e.amount
                })),
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
            };

            await api.post(`/yatra-bookings/trips/${selectedTrip.id}/customers`, payload);
            
            // Refresh the trip data to show the new customer
            await handleSelectTrip(selectedTrip.id);

            showMessage(`Customer added successfully! Seats: ${selectedSeats.join(', ')}`, 'success');
            setTravelers([]);
            setSelectedSeats([]);
            setExtraExpensesList([]);
            setNewExpenseName('');
            setNewExpenseAmount('');
            setCustomerFormData({
                customer_id: '',
                customer_name: '',
                phone: '',
                location: '',
                pickup_point: '',
                customer_age: '',
                customer_gender: 'Male',
                total_seats: 1,
                base_amount: 0,
                total_amount: 0,
                advance_amount: '',
                balance_amount: 0,
                advance_collected_by: 'GMC',
                advance_collected_date: '',
                referral_id: '',
                payment_mode: 'Cash',
                remarks: '',
                discount: '',
                discount_given_by: 'GMC',
            });
            setSearchPhone('');
            setFoundCustomer(null);
            setIsNewCustomer(false);
            setShowAddCustomer(false);
        } catch (error) {
            console.error('Error adding customer:', error);
            showMessage('Failed to add customer: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== EDIT CUSTOMER =====
    const handleEditCustomer = (customer) => {
        const selfTraveler = customer.travelers?.find(t => t.relation === 'Self') || {};
        const otherTravelers = customer.travelers?.filter(t => t.relation !== 'Self') || [];

        let currentSeats = [];
        if (customer.seat_numbers) {
            if (Array.isArray(customer.seat_numbers)) {
                currentSeats = customer.seat_numbers;
            } else if (typeof customer.seat_numbers === 'string') {
                currentSeats = customer.seat_numbers.split(',').map(s => parseInt(s.trim()));
            }
        }

        setEditingCustomer(customer);
        setCustomerFormData({
            customer_id: customer.customer_id || '',
            customer_name: customer.customer_name || '',
            phone: customer.phone || '',
            location: customer.location || '',
            pickup_point: customer.pickup_point || '',
            customer_age: selfTraveler.age || '',
            customer_gender: selfTraveler.gender || 'Male',
            total_seats: customer.total_seats || 1,
            base_amount: customer.base_amount || 0,
            total_amount: customer.total_amount || 0,
            advance_amount: customer.advance_amount || '',
            balance_amount: customer.balance_amount || 0,
            advance_collected_by: customer.advance_collected_by || 'GMC',
            advance_collected_date: customer.advance_collected_date ? new Date(customer.advance_collected_date).toISOString().split('T')[0] : '',
            referral_id: customer.referral_id || '',
            payment_mode: customer.payment_mode || 'Cash',
            remarks: customer.remarks || '',
            discount: customer.discount || '',
            discount_given_by: customer.discount_given_by || 'GMC',
        });
        setTravelers(otherTravelers);
        setSelectedSeats(currentSeats);
        
        const extras = customer.extra_expenses || [];
        setEditExtraExpensesList(extras.map(e => ({
            name: e.expense_name,
            amount: parseFloat(e.expense_amount) || 0
        })));
        
        setShowEditCustomerForm(true);
    };

    // ===== UPDATE CUSTOMER =====
    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const totalSeats = 1 + travelers.length;
            const baseAmount = selectedTrip?.rate_per_seat || 0;
            const totalAmount = totalSeats * baseAmount;
            const advanceAmount = parseFloat(customerFormData.advance_amount) || 0;
            const totalExtraExpenses = getEditTotalExtraExpenses();
            const discountAmount = parseFloat(customerFormData.discount) || 0;
            const balanceAmount = totalAmount + totalExtraExpenses - advanceAmount - discountAmount;

            if (!customerFormData.customer_name.trim()) {
                showMessage('Please enter customer name', 'error');
                setLoading(false);
                return;
            }

            if (!customerFormData.phone || customerFormData.phone.length !== 10) {
                showMessage('Please enter a valid 10-digit phone number', 'error');
                setLoading(false);
                return;
            }

            if (selectedSeats.length !== totalSeats) {
                showMessage(`Please select exactly ${totalSeats} seats`, 'error');
                setLoading(false);
                return;
            }

            const allTravelers = [
                {
                    traveler_name: customerFormData.customer_name,
                    phone: customerFormData.phone,
                    age: customerFormData.customer_age || null,
                    gender: customerFormData.customer_gender || 'Male',
                    relation: 'Self'
                },
                ...travelers
            ];

            const seatsToSend = selectedSeats.map(Number);

            const payload = {
                customer_name: customerFormData.customer_name,
                phone: customerFormData.phone,
                location: customerFormData.location,
                pickup_point: customerFormData.pickup_point,
                total_seats: totalSeats,
                selected_seats: seatsToSend,
                base_amount: baseAmount,
                total_amount: totalAmount + totalExtraExpenses,
                advance_amount: advanceAmount,
                balance_amount: balanceAmount,
                advance_collected_by: customerFormData.advance_collected_by || 'GMC',
                advance_collected_date: customerFormData.advance_collected_date || null,
                referral_id: customerFormData.referral_id || null,
                payment_mode: customerFormData.payment_mode || 'Cash',
                remarks: customerFormData.remarks,
                travelers: allTravelers,
                extra_expenses: editExtraExpensesList.map(e => ({
                    expense_name: e.name,
                    expense_amount: e.amount
                })),
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
            };

            await api.put(`/yatra-bookings/trips/${selectedTrip.id}/customers/${editingCustomer.id}`, payload);
            
            // Refresh the trip data to show the updated customer
            await handleSelectTrip(selectedTrip.id);

            showMessage(`Customer updated successfully! Seats: ${selectedSeats.join(', ')}`, 'success');
            setShowEditCustomerForm(false);
            setEditingCustomer(null);
            setTravelers([]);
            setSelectedSeats([]);
            setEditExtraExpensesList([]);
        } catch (error) {
            console.error('Error updating customer:', error);
            showMessage('Failed to update customer: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCustomer = async (customerTripId) => {
        if (!window.confirm('Remove this customer from the trip?')) return;

        try {
            await api.delete(`/yatra-bookings/trips/${selectedTrip.id}/customers/${customerTripId}`);
            showMessage('Customer removed successfully!', 'success');
            // Refresh the trip data
            await handleSelectTrip(selectedTrip.id);
        } catch (error) {
            console.error('Error removing customer:', error);
            showMessage('Failed to remove customer', 'error');
        }
    };

    const getTripStatus = (trip) => {
        const booked = trip.booked_seats || 0;
        const total = trip.total_seats || 0;
        if (booked >= total) return 'Full';
        if (booked > 0) return 'Partial';
        return 'Empty';
    };

    const pickupOptions = getPickupPoints();

    // ===== EXPORT TRIP CUSTOMERS =====
    const exportTripCustomers = (trip) => {
        if (!trip.customers || trip.customers.length === 0) {
            showMessage('No customers to export', 'error');
            return;
        }

        const headers = ['#', 'Customer', 'Phone', 'Location', 'Seats', 'Seat Numbers', 'Total', 'Advance', 'Balance'];
        const rows = trip.customers.map((customer, index) => [
            index + 1,
            customer.customer_name || '',
            customer.phone || '',
            customer.location || '',
            customer.total_seats || 0,
            (customer.seat_numbers && customer.seat_numbers.length > 0) ? customer.seat_numbers.join(', ') : '-',
            customer.total_amount || 0,
            customer.advance_amount || 0,
            customer.balance_amount || 0
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip_${trip.trip_name}_customers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage(`Exported ${trip.customers.length} customers`, 'success');
    };

    // ===== PRINT TRIP DETAILS =====
    const printTripDetails = () => {
        setShowPrintView(true);
        setTimeout(() => {
            window.print();
            setShowPrintView(false);
        }, 500);
    };

    // ===== DATE RANGE FILTER =====
    const filteredTrips = Array.isArray(trips) ? trips.filter(trip => {
        const matchesSearch = trip.trip_name?.toLowerCase().includes(searchTrip.toLowerCase()) ||
                             trip.yatra_name?.toLowerCase().includes(searchTrip.toLowerCase());
        const matchesStatus = filterStatus === 'All' || getTripStatus(trip) === filterStatus;
        
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
        
        return matchesSearch && matchesStatus && matchesDate;
    }) : [];

    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-blue-500`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Trips</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{stats.totalTrips}</p>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-green-500`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Active Trips</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeTrips}</p>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-gray-500`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Completed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.completedTrips}</p>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-purple-500`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Total Bookings</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalBookings}</p>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 border-l-4 border-yellow-500`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase`}>Revenue</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📋 Yatra Bookings</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage yatra trips and add customers with travelers</p>
                </div>
                <button
                    onClick={() => setShowTripForm(!showTripForm)}
                    className={`${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-400 hover:bg-yellow-500'} px-4 py-2 rounded-lg font-semibold transition text-white`}
                >
                    {showTripForm ? 'Cancel' : '+ New Trip'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700` : `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700`}`}>
                    {message.text}
                </div>
            )}

            {/* Create Trip Form */}
            {showTripForm && (
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : ''}`}>Create New Yatra Trip</h2>
                    <form onSubmit={handleCreateTrip}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Select Yatra *</label>
                                <select
                                    name="yatra_id"
                                    value={tripFormData.yatra_id}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select Yatra</option>
                                    {Array.isArray(yatras) && yatras
                                        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                                        .map((yatra) => (
                                            <option key={yatra.id} value={yatra.id}>
                                                {yatra.yatra_name} - {formatDate(yatra.start_date)} (₹{yatra.rate_per_seat})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Trip Name *</label>
                                <input
                                    type="text"
                                    name="trip_name"
                                    value={tripFormData.trip_name}
                                    onChange={handleTripInputChange}
                                    placeholder="Trip Name"
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={tripFormData.start_date}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>End Date *</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={tripFormData.end_date}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Total Seats *</label>
                                <input
                                    type="number"
                                    name="total_seats"
                                    value={tripFormData.total_seats}
                                    onChange={handleTripInputChange}
                                    placeholder="Total Seats"
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
                                <select
                                    name="status"
                                    value={tripFormData.status}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
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
                                disabled={loading}
                                className={`${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-400 hover:bg-yellow-500'} px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 text-white`}
                            >
                                {loading ? 'Creating...' : 'Create Trip'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTripForm(false)}
                                className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Trip Form */}
            {showEditTripForm && editingTrip && (
                <div className={`${isDarkMode ? 'bg-slate-800 border-yellow-600' : 'bg-white border-yellow-400'} rounded-lg shadow-md p-6 mb-6 border`}>
                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : ''}`}>✏️ Edit Trip</h2>
                    <form onSubmit={handleUpdateTrip}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Trip Name *</label>
                                <input
                                    type="text"
                                    name="trip_name"
                                    value={tripFormData.trip_name}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={tripFormData.start_date}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>End Date *</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={tripFormData.end_date}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Total Seats *</label>
                                <input
                                    type="number"
                                    name="total_seats"
                                    value={tripFormData.total_seats}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
                                <select
                                    name="status"
                                    value={tripFormData.status}
                                    onChange={handleTripInputChange}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
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
                                disabled={loading}
                                className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50`}
                            >
                                {loading ? 'Updating...' : 'Update Trip'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditTripForm(false);
                                    setEditingTrip(null);
                                }}
                                className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Filter */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-4 mb-4 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="🔍 Search trips..."
                            value={searchTrip}
                            onChange={(e) => setSearchTrip(e.target.value)}
                            className={`w-full border p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`border p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                    >
                        <option value="All">All Trips</option>
                        <option value="Empty">Empty</option>
                        <option value="Partial">Partial</option>
                        <option value="Full">Full</option>
                    </select>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className={`border p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className={`border p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                        placeholder="End Date"
                    />
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-600 transition"
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Trips List */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {filteredTrips.map((trip) => {
                    const status = getTripStatus(trip);
                    const statusColors = {
                        'Full': `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`,
                        'Partial': `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`,
                        'Empty': `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
                    };
                    const tripRevenue = trip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0;
                    
                    // Check if this trip is currently selected
                    const isSelected = selectedTripId === trip.id;
                    
                    return (
                        <div
                            key={trip.id}
                            className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-xl shadow border p-4 hover:shadow-lg transition ${isSelected ? 'border-yellow-400 border-2' : isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
                        >
                            <div onClick={() => handleSelectTrip(trip.id)} className="cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex-1`}>{trip.trip_name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                                        {status}
                                    </span>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
                                <div className={`flex justify-between mt-2 ${isDarkMode ? 'text-gray-300' : ''}`}>
                                    <span className="text-sm">Seats: <strong>{trip.booked_seats || 0}/{trip.total_seats}</strong></span>
                                    <span className="text-sm">Customers: <strong>{trip.customers?.length || 0}</strong></span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${trip.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : trip.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {trip.status || 'Active'}
                                    </span>
                                    {tripRevenue > 0 && (
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                            ₹{tripRevenue.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`flex flex-wrap gap-1 mt-3 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                <button
                                    onClick={() => handleEditTrip(trip)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteTrip(trip.id, trip.trip_name)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                >
                                    🗑️ Delete
                                </button>
                                {trip.customers?.length > 0 && (
                                    <button
                                        onClick={() => exportTripCustomers(trip)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        📥 Export
                                    </button>
                                )}
                                <button
                                    onClick={() => handleSelectTrip(trip.id)}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                                >
                                    📋 View
                                </button>
                                {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleUpdateTripStatus(trip.id, 'completed')}
                                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        ✅ Complete
                                    </button>
                                )}
                                {trip.status === 'active' && (
                                    <button
                                        onClick={() => handleUpdateTripStatus(trip.id, 'cancelled')}
                                        className="bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        ❌ Cancel
                                    </button>
                                )}
                                {trip.status === 'cancelled' && (
                                    <button
                                        onClick={() => handleUpdateTripStatus(trip.id, 'active')}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        🔄 Reactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredTrips.length === 0 && (
                    <div className={`col-span-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
                        No trips found. Try adjusting your filters or create a new trip.
                    </div>
                )}
            </div>

            {/* Selected Trip Details */}
            {selectedTrip && (
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow-md border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-6`}>
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedTrip.trip_name}</h2>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatDate(selectedTrip.start_date)} - {formatDate(selectedTrip.end_date)}
                                {' • '}
                                Seats: {selectedTrip.booked_seats || 0}/{selectedTrip.total_seats}
                                {' • '}
                                Rate: ₹{selectedTrip.rate_per_seat}/seat
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                                Status: 
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedTrip.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : selectedTrip.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {selectedTrip.status || 'Active'}
                                </span>
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                👥 {selectedTrip.customers?.length || 0} customers booked
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={printTripDetails}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                                🖨️ Print
                            </button>
                            <button
                                onClick={() => setShowSeatMap(!showSeatMap)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                                {showSeatMap ? 'Hide Seat Map' : '🗺️ Seat Map'}
                            </button>
                            <button
                                onClick={() => setShowAddCustomer(!showAddCustomer)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition text-sm"
                            >
                                {showAddCustomer ? 'Cancel' : '+ Add Customer'}
                            </button>
                        </div>
                    </div>

                    {loadingTrip && (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading trip details...</p>
                        </div>
                    )}

                    {/* Seat Map View */}
                    {showSeatMap && selectedTrip.seats && (
                        <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-4 mb-4 border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : ''}`}>🗺️ Seat Map - {selectedTrip.trip_name}</h3>
                            <div className="overflow-x-auto">
                                <div className="max-w-3xl mx-auto">
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
                                    <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-4 border-2 ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                                        <div className="bg-gray-700 text-white text-center py-2 rounded-lg mb-4 text-sm font-medium">
                                            🚗 DRIVER
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                                            {selectedTrip.seats.map((seat) => {
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
                                    </div>
                                    <div className={`text-center mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Total Seats: {selectedTrip.seats.length} | Booked: {selectedTrip.seats.filter(s => s.is_booked === 1).length} | Available: {selectedTrip.seats.filter(s => s.is_booked !== 1).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer History Modal */}
                    {showCustomerHistory && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : ''}`}>📋 Customer Booking History</h3>
                                    <button
                                        onClick={() => setShowCustomerHistory(null)}
                                        className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} text-xl`}
                                    >
                                        ✕
                                    </button>
                                </div>
                                {showCustomerHistory.length === 0 ? (
                                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No booking history found</p>
                                ) : (
                                    <div className="space-y-3">
                                        {showCustomerHistory.map((booking, index) => (
                                            <div key={index} className={`border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-semibold ${isDarkMode ? 'text-white' : ''}`}>{booking.trip_name}</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>Seats: {booking.total_seats} | Seat Numbers: {booking.seat_numbers?.join(', ') || 'N/A'}</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>Total: ₹{booking.total_amount} | Paid: ₹{booking.advance_amount} | Balance: ₹{booking.balance_amount}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${booking.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {booking.status || 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Print View */}
                    {showPrintView && (
                        <div className="hidden print:block">
                            <div className="p-8">
                                <h1 className="text-2xl font-bold text-center">{selectedTrip.trip_name}</h1>
                                <p className="text-center text-gray-600">{formatDate(selectedTrip.start_date)} - {formatDate(selectedTrip.end_date)}</p>
                                <hr className="my-4" />
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border p-2 text-left">#</th>
                                            <th className="border p-2 text-left">Customer</th>
                                            <th className="border p-2 text-left">Phone</th>
                                            <th className="border p-2 text-left">Seats</th>
                                            <th className="border p-2 text-left">Seat Numbers</th>
                                            <th className="border p-2 text-right">Total</th>
                                            <th className="border p-2 text-right">Advance</th>
                                            <th className="border p-2 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTrip.customers?.map((customer, index) => (
                                            <tr key={customer.id}>
                                                <td className="border p-2">{index + 1}</td>
                                                <td className="border p-2">{customer.customer_name}</td>
                                                <td className="border p-2">{customer.phone}</td>
                                                <td className="border p-2 text-center">{customer.total_seats}</td>
                                                <td className="border p-2">{customer.seat_numbers?.join(', ') || '-'}</td>
                                                <td className="border p-2 text-right">₹{parseFloat(customer.total_amount || 0).toFixed(2)}</td>
                                                <td className="border p-2 text-right">₹{parseFloat(customer.advance_amount || 0).toFixed(2)}</td>
                                                <td className="border p-2 text-right">₹{parseFloat(customer.balance_amount || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold bg-yellow-50">
                                            <td colSpan="4" className="border p-2 text-right">TOTALS:</td>
                                            <td className="border p-2 text-center">{selectedTrip.customers?.reduce((sum, c) => sum + (c.total_seats || 0), 0) || 0}</td>
                                            <td className="border p-2 text-right">₹{selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0).toFixed(2)}</td>
                                            <td className="border p-2 text-right">₹{selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.advance_amount) || 0), 0).toFixed(2)}</td>
                                            <td className="border p-2 text-right">₹{selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.balance_amount) || 0), 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <p className="text-center text-gray-500 text-sm mt-4">Generated on: {new Date().toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {/* Edit Customer Form */}
                    {showEditCustomerForm && editingCustomer && (
                        <div className={`${isDarkMode ? 'bg-slate-700 border-yellow-500' : 'bg-yellow-50 border-yellow-300'} rounded-lg p-4 mb-4 border`}>
                            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : ''}`}>✏️ Edit Customer</h3>
                            <form onSubmit={handleUpdateCustomer}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Customer Name *</label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={customerFormData.customer_name}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone *</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={customerFormData.phone}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={customerFormData.location}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder="Delhi, Gurgaon, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Pickup Point</label>
                                        <select
                                            name="pickup_point"
                                            value={customerFormData.pickup_point}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="">Select Pickup Point</option>
                                            {pickupOptions.map((point, index) => (
                                                <option key={index} value={point}>
                                                    {point}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Advance Amount</label>
                                        <input
                                            type="number"
                                            name="advance_amount"
                                            value={customerFormData.advance_amount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter advance amount"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Collected By</label>
                                        <select
                                            name="advance_collected_by"
                                            value={customerFormData.advance_collected_by}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="Sanjeev">Sanjeev</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="GMC">GMC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Advance Collected Date</label>
                                        <input
                                            type="date"
                                            name="advance_collected_date"
                                            value={customerFormData.advance_collected_date}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Referral ID</label>
                                        <input
                                            type="text"
                                            name="referral_id"
                                            value={customerFormData.referral_id}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Referral ID (optional)"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount (₹)</label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={customerFormData.discount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter discount amount"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Given By</label>
                                        <select
                                            name="discount_given_by"
                                            value={customerFormData.discount_given_by}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="GMC">GMC</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="Sanjeev">Sanjeev</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Remarks</label>
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={customerFormData.remarks}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            placeholder="Any special notes..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Extra Expenses</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Expense name (e.g., Extra Bed)"
                                                value={editNewExpenseName}
                                                onChange={(e) => setEditNewExpenseName(e.target.value)}
                                                className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={editNewExpenseAmount}
                                                onChange={(e) => setEditNewExpenseAmount(e.target.value)}
                                                className={`w-32 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                                min="0"
                                                step="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={addEditExtraExpense}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                        {editExtraExpensesList.length > 0 && (
                                            <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} p-2`}>
                                                {editExtraExpensesList.map((item, index) => (
                                                    <div key={index} className={`flex justify-between items-center border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} py-1 last:border-b-0`}>
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>{item.name}: ₹{item.amount}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditExtraExpense(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className={`text-sm font-bold text-right mt-1 border-t ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} pt-1 ${isDarkMode ? 'text-white' : ''}`}>
                                                    Total Extra: ₹{getEditTotalExtraExpenses()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Travelers</label>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Seats: <strong className={isDarkMode ? 'text-white' : ''}>{1 + travelers.length}</strong> (1 Self + {travelers.length} additional)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addEditTraveler}
                                                className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                + Add Traveler
                                            </button>
                                        </div>

                                        <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border mb-2`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">SELF</span>
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer: {customerFormData.customer_name || 'Not set'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
                                                    <input
                                                        type="text"
                                                        value={customerFormData.customer_name || ''}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-50 border-gray-200'}`}
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={customerFormData.customer_age}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_age: e.target.value })}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                                                    <select
                                                        value={customerFormData.customer_gender}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_gender: e.target.value })}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {travelers.map((traveler, index) => (
                                            <div key={index} className={`grid grid-cols-1 md:grid-cols-5 gap-2 p-2 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} mb-2`}>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={traveler.traveler_name}
                                                        onChange={(e) => updateEditTraveler(index, 'traveler_name', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        value={traveler.phone}
                                                        onChange={(e) => updateEditTraveler(index, 'phone', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={traveler.age}
                                                        onChange={(e) => updateEditTraveler(index, 'age', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                                                    <select
                                                        value={traveler.gender}
                                                        onChange={(e) => updateEditTraveler(index, 'gender', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Relation</label>
                                                        <select
                                                            value={traveler.relation}
                                                            onChange={(e) => updateEditTraveler(index, 'relation', e.target.value)}
                                                            className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                                                        >
                                                            <option value="Self">Self</option>
                                                            <option value="Spouse">Spouse</option>
                                                            <option value="Son">Son</option>
                                                            <option value="Daughter">Daughter</option>
                                                            <option value="Father">Father</option>
                                                            <option value="Mother">Mother</option>
                                                            <option value="Friend">Friend</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEditTraveler(index)}
                                                        className="text-red-500 hover:text-red-700 text-sm h-8 px-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SEAT SELECTION */}
                                    <div className="md:col-span-2 mt-4">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                            🪑 Select Seats (Choose {1 + travelers.length} seats)
                                        </label>
                                        <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-xl p-4 border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} shadow-sm`}>
                                            {selectedTrip?.seats && selectedTrip.seats.length > 0 ? (
                                                renderSeats(selectedTrip.seats, true, editingCustomer?.id)
                                            ) : (
                                                <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    No seats available for this trip.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Update Customer'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditCustomerForm(false);
                                            setEditingCustomer(null);
                                            setTravelers([]);
                                            setSelectedSeats([]);
                                            setEditExtraExpensesList([]);
                                            setEditNewExpenseName('');
                                            setEditNewExpenseAmount('');
                                        }}
                                        className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Add Customer Form */}
                    {showAddCustomer && !showEditCustomerForm && (
                        <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-4 mb-4 border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : ''}`}>Add Customer to Trip</h3>
                            <form onSubmit={handleAddCustomer}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone Number *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 10-digit phone"
                                            value={searchPhone}
                                            onChange={handlePhoneChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            maxLength="10"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Customer Name *</label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={customerFormData.customer_name}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            required
                                        />
                                    </div>
                                    {foundCustomer && (
                                        <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-700">
                                            <p className="text-green-700 dark:text-green-400 font-semibold">✅ Found: {foundCustomer.customer_name || 'Unknown'}</p>
                                        </div>
                                    )}
                                    {isNewCustomer && (
                                        <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                            <p className="text-yellow-700 dark:text-yellow-400">⚠️ New Customer - Will be added to customers list</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={customerFormData.location}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            placeholder="Delhi, Gurgaon, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Pickup Point</label>
                                        <select
                                            name="pickup_point"
                                            value={customerFormData.pickup_point}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="">Select Pickup Point</option>
                                            {pickupOptions.map((point, index) => (
                                                <option key={index} value={point}>
                                                    {point}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Advance Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="advance_amount"
                                            value={customerFormData.advance_amount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter advance amount"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Collected By</label>
                                        <select
                                            name="advance_collected_by"
                                            value={customerFormData.advance_collected_by}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="Sanjeev">Sanjeev</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="GMC">GMC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Advance Collected Date</label>
                                        <input
                                            type="date"
                                            name="advance_collected_date"
                                            value={customerFormData.advance_collected_date}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Referral ID</label>
                                        <input
                                            type="text"
                                            name="referral_id"
                                            value={customerFormData.referral_id}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Referral ID (optional)"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount (₹)</label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={customerFormData.discount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter discount amount"
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Given By</label>
                                        <select
                                            name="discount_given_by"
                                            value={customerFormData.discount_given_by}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="GMC">GMC</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="Sanjeev">Sanjeev</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Extra Expenses</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Expense name (e.g., Extra Bed)"
                                                value={newExpenseName}
                                                onChange={(e) => setNewExpenseName(e.target.value)}
                                                className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newExpenseAmount}
                                                onChange={(e) => setNewExpenseAmount(e.target.value)}
                                                className={`w-32 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                                min="0"
                                                step="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={addExtraExpense}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                        {extraExpensesList.length > 0 && (
                                            <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} p-2`}>
                                                {extraExpensesList.map((item, index) => (
                                                    <div key={index} className={`flex justify-between items-center border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} py-1 last:border-b-0`}>
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>{item.name}: ₹{item.amount}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExtraExpense(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className={`text-sm font-bold text-right mt-1 border-t ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} pt-1 ${isDarkMode ? 'text-white' : ''}`}>
                                                    Total Extra: ₹{getTotalExtraExpenses()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Remarks</label>
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={customerFormData.remarks}
                                            onChange={handleCustomerInputChange}
                                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                            placeholder="Any special notes..."
                                        />
                                    </div>

                                    {/* Travelers */}
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Travelers</label>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Seats: <strong className={isDarkMode ? 'text-white' : ''}>{getTotalSeats()}</strong> (1 Self + {travelers.length} additional)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addTraveler}
                                                className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                + Add Traveler
                                            </button>
                                        </div>

                                        <div className={`${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border mb-2`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">SELF</span>
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer: {customerFormData.customer_name || 'Not set'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
                                                    <input
                                                        type="text"
                                                        value={customerFormData.customer_name || ''}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-gray-50 border-gray-200'}`}
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={customerFormData.customer_age}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_age: e.target.value })}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                                                    <select
                                                        value={customerFormData.customer_gender}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_gender: e.target.value })}
                                                        className={`w-full p-1.5 border rounded text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {travelers.map((traveler, index) => (
                                            <div key={index} className={`grid grid-cols-1 md:grid-cols-5 gap-2 p-2 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} mb-2`}>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={traveler.traveler_name}
                                                        onChange={(e) => updateTraveler(index, 'traveler_name', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        value={traveler.phone}
                                                        onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={traveler.age}
                                                        onChange={(e) => updateTraveler(index, 'age', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                                                    <select
                                                        value={traveler.gender}
                                                        onChange={(e) => updateTraveler(index, 'gender', e.target.value)}
                                                        className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Relation</label>
                                                        <select
                                                            value={traveler.relation}
                                                            onChange={(e) => updateTraveler(index, 'relation', e.target.value)}
                                                            className={`w-full p-1 border rounded text-sm ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'}`}
                                                        >
                                                            <option value="Self">Self</option>
                                                            <option value="Spouse">Spouse</option>
                                                            <option value="Son">Son</option>
                                                            <option value="Daughter">Daughter</option>
                                                            <option value="Father">Father</option>
                                                            <option value="Mother">Mother</option>
                                                            <option value="Friend">Friend</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTraveler(index)}
                                                        className="text-red-500 hover:text-red-700 text-sm h-8 px-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SEAT SELECTION */}
                                    <div className="md:col-span-2 mt-4">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                            🪑 Select Seats (Choose {getTotalSeats()} seats)
                                        </label>
                                        <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-xl p-4 border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'} shadow-sm`}>
                                            {selectedTrip?.seats && selectedTrip.seats.length > 0 ? (
                                                renderSeats(selectedTrip.seats, false)
                                            ) : (
                                                <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    No seats available for this trip. Please create the trip first.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Customer'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddCustomer(false);
                                            setTravelers([]);
                                            setSelectedSeats([]);
                                            setExtraExpensesList([]);
                                            setNewExpenseName('');
                                            setNewExpenseAmount('');
                                            setSearchPhone('');
                                            setFoundCustomer(null);
                                            setIsNewCustomer(false);
                                            setCustomerFormData({
                                                customer_id: '',
                                                customer_name: '',
                                                phone: '',
                                                location: '',
                                                pickup_point: '',
                                                customer_age: '',
                                                customer_gender: 'Male',
                                                total_seats: 1,
                                                base_amount: 0,
                                                total_amount: 0,
                                                advance_amount: '',
                                                balance_amount: 0,
                                                advance_collected_by: 'GMC',
                                                advance_collected_date: '',
                                                referral_id: '',
                                                payment_mode: 'Cash',
                                                remarks: '',
                                                discount: '',
                                                discount_given_by: 'GMC',
                                            });
                                        }}
                                        className={`px-6 py-2 rounded-lg transition ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Customers List */}
                    <div className="mt-4">
                        <div className={`flex justify-between items-center mb-3 ${isDarkMode ? 'text-white' : ''}`}>
                            <h3 className="font-semibold">Customers ({selectedTrip.customers?.length || 0})</h3>
                            {selectedTrip.customers?.length > 0 && (
                                <button
                                    onClick={() => exportTripCustomers(selectedTrip)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition"
                                >
                                    📥 Export All
                                </button>
                            )}
                        </div>
                        {selectedTrip.customers?.length === 0 ? (
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-center py-4`}>No customers added yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>#</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Phone</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Location</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pickup</th>
                                            <th className={`px-3 py-2 text-center text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Seats</th>
                                            <th className={`px-3 py-2 text-center text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Seat Numbers</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Travelers</th>
                                            <th className={`px-3 py-2 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total</th>
                                            <th className={`px-3 py-2 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Advance</th>
                                            <th className={`px-3 py-2 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Discount</th>
                                            <th className={`px-3 py-2 text-right text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Balance</th>
                                            <th className={`px-3 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Referral</th>
                                            <th className={`px-3 py-2 text-center text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                                        {selectedTrip.customers.map((customer, index) => (
                                            <tr key={customer.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition`}>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{index + 1}</td>
                                                <td className={`px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{customer.customer_name}</td>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.phone}</td>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.location || '-'}</td>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.pickup_point || '-'}</td>
                                                <td className={`px-3 py-2 text-sm text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-bold`}>{customer.total_seats}</td>
                                                <td className={`px-3 py-2 text-sm text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {customer.seat_numbers && customer.seat_numbers.length > 0 ? (
                                                        <span className={`${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'} px-2 py-0.5 rounded text-xs font-medium`}>
                                                            {customer.seat_numbers.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                                                    )}
                                                </td>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {customer.travelers?.map((t, i) => (
                                                        <div key={i} className={`text-xs border-b ${isDarkMode ? 'border-slate-600' : 'border-gray-100'} py-0.5`}>
                                                            {t.traveler_name} ({t.relation}, {t.gender}, {t.age || 'N/A'} yrs) - {t.phone || 'N/A'}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className={`px-3 py-2 text-sm text-right font-bold ${isDarkMode ? 'text-white' : ''}`}>
                                                    ₹{(parseFloat(customer.total_amount) || 0).toFixed(2)}
                                                </td>
                                                <td className={`px-3 py-2 text-sm text-right text-green-600 dark:text-green-400`}>
                                                    ₹{(parseFloat(customer.advance_amount) || 0).toFixed(2)}
                                                </td>
                                                <td className={`px-3 py-2 text-sm text-right text-blue-600 dark:text-blue-400`}>
                                                    ₹{(parseFloat(customer.discount) || 0).toFixed(2)}
                                                </td>
                                                <td className={`px-3 py-2 text-sm text-right text-red-600 dark:text-red-400`}>
                                                    ₹{(parseFloat(customer.balance_amount) || 0).toFixed(2)}
                                                </td>
                                                <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.referral_id || '-'}</td>
                                                <td className="px-3 py-2 text-sm text-center">
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        <button
                                                            onClick={() => handleEditCustomer(customer)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveCustomer(customer.id)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                                            title="Remove"
                                                        >
                                                            🗑️
                                                        </button>
                                                        <button
                                                            onClick={() => sendWhatsApp(customer)}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition"
                                                            title="Send WhatsApp"
                                                        >
                                                            💬
                                                        </button>
                                                        <button
                                                            onClick={() => generateReceipt(customer)}
                                                            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                                                            title="Receipt"
                                                        >
                                                            📄
                                                        </button>
                                                        <button
                                                            onClick={() => viewCustomerHistory(customer.customer_id || customer.id)}
                                                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs transition"
                                                            title="History"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className={`${isDarkMode ? 'bg-slate-700 border-t-2 border-yellow-500' : 'bg-yellow-50 border-t-2 border-yellow-400'}`}>
                                        <tr>
                                            <td colSpan="5" className={`px-3 py-2 text-right font-bold ${isDarkMode ? 'text-white' : ''}`}>TOTALS:</td>
                                            <td className={`px-3 py-2 text-center font-bold ${isDarkMode ? 'text-white' : ''}`}>
                                                {selectedTrip.customers?.reduce((sum, c) => sum + (c.total_seats || 0), 0) || 0}
                                            </td>
                                            <td className="px-3 py-2"></td>
                                            <td className="px-3 py-2"></td>
                                            <td className={`px-3 py-2 text-right font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.advance_amount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.discount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.balance_amount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2"></td>
                                            <td className="px-3 py-2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YatraBookingPage;
