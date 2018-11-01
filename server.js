const RequestHandler = require("./src/RequestHandler");
const express = require("express");
const yargs = require("yargs");
const axios = require("axios");

const argv = yargs
  .options({
    title: {
      demand: true,
      alias: "t",
      describe: "The movie name",
      string: true
    }
  })
  .help()
  .alias("help", "h").argv;

requestHandler = new RequestHandler();
let url = requestHandler.fetchUrl(argv.title);
axios
  .get(url)
  .then(response => {
    console.log(response.data);
  })
  .catch(e => {
    console.log(e);
  });

const app = express();

app.get("/", (req, res) => {
  res.send("<h3>whatsup</h3>");
});

app.listen(3008);
