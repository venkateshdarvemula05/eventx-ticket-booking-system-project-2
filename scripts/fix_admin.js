import mysql from 'mysql2';
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'venky', database: 'event_booking_db' });
db.query("UPDATE users SET email='admin@eventx.edu', password='admin123' WHERE role='admin'", (err) => {
  if (err) console.error(err);
  else console.log('Admin credentials fixed in MySQL!');
  process.exit();
});
