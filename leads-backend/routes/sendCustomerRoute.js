const express = require("express");
const router = express.Router();

const db = require("../config/db");
const client = require("../whatsapp");

router.get("/:id", async (req, res) => {

  try {

    const customerId =
      req.params.id;

    db.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
      `,
      [customerId],
      async (err, customers) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        if (
          customers.length === 0
        ) {
          return res
            .status(404)
            .json({
              message:
                "Customer Not Found",
            });
        }

        const customer =
          customers[0];

        const firstInterest =
          customer.interests
            ?.split(",")[0]
            ?.trim();

        db.query(
          `
          SELECT *
          FROM templates
          WHERE LOWER(interest_name) = LOWER(?)
          LIMIT 1
          `,
          [firstInterest],
          async (
            err,
            templates
          ) => {

            if (err) {
              return res
                .status(500)
                .json(err);
            }

            if (
              templates.length === 0
            ) {
              return res
                .status(404)
                .json({
                  message:
                    "Template Not Found",
                });
            }

            const template =
              templates[0];

console.log(
  "Customer Mobile:",
  customer.mobile_number
);

console.log(
  "Chat ID:",
  `${customer.mobile_number}@c.us`
);

           let mobile =
  customer.mobile_number
    .replace(/\D/g, "");

if (
  !mobile.startsWith("91")
) {
  mobile = `91${mobile}`;
}

const chatId =
  `${mobile}@c.us`;

         try {

  await client.sendMessage(
    chatId,
    template.message
  );

} catch (error) {

  console.error(
    "WhatsApp Send Failed:",
    error.message
  );

  return res.status(500).json({
    success: false,
    error:
      error.message,
  });

}  

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
                customer.mobile_number,
                template.template_name,
                "Sent",
              ]
            );

            res.json({
              success: true,
              customer:
                customer.customer_name,
              template:
                template.template_name,
            });

          }
        );

      }
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error:
        error.message,
    });

  }

});

module.exports = router;