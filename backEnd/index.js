require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Import the GHL and BlueBubbles webhook routes
const ghlWebhookRoutes = require('./routes/GHLWebhooks');
const blueBubblesWebhookRoutes = require('./routes/BlueBubblesWebhooks');

// Use the GHL and BlueBubbles webhook routes
app.use('/', ghlWebhookRoutes);
app.use('/', blueBubblesWebhookRoutes);

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});