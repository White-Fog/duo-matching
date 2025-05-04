const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const str = `
        <h1>Post 관련</h1>
    `;
    res.send(str);
});
module.exports = router;
