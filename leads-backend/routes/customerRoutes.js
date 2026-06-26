const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
=========================
GET ALL CUSTOMERS
=========================
*/
router.get("/", (req, res) => {
  db.query(
    `
    SELECT *
    FROM customers
    ORDER BY id DESC
    `,
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.json(results);
    }
  );
});



/*
=========================
CHECK CUSTOMER
=========================
*/
router.get(
  "/check/:mobile",
  (req, res) => {

    db.query(
      `
      SELECT *
      FROM customers
      WHERE mobile_number = ?
      LIMIT 1
      `,
      [req.params.mobile],
      (err, rows) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        if (
          rows.length > 0
        ) {
          return res.json({
            exists: true,
            customer: rows[0],
          });
        }

        res.json({
          exists: false,
        });

      }
    );

  }
);

/*
=========================
CREATE CUSTOMER
=========================
*/

router.post("/", (req, res) => {
  const {
    customer_name,
    mobile_number,
    interests,
    location_type,
  } = req.body;

  let group_type = "Daily Reach";

  if (location_type === "Outside Delhi NCR") {
    group_type = "Do Not Reach";
  }

  db.query(
    `
    INSERT INTO customers
    (
      customer_name,
      mobile_number,
      interests,
      location_type,
      group_type
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      customer_name,
      mobile_number,
      interests,
      location_type,
      group_type,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.status(201).json({
        success: true,
        id: result.insertId,
      });
    }
  );
});

/*
=========================
UPDATE CUSTOMER
=========================
*/
router.put(
  "/:id",
  (req, res) => {

   const {
  customer_name,
  mobile_number,
  interests,
  location_type,
} = req.body;

let group_type = "Daily Reach";

if (location_type === "Outside Delhi NCR") {
  group_type = "Do Not Reach";
}

    db.query(
      `
      UPDATE customers
      SET
      customer_name = ?,
      mobile_number = ?,
      interests = ?,
      location_type = ?,
      group_type = ?
      WHERE id = ?
      `,
      [
        customer_name,
        mobile_number,
        interests,
        location_type,
        group_type,
        req.params.id,
      ],
      (err) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        res.json({
          success: true,
        });

      }
    );

  }
);

/*
=========================
UNSUBSCRIBE CUSTOMER
=========================
*/
router.get("/unsubscribe/:mobile", (req, res) => {

  db.query(
    `
    UPDATE customers
    SET group_type = 'Unsubscribed'
    WHERE mobile_number = ?
    `,
    [req.params.mobile],
    (err) => {

      if (err) {
        return res.status(500).send("Error");
      }

      res.send("You have been unsubscribed successfully.");
    }
  );

});



/*
=========================
DAILY REACH CUSTOMERS
=========================
*/
router.get(
  "/group/daily-reach",
  (req, res) => {

    db.query(
      `
      SELECT *
      FROM customers
      WHERE group_type = 'Daily Reach'
      ORDER BY id DESC
      `,
      (err, rows) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.json(rows);

      }
    );

  }
);


router.get(
  "/group/do-not-reach",
  (req, res) => {

    db.query(
      `
      SELECT *
      FROM customers
      WHERE group_type = 'Do Not Reach'
      ORDER BY id DESC
      `,
      (err, rows) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.json(rows);

      }
    );

  }
);


router.get(
  "/group/unsubscribed",
  (req, res) => {

    db.query(
      `
      SELECT *
      FROM customers
      WHERE group_type = 'Unsubscribed'
      ORDER BY id DESC
      `,
      (err, rows) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.json(rows);

      }
    );

  }
);


/*
=========================
CUSTOMER PROFILE
=========================
*/
router.get(
  "/profile/:id",
  (req, res) => {

    const customerId =
      req.params.id;

    db.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
      `,
      [customerId],
      (err, customerRows) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        if (
          customerRows.length === 0
        ) {
          return res
            .status(404)
            .json({
              message:
                "Customer not found",
            });
        }

        const customer =
          customerRows[0];

        db.query(
          `
          SELECT
            yb.*,
            ym.yatra_name,
            ym.start_date,
            ym.end_date
          FROM yatra_bookings yb
          JOIN yatra_master ym
            ON ym.id = yb.yatra_id
          WHERE yb.customer_id = ?
          ORDER BY yb.id DESC
          `,
          [customerId],
          (err2, bookings) => {

            if (err2) {
              return res
                .status(500)
                .json(err2);
            }

            const totalTrips =
              bookings.length;

            const revenue =
              bookings.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  Number(
                    item.total_amount ||
                      0
                  ),
                0
              );

            res.json({

              customer,

              totalTrips,

              lifetimeRevenue:
                revenue,

              bookings,

            });

          }
        );

      }
    );

  }
);


/*
=========================
MOVE CUSTOMER GROUP
=========================
*/
router.put("/group/:id", (req, res) => {

  const { group_type } = req.body;

  db.query(
    `
    UPDATE customers
    SET group_type = ?
    WHERE id = ?
    `,
    [group_type, req.params.id],
    (err) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
      });

    }
  );

});





router.get("/:id", (req, res) => {

  db.query(
    `
    SELECT *
    FROM customers
    WHERE id = ?
    `,
    [req.params.id],
    (err, results) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.json(
        results[0]
      );

    }
  );

});

/*
=========================
DELETE CUSTOMER
=========================
*/
router.delete("/:id", (req, res) => {
  db.query(
    `
    DELETE FROM customers
    WHERE id = ?
    `,
    [req.params.id],
    (err) => {
      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.json({
        success: true,
      });
    }
  );
});



module.exports = router;