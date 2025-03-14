const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'your_ineyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsiY29udmVyc2F0aW9ucy5yZWFkb25seSIsImNvbnZlcnNhdGlvbnMud3JpdGUiLCJjb252ZXJzYXRpb25zL21lc3NhZ2UucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zL21lc3NhZ2Uud3JpdGUiLCJjb250YWN0cy5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwib2F1dGgucmVhZG9ubHkiLCJ1c2Vycy5yZWFkb25seSJdLCJjbGllbnQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUiLCJjbGllbnRLZXkiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X21vbnRobHlfMjk3In0sImlhdCI6MTc0MTk3ODA0Ni4xNjMsImV4cCI6MTc0MjA2NDQ0Ni4xNjN9.AC4Edy_fyOsQQS7MIScGN0xzHkGLlHY84XgiLPTKvQi7SEetbIItDw3SdBuZr81LDkhz-lMce4KqcsLD9i7YcWn-f3o47fmaDlfsc0MUWVX_lR0aIj30yaRuOLconm0_14_9AdNNqtP3pnur3Giq-70u55ao4Qgmq1G0YRfY0NQKDOdf41fC2sG8YyTkvFU0xprF5m7a9sLY1a49ve8Q-2JKi3XcTZO4KpqdjUBsRXED5K0c316G0QD45yMC3_n84I453F1yLMkPUZ7yZQf1wO4lHTHghnbRFpEnZ2ZD0CXOxH6yWfMeyBL8ItXCqk3rvWMWyzlgzdrkBAHn4W8Y1yYLJZ8bGy6lhM7I3HNE0pU7_QNdNokzftjjsXLxmwzLUiD37ryM4PJjbnivXblHH5Z18ZxvP61jZLhFBg9RuLn8FEzM0c5WN7ghaaYO7ttXuZjfRRArpMcK1GfibYKSniZoiGhHm9hwBXdqMa78hdOIYZLSAL0uN71nYNTKytghZxwre7zV3Eb5Uo4nPHTts8I31tNtT1n8iSvxuVnn-WxJsg1yeR2DSd9_AabvNWZGxGNysCooP9xy5vhSa1Sc1ovY1Cu5S9BOJUX1fkp39AZBOI5GHjfjmbJT-jZGRfaxiD4N3G2knnTrJuprQXavGRAI2rgwtwiqeHvcebZoUD8itial_ghl_api_token';
let GHL_REFRESH_TOKEN = 'yeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsiY29udmVyc2F0aW9ucy5yZWFkb25seSIsImNvbnZlcnNhdGlvbnMud3JpdGUiLCJjb252ZXJzYXRpb25zL21lc3NhZ2UucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zL21lc3NhZ2Uud3JpdGUiLCJjb250YWN0cy5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwib2F1dGgucmVhZG9ubHkiLCJ1c2Vycy5yZWFkb25seSJdLCJjbGllbnQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUiLCJjbGllbnRLZXkiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oifSwiaWF0IjoxNzQxOTc4MDQ2LjE2OSwiZXhwIjoxNzczNTE0MDQ2LjE2OSwidW5pcXVlSWQiOiJjMjQzYTE2My01NjIzLTRkNzktODk3MS0wMGNiOTQ4NjQyMjQifQ.DGeW8yQ3xb6i_rD6TG3bdh5Ps3GZqQLFg7T8ldJl__QSEGii-ttaAzHuTmHgD81rmsH3ECJhzphuRdklLZzENWJtKiz_ocVFIgwc71Gmh8wZ4_0DL2XJUewTYHSD1ZWwAuBIKa5VVsN3r_fhZRCwv1CbF-Dh8HBopICALv_RNFjlnecUnLHnFwuNzhZvkftZVZMEGwcIEVeYF81wWVwQQk9U-ygYzZtp9w5RlfodAjEfWX_jWikSUDwN23UrzQlB9kOTAb57uCFYHHMEWYbAlMNuE9ZU5kF6D0515fWFacf9Xi9lpL0huMUJ2QHOT_o26a6ugafRdMv9g9h0T42JWZMRXEFx9RDd60_U8JVeEJRNxqA-8l2O-JAMyfYWRguLyegdOpBwTDcFX0dvCkafSVZCjHDcskBOqBXjFoqhW90MOMTcwMhrMXiKCetFOWFy3RC8V1MxvXijtPSaPFEq1UEv-oyQTzTQtyrQuxPDjriMEHZGICGDGPiKBA6Ng4BBdmOdr8EtNthadSH-sOLZ4EpLuob5kY78peP-YShX2FokxUxtnY984EkshrzRnpVFJgfUGn0hNbyjJUsh7TrXME4EUT5qjqbY85f-mWkUxLC22ChNt3SZ1fJznBOw_68Bi_S3WVToXKeOoYsZdi9tyi2kRxwe5oxi9OkKidQ7z08our_ghl_refresh_token';
const CLIENT_ID = '67cee36e6c231181cd31c1de-m839n07j';
const GHL_CLIENT_SECRET = '6eaa7eb4-5408-49b2-a02d-afd1d6adcf9e';
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

    const { guid, text, address, isFromMe } = data;

    if (!guid || !text || !address) {
        console.error("❌ Missing required fields in BlueBubbles event:", data);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 New message from ${isFromMe ? "Me (Sent from iMessage)" : address}: ${text}`);

    try {
        // ✅ Find the corresponding conversation in Go High-Level
        const ghlConversation = await axios.get(
            `https://services.leadconnectorhq.com/conversations?phone=${address}`,
            {
                headers: {
                    "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                    "Version": "2021-04-15"
                }
            }
        );

        let phone = ghlConversation.data?.conversations?.[0]?.id;

        // ✅ If conversation does not exist, create one
        if (!phone) {
            console.log("📌 No existing conversation found, creating a new one...");

            const newConversation = await axios.post(
                'https://services.leadconnectorhq.com/conversations',
                { phone: address },
                {
                    headers: {
                        "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                        "Version": "2021-04-15"
                    }
                }
            );

            phone = newConversation.data.id;
        }

        // ✅ Send the message to Go High-Level
        await axios.post(
            `https://services.leadconnectorhq.com/conversations/messages/${isFromMe ? "outbound" : "inbound"}`,
            {
                phone: phone,
                message: text,
                sent_by: isFromMe ? "Me (Sent from iMessage)" : address
            },
            {
                headers: {
                    "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
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
                    error: {
                        code: "1",
                        type: "saas",
                        message: "There was an error from the provider"
                    },
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
                console.log("✅ Message status updated in Go High-Level!");
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