const express = require("express");
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
