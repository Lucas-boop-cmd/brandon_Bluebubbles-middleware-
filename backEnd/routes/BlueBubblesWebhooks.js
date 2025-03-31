require('dotenv').config(); // safe to use in every file if needed
const express = require('express');
const router = express.Router(); // Use express.Router() to create a new router instance

const LocationId = process.env.LOCATION_ID;
const { storeGUID, client, searchGUIDsByHandleAddress } = require('../dataBase'); // Import storeGUID and searchGUIDsByHandleAddress
const conversationProviderId = process.env.CONVERSATION_PROVIDER_ID;


// ✅ Webhook to Receive Messages from BlueBubbles and Forward to Go High-Level
router.post('/bluebubbles/events', async (req, res) => { // Use router.post instead of app.post
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

module.exports = router; // Export the router
