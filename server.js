const dotenv = require('dotenv');
dotenv.config();
console.log(process.env.TWITCH_CLIENT_ID); // Access Twitch Client ID
console.log(process.env.SESSION_SECRET);  // Access Session Secret
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const TwitchStrategy = require('passport-twitch-new').Strategy; // or passport-twitch depending on the package
const fetch = require('node-fetch'); // You need to install node-fetch package
const app = express();
const port = 3000;
const admin = require("firebase-admin");
const serviceAccount = require("./rillatcg-ab6ba-firebase-adminsdk-fbsvc-2fd3014152.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const crypto = require('crypto');

// Step 1: Set up session middleware
app.use(session({
    secret: process.env.SESSION_SECRET, // Your session secret from the .env file
    resave: false,
    saveUninitialized: true


    


}));


// Step 2: Set up Passport with Twitch OAuth strategy
passport.use(new TwitchStrategy({
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: 'https://elk-hardy-previously.ngrok-free.app/auth/twitch/callback',
    scope: 'user:read:email' // Add more scopes as needed
}, function (accessToken, refreshToken, profile, done) {
    return done(null, profile); // Save profile data, you can store it in the session or DB

    
}));


// Step 3: Serialize and deserialize user for session management
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));


// Step 4: Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());


// Step 5: Create the route to start the login process (redirects to Twitch login page)
app.get('/auth/twitch',
    passport.authenticate('twitch', { scope: 'user:read:email' }) // Can specify additional scopes as needed
    
);

// Step 6: Handle the callback after successful authentication from Twitch
app.get('/auth/twitch/callback',
    passport.authenticate('twitch', { failureRedirect: '/' }),
    async function (req, res) {
        const user = req.user;

        const encodedUser = encodeURIComponent(JSON.stringify({
            id: user.id,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url
        }));

        /* Send a request to the ngrok URL with the skip warning header before redirecting
        try {
            const response = await fetch('https://elk-hardy-previously.ngrok-free.app/auth/twitch/callback', {
                method: 'GET',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                console.log('Successfully skipped ngrok browser warning.');
            } else {
                console.error('Failed to skip the ngrok browser warning.');
            }

        } catch (error) {
            console.error('Error while sending ngrok skip warning header:', error);
        }
        */
        // Redirect back to the frontend index.html with the Twitch user info in the URL
        res.redirect(`https://vanillarilla.github.io/rillatcg/index.html?user=${encodedUser}`);
        
    }
);

// Route to check if the user is logged in
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`<h1>Hello ${req.user.display_name}</h1><p>Your email: ${req.user.email}</p>`);
        console.log(`${req.user.display_name} logged in!`);
    } else {
        res.send('<h1>Please <a href="/auth/twitch">log in with Twitch</a></h1>');
    }
});



app.use('/eventsub', express.raw({ type: 'application/json' }));

// EventSub endpoint
app.post('/eventsub', async (req, res) => {
    const secret = '3aqst2f7q6ju032oxxs4f60o62pma2';
    const messageId = req.header('Twitch-Eventsub-Message-Id');
    const timestamp = req.header('Twitch-Eventsub-Message-Timestamp');
    const receivedSig = req.header('Twitch-Eventsub-Message-Signature');

    const hmac = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(messageId + timestamp + req.body)
        .digest('hex');

    if (hmac !== receivedSig) {
        console.error('Signature mismatch!');
        return res.status(403).send('Invalid signature');
    }

    const messageType = req.header('Twitch-Eventsub-Message-Type');
    const body = JSON.parse(req.body.toString());

    if (messageType === 'webhook_callback_verification') {
        // Respond with the challenge value received from Twitch
        return res.status(200).send(body.challenge);
    }

    if (messageType === 'notification') {
        const reward = body.event;

        if (reward.reward.title === '100 BALANCE') {
            const twitchUserId = reward.user_id; // Using Twitch user ID here

            console.log(`${twitchUserId} redeemed +100 TCG Coins`);

            // Update balance in Firebase
            const userRef = db.collection('users').where('id', '==', twitchUserId); // Query by `id`
            const snapshot = await userRef.get();

            if (snapshot.empty) {
                console.log(`User with ID ${twitchUserId} not found. Creating new user.`);
                // Create a new user if not found
                await db.collection('users').add({
                    id: twitchUserId,
                    displayName: reward.user_login,  // Store the Twitch username as displayName
                    balance: 100 // Initialize balance
                });
            } else {
                // If the user exists, update their balance
                snapshot.forEach(async (doc) => {
                    await doc.ref.update({
                        balance: admin.firestore.FieldValue.increment(100)  // Add 100 to the balance
                    });
                });
            }
        }

        return res.status(200).end();
    }

    res.status(200).end();
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
