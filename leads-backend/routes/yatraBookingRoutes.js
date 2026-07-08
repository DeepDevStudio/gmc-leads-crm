const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET PICKUP POINTS
=========================
*/
router.get("/pickup-points", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM pickup_points WHERE is_active = TRUE ORDER BY location, point_name"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching pickup points:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET ALL YATRA TRIPS
=========================
*/
router.get("/trips", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT yt.*, ym.yatra_name, ym.rate_per_seat
            FROM yatra_trips yt
            LEFT JOIN yatra_master ym ON yt.yatra_id = ym.id
            ORDER BY yt.start_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching trips:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET SINGLE TRIP WITH CUSTOMERS AND SEATS
=========================
*/
router.get("/trips/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Get trip details
        const [tripRows] = await db.query(`
            SELECT yt.*, ym.yatra_name, ym.rate_per_seat
            FROM yatra_trips yt
            LEFT JOIN yatra_master ym ON yt.yatra_id = ym.id
            WHERE yt.id = ?
        `, [id]);

        if (tripRows.length === 0) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Get customers with travelers and extras
        const [customerRows] = await db.query(`
            SELECT 
                ytc.*,
                GROUP_CONCAT(DISTINCT CONCAT(
                    ytt.traveler_name, '|', 
                    ytt.phone, '|', 
                    ytt.age, '|', 
                    ytt.gender, '|', 
                    ytt.relation
                )) as travelers_raw,
                GROUP_CONCAT(DISTINCT CONCAT(
                    ytce.expense_name, '|', 
                    ytce.expense_amount
                )) as extras_raw
            FROM yatra_trip_customers ytc
            LEFT JOIN yatra_trip_travelers ytt ON ytc.id = ytt.yatra_trip_customer_id
            LEFT JOIN yatra_trip_customer_extras ytce ON ytc.id = ytce.yatra_trip_customer_id
            WHERE ytc.yatra_trip_id = ?
            GROUP BY ytc.id
        `, [id]);

        // Parse travelers and extras
        const customers = customerRows.map(customer => {
            const travelers = customer.travelers_raw ? customer.travelers_raw.split(',').map(t => {
                const parts = t.split('|');
                return {
                    traveler_name: parts[0] || '',
                    phone: parts[1] || '',
                    age: parts[2] || null,
                    gender: parts[3] || 'Male',
                    relation: parts[4] || 'Self'
                };
            }) : [];

            const extra_expenses = customer.extras_raw ? customer.extras_raw.split(',').map(e => {
                const parts = e.split('|');
                return {
                    expense_name: parts[0] || '',
                    expense_amount: parseFloat(parts[1]) || 0
                };
            }) : [];

            return {
                ...customer,
                travelers: travelers,
                extra_expenses: extra_expenses,
                seat_numbers: customer.seat_numbers ? customer.seat_numbers.split(',').map(s => parseInt(s.trim())) : []
            };
        });

        // Get seats for this trip
        const [seatRows] = await db.query(`
            SELECT 
                s.seat_number,
                s.is_booked,
                s.customer_trip_id,
                c.customer_name
            FROM yatra_trip_seats s
            LEFT JOIN yatra_trip_customers c ON s.customer_trip_id = c.id
            WHERE s.yatra_trip_id = ?
            ORDER BY s.seat_number
        `, [id]);

        const trip = {
            ...tripRows[0],
            customers: customers || [],
            seats: seatRows || []
        };

        res.json(trip);
    } catch (err) {
        console.error("Error fetching trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE TRIP
=========================
*/
router.post("/trips", async (req, res) => {
    const { yatra_id, trip_name, start_date, end_date, total_seats, status } = req.body;

    if (!yatra_id || !trip_name || !start_date || !end_date || !total_seats) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO yatra_trips 
             (yatra_id, trip_name, start_date, end_date, total_seats, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [yatra_id, trip_name, start_date, end_date, total_seats, status || 'active']
        );

        const tripId = result.insertId;

        // Create seats
        const seatValues = [];
        for (let i = 1; i <= total_seats; i++) {
            seatValues.push(`(${tripId}, ${i}, 0, NULL)`);
        }
        
        await db.query(
            `INSERT INTO yatra_trip_seats (yatra_trip_id, seat_number, is_booked, customer_trip_id) VALUES ${seatValues.join(', ')}`
        );

        res.status(201).json({
            success: true,
            id: tripId,
            message: "Trip created successfully"
        });
    } catch (err) {
        console.error("Error creating trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE TRIP
=========================
*/
router.put("/trips/:id", async (req, res) => {
    const { id } = req.params;
    const { trip_name, start_date, end_date, total_seats, status } = req.body;

    try {
        await db.query(
            `UPDATE yatra_trips
             SET trip_name = ?, start_date = ?, end_date = ?, total_seats = ?, status = ?
             WHERE id = ?`,
            [trip_name, start_date, end_date, total_seats, status || 'active', id]
        );

        res.json({
            success: true,
            message: "Trip updated successfully"
        });
    } catch (err) {
        console.error("Error updating trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE TRIP
=========================
*/
router.delete("/trips/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM yatra_trip_customer_extras WHERE yatra_trip_customer_id IN (SELECT id FROM yatra_trip_customers WHERE yatra_trip_id = ?)", [id]);
        await db.query("DELETE FROM yatra_trip_travelers WHERE yatra_trip_customer_id IN (SELECT id FROM yatra_trip_customers WHERE yatra_trip_id = ?)", [id]);
        await db.query("DELETE FROM yatra_trip_seats WHERE yatra_trip_id = ?", [id]);
        await db.query("DELETE FROM yatra_trip_customers WHERE yatra_trip_id = ?", [id]);
        await db.query("DELETE FROM yatra_trips WHERE id = ?", [id]);

        res.json({
            success: true,
            message: "Trip deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
ADD CUSTOMER TO TRIP
=========================
*/
router.post("/trips/:tripId/customers", async (req, res) => {
    const { tripId } = req.params;
    const {
        customer_id,
        customer_name,
        phone,
        location,
        pickup_point,
        total_seats,
        selected_seats,
        base_amount,
        total_amount,
        advance_amount,
        balance_amount,
        advance_collected_by,
        advance_collected_date,
        referral_id,
        payment_mode,
        remarks,
        travelers,
        extra_expenses,
        discount,
        discount_given_by
    } = req.body;

    try {
        // Insert customer into trip
        const seatNumbersStr = selected_seats ? selected_seats.join(',') : '';
        
        const [result] = await db.query(
            `INSERT INTO yatra_trip_customers 
             (yatra_trip_id, customer_id, customer_name, phone, location, pickup_point, 
              total_seats, seat_numbers, base_amount, total_amount, advance_amount, balance_amount,
              advance_collected_by, advance_collected_date, referral_id, payment_mode, remarks, discount, discount_given_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tripId, customer_id, customer_name, phone, location, pickup_point,
             total_seats, seatNumbersStr, base_amount, total_amount, advance_amount, balance_amount,
             advance_collected_by, advance_collected_date, referral_id, payment_mode, remarks, discount, discount_given_by]
        );

        const customerTripId = result.insertId;

        // Insert travelers
        if (travelers && travelers.length > 0) {
            for (const traveler of travelers) {
                await db.query(
                    `INSERT INTO yatra_trip_travelers 
                     (yatra_trip_customer_id, traveler_name, phone, age, gender, relation)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [customerTripId, traveler.traveler_name, traveler.phone, 
                     traveler.age, traveler.gender, traveler.relation]
                );
            }
        }

        // Insert extra expenses
        if (extra_expenses && extra_expenses.length > 0) {
            for (const expense of extra_expenses) {
                await db.query(
                    `INSERT INTO yatra_trip_customer_extras 
                     (yatra_trip_customer_id, expense_name, expense_amount)
                     VALUES (?, ?, ?)`,
                    [customerTripId, expense.expense_name, expense.expense_amount]
                );
            }
        }

        // Update seats
        if (selected_seats && selected_seats.length > 0) {
            for (const seatNumber of selected_seats) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = 1, customer_trip_id = ? 
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [customerTripId, tripId, seatNumber]
                );
            }
        }

        // Update booked seats count
        await db.query(
            `UPDATE yatra_trips 
             SET booked_seats = (
                 SELECT COUNT(*) FROM yatra_trip_seats 
                 WHERE yatra_trip_id = ? AND is_booked = 1
             )
             WHERE id = ?`,
            [tripId, tripId]
        );

        res.status(201).json({
            success: true,
            id: customerTripId,
            message: "Customer added to trip successfully"
        });
    } catch (err) {
        console.error("Error adding customer to trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE CUSTOMER IN TRIP
=========================
*/
router.put("/trips/:tripId/customers/:customerTripId", async (req, res) => {
    const { tripId, customerTripId } = req.params;
    const {
        customer_name,
        phone,
        location,
        pickup_point,
        total_seats,
        selected_seats,
        base_amount,
        total_amount,
        advance_amount,
        balance_amount,
        advance_collected_by,
        advance_collected_date,
        referral_id,
        payment_mode,
        remarks,
        travelers,
        extra_expenses,
        discount,
        discount_given_by
    } = req.body;

    try {
        const seatNumbersStr = selected_seats ? selected_seats.join(',') : '';

        // Update customer
        await db.query(
            `UPDATE yatra_trip_customers SET
                customer_name = ?,
                phone = ?,
                location = ?,
                pickup_point = ?,
                total_seats = ?,
                seat_numbers = ?,
                base_amount = ?,
                total_amount = ?,
                advance_amount = ?,
                balance_amount = ?,
                advance_collected_by = ?,
                advance_collected_date = ?,
                referral_id = ?,
                payment_mode = ?,
                remarks = ?,
                discount = ?,
                discount_given_by = ?
             WHERE id = ? AND yatra_trip_id = ?`,
            [customer_name, phone, location, pickup_point, total_seats, seatNumbersStr,
             base_amount, total_amount, advance_amount, balance_amount,
             advance_collected_by, advance_collected_date, referral_id,
             payment_mode, remarks, discount, discount_given_by,
             customerTripId, tripId]
        );

        // Delete existing travelers
        await db.query(
            "DELETE FROM yatra_trip_travelers WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        // Insert new travelers
        if (travelers && travelers.length > 0) {
            for (const traveler of travelers) {
                await db.query(
                    `INSERT INTO yatra_trip_travelers 
                     (yatra_trip_customer_id, traveler_name, phone, age, gender, relation)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [customerTripId, traveler.traveler_name, traveler.phone, 
                     traveler.age, traveler.gender, traveler.relation]
                );
            }
        }

        // Delete existing extra expenses
        await db.query(
            "DELETE FROM yatra_trip_customer_extras WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        // Insert new extra expenses
        if (extra_expenses && extra_expenses.length > 0) {
            for (const expense of extra_expenses) {
                await db.query(
                    `INSERT INTO yatra_trip_customer_extras 
                     (yatra_trip_customer_id, expense_name, expense_amount)
                     VALUES (?, ?, ?)`,
                    [customerTripId, expense.expense_name, expense.expense_amount]
                );
            }
        }

        // Free up old seats
        await db.query(
            `UPDATE yatra_trip_seats 
             SET is_booked = 0, customer_trip_id = NULL 
             WHERE customer_trip_id = ? AND yatra_trip_id = ?`,
            [customerTripId, tripId]
        );

        // Assign new seats
        if (selected_seats && selected_seats.length > 0) {
            for (const seatNumber of selected_seats) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = 1, customer_trip_id = ? 
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [customerTripId, tripId, seatNumber]
                );
            }
        }

        // Update booked seats count
        await db.query(
            `UPDATE yatra_trips 
             SET booked_seats = (
                 SELECT COUNT(*) FROM yatra_trip_seats 
                 WHERE yatra_trip_id = ? AND is_booked = 1
             )
             WHERE id = ?`,
            [tripId, tripId]
        );

        res.json({
            success: true,
            message: "Customer updated successfully"
        });
    } catch (err) {
        console.error("Error updating customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
REMOVE CUSTOMER FROM TRIP
=========================
*/
router.delete("/trips/:tripId/customers/:customerTripId", async (req, res) => {
    const { tripId, customerTripId } = req.params;

    try {
        // Free up seats
        await db.query(
            `UPDATE yatra_trip_seats 
             SET is_booked = 0, customer_trip_id = NULL 
             WHERE customer_trip_id = ? AND yatra_trip_id = ?`,
            [customerTripId, tripId]
        );

        // Delete travelers
        await db.query(
            "DELETE FROM yatra_trip_travelers WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        // Delete extra expenses
        await db.query(
            "DELETE FROM yatra_trip_customer_extras WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        // Delete customer
        await db.query(
            "DELETE FROM yatra_trip_customers WHERE id = ? AND yatra_trip_id = ?",
            [customerTripId, tripId]
        );

        // Update booked seats count
        await db.query(
            `UPDATE yatra_trips 
             SET booked_seats = (
                 SELECT COUNT(*) FROM yatra_trip_seats 
                 WHERE yatra_trip_id = ? AND is_booked = 1
             )
             WHERE id = ?`,
            [tripId, tripId]
        );

        res.json({
            success: true,
            message: "Customer removed from trip successfully"
        });
    } catch (err) {
        console.error("Error removing customer:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET CUSTOMER BOOKING HISTORY
=========================
*/
router.get("/customer-history/:customerId", async (req, res) => {
    const { customerId } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT 
                ytc.*,
                yt.trip_name,
                yt.start_date,
                yt.end_date,
                yt.status as trip_status,
                ym.yatra_name
            FROM yatra_trip_customers ytc
            LEFT JOIN yatra_trips yt ON ytc.yatra_trip_id = yt.id
            LEFT JOIN yatra_master ym ON yt.yatra_id = ym.id
            WHERE ytc.customer_id = ?
            ORDER BY yt.start_date DESC
        `, [customerId]);

        // Parse seat numbers for each booking
        const history = rows.map(row => ({
            ...row,
            seat_numbers: row.seat_numbers ? row.seat_numbers.split(',').map(s => parseInt(s.trim())) : []
        }));

        res.json(history);
    } catch (err) {
        console.error("Error fetching customer history:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
