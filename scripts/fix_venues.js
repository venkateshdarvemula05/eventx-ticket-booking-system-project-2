import mysql from 'mysql2';
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'venky', database: 'event_booking_db' });

db.query(
  "UPDATE events SET venue = REPLACE(venue, 'GITAM', 'VELTECH'), venue = REPLACE(venue, 'Central Campus', 'VELTECH University'), venue = REPLACE(venue, 'Research Block, VELTECH University', 'Research Block'), venue = REPLACE(venue, 'Research Block', 'Research Block, VELTECH University');",
  (err) => {
    if (err) console.error(err);
    else console.log('Successfully updated venues to VELTECH University in database!');
    process.exit();
  }
);
