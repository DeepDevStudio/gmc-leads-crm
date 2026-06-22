const express = require("express");
const router = express.Router();

const db = require("../config/db");

router.get("/run", (req, res) => {

  db.query(
    `
    SELECT *
    FROM customers
    WHERE group_type = 'Daily Reach'
    `,
    (err, customers) => {

      if (err) {
        return res
          .status(500)
          .json(err);
      }

      db.query(
        `
        SELECT *
        FROM templates
        WHERE status = 'Active'
        `,
        (err, templates) => {

          if (err) {
            return res
              .status(500)
              .json(err);
          }

          const results = [];

          customers.forEach(
            (customer) => {

              const firstInterest =
                customer.interests
                  ?.split(",")[0]
                  ?.trim();

              const template =
                templates.find(
                  (t) =>
                    t.interest_name ===
                    firstInterest
                );

              if (template) {

                results.push({
                  customer_name:
                    customer.customer_name,

                  mobile_number:
                    customer.mobile_number,

                  interest:
                    firstInterest,

                  template_name:
                    template.template_name,

                  message:
                    template.message,
                });

              }

            }
          );

          res.json(results);

        }
      );

    }
  );

});

module.exports = router;