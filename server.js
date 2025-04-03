const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Replace with your MySQL username
    password: 'm.Hertwig97.1.',  // Replace with your MySQL password
    database: 'RillaTCG'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.post('/login', (req, res) => {
    const { id, name } = req.body;
    if (!id || !name) {
        return res.status(400).json({ message: "Invalid Twitch data" });
    }

    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        if (results.length === 0) {
            db.query('INSERT INTO users (id, name, balance) VALUES (?, ?, 500)', [id, name], (err) => {
                if (err) return res.status(500).json({ message: "Failed to create user", error: err });
                return res.json({ message: "User created", id, name, balance: 500 });
            });
        } else {
            return res.json({ message: "User already exists", id, name, balance: results[0].balance });
        }
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});