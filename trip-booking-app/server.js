const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database (creates trip.db automatically)
const db = new sqlite3.Database('./trip.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

// Create tables and seed sample destinations
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT
    )`, () => {
        db.get(`SELECT COUNT(*) as count FROM destinations`, (err, row) => {
            if (row.count === 0) {
                const sampleTrips = [
                    ['Wayanad Hills Retreat', 'Wayanad, Kerala', 4500.00, 'Scenic green hills, waterfalls, and peaceful coffee plantation stays.'],
                    ['Goa Beach Getaway', 'Goa', 8000.00, 'Sun, sand, and vibrant beachside nightlife experience.'],
                    ['Munnar Tea Gardens', 'Munnar, Kerala', 5500.00, 'Misty mountains, endless green tea valleys, and cool weather.']
                ];
                const stmt = db.prepare(`INSERT INTO destinations (title, location, price, description) VALUES (?, ?, ?, ?)`);
                sampleTrips.forEach(trip => stmt.run(trip));
                stmt.finalize();
                console.log('Sample destinations seeded.');
            }
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination_id INTEGER,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        travel_date TEXT NOT NULL,
        guests INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destination_id) REFERENCES destinations(id)
    )`);
}

// API: Get all destinations
app.get('/api/destinations', (req, res) => {
    db.all(`SELECT * FROM destinations`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Create a new booking
app.post('/api/bookings', (req, res) => {
    const { destination_id, user_name, user_email, travel_date, guests } = req.body;

    if (!destination_id || !user_name || !user_email || !travel_date || !guests) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const query = `INSERT INTO bookings (destination_id, user_name, user_email, travel_date, guests) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [destination_id, user_name, user_email, travel_date, guests], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            message: 'Booking successful!', 
            bookingId: this.lastID 
        });
    });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running smoothly at http://localhost:${PORT}`);
});
