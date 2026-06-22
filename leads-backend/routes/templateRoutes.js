const express = require("express");
const router = express.Router();

const db = require("../config/db");

router.get("/", (req, res) => {

  db.query(
    `
    SELECT *
    FROM templates
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

router.post("/", (req, res) => {

  const {
    template_name,
    interest_name,
    message,
    status,
  } = req.body;

  db.query(
    `
    INSERT INTO templates
    (
      template_name,
      interest_name,
      message,
      status
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      template_name,
      interest_name,
      message,
      status,
    ],
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

router.delete("/:id", (req, res) => {

  db.query(
    `
    DELETE FROM templates
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