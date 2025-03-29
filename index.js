require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { uploadTokens, storeGUID, client, searchGUIDsByHandleAddress } = require('./dataBase'); // Import storeGUID and searchGUIDsByHandleAddress
const app = express();

const conversationProviderId = process.env.CONVERSATION_PROVIDER_ID;

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;
const LocationId = process.env.LOCATION_ID;

// Endpoint to manually upload tokens
app.post('/upload-tokens', (req, res) => {
    const { accessToken, refreshToken } = req.body;
    if (!accessToken || !refreshToken) {
        return res.status(400).json({ error: 'Missing access token or refresh token' });
    }
    uploadTokens(accessToken, refreshToken);
    res.status(200).json({ status: 'success', message: 'Tokens uploaded successfully' });
});

// ✅ Webhook to Receive Messages from BlueBubbles and Forward to Go High-Level
app.post('/bluebubbles/events', async (req, res) => {
    console.log('📥 Received BlueBubbles event:', req.body);

    const { type, data } = req.body;

    // ✅ Ensure we process only "new-message" events
    if (type !== "new-message" || !data) {
        console.error("❌ Invalid or missing message data:", req.body);
        return res.status(200).json({ status: 'ignored', message: 'Invalid event type or missing data' });
    }

    const { guid, text, isFromMe, handle, originalROWID } = data;
    const address = handle?.address;

     // ✅ Check if GUID already exists in the database
    const existingGUIDs = await searchGUIDsByHandleAddress(address);
    const isDuplicate = existingGUIDs.some(entry => entry.guid === guid);

    if (isDuplicate) {
        console.log('❌ Duplicate GUID detected, ignoring...');
        return res.status(200).json({ status: 'ignored', message: 'Duplicate GUID' });
    }

    if (!guid || !text || !address || !originalROWID) {
        console.error("❌ Missing required fields in BlueBubbles event:", data);
        if (!guid) console.error("❌ Missing field: guid");
        if (!text) console.error("❌ Missing field: text");    
        if (!address) console.error("❌ Missing field: address");
        if (!originalROWID) console.error("❌ Missing field: originalROWID");
        return res.status(200).json({ status: 'ignored', message: 'Missing required fields' });
    }

    console.log(`🔍 New message from ${isFromMe ? "Me (Sent from iMessage)" : address}: ${text}`);

    try {
        // Retrieve the access token from Redis
        const redisKey = `tokens:${LocationId}`;
        const accessToken = await client.hGet(redisKey, 'accessToken');

        if (!accessToken) {
            console.error('❌ Access token not found in Redis!');
            return res.status(500).json({ error: 'Access token not found in Redis' });
        }

        // ✅ Find the corresponding contact in Go High-Level
        const ghlContactUrl = `https://services.leadconnectorhq.com/contacts/?query=${address}&locationId=${LocationId}`;
        console.log("GHL Contact URL:", ghlContactUrl); // Log the URL
        const ghlContact = await axios.get(
            ghlContactUrl,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`, // Use the access token from Redis
                    "Version": "2021-04-15",
                    "Accept": "application/json"
                }
            }
        );

        let contactId = ghlContact.data?.contacts?.[0]?.id;

        // ✅ If contact does not exist, ignore
        if (!contactId) {
            console.log("❌ No existing contact found, ignoring message...");
            return res.status(200).json({ status: 'ignored', message: 'No existing contact found' });
        }

        // ✅ Find the corresponding conversation in Go High-Level
        const ghlConversation = await axios.get(
            `https://services.leadconnectorhq.com/conversations/search/?contactId=${contactId}&locationId=${LocationId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`, // Use the access token from Redis
                    "Version": "2021-04-15",
                    "Accept": "application/json"
                }
            }
        );

        let conversationId = ghlConversation.data?.conversations?.[0]?.id;

        // ✅ If conversation does not exist, ignore
        if (!conversationId) {
            console.log("❌ No existing conversation found, ignoring message...");
            return res.status(200).json({ status: 'ignored', message: 'No existing conversation found' });
        }

        // ✅ Send the message to Go High-Level
        try {
            await axios.post(
                `https://services.leadconnectorhq.com/conversations/messages/inbound`,
                {
                    'type': 'Custom', 
                    'conversationProviderId': conversationProviderId,
                    'conversationId': conversationId,
                    'message': text,
                    'direction': isFromMe ? 'outbound' : 'inbound',
                },
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`, // Use the access token from Redis
                        "Content-Type": "application/json",
                        "Version": "2021-04-15"
                    }
                }
            );

            // ✅ Store the new GUID in the database
            await storeGUID(guid, address);

        } catch (error) {
            console.error("❌ Error sending message to Go High-Level:", error.response ? error.response.data : error.message);
            return res.status(500).json({ error: "Internal server error" });
        }

        console.log("✅ Message successfully forwarded to Go High-Level!");

        res.status(200).json({ status: 'success', message: 'Message forwarded to GHL' });

    } catch (error) {
        console.error("❌ Error processing BlueBubbles message:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles (POST)
app.post('/ghl/webhook', async (req, res) => {
    console.log('📥 Received Go High-Level event:', req.body);

    const { phone, message, userId, messageId, type } = req.body;

    try {
        // Filter to only process events of type SMS or InboundMessage
        if (type === 'InboundMessage') {
            console.log("🔄 Forwarding InboundMessage event to convoAi.js for processing...");
            const convoAi = require('./convoAi');
            await convoAi.processInboundMessage(req.body);
            return res.status(200).json({ status: 'success', message: 'InboundMessage forwarded to convoAi.js' });
        }

        if (type !== 'SMS') {
            console.log("❌ Ignoring non-SMS event:", type);
            return res.status(200).json({ status: 'ignored', message: 'Event is not of type SMS' });
        }

        if (!phone || !message || !userId || !messageId) {
            console.error("❌ Missing required fields in Go High-Level event:", req.body);
            if (!phone) console.error("❌ Missing field: phone");
            if (!message) console.error("❌ Missing field: message");
            if (!userId) console.error("❌ Missing field: userId");
            if (!messageId) console.error("❌ Missing field: messageId");
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log(`🔍 New message from ${userId}: ${message}`);

        // Retrieve the access token from Redis
        const redisKey = `tokens:${LocationId}`;
        const accessToken = await client.hGet(redisKey, 'accessToken');

        if (!accessToken) {
            console.error('❌ Access token not found in Redis!');
            return res.status(500).json({ error: 'Access token not found in Redis' });
        }

        // ✅ Query for the handle to get the service
        console.log(`🔍 Querying BlueBubbles for handle with phone: ${phone}`);
        const handleResponse = await axios.get(
            `${BLUEBUBBLES_API_URL}/api/v1/handle/${encodeURIComponent(phone)}?password=${BLUEBUBBLES_PASSWORD}`
        );

        console.log(`🔍 BlueBubbles handle response:`, handleResponse.data);

        const service = handleResponse.data.data.service;

        if (!service) {
            console.log(`❌ No service found for phone number: ${phone}`);
            return res.status(404).json({ error: "No service found for handle" });
        }

        // Manually construct the chat GUID
        const chatGuid = `${service};-;${phone}`;
        console.log(`✅ Constructed Chat GUID: ${chatGuid} for ${phone}`);

        // ✅ Send the message to BlueBubbles
        const tempGuid = `temp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        console.log(`🔍 Sending message to BlueBubbles chat with tempGuid: ${tempGuid}`);
        const sendMessageResponse = await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/message/text?password=${BLUEBUBBLES_PASSWORD}`,
            {
                chatGuid: chatGuid,
                tempGuid: tempGuid,
                message: message,
                method: "apple-script"
            }
        );

        console.log("✅ Message successfully forwarded to BlueBubbles!", sendMessageResponse.data);

        // Store the response GUID in Redis
        const responseGUID = sendMessageResponse.data.data.guid;
        const handleAddress = String(req.body.phone);
        console.log(`🔍 Storing response GUID in Redis: ${responseGUID} with handleAddress: ${handleAddress}`);
        await storeGUID(responseGUID, handleAddress);

        // ✅ Send 200 OK back to Go High-Level acknowledging the handoff
        res.status(200).json({ status: 'success', message: 'Message successfully forwarded to BlueBubbles' });

        // ✅ Update the status of the message in Go High-Level after forwarding to BlueBubbles
        try {
            const ghlResponse = await axios.put(
                `https://services.leadconnectorhq.com/conversations/messages/${messageId}/status`,
                { "status": "delivered" },
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Version": "2021-04-15",
                        "Accept": "application/json"
                    }
                }
            );

            if (ghlResponse.status === 200) {
                console.log("✅ Message status updated in Go High-Level!!", ghlResponse.data, messageId);
            } else {
                console.error("❌ Failed to update message status in Go High-Level:", ghlResponse.data);
            }
        } catch (error) {
            console.error("❌ Error updating message status in Go High-Level:", error.response ? error.response.data : error.message);
        }

    } catch (error) {
        console.error("❌ Error processing Go High-Level message:", error.response ? error.response.data : error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});