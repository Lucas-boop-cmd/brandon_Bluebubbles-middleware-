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

// Endpoint to receive BlueBubbles events
app.post('/bluebubbles/events', async (req, res) => {
    const eventData = req.body;

    // Check if the message is a reaction (associatedMessageType exists)
    if (eventData.associatedMessageType) {
        console.log("Ignoring reaction message:", eventData.associatedMessageType);
        return res.status(200).json({ status: 'ignored', message: 'Reaction ignored' });
    }

    console.log('Event from BlueBubbles:', eventData);

    try {
        await axios.post(GHL_WEBHOOK_URL, eventData);
        res.status(200).json({ status: 'success', message: 'Forwarded to CP' });
    } catch (error) {
        console.error('Error forwarding event:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Basic health-check route
app.get('/', (req, res) => {
    res.send('Middleware server running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// New Delivery URL for Go High-Level CP
app.post('/cp/delivery', async (req, res) => {
    const eventData = req.body;

    console.log('Received event from CP:', eventData);

    // Process and forward the message as needed
    res.status(200).json({ status: 'success', message: 'Message received by middleware' });
});
// Webhook Endpoint for Go High-Level (GHL)
app.post('/ghl/webhook', async (req, res) => {
    const eventData = req.body;

    console.log('Received event from GHL:', eventData);

    // Check if it's an inbound or outbound message
    if (eventData.type === "InboundMessage") {
        console.log("Inbound message from customer:", eventData);
        // Process message if needed
    } else if (eventData.type === "OutboundMessage") {
        console.log("Outbound message from CP:", eventData);
        // Process message if needed
    }

    res.status(200).json({ status: 'success', message: 'Webhook received from GHL' });
});

