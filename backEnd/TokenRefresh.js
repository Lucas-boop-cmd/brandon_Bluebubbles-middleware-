require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const { client, setGHLTokens } = require('./dataBase'); // Import the Redis client and setGHLTokens

const locationId = process.env.LOCATION_ID;
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

let refreshToken; // Declare refreshToken

// Before the RefreshTokens function, retrieve the refresh token from Redis
async function getRefreshToken() {
    try {
        const refreshTokenKey = `tokens:${locationId}`;
        refreshToken = await client.hGet(refreshTokenKey, 'refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token found in Redis. Please authorize the application first.');
        }
        return refreshToken;
    } catch (error) {
        console.error('Failed to retrieve refresh token from Redis:', error);
        return null; // Or handle the error as needed
    }
}

// Function to refresh GHL tokens
async function RefreshTokens() {
    try {
        // Ensure refreshToken is fetched before using it
        await getRefreshToken();

        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                user_type: 'Location'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const accessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        // Store the tokens in Redis using the setGHLTokens function from dataBase.js
        await setGHLTokens(locationId, accessToken, newRefreshToken);

        console.log(`✅ GHL API token refreshed successfully and stored in Redis for location ${locationId} at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`);
    } catch (error) {
        console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
    }
}

// Schedule a cron job to refresh tokens at 8:15 am every morning Eastern Time
cron.schedule('15 8 * * *', async () => {
    console.log('🔄 Running scheduled token refresh...');
    try {
        await RefreshTokens();
    } catch (error) {
        console.error('Cron job failed:', error);
    }
}, {
    timezone: "America/New_York"
});

console.log('⏳ Token refresh cron job scheduled for 8:15 AM Eastern Time');
