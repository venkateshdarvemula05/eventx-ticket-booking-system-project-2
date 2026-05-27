import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

dotenv.config();

const app = express();

// ── In-memory OTP store ───────────────────────────────────
// { email: { otp, expiresAt } }
const otpStore = {};

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'venky',
  database: process.env.DB_NAME || 'event_booking_db'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL: event_booking_db');
});

// LOGIN
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const user = results[0];
    delete user.password;
    res.json({ success: true, user });
  });
});

// REGISTER
app.post('/api/register', (req, res) => {
  const { name, email, password, role, department } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    if (results.length > 0) return res.status(400).json({ success: false, error: 'User exists' });
    const userRole = role || 'student';
    db.query(
      'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, userRole, department],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, user: { id: result.insertId, name, email, role: userRole, department } });
      }
    );
  });
});

// CHECK IF ADMIN EXISTS
app.get('/api/admin/exists', (req, res) => {
  db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    res.json({ success: true, exists: results.length > 0 });
  });
});

// UPDATE ADMIN PASSWORD (requires old password verification)
app.post('/api/admin/update-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  db.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ success: false, error: 'No admin account found.' });
    const admin = results[0];
    if (admin.password !== oldPassword) {
      return res.status(401).json({ success: false, error: 'Incorrect old admin password.' });
    }
    db.query("UPDATE users SET password = ? WHERE role = 'admin'", [newPassword], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Admin password updated successfully.' });
    });
  });
});


// EVENTS
app.get('/api/events', (req, res) => {
  db.query('SELECT * FROM events ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, events: results });
  });
});

app.post('/api/events', (req, res) => {
  const { id, name, department, date, time, endTime, venue, price, totalTickets, description } = req.body;
  db.query(
    'INSERT INTO events (id, name, department, event_date, event_time, end_time, venue, price, total_tickets, available_tickets, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, department, date, time, endTime, venue, price, totalTickets, totalTickets, description, 'active', new Date().toISOString()],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Event created' });
    }
  );
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, department, date, time, endTime, venue, price, totalTickets, availableTickets, description } = req.body;
  db.query(
    'UPDATE events SET name=?, department=?, event_date=?, event_time=?, end_time=?, venue=?, price=?, total_tickets=?, available_tickets=?, description=? WHERE id=?',
    [name, department, date, time, endTime, venue, price, totalTickets, availableTickets, description, id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Event updated' });
    }
  );
});

app.delete('/api/events/:id', (req, res) => {
  db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Event deleted' });
  });
});

// BOOKINGS
app.get('/api/bookings', (req, res) => {
  db.query('SELECT * FROM bookings ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const mapped = results.map(b => ({ ...b, attendee_names: b.attendee_names ? JSON.parse(b.attendee_names) : null }));
    res.json({ success: true, bookings: mapped });
  });
});

