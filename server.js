
const serviceAccount = require('C:/Users/mhert/OneDrive/Desktop/Key/serviceAccountKey.json'); // Path to your downloaded JSON file
const express = require('express');
const passport = require('passport');
const TwitchStrategy = require('passport-twitch').Strategy;
const firebaseAdmin = require('firebase-admin');
const session = require('express-session');

// Initialize Firebase Admin
const serviceAccount = require('C:/Users/mhert/OneDrive/Desktop/Key');
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});
const db = firebaseAdmin.firestore();

// Initialize Express
const app = express();

// Use sessions to keep track of the logged-in user
app.use(session({ secret: 'your_secret_key', resave: true, saveUninitialized: true }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Twitch Authentication
passport.use(new TwitchStrategy({
    clientID: 'sh11hwnsgw6eoeen8h17jpc99pn2wc',
    callbackURL: 'http://localhost:3000/auth/twitch/callback',
},
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

// Serialize and Deserialize user to maintain session
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Route to start the Twitch authentication process
app.get('/auth/twitch', passport.authenticate('twitch'));

// Route to handle the callback from Twitch
app.get('/auth/twitch/callback',
    passport.authenticate('twitch', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);

// Route to display the profile and user data
app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }

    const userId = req.user.id;

    // Fetch user data from Firebase
    db.collection('users').doc(userId).get().then(doc => {
        if (!doc.exists) {
            // If user doesn't exist in DB, create a new entry
            db.collection('users').doc(userId).set({
                username: req.user.displayName,
                credits: 0,
                inventory: [],
            });
        }

        res.json(doc.data());
    }).catch(err => {
        res.status(500).send('Error retrieving user data');
    });
});

// Route to fetch user credits
app.get('/credits', (req, res) => {
    if (!req.user) {
        return res.status(401).send('User not logged in');
    }

    const userId = req.user.id;

    db.collection('users').doc(userId).get().then(doc => {
        if (doc.exists) {
            res.json({ credits: doc.data().credits });
        } else {
            res.status(404).send('User not found');
        }
    }).catch(err => {
        res.status(500).send('Error retrieving credits');
    });
});

// Route to add credits to the user
app.post('/add-credits', (req, res) => {
    if (!req.user) {
        return res.status(401).send('User not logged in');
    }

    const userId = req.user.id;
    const { amount } = req.body;  // Amount to add

    db.collection('users').doc(userId).update({
        credits: firebaseAdmin.firestore.FieldValue.increment(amount),
    }).then(() => {
        res.json({ message: 'Credits added successfully' });
    }).catch(err => {
        res.status(500).send('Error adding credits');
    });
});

// Route to buy a card
app.post('/buy-card', (req, res) => {
    if (!req.user) {
        return res.status(401).send('User not logged in');
    }

    const userId = req.user.id;
    const { cardId } = req.body;  // Card ID to buy
    const cardCost = 100;  // Example card cost

    db.collection('users').doc(userId).get().then(doc => {
        if (!doc.exists) {
            return res.status(404).send('User not found');
        }

        const userData = doc.data();
        if (userData.credits < cardCost) {
            return res.status(400).send('Not enough credits');
        }

        // Deduct credits from the user
        db.collection('users').doc(userId).update({
            credits: firebaseAdmin.firestore.FieldValue.increment(-cardCost),
        }).then(() => {
            // Add the card to the user's inventory
            db.collection('users').doc(userId).update({
                inventory: firebaseAdmin.firestore.FieldValue.arrayUnion(cardId),
            }).then(() => {
                res.json({ message: 'Card purchased successfully' });
            }).catch(err => {
                res.status(500).send('Error updating inventory');
            });
        }).catch(err => {
            res.status(500).send('Error deducting credits');
        });
    }).catch(err => {
        res.status(500).send('Error retrieving user data');
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
