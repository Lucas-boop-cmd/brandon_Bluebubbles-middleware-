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

// ✅ Function to Refresh Access Token
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
        REFRESH_TOKEN = response.data.refresh_token;

        // ✅ Update environment variables
        process.env.GHL_ACCESS_TOKEN = ACCESS_TOKEN;
        process.env.GHL_REFRESH_TOKEN = REFRESH_TOKEN;

        console.log("✅ New Access Token:", ACCESS_TOKEN);
        console.log("🔄 Updated Refresh Token:", REFRESH_TOKEN);
        console.log(`⏳ Next refresh scheduled in 20 hours.`);

    } catch (error) {
        console.error("❌ Failed to refresh access token:", error.response ? error.response.data : error.message);
    }
}

// ✅ Schedule the first token refresh 1 hour after deployment
setTimeout(() => {
    refreshAccessToken(); 
    setInterval(refreshAccessToken, 20 * 60 * 60 * 1000);
}, 60 * 60 * 1000);

console.log("⏳ First token refresh scheduled for 1 hour from now...");

// ✅ Webhook to Receive Messages from BlueBubbles and Forward to Go High-Level
app.post('/bluebubbles/events', async (req, res) => {
    console.log('📥 Received BlueBubbles event:', req.body);

    const { type, data } = req.body;

    // ✅ Ensure we process only "new-message" events
    if (type !== "new-message" || !data) {
        console.error("❌ Invalid or missing message data:", req.body);
        return res.status(400).json({ error: "Invalid event type or missing data" });
    }

    const { guid, text, address, isFromMe } = data;

    if (!guid || !text || !address) {
        console.error("❌ Missing required fields in BlueBubbles event:", data);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 New message from ${isFromMe ? "Me (Sent from iMessage)" : address}: ${text}`);

    // ✅ Determine if it's inbound or outbound
    const direction = isFromMe ? "outbound" : "inbound";

    try {
        // ✅ Find the corresponding conversation in Go High-Level
        const ghlConversation = await axios.get(
            `https://services.leadconnectorhq.com/conversations?phone=${address}`,
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
                { phone: address },
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
                sent_by: isFromMe ? "Me (Sent from iMessage)" : address // ✅ Corrected Logic
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

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles
app.post('/ghl/webhook', async (req, res) => {
    console.log('📥 Received Go High-Level event:', req.body);

    const { type, data } = req.body;

    // ✅ Ensure we process only "new-message" events
    if (type !== "new-message" || !data) {
        console.error("❌ Invalid or missing message data:", req.body);
        return res.status(400).json({ error: "Invalid event type or missing data" });
    }

    const { conversationId, message, sent_by, conversationProviderId } = data;

    // ✅ Filter events by conversation provider ID
    if (conversationProviderId !== '67ceef6be35e2b2085ef1c70') {
        console.log("❌ Ignoring event from unsupported conversation provider:", conversationProviderId);
        return res.status(200).json({ status: 'ignored', message: 'Event from unsupported conversation provider' });
    }

    if (!conversationId || !message || !sent_by) {
        console.error("❌ Missing required fields in Go High-Level event:", data);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 New message from ${sent_by}: ${message}`);

    try {
        // ✅ Find the corresponding chat in BlueBubbles
        const blueBubblesChats = await axios.get(
            `${BLUEBUBBLES_API_URL}/api/v1/chats`,
            {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`bluebubbles:${BLUEBUBBLES_PASSWORD}`).toString('base64')}`
                }
            }
        );

        const chat = blueBubblesChats.data.find(chat => 
            chat.participants.length === 1 && chat.participants[0].address === sent_by
        );

        if (!chat) {
            console.error("❌ No matching chat found in BlueBubbles for:", sent_by);
            return res.status(404).json({ error: "No matching chat found" });
        }

        // ✅ Send the message to BlueBubbles
        await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/messages`,
            {
                chatGuid: chat.guid,
                message: message
            },
            {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`bluebubbles:${BLUEBUBBLES_PASSWORD}`).toString('base64')}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Message successfully forwarded to BlueBubbles!");

        res.status(200).json({ status: 'success', message: 'Message forwarded to BlueBubbles' });

    } catch (error) {
        console.error("❌ Error processing Go High-Level message:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

