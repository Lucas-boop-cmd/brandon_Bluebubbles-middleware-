require('dotenv').config(); // safe to use in every file if needed
const express = require('express');
const router = express.Router(); // Use express.Router() to create a new router instance
const axios = require('axios');

const LocationId = process.env.LOCATION_ID;
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;

const { storeGUID, client, } = require('../dataBase'); // Import storeGUID and searchGUIDsByHandleAddress

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles (POST)
router.post('/ghl/webhook', async (req, res) => { // Use router.post instead of app.post
    console.log('📥 Received Go High-Level event:', req.body);

    const { phone, message, userId, messageId, type } = req.body;

    try {
        // Filter to only process events of type SMS or InboundMessage
        if (type === 'InboundMessage') {
            console.log("🔄 Forwarding InboundMessage event to convoAi.js for processing...");
            const convoAi = require('../convoAi');
            await convoAi.processInboundMessage(req.body);
            return res.status(200).json({ status: 'success', message: 'InboundMessage forwarded to convoAi.js' });
        }

        if (type !== 'SMS') {
            console.log("❌ Ignoring non-SMS event:", type);
            return res.status(200).json({ status: 'ignored', message: 'Event is not of type SMS' });
        }

        if (!phone || !message || !messageId) {
            console.error("❌ Missing required fields in Go High-Level event:", req.body);
            if (!phone) console.error("❌ Missing field: phone");
            if (!message) console.error("❌ Missing field: message");
            if (!messageId) console.error("❌ Missing field: messageId");
            return res.status(400).json({ error: "Missing required fields" });
        }

        console.log(`🔍 New message: ${message}`);

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

module.exports = router; // Export the router