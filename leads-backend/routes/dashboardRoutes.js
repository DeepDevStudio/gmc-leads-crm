const express = require("express");
const router = express.Router();

const db =
  require("../config/db");

router.get(
  "/stats",
  async (req, res) => {

    try {

      const data = {};

      db.query(
        "SELECT COUNT(*) total FROM customers",
        (err, result) => {

          if (err)
            return res.status(500).json(err);

          data.customers =
            result[0].total;

          db.query(
            "SELECT COUNT(*) total FROM templates",
            (err2, result2) => {

              if (err2)
                return res.status(500).json(err2);

              data.templates =
                result2[0].total;

              db.query(
                "SELECT COUNT(*) total FROM activity_logs",
                (err3, result3) => {

                  if (err3)
                    return res.status(500).json(err3);

                  data.activities =
                    result3[0].total;

                  db.query(
                    "SELECT COUNT(*) total FROM message_logs",
                    (err4, result4) => {

                      if (err4)
                        return res.status(500).json(err4);

                      data.messages =
                        result4[0].total;

                      res.json(data);

                    }
                  );

                }
              );

            }
          );

        }
      );

    } catch (error) {

      res.status(500).json(error);

    }

  }
);

module.exports = router;