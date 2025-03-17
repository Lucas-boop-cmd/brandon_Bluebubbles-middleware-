const express = require('express');
const axios = require('axios');
const redis = require('redis');
const app = express();

app.use(express.json());

// Initialize Redis client
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis');
});
app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjEzMjMzNy4wNjEsImV4cCI6MTc0MjIxODczNy4wNjF9.mfShWZexlqSeeG3Fh0JNbO70u6ARRNH6wDCgC-PNa_7VtCzRGSANAkzhZl9OLvTgQZ548Q7Nnf65vYi-TbZf2WOCjQQo6G0iJ-1GxYbQmoBlTKzJr63Tu8wI-oo6yhph-u9h2E2D61aXiRnZGhMakrgqpA3k9Og99aswz_pheDjE_P16-hmNRgpMJ98ZKjZQKA6Dn_egSvoHhiP9uqA4jZExF3_ZEsRc2PQlVwOVuO9yo9CO0WMgnYbjEaRoS2lw7Kyb4uBS5eB4N4LzKoywT5vYZiA_5k3OGUmfFe370U46eW2cyWJevPXgreU9DMHh993-iPyiUDF6Phx3gGrA8mBWLToEzrMDr21b-xmT18mv24kiNYfJvaejic4d8WMFdUy5tlQ1prPhFRux--_88zJeZUxxRQHHsw4FW4I2loGOWUuvcGm4ygv4bxRazFy38O5j5dSkpkPPIfIJ9nHEb1RRHGCdrb652h_HjxZ_NWBFC2a7_dUth3_sTdlBPiSne3yLWHMBhOr2hiZLrK6bTTYboll4_zia3TGdjSwHjzZcNMf-4XdfID7TAVDfSMo5iKFLnkr4WDzAn9Kr6Sckfi-J43UG5hfOZedy5-9b7EzIMPYVDKcFWl9yinqov1fCXZtiZiEJDk2SgmqJZx2V_dPk5P4VRNnnBOmowpF09XY';
let GHL_REFRESH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjEzMjMzNy4wNjgsImV4cCI6MTc3MzY2ODMzNy4wNjgsInVuaXF1ZUlkIjoiZmZmZTIzYmItOTAwNy00NjA3LTgzN2ItNjMyMjE1OTU0MzVkIn0.BATOoJhm6ohrJoF9PgKFBBxL6ekql4ogsvbxL48uvEQuRtN1HOhhaMhFOhwmXyDpGQ8d60eZtoRx5WBKeeGYWFuYf0zeoYjnOqTySDsHC4JrNyq59EsEbicblBnKCUbawVakzusaqrxgU05Sq3RATVeIjAOkQHfQNZmgADlzUjzb6_FYrKxHtj7qMqPcSZ0rMMjviU5YMIlsNsENAiZY9_rYlGfEmIzZ_qmsAg4ClhYd7oEG-pZvqm9nNhhD9z8PGFYFXT23fjbFM6gmg0jwK9RHu1nxy8FOL2ddxKiySMMqyYM6ngE62X1cqX018a6Kao8pEnlolIVubpmQhosQ6mYax6r6vZxjexw5Is-jxFUUXgxEVbJnxFuI-bQlTo6tQRd95DXo-tZQNRJk2cXh27E0y1nWv4Y70ZPO6qNHFHTyDDbuC0p_r_h4m8bAvHRKH90jakId2cJsxIxaa7FqKnsw-XbZdK-24ZP60h8LPzJpJiyM0BjGD6svqkVs67lzrdpza_JBIDcTmI_21eCDr0HLgRvqo2bmTiid07o-KmweqKJtGeBQKIZ131zSFDqel1SSOKfcJwQ4Kk3Kj0BqbfF0Tpa0OtwmMmBUmxEEVwhV6JFDKg3s4HsHfhISHrPFVhsS7L3W0oxmY53zRtlC-I2-Lzx8r6dzkpo8RTohPiU';
const CLIENT_ID = '67d499bd3e4a8c3076d5e329-m899qb4l';
const GHL_CLIENT_SECRET = 'c8eefd7b-f824-4a84-b10b-963ae75c0e7c';
const LocationId = 'h4BWchNdy6Wykng1FfTH';
let tokenExpiration = Date.now() + 22 * 60 * 60 * 1000; // 22 hours from now

// Function to refresh GHL API token
async function refreshGHLToken() {
    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            {
                client_id: CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: GHL_REFRESH_TOKEN
            },

                {
                    headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        GHL_ACCESS_TOKEN = response.data.access_token;
        GHL_REFRESH_TOKEN = response.data.refresh_token;
        tokenExpiration = Date.now() + 22 * 60 * 60 * 1000; // Reset expiration to 22 hours from now

        console.log('✅ GHL API token refreshed successfully');
    } catch (error) {
        console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
    }
}

// Middleware to check token expiration before API calls
async function checkTokenExpiration(req, res, next) {
    if (Date.now() >= tokenExpiration) {
        await refreshGHLToken();
    }
    next();
}                 

 // ✅ Webhook to Receive Messages from BlueBubbles and Forward to Go High-Level
app.post('/bluebubbles/events', async (req, res) => {
    console.log('📥 Received BlueBubbles event:', req.body);

    const { type, data } = req.body;

    // ✅ Ensure we process only "new-message" events
    if (type !== "new-message" || !data) {
        console.error("❌ Invalid or missing message data:", req.body);
        return res.status(200).json({ status: 'ignored', message: 'Invalid event type or missing data' });
    }

    const { guid, text, isFromMe, handle } = data;
    const address = handle?.address;

    // Check for duplicate GUID in Redis
    redisClient.get(guid, async (err, result) => {
        if (err) {
            console.error('❌ Error checking GUID in Redis:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result) {
            console.log('❌ Duplicate GUID detected, ignoring...');
            return res.status(200).json({ status: 'ignored', message: 'Duplicate GUID' });
        }

        // Store GUID in Redis with a 24-hour expiration
        redisClient.setex(guid, 24 * 60 * 60, JSON.stringify(data), (err) => {
            if (err) {
                console.error('❌ Error storing GUID in Redis:', err);
            } else {
                console.log('✅ GUID stored in Redis for 24 hours');
            }
        });

        if (!guid || !text || !address ) {
            console.error("❌ Missing required fields in BlueBubbles event:", data);
            if (!guid) console.error("❌ Missing field: guid");
            if (!text) console.error("❌ Missing field: text");    
            if (!address) console.error("❌ Missing field: address");
            return res.status(200).json({ status: 'ignored', message: 'Missing required fields' });
        }

        console.log(`🔍 New message from ${isFromMe ? "Me (Sent from iMessage)" : address}: ${text}`);

        try {
            // ✅ Find the corresponding contact in Go High-Level
            const ghlContact = await axios.get(
                `https://services.leadconnectorhq.com/contacts/?query=${address}&locationId=${LocationId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
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
                        "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
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
                        'conversationProviderId': '67d49af815d7f0f0116431cd',
                        'conversationId': conversationId,
                        'message': text,
                        'direction': isFromMe ? 'outbound' : 'inbound',
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                            "Content-Type": "application/json",
                            "Version": "2021-04-15"
                        }
                    }
                );

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
});

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles
app.post('/ghl/webhook', checkTokenExpiration, async (req, res) => {
    console.log('📥 Received Go High-Level event:', req.body);

    // Directly destructure the fields from req.body
    const { phone, message, userId, conversationProviderId, messageId } = req.body;

    // ✅ Filter events by conversation provider ID, userId, and phone
    if (conversationProviderId !== '67d49af815d7f0f0116431cd') {
        return res.status(200).json({ status: 'ignored', message: 'Event from unsupported conversation provider' });
    }

    if (userId !== '36E2xrEV92vFl7b1fUJP') {
        console.log("❌ Ignoring event from unsupported user:", userId);
        return res.status(200).json({ status: 'ignored', message: 'Event from unsupported user' });
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

    try {
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

        // ✅ Update the status of the message in Go High-Level before forwarding to BlueBubbles
        try {
            const ghlResponse = await axios.put(
                `https://services.leadconnectorhq.com/conversations/messages/${messageId}/status`,
                {
                    status: "delivered"
                },
                {
                    headers: {
                        "Accept": "application/json",
                        "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                        "Version": "2021-04-15"
                    }
                }
            );

            if (ghlResponse.status === 200) {
                console.log("✅ Message status updated in Go High-Level!", ghlResponse.data);
            } else {
                console.error("❌ Failed to update message status in Go High-Level:", ghlResponse.data);
                return res.status(500).json({ error: "Failed to update message status in GHL" });
            }
        } catch (error) {
            console.error("❌ Error updating message status in Go High-Level:", error.response ? error.response.data : error.message);
            return res.status(500).json({ error: "Internal server error" });
        }

        // ✅ Send the message to BlueBubbles
        const tempGuid = `temp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        console.log(`🔍 Sending message to BlueBubbles chat with GUID: ${chatGuid} and tempGuid: ${tempGuid}`);
        const sendMessageResponse = await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/message/text?password=${BLUEBUBBLES_PASSWORD}`,
            {
                chatGuid: chatGuid,
                tempGuid: tempGuid,
                message: message,
                method: "apple-script"
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Message successfully forwarded to BlueBubbles!", sendMessageResponse.data);

        res.status(200).json({ status: 'success', message: 'Message forwarded to BlueBubbles and status updated in GHL' });

    } catch (error) {
        console.error("❌ Error processing Go High-Level message:", error.response ? error.response.data : error.message);
        if (error.response) {
            console.error("❌ BlueBubbles API error response:", error.response.data);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});