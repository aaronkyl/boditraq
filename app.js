const express = require('express');
const nunjucks = require('nunjucks');
const pgp = require('pg-promise')({});
// dev
// const db = pgp({database: 'boditraq', user: 'postgres'});
// prod
const db = pgp(process.env.DATABASE_URL);
const session = require('express-session');
const pbkdf2 = require('pbkdf2');
const body_parser = require('body-parser');
require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const AWS = require('aws-sdk');

const app = express();
let salt = process.env.SALT;

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});
//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
const  awsKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: awsKey,
    secretAccessKey: awsSecretKey
});

app.use(express.static('public'));
app.use(body_parser.urlencoded({extended: true}));
app.use(session({
  secret: process.env.SESSION_SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 3600000}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// adding to allow Passport data to be accessible in Nunjucks templates
// https://stackoverflow.com/a/19070292/6415693
app.use(function(req,resp,next){
    resp.locals.session = req.session;
    next();
});


// https://stackoverflow.com/questions/22078839/installing-passportjs-with-postgresql
passport.use(new LocalStrategy((username, password, done) => {
    console.log("Login process:", username);
    const password_hash = pbkdf2.pbkdf2Sync(password, salt, 1, 32, 'sha256');
    return db.one("SELECT id, username, firstname, lastname, email FROM users WHERE username=$1 AND password_hash=$2", [username.toLowerCase(), password_hash])
      .then((result)=> {
          return done(null, result);
      })
      .catch((err) => {
        console.error("/login: " + err);
        return done(null, false, {message:'Wrong user name or password'});
      });
}));

passport.serializeUser((user, done)=>{
    done(null, user.id);
});

passport.deserializeUser((id, done)=>{
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

function capitalize(s)
{
    return s[0].toUpperCase() + s.slice(1);
}

app.route('/')
    .get((req, resp) => {
        resp.render('index.html', {user: JSON.stringify(req.user)});
    })
    .post((req, resp) => resp.redirect('/'));
   
app.route('/login')
    .get((req, resp) => resp.render('login.html', {success: req.flash('success'), info: req.flash('info'), error: req.flash('error')}))
    .post((req, resp, next) => {
        passport.authenticate('local', function(err, user, info) {
            if (err) { 
                req.flash('error', info.message);
                resp.redirect('/login');
            }
            if (!user) {
                req.flash('error', info.message);
                resp.redirect('/login');
            }
            req.logIn(user, function(err) {
                if (err) { 
                    req.flash('error', info.message);
                    resp.redirect('/login');
                }
                resp.redirect('/dashboard');
            });
        })(req, resp, next);
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
        .catch(error => console.log('Register ERROR: ', error));
        
        resp.redirect('/');
    });

app.route('/dashboard')
    .get(loggedIn, (req, resp) => {
        //format measurement data based on units selection from the page - imp vs met
        let units = '';
        if (req.query.units) {
            units = capitalize(req.query.units);
        } else {
            units = 'Imperial';
        }
        const selectQuery = "\
            SELECT \
                sub.session_id, \
                sub.sysdate, \
                sub.record_count, \
                bmc.body_measurement_literal as literal, \
                bmc.sort_order, \
                ubm.measurement, \
                muc.literal as units_literal \
            FROM user_body_measurements ubm \
            INNER JOIN ( \
                SELECT ubm.user_measurement_sessions_id AS session_id, ums.sysdate, COUNT(*) as record_count \
                FROM user_body_measurements ubm \
                INNER JOIN user_measurement_sessions ums ON ums.id = ubm.user_measurement_sessions_id \
                WHERE ums.user_id = ${user_id} \
                GROUP BY ubm.user_measurement_sessions_id, ums.sysdate \
                ) sub on sub.session_id = ubm.user_measurement_sessions_id \
            INNER JOIN body_measurements_cd bmc ON bmc.id = ubm.body_measurements_cd_id \
            INNER JOIN measurement_units_cd muc ON muc.id = ubm.units_id \
            ORDER BY sub.session_id";
        const queryParams = {user_id: req.user.id};
        db.any(selectQuery, queryParams)
        .then(sessions => {
            const allSessions = [];
            sessions.forEach(record => {
                if (!containsObject(record.session_id, allSessions)) {
                    allSessions.push({
                        session_id: record.session_id,
                        sysdate: record.sysdate.toString().split(' ').splice(0,4).join(' '),
                        record_count: record.record_count,
                        measurements: new Array(9),
                        units: record.units_literal
                    });
                }
                for (let i = 0; i < allSessions.length; i++) {
                    if (allSessions[i].session_id == record.session_id) {
                        let measurement = 0;
                        if (units == 'Imperial' && allSessions[i].units == 'Metric') {
                            if (record.sort_order == 1) {
                                // kgs to lbs
                                measurement = parseFloat((record.measurement / 0.45359237).toFixed(1));
                            } else {
                                // cm to inches
                                measurement = parseFloat((record.measurement / 2.54).toFixed(1));
                            }
                        } else if (units == 'Metric' && allSessions[i].units == 'Imperial') {
                            if (record.sort_order == 1) {
                                // lbs to kg
                                measurement = parseFloat((record.measurement * 0.45359237).toFixed(1));
                            } else {
                                // inches to cm
                                measurement = parseFloat((record.measurement * 2.54).toFixed(1));
                            }
                        } else {
                            measurement = parseFloat((record.measurement * 1).toFixed(1));
                        }
                        allSessions[i].measurements[record.sort_order - 1] = measurement;
                    }
                }
            });
            return allSessions;
        })
        .then(sessions => {
            const allSessions = sessions;
            const measurementLiterals = [];
            const colors = ['#F00', '#FF8000', '#FF0', '#0F0', '#0FF', '#0080FF', '#7F00FF', '#F0F', '#FFF'];
            
            db.query("SELECT * FROM body_measurements_cd ORDER BY sort_order")
            .then(data => {
                for (let i = 0, l = data.length; i < l; i++) {
                    measurementLiterals.push(data[i].body_measurement_literal.toUpperCase());
                }
            })
            .then(() => {
                // **********
                // chart data creation
                
                const xAxesValues = [];
                const dataSetsData = new Array(measurementLiterals.length).fill(0).map(x => new Array());

                allSessions.forEach(session => {
                    xAxesValues.push(session.sysdate);
                    for (let i = 0, l = session.measurements.length; i < l; i++) {
                        dataSetsData[i].push(session.measurements[i]);                    }
                });
                
                const datasets = [];
                
                for (let i = 0, l = dataSetsData.length; i < l; i++) {
                    let obj = {
                        label: measurementLiterals[i],
                        borderColor: colors[i],
                        backgroundColor: colors[i],
                        fill: false,
                        data: dataSetsData[i]
                    }
                    if (i==0) {
                        obj['yAxisID'] = 'y-axis-weight';
                    } else {
                        obj['yAxisID'] = 'y-axis-length';
                    }
                    datasets.push(obj);
                }
                
                console.log(datasets);
                
                const chartData = {
                    labels: xAxesValues,
                    datasets: datasets
                };
                // **********
                resp.render('dashboard.html', {sessions: allSessions, measurementLiterals: measurementLiterals, units: units, chartData: JSON.stringify(chartData)});
            })
            .catch(err => console.log("/dashboard error2: ", err));
        })
        .catch(err => {
            console.log("/dashboard error: ", err);
            req.flash('error', 'You must be logged in to access this page');
            resp.redirect('/login');
        });
    });

app.route('/track')
    .get(loggedIn, (req,resp) => {
        let unitsOfMeasure = '';
        if (req.query.units && req.query.units == 2) {
            unitsOfMeasure = "Metric";
        } else {
            unitsOfMeasure = "Imperial";   
        }
        
        console.log(req.query.units, unitsOfMeasure);
        db.any('SELECT * FROM body_measurements_cd ORDER BY sort_order')
        .then(data => {
            db.any('SELECT * FROM measurement_units_cd')
            .then(units => {
                resp.render('track.html', {measurements: data, units: units, unitsOfMeasure: unitsOfMeasure});
            })
            .catch(err => console.log("/track units error: ", err));
        })
        .catch(err => console.log("/track error: ", err));
    })
    .post(loggedIn, (req, resp) => {
        let user_date = req.body.user_date.split(' ').splice(1, 3).join(' ');
        db.one("INSERT INTO user_measurement_sessions VALUES (default, $1, $2) RETURNING id", [req.user.id, user_date])
        .then(data => {
            let session_id = data.id;
            let units_id = parseInt(req.body.measurement_units, 10);
            console.log(units_id, typeof units_id);
            for (let prop in req.body) {
                if (req.body[prop]) {
                    db.query('INSERT INTO user_body_measurements \
                    VALUES (default, ${user_measurement_sessions_id}, ${body_measurements_cd_id}, ${measurement}, ${units_id})',
                    { 
                        user_measurement_sessions_id: session_id,
                        body_measurements_cd_id: prop,
                        measurement: req.body[prop],
                        units_id: units_id
                    })
                    .catch(err => console.log("/track measurement insert error: ", err));
                }
            }
            
            resp.redirect('/dashboard');
        })
        .catch(err => console.log("/track session insert error: ", err));
    });

app.route('/account')
    .get(loggedIn, (req, resp) => {
        db.one("SELECT firstname, lastname, email, password_hash FROM users WHERE id = $1", [req.session.passport.user])
        .then(data => {
            resp.render('account.html', {userinfo: data, success: req.flash('success'), info: req.flash('info'), error: req.flash('error')});
        })
        .catch((err) => {
            console.log("account", err);
            resp.redirect('/login');
        });
    });

app.route('/rename')
    .post(loggedIn, (req, resp) => {
        db.none("\
            UPDATE users \
            SET firstname = ${firstname}, \
                lastname = ${lastname} \
            WHERE id = ${user_id}", { 
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            user_id: req.session.passport.user
        })
        .then(() => {
            req.flash('success', 'Name updated');
            resp.redirect('/account');
        })
        .catch(err => console.log("rename error: ", err));
    });

app.route('/change_password')
    .post(loggedIn, (req, resp) => {
        if (req.body.password == req.body.password_confirm) {
            let new_hash = pbkdf2.pbkdf2Sync(req.body.password, salt, 1, 32, 'sha256');
            db.none("\
                UPDATE users \
                SET password_hash = ${new_hash} \
                WHERE id = ${user_id}", { 
                new_hash: new_hash,
                user_id: req.session.passport.user
            })
            .then(() => {
                req.flash('success', 'Password changed');
                resp.redirect('/account');
            })
            .catch(err => console.log("rename error: ", err));
        } else {
            req.flash('error', 'Password entries must match');
            resp.redirect('/account');
        }
    });
    
app.route('/reset_password')
    .get((req, resp) => resp.render('reset_password.html'))
    .post(loggedIn, (req, resp, next) => {
        const new_password = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
        const new_hash = pbkdf2.pbkdf2Sync(new_password, salt, 1, 32, 'sha256');
        const email = req.body.email;
        db.none("\
            UPDATE users \
            SET password_hash = ${new_hash} \
            WHERE email = ${email}", {
            new_hash: new_hash, 
            email: email
        })
        .then(() => {
            //email new password to user
            
            var params = {
              Destination: { /* required */
                CcAddresses: [],
                ToAddresses: ['aaronwilkinson@gmail.com']
              },
              Message: { /* required */
                Body: { /* required */
                  Html: {
                   Charset: "UTF-8",
                   Data: "Your <a href='http://www.boditraq.com'>BodiTraq</a> password has been reset to " + new_password +". \n\
                          You can change it using the Account page once you log in."
                  },
                  Text: {
                   Charset: "UTF-8",
                   Data: "Your BodiTraq password has been reset to " + new_password +". \n\
                          You can change it using the Account page once you log in."
                  }
                 },
                 Subject: {
                  Charset: 'UTF-8',
                  Data: 'BodiTraq Password Reset'
                 }
                },
              Source: 'aaronwilkinson@gmail.com', /* required */
              ReplyToAddresses: [
                  'aaronwilkinson@gmail.com'
              ],
            };       
            
            // Create the promise and SES service object
            var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
            
            // Handle promise's fulfilled/rejected states
            sendPromise.then(
              function(data) {
                console.log("reset email sent ", data.MessageId);
              }).catch(
                function(err) {
                console.error(err, err.stack);
              });
        })
        .then(() => {
            req.flash('success', 'New password has been emailed to you');
            resp.redirect('/login');
        })
        .catch(err => {
            console.log('password reset error', err);
            next(err);
        });
    });

app.route('/logout')
    .get((req, resp) => {
        req.logout();
        resp.redirect('/');
    });

app.route('/*')
    .get((req, resp) => resp.redirect('/'));


const port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port ', port);
});