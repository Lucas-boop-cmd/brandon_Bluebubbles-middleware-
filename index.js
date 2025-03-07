const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;
const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;

// Store access token and expiration time
let ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN || null;
let REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN || null;
let TOKEN_EXPIRATION = Date.now(); // Default to expired so it refreshes on first use

// Function to refresh access token
async function refreshAccessToken() {
    try {
        if (!REFRESH_TOKEN) {
            console.error("❌ No refresh token available. Please reauthenticate.");
            return;
        }

        console.log("🔄 Refreshing access token...");
        const response = await axios.post(GHL_TOKEN_URL, {
            grant_type: "refresh_token",
            client_id: process.env.GHL_CLIENT_ID,
            client_secret: process.env.GHL_CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
        }, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        ACCESS_TOKEN = response.data.access_token;
        REFRESH_TOKEN = response.data.refresh_token;
        TOKEN_EXPIRATION = Date.now() + 23 * 60 * 60 * 1000; // Set to refresh 1 hour before expiration

        console.log("✅ Access token refreshed successfully!");
    } catch (error) {
        console.error("⚠️ Error refreshing access token:", error.response?.data || error.message);
    }
}

// Function to get a valid access token before making an API request
async function getAccessToken() {
    if (!ACCESS_TOKEN || Date.now() > TOKEN_EXPIRATION) {
        await refreshAccessToken();
    }
    return ACCESS_TOKEN;
}

// Forward messages to BlueBubbles
async function forwardToBlueBubbles(eventData) {
    try {
        const messagePayload = {
            recipient: eventData.to, // Ensure this matches BlueBubbles recipient format
            message: eventData.body, // Ensure this matches BlueBubbles message format
            service: "iMessage" // Ensure it's sent as iMessage
        };

        console.log("📨 Forwarding message to BlueBubbles:", messagePayload);

        const response = await axios.post(BLUEBUBBLES_API_URL, messagePayload, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("✅ Successfully sent to BlueBubbles:", response.data);
    } catch (error) {
        console.error("❌ Error forwarding message to BlueBubbles:", error.message);
    }
}

// Endpoint to receive BlueBubbles events
app.post('/bluebubbles/events', async (req, res) => {
    const eventData = req.body;

    if (eventData.associatedMessageType) {
        console.log("Ignoring reaction message:", eventData.associatedMessageType);
        return res.status(200).json({ status: 'ignored', message: 'Reaction ignored' });
    }

    console.log('Event from BlueBubbles:', eventData);

    try {
        const token = await getAccessToken();
        await axios.post(GHL_WEBHOOK_URL, eventData, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        res.status(200).json({ status: 'success', message: 'Forwarded to CP' });
    } catch (error) {
        console.error('Error forwarding event:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Health-check route
app.get('/', (req, res) => {
    res.send('Middleware server running!');
});

// New Delivery URL for GoHighLevel CP
app.post('/cp/delivery', async (req, res) => {
    console.log('Received event from CP:', req.body);
    res.status(200).json({ status: 'success', message: 'Message received by middleware' });
});

// Webhook Endpoint for Go High-Level (GHL)
app.post('/ghl/webhook', async (req, res) => {
    const eventData = req.body;
    console.log('Received event from GHL:', eventData);

    // Ignore email messages
    if (eventData.channel === "email") {
        console.log("📧 Ignoring email message.");
        return res.status(200).json({ status: 'ignored', message: 'Email ignored' });
    }

    // Force iMessages to be treated as SMS
    if (!eventData.channel || eventData.channel === "imessage") {
        console.log("⚠️ Message from iMessage tab detected, treating as SMS...");
        eventData.channel = "sms"; // Override channel to SMS
    }

    if (eventData.channel === "sms") {
        console.log("✅ Processing SMS message from GHL:", eventData);
        await forwardToBlueBubbles(eventData);
    }

    res.status(200).json({ status: 'success', message: 'Webhook received from GHL' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Schedule token refresh every 23 hours
    setInterval(refreshAccessToken, 23 * 60 * 60 * 1000);
});
