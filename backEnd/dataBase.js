require('dotenv').config();
const path = require('path');
const { createClient } = require('redis');

// Configure Redis client with Redis Cloud endpoint and authentication
const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
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

// Store a new GUID with timestamp and handle address
async function storeGUID(guid, handleAddress) {
    try {
        // Use a hash to store GUID and address
        await client.hSet(`guid:${handleAddress}`, guid, guid);
        // Set expiration to 48 hours (48 * 60 * 60 seconds)
        await client.expire(`guid:${handleAddress}`, 48 * 60 * 60);
        console.log(`GUID ${guid} stored for address ${handleAddress} with 48-hour expiration`);
    } catch (error) {
        console.error("Error storing GUID in Redis:", error);
    }
}

// Function to set GHL tokens in Redis
async function setGHLTokens(locationId, accessToken, refreshToken) {
    const redisKey = `tokens:${locationId}`;
    await client.hSet(redisKey, 'accessToken', accessToken);
    await client.hSet(redisKey, 'refreshToken', refreshToken);

    // Calculate expiry time (25 hours in seconds)
    const expiryTime = 30 * 60 * 60;

    // Set the expiry for the key
    await client.expire(redisKey, expiryTime);
}

// Function to load GHL tokens from Redis
async function loadGHLTokens(locationId) {
    const redisKey = `tokens:${locationId}`;
    const tokens = await client.hGetAll(redisKey);
    return tokens;
}

// Search GUIDs by handle address
async function searchGUIDsByHandleAddress(handleAddress) {
    try {
        // Retrieve all GUIDs associated with the address from the hash
        const guids = await client.hGetAll(`guid:${handleAddress}`);
        return Object.entries(guids).map(([key, value]) => ({ guid: value })); // Return as array of objects
    } catch (error) {
        console.error("Error searching GUIDs in Redis:", error);
        return [];
    }
}

module.exports = { client, storeGUID, loadGUIDs, searchGUIDsByHandleAddress, setGHLTokens, loadGHLTokens };