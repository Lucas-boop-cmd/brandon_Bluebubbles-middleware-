require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors({
  origin: '*', // In production, specify your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Import all routes
const ghlWebhookRoutes = require('./routes/GHLWebhooks');
const blueBubblesWebhookRoutes = require('./routes/BlueBubblesWebhooks');
const realtorsHandler = require('./webpage/realtorsHandler');
const contactNameHandler = require('./webpage/webhook/contactNameHandler'); // Add the new handler

// Use all routes
app.use('/', ghlWebhookRoutes);
app.use('/', blueBubblesWebhookRoutes);
app.use('/', realtorsHandler); // Mount the realtorsHandler routes at root level
app.use('/', contactNameHandler); // Mount the contactNameHandler routes

// Function to upload tokens
async function uploadTokens(accessToken, refreshToken) {
    // Implementation of uploadTokens function here
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
}

// Endpoint to manually upload tokens
app.post('/upload-tokens', (req, res) => {
    const { accessToken, refreshToken } = req.body;
    if (!accessToken || !refreshToken) {
        return res.status(400).json({ error: 'Missing access token or refresh token' });
    }
    uploadTokens(accessToken, refreshToken);
    res.status(200).json({ status: 'success', message: 'Tokens uploaded successfully' });
});

// Simple test route to check server health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});