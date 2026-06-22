const express = require("express");
const router = express.Router();

const client =
  require("../whatsapp");

router.get(
  "/send-test",
  async (req, res) => {

    try {

      const number =
        "919311310550"; // your number

      const chatId =
        `${number}@c.us`;

      await client.sendMessage(
        chatId,
        "Hello from GMC Leads 🚀"
      );

      res.json({
        success: true,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error:
          error.message,
      });

    }

  }
);

module.exports = router;