import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'venky',
  database: 'event_booking_db'
});

const users = [
  { name: 'Admin Veltech', email: 'admin@eventx.com', phone: '9000000001' },
  { name: 'Ram', email: 'ram@example.com', phone: '9000000002' },
  { name: 'Darvemula Venkatesh', email: 'venkateshdarvemula05@gmail.com', phone: '9000000003' },
  { name: 'Ramsai Pendela', email: 'ramsaipendela12@gmail.com', phone: '9000000004' }
];

async function reseed() {
  db.connect();

  console.log('1. Deleting all tickets (bookings)...');
  await new Promise((resolve, reject) => {
    db.query('DELETE FROM bookings', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('2. Resetting available tickets for all events...');
  await new Promise((resolve, reject) => {
    db.query('UPDATE events SET available_tickets = total_tickets', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('3. Getting all events...');
  const events = await new Promise((resolve, reject) => {
    db.query('SELECT * FROM events', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  console.log(`4. Creating 1 booking per user across ${events.length} events...`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Pick a random event for this user
    const event = events[Math.floor(Math.random() * events.length)];
    
    const bookingId = `BOK-${Date.now()}-${event.id.substring(0, 5)}-${i}`;
    const createdAt = new Date().toISOString();
    const ticketsToBook = Math.floor(Math.random() * 2) + 1; // 1 or 2 tickets
    const totalPrice = (event.price * ticketsToBook).toFixed(2);

    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO bookings (id, event_id, user_name, user_email, user_phone, ticket_count, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [bookingId, event.id, user.name, user.email, user.phone, ticketsToBook, totalPrice, createdAt],
        (err) => {
          if (err) reject(err);
          else {
            // Update available tickets
            db.query(
              'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
              [ticketsToBook, event.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }
        }
      );
    });
    console.log(`- Booked ${ticketsToBook} ticket(s) for "${event.name}" by ${user.name}`);
  }

  console.log('Reseeding completed successfully!');
  db.end();
}

reseed().catch(err => {
  console.error('Error during reseeding:', err);
  if (db) db.end();
});
