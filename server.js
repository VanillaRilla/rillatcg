require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const TwitchStrategy = require('passport-twitch-new').Strategy;
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

// Step 1: Set up session
app.use(session({
    secret: process.env.SESSION_SECRET, // Use session secret from .env
    resave: false,
    saveUninitialized: true
}));

// Step 2: Set up passport
passport.use(new TwitchStrategy({
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/twitch/callback',
    scope: 'user:read:email'
}, function (accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));

// Step 3: Serialize and deserialize user for session management
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Initialize passport and sessions
app.use(passport.initialize());
app.use(passport.session());

// Routes for Twitch Authentication
app.get('/auth/twitch',
    passport.authenticate('twitch', {
        scope: 'user:read:email'  // Request user's email
    }));

app.get('/auth/twitch/callback',
    passport.authenticate('twitch', { failureRedirect: '/' }),
    function (req, res) {
        // Successful authentication, redirect home
        res.redirect('/');
    });

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

