const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
=========================
GET ALL CAMPAIGNS
=========================
*/

router.get("/", (req, res) => {

  db.query(
    `
    SELECT *
    FROM campaigns
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
CREATE CAMPAIGN
=========================
*/

router.post("/", (req, res) => {

  const {
    campaign_name,
    message,
    target_interests,
    target_groups,
    status,
  } = req.body;

  db.query(
    `
    INSERT INTO campaigns
    (
      campaign_name,
      message,
      target_interests,
      target_groups,
      status
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      campaign_name,
      message,
      target_interests,
      target_groups,
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

/*
=========================
DELETE CAMPAIGN
=========================
*/

router.delete("/:id", (req, res) => {

  db.query(
    `
    DELETE FROM campaigns
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