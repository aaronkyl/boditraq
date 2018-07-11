CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar,
  firstname varchar NOT NULL,
  lastname varchar NOT NULL,
  email varchar NOT NULL,
  password_hash varchar NOT NULL
);

CREATE TABLE body_measurements_cd (
  id serial PRIMARY KEY,
  body_measurement_literal varchar NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE measurement_units_cd (
  id serial PRIMARY KEY,
  literal varchar NOT NULL
);

CREATE TABLE user_measurement_sessions (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id) NOT NULL,
  sysdate date NOT NULL
);

CREATE TABLE user_body_measurements (
  id serial PRIMARY KEY,
  user_measurement_sessions_id integer REFERENCES user_measurement_sessions (id) NOT NULL,
  body_measurements_cd_id integer REFERENCES body_measurements_cd (id) NOT NULL,
  measurement numeric NOT NULL,
  units_id integer REFERENCES measurement_units_cd (id) NOT NULL
);

INSERT INTO body_measurements_cd VALUES (default, 'Weight', 1);
INSERT INTO body_measurements_cd VALUES (default, 'Waist', 5);
INSERT INTO body_measurements_cd VALUES (default, 'Bicep', 6);
INSERT INTO body_measurements_cd VALUES (default, 'Chest', 4);
INSERT INTO body_measurements_cd VALUES (default, 'Shoulders', 3);
INSERT INTO body_measurements_cd VALUES (default, 'Forearm', 7);                                                
INSERT INTO body_measurements_cd VALUES (default, 'Thigh', 8);                                                  
INSERT INTO body_measurements_cd VALUES (default, 'Calf', 9);
INSERT INTO body_measurements_cd VALUES (default, 'Neck', 2);
INSERT INTO measurement_units_cd VALUES (default, 'Imperial');
INSERT INTO measurement_units_cd VALUES (default, 'Metric');