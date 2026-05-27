-- 1. Create and use the database
USE event_booking_db;
CREATE DATABASE IF NOT EXISTS event_booking_db;
USE event_booking_db;

-- 2. Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- 3. Create the Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the Events Table matching your React Frontend structure
CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    event_date VARCHAR(50),
    event_time VARCHAR(50),
    end_time VARCHAR(50),
    venue VARCHAR(255),
    price DECIMAL(10, 2),
    total_tickets INT,
    available_tickets INT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at VARCHAR(100)
);

-- 5. Create the Bookings Table
CREATE TABLE bookings (
    id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(50),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    ticket_count INT,
    total_price DECIMAL(10, 2),
    created_at VARCHAR(100),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- INITIAL SETUP
-- --------------------------------------------------------

-- Insert only the primary Admin account (Change password as needed)
INSERT INTO users (name, email, password, role) VALUES 
('Admin Venky', 'admin@eventx.com', 'admin@123', 'admin');

SELECT * FROM users;
