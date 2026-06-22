const express =
  require("express");

const router =
  express.Router();

const db =
  require("../config/db");

router.post(
  "/login",
  (req, res) => {

    const {
      username,
      password,
    } = req.body;

    db.query(
      `
      SELECT *
      FROM users
      WHERE username = ?
      AND password = ?
      AND is_active = 1
      `,
      [
        username,
        password,
      ],
      (err, rows) => {

        if (err) {
          return res
            .status(500)
            .json(err);
        }

        if (
          rows.length === 0
        ) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Invalid Credentials",
            });
        }

        const user =
          rows[0];

        res.json({
          success: true,
          user: {
            id: user.id,
            username:
              user.username,
            full_name:
              user.full_name,
            role:
              user.role,
            whatsapp_number:
              user.whatsapp_number,
          },
        });

      }
    );

  }
);

module.exports =
  router;