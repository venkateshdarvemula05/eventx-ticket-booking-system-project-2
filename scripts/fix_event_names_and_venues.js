import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'venky',
  database: 'event_booking_db'
});

db.connect();

// 1. Remove " - Veltech University" from event names
db.query(
  'UPDATE events SET name = REPLACE(name, " - Veltech University", "")',
  (err, result) => {
    if (err) console.error(err);
    else console.log(`Cleaned up names for ${result.affectedRows} events.`);

    // 2. Append ", Veltech University" to venues if not already present
    db.query(
      'UPDATE events SET venue = CONCAT(venue, ", Veltech University") WHERE venue NOT LIKE "%Veltech University%"',
      (err, result) => {
        if (err) console.error(err);
        else console.log(`Updated venues for ${result.affectedRows} events.`);
        db.end();
      }
    );
  }
);
