CREATE TABLE users (
  username varchar PRIMARY KEY,
  firstname varchar NOT NULL,
  lastname varchar NOT NULL,
  email varchar NOT NULL,
  password_hash varchar NOT NULL
);

CREATE TABLE body_measurements_cd (
  id serial PRIMARY KEY,
  body_measurement_name varchar NOT NULL
);

CREATE TABLE user_body_measurements (
  id serial PRIMARY KEY,
  username varchar REFERENCES users (username) NOT NULL,
  body_measurements_cd_id integer REFERENCES body_measurements_cd (id) NOT NULL,
  measurement numeric NOT NULL,
  datetime date NOT NULL
);

-- INSERT INTO restaurant VALUES (DEFAULT, 'Moon Tower', '123 Main St', 'american');
-- INSERT INTO restaurant VALUES (DEFAULT, 'Moon Tower', '123 Main St', 'american');
-- INSERT INTO restaurant VALUES (DEFAULT, 'Chuck E Cheese', '1980 Third St', 'italian');
-- INSERT INTO restaurant VALUES (DEFAULT, 'Hamburger Marys', '333 Third St', 'american');
-- INSERT INTO restaurant VALUES (DEFAULT, 'Hanks Place', '19 Almeada Dr', 'BBQ');
-- INSERT INTO restaurant VALUES (DEFAULT, 'Starbucks', '1590 Yale St', 'coffee');
-- INSERT INTO reviewer VALUES (DEFAULT, 'Aaron Wilkinson', 'aaron@aaron.aaron', 7);
-- INSERT INTO reviewer VALUES (DEFAULT, 'Mary Maryson', 'mary@aaron.aaron', 1);
-- INSERT INTO reviewer VALUES (DEFAULT, 'Henry T. Cat', 'heeners@gmail.com', 6);
-- INSERT INTO reviewer VALUES (DEFAULT, 'Beberly Williamson', 'beb@beb.edu', 4);
-- INSERT INTO reviewer VALUES (DEFAULT, 'Nicole Wilkinson', 'nicole@yahoo.com', 6);
-- INSERT INTO reviewer VALUES (DEFAULT, 'That One Guy', NULL, NULL);
-- INSERT INTO review VALUES (DEFAULT, 'YUM!', 'SO GOOD YUM YUM', 5, 2, 3);
-- INSERT INTO review VALUES (DEFAULT, 'YUM!', 'SO GOOD YUM YUM', 5, 2, 3);
-- INSERT INTO review VALUES (DEFAULT, 'MEH', 'It was OK', 3, 2, 4);
-- INSERT INTO review VALUES (DEFAULT, 'WOWZA!', 'DELICIOUS', 4, 3, 3);
-- INSERT INTO review VALUES (DEFAULT, 'Avoid this place', 'Major food poisoning', 0, 4, 5);
-- INSERT INTO review VALUES (DEFAULT, 'Testing', 'Just testing things out here', 2, 5, 4);
-- INSERT INTO review VALUES (DEFAULT, 'Bored', 'Uninspired flavor combinations', 1, 4, 3);
-- INSERT INTO review VALUES (DEFAULT, 'It was alright', 'Nothing exciting', 3, 6, 2);