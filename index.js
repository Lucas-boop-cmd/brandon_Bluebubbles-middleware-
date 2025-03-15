const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjA0NDc0OC44MzQsImV4cCI6MTc0MjEzMTE0OC44MzR9.PS2QReWH2cLou58ijWXepjLmNQZU-NAwRbFwmqoKDMbvN1b0iLbTvmAjPfXw5A6gfUzMqC9NjazKtggoJQZ8DMHjIvjKNFvFm7rWKLnAoothbqlQXva64OxVPf3PxZ6LR_ApF30D9RdRBhNv49ci0u72X5_PYLQQlSHsWRe_nzsOKZy7VKwS1a0dRVo0cQbrfTBZglL6CnaWYYIV9D8-7EsP3_u7Pe_aNFfxfSwtPNDTnymqtUBXkcYXvVl-VHazqkL-5UCyXK95dkmSjIL2hPcwc3KaAr4pSmL3q2SKnqllTnlbncezZrSPVGbzpFsHfhHMDq9mj8PTPAJoFhzJfLp109qaKnahRL_m9NTH9rqUGuOaajm9V597GDdcRlkn8-uSr8Q20JsteTNSmM8rVxJ0RBhXeCcKS4UrVODxnMrZKq9cljPK5iNlcM6LqWPN-KdHPvUJgah8TBnVDVUgxG2jEpHsntazY9rI0EuLP8weyKV9vSmpReBrFSbBB7BLS4Y2Z86ap0e4icCR7x2kS7UpdTOVwxAk79NEs6eoIDHisssJVemzU5KCTLdB9ExqRjGmv-KgU63y0V3U0VHx407lwILkA9Bxykfk7mEJMriHGNRks2nWVpjMX38Nrj4O5-Q8vvTWJUjRNKLB7FVfGIj7kj6k3QsbzNxjxoamDcg';
let GHL_REFRESH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjA0NDc0OC44NDEsImV4cCI6MTc3MzU4MDc0OC44NDEsInVuaXF1ZUlkIjoiODU0MDI3YjEtYzhjZi00NWJjLWI2MGUtNDMyMTI4NTI3MWUwIn0.LxFxK2G_T8mw-zlpG5NPgWuSjzmA8Z7zIpmc2jE1MoVKfshonbGc6BjvmjqGWJxNURSJPs3RO6qNGVPXNlKnznU1WQZ6OYtSlub1rozDFwvLJQiAvtCtUuT2z-7Fo9doBLniLBoT-dVtJ-v5wZB6e8UPGM5x-96ba9Xk272nOH6QU7RfJnq6E89SlgQba_8gjkAZ13eykxx2XFleR63gFB6-23Rykc7PP31Wk__OW5LOhPKf46WO4F_eBOHBoaoPYkk7y1zG7GkZFX4nVMUDR8ge-hyj0rpFxTFE4qgzaKgiVXj8bB5TgevAe3mPUw7Wde1cX1BX4fwRHKer2YDyGYs_hd2Wet2cENrdvEnl-KEdz6oaToBgV69UDg9hEd6Ofx490dpsPTYa1jkxIX4fW_TcS92INeVPCvSfKJqW0XXmKzJRd9Ca05YUViDucKquc_2KFJD-WVnBUNiZPbYtV8KX1yKPd_y_Xn6u_zWr7nukcp3QU0Ab16q3nXoNhiDhoHj66jbWwtoeKJzmve4G4SnDC7f5Fv1fkReKjViuo_Q4mP2cKpoc9btFyQQHCUP0-0JpYoIm5PsQ-1bf2XulN-MLFbUDu0Onaf8Itw3oAtlye-c8FXD-GMEyNNMODsYPx834UTmOaf0Pqh3ZxQbt_F-iBRMHj8AGfmTkDRiwEbo';
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
        return res.status(400).json({ error: "Invalid event type or missing data" });
    }

    const { guid, text, isFromMe, handle } = data;
    const address = handle?.address;

    if (!guid || !text || !address) {
        console.error("❌ Missing required fields in BlueBubbles event:", data);
        if (!guid) console.error("❌ Missing field: guid");
        if (!text) console.error("❌ Missing field: text");    
        if (!address) console.error("❌ Missing field: address");
        return res.status(400).json({ error: "Missing required fields" });
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
            return res.status(404).json({ error: "No existing contact found" });
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
            return res.status(404).json({ error: "No existing conversation found" });
        }

        // ✅ Send the message to Go High-Level
        try {
            await axios.post(
                `https://services.leadconnectorhq.com/conversations/messages/${isFromMe ? "outbound" : "inbound"}`,
                {
                    'type': 'SMS', 
                    'conversationProviderId': '67d49af815d7f0f0116431cd',
                    'conversationId': conversationId,
                    'message': text,
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

        // ✅ Update the status of the message in Go High-Level
        try {
            const ghlResponse = await axios.put(
                `https://services.leadconnectorhq.com/conversations/messages/${messageId}/status`,
                {
                    status: "delivered",
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
            }
        } catch (error) {
            console.error("❌ Error updating message status in Go High-Level:", error.response ? error.response.data : error.message);
        }

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