const express = require("express");
const router = express.Router();

const db =
  require("../config/db");

router.get(
  "/stats",
  (req, res) => {

    db.query(
      `
      SELECT
      COUNT(*) AS total_messages
      FROM message_logs
      `,
      (err, totalRows) => {

        if (err)
          return res
            .status(500)
            .json(err);

        db.query(
          `
          SELECT
          template_name,
          COUNT(*) AS total
          FROM message_logs
          GROUP BY template_name
          ORDER BY total DESC
          `,
          (
            err,
            templateRows
          ) => {

            if (err)
              return res
                .status(500)
                .json(err);

            db.query(
              `
              SELECT *
              FROM message_logs
              ORDER BY id DESC
              LIMIT 20
              `,
              (
                err,
                messageRows
              ) => {

                if (err)
                  return res
                    .status(500)
                    .json(err);

                res.json({

                  totalMessages:
                    totalRows[0]
                      .total_messages,

                  templateStats:
                    templateRows,

                  recentMessages:
                    messageRows,

                });

              }
            );

          }
        );

      }
    );

  }
);

module.exports =
  router;

  router.get(
  "/employees",
  (req, res) => {

    db.query(
      `
      SELECT
        username,
        COUNT(*) AS total
      FROM activity_logs
      GROUP BY username
      ORDER BY total DESC
      `,
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

router.get(
  "/summary",
  (req, res) => {

    db.query(
      `
      SELECT

      COUNT(*) AS total,

      SUM(
        DATE(sent_at)
        =
        CURDATE()
      ) AS today,

      SUM(
        YEARWEEK(sent_at,1)
        =
        YEARWEEK(
          NOW(),
          1
        )
      ) AS week_count,

      SUM(
        MONTH(sent_at)
        =
        MONTH(NOW())

        AND

        YEAR(sent_at)
        =
        YEAR(NOW())
      ) AS month_count

      FROM message_logs
      `,
      (err, rows) => {

        if (err)
          return res
            .status(500)
            .json(err);

        res.json(
          rows[0]
        );

      }
    );

  }
);