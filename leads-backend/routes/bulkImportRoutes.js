const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
CHECK DUPLICATE PHONE NUMBERS
=========================
*/
router.post("/check-duplicates", async (req, res) => {
    const { phones } = req.body;

    if (!phones || phones.length === 0) {
        return res.json({ duplicates: [] });
    }

    try {
        const placeholders = phones.map(() => "?").join(",");
        const [results] = await db.query(
            `SELECT mobile_number FROM customers WHERE mobile_number IN (${placeholders})`,
            phones
        );
        const existingPhones = results.map(r => r.mobile_number);
        res.json({ duplicates: existingPhones });
    } catch (err) {
        console.error("Error checking duplicates:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
BULK IMPORT CUSTOMERS (with Chunking)
=========================
*/
router.post("/", async (req, res) => {
    const { customers, skipDuplicates } = req.body;

    if (!customers || customers.length === 0) {
        return res.status(400).json({ error: "No customers to import" });
    }

    const CHUNK_SIZE = 500;
    let insertedCount = 0;
    let skippedCount = 0;
    let errors = [];

    try {
        // Process in chunks
        for (let i = 0; i < customers.length; i += CHUNK_SIZE) {
            const chunk = customers.slice(i, i + CHUNK_SIZE);
            
            // Check for duplicates in this chunk
            const phones = chunk.map(c => c.phone);
            const placeholders = phones.map(() => "?").join(",");
            
            let existingPhones = [];
            if (!skipDuplicates) {
                const [results] = await db.query(
                    `SELECT mobile_number FROM customers WHERE mobile_number IN (${placeholders})`,
                    phones
                );
                existingPhones = results.map(r => r.mobile_number);
            }

            // Filter out duplicates if skipping
            let customersToInsert = chunk;
            if (skipDuplicates) {
                customersToInsert = chunk.filter(c => !existingPhones.includes(c.phone));
                skippedCount += chunk.length - customersToInsert.length;
            }

            if (customersToInsert.length === 0) continue;

            // Prepare values for bulk insert
            const values = customersToInsert.map(c => [
                c.name || 'Unknown',
                c.phone,
                c.interest || '',
                'Delhi NCR',
                'Daily Reach'
            ]);

            const [result] = await db.query(
                `INSERT INTO customers (customer_name, mobile_number, interests, location_type, group_type)
                 VALUES ?`,
                [values]
            );

            insertedCount += result.affectedRows;
        }

        res.json({
            success: true,
            inserted: insertedCount,
            skipped: skippedCount,
            total: customers.length,
            errors: errors
        });
    } catch (err) {
        console.error("Error in bulk import:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
