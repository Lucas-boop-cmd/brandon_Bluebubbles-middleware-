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
    const guids = await client.hGet('handle_index', handleAddress);
    return guids ? [JSON.parse(guids)] : [];
}

module.exports = { client, storeGUID, loadGUIDs, searchGUIDsByHandleAddress, setGHLTokens, loadGHLTokens };