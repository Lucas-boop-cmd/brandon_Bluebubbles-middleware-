import express from 'express';
import axios from 'axios';
import { checkAndRefreshToken, uploadTokens, searchGUIDsByHandleAddress, loadTokens, client } from './dataBase.js'; // Import client
const app = express();

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
// Load tokens from the database
let tokens = await loadTokens();
let GHL_ACCESS_TOKEN = tokens.GHL_ACCESS_TOKEN;
let tokenTimestamp = tokens.timestamp || 0;

const LocationId = 'h4BWchNdy6Wykng1FfTH';

// Store to keep track of the last message text from Go High-Level
const lastGHLMessages = new Map();

// Middleware to check token expiration before API calls
async function checkTokenExpiration(req, res, next) {
    const { GHL_ACCESS_TOKEN: newAccessToken, tokenTimestamp: newTokenTimestamp } = await checkAndRefreshToken();
    GHL_ACCESS_TOKEN = newAccessToken;
    tokenTimestamp = newTokenTimestamp;
    next();
}

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
app.post('/bluebubbles/events', checkTokenExpiration, async (req, res) => {
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
    console.log('🔍 Querying Redis for existing GUIDs...');
    const existingGUIDs = await client.lRange('guids', 0, -1);
    const isDuplicate = existingGUIDs.some(entry => JSON.parse(entry).guid === guid);
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

    // Check if the last Go High-Level message equals the current BlueBubbles event text
    if (lastGHLMessages.get(address) === text) {
        console.log('❌ Duplicate message from GHL detected, ignoring...');
        return res.status(200).json({ status: 'ignored', message: 'Duplicate message from GHL' });
    }

    console.log(`🔍 New message from ${isFromMe ? "Me (Sent from iMessage)" : address}: ${text}`);

    try {
        // ✅ Find the corresponding contact in Go High-Level
        await checkTokenExpiration(req, res, async () => {
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
                        'conversationProviderId': '67dc4a38fd73f8e93e63b370',
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
        });

    } catch (error) {
        console.error("❌ Error processing BlueBubbles message:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles (POST)
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
            await checkTokenExpiration(req, res, async () => {
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
                    console.log("✅ Message status updated in Go High-Level!", ghlResponse.data, messageId);
                } else {
                    console.error("❌ Failed to update message status in Go High-Level:", ghlResponse.data);
                    return res.status(500).json({ error: "Failed to update message status in GHL" });
                }
            });
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

        // Store the last message text and messageId from Go High-Level
        lastGHLMessages.set(phone, { text: message });

        // Store the response GUID in Redis
        const responseGUID = sendMessageResponse.data.data.guid;
        console.log(`🔍 Storing response GUID in Redis: ${responseGUID}`);
        await client.rPush('guids', JSON.stringify({ guid: responseGUID, timestamp: Date.now() }));

        res.status(200).json({ status: 'success', message: 'Message forwarded to BlueBubbles and status updated in GHL' });

    } catch (error) {
        console.error("❌ Error processing Go High-Level message:", error.response ? error.response.data : error.message);
        if (error.response) {
            console.error("❌ BlueBubbles API error response:", error.response.data);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Webhook to Connect External Account (GET)
app.get('/ghl/webhook', async (req, res) => {
    console.log('📥 Received GET request for connecting external account:', req.query);

    // Destructure query parameters
    const { client_id, scope, response_type, state, redirect_uri } = req.query;

    if (!client_id || !scope || !response_type || !state || !redirect_uri) {
        console.error("❌ Missing required query parameters");
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    console.log(`🔍 Received client_id: ${client_id}, scope: ${scope}, response_type: ${response_type}, state: ${state}, redirect_uri: ${redirect_uri}`);

    // Respond with the received query parameters and account details
    res.status(200).json({
        message: 'Account connected successfully',
        account: {
            name: 'Tru Rate Lending',
            status: 'connected'
        },
        client_id,
        scope,
        response_type,
        state,
        redirect_uri
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});