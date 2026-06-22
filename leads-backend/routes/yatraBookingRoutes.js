const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
==================================
GET ALL BOOKINGS
==================================
*/
router.get("/", (req, res) => {

  db.query(
    `
    SELECT
      yb.*,
      c.customer_name,
      c.mobile_number,
      ym.yatra_name,
      ym.start_date,
      ym.end_date
    FROM yatra_bookings yb
    JOIN customers c
      ON c.id = yb.customer_id
    JOIN yatra_master ym
      ON ym.id = yb.yatra_id
    ORDER BY yb.id DESC
    `,
    (err, rows) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.json(rows);

    }
  );

});


/*
==================================
GET SINGLE BOOKING + TRAVELERS
==================================
*/
router.get("/:id", (req, res) => {

  const bookingId =
    req.params.id;

  db.query(
    `
    SELECT
      yb.*,
      c.customer_name,
      c.mobile_number,
      ym.yatra_name
    FROM yatra_bookings yb
    JOIN customers c
      ON c.id = yb.customer_id
    JOIN yatra_master ym
      ON ym.id = yb.yatra_id
    WHERE yb.id = ?
    `,
    [bookingId],
    (err, bookingRows) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      if (
        bookingRows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Booking not found",
          });
      }

      db.query(
        `
        SELECT *
        FROM yatra_travelers
        WHERE booking_id = ?
        `,
        [bookingId],
        (err2, travelerRows) => {

          if (err2) {
            return res
              .status(500)
              .json(err2);
          }

          res.json({
            booking:
              bookingRows[0],
            travelers:
              travelerRows,
          });

        }
      );

    }
  );

});


/*
==================================
CREATE BOOKING
==================================
*/
router.post("/", (req, res) => {

  const {
    customer_id,
    yatra_id,
    advance_amount,
    remarks,
    travelers,
    booked_by,
  } = req.body;

  if (
    !travelers ||
    travelers.length === 0
  ) {
    return res
      .status(400)
      .json({
        message:
          "At least one traveler required",
      });
  }

  db.query(
    `
    SELECT *
    FROM yatra_master
    WHERE id = ?
    `,
    [yatra_id],
    (err, yatraRows) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      if (
        yatraRows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Yatra not found",
          });
      }

      const yatra =
        yatraRows[0];

      const ratePerSeat =
        Number(
          yatra.rate_per_seat
        );

      const seats =
        travelers.length;

      const totalAmount =
        ratePerSeat * seats;

      const balanceAmount =
        totalAmount -
        Number(
          advance_amount || 0
        );

      db.query(
        `
        INSERT INTO
        yatra_bookings
        (
          customer_id,
          yatra_id,
          seats,
          total_amount,
          advance_amount,
          balance_amount,
          remarks,
          booked_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customer_id,
          yatra_id,
          seats,
          totalAmount,
          advance_amount || 0,
          balanceAmount,
          remarks,
          booked_by,
        ],
        (
          bookingErr,
          bookingResult
        ) => {

          if (
            bookingErr
          ) {
            return res
              .status(500)
              .json(
                bookingErr
              );
          }

          const bookingId =
            bookingResult.insertId;

          const values =
            travelers.map(
              (
                traveler
              ) => [
                bookingId,
                traveler.traveler_name,
                traveler.age,
                traveler.gender,
                traveler.mobile_number,
              ]
            );

          db.query(
            `
            INSERT INTO
            yatra_travelers
            (
              booking_id,
              traveler_name,
              age,
              gender,
              mobile_number
            )
            VALUES ?
            `,
            [values],
            (
              travelerErr
            ) => {

              if (
                travelerErr
              ) {
                return res
                  .status(500)
                  .json(
                    travelerErr
                  );
              }

              res.json({
                success: true,
                booking_id:
                  bookingId,
                seats,
                totalAmount,
                balanceAmount,
              });

            }
          );

        }
      );

    }
  );

});


/*
==================================
DELETE BOOKING
==================================
*/
router.delete(
  "/:id",
  (req, res) => {

    const bookingId =
      req.params.id;

    db.query(
      `
      DELETE
      FROM yatra_travelers
      WHERE booking_id = ?
      `,
      [bookingId],
      (err) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        db.query(
          `
          DELETE
          FROM yatra_bookings
          WHERE id = ?
          `,
          [bookingId],
          (err2) => {

            if (err2) {
              return res
                .status(500)
                .json(err2);
            }

            res.json({
              success: true,
            });

          }
        );

      }
    );

  }
);

module.exports = router;