import mysql from 'mysql2';
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'venky', database: 'event_booking_db' });

// 1. Alter the role ENUM to support all front-end roles.
// 2. Add the department column so they don't lose the data they typed in!
db.query(
  "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'student', 'faculty') DEFAULT 'student';",
  (err1) => {
    if (err1) console.error('Error modifying role:', err1);
    
    db.query(
      "ALTER TABLE users ADD COLUMN department VARCHAR(255) NULL;",
      (err2) => {
        // Ignores error if column already exists
        if (err2 && err2.code !== 'ER_DUP_FIELDNAME') console.error('Error adding department:', err2);
        else console.log('Successfully updated users table schema!');
        
        process.exit();
      }
    );
  }
);
