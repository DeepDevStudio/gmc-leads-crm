const express = require("express");
const router = express.Router();

const db = require("../config/db");

router.get("/stats", async (req, res) => {

  try {

    const data = {};

    db.query(
      `
      SELECT
        COUNT(*) AS totalCustomers,

        SUM(
          CASE
            WHEN group_type = 'Daily Reach'
            THEN 1
            ELSE 0
          END
        ) AS dailyReach,

        SUM(
          CASE
            WHEN group_type = 'Do Not Reach'
            THEN 1
            ELSE 0
          END
        ) AS doNotReach,

        SUM(
          CASE
            WHEN group_type = 'Unsubscribed'
            THEN 1
            ELSE 0
          END
        ) AS unsubscribed

      FROM customers
      `,
      (err, customerStats) => {

        if (err) {
          return res.status(500).json(err);
        }

        Object.assign(
          data,
          customerStats[0]
        );

        db.query(
          `
          SELECT COUNT(*) AS total
          FROM templates
          `,
          (err2, templates) => {

            if (err2) {
              return res.status(500).json(err2);
            }

            data.templates =
              templates[0].total;

            db.query(
              `
              SELECT COUNT(*) AS total
              FROM activity_logs
              `,
              (err3, activities) => {

                if (err3) {
                  return res.status(500).json(err3);
                }

                data.activities =
                  activities[0].total;

                db.query(
                  `
                  SELECT COUNT(*) AS total
                  FROM message_logs
                  `,
                  (err4, messages) => {

                    if (err4) {
                      return res.status(500).json(err4);
                    }

                    data.messages =
                      messages[0].total;

                    db.query(
                      `
                      SELECT COUNT(*) AS total
                      FROM yatra_master
                      `,
                      (err5, yatras) => {

                        if (err5) {
                          return res.status(500).json(err5);
                        }

                        data.totalYatras =
                          yatras[0].total;

                        db.query(
                          `
                          SELECT COUNT(*) AS total
                          FROM yatra_bookings
                          `,
                          (err6, bookings) => {

                            if (err6) {
                              return res.status(500).json(err6);
                            }

                            data.totalBookings =
                              bookings[0].total;

                            db.query(
                              `
                              SELECT
                                id,
                                customer_name,
                                mobile_number,
                                group_type
                              FROM customers
                              ORDER BY id DESC
                              LIMIT 5
                              `,
                              (err7, latestCustomers) => {

                                if (err7) {
                                  return res.status(500).json(err7);
                                }

                                data.latestCustomers =
                                  latestCustomers;

                                res.json(data);

                              }
                            );

                          }
                        );

                      }
                    );

                  }
                );

              }
            );

          }
        );

      }
    );

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message,
    });

  }

});

module.exports = router;