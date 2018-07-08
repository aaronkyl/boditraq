const express = require('express');
const nunjucks = require('nunjucks');
var pgp = require('pg-promise')({});
var db = pgp({database: 'boditraq', user: 'postgres'});

const app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

app.use(express.static('public'));

app.get('/', (req, resp) => {
    resp.render("index.html", {});
});

app.get('/dashboard', (req, resp) => resp.redirect("/"));

app.get('/track', (req,resp) => {
    var newRecord = {
        username: 'akw2', 
        firstname: 'aaron', 
        lastname: 'wilkinson', 
        email: 'email@email.com', 
        password_hash: '123'};
    var insertQuery = 'INSERT INTO users VALUES (${username}, ${firstname}, ${lastname}, ${email}, ${password_hash})';

    db.result(insertQuery, newRecord)
    .then(data => console.log("SUCCESS! ", data))
    .catch(error => console.log("ERROR: ", error));
    
    resp.redirect("/");
});

app.get('/account', (req, resp) => resp.redirect("/"));

app.get('/logout', (req, resp) => resp.redirect("/"));

app.listen(8080, function() {
    console.log("Listening on port 8080");
});