const express = require('express');
const nunjucks = require('nunjucks');

const app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

app.get('/', (req, resp) => {
    resp.render("index.html", {});
});

app.listen(8080, function() {
    console.log("Listening on port 8080");
});