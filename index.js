const express = require('express');
const axios = require('axios');
const app = express();
const { storeGUID, loadGUIDs } = require('./dataBase'); // Import database functions

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjIyMDk0Mi45NjIsImV4cCI6MTc0MjMwNzM0Mi45NjJ9.rw5UDFVbPeswaDt0_vmFD55gYFN8lehGMAP3SJqjtlfDKl4RF8K2xF8WogB1QbIT8fEQeLv46OU4kmfGgZPHA1lnAKrxRX_AYK4UjatFMmXKaKtmFTjp083IvSswCwQgVZuruEMgSlUAoAFX28oI7Lwx-OZc7Uk81dvdGtkKII5WuvQv00gRK2fgm5IDPX3c2lw118OqNBdOYTCLJahgOF2lLw17-GKrEpZu7jHbXR3qM-V78mtZZLofaF1Mp7PT62l-QtwR6G6PvK1VrREL_0wAOzpvHo9qi1vFbJo_Z4kz_YiqRCMado3rX2uGnWyiJ0He0zQ_SwSxeB9OUuIlpBc-Zvs27twHMhKHAEh1z0I2ev5XW-GN1h-uosylfe4MwTMmLXFvV2Cb1PQA9pt1nTq-sa7xCz_zfJPJwAtl9AKijOgWMxgfOWILS9lspRoldo9lBBziNaMBipy-h4kfG4H7p-YGBcBJgc5TUJeXXPxpx7cdGau3FPxw7LuYmhjZ78NOdjJz_B8-rjLBIxKUmVIPkmnMnt10_pBU5p9LnKrzRBiYXEyvj7v_CeNQWHdh_dx36vL0RfdWk2DjB8gdzmVCVuizA-vw4NO6l1tCgCe8aiNp7Rp6DTxY9Mcz1-BeibIjo_hppg2Q6pcR7iZx2NIgtlDuPkKpNBhr2AUrzKA';
let GHL_REFRESH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjIyMDk0Mi45NzIsImV4cCI6MTc3Mzc1Njk0Mi45NzIsInVuaXF1ZUlkIjoiYzViMGY4NzItMzUwNi00ZDA0LTllYTItMjNkZjhkZDg1YTJlIn0.Ogz-eS3hKgnE8mzzsPL2DXorJD6LrZdEPTy8XN8ujfB4PCLtkRda6z9VNrCm-J5XuOMKK3umZSj-YLchnNOjS6hUO8psLoteJlBKgjh_QG-Z7sSuBBG5uQWQ296nO_o9gdCh8mXveOV0RIWQJ5ljhRojtNyKjHPRvIjVKvcLtaqiz2HeOHIf2-MJNWL9zkVT2GcQpejafpcLQ67foo64kRJDsSZmqrSk_oxVPUqrDJiu80mRH2EDK1PpWrQqZKP3l_YPQpMlQXNeNJF8KnvDcw4cWI35a_7urecgV0qDB5jE3MGR0NHEnNL0EupB0Dv57IlBVOFnn5Knh3zVCMtOjODrtX_XykWx6T6vDZNFqfVdlfIWbvvQxmYyPyvcxegK0ZIq8h22FwE2CFsC1qVKSgWZ2z6iNqfnkPhm99czUUOf6BxhA93GLzctgYYK7WhtJqgiYa9X78TsF_INPA_ESl6RgOJrcj18_r7TeL14WRUDmnEyus4__fR18iz3nH_Yjq33jaL-VPapubqv7EVyUOxXKV51MyI8Cw5zgTuLbf2-G_7Err2nE4esb04aXy9L_FQA9yaurmyZ-Mrca68xHU15xrCfutA4cL9gvudn-gaX67hMX0BdAlyz3XzTbBC4NCbbVmanpmsOykTT2G9LofhBRBHamoDN76Lo5CYlyAY';
const CLIENT_ID = '67d499bd3e4a8c3076d5e329-m899qb4l';
const GHL_CLIENT_SECRET = 'c8eefd7b-f824-4a84-b10b-963ae75c0e7c';
const LocationId = 'h4BWchNdy6Wykng1FfTH';
let tokenExpiration = Date.now() + 22 * 60 * 60 * 1000; // 22 hours from now

// Store to keep track of the last message text from Go High-Level
const lastGHLMessages = new Map();

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

    const { guid, text, isFromMe, handle, originalROWID } = data;
    const address = handle?.address;

    // ✅ Check if GUID already exists in the database
    const existingGUIDs = loadGUIDs();
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

    // Check if the last Go High-Level message equals the current BlueBubbles event text
    if (lastGHLMessages.get(address) === text) {
        console.log('❌ Duplicate message from GHL detected, ignoring...');
        return res.status(200).json({ status: 'ignored', message: 'Duplicate message from GHL' });
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