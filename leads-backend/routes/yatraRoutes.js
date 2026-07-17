const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL YATRAS WITH TRIP COUNTS
=========================
*/
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ym.*, 
                   COUNT(yt.id) as trip_count
            FROM yatra_master ym
            LEFT JOIN yatra_trips yt ON ym.id = yt.yatra_id
            GROUP BY ym.id
            ORDER BY ym.id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching yatras:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET SINGLE YATRA (UPDATED WITH SHARING OPTIONS)
=========================
*/
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT ym.*, 
                   COUNT(yt.id) as trip_count
            FROM yatra_master ym
            LEFT JOIN yatra_trips yt ON ym.id = yt.yatra_id
            WHERE ym.id = ?
            GROUP BY ym.id
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Yatra not found" });
        }

        // Get sharing options
        const [sharingOptions] = await db.query(`
            SELECT sharing_type, price 
            FROM sharing_options 
            WHERE yatra_id = ?
        `, [id]);

        const yatra = rows[0];
        yatra.sharing_options = sharingOptions;

        res.json(yatra);
    } catch (err) {
        console.error("Error fetching yatra:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
GET DESTINATION IMAGE
=========================
*/
router.get("/destination-image/:destination", async (req, res) => {
    const { destination } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT image_url FROM destination_images WHERE destination = ?",
            [destination]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Image not found for this destination" });
        }

        res.json({ image_url: rows[0].image_url });
    } catch (err) {
        console.error("Error fetching destination image:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
CREATE YATRA
=========================
*/
router.post("/", async (req, res) => {
    const { yatra_name, start_date, end_date, start_time, return_time, image_url, rate_per_seat, status } = req.body;

    console.log("📝 Creating Yatra with data:", req.body);

    if (!yatra_name) {
        return res.status(400).json({ error: "Yatra name is required" });
    }

    try {
        // Format dates to YYYY-MM-DD
        const formattedStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;
        const formattedEndDate = end_date ? new Date(end_date).toISOString().split('T')[0] : null;

        const [result] = await db.query(
            `INSERT INTO yatra_master 
             (yatra_name, start_date, end_date, start_time, return_time, image_url, rate_per_seat, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                yatra_name,
                formattedStartDate,
                formattedEndDate,
                start_time || null,
                return_time || null,
                image_url || null,
                rate_per_seat || 0,
                status || 'active'
            ]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Yatra created successfully"
        });
    } catch (err) {
        console.error("❌ Error creating yatra:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
UPDATE YATRA
=========================
*/
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { yatra_name, start_date, end_date, start_time, return_time, image_url, rate_per_seat, status } = req.body;

    console.log("📝 Updating Yatra ID:", id, "with data:", req.body);

    if (!yatra_name) {
        return res.status(400).json({ error: "Yatra name is required" });
    }

    try {
        // Format dates to YYYY-MM-DD
        const formattedStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;
        const formattedEndDate = end_date ? new Date(end_date).toISOString().split('T')[0] : null;

        const [result] = await db.query(
            `UPDATE yatra_master 
             SET 
                yatra_name = ?,
                start_date = ?,
                end_date = ?,
                start_time = ?,
                return_time = ?,
                image_url = ?,
                rate_per_seat = ?,
                status = ?
             WHERE id = ?`,
            [
                yatra_name,
                formattedStartDate,
                formattedEndDate,
                start_time || null,
                return_time || null,
                image_url || null,
                rate_per_seat || 0,
                status || 'active',
                id
            ]
        );

        console.log("✅ Update result:", result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Yatra not found" });
        }

        res.json({
            success: true,
            message: "Yatra updated successfully"
        });
    } catch (err) {
        console.error("❌ Error updating yatra:", err);
        res.status(500).json({ error: err.message });
    }
});

/*
=========================
DELETE YATRA
=========================
*/
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM yatra_master WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Yatra not found" });
        }

        res.json({
            success: true,
            message: "Yatra deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting yatra:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
