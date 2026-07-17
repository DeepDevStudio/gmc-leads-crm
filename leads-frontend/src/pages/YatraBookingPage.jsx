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

    // ===== REFRESH TRIP DATA =====
    const refreshTripData = async () => {
        if (selectedTripId) {
            try {
                const response = await api.get(`/yatra-bookings/trips/${selectedTripId}`);
                setSelectedTrip(response.data);
                // Also update the trip in the trips list
                setTrips(prev => prev.map(t => 
                    t.id === selectedTripId ? response.data : t
                ));
            } catch (error) {
                console.error('Error refreshing trip:', error);
            }
        }
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
            
            // If a trip is selected, refresh it
            if (selectedTripId) {
                const tripRes = await api.get(`/yatra-bookings/trips/${selectedTripId}`);
                setSelectedTrip(tripRes.data);
            }
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
            await loadData();
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
            yatra_id: trip.yatra_id || '',
            trip_name: trip.trip_name || '',
            start_date: trip.start_date?.split('T')[0] || '',
            end_date: trip.end_date?.split('T')[0] || '',
            total_seats: trip.total_seats || '',
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
            await loadData();
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
            await loadData();
        } catch (error) {
            console.error('Error deleting trip:', error);
            showMessage('Failed to delete trip', 'error');
        }
    };

    // ===== YATRA EDIT/VIEW/DELETE =====
    const [editingYatra, setEditingYatra] = useState(null);
    const [showEditYatraForm, setShowEditYatraForm] = useState(false);
    const [yatraFormData, setYatraFormData] = useState({
        id: '',
        yatra_name: '',
        start_date: '',
        end_date: '',
        rate_per_seat: '',
        total_seats: '',
        status: 'active',
        description: ''
    });

    const handleEditYatra = (yatra) => {
        setEditingYatra(yatra);
        setShowEditYatraForm(true);
        setYatraFormData({
            id: yatra.id,
            yatra_name: yatra.yatra_name || '',
            start_date: yatra.start_date?.split('T')[0] || '',
            end_date: yatra.end_date?.split('T')[0] || '',
            rate_per_seat: yatra.rate_per_seat || '',
            total_seats: yatra.total_seats || '',
            status: yatra.status || 'active',
            description: yatra.description || ''
        });
    };

    const handleUpdateYatra = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/yatras/${yatraFormData.id}`, yatraFormData);
            showMessage('Yatra updated successfully!', 'success');
            setShowEditYatraForm(false);
            setEditingYatra(null);
            await loadData();
        } catch (error) {
            console.error('Error updating yatra:', error);
            showMessage('Failed to update yatra', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteYatra = async (id, name) => {
        if (!window.confirm(`Delete yatra "${name}"? This will remove all associated trips.`)) return;
        try {
            await api.delete(`/yatras/${id}`);
            showMessage('Yatra deleted successfully!', 'success');
            await loadData();
        } catch (error) {
            console.error('Error deleting yatra:', error);
            showMessage('Failed to delete yatra', 'error');
        }
    };

    // ===== CUSTOMER FUNCTIONS =====
    const handlePhoneChange = async (e) => {
        const phone = e.target.value;
        setSearchPhone(phone);
        setCustomerFormData({ ...customerFormData, phone: phone });

        if (phone.length === 10) {
            try {
                const response = await api.get(`/customers/search/${phone}`);
                if (response.data && response.data.id) {
                    setFoundCustomer(response.data);
                    setIsNewCustomer(false);
                    setCustomerFormData({
                        ...customerFormData,
                        customer_id: response.data.id,
                        customer_name: response.data.customer_name || '',
                        phone: response.data.phone || phone,
                        location: response.data.location || '',
                        advance_collected_by: response.data.advance_collected_by || 'GMC',
                        discount_given_by: response.data.discount_given_by || 'GMC',
                    });
                } else {
                    setFoundCustomer(null);
                    setIsNewCustomer(true);
                }
            } catch (error) {
                setFoundCustomer(null);
                setIsNewCustomer(true);
            }
        } else {
            setFoundCustomer(null);
            setIsNewCustomer(false);
        }
    };

    const handleCustomerInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerFormData({ ...customerFormData, [name]: value });
    };

    // ===== REAL-TIME CALCULATIONS =====
    const getTotalExtraExpenses = () => {
        return extraExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    };

    const getEditTotalExtraExpenses = () => {
        return editExtraExpensesList.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    };

    const calculateTotalAmount = () => {
        const totalSeats = 1 + travelers.length;
        const baseAmount = selectedTrip?.rate_per_seat || 0;
        const totalAmount = totalSeats * baseAmount;
        const extraExpensesTotal = getTotalExtraExpenses();
        const advanceAmount = parseFloat(customerFormData.advance_amount) || 0;
        const discountAmount = parseFloat(customerFormData.discount) || 0;
        const balanceAmount = totalAmount + extraExpensesTotal - advanceAmount - discountAmount;

        return {
            totalAmount,
            extraExpensesTotal,
            advanceAmount,
            discountAmount,
            balanceAmount
        };
    };

    const handleAdvanceChange = (e) => {
        const value = e.target.value;
        setCustomerFormData({ ...customerFormData, advance_amount: value });
        
        const calc = calculateTotalAmount();
        const newBalance = calc.totalAmount + calc.extraExpensesTotal - parseFloat(value || 0) - calc.discountAmount;
        setCustomerFormData(prev => ({ ...prev, balance_amount: newBalance }));
    };

    const handleDiscountChange = (e) => {
        const value = e.target.value;
        setCustomerFormData({ ...customerFormData, discount: value });
        
        const calc = calculateTotalAmount();
        const newBalance = calc.totalAmount + calc.extraExpensesTotal - calc.advanceAmount - parseFloat(value || 0);
        setCustomerFormData(prev => ({ ...prev, balance_amount: newBalance }));
    };

    const handleSeatsChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        setCustomerFormData({ ...customerFormData, total_seats: value });
    };

    // ===== SEAT SELECTION =====
    const toggleSeat = (seatNumber) => {
        const totalSeats = 1 + travelers.length;
        if (selectedSeats.includes(seatNumber)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
        } else {
            if (selectedSeats.length >= totalSeats) {
                showMessage(`Please select exactly ${totalSeats} seats`, 'error');
                return;
            }
            setSelectedSeats([...selectedSeats, seatNumber]);
        }
    };

    const renderSeats = (seats, isEditMode = false, editingCustomerId = null) => {
        if (!seats || seats.length === 0) {
            return (
                <div className="text-center py-4 text-gray-500">
                    No seats available
                </div>
            );
        }

        const rows = [];
        for (let i = 0; i < seats.length; i += 4) {
            rows.push(seats.slice(i, i + 4));
        }

        const lastRow = rows[rows.length - 1];
        const lastRowLength = lastRow ? lastRow.length : 0;
        if (lastRowLength < 4) {
            for (let i = lastRowLength; i < 4; i++) {
                lastRow.push({ seat_number: `empty-${i}`, is_booked: 2, id: `empty-${i}` });
            }
        }

        return (
            <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 justify-center">
                        {row.map((seat) => {
                            if (seat.seat_number?.toString().startsWith('empty')) {
                                return <div key={seat.id} className="w-10 h-10" />;
                            }
                            
                            const isBooked = isEditMode && editingCustomerId
                                ? seat.is_booked === 1 && seat.customer_trip_id !== editingCustomerId
                                : seat.is_booked === 1;
                            const isSelected = selectedSeats.includes(seat.seat_number);
                            
                            return (
                                <button
                                    key={seat.id || seat.seat_number}
                                    onClick={() => toggleSeat(seat.seat_number)}
                                    disabled={isBooked}
                                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition ${
                                        isBooked 
                                            ? 'bg-red-400 cursor-not-allowed' 
                                            : isSelected 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {seat.seat_number}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    // ===== ADD CUSTOMER =====
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
            
            // If new customer, create them first
            if (isNewCustomer || !customerId) {
                const customerPayload = {
                    customer_name: customerFormData.customer_name,
                    phone: customerFormData.phone,
                    location: customerFormData.location || '',
                    email: customerFormData.email || ''
                };
                const customerRes = await api.post('/customers', customerPayload);
                customerId = customerRes.data.id;
            }

            const seatsToSend = selectedSeats.map(Number);

            const payload = {
                customer_id: customerId,
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
                advance_collected_date: customerFormData.advance_collected_date || new Date().toISOString().split('T')[0],
                referral_id: customerFormData.referral_id || '',
                payment_mode: customerFormData.payment_mode || 'Cash',
                remarks: customerFormData.remarks || '',
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
                travelers: allTravelers.map(t => ({
                    traveler_name: t.traveler_name,
                    phone: t.phone || customerFormData.phone,
                    age: t.age || null,
                    gender: t.gender || 'Male',
                    relation: t.relation || 'Self'
                })),
                extra_expenses: extraExpensesList.map(e => ({
                    expense_name: e.name,
                    expense_amount: parseFloat(e.amount) || 0
                }))
            };

            await api.post(`/yatra-bookings/trips/${selectedTripId}/customers`, payload);
            
            showMessage('Customer added to trip successfully!', 'success');
            
            // Reset form
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
            setTravelers([]);
            setSelectedSeats([]);
            setExtraExpensesList([]);
            setFoundCustomer(null);
            setIsNewCustomer(false);
            setShowAddCustomer(false);
            
            // Refresh all data
            await loadData();
            await refreshTripData();

        } catch (error) {
            console.error('Error adding customer:', error);
            showMessage(error.response?.data?.message || 'Failed to add customer', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== DELETE CUSTOMER =====
    const handleDeleteCustomer = async (customerId, customerName) => {
        if (!window.confirm(`Delete customer "${customerName}" from this trip? This will remove all travelers.`)) return;

        setLoading(true);
        try {
            await api.delete(`/yatra-bookings/trip-customers/${customerId}`);
            showMessage('Customer removed from trip successfully!', 'success');
            
            // Refresh all data
            await loadData();
            await refreshTripData();
        } catch (error) {
            console.error('Error deleting customer:', error);
            showMessage('Failed to delete customer', 'error');
        } finally {
            setLoading(false);
        }
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
                advance_collected_date: customerFormData.advance_collected_date || new Date().toISOString().split('T')[0],
                referral_id: customerFormData.referral_id || '',
                payment_mode: customerFormData.payment_mode || 'Cash',
                remarks: customerFormData.remarks || '',
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
                travelers: allTravelers.map(t => ({
                    traveler_name: t.traveler_name,
                    phone: t.phone || customerFormData.phone,
                    age: t.age || null,
                    gender: t.gender || 'Male',
                    relation: t.relation || 'Self'
                })),
                extra_expenses: editExtraExpensesList.map(e => ({
                    expense_name: e.name,
                    expense_amount: parseFloat(e.amount) || 0
                }))
            };

            await api.put(`/yatra-bookings/trip-customers/${editingCustomer.id}`, payload);
            
            showMessage('Customer updated successfully!', 'success');
            
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
            setTravelers([]);
            setSelectedSeats([]);
            setEditExtraExpensesList([]);
            setEditingCustomer(null);
            setShowEditCustomerForm(false);
            
            // Refresh all data
            await loadData();
            await refreshTripData();

        } catch (error) {
            console.error('Error updating customer:', error);
            showMessage(error.response?.data?.message || 'Failed to update customer', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== SELECT TRIP =====
    const handleSelectTrip = async (tripId) => {
        setLoadingTrip(true);
        try {
            const response = await api.get(`/yatra-bookings/trips/${tripId}`);
            setSelectedTrip(response.data);
            setSelectedTripId(tripId);
            setShowAddCustomer(false);
            setShowEditCustomerForm(false);
            setEditingCustomer(null);
        } catch (error) {
            console.error('Error loading trip:', error);
            showMessage('Failed to load trip details', 'error');
        } finally {
            setLoadingTrip(false);
        }
    };

    // ===== PRINT RECEIPT =====
    const handlePrintReceipt = (customer) => {
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

    // ===== EXPORT TRIP CUSTOMERS =====
    const exportTripCustomers = (trip) => {
        let csv = 'Customer Name,Phone,Seats,Total Amount,Advance,Balance\n';
        trip.customers?.forEach(c => {
            csv += `${c.customer_name},${c.phone},${c.total_seats},${c.total_amount},${c.advance_amount},${c.balance_amount}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip-${trip.id}-customers.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage('Export successful!', 'success');
    };

    // ===== ADD TRAVELER =====
    const addTraveler = () => {
        setTravelers([...travelers, { traveler_name: '', phone: '', age: '', gender: 'Male', relation: 'Friend' }]);
    };

    const removeTraveler = (index) => {
        setTravelers(travelers.filter((_, i) => i !== index));
    };

    const updateTraveler = (index, field, value) => {
        const updated = [...travelers];
        updated[index][field] = value;
        setTravelers(updated);
    };

    // ===== EXTRA EXPENSES =====
    const addExtraExpense = () => {
        if (newExpenseName && newExpenseAmount) {
            setExtraExpensesList([...extraExpensesList, { name: newExpenseName, amount: newExpenseAmount }]);
            setNewExpenseName('');
            setNewExpenseAmount('');
        }
    };

    const removeExtraExpense = (index) => {
        setExtraExpensesList(extraExpensesList.filter((_, i) => i !== index));
    };

    // ===== RENDER =====
    const pickupOptions = selectedTrip?.trip_name 
        ? getPickupPointsForYatra(selectedTrip.trip_name)
        : pickupPointsMap['default'];

    // People options for advance_collected_by and discount_given_by
    const peopleOptions = ['GMC', 'Sanjeev', 'Rajeev'];

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">🚌 Yatra Booking Management</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage trips, customers, and bookings
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
                    <div className="text-2xl font-bold text-blue-500">{stats.totalTrips}</div>
                    <div className="text-sm">Total Trips</div>
                </div>
                <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="text-2xl font-bold text-green-500">{stats.totalBookings}</div>
                    <div className="text-sm">Total Bookings</div>
                </div>
                <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="text-2xl font-bold text-purple-500">₹{stats.totalRevenue}</div>
                    <div className="text-sm">Total Revenue</div>
                </div>
                <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="text-2xl font-bold text-yellow-500">{stats.activeTrips}</div>
                    <div className="text-sm">Active Trips</div>
                </div>
                <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="text-2xl font-bold text-gray-500">{stats.completedTrips}</div>
                    <div className="text-sm">Completed</div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg mb-4 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Trip List */}
                <div className="lg:col-span-1">
                    <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">📋 Trips</h2>
                            <button
                                onClick={() => setShowTripForm(!showTripForm)}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition"
                            >
                                {showTripForm ? '✕ Close' : '+ New Trip'}
                            </button>
                        </div>

                        {/* Create Trip Form */}
                        {showTripForm && (
                            <form onSubmit={handleCreateTrip} className="mb-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Yatra *</label>
                                        <select
                                            name="yatra_id"
                                            value={tripFormData.yatra_id}
                                            onChange={handleTripInputChange}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                            required
                                        >
                                            <option value="">Select Yatra</option>
                                            {yatras.map(y => (
                                                <option key={y.id} value={y.id}>{y.yatra_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Trip Name</label>
                                        <input
                                            type="text"
                                            name="trip_name"
                                            value={tripFormData.trip_name}
                                            onChange={handleTripInputChange}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                            placeholder="Auto-generated from yatra"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={tripFormData.start_date}
                                                onChange={handleTripInputChange}
                                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">End Date</label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={tripFormData.end_date}
                                                onChange={handleTripInputChange}
                                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Total Seats</label>
                                        <input
                                            type="number"
                                            name="total_seats"
                                            value={tripFormData.total_seats}
                                            onChange={handleTripInputChange}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                            placeholder="53"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {loading ? 'Creating...' : 'Create Trip'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Trip List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {trips.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No trips found</p>
                            ) : (
                                trips.map(trip => (
                                    <div
                                        key={trip.id}
                                        onClick={() => handleSelectTrip(trip.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition ${
                                            selectedTripId === trip.id
                                                ? 'bg-blue-500 text-white'
                                                : isDarkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="font-semibold">{trip.trip_name}</div>
                                        <div className="text-sm opacity-75">
                                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                        </div>
                                        <div className="text-sm opacity-75">
                                            👥 {trip.customers?.length || 0} booked · 🪑 {trip.total_seats || 0} seats
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                trip.status === 'active' ? 'bg-green-500 text-white' :
                                                trip.status === 'completed' ? 'bg-blue-500 text-white' :
                                                'bg-red-500 text-white'
                                            }`}>
                                                {trip.status || 'active'}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditTrip(trip); }}
                                                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id, trip.trip_name); }}
                                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Trip Details */}
                <div className="lg:col-span-2">
                    {selectedTrip ? (
                        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedTrip.trip_name}</h2>
                                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {formatDate(selectedTrip.start_date)} - {formatDate(selectedTrip.end_date)}
                                    </p>
                                    <p className="text-sm">
                                        🪑 {selectedTrip.total_seats} seats · 👥 {selectedTrip.customers?.length || 0} booked
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                                >
                                    {showAddCustomer ? '✕ Cancel' : '+ Add Customer'}
                                </button>
                            </div>

                            {/* Add Customer Form */}
                            {showAddCustomer && (
                                <div className="mb-6 p-4 border rounded-lg border-green-200 dark:border-green-800">
                                    <h3 className="text-lg font-bold mb-3">➕ Add Customer to Trip</h3>
                                    <form onSubmit={handleAddCustomer}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter 10-digit phone"
                                                    value={searchPhone}
                                                    onChange={handlePhoneChange}
                                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    maxLength="10"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                                                <input
                                                    type="text"
                                                    name="customer_name"
                                                    value={customerFormData.customer_name}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    required
                                                />
                                            </div>
                                            {foundCustomer && (
                                                <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-700">
                                                    <p className="text-green-700 dark:text-green-400 font-semibold">✅ Found: {foundCustomer.customer_name}</p>
                                                </div>
                                            )}
                                            {isNewCustomer && (
                                                <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                                    <p className="text-yellow-700 dark:text-yellow-400">⚠️ New Customer - Will be added to customers list</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={customerFormData.location}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    placeholder="Delhi, Gurgaon, etc."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Pickup Point</label>
                                                <select
                                                    name="pickup_point"
                                                    value={customerFormData.pickup_point}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                >
                                                    <option value="">Select Pickup Point</option>
                                                    {pickupOptions.map((point, index) => (
                                                        <option key={index} value={point}>{point}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Total Seats</label>
                                                <input
                                                    type="number"
                                                    name="total_seats"
                                                    value={customerFormData.total_seats}
                                                    onChange={handleSeatsChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    min="1"
                                                    max="20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Advance Amount</label>
                                                <input
                                                    type="number"
                                                    name="advance_amount"
                                                    value={customerFormData.advance_amount}
                                                    onChange={handleAdvanceChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    step="100"
                                                    min="0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Discount</label>
                                                <input
                                                    type="number"
                                                    name="discount"
                                                    value={customerFormData.discount}
                                                    onChange={handleDiscountChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    step="100"
                                                    min="0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Payment Mode</label>
                                                <select
                                                    name="payment_mode"
                                                    value={customerFormData.payment_mode}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="Card">Card</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Advance Collected By</label>
                                                <select
                                                    name="advance_collected_by"
                                                    value={customerFormData.advance_collected_by || 'GMC'}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                >
                                                    {peopleOptions.map(person => (
                                                        <option key={person} value={person}>{person}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Discount Given By</label>
                                                <select
                                                    name="discount_given_by"
                                                    value={customerFormData.discount_given_by || 'GMC'}
                                                    onChange={handleCustomerInputChange}
                                                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                >
                                                    {peopleOptions.map(person => (
                                                        <option key={person} value={person}>{person}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Balance</label>
                                                <input
                                                    type="number"
                                                    name="balance_amount"
                                                    value={customerFormData.balance_amount}
                                                    className={`w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-600 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                                    readOnly
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        {/* Travelers */}
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold">👤 Travelers</h4>
                                                <button
                                                    type="button"
                                                    onClick={addTraveler}
                                                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                                                >
                                                    + Add Traveler
                                                </button>
                                            </div>
                                            {travelers.map((traveler, index) => (
                                                <div key={index} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded-lg border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={traveler.traveler_name}
                                                        onChange={(e) => updateTraveler(index, 'traveler_name', e.target.value)}
                                                        className={`p-1 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        value={traveler.phone}
                                                        onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                                                        className={`p-1 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    />
                                                    <select
                                                        value={traveler.gender || 'Male'}
                                                        onChange={(e) => updateTraveler(index, 'gender', e.target.value)}
                                                        className={`p-1 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTraveler(index)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Extra Expenses */}
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold">💰 Extra Expenses</h4>
                                                <button
                                                    type="button"
                                                    onClick={addExtraExpense}
                                                    className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                                >
                                                    + Add Expense
                                                </button>
                                            </div>
                                            {extraExpensesList.map((expense, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <span className="flex-1 p-1 border rounded">{expense.name}</span>
                                                    <span className="p-1 border rounded">₹{expense.amount}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExtraExpense(index)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Expense name"
                                                    value={newExpenseName}
                                                    onChange={(e) => setNewExpenseName(e.target.value)}
                                                    className={`flex-1 p-1 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={newExpenseAmount}
                                                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                                                    className={`w-24 p-1 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addExtraExpense}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {/* Seat Selection */}
                                        {selectedTrip && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold mb-2">🪑 Select Seats</h4>
                                                <div className="p-4 border rounded-lg">
                                                    {selectedTrip.seats ? (
                                                        renderSeats(selectedTrip.seats)
                                                    ) : (
                                                        <div className="text-center text-gray-500 py-4">
                                                            Loading seats...
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm mt-2">
                                                    Selected: {selectedSeats.join(', ') || 'None'}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Customer'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Customer List */}
                            <div>
                                <h3 className="text-lg font-bold mb-3">👥 Booked Customers</h3>
                                {!selectedTrip.customers || selectedTrip.customers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No customers booked yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedTrip.customers.map((customer, index) => (
                                            <div key={customer.id || index} className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-semibold">{customer.customer_name}</div>
                                                        <div className="text-sm">📱 {customer.phone}</div>
                                                        <div className="text-sm">📍 {customer.pickup_point || customer.location || 'N/A'}</div>
                                                        <div className="text-sm">🪑 Seats: {customer.total_seats} ({customer.seat_numbers?.join(', ') || 'N/A'})</div>
                                                        <div className="text-sm">💰 Total: ₹{customer.total_amount} · Advance: ₹{customer.advance_amount} · Balance: ₹{customer.balance_amount}</div>
                                                        {customer.discount > 0 && (
                                                            <div className="text-sm text-green-600">🎯 Discount: ₹{customer.discount}</div>
                                                        )}
                                                        <div className="text-sm text-blue-600">👤 Advance Collected By: {customer.advance_collected_by || 'GMC'}</div>
                                                        <div className="text-sm text-purple-600">🏷️ Discount Given By: {customer.discount_given_by || 'GMC'}</div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => handlePrintReceipt(customer)}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            🖨️ Receipt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCustomer(customer);
                                                                setShowEditCustomerForm(true);
                                                                setCustomerFormData({
                                                                    customer_id: customer.customer_id || '',
                                                                    customer_name: customer.customer_name || '',
                                                                    phone: customer.phone || '',
                                                                    location: customer.location || '',
                                                                    pickup_point: customer.pickup_point || '',
                                                                    customer_age: customer.age || '',
                                                                    customer_gender: customer.gender || 'Male',
                                                                    total_seats: customer.total_seats || 1,
                                                                    base_amount: customer.base_amount || 0,
                                                                    total_amount: customer.total_amount || 0,
                                                                    advance_amount: customer.advance_amount || '',
                                                                    balance_amount: customer.balance_amount || 0,
                                                                    advance_collected_by: customer.advance_collected_by || 'GMC',
                                                                    advance_collected_date: customer.advance_collected_date || '',
                                                                    referral_id: customer.referral_id || '',
                                                                    payment_mode: customer.payment_mode || 'Cash',
                                                                    remarks: customer.remarks || '',
                                                                    discount: customer.discount || '',
                                                                    discount_given_by: customer.discount_given_by || 'GMC',
                                                                });
                                                                setSelectedSeats(customer.seat_numbers || []);
                                                                setEditExtraExpensesList(customer.extra_expenses || []);
                                                            }}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCustomer(customer.id, customer.customer_name)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            🗑️ Remove
                                                        </button>
                                                        <button
                                                            onClick={() => viewCustomerHistory(customer.customer_id)}
                                                            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                                                        >
                                                            📜 History
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Customer History Modal */}
                            {showCustomerHistory && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className={`max-w-2xl w-full p-6 rounded-lg max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">📜 Customer History</h3>
                                            <button
                                                onClick={() => setShowCustomerHistory(null)}
                                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {showCustomerHistory.length === 0 ? (
                                            <p className="text-gray-500">No history found</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {showCustomerHistory.map((record, i) => (
                                                    <div key={i} className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                        <div className="font-semibold">{record.trip_name}</div>
                                                        <div className="text-sm">Date: {formatDate(record.created_at)}</div>
                                                        <div className="text-sm">Seats: {record.total_seats} · Amount: ₹{record.total_amount}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Edit Yatra Modal */}
                            {showEditYatraForm && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className={`max-w-md w-full p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">✏️ Edit Yatra</h3>
                                            <button
                                                onClick={() => { setShowEditYatraForm(false); setEditingYatra(null); }}
                                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <form onSubmit={handleUpdateYatra}>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Yatra Name</label>
                                                    <input
                                                        type="text"
                                                        name="yatra_name"
                                                        value={yatraFormData.yatra_name}
                                                        onChange={(e) => setYatraFormData({ ...yatraFormData, yatra_name: e.target.value })}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            name="start_date"
                                                            value={yatraFormData.start_date}
                                                            onChange={(e) => setYatraFormData({ ...yatraFormData, start_date: e.target.value })}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">End Date</label>
                                                        <input
                                                            type="date"
                                                            name="end_date"
                                                            value={yatraFormData.end_date}
                                                            onChange={(e) => setYatraFormData({ ...yatraFormData, end_date: e.target.value })}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Rate per Seat</label>
                                                        <input
                                                            type="number"
                                                            name="rate_per_seat"
                                                            value={yatraFormData.rate_per_seat}
                                                            onChange={(e) => setYatraFormData({ ...yatraFormData, rate_per_seat: e.target.value })}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                            step="100"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Total Seats</label>
                                                        <input
                                                            type="number"
                                                            name="total_seats"
                                                            value={yatraFormData.total_seats}
                                                            onChange={(e) => setYatraFormData({ ...yatraFormData, total_seats: e.target.value })}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Status</label>
                                                    <select
                                                        name="status"
                                                        value={yatraFormData.status}
                                                        onChange={(e) => setYatraFormData({ ...yatraFormData, status: e.target.value })}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {loading ? 'Updating...' : 'Update Yatra'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Edit Trip Form */}
                            {showEditTripForm && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className={`max-w-md w-full p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">✏️ Edit Trip</h3>
                                            <button
                                                onClick={() => { setShowEditTripForm(false); setEditingTrip(null); }}
                                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <form onSubmit={handleUpdateTrip}>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Trip Name</label>
                                                    <input
                                                        type="text"
                                                        name="trip_name"
                                                        value={tripFormData.trip_name}
                                                        onChange={handleTripInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            name="start_date"
                                                            value={tripFormData.start_date}
                                                            onChange={handleTripInputChange}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">End Date</label>
                                                        <input
                                                            type="date"
                                                            name="end_date"
                                                            value={tripFormData.end_date}
                                                            onChange={handleTripInputChange}
                                                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Total Seats</label>
                                                    <input
                                                        type="number"
                                                        name="total_seats"
                                                        value={tripFormData.total_seats}
                                                        onChange={handleTripInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        min="1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Status</label>
                                                    <select
                                                        name="status"
                                                        value={tripFormData.status}
                                                        onChange={handleTripInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="full">Full</option>
                                                    </select>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {loading ? 'Updating...' : 'Update Trip'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Edit Customer Form */}
                            {showEditCustomerForm && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className={`max-w-md w-full p-6 rounded-lg max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">✏️ Edit Customer</h3>
                                            <button
                                                onClick={() => { setShowEditCustomerForm(false); setEditingCustomer(null); }}
                                                className="text-red-500 hover:text-red-700 text-xl font-bold"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <form onSubmit={handleUpdateCustomer}>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                                                    <input
                                                        type="text"
                                                        name="customer_name"
                                                        value={customerFormData.customer_name}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                                    <input
                                                        type="text"
                                                        name="phone"
                                                        value={customerFormData.phone}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        required
                                                        maxLength="10"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Location</label>
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={customerFormData.location}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        placeholder="Delhi, Gurgaon, etc."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Pickup Point</label>
                                                    <select
                                                        name="pickup_point"
                                                        value={customerFormData.pickup_point}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="">Select Pickup Point</option>
                                                        {pickupOptions.map((point, index) => (
                                                            <option key={index} value={point}>{point}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Total Seats</label>
                                                    <input
                                                        type="number"
                                                        name="total_seats"
                                                        value={customerFormData.total_seats}
                                                        onChange={handleSeatsChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        min="1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Advance Amount</label>
                                                    <input
                                                        type="number"
                                                        name="advance_amount"
                                                        value={customerFormData.advance_amount}
                                                        onChange={handleAdvanceChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        step="100"
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Discount</label>
                                                    <input
                                                        type="number"
                                                        name="discount"
                                                        value={customerFormData.discount}
                                                        onChange={handleDiscountChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                        step="100"
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Balance</label>
                                                    <input
                                                        type="number"
                                                        name="balance_amount"
                                                        value={customerFormData.balance_amount}
                                                        className={`w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-600 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                                        readOnly
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Payment Mode</label>
                                                    <select
                                                        name="payment_mode"
                                                        value={customerFormData.payment_mode}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="UPI">UPI</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                        <option value="Card">Card</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Advance Collected By</label>
                                                    <select
                                                        name="advance_collected_by"
                                                        value={customerFormData.advance_collected_by || 'GMC'}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        {peopleOptions.map(person => (
                                                            <option key={person} value={person}>{person}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Discount Given By</label>
                                                    <select
                                                        name="discount_given_by"
                                                        value={customerFormData.discount_given_by || 'GMC'}
                                                        onChange={handleCustomerInputChange}
                                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        {peopleOptions.map(person => (
                                                            <option key={person} value={person}>{person}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {loading ? 'Updating...' : 'Update Customer'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`p-8 text-center rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <p className="text-xl text-gray-500">Select a trip to manage bookings</p>
                            <p className="text-sm text-gray-400 mt-2">Click on any trip from the left panel</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YatraBookingPage;
