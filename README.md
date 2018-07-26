# boditraq
[boditraq.com](http://www.boditraq.com)

App to track physical changes associated with working out and/or diet changes

[Trello Board](https://trello.com/b/EH6yh3eK/boditraq)

To set up database in Heroku
cat database_files/setup.sql | heroku pg:psql


### Things I learned in this project

- Increased my understanding of data manipulation outside of a database. Putting data into the db and getting it back out is easy, but figuring out how to clean it up and/or format it to work on the frontend was a brain teaser. This was especially true with organizing the data for the graph since the user can leave measurement fields blank, thus allowing each session to potentially have different numbers and types of measurments in the db.
- Strengthened my understanding of sessions
- Grasped the workings of Passport.js


### Issues faced during this project

- Passport.js made me want to rip my hair out. I had a very hard time figuring out how to tie it to my PostgreSQL database, and the fact that most online help talks about using it with MongoDB just led me down useless rabbit holes. After a short mental break (read: a nap with my cat) I was able to finally grasp how to tie it all together and even include callbacks to ensure only logged-in users could access specific pages and functionalities.
- Putting data into and getting data out of databases is easy, but manipulating records when the number of records per session per user is variable was a bit of a brain twister. Arrays of objects of arrays of objects can get a bit complicated.


### Unresolved project items

- The code is messy and needs to be cleaned up and split into smaller functions (similar to my AHK scripts)
- The site is completely mobile unfriendly 
- I would like to rebuild the entire thing using React with simple API calls
- I would like to combine this app with my old CS50 app to create an all-in-one fitness tracking app
  - Add food tracking? Calorie tracking?
  - Add group functionality for "Biggest Loser" type scenarios?
