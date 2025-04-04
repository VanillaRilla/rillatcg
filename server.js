const dotenv = require('dotenv');
dotenv.config();
console.log(process.env.TWITCH_CLIENT_ID); // Access Twitch Client ID
console.log(process.env.SESSION_SECRET);  // Access Session Secret
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const TwitchStrategy = require('passport-twitch-new').Strategy; // or passport-twitch depending on the package
const app = express();
const port = 3000;


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
    callbackURL: 'https://d8cd-5-146-251-5.ngrok-free.app/auth/twitch/callback',
    scope: 'user:read:email' // Add more scopes as needed
}, function (accessToken, refreshToken, profile, done) {
    return done(null, profile); // Save profile data, you can store it in the session or DB
}));

// Step 3: Serialize and deserialize user for session management
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Step 4: Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());

// Step 5: Create the route to start the login process (redirects to Twitch login page)
app.get('/auth/twitch',
    passport.authenticate('twitch', { scope: 'user:read:email' }) // Can specify additional scopes as needed
);

// Step 6: Handle the callback after successful authentication from Twitch
app.get('/auth/twitch/callback',
    passport.authenticate('twitch', { failureRedirect: '/' }), // Redirect if authentication fails
    function (req, res) {
        // Successful login, redirect the user
        res.redirect('/'); // Or redirect to another page after login
    }
);

// Route to check if the user is logged in
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`<h1>Hello ${req.user.display_name}</h1><p>Your email: ${req.user.email}</p>`);
    } else {
        res.send('<h1>Please <a href="/auth/twitch">log in with Twitch</a></h1>');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});