const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
====================
GET ALL YATRAS
====================
*/
router.get("/", (req, res) => {

  db.query(
    `
    SELECT *
    FROM yatra_master
    ORDER BY id DESC
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
====================
GET SINGLE YATRA
====================
*/
router.get("/:id", (req, res) => {

  db.query(
    `
    SELECT *
    FROM yatra_master
    WHERE id = ?
    `,
    [req.params.id],
    (err, rows) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      if (
        rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Yatra not found",
          });
      }

      res.json(
        rows[0]
      );

    }
  );

});

/*
====================
CREATE YATRA
====================
*/
router.post("/", (req, res) => {

  const {
    yatra_name,
    start_date,
    end_date,
    rate_per_seat,
  } = req.body;

  db.query(
    `
    INSERT INTO yatra_master
    (
      yatra_name,
      start_date,
      end_date,
      rate_per_seat
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      yatra_name,
      start_date,
      end_date,
      rate_per_seat,
    ],
    (err, result) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.json({
        success: true,
        id: result.insertId,
      });

    }
  );

});

/*
====================
UPDATE YATRA
====================
*/
router.put("/:id", (req, res) => {

  const {
    yatra_name,
    start_date,
    end_date,
    rate_per_seat,
    status,
  } = req.body;

  db.query(
    `
    UPDATE yatra_master
    SET
      yatra_name = ?,
      start_date = ?,
      end_date = ?,
      rate_per_seat = ?,
      status = ?
    WHERE id = ?
    `,
    [
      yatra_name,
      start_date,
      end_date,
      rate_per_seat,
      status,
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

});

/*
====================
DELETE YATRA
====================
*/
router.delete("/:id", (req, res) => {

  db.query(
    `
    DELETE
    FROM yatra_master
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