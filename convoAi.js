require('dotenv').config();
const axios = require('axios');
const { loadTokens } = require('./dataBase');

// Load tokens from the database
let tokens = loadTokens();
let GHL_ACCESS_TOKEN = tokens.GHL_ACCESS_TOKEN;
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;

// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles (POST)
app.post('/ghl/webhook', async (req, res) => {
    console.log('📥 Received Go High-Level event:');

    // Directly destructure the fields from req.body
    const { body, contactId, conversationId, type, messageId, conversationProviderId, direction } = req.body;

    // Filter to only process events of type 'InboundMessage'
    if (type !== 'InboundMessage' || conversationProviderId !== '67dc4a38fd73f8e93e63b370' || direction !== 'inbound') {
        console.log("❌ Ignoring non-SMS event:", type);
        return res.status(200).json({ status: 'ignored', message: 'Event is not of type SMS' });
    }

    if (!contactId || !conversationId || !body || !messageId) {
        console.error("❌ Missing required fields in Go High-Level event:", req.body);
        return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`🔍 New message from ${contactId}: ${body}`);

    try {
        // Fetch opportunities for the contact
        const opportunitiesResponse = await axios.get(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${process.env.LOCATION_ID}&contact_id=${contactId}`,
            {
                headers: {
                    "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                    "Version": "2021-07-28",
                    "Accept": "application/json"
                }
            }
        );

        const opportunities = opportunitiesResponse.data.opportunities || [];

        // Filter opportunities by pipelineId
        const filteredOpportunities = opportunities.filter(opp => opp.pipelineId === 'miROu60WWLR1DxsvvAu1');

        if (filteredOpportunities.length === 0) {
            console.log("❌ No opportunities found with the specified pipelineId.");
            return res.status(200).json({ status: 'ignored', message: 'No matching opportunities found' });
        }

        console.log("✅ Found matching opportunity:", filteredOpportunities[0]);

        // Fetch contact details to get the phone number
        const contactResponse = await axios.get(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
                headers: {
                    "Authorization": `Bearer ${GHL_ACCESS_TOKEN}`,
                    "Version": "2021-07-28",
                    "Accept": "application/json"
                }
            }
        );

        const contact = contactResponse.data.contact;

        if (!contact || !contact.phone) {
            console.log("❌ Contact or phone number not found.");
            return res.status(404).json({ error: "Contact or phone number not found" });
        }

        const contactPhone = contact.phone;
        console.log(`✅ Contact phone number: ${contactPhone}`);

        // ✅ Query for the handle to get the service
                console.log(`🔍 Querying BlueBubbles for handle with phone: ${contactPhone}`);
                const handleResponse = await axios.get(
                    `${BLUEBUBBLES_API_URL}/api/v1/handle/${encodeURIComponent(contactPhone)}?password=${BLUEBUBBLES_PASSWORD}`
                );
        
                console.log(`🔍 BlueBubbles handle response:`, handleResponse.data);
        
                const service = handleResponse.data.data.service;
        
                if (!service) {
                    console.log(`❌ No service found for phone number: ${contactPhone}`);
                    return res.status(404).json({ error: "No service found for handle" });
                }
        
                // Manually construct the chat GUID
                const chatGuid = `${service};-;${contactPhone}`;
                console.log(`✅ Constructed Chat GUID: ${chatGuid} for ${contactPhone}`);

        // ✅ Mark chat as read in BlueBubbles
        console.log(`🔍 Marking chat as read in BlueBubbles with GUID: ${chatGuid}`);
        await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/chat/${encodeURIComponent(chatGuid)}/read?password=${BLUEBUBBLES_PASSWORD}`,
            {}, // Empty data
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Chat marked as read in BlueBubbles!");

        // ✅ Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // ✅ Send typing indicator to BlueBubbles
        console.log(`🔍 Sending typing indicator to BlueBubbles with GUID: ${chatGuid}`);
        await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/chat/${encodeURIComponent(chatGuid)}/typing?password=${BLUEBUBBLES_PASSWORD}`,
            {}, // Empty data
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Typing indicator sent to BlueBubbles!");

        res.status(200).json({ status: 'success', message: 'Chat marked as read and typing indicator sent to BlueBubbles' });

    } catch (error) {
        console.error("❌ Error fetching opportunities:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "Failed to fetch opportunities" });
    }
});
