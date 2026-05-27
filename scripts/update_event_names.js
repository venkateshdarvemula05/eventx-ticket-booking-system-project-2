import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'venky',
  database: 'event_booking_db'
});

db.connect();
db.query(
  'UPDATE events SET name = CONCAT(name, " - Veltech University") WHERE name NOT LIKE "%Veltech University%"',
  (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Updated ${result.affectedRows} events.`);
    }
    db.end();
  }
);
