const express = require('express');
const mysql = require('mysql2');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Replace with your MySQL username
    password: 'm.Hertwig97.1.',  // Replace with your MySQL password
    database: 'RillaTCG'  // Replace with your database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
});

// Example route to get user balance
app.get('/balance/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT balance FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json({ balance: results[0].balance });
    });
});

// Example route to update user balance
app.post('/balance/:userId', (req, res) => {
    const userId = req.params.userId;
    const { amount } = req.body; // Amount to update
    db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.json({ message: 'Balance updated successfully' });
    });
});

// Example route to buy a card
app.post('/buyCard/:userId', (req, res) => {
    const userId = req.params.userId;
    const { cardId } = req.body; // Card ID to buy

    // Logic to deduct points and update inventory
    db.query('SELECT balance FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ message: 'User not found' });
        }

        let balance = results[0].balance;
        const cardCost = 100; // Example card cost

        if (balance < cardCost) {
            return res.status(400).json({ message: 'Not enough points' });
        }

        // Deduct points from balance
        db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [cardCost, userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to update balance' });
            }

            // Add the card to the inventory
            db.query('INSERT INTO inventory (user_id, card_id) VALUES (?, ?)', [userId, cardId], (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to add card to inventory' });
                }
                res.json({ message: 'Card purchased successfully' });
            });
        });
    });
});

// Set the server to listen on a port
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});