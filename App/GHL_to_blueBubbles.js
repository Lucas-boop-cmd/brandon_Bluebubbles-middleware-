// ✅ Webhook to Receive Messages from Go High-Level and Forward to BlueBubbles
app.post('/ghl/webhook', checkTokenExpiration, async (req, res) => {
    console.log('📥 Received Go High-Level event:', req.body);

    // Directly destructure the fields from req.body
    const { phone, message, userId, conversationProviderId, messageId } = req.body;

    // ✅ Filter events by conversation provider ID, userId, and phone
    if (conversationProviderId !== '67ceef6be35e2b2085ef1c70') {
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
        await axios.post(
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

        console.log("✅ Message successfully forwarded to BlueBubbles!");

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
                        "Authorization": `Bearer ${GHL_API_TOKEN}`,
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
        res.status(500).json({ error: "Internal server error" });
    }
});