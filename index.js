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
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;

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

// Function to get chat GUID from BlueBubbles using phone number
async function getChatGuid(phoneNumber) {
    try {
        const response = await axios.post(`http://myimessage.hopto.org:1234//api/v1/chat/query?password=Dasfad1234$`, {
            addresses: [phoneNumber]
        });

        if (response.data && response.data.length > 0) {
            return response.data[0].chatGuid;
        } else {
            console.error("⚠️ No chat GUID found for phone number:", phoneNumber);
            return null;
        }
    } catch (error) {
        console.error("❌ Error querying BlueBubbles for chat GUID:", error.response?.data || error.message);
        return null;
    }
}

// Function to send message via BlueBubbles
async function sendMessageToBlueBubbles(chatGuid, messageId, messageText) {
    try {
        const response = await axios.post(`http://myimessage.hopto.org:1234//api/v1/message/text?password=Dasfad1234$`, {
            chatGuid: chatGuid,
            tempGuid: messageId,
            message: messageText
        });

        console.log("✅ Message sent to BlueBubbles:", response.data);
    } catch (error) {
        console.error("❌ Error sending message to BlueBubbles:", error.response?.data || error.message);
    }
}

// Webhook Endpoint for Go High-Level (GHL)
app.post('/ghl/webhook', async (req, res) => {
    console.log('🔍 Full Request Body from GHL:', JSON.stringify(req.body, null, 2));

    const { phone, messageId, message } = req.body;

    if (!phone || !messageId || !message) {
        console.error("❌ Missing required fields in webhook payload");
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Query BlueBubbles for chat GUID using phone number
        const chatGuid = await getChatGuid(phone);

        if (!chatGuid) {
            console.error("❌ Unable to retrieve chat GUID for phone:", phone);
            return res.status(400).json({ error: "Chat GUID not found" });
        }

        // Send message to BlueBubbles
        await sendMessageToBlueBubbles(chatGuid, messageId, message);
        res.status(200).json({ status: 'success', message: 'Message forwarded to BlueBubbles' });

    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server and listen on the correct port
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Schedule token refresh every 23 hours
    setInterval(refreshAccessToken, 23 * 60 * 60 * 1000);
});

