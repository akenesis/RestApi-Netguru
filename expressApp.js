const express = require("express");
const path = require("path");

app = express();
app.use(express.static(path.resolve(__dirname, "public")));

app.listen(3008);
