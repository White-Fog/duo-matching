const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const str = `
        <a href="/api/users">회원관리</a>
        <a href="/api/posts">POST관리</a>
    `;
  res.send(str);
});
module.exports = router;
