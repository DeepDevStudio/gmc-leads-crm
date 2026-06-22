const express =
  require("express");

const router =
  express.Router();

const db =
  require("../config/db");

router.post(
  "/create",
  (req, res) => {

    const {
      user_id,
      username,
      activity,
    } = req.body;

    db.query(
      `
      INSERT INTO
      activity_logs
      (
        user_id,
        username,
        activity
      )
      VALUES (?, ?, ?)
      `,
      [
        user_id,
        username,
        activity,
      ],
      (err, result) => {

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

router.get(
  "/all",
  (req, res) => {

    db.query(
      `
      SELECT *
      FROM activity_logs
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

  }
);

module.exports =
  router;