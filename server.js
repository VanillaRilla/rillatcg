const express = require('express');
const firebaseAdmin = require('firebase-admin');
const app = express();
const serviceAccount = require('C:/Users/mhert/OneDrive/Desktop/Key/serviceAccountKey.json'); // Path to your downloaded JSON file

// Initialize Firebase Admin
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});

const db = firebaseAdmin.firestore(); // You can also use firebaseAdmin.database() for Realtime Database

app.use(express.json());

app.post('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const { balance, inventory } = req.body; // Get balance and inventory from the request

    // Create or update user document in Firestore
    db.collection('users').doc(userId).set({
        balance: balance || 0, // Set balance (default to 0 if not provided)
        inventory: inventory || [] // Set inventory (default to empty array if not provided)
    })
        .then(() => {
            res.json({ message: 'User data created/updated successfully' });
        })
        .catch(error => {
            res.status(500).json({ message: 'Error creating/updating user data', error: error });
        });
});
app.post('/buyCard/:userId', (req, res) => {
    const userId = req.params.userId;
    const { cardId } = req.body; // Card ID to buy

    // Get user data
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userData = doc.data();
            let balance = userData.balance;
            const cardCost = 100; // Example card cost

            if (balance < cardCost) {
                return res.status(400).json({ message: 'Not enough points' });
            }

            // Deduct points from balance
            balance -= cardCost;

            // Update user data: balance and inventory
            const updatedInventory = [...userData.inventory, cardId]; // Add the card to the inventory

            // Update both balance and inventory
            db.collection('users').doc(userId).update({
                balance: balance,
                inventory: updatedInventory
            })
                .then(() => {
                    res.json({ message: 'Card purchased successfully' });
                })
                .catch(error => {
                    res.status(500).json({ message: 'Failed to update user data', error: error });
                });
        })
        .catch(error => {
            res.status(500).json({ message: 'Error fetching user data', error: error });
        });
});