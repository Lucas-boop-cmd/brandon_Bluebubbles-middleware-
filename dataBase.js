require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('redis');
const cron = require('node-cron');

// Configure Redis client with Redis Cloud endpoint and authentication
const client = createClient({
    username: 'default',
    password: 'E8ANdkGNjqXiDdkZ1CzqX4F4KAamWy0x',
    socket: {
        host: 'redis-13785.c241.us-east-1-4.ec2.redns.redis-cloud.com',
        port: 13785
    }
});
client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

client.connect().catch(err => {
    console.error('❌ Redis connection failed:', err);
    process.exit(1); // Exit the process if Redis connection fails
});
const filePath = path.join(__dirname, 'database.json');

// Load existing GUIDs or return an empty array if file doesn’t exist
async function loadGUIDs() {
    const guids = await client.lRange('guids', 0, -1);
    return guids.map(guid => JSON.parse(guid));
}

// Save GUIDs to Redis
async function saveGUIDs(guids) {
    await client.del('guids');
    for (const guid of guids) {
        await client.rPush('guids', JSON.stringify(guid));
    }
}

// Store a new GUID with timestamp and handle address
async function storeGUID(guid, handleAddress) {
    const guids = await loadGUIDs();
    const timestamp = Date.now();

    guids.push({ guid, timestamp, handleAddress });
    await saveGUIDs(guids);

    // Create an index for searching GUIDs by handle address
    await client.hSet('handle_index', handleAddress, JSON.stringify({ guid, timestamp }));
}

// Remove GUIDs older than 48 hours
async function cleanOldGUIDs() {
    const guids = await loadGUIDs();
    const expiryTime = Date.now() - (48 * 60 * 60 * 1000);

    const filteredGUIDs = guids.filter(entry => entry.timestamp > expiryTime);
    await saveGUIDs(filteredGUIDs);
}

// Automatically clean old GUIDs every 48 hours
setInterval(cleanOldGUIDs, 48 * 60 * 60 * 1000);

// Search GUIDs by handle address
async function searchGUIDsByHandleAddress(handleAddress) {
    if (typeof handleAddress !== 'string') {
        throw new TypeError('Invalid argument type');
    }
    const guids = await client.hGet('handle_index', handleAddress);
    return guids ? [JSON.parse(guids)] : [];
}

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
cron.schedule('0 8 * * *', async () => {
    console.log('🔄 Running scheduled token refresh...');
    await RefreshTokens();
}, {
    timezone: "America/New_York"
});

console.log('⏳ Token refresh cron job scheduled for 8:00 AM Eastern Time');

module.exports = { 
    client, 
    storeGUID, 
    loadGUIDs, 
    saveGUIDs, 
    cleanOldGUIDs, 
    loadTokens, 
    saveTokens, 
    setGHLTokens, 
    RefreshToken, 
    searchGUIDsByHandleAddress 
};