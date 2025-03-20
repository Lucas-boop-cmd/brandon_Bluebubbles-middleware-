import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createClient } from 'redis';

dotenv.config();

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

// Load tokens from Redis based on location ID
async function loadTokens(locationId) {
    const tokens = await client.hGet('ghl_tokens', locationId);
    return tokens ? JSON.parse(tokens) : {};
}

// Save tokens to the database
function saveTokens(tokens) {
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
    data.tokens = tokens;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Manually set GHL tokens with timestamp and location ID
async function setGHLTokens(accessToken, refreshToken, locationId) {
    const timestamp = Date.now();
    const tokens = {
        GHL_ACCESS_TOKEN: accessToken,
        GHL_REFRESH_TOKEN: refreshToken,
        timestamp,
        locationId
    };
    await client.hSet('ghl_tokens', locationId, JSON.stringify(tokens));
    await client.expire('ghl_tokens', 18 * 60 * 60); // Set expiration to 18 hours
}

// Update the uploadTokens.js file with new tokens
function updateUploadTokensFile(accessToken, refreshToken) {
    const content = `
import { uploadTokens } from './dataBase.js';

// Example tokens
const accessToken = '${accessToken}';
const refreshToken = '${refreshToken}';

// Manually upload tokens
const locationId = 'exampleLocationId'; // Replace with actual location ID
uploadTokens(accessToken, refreshToken, locationId);
`;

    fs.writeFileSync(path.join(__dirname, 'uploadTokens.js'), content);
}

// Check token expiration and refresh if needed
async function checkAndRefreshToken(locationId) {
    const tokens = await loadTokens(locationId);
    const tokenTimestamp = tokens.timestamp || 0;
    const TOKEN_REFRESH_INTERVAL = 18 * 60 * 60 * 1000; // 18 hours

    if (Date.now() - tokenTimestamp >= TOKEN_REFRESH_INTERVAL) {
        const GHL_REFRESH_TOKEN = tokens.GHL_REFRESH_TOKEN;
        const CLIENT_ID = '67d499bd3e4a8c3076d5e329-m899qb4l';
        const GHL_CLIENT_SECRET = 'c8eefd7b-f824-4a84-b10b-963ae75c0e7c';

        try {
            const response = await axios.post(
                'https://services.leadconnectorhq.com/oauth/token',
                {
                    client_id: CLIENT_ID,
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

            const GHL_ACCESS_TOKEN = response.data.access_token;
            const newGHL_REFRESH_TOKEN = response.data.refresh_token;
            const newTimestamp = Date.now();

            // Save the new tokens to Redis
            await setGHLTokens(GHL_ACCESS_TOKEN, newGHL_REFRESH_TOKEN, locationId);

            // Update the uploadTokens.js file with new tokens
            updateUploadTokensFile(GHL_ACCESS_TOKEN, newGHL_REFRESH_TOKEN);

            console.log('✅ GHL API token refreshed successfully');
            return { GHL_ACCESS_TOKEN, tokenTimestamp: newTimestamp };
        } catch (error) {
            console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    return { GHL_ACCESS_TOKEN: tokens.GHL_ACCESS_TOKEN, tokenTimestamp };
}

// Function to manually upload tokens into the database
function uploadTokens(accessToken, refreshToken, locationId) {
    setGHLTokens(accessToken, refreshToken, locationId);
    console.log('✅ Tokens uploaded successfully');
}

export { client, storeGUID, loadGUIDs, loadTokens, setGHLTokens, checkAndRefreshToken, uploadTokens };