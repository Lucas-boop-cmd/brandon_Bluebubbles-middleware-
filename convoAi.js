require('dotenv').config();
const axios = require('axios');
const { client } = require('./dataBase'); // Import client

// Load tokens from the database
const BLUEBUBBLES_API_URL = process.env.BLUEBUBBLES_API_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;
const LocationId = process.env.LOCATION_ID;

module.exports.processInboundMessage = async (eventData) => {
    console.log('📥 Processing InboundMessage event:', eventData);

    const { body, contactId, conversationId, messageType, messageId } = eventData;

    if (!contactId || !conversationId || !body || !messageId) {
        console.error("❌ Missing required fields in InboundMessage event:", eventData);
        throw new Error("Missing required fields");
    }

    console.log(`🔍 New message from ${contactId}: ${body}`);

    try {
        // Retrieve the access token from Redis
        const redisKey = `tokens:${LocationId}`;
        console.log('🔑 Redis key for access token:', redisKey);
        const accessToken = await client.hGet(redisKey, 'accessToken');

        if (!accessToken) {
            console.error('❌ Access token not found in Redis!');
            throw new Error('Access token not found in Redis');
        }

        console.log('✅ Retrieved access token from Redis.');

        // Fetch opportunities for the contact
        const opportunitiesUrl = `https://services.leadconnectorhq.com/opportunities/search?location_id=${LocationId}&contact_id=${contactId}`;
        console.log("🔍 Fetching opportunities from URL:", opportunitiesUrl);
        const opportunitiesResponse = await axios.get(opportunitiesUrl, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Version": "2021-07-28",
                "Accept": "application/json"
            }
        });

        console.log("✅ Opportunities response:", opportunitiesResponse.data);

        const opportunities = opportunitiesResponse.data.opportunities || [];
        const filteredOpportunities = opportunities.filter(opp => opp.pipelineId === 'miROu60WWLR1DxsvvAu1');

        if (filteredOpportunities.length === 0) {
            console.log("❌ No opportunities found with the specified pipelineId.");
            return;
        }

        console.log("✅ Found matching opportunity:", filteredOpportunities[0]);

        // Fetch contact details to get the phone number
        const contactResponse = await axios.get(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Version": "2021-07-28",
                    "Accept": "application/json"
                }
            }
        );

        const contact = contactResponse.data.contact;

        if (!contact || !contact.phone) {
            console.log("❌ Contact or phone number not found.");
            throw new Error("Contact or phone number not found");
        }

        const contactPhone = contact.phone;
        console.log(`✅ Contact phone number: ${contactPhone}`);

        // Query for the handle to get the service
        const handleUrl = `${BLUEBUBBLES_API_URL}/api/v1/handle/${encodeURIComponent(contactPhone)}?password=${BLUEBUBBLES_PASSWORD}`;
        const handleResponse = await axios.get(handleUrl);

        const service = handleResponse.data.data.service;

        if (!service) {
            console.log(`❌ No service found for phone number: ${contactPhone}`);
            throw new Error("No service found for handle");
        }

        const chatGuid = `${service};-;${contactPhone}`;
        console.log(`✅ Constructed Chat GUID: ${chatGuid} for ${contactPhone}`);

        // Mark chat as read in BlueBubbles
        await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/chat/${chatGuid}/read?password=${BLUEBUBBLES_PASSWORD}`,
            {},
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("✅ Chat marked as read in BlueBubbles!");

        // Wait for 5 seconds (increase to 5 seconds for better reliability)
        console.log("⏳ Waiting for 5 seconds before sending the typing indicator...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // ✅ Send typing indicator to BlueBubbles
        console.log(`🔍 Sending typing indicator to BlueBubbles with GUID: ${chatGuid}`);
        const typingResponse = await axios.post(
            `${BLUEBUBBLES_API_URL}/api/v1/chat/${chatGuid}/typing?password=${BLUEBUBBLES_PASSWORD}`,
            {} // Empty data
        );
        console.log("✅ Typing indicator sent to BlueBubbles!", typingResponse.data);

    } catch (error) {
        console.error("❌ Error processing InboundMessage event:", error);
        throw error;
    }
};
