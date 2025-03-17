const fs = require('fs');
const path = require('path');

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

// Automatically clean old GUIDs every hour
setInterval(cleanOldGUIDs, 60 * 60 * 1000);

module.exports = { storeGUID, loadGUIDs };
