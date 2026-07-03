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
            JOIN yatra_master ym ON yt.yatra_id = ym.id
            ORDER BY yt.id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching trips:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET SINGLE YATRA TRIP WITH CUSTOMERS AND SEATS
=========================
*/
router.get("/trips/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [tripRows] = await db.query(`
            SELECT yt.*, ym.yatra_name, ym.rate_per_seat
            FROM yatra_trips yt
            JOIN yatra_master ym ON yt.yatra_id = ym.id
            WHERE yt.id = ?
        `, [id]);

        if (tripRows.length === 0) {
            return res.status(404).json({ message: "Trip not found" });
        }

        const trip = tripRows[0];

        const [customers] = await db.query(`
            SELECT ytc.*,
            (SELECT COUNT(*) FROM yatra_trip_travelers WHERE yatra_trip_customer_id = ytc.id) as traveler_count
            FROM yatra_trip_customers ytc
            WHERE ytc.yatra_trip_id = ?
            ORDER BY ytc.id
        `, [id]);

        const customerIds = customers.map(c => c.id);

        let travelers = [];
        let extras = [];
        let seats = [];

        if (customerIds.length > 0) {
            [travelers] = await db.query(
                `SELECT * FROM yatra_trip_travelers
                 WHERE yatra_trip_customer_id IN (?)
                 ORDER BY yatra_trip_customer_id, id`,
                [customerIds]
            );

            [extras] = await db.query(
                `SELECT * FROM yatra_trip_customer_extras
                 WHERE yatra_trip_customer_id IN (?)
                 ORDER BY yatra_trip_customer_id, id`,
                [customerIds]
            );
        }

        [seats] = await db.query(
            `SELECT * FROM yatra_trip_seats
             WHERE yatra_trip_id = ?
             ORDER BY seat_number`,
            [id]
        );

        const customersWithData = customers.map(customer => {
            return {
                ...customer,
                travelers: travelers.filter(t => t.yatra_trip_customer_id === customer.id),
                extra_expenses: extras.filter(e => e.yatra_trip_customer_id === customer.id),
                seat_numbers: customer.seat_numbers ? customer.seat_numbers.split(',').map(Number) : []
            };
        });

        res.json({
            ...trip,
            customers: customersWithData,
            seats: seats || []
        });
    } catch (err) {
        console.error("Error fetching trip details:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE YATRA TRIP (with seats)
=========================
*/
router.post("/trips", async (req, res) => {
    const { yatra_id, trip_name, start_date, end_date, total_seats } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO yatra_trips (yatra_id, trip_name, start_date, end_date, total_seats)
             VALUES (?, ?, ?, ?, ?)`,
            [yatra_id, trip_name, start_date, end_date, total_seats]
        );

        const tripId = result.insertId;

        if (total_seats > 0) {
            const seatValues = [];
            for (let i = 1; i <= total_seats; i++) {
                seatValues.push([tripId, i]);
            }

            await db.query(
                `INSERT INTO yatra_trip_seats (yatra_trip_id, seat_number) VALUES ?`,
                [seatValues]
            );
        }

        res.status(201).json({
            success: true,
            id: tripId,
            message: "Trip created successfully with seats"
        });
    } catch (err) {
        console.error("Error creating trip:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE YATRA TRIP
=========================
*/
router.put("/trips/:id", async (req, res) => {
    const { id } = req.params;
    const { trip_name, start_date, end_date, total_seats, status } = req.body;

    try {
        const [existing] = await db.query(
            "SELECT total_seats FROM yatra_trips WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Trip not found" });
        }

        const oldSeats = existing[0].total_seats || 0;

        await db.query(
            `UPDATE yatra_trips
             SET trip_name = ?, start_date = ?, end_date = ?, total_seats = ?, status = ?
             WHERE id = ?`,
            [trip_name, start_date, end_date, total_seats, status || 'active', id]
        );

        if (total_seats > oldSeats) {
            const seatValues = [];
            for (let i = oldSeats + 1; i <= total_seats; i++) {
                seatValues.push([id, i]);
            }
            if (seatValues.length > 0) {
                await db.query(
                    `INSERT INTO yatra_trip_seats (yatra_trip_id, seat_number) VALUES ?`,
                    [seatValues]
                );
            }
        }

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
DELETE YATRA TRIP
=========================
*/
router.delete("/trips/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM yatra_trips WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Trip not found" });
        }

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
ADD CUSTOMER TO TRIP (with seat assignment)
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
        extra_expenses
    } = req.body;

    const assignedSeats = selected_seats || [];

    if (assignedSeats.length !== total_seats) {
        return res.status(400).json({
            error: `Please select exactly ${total_seats} seats`
        });
    }

    try {
        const seatNumbersStr = assignedSeats.join(',');

        const [result] = await db.query(
            `INSERT INTO yatra_trip_customers
             (yatra_trip_id, customer_id, customer_name, phone, location, pickup_point, total_seats, seat_numbers,
              base_amount, total_amount, advance_amount, balance_amount,
              advance_collected_by, advance_collected_date, referral_id,
              payment_mode, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tripId, customer_id || null, customer_name, phone, location || null, pickup_point || null,
                total_seats, seatNumbersStr,
                base_amount, total_amount, advance_amount, balance_amount,
                advance_collected_by, advance_collected_date || null, referral_id || null,
                payment_mode || 'Cash', remarks
            ]
        );

        const customerTripId = result.insertId;

        if (assignedSeats.length > 0) {
            for (const seatNum of assignedSeats) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = TRUE, customer_id = ?, customer_trip_id = ?, traveler_name = ?
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [customer_id || null, customerTripId, customer_name, tripId, seatNum]
                );
            }
        }

        if (extra_expenses && extra_expenses.length > 0) {
            const expenseValues = extra_expenses.map(e => [
                customerTripId,
                e.name,
                e.amount
            ]);
            await db.query(
                `INSERT INTO yatra_trip_customer_extras
                 (yatra_trip_customer_id, expense_name, expense_amount) VALUES ?`,
                [expenseValues]
            );
        }

        if (travelers && travelers.length > 0) {
            const travelerValues = travelers.map(t => [
                customerTripId,
                t.traveler_name,
                t.phone || phone || 'N/A',
                t.age || null,
                t.gender || 'Male',
                t.relation || 'Self'
            ]);
            await db.query(
                `INSERT INTO yatra_trip_travelers
                 (yatra_trip_customer_id, traveler_name, phone, age, gender, relation) VALUES ?`,
                [travelerValues]
            );
        }

        // Update booked_seats count in yatra_trips
        await db.query(
            `UPDATE yatra_trips SET booked_seats = booked_seats + ? WHERE id = ?`,
            [total_seats, tripId]
        );

        res.status(201).json({
            success: true,
            id: customerTripId,
            assignedSeats: assignedSeats,
            message: `Customer added successfully. Seats: ${assignedSeats.join(', ')}`
        });
    } catch (err) {
        console.error("Error adding customer:", err);
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
        extra_expenses
    } = req.body;

    try {
        const [existing] = await db.query(
            "SELECT total_seats, seat_numbers, customer_id FROM yatra_trip_customers WHERE id = ?",
            [customerTripId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const oldSeats = existing[0].total_seats || 0;
        const oldSeatNumbers = existing[0].seat_numbers ? existing[0].seat_numbers.split(',').map(Number) : [];
        const customerId = existing[0].customer_id;
        const seatDiff = total_seats - oldSeats;

        let finalSeatNumbers = oldSeatNumbers;

        if (seatDiff > 0) {
            // Need more seats - find available seats
            const [availableSeats] = await db.query(
                `SELECT seat_number FROM yatra_trip_seats
                 WHERE yatra_trip_id = ? AND is_booked = FALSE
                 ORDER BY seat_number LIMIT ?`,
                [tripId, seatDiff]
            );

            if (availableSeats.length < seatDiff) {
                return res.status(400).json({ error: "Not enough available seats" });
            }

            const newSeats = availableSeats.map(s => s.seat_number);
            finalSeatNumbers = [...oldSeatNumbers, ...newSeats];

            // Mark new seats as booked
            for (const seatNum of newSeats) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = TRUE, customer_id = ?, customer_trip_id = ?, traveler_name = ?
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [customerId || null, customerTripId, customer_name, tripId, seatNum]
                );
            }
        } else if (seatDiff < 0) {
            // Remove seats
            const seatsToRemove = oldSeatNumbers.slice(seatDiff);
            finalSeatNumbers = oldSeatNumbers.slice(0, oldSeatNumbers.length + seatDiff);

            for (const seatNum of seatsToRemove) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = FALSE, customer_id = NULL, customer_trip_id = NULL, traveler_name = NULL
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [tripId, seatNum]
                );
            }
        }

        const seatNumbersStr = finalSeatNumbers.join(',');

        // Update customer
        await db.query(
            `UPDATE yatra_trip_customers
             SET customer_name = ?, phone = ?, location = ?, pickup_point = ?,
                 total_seats = ?, seat_numbers = ?, base_amount = ?, total_amount = ?,
                 advance_amount = ?, balance_amount = ?, advance_collected_by = ?,
                 advance_collected_date = ?, referral_id = ?, payment_mode = ?, remarks = ?
             WHERE id = ? AND yatra_trip_id = ?`,
            [
                customer_name, phone, location || null, pickup_point || null,
                total_seats, seatNumbersStr,
                base_amount, total_amount, advance_amount, balance_amount,
                advance_collected_by, advance_collected_date || null, referral_id || null,
                payment_mode || 'Cash', remarks,
                customerTripId, tripId
            ]
        );

        // Update travelers
        await db.query(
            "DELETE FROM yatra_trip_travelers WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        await db.query(
            "DELETE FROM yatra_trip_customer_extras WHERE yatra_trip_customer_id = ?",
            [customerTripId]
        );

        if (extra_expenses && extra_expenses.length > 0) {
            const expenseValues = extra_expenses.map(e => [
                customerTripId,
                e.name,
                e.amount
            ]);
            await db.query(
                `INSERT INTO yatra_trip_customer_extras
                 (yatra_trip_customer_id, expense_name, expense_amount) VALUES ?`,
                [expenseValues]
            );
        }

        if (travelers && travelers.length > 0) {
            const travelerValues = travelers.map(t => [
                customerTripId,
                t.traveler_name,
                t.phone || phone || 'N/A',
                t.age || null,
                t.gender || 'Male',
                t.relation || 'Self'
            ]);
            await db.query(
                `INSERT INTO yatra_trip_travelers
                 (yatra_trip_customer_id, traveler_name, phone, age, gender, relation) VALUES ?`,
                [travelerValues]
            );
        }

        // Update booked_seats count in yatra_trips
        const seatDiffTotal = total_seats - oldSeats;
        if (seatDiffTotal !== 0) {
            await db.query(
                `UPDATE yatra_trips SET booked_seats = booked_seats + ? WHERE id = ?`,
                [seatDiffTotal, tripId]
            );
        }

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
        const [existing] = await db.query(
            "SELECT total_seats, seat_numbers FROM yatra_trip_customers WHERE id = ?",
            [customerTripId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const seatNumbers = existing[0].seat_numbers ? existing[0].seat_numbers.split(',').map(Number) : [];
        const totalSeats = existing[0].total_seats || 0;

        // Free up seats
        for (const seatNum of seatNumbers) {
            await db.query(
                `UPDATE yatra_trip_seats 
                 SET is_booked = FALSE, customer_id = NULL, customer_trip_id = NULL, traveler_name = NULL
                 WHERE yatra_trip_id = ? AND seat_number = ?`,
                [tripId, seatNum]
            );
        }

        await db.query(
            "DELETE FROM yatra_trip_customers WHERE id = ?",
            [customerTripId]
        );

        // Update booked_seats count
        await db.query(
            `UPDATE yatra_trips SET booked_seats = booked_seats - ? WHERE id = ?`,
            [totalSeats, tripId]
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
FIX EXISTING CUSTOMERS - ASSIGN SEAT NUMBERS
=========================
*/
router.post("/fix-seat-numbers/:tripId", async (req, res) => {
    const { tripId } = req.params;

    try {
        // Get all customers for this trip that don't have seat numbers
        const [customers] = await db.query(
            "SELECT id, customer_name, total_seats FROM yatra_trip_customers WHERE yatra_trip_id = ? AND (seat_numbers IS NULL OR seat_numbers = '')",
            [tripId]
        );

        if (customers.length === 0) {
            return res.json({ message: "No customers need fixing", fixed: 0 });
        }

        let fixed = 0;
        let seatIndex = 1;

        for (const customer of customers) {
            const totalSeats = customer.total_seats || 1;
            const seatNumbers = [];
            
            for (let i = 0; i < totalSeats; i++) {
                seatNumbers.push(seatIndex + i);
            }
            seatIndex += totalSeats;

            const seatNumbersStr = seatNumbers.join(',');

            await db.query(
                "UPDATE yatra_trip_customers SET seat_numbers = ? WHERE id = ?",
                [seatNumbersStr, customer.id]
            );

            // Mark seats as booked
            const seatNumArray = seatNumbers;
            for (const seatNum of seatNumArray) {
                await db.query(
                    `UPDATE yatra_trip_seats 
                     SET is_booked = TRUE, customer_id = NULL, customer_trip_id = ?, traveler_name = ?
                     WHERE yatra_trip_id = ? AND seat_number = ?`,
                    [customer.id, customer.customer_name, tripId, seatNum]
                );
            }

            fixed++;
        }

        res.json({
            success: true,
            message: `Fixed ${fixed} customers`,
            fixed: fixed
        });
    } catch (err) {
        console.error("Error fixing seat numbers:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
