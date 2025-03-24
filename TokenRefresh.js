require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

// Check token expiration and refresh if needed
async function RefreshTokens() {

    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            {
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: GHL_REFRESH_TOKEN,
                user_type: 'Location'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        process.env.GHL_ACCESS_TOKEN = response.data.access_token;
        process.env.GHL_REFRESH_TOKEN = response.data.refresh_token;

        console.log(`✅ GHL API token refreshed successfully at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`);
    } catch (error) {
        console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
    }
}
// Schedule a cron job to refresh tokens at 8 am every morning Eastern Time
// cron.schedule('0 8 * * *', async () => {
//     console.log('🔄 Running scheduled token refresh...');
//     await RefreshTokens();
// }, {
//     timezone: "America/New_York"
// });

// console.log('⏳ Token refresh cron job scheduled for 8:00 AM Eastern Time');