app.post('/api/bookings', (req, res) => {
  const { id, eventId, name, email, phone, ticketsBooked, totalPrice, attendeeNames } = req.body;
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    db.query('SELECT available_tickets FROM events WHERE id = ?', [eventId], (err, results) => {
      if (err || results.length === 0) return db.rollback(() => res.status(404).json({ success: false, error: 'Event not found' }));
      if (results[0].available_tickets < ticketsBooked) return db.rollback(() => res.status(400).json({ success: false, error: 'Sold out' }));
      
      const attendeeJson = attendeeNames && attendeeNames.length > 0 ? JSON.stringify(attendeeNames) : null;
      db.query(
        'INSERT INTO bookings (id, event_id, user_name, user_email, user_phone, ticket_count, total_price, attendee_names, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, eventId, name, email, phone, ticketsBooked, totalPrice, attendeeJson, new Date().toISOString()],
        (err) => {
          if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
          db.query('UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?', [ticketsBooked, eventId], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
            db.commit(err => {
              if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
              
              // Email Logic
              const isFake = email.endsWith('@example.com') || email.endsWith('@eventx.com');
              if (!isFake && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
                const attendeeList = attendeeNames && attendeeNames.length > 0 
                  ? `<li><strong>Attendees:</strong> ${[name, ...attendeeNames].join(', ')}</li>`
                  : `<li><strong>Attendee:</strong> ${name}</li>`;

                QRCode.toDataURL(id, { margin: 1 }, (err, qrUrl) => {
                  if (err) return;
                  transporter.sendMail({
                    from: '"EventX Veltech University" <no-reply@veltech.edu.in>',
                    to: email,
                    subject: `Booking Confirmed - Ticket ID: ${id}`,
                    html: `
                      <div style="background-color: #050505; padding: 50px 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
                        <div style="padding: 40px; background: #0a0a12; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: none;">
                          <div style="text-align: center; margin-bottom: 35px;">
                            <div style="background: #ffffff; padding: 15px 30px; border-radius: 60px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
                              <img src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" alt="Logo" style="width: 180px; height: auto; display: block;" />
                            </div>
                            <div style="background: #1a237e; padding: 18px; border-radius: 12px; margin-top: 25px;">
                              <h2 style="color: #ffd600; margin: 0; font-size: 1.6em; letter-spacing: 0.5px;">Booking Confirmed</h2>
                              <p style="color: #ffffff; margin: 5px 0 0; font-size: 0.9em; opacity: 0.8; font-weight: 500;">Veltech University - EventX Portal</p>
                            </div>
                          </div>
                          <div style="text-align: center; margin-bottom: 30px; background: rgba(255,255,255,0.02); padding: 25px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                            <img src="cid:qrcode" style="width: 180px; height: 180px; border-radius: 10px;" />
                            <p style="font-size: 1rem; color: #ffd600; margin-top: 15px; font-weight: 600;">Scan this at the entrance</p>
                          </div>
                          <h3 style="color: #ffd600; font-size: 1.4em;">Hello ${name},</h3>
                          <p style="font-size: 1.1rem; line-height: 1.6; color: #e0e0e0;">Your seat has been reserved! Here are your booking details:</p>
                          <ul style="line-height: 2; list-style: none; padding: 0; font-size: 1.1rem;">
                            <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;"><strong>Booking ID:</strong> <span style="color: #ffd600;">${id}</span></li>
                            <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;">${attendeeList.replace('<li>', '').replace('</li>', '')}</li>
                            <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;"><strong>Tickets:</strong> ${ticketsBooked}</li>
                            <li style="padding: 10px 0;"><strong>Total Amount:</strong> ₹${totalPrice}</li>
                          </ul>
                          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <p style="color: #ffd600; font-weight: 600; font-size: 1.1rem; margin-bottom: 10px;">See you at the event!</p>
                            <p style="color: #aaa; font-size: 0.95rem; line-height: 1.5;">Thank you for participating in Veltech University events!</p>
                          </div>
                        </div>
                      </div>
                    `,
                    attachments: [{ filename: 'qrcode.png', path: qrUrl, cid: 'qrcode' }]
                  });
                });
              }
              res.json({ success: true, message: 'Booked' });
            });
          });
        }
      );
    });
  });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const initiatedBy = req.query.initiatedBy || 'admin';
  db.beginTransaction(err => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    db.query('SELECT event_id, ticket_count, user_email, user_name, total_price, attendee_names FROM bookings WHERE id = ?', [id], (err, results) => {
      if (err || results.length === 0) return db.rollback(() => res.status(404).json({ success: false, error: 'Not found' }));
      const { event_id, ticket_count, user_email, user_name, total_price, attendee_names } = results[0];
      db.query('DELETE FROM bookings WHERE id = ?', [id], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
        db.query('UPDATE events SET available_tickets = LEAST(total_tickets, available_tickets + ?) WHERE id = ?', [ticket_count, event_id], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
          db.commit(err => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, error: err.message }));
            
            // Cancellation Email
            const isFake = user_email.endsWith('@example.com') || user_email.endsWith('@eventx.com');
            if (!isFake && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
              const msg = initiatedBy === 'user' ? 'You have successfully cancelled your booking.' : 'Your booking is cancelled by administration.';
              const hdr = initiatedBy === 'user' ? 'Booking Cancelled Successfully' : 'Booking Cancelled by Admin';
              
              const names = attendee_names ? JSON.parse(attendee_names) : [];
              const attendeeList = names.length > 0 
                ? `<li><strong>Attendees:</strong> ${[user_name, ...names].join(', ')}</li>`
                : `<li><strong>Attendee:</strong> ${user_name}</li>`;

              transporter.sendMail({
                from: '"EventX Veltech University" <no-reply@veltech.edu.in>',
                to: user_email,
                subject: `${hdr} - ${id}`,
                html: `
                  <div style="background-color: #050505; padding: 50px 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
                    <div style="padding: 40px; background: #0a0a12; border-radius: 20px; max-width: 520px; margin: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border: none;">
                      <div style="text-align: center; margin-bottom: 35px;">
                        <div style="background: #ffffff; padding: 15px 30px; border-radius: 60px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
                          <img src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" style="width: 180px; height: auto; display: block;" />
                        </div>
                        <div style="background: #ef4444; padding: 18px; border-radius: 12px; margin-top: 25px;">
                          <h2 style="color: white; margin: 0; font-size: 1.6em; letter-spacing: 0.5px;">${hdr}</h2>
                          <p style="color: white; margin: 5px 0 0; font-size: 0.9em; opacity: 0.9;">Veltech University - EventX Portal</p>
                        </div>
                      </div>
                      <h3 style="color: #ef4444; font-size: 1.4em;">Hello ${user_name},</h3>
                      <p style="font-size: 1.1rem; line-height: 1.6; color: #e0e0e0;">${msg}</p>
                      <ul style="line-height: 2; list-style: none; padding: 0; font-size: 1.1rem; margin-top: 20px;">
                        <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;"><strong>Booking ID:</strong> <span style="color: #ef4444;">${id}</span></li>
                        <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;">${attendeeList.replace('<li>', '').replace('</li>', '')}</li>
                        <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;"><strong>Tickets:</strong> ${ticket_count}</li>
                        <li style="padding: 10px 0;"><strong>Refund:</strong> ₹${total_price}</li>
                      </ul>
                      <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                        <p style="color: #ffffff; font-size: 1.1rem; margin-bottom: 15px; font-weight: 500;">We apologize for any inconvenience caused on our side.</p>
                        <p style="color: #aaa; font-size: 0.95rem; line-height: 1.5;">We hope to see you at our future events. Your refund has been automatically initiated and will be credited to your original payment method within 2-3 business days.</p>
                      </div>
                    </div>
                  </div>
                `
              });
            }
            res.json({ success: true, message: 'Cancelled' });
          });
        });
      });
    });
  });
});

