// ✅ Ensure Express is set up first
const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.json());

// ✅ Load environment variables
let ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;
let REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN;
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables:");
console.log("GHL_CLIENT_ID:", CLIENT_ID ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_CLIENT_SECRET:", CLIENT_SECRET ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_REFRESH_TOKEN:", REFRESH_TOKEN ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_ACCESS_TOKEN:", ACCESS_TOKEN ? "✅ Loaded" : "❌ Not Found");
console.log("BLUEBUBBLES_API_URL:", BLUEBUBBLES_API_URL ? "✅ Loaded" : "❌ Not Found");

// ✅ Function to Refresh Access Token (Now Includes Version Header)
async function refreshAccessToken() {
    try {
        console.log("🔄 Refreshing Access Token...");

        const requestBody = new URLSearchParams();
        requestBody.append("grant_type", "refresh_token");
        requestBody.append("client_id", CLIENT_ID);
        requestBody.append("client_secret", CLIENT_SECRET);
        requestBody.append("refresh_token", REFRESH_TOKEN);
        requestBody.append("user_type", "Company");

        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            requestBody.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Version": "2021-04-15"
                }
            }
        );

        ACCESS_TOKEN = response.data.access_token;
        REFRESH_TOKEN = response.data.refresh_token; // ✅ Store the new refresh token

        console.log("✅ New Access Token:", ACCESS_TOKEN);
        console.log("🔄 Updated Refresh Token:", REFRESH_TOKEN);
        console.log(`⏳ Next refresh scheduled in 20 hours.`);

    } catch (error) {
        console.error("❌ Failed to refresh access token:", error.response ? error.response.data : error.message);
    }
}

// ✅ Schedule the first token refresh 1 hour (3600000ms) after deployment
setTimeout(() => {
    refreshAccessToken(); // 🔄 First refresh after 1 hour
    setInterval(refreshAccessToken, 20 * 60 * 60 * 1000); // 🔄 Then refresh every 20 hours
}, 60 * 60 * 1000);

console.log("⏳ First token refresh scheduled for 1 hour from now...");

// ✅ Webhook to Receive Messages from BlueBubbles and Forward to Go High-Level
app.post('/bluebubbles/events', async (req, res) => {
    console.log('📥 Received BlueBubbles event:', req.body);

    const { guid, text, sender, is_from_me, timestamp } = req.body;

    if (!guid || !text || !sender) {
        console.error("❌ Missing required fields in BlueBubbles event:", req.body);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 New message from ${sender}: ${text}`);

    // ✅ Determine if it's inbound or outbound
    const direction = is_from_me ? "outbound" : "inbound";
    const sent_by = is_from_me ? "36E2xrEV92vFl7b1fUJP" : sender;

    try {
        // ✅ Find the corresponding conversation in Go High-Level
        const ghlConversation = await axios.get(
            `https://services.leadconnectorhq.com/conversations?phone_number=${sender}`,
            {
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Version": "2021-04-15"
                }
            }
        );

        let conversationId = ghlConversation.data?.conversations?.[0]?.id;

        // ✅ If conversation does not exist, create one
        if (!conversationId) {
            console.log("📌 No existing conversation found, creating a new one...");

            const newConversation = await axios.post(
                'https://services.leadconnectorhq.com/conversations',
                { phone_number: sender },
                {
                    headers: {
                        "Authorization": `Bearer ${ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                        "Version": "2021-04-15"
                    }
                }
            );

            conversationId = newConversation.data.id;
        }

        // ✅ Send the message to Go High-Level
        await axios.post(
            `https://services.leadconnectorhq.com/conversations/messages/${direction}`,
            {
                conversationId: conversationId,
                message: text,
                sent_by: sent_by
            },
            {
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                    "Version": "2021-04-15"
                }
            }
        );

        console.log("✅ Message successfully forwarded to Go High-Level!");

        res.status(200).json({ status: 'success', message: 'Message forwarded to GHL' });

    } catch (error) {
        console.error("❌ Error processing BlueBubbles message:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
