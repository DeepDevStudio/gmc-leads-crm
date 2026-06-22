const express =
  require("express");

const router =
  express.Router();

const db =
  require("../config/db");

router.get(
  "/preview/:interest",
  (req, res) => {

    const interest =
      req.params.interest;

    db.query(
      `
      SELECT *
      FROM customers
      WHERE interests
      LIKE ?
      `,
      [`%${interest}%`],
      (err, rows) => {

        if (err)
          return res
            .status(500)
            .json(err);

        res.json(rows);

      }
    );

  }
);

module.exports =
  router;