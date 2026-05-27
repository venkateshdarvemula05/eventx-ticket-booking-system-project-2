import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'venky',
  database: 'event_booking_db'
});

const user = {
  name: 'Darvemula Venkatesh',
  email: 'venkateshdarvemula05@gmail.com',
  phone: '9876543210' // Dummy phone
};

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Management', 'Arts'];
const venues = ['Auditorium A', 'Main Hall', 'Conference Room 1', 'Open Grounds', 'Seminar Hall'];

const events = [
  { name: 'AI & ML Workshop', description: 'Deep dive into Artificial Intelligence and Machine Learning.' },
  { name: 'Web Dev Bootcamp', description: 'Master Full Stack Web Development in 3 days.' },
  { name: 'Cyber Security Summit', description: 'Latest trends in information security and ethical hacking.' },
  { name: 'Cloud Computing Expo', description: 'Explore AWS, Azure and Google Cloud technologies.' },
  { name: 'Data Science Seminar', description: 'Understanding big data and its applications.' },
  { name: 'Robotics Challenge', description: 'Design and build your own autonomous robots.' },
  { name: 'UI/UX Design Masterclass', description: 'Create stunning user interfaces and experiences.' },
  { name: 'Blockchain Symposium', description: 'The future of decentralized finance and web3.' },
  { name: 'IoT Innovation Fair', description: 'Connecting the world with smart devices.' },
  { name: 'Digital Marketing Workshop', description: 'Growth hacking and social media strategies.' },
  { name: 'Start-up Pitch Fest', description: 'Pitch your ideas to top-tier investors.' },
  { name: 'Mobile App Hackathon', description: '24-hour coding challenge for mobile platforms.' },
  { name: 'Ethical Hacking Lab', description: 'Hands-on session on penetration testing.' },
  { name: 'Quantum Computing Intro', description: 'Basics of quantum bits and algorithms.' },
  { name: 'Game Development Jam', description: 'Build your first game using Unity or Unreal Engine.' }
];

async function seed() {
  db.connect();

  console.log('Seeding 15 events and bookings...');

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventId = `EVT-${Date.now()}-${i}`;
    const date = `2026-05-${10 + i}`;
    const time = '10:00 AM';
    const endTime = '04:00 PM';
    const dept = departments[i % departments.length];
    const venue = venues[i % venues.length];
    const price = (50 + i * 10).toFixed(2);
    const totalTickets = 100;
    const createdAt = new Date().toISOString();

    // Insert Event
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO events (id, name, department, event_date, event_time, end_time, venue, price, total_tickets, available_tickets, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [eventId, event.name, dept, date, time, endTime, venue, price, totalTickets, totalTickets - 1, event.description, 'active', createdAt],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Insert Booking for the user
    const bookingId = `BOK-${Date.now()}-${i}`;
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO bookings (id, event_id, user_name, user_email, user_phone, ticket_count, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [bookingId, eventId, user.name, user.email, user.phone, 1, price, createdAt],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Added event and booking for: ${event.name}`);
  }

  console.log('Seeding completed!');
  db.end();
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  if (db) db.end();
});
