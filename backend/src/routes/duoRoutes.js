const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Duo matchmaking API works!" });
});

module.exports = router;
