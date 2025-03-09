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
        TOKEN_EXPIRATION = Date.now() + 23 * 60 * 60 * 1000; // Refresh 1 hour before expiration

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

// ✅ Corrected function to get chat GUID for one-on-one chats only
async function getChatGuid(phoneNumber) {
    try {
        const response = await axios.post(
            `http://myimessage.hopto.org:1234/api/v1/chat/query?password=Dasfad1234$`,
            {
                "limit": 1000,
                "offset": 0,
                "with": ["participants", "lastMessage", "sms", "archived"],
                "sort": "lastmessage"
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        if (response.data && response.data.data) {
            // ✅ Ensure chat has exactly ONE participant (recipient only, not a group)
            const chat = response.data.data.find(chat =>
                chat.participants.length === 1 &&
                chat.participants.some(p => p.address === phoneNumber)
            );

            if (chat) {
                console.log(`✅ Found one-on-one chat GUID for ${phoneNumber}: ${chat.guid}`);
                return chat.guid;
            } else {
                console.error(`⚠️ No one-on-one chat found for ${phoneNumber}.`);
            }
        }

        console.error("⚠️ No chat GUID found for phone number:", phoneNumber);
        return null;
    } catch (error) {
        console.error("❌ Error querying BlueBubbles for chat GUID:", error.response?.data || error.message);
        return null;
    }
}

// ✅ Updated Function to Send Message via BlueBubbles with Private API & Notify GHL
async function sendMessageToBlueBubbles(chatGuid, messageId, messageText, phone) {
    try {
        const response = await axios.post(
            `http://myimessage.hopto.org:1234/api/v1/message/text?password=Dasfad1234$`,
            {
                chatGuid: chatGuid,
                tempGuid: messageId,
                message: messageText,
                method: "private-api" // ✅ Force sending via Private API
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        if (response.data && response.data.status === "success") {
            console.log(`✅ Message sent successfully via Private API: ${messageText}`);

            // ✅ Notify Go High-Level that the message was successfully sent
            await updateGHLMessageStatus(phone, messageId, "delivered");
        } else {
            console.error("⚠️ Message may not have been sent properly:", response.data);
            await updateGHLMessageStatus(phone, messageId, "failed");
        }
    } catch (error) {
        console.error("❌ Error sending message to BlueBubbles:", error.response?.data || error.message);
        await updateGHLMessageStatus(phone, messageId, "failed");
    }
}

// ✅ Function to Update Message Status in Go High-Level
async function updateGHLMessageStatus(phone, messageId, status) {
    try {
        const accessToken = await getAccessToken(); // Ensure we have a valid GHL API token

        const response = await axios.post(
            `${GHL_WEBHOOK_URL}/conversations/messages/status`,
            {
                phone: phone,
                messageId: messageId,
                status: status // ✅ Update status to "delivered" or "failed"
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`✅ Successfully updated message status in GHL: ${status}`);
    } catch (error) {
        console.error("❌ Failed to update message status in GHL:", error.response?.data || error.message);
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
        // ✅ Query BlueBubbles for chat GUID using phone number (only one-on-one chats)
        const chatGuid = await getChatGuid(phone);

        if (!chatGuid) {
            console.error("❌ Unable to retrieve one-on-one chat GUID for phone:", phone);
            return res.status(400).json({ error: "One-on-one chat GUID not found" });
        }

        // ✅ Send message to BlueBubbles via Private API & Notify GHL
        await sendMessageToBlueBubbles(chatGuid, messageId, message, phone);
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
