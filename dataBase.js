const fs = require('fs');
const path = require('path');
const axios = require('axios');

const filePath = path.join(__dirname, 'database.json');

// Load existing GUIDs or return an empty array if file doesn’t exist
function loadGUIDs() {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Save GUIDs back to the file
function saveGUIDs(guids) {
    fs.writeFileSync(filePath, JSON.stringify(guids, null, 2));
}

// Store a new GUID with timestamp
function storeGUID(guid) {
    const guids = loadGUIDs();
    const timestamp = Date.now(); 

    guids.push({ guid, timestamp });
    saveGUIDs(guids);
}

// Remove GUIDs older than 48 hours
function cleanOldGUIDs() {
    const guids = loadGUIDs();
    const expiryTime = Date.now() - (48 * 60 * 60 * 1000);

    const filteredGUIDs = guids.filter(entry => entry.timestamp > expiryTime);
    saveGUIDs(filteredGUIDs);
}

// Automatically clean old GUIDs every 48 hours
setInterval(cleanOldGUIDs, 48 * 60 * 60 * 1000);

// Load tokens from the database
function loadTokens() {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8')).tokens || {};
}

// Save tokens to the database
function saveTokens(tokens) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.tokens = tokens;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Update GHL tokens with timestamp
function updateGHLTokens(accessToken, refreshToken) {
    const tokens = loadTokens();
    const timestamp = Date.now();
    tokens.GHL_ACCESS_TOKEN = { token: accessToken, timestamp };
    tokens.GHL_REFRESH_TOKEN = { token: refreshToken, timestamp };
    saveTokens(tokens);
}

// Function to refresh GHL API token
async function refreshGHLToken() {
    const tokens = loadTokens();
    const GHL_REFRESH_TOKEN = tokens.GHL_REFRESH_TOKEN?.token;
    const CLIENT_ID = '67d499bd3e4a8c3076d5e329-m899qb4l';
    const GHL_CLIENT_SECRET = 'c8eefd7b-f824-4a84-b10b-963ae75c0e7c';

    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/oauth/token',
            {
                client_id: CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: GHL_REFRESH_TOKEN
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const GHL_ACCESS_TOKEN = response.data.access_token;
        const newGHL_REFRESH_TOKEN = response.data.refresh_token;
        const tokenTimestamp = Date.now(); // Update timestamp

        // Update tokens in the database
        updateGHLTokens(GHL_ACCESS_TOKEN, newGHL_REFRESH_TOKEN);

        console.log('✅ GHL API token refreshed successfully');
        return { GHL_ACCESS_TOKEN, tokenTimestamp };
    } catch (error) {
        console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { storeGUID, loadGUIDs, updateGHLTokens, loadTokens, refreshGHLToken };
