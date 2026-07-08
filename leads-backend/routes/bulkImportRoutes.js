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
            `SELECT mobile_number, id, customer_name FROM customers WHERE mobile_number IN (${placeholders})`,
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
BULK IMPORT CUSTOMERS (with Chunking, Validation & Error Logging)
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
    let errorLog = [];

    try {
        // Validate all customers first
        const validationErrors = [];
        const validCustomers = [];

        customers.forEach((customer, index) => {
            const errors = [];
            
            // Validate phone
            if (!customer.phone || customer.phone.length < 10) {
                errors.push("Invalid or missing phone number");
            }
            
            // Validate name
            if (!customer.name || customer.name.trim().length === 0) {
                errors.push("Name is required");
            }

            if (errors.length > 0) {
                validationErrors.push({
                    row: index + 1,
                    phone: customer.phone || 'N/A',
                    errors: errors,
                    data: customer
                });
            } else {
                validCustomers.push(customer);
            }
        });

        if (validationErrors.length > 0) {
            errorLog.push(...validationErrors);
        }

        if (validCustomers.length === 0) {
            return res.status(400).json({
                error: "No valid customers to import",
                errors: errorLog
            });
        }

        // Check duplicates
        const allPhones = validCustomers.map(c => c.phone);
        const placeholders = allPhones.map(() => "?").join(",");
        const [existingResults] = await db.query(
            `SELECT mobile_number FROM customers WHERE mobile_number IN (${placeholders})`,
            allPhones
        );
        const duplicatePhones = existingResults.map(r => r.mobile_number);

        // Filter customers to import
        let customersToImport = validCustomers;
        let duplicateCount = duplicatePhones.length;

        if (skipDuplicates) {
            customersToImport = validCustomers.filter(c => !duplicatePhones.includes(c.phone));
            skippedCount += validCustomers.length - customersToImport.length;
        }

        if (customersToImport.length === 0) {
            return res.json({
                success: true,
                inserted: 0,
                skipped: skippedCount,
                duplicates: duplicateCount,
                total: customers.length,
                errors: errorLog,
                warning: "All customers are duplicates"
            });
        }

        // Process in chunks with transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (let i = 0; i < customersToImport.length; i += CHUNK_SIZE) {
                const chunk = customersToImport.slice(i, i + CHUNK_SIZE);
                
                const values = chunk.map(c => [
                    c.name || 'Unknown',
                    c.phone,
                    c.interest || '',
                    c.location || 'Delhi NCR',
                    'Daily Reach'
                ]);

                const [result] = await connection.query(
                    `INSERT INTO customers (customer_name, mobile_number, interests, location_type, group_type)
                     VALUES ?`,
                    [values]
                );

                insertedCount += result.affectedRows;
            }

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        // Build response
        const response = {
            success: true,
            inserted: insertedCount,
            skipped: skippedCount,
            duplicates: duplicateCount,
            total: customers.length,
            errors: errorLog
        };

        if (validationErrors.length > 0) {
            response.warning = `${validationErrors.length} row(s) had validation errors and were skipped`;
        }

        if (duplicateCount > 0 && skipDuplicates) {
            response.warning = (response.warning ? response.warning + ' ' : '') + `${duplicateCount} duplicate(s) were skipped`;
        }

        res.json(response);

    } catch (err) {
        console.error("Error in bulk import:", err);
        res.status(500).json({ 
            error: err.message,
            errors: errorLog
        });
    }
});

/*
=========================
GET IMPORT HISTORY
=========================
*/
router.get("/history", async (req, res) => {
    try {
        // Query activity logs for import activities
        const [rows] = await db.query(`
            SELECT 
                id,
                username,
                activity,
                created_at as date
            FROM activity_logs 
            WHERE activity LIKE '%import%' 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        
        // Format the response
        const history = rows.map(row => {
            // Try to extract numbers from activity string
            const importedMatch = row.activity.match(/imported (\d+)/i);
            const totalMatch = row.activity.match(/total (\d+)/i);
            
            return {
                id: row.id,
                date: row.date,
                username: row.username,
                activity: row.activity,
                imported: importedMatch ? parseInt(importedMatch[1]) : 0,
                total: totalMatch ? parseInt(totalMatch[1]) : 0
            };
        });

        res.json({
            success: true,
            history: history,
            message: "Import history from activity logs"
        });
    } catch (err) {
        console.error("Error fetching import history:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