// ── OTP: SEND ─────────────────────────────────────────────
app.post('/api/otp/send', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 1 * 60 * 1000; // 1 minute (Updated from 5m)
  otpStore[email] = { otp, expiresAt };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // Dev mode: log OTP to console
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return res.json({ success: true, message: 'OTP sent (dev mode — check console)' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  transporter.sendMail({
    from: '"EventX Veltech University" <no-reply@veltech.edu.in>',
    to: email,
    subject: `Your EventX OTP: ${otp}`,
    html: `
      <div style="background:#050505;padding:50px 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff;">
        <div style="padding:40px;background:#0a0a12;border-radius:20px;max-width:480px;margin:auto;box-shadow:0 25px 50px rgba(0,0,0,0.5);">
          <div style="text-align:center;margin-bottom:30px;">
            <div style="background:#fff;padding:12px 24px;border-radius:60px;display:inline-block;">
              <img src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" alt="Logo" style="width:160px;height:auto;display:block;" />
            </div>
            <div style="background:#1a237e;padding:16px;border-radius:12px;margin-top:20px;">
              <h2 style="color:#ffd600;margin:0;font-size:1.4em;">Email Verification</h2>
              <p style="color:#fff;margin:4px 0 0;font-size:0.85em;opacity:0.8;">EventX — Veltech University</p>
            </div>
          </div>
          <p style="font-size:1rem;color:#e0e0e0;line-height:1.6;margin-bottom:10px;">Your One-Time Password (OTP) is:</p>
          <div style="text-align:center;margin:24px 0;">
            <span style="font-size:2.8rem;font-weight:900;letter-spacing:14px;color:#ffd600;background:rgba(255,214,0,0.08);padding:18px 28px;border-radius:14px;border:1px solid rgba(255,214,0,0.25);display:inline-block;">${otp}</span>
          </div>
          <p style="font-size:0.85rem;color:#aaa;text-align:center;line-height:1.5;">This OTP is valid for <strong style="color:#fff;">1 minute</strong>. Do not share it with anyone.</p>
          <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#aaa;font-size:0.8rem;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      </div>
    `
  }, (err) => {
    if (err) {
      console.error('OTP email error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
    }
    res.json({ success: true, message: 'OTP sent to your email' });
  });
});

// ── OTP: VERIFY ───────────────────────────────────────────
app.post('/api/otp/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
  }
  if (record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, error: 'Incorrect OTP. Please try again.' });
  }

  delete otpStore[email]; // consume the OTP
  res.json({ success: true, message: 'Email verified successfully!' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));

