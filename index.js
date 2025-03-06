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
    console.log('Event from BlueBubbles:', eventData);

    try {
        await axios.post(GHL_WEBHOOK_URL, eventData);
        res.status(200).json({ status: 'success', message: 'Forwarded to GHL' });
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
