// ✅ Ensure Express is set up first
const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.json());

// ✅ Load environment variables
let ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN;
let REFRESH_TOKEN = process.env.GHL_REFRESH_TOKEN;
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

// ✅ Debugging: Log Environment Variables
console.log("🔍 Checking Environment Variables:");
console.log("GHL_CLIENT_ID:", CLIENT_ID ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_CLIENT_SECRET:", CLIENT_SECRET ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_REFRESH_TOKEN:", REFRESH_TOKEN ? "✅ Loaded" : "❌ Not Found");
console.log("GHL_ACCESS_TOKEN:", ACCESS_TOKEN ? "✅ Loaded" : "❌ Not Found");

// ✅ Function to Refresh Access Token
async function refreshAccessToken() {
    try {
        console.log("🔄 Refreshing Access Token...");

        const requestBody = new URLSearchParams();
        requestBody.append("grant_type", "refresh_token");
        requestBody.append("client_id", CLIENT_ID);
        requestBody.append("client_secret", CLIENT_SECRET);
        requestBody.append("refresh_token", REFRESH_TOKEN);
        requestBody.append("user_type", "Company");

        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            requestBody.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        ACCESS_TOKEN = response.data.access_token;
        REFRESH_TOKEN = response.data.refresh_token; // ✅ Store the new refresh token

        console.log("✅ New Access Token:", ACCESS_TOKEN);
        console.log("🔄 Updated Refresh Token:", REFRESH_TOKEN);
        console.log(`⏳ Next refresh scheduled in 20 hours.`);

    } catch (error) {
        console.error("❌ Failed to refresh access token:", error.response ? error.response.data : error.message);
    }
}

// ✅ Schedule the first token refresh 1 hour (3600000ms) after deployment
setTimeout(() => {
    refreshAccessToken(); // 🔄 First refresh after 1 hour
    setInterval(refreshAccessToken, 20 * 60 * 60 * 1000); // 🔄 Then refresh every 20 hours
}, 60 * 60 * 1000);

console.log("⏳ First token refresh scheduled for 1 hour from now...");

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
