const express = require("express");
const router = express.Router();

const db = require("../config/db");
const client = require("../whatsapp");

router.get("/", async (req, res) => {

  try {

    db.query(
      `
      SELECT *
      FROM customers
      WHERE group_type = 'Daily Reach'
      `,
      async (err, customers) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        const results = [];

        for (const customer of customers) {

          try {

            const firstInterest =
              customer.interests
                ?.split(",")[0]
                ?.trim();

            const templates =
              await new Promise(
                (resolve, reject) => {

                  db.query(
                    `
                    SELECT *
                    FROM templates
                    WHERE LOWER(interest_name)
                    = LOWER(?)
                    LIMIT 1
                    `,
                    [firstInterest],
                    (err, rows) => {

                      if (err)
                        reject(err);
                      else
                        resolve(rows);

                    }
                  );

                }
              );

            if (
              templates.length === 0
            ) {
              continue;
            }

            const template =
              templates[0];

            let mobile =
              customer.mobile_number
                .replace(/\D/g, "");

            if (
              !mobile.startsWith(
                "91"
              )
            ) {
              mobile =
                `91${mobile}`;
            }

            const chatId =
              `${mobile}@c.us`;

            await client.sendMessage(
              chatId,
              template.message
            );

            db.query(
              `
              INSERT INTO
              message_logs
              (
                customer_name,
                mobile_number,
                template_name,
                status
              )
              VALUES (?, ?, ?, ?)
              `,
              [
                customer.customer_name,
                mobile,
                template.template_name,
                "Sent",
              ]
            );

            results.push({
              customer:
                customer.customer_name,
              status: "Sent",
            });

          } catch (error) {

            results.push({
              customer:
                customer.customer_name,
              status: "Failed",
            });

          }

        }

        res.json({
          success: true,
          total:
            results.length,
          results,
        });

      }
    );

  } catch (error) {

    res.status(500).json({
      success: false,
      error:
        error.message,
    });

  }

});

module.exports = router;