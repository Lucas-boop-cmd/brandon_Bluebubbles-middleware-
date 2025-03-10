// ✅ Ensure Express is set up first
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// ✅ Add GET route to check if webhook is live
app.get('/ghl/webhook', (req, res) => {
    console.log("✅ Webhook GET request received.");
    res.status(200).json({ message: "Webhook is active and listening!" });
});

// ✅ Add POST route for actual webhook processing
app.post('/ghl/webhook', async (req, res) => {
    console.log('🔍 Full Webhook Request Body:', JSON.stringify(req.body, null, 2));

    const { phone, messageId, message, event } = req.body;
    if (!phone || !messageId || !message) {
        console.error("❌ Missing required fields:", req.body);
        return res.status(400).json({ error: "Missing required fields: phone, messageId, or message" });
    }

    res.status(200).json({ status: 'success', message: 'Webhook received' });
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


