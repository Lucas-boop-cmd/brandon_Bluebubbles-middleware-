require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('redis');
const cron = require('node-cron'); // Add this line to import node-cron

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

// Save GUIDs to Redis
async function saveGUIDs(guids) {
    await client.del('guids');
    for (const guid of guids) {
        await client.rPush('guids', JSON.stringify(guid));
    }
}

// Store a new GUID with timestamp and handle address
async function storeGUID(guid, handleAddress) {
    // Store the GUID and handleAddress in a single hash
    const guidKey = `guid:${guid}`;
    await client.hSet(guidKey, 'handleAddress', handleAddress);

    // Set the key to expire after 48 hours (48 * 60 * 60 seconds)
    await client.expire(guidKey, 48 * 60 * 60);

    // Add the GUID to the handle index for searching
    await client.sAdd(`handle:${handleAddress}`, guid);
}

// Function to set GHL tokens in Redis
async function setGHLTokens(locationId, accessToken, refreshToken) {
    const redisKey = `tokens:${locationId}`;
    await client.hSet(redisKey, 'accessToken', accessToken);
    await client.hSet(redisKey, 'refreshToken', refreshToken);

    // Calculate expiry time (25 hours in seconds)
    const expiryTime = 25 * 60 * 60;

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
    if (typeof handleAddress !== 'string') {
        throw new TypeError('Invalid argument type');
    }

    // Get all GUIDs associated with the handle address
    const guidKeys = await client.sMembers(`handle:${handleAddress}`);

    // If no GUIDs are found, return an empty array
    if (!guidKeys || guidKeys.length === 0) {
        return [];
    }

    // Fetch the details for each GUID
    const guids = [];
    for (const guid of guidKeys) {
        const guidKey = `guid:${guid}`;
        const handleAddress = await client.hGet(guidKey, 'handleAddress');
        if (handleAddress) {
            guids.push({ guid: guid, handleAddress: handleAddress });
        }
    }

    return guids;
}

module.exports = { client, storeGUID, loadGUIDs, searchGUIDsByHandleAddress, setGHLTokens, loadGHLTokens };