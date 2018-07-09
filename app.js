const express = require('express');
const nunjucks = require('nunjucks');
const pgp = require('pg-promise')({});
const db = pgp({database: 'boditraq', user: 'postgres'});
const session = require('express-session');
const pbkdf2 = require('pbkdf2');
const body_parser = require('body-parser');
require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
let salt = process.env.SALT;

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

app.use(express.static('public'));
app.use(body_parser.urlencoded({extended: true}));
app.use(session({
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 3600000}
}));

app.use(passport.initialize());
app.use(passport.session());


// https://stackoverflow.com/questions/22078839/installing-passportjs-with-postgresql
passport.use(new LocalStrategy((username, password, done) => {
    console.log("Login process:", username);
    const password_hash = pbkdf2.pbkdf2Sync(password, salt, 1, 32, 'sha256');
    return db.one("SELECT id, username, firstname, lastname, email FROM users WHERE username=$1 AND password_hash=$2", [username.toLowerCase(), password_hash])
      .then((result)=> {
          console.log("SUCCESS: ", result);
          return done(null, result);
      })
      .catch((err) => {
        console.error("/login: " + err);
        return done(null, false, {message:'Wrong user name or password'});
      });
}));

passport.serializeUser((user, done)=>{
    console.log("serialize ", user);
    done(null, user.id);
});

passport.deserializeUser((id, done)=>{
    console.log("deserializeUser id: ", id);
    db.one("SELECT id, username, email FROM users " +
            "WHERE id = $1", [id])
    .then((user)=>{
      //log.debug("deserializeUser ", user);
      done(null, user);
    })
    .catch((err)=>{
        console.log("deserialize error: ", err);
      done(new Error(`User with the id ${id} does not exist`));
    });
  });

// https://stackoverflow.com/questions/18739725/how-to-know-if-user-is-logged-in-with-passport-js
function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// https://stackoverflow.com/questions/4587061/how-to-determine-if-object-is-in-array
function containsObject(objID, list) {
    let i;
    for (i = 0; i < list.length; i++) {
        if (list[i].session_id == objID) {
            return true;
        }
    }

    return false;
}

app.route('/')
    .get((req, resp) => {
        resp.render('index.html', {user: JSON.stringify(req.user)});
    })
    .post((req, resp) => resp.redirect('/'));
   
app.route('/login')
    .get((req, resp) => resp.render('login.html'))
    .post(passport.authenticate('local'), (req, resp) => {
        console.log("login post req.user info: ", req.user);
        resp.redirect('/dashboard');
    });  
    
app.route('/register')
    .get((req, resp) => resp.render('register.html', {}))
    .post((req, resp) => {
        let newRecord = {
            username: req.body.username.toLowerCase(), 
            firstname: req.body.firstname, 
            lastname: req.body.lastname, 
            email: req.body.email, 
            password_hash: pbkdf2.pbkdf2Sync(req.body.password, salt, 1, 32, 'sha256')};
        let insertQuery = 'INSERT INTO users VALUES (default, ${username}, ${firstname}, ${lastname}, ${email}, ${password_hash}) RETURNING id, username, email';
    
        db.result(insertQuery, newRecord)
        .then(data => {
            console.log('SUCCESS! ', data.rows[0]);
            return data.rows[0];
        })
        .then(user => {
            req.login(user, function(err) {
                if (err) {
                    console.log("register error: ", err);
                    resp.redirect('/register'); 
                } else {
                    console.log("logging user in ");
                    resp.redirect('/');
                }
            });
        })
        .catch(error => console.log('ERROR: ', error));
        
        resp.redirect('/');
    });

app.route('/dashboard')
    .get(loggedIn, (req, resp) => {
        const selectQuery = "\
            SELECT \
                sub.session_id, \
                sub.sysdate, \
                sub.record_count, \
                bmc.body_measurement_literal as literal, \
                bmc.sort_order, \
                ubm.measurement \
            FROM user_body_measurements ubm \
            INNER JOIN ( \
                SELECT ubm.user_measurement_sessions_id AS session_id, ums.sysdate, COUNT(*) as record_count \
                FROM user_body_measurements ubm \
                INNER JOIN user_measurement_sessions ums ON ums.id = ubm.user_measurement_sessions_id \
                WHERE ums.user_id = ${user_id} \
                GROUP BY ubm.user_measurement_sessions_id, ums.sysdate \
                ) sub on sub.session_id = ubm.user_measurement_sessions_id \
            INNER JOIN body_measurements_cd bmc ON bmc.id = ubm.body_measurements_cd_id";
        const queryParams = {user_id: req.user.id};
        db.any(selectQuery, queryParams)
        .then(sessions => {
            const allSessions = [];
            console.log("sessions: ", sessions);
            sessions.forEach(record => {
                console.log("record: ", record);
                if (!containsObject(record.session_id, allSessions)) {
                    allSessions.push({
                        session_id: record.session_id,
                        sysdate: record.sysdate,
                        record_count: record.record_count,
                        measurements: []
                    });
                }
                for (let i = 0; i < allSessions.length; i++) {
                    if (allSessions[i].session_id == record.session_id) {
                        allSessions[i].measurements.push(
                            { literal: record.literal, measurement: record.measurement }
                        );
                    }
                }
            });
            console.log("dashboard data: ", allSessions);
            resp.render('dashboard.html', {sessions: allSessions});
        })
        .catch(err => console.log("/dashboard error: ", err));
    });

app.route('/track')
    .get(loggedIn, (req,resp) => {
        db.any('SELECT * FROM body_measurements_cd')
        .then(data => {
            resp.render('track.html', {measurements: data});
        })
        .catch(err => console.log("/track error: ", err));
    })
    .post(loggedIn, (req, resp) => {
        db.one("INSERT INTO user_measurement_sessions VALUES (default, $1, $2) RETURNING id", [req.user.id, new Date()])
        .then(data => {
            let session_id = data.id;
            for (let prop in req.body) {
                if (req.body[prop]) {
                    db.query('INSERT INTO user_body_measurements \
                    VALUES (default, ${user_measurement_sessions_id}, ${body_measurements_cd_id}, ${measurement})',
                    { 
                        user_measurement_sessions_id: session_id,
                        body_measurements_cd_id: prop,
                        measurement: req.body[prop]
                    })
                    .catch(err => console.log("/track measurement insert error: ", err));
                }
            }
            
            resp.redirect('/dashboard');
        })
        .catch(err => console.log("/track session insert error: ", err));
    });

app.get('/account', (req, resp) => resp.redirect('/'));

app.route('/logout')
    .get((req, resp) => {
        req.logout();
        resp.redirect('/');
    });


const port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port 8080');
});