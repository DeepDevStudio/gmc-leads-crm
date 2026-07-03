import React, { useState, useEffect } from 'react';
import axios from 'axios';

const YatraBookingPage = () => {
    const [yatras, setYatras] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
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

    // Form data for new trip
    const [tripFormData, setTripFormData] = useState({
        yatra_id: '',
        trip_name: '',
        start_date: '',
        end_date: '',
        total_seats: '',
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

    const loadData = async () => {
        try {
            const [yatrasRes, tripsRes, customersRes] = await Promise.all([
                axios.get('/api/yatras'),
                axios.get('/api/yatra-bookings/trips'),
                axios.get('/api/customers')
            ]);
            setYatras(yatrasRes.data || []);
            setTrips(tripsRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('Failed to load data', 'error');
        }
    };

    const loadPickupPoints = async () => {
        try {
            const response = await axios.get('/api/yatra-bookings/pickup-points');
            setPickupPoints(response.data || []);
        } catch (error) {
            console.error('Error loading pickup points:', error);
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
            const selectedYatra = yatras.find(y => y.id === parseInt(value));
            if (selectedYatra) {
                const startDate = selectedYatra.start_date ? new Date(selectedYatra.start_date).toISOString().split('T')[0] : '';
                const endDate = selectedYatra.end_date ? new Date(selectedYatra.end_date).toISOString().split('T')[0] : '';
                const dateStr = startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const tripName = dateStr ? `${selectedYatra.yatra_name} - ${dateStr}` : selectedYatra.yatra_name;
                
                setTripFormData(prev => ({
                    ...prev,
                    start_date: startDate,
                    end_date: endDate,
                    trip_name: tripName
                }));
            }
        }
    };

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/yatra-bookings/trips', tripFormData);
            showMessage('Trip created successfully!', 'success');
            setTripFormData({
                yatra_id: '',
                trip_name: '',
                start_date: '',
                end_date: '',
                total_seats: '',
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

    const handleEditTrip = (trip) => {
        setEditingTrip(trip);
        setTripFormData({
            yatra_id: trip.yatra_id,
            trip_name: trip.trip_name,
            start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '',
            end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : '',
            total_seats: trip.total_seats,
        });
        setShowEditTripForm(true);
    };

    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.put(`/api/yatra-bookings/trips/${editingTrip.id}`, tripFormData);
            showMessage('Trip updated successfully!', 'success');
            setShowEditTripForm(false);
            setEditingTrip(null);
            setTripFormData({
                yatra_id: '',
                trip_name: '',
                start_date: '',
                end_date: '',
                total_seats: '',
            });
            loadData();
        } catch (error) {
            console.error('Error updating trip:', error);
            showMessage('Failed to update trip', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (id, name) => {
        if (!window.confirm(`Delete trip "${name}"? This will remove all customers and travelers.`)) return;

        try {
            await axios.delete(`/api/yatra-bookings/trips/${id}`);
            showMessage('Trip deleted successfully!', 'success');
            if (selectedTrip?.id === id) {
                setSelectedTrip(null);
            }
            loadData();
        } catch (error) {
            console.error('Error deleting trip:', error);
            showMessage('Failed to delete trip', 'error');
        }
    };

    const handleSelectTrip = async (tripId) => {
        try {
            const response = await axios.get(`/api/yatra-bookings/trips/${tripId}`);
            setSelectedTrip(response.data);
            setShowAddCustomer(false);
            setSelectedSeats([]);
            setExtraExpensesList([]);
            setEditExtraExpensesList([]);
        } catch (error) {
            console.error('Error loading trip:', error);
            showMessage('Failed to load trip details', 'error');
        }
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setSearchPhone(phone);

        if (phone.length === 10) {
            const customer = customers.find(c => c.mobile_number === phone);
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

    // Extra Expenses Functions
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
                <div className="text-center text-gray-500 py-8">
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
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-600"></div>
                        <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-400 border border-red-600"></div>
                        <span className="text-gray-600">Booked</span>
                    </div>
                </div>

                <div className="bg-gray-100 rounded-2xl p-4 border-2 border-gray-300">
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                            🚗 DRIVER
                        </div>
                        {hasOddLastRow && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 mr-1">Last Seat:</span>
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

                                    <div className="w-4 h-12 bg-gray-200 rounded border border-gray-300"></div>

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

                                    <div className="text-xs text-gray-400 w-8 text-center">
                                        Row {rowIndex + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center mt-4">
                    {selectedSeats.length === 0 && (
                        <p className="text-sm text-gray-500">
                            💡 Click on available seats to select them
                        </p>
                    )}
                    {selectedSeats.length > 0 && selectedSeats.length < getTotalSeats() && (
                        <p className="text-sm text-yellow-600 font-medium">
                            ⚠️ Selected {selectedSeats.length} of {getTotalSeats()} seats needed
                        </p>
                    )}
                    {selectedSeats.length === getTotalSeats() && (
                        <p className="text-sm text-green-600 font-medium">
                            ✅ All {getTotalSeats()} seats selected! Seats: {selectedSeats.join(', ')}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // ===== HANDLE ADD CUSTOMER =====
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

            let customerId = customerFormData.customer_id;
            if (isNewCustomer && !customerId) {
                const customerRes = await axios.post('/api/customers', {
                    customer_name: customerFormData.customer_name || 'Unknown',
                    mobile_number: customerFormData.phone,
                    interests: '',
                    location_type: customerFormData.location || 'Delhi NCR'
                });
                customerId = customerRes.data.id;
                const customersRes = await axios.get('/api/customers');
                setCustomers(customersRes.data || []);
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
                extra_expenses: extraExpensesList,
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
            };

            await axios.post(`/api/yatra-bookings/trips/${selectedTrip.id}/customers`, payload);
            
            // Refresh trip data to show seat numbers
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

    // ===== HANDLE EDIT CUSTOMER =====
    const handleEditCustomer = (customer) => {
        const selfTraveler = customer.travelers?.find(t => t.relation === 'Self') || {};
        const otherTravelers = customer.travelers?.filter(t => t.relation !== 'Self') || [];

        const currentSeats = customer.seat_numbers || [];

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

    // ===== HANDLE UPDATE CUSTOMER =====
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
                    name: e.name,
                    amount: e.amount
                })),
                discount: discountAmount,
                discount_given_by: customerFormData.discount_given_by || 'GMC',
            };

            await axios.put(`/api/yatra-bookings/trips/${selectedTrip.id}/customers/${editingCustomer.id}`, payload);
            
            // Refresh trip data to show seat numbers
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
            await axios.delete(`/api/yatra-bookings/trips/${selectedTrip.id}/customers/${customerTripId}`);
            showMessage('Customer removed successfully!', 'success');
            handleSelectTrip(selectedTrip.id);
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">📋 Yatra Bookings</h1>
                    <p className="text-gray-500">Manage yatra trips and add customers with travelers</p>
                </div>
                <button
                    onClick={() => setShowTripForm(!showTripForm)}
                    className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg font-semibold transition"
                >
                    {showTripForm ? 'Cancel' : '+ New Trip'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Create Trip Form */}
            {showTripForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Create New Yatra Trip</h2>
                    <form onSubmit={handleCreateTrip}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Yatra *</label>
                                <select
                                    name="yatra_id"
                                    value={tripFormData.yatra_id}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                >
                                    <option value="">Select Yatra</option>
                                    {yatras
                                        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                                        .map((yatra) => (
                                            <option key={yatra.id} value={yatra.id}>
                                                {yatra.yatra_name} - {formatDate(yatra.start_date)} (₹{yatra.rate_per_seat})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name *</label>
                                <input
                                    type="text"
                                    name="trip_name"
                                    value={tripFormData.trip_name}
                                    onChange={handleTripInputChange}
                                    placeholder="Trip Name"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={tripFormData.start_date}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={tripFormData.end_date}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats *</label>
                                <input
                                    type="number"
                                    name="total_seats"
                                    value={tripFormData.total_seats}
                                    onChange={handleTripInputChange}
                                    placeholder="Total Seats"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Trip'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTripForm(false)}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Trip Form */}
            {showEditTripForm && editingTrip && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-yellow-400">
                    <h2 className="text-xl font-semibold mb-4">✏️ Edit Trip</h2>
                    <form onSubmit={handleUpdateTrip}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name *</label>
                                <input
                                    type="text"
                                    name="trip_name"
                                    value={tripFormData.trip_name}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={tripFormData.start_date}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={tripFormData.end_date}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats *</label>
                                <input
                                    type="number"
                                    name="total_seats"
                                    value={tripFormData.total_seats}
                                    onChange={handleTripInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Trip'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditTripForm(false);
                                    setEditingTrip(null);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px] relative">
                    <input
                        type="text"
                        placeholder="🔍 Search trips..."
                        value={searchTrip}
                        onChange={(e) => setSearchTrip(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 p-2 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                    <option value="All">All Trips</option>
                    <option value="Empty">Empty</option>
                    <option value="Partial">Partial</option>
                    <option value="Full">Full</option>
                </select>
            </div>

            {/* Trips List */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {trips
                    .filter(trip => {
                        if (searchTrip && !trip.trip_name?.toLowerCase().includes(searchTrip.toLowerCase())) {
                            return false;
                        }
                        if (filterStatus !== 'All') {
                            const status = getTripStatus(trip);
                            if (status !== filterStatus) return false;
                        }
                        return true;
                    })
                    .map((trip) => {
                        const status = getTripStatus(trip);
                        const statusColors = {
                            'Full': 'bg-red-100 text-red-700',
                            'Partial': 'bg-yellow-100 text-yellow-700',
                            'Empty': 'bg-green-100 text-green-700'
                        };
                        const tripRevenue = trip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0;
                        
                        return (
                            <div
                                key={trip.id}
                                className={`bg-white rounded-xl shadow border p-4 hover:shadow-lg transition ${selectedTrip?.id === trip.id ? 'border-yellow-400 border-2' : ''}`}
                            >
                                <div onClick={() => handleSelectTrip(trip.id)} className="cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-800 flex-1">{trip.trip_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-sm">Seats: <strong>{trip.booked_seats || 0}/{trip.total_seats}</strong></span>
                                        <span className="text-sm">Customers: <strong>{trip.customers?.length || 0}</strong></span>
                                    </div>
                                    {tripRevenue > 0 && (
                                        <div className="mt-1 text-sm text-green-600 font-medium">
                                            Revenue: ₹{tripRevenue.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEditTrip(trip)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTrip(trip.id, trip.trip_name)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
                                    >
                                        🗑️ Delete
                                    </button>
                                    {trip.customers?.length > 0 && (
                                        <button
                                            onClick={() => exportTripCustomers(trip)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition"
                                        >
                                            📥 Export
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                {trips.length === 0 && (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                        No trips created yet. Click "+ New Trip" to create one.
                    </div>
                )}
            </div>

            {/* Selected Trip Details */}
            {selectedTrip && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedTrip.trip_name}</h2>
                            <p className="text-gray-500">
                                {formatDate(selectedTrip.start_date)} - {formatDate(selectedTrip.end_date)}
                                {' • '}
                                Seats: {selectedTrip.booked_seats || 0}/{selectedTrip.total_seats}
                                {' • '}
                                Rate: ₹{selectedTrip.rate_per_seat}/seat
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddCustomer(!showAddCustomer)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                        >
                            {showAddCustomer ? 'Cancel' : '+ Add Customer'}
                        </button>
                    </div>

                    {/* Edit Customer Form */}
                    {showEditCustomerForm && editingCustomer && (
                        <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-300">
                            <h3 className="font-semibold mb-3">✏️ Edit Customer</h3>
                            <form onSubmit={handleUpdateCustomer}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={customerFormData.customer_name}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={customerFormData.phone}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={customerFormData.location}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Delhi, Gurgaon, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point</label>
                                        <select
                                            name="pickup_point"
                                            value={customerFormData.pickup_point}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                                        <input
                                            type="number"
                                            name="advance_amount"
                                            value={customerFormData.advance_amount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter advance amount"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                                        <select
                                            name="advance_collected_by"
                                            value={customerFormData.advance_collected_by}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Sanjeev">Sanjeev</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="GMC">GMC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Collected Date</label>
                                        <input
                                            type="date"
                                            name="advance_collected_date"
                                            value={customerFormData.advance_collected_date}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral ID</label>
                                        <input
                                            type="text"
                                            name="referral_id"
                                            value={customerFormData.referral_id}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Referral ID (optional)"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={customerFormData.discount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter discount amount"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Given By</label>
                                        <select
                                            name="discount_given_by"
                                            value={customerFormData.discount_given_by}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="GMC">GMC</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="Sanjeev">Sanjeev</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={customerFormData.remarks}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Any special notes..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Extra Expenses</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Expense name (e.g., Extra Bed)"
                                                value={editNewExpenseName}
                                                onChange={(e) => setEditNewExpenseName(e.target.value)}
                                                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={editNewExpenseAmount}
                                                onChange={(e) => setEditNewExpenseAmount(e.target.value)}
                                                className="w-32 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                            <div className="bg-white rounded-lg border p-2">
                                                {editExtraExpensesList.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center border-b py-1 last:border-b-0">
                                                        <span className="text-sm">{item.name}: ₹{item.amount}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditExtraExpense(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="text-sm font-bold text-right mt-1 border-t pt-1">
                                                    Total Extra: ₹{getEditTotalExtraExpenses()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Travelers</label>
                                                <p className="text-xs text-gray-400">Total Seats: <strong>{1 + travelers.length}</strong> (1 Self + {travelers.length} additional)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addEditTraveler}
                                                className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                + Add Traveler
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">SELF</span>
                                                <span className="text-sm font-medium text-gray-700">Customer: {customerFormData.customer_name || 'Not set'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500">Name</label>
                                                    <input
                                                        type="text"
                                                        value={customerFormData.customer_name || ''}
                                                        className="w-full p-1.5 border rounded text-sm bg-gray-50"
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={customerFormData.customer_age}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_age: e.target.value })}
                                                        className="w-full p-1.5 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Gender</label>
                                                    <select
                                                        value={customerFormData.customer_gender}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_gender: e.target.value })}
                                                        className="w-full p-1.5 border rounded text-sm"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {travelers.map((traveler, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 bg-white rounded-lg border mb-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500">Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={traveler.traveler_name}
                                                        onChange={(e) => updateEditTraveler(index, 'traveler_name', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Phone</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        value={traveler.phone}
                                                        onChange={(e) => updateEditTraveler(index, 'phone', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={traveler.age}
                                                        onChange={(e) => updateEditTraveler(index, 'age', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Gender</label>
                                                    <select
                                                        value={traveler.gender}
                                                        onChange={(e) => updateEditTraveler(index, 'gender', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500">Relation</label>
                                                        <select
                                                            value={traveler.relation}
                                                            onChange={(e) => updateEditTraveler(index, 'relation', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🪑 Select Seats (Choose {1 + travelers.length} seats)
                                        </label>
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            {selectedTrip?.seats && selectedTrip.seats.length > 0 ? (
                                                renderSeats(selectedTrip.seats, true, editingCustomer?.id)
                                            ) : (
                                                <p className="text-gray-500 text-sm text-center py-4">
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
                                        className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Add Customer Form */}
                    {showAddCustomer && !showEditCustomerForm && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
                            <h3 className="font-semibold mb-3">Add Customer to Trip</h3>
                            <form onSubmit={handleAddCustomer}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 10-digit phone"
                                            value={searchPhone}
                                            onChange={handlePhoneChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            maxLength="10"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={customerFormData.customer_name}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    {foundCustomer && (
                                        <div className="md:col-span-2 bg-green-50 p-2 rounded-lg border border-green-200">
                                            <p className="text-green-700 font-semibold">✅ Found: {foundCustomer.customer_name || 'Unknown'}</p>
                                        </div>
                                    )}
                                    {isNewCustomer && (
                                        <div className="md:col-span-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                                            <p className="text-yellow-700">⚠️ New Customer - Will be added to customers list</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={customerFormData.location}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Delhi, Gurgaon, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point</label>
                                        <select
                                            name="pickup_point"
                                            value={customerFormData.pickup_point}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="advance_amount"
                                            value={customerFormData.advance_amount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter advance amount"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                                        <select
                                            name="advance_collected_by"
                                            value={customerFormData.advance_collected_by}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Sanjeev">Sanjeev</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="GMC">GMC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Collected Date</label>
                                        <input
                                            type="date"
                                            name="advance_collected_date"
                                            value={customerFormData.advance_collected_date}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral ID</label>
                                        <input
                                            type="text"
                                            name="referral_id"
                                            value={customerFormData.referral_id}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Referral ID (optional)"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={customerFormData.discount}
                                            onChange={handleCustomerInputChange}
                                            placeholder="Enter discount amount"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Given By</label>
                                        <select
                                            name="discount_given_by"
                                            value={customerFormData.discount_given_by}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="GMC">GMC</option>
                                            <option value="Rajeev">Rajeev</option>
                                            <option value="Sanjeev">Sanjeev</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Extra Expenses</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Expense name (e.g., Extra Bed)"
                                                value={newExpenseName}
                                                onChange={(e) => setNewExpenseName(e.target.value)}
                                                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newExpenseAmount}
                                                onChange={(e) => setNewExpenseAmount(e.target.value)}
                                                className="w-32 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                            <div className="bg-white rounded-lg border p-2">
                                                {extraExpensesList.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center border-b py-1 last:border-b-0">
                                                        <span className="text-sm">{item.name}: ₹{item.amount}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExtraExpense(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="text-sm font-bold text-right mt-1 border-t pt-1">
                                                    Total Extra: ₹{getTotalExtraExpenses()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            name="remarks"
                                            value={customerFormData.remarks}
                                            onChange={handleCustomerInputChange}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Any special notes..."
                                        />
                                    </div>

                                    {/* Travelers */}
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Travelers</label>
                                                <p className="text-xs text-gray-400">Total Seats: <strong>{getTotalSeats()}</strong> (1 Self + {travelers.length} additional)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addTraveler}
                                                className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                            >
                                                + Add Traveler
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">SELF</span>
                                                <span className="text-sm font-medium text-gray-700">Customer: {customerFormData.customer_name || 'Not set'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500">Name</label>
                                                    <input
                                                        type="text"
                                                        value={customerFormData.customer_name || ''}
                                                        className="w-full p-1.5 border rounded text-sm bg-gray-50"
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={customerFormData.customer_age}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_age: e.target.value })}
                                                        className="w-full p-1.5 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Gender</label>
                                                    <select
                                                        value={customerFormData.customer_gender}
                                                        onChange={(e) => setCustomerFormData({ ...customerFormData, customer_gender: e.target.value })}
                                                        className="w-full p-1.5 border rounded text-sm"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {travelers.map((traveler, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 bg-white rounded-lg border mb-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500">Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={traveler.traveler_name}
                                                        onChange={(e) => updateTraveler(index, 'traveler_name', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Phone</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Phone"
                                                        value={traveler.phone}
                                                        onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Age</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={traveler.age}
                                                        onChange={(e) => updateTraveler(index, 'age', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500">Gender</label>
                                                    <select
                                                        value={traveler.gender}
                                                        onChange={(e) => updateTraveler(index, 'gender', e.target.value)}
                                                        className="w-full p-1 border rounded text-sm"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500">Relation</label>
                                                        <select
                                                            value={traveler.relation}
                                                            onChange={(e) => updateTraveler(index, 'relation', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🪑 Select Seats (Choose {getTotalSeats()} seats)
                                        </label>
                                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                            {selectedTrip?.seats && selectedTrip.seats.length > 0 ? (
                                                renderSeats(selectedTrip.seats, false)
                                            ) : (
                                                <p className="text-gray-500 text-sm text-center py-4">
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
                                        className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Customers List - Now with Seat Numbers */}
                    <div className="mt-4">
                        <h3 className="font-semibold mb-3">Customers ({selectedTrip.customers?.length || 0})</h3>
                        {selectedTrip.customers?.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No customers added yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">#</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Customer</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Phone</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Location</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Pickup</th>
                                            <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Seats</th>
                                            <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Seat Numbers</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Travelers</th>
                                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-600">Advance</th>
                                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-600">Discount</th>
                                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-600">Balance</th>
                                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Referral</th>
                                            <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedTrip.customers.map((customer, index) => {
                                            return (
                                                <tr key={customer.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-800 font-medium">{customer.customer_name}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{customer.phone}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{customer.location || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{customer.pickup_point || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-center text-gray-600 font-bold">{customer.total_seats}</td>
                                                    <td className="px-3 py-2 text-sm text-center text-gray-600">
                                                        {customer.seat_numbers && customer.seat_numbers.length > 0 ? (
                                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                                                {customer.seat_numbers.join(', ')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                        {customer.travelers?.map((t, i) => (
                                                            <div key={i} className="text-xs border-b border-gray-100 py-0.5">
                                                                {t.traveler_name} ({t.relation}, {t.gender}, {t.age || 'N/A'} yrs) - {t.phone || 'N/A'}
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-right font-bold">
                                                        ₹{(parseFloat(customer.total_amount) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-right text-green-600">
                                                        ₹{(parseFloat(customer.advance_amount) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-right text-blue-600">
                                                        ₹{(parseFloat(customer.discount) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-right text-red-600">
                                                        ₹{(parseFloat(customer.balance_amount) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{customer.referral_id || '-'}</td>
                                                    <td className="px-3 py-2 text-sm text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            <button
                                                                onClick={() => handleEditCustomer(customer)}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveCustomer(customer.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-yellow-50 border-t-2 border-yellow-400">
                                        <tr>
                                            <td colSpan="5" className="px-3 py-2 text-right font-bold">TOTALS:</td>
                                            <td className="px-3 py-2 text-center font-bold">
                                                {selectedTrip.customers?.reduce((sum, c) => sum + (c.total_seats || 0), 0) || 0}
                                            </td>
                                            <td className="px-3 py-2"></td>
                                            <td className="px-3 py-2"></td>
                                            <td className="px-3 py-2 text-right font-bold text-purple-600">
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-green-600">
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.advance_amount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-blue-600">
                                                ₹{(selectedTrip.customers?.reduce((sum, c) => sum + (parseFloat(c.discount) || 0), 0) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-red-600">
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
