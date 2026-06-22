const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
=========================
GET ALL INTERESTS
=========================
*/

router.get("/", (req, res) => {

  db.query(
    `
    SELECT *
    FROM interests
    ORDER BY interest_name
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
CREATE INTEREST
=========================
*/

router.post("/", (req, res) => {

  const {
    interest_name,
  } = req.body;

  db.query(
    `
    INSERT INTO interests
    (
      interest_name
    )
    VALUES (?)
    `,
    [interest_name],
    (err, result) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      res.status(201).json({
        success: true,
        id: result.insertId,
      });

    }
  );

});

module.exports = router;