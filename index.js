const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MTk4NzIzMS4yNDksImV4cCI6MTc0MjA3MzYzMS4yNDl9.cCRn-8sj2pmT1jYyNZDjWFXbaYe4aZVeODSyJ86RdCu9R2ONSYcdbjBm6PALppxuOAWnDfvjzbc8UJh9Yxsut-w81PD8AGSjw9pLCGiRdX02FUZJvdrxoKBDPnhGvNd4L47FT45Urx5S3KGgImBb_RJKCIWnD5lqcbHfz7YJirgAxv8Vv1f7iL9THGMjRSTa4exLdTmYhRysFg0z50ONgT1ORKOsMMk4x9gtdlLexk4jFSgGQehvEvMDuOOBUfsaOPpoV3EKhNZWzUmileu5eZgSwWMee4iAyIwfQZpfJ8CdT8syyOXuQHuAlYf2WwCFQOCaAJX-rRHY4eKWEDr--SqTPwensizFj7JtwxyrANJchMq3jlfHP40mOxrkHYSgA9IxUxEqU0pq96uc12oGb9SioDSboAHcqOJ4M1wPJas6XhfG1DL9bNyCMH1D049Lm5Odv-5Nr7toCVtkaCXJ3oz-Khkc4IRkoKDEyteHxfFQmn9MXZjq2_4_H8Cqeq8voq-eskhs1LO1gzeg-IhBW0rg5nLSfX25oTGDjFlIR7ZTV9OUaPYQRa2TC6-dCO8RH5738kH4kQm_28A7W1BaugTqnbRYMZeWzx74pOfFl7vD-w-2qkQCI_PktkonnvkrdQHv4zuaBbhZIPMRkrH5WgWtYXismanCNnsNidmVG6Q';
let GHL_REFRESH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MTk4NzIzMS4yNTYsImV4cCI6MTc3MzUyMzIzMS4yNTYsInVuaXF1ZUlkIjoiNjFiNTUzZDMtNzcxNi00OTQwLThmNTItNjc1NDQ3OTg4MWRlIn0.VFHVKi6yagIf2WNf2sPaw_Is1WsvwWgenLJGuUhJmB-SF3O1VMC8YJq1vGQ0uKrNkV6pxJSFXc8iyQKr9ibbEX4hJS3aiPlR1OxAc8hsdceFxbj3Q4Ae6YI4b7XFYjhGZ6Jl3__zHxqzSBBq3CtC3Psm6QSrws5HAt0hDOXka7mdPJyFKhLSsNG4oIDlSFarhOylzJ66M7TiyFQz0NG8xbyXWezVv9o5B2GXg5kvFawNpQz0EfJnOeSVpBarsB-ovez0EOFt6je2vkUsCmB5OzxNoeg80mp7ynJ_P3QGlxkK9Q5NGyWENEhKJNNd_ruBzhFx_ydE40Q-oS-H_OMvcYKXgGP6CdaB23Q3OPQHfx9Jv9yfqrT2kGbOFns4o-5wECBvTR3t_FDdBVSAMtKHff3XHe4ADkXqcsbhEWq76EjWWkMCMlXPPnMe8WYJRtYvv3j6sUutZjQvYe21RC6XD1qVhLYKXXbIqcJmFILRJLPlVwGfEZlyPV3Ub65Fhu7v53ZYl1eX5i3Rrz38_zv-jidwPh6T8hBHp7UOyptSqC0CFDbg2i3XpaXQRNmzCTYfLAeEimJR3k88-m34WeEPwazAAL3MAT-BDTVw5NYyJMSu7YLabHV6P8iNAW9faqRjfikhP2wm3-Aqx1CWbD6FaefesstaxILnD8GVYCPu58A';
const CLIENT_ID = '67d499bd3e4a8c3076d5e329-m899qb4l';
const GHL_CLIENT_SECRET = 'c8eefd7b-f824-4a84-b10b-963ae75c0e7c';
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