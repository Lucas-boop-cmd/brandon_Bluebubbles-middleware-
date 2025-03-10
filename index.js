// ✅ Ensure Express is set up first
const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.json());

// ✅ Load environment variables
let ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN;
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables:");
console.log("GHL_CLIENT_ID:", CLIENT_ID ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_CLIENT_SECRET:", CLIENT_SECRET ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_REFRESH_TOKEN:", REFRESH_TOKEN ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_ACCESS_TOKEN:", ACCESS_TOKEN ? "✅ Loaded" : "❌ Not Found");

// ✅ Function to Refresh Access Token
async function refreshAccessToken() {
    try {
        console.log("🔄 Refreshing Access Token...");
        const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', null, {
            params: {
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: REFRESH_TOKEN,
            },
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        ACCESS_TOKEN = response.data.access_token;
        console.log("✅ New Access Token:", ACCESS_TOKEN);

    } catch (error) {
        console.error("❌ Failed to refresh access token:", error.response ? error.response.data : error.message);
    }
}

// ✅ Schedule Token Refresh Every 20 Hours
setInterval(refreshAccessToken, 20 * 60 * 60 * 1000); // 20 hours in milliseconds

// ✅ Add GET route to check if webhook is live
app.get('/ghl/webhook', (req, res) => {
    console.log("✅ Webhook GET request received.");
    res.status(200).json({ message: "Webhook is active and listening!" });
});

// ✅ Add POST route for actual webhook processing
app.post('/ghl/webhook', async (req, res) => {
    console.log('🔍 Full Webhook Request Body:', JSON.stringify(req.body, null, 2));

    const { phone, messageId, message, event } = req.body;
    if (!phone || !messageId || !message) {
        console.error("❌ Missing required fields:", req.body);
        return res.status(400).json({ error: "Missing required fields: phone, messageId, or message" });
    }

    res.status(200).json({ status: 'success', message: 'Webhook received' });
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    refreshAccessToken(); // ✅ Refresh token once on startup
});

