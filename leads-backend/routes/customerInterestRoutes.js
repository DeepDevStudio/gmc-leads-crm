const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*
=========================
GET ALL INTERESTS FOR A CUSTOMER
=========================
*/
router.get("/:customerId/interests", (req, res) => {
  const { customerId } = req.params;

  db.query(
    `
    SELECT i.id, i.interest_name, i.created_at
    FROM customer_interests ci
    JOIN interests i ON ci.interest_id = i.id
    WHERE ci.customer_id = ?
    ORDER BY i.interest_name
    `,
    [customerId],
    (err, results) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.json(results);
    }
  );
});

/*
=========================
ADD INTEREST TO CUSTOMER
=========================
*/
router.post("/:customerId/interests", (req, res) => {
  const { customerId } = req.params;
  const { interest_id } = req.body;

  if (!interest_id) {
    return res.status(400).json({ error: "interest_id is required" });
  }

  db.query(
    `
    INSERT IGNORE INTO customer_interests (customer_id, interest_id)
    VALUES (?, ?)
    `,
    [customerId, interest_id],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.status(201).json({
        success: true,
        message: "Interest added to customer successfully",
        affected: result.affectedRows,
      });
    }
  );
});

/*
=========================
REMOVE INTEREST FROM CUSTOMER
=========================
*/
router.delete("/:customerId/interests/:interestId", (req, res) => {
  const { customerId, interestId } = req.params;

  db.query(
    `
    DELETE FROM customer_interests
    WHERE customer_id = ? AND interest_id = ?
    `,
    [customerId, interestId],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Customer interest not found" });
      }
      res.json({
        success: true,
        message: "Interest removed from customer successfully",
      });
    }
  );
});

module.exports = router;
