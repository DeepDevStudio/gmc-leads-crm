const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET YATRA DETAILS WITH ALL ASSOCIATED DATA
=========================
*/
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Get yatra details
        const [yatraRows] = await db.query(`
            SELECT ym.*, 
                   COUNT(yt.id) as trip_count
            FROM yatra_master ym
            LEFT JOIN yatra_trips yt ON ym.id = yt.yatra_id
            WHERE ym.id = ?
            GROUP BY ym.id
        `, [id]);

        if (yatraRows.length === 0) {
            return res.status(404).json({ message: "Yatra not found" });
        }

        const yatra = yatraRows[0];

        // Get itinerary
        const [itinerary] = await db.query(`
            SELECT * FROM yatra_itineraries 
            WHERE yatra_id = ? 
            ORDER BY day_number ASC
        `, [id]);

        // Get testimonials
        const [testimonials] = await db.query(`
            SELECT * FROM yatra_testimonials 
            WHERE yatra_id = ? 
            ORDER BY created_at DESC
        `, [id]);

        // Get gallery
        const [gallery] = await db.query(`
            SELECT * FROM yatra_gallery 
            WHERE yatra_id = ? 
            ORDER BY created_at DESC
        `, [id]);

        // Get sharing options
        const [sharingOptions] = await db.query(`
            SELECT sharing_type, price 
            FROM sharing_options 
            WHERE yatra_id = ?
        `, [id]);

        yatra.sharing_options = sharingOptions;

        res.json({
            yatra: yatra,
            itinerary: itinerary,
            testimonials: testimonials,
            gallery: gallery
        });

    } catch (err) {
        console.error("Error fetching yatra details:", err);
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
GET ALL DESTINATION IMAGES
=========================
*/
router.get("/destination-images", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT destination, image_url FROM destination_images ORDER BY destination"
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching destination images:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
