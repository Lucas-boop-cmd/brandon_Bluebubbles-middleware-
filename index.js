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

// Function to fetch Chat GUID from BlueBubbles
async function getChatGUID(phoneNumber) {
    try {
        const response = await axios.post(`${BLUEBUBBLES_API_URL}/api/v1/chat/query?password=${BLUEBUBBLES_PASSWORD}`, {
            "with": ["lastMessage", "participants"],
            "limit": 1,
            "offset": 0,
            "where": [
                {
                    "statement": "chat.participants.address = :address",
                    "args": { "address": phoneNumber }
                }
            ]
        }, {
            headers: { "Content-Type": "application/json" }
        });

        if (response.data.data.length > 0) {
            return response.data.data[0].guid;
        }
        return null;
    } catch (error) {
        console.error("❌ Error fetching Chat GUID from BlueBubbles:", error.message);
        return null;
    }
}

// Function to create a new chat if no existing chat is found
async function createNewChat(phoneNumber) {
    try {
        const response = await axios.post(`${BLUEBUBBLES_API_URL}/api/v1/chat/new?password=${BLUEBUBBLES_PASSWORD}`, {
            "addresses": [phoneNumber],
            "service": "iMessage"
        }, {
            headers: { "Content-Type": "application/json" }
        });

        return response.data.data.guid;
    } catch (error) {
        console.error("❌ Error creating new chat in BlueBubbles:", error.message);
        return null;
    }
}

// Forward messages to BlueBubbles
async function forwardToBlueBubbles(eventData) {
    try {
        let chatGUID = await getChatGUID(eventData.to);

        if (!chatGUID) {
            console.log(`🔍 No existing chat found for ${eventData.to}, creating new chat...`);
            chatGUID = await createNewChat(eventData.to);
        }

        if (!chatGUID) {
            console.error(`❌ Unable to find or create a chat for ${eventData.to}`);
            return;
        }

        const messagePayload = {
            chatGuid: chatGUID,
            message: eventData.body,
            method: "private-api"
        };

        console.log("📨 Forwarding message to BlueBubbles:", messagePayload);

        const response = await axios.post(`${BLUEBUBBLES_API_URL}/api/v1/message/text?password=${BLUEBUBBLES_PASSWORD}`, messagePayload, {
            headers: { "Content-Type": "application/json" }
        });

        console.log("✅ Successfully sent to BlueBubbles:", response.data);
    } catch (error) {
        console.error("❌ Error forwarding message to BlueBubbles:", error.message);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Schedule token refresh every 23 hours
    setInterval(refreshAccessToken, 23 * 60 * 60 * 1000);
});