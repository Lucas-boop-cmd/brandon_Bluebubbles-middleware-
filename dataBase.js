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
                refresh_token: GHL_REFRESH_TOKEN // Ensure refresh token is included
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

// Function to manually set GHL tokens
function setGHLTokens( accessToken = eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjIyMDk0Mi45NjIsImV4cCI6MTc0MjMwNzM0Mi45NjJ9.rw5UDFVbPeswaDt0_vmFD55gYFN8lehGMAP3SJqjtlfDKl4RF8K2xF8WogB1QbIT8fEQeLv46OU4kmfGgZPHA1lnAKrxRX_AYK4UjatFMmXKaKtmFTjp083IvSswCwQgVZuruEMgSlUAoAFX28oI7Lwx-OZc7Uk81dvdGtkKII5WuvQv00gRK2fgm5IDPX3c2lw118OqNBdOYTCLJahgOF2lLw17-GKrEpZu7jHbXR3qM-V78mtZZLofaF1Mp7PT62l-QtwR6G6PvK1VrREL_0wAOzpvHo9qi1vFbJo_Z4kz_YiqRCMado3rX2uGnWyiJ0He0zQ_SwSxeB9OUuIlpBc-Zvs27twHMhKHAEh1z0I2ev5XW-GN1h-uosylfe4MwTMmLXFvV2Cb1PQA9pt1nTq-sa7xCz_zfJPJwAtl9AKijOgWMxgfOWILS9lspRoldo9lBBziNaMBipy-h4kfG4H7p-YGBcBJgc5TUJeXXPxpx7cdGau3FPxw7LuYmhjZ78NOdjJz_B8-rjLBIxKUmVIPkmnMnt10_pBU5p9LnKrzRBiYXEyvj7v_CeNQWHdh_dx36vL0RfdWk2DjB8gdzmVCVuizA-vw4NO6l1tCgCe8aiNp7Rp6DTxY9Mcz1-BeibIjo_hppg2Q6pcR7iZx2NIgtlDuPkKpNBhr2AUrzKA, refreshToken = eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjIyMDk0Mi45NzIsImV4cCI6MTc3Mzc1Njk0Mi45NzIsInVuaXF1ZUlkIjoiYzViMGY4NzItMzUwNi00ZDA0LTllYTItMjNkZjhkZDg1YTJlIn0.Ogz-eS3hKgnE8mzzsPL2DXorJD6LrZdEPTy8XN8ujfB4PCLtkRda6z9VNrCm-J5XuOMKK3umZSj-YLchnNOjS6hUO8psLoteJlBKgjh_QG-Z7sSuBBG5uQWQ296nO_o9gdCh8mXveOV0RIWQJ5ljhRojtNyKjHPRvIjVKvcLtaqiz2HeOHIf2-MJNWL9zkVT2GcQpejafpcLQ67foo64kRJDsSZmqrSk_oxVPUqrDJiu80mRH2EDK1PpWrQqZKP3l_YPQpMlQXNeNJF8KnvDcw4cWI35a_7urecgV0qDB5jE3MGR0NHEnNL0EupB0Dv57IlBVOFnn5Knh3zVCMtOjODrtX_XykWx6T6vDZNFqfVdlfIWbvvQxmYyPyvcxegK0ZIq8h22FwE2CFsC1qVKSgWZ2z6iNqfnkPhm99czUUOf6BxhA93GLzctgYYK7WhtJqgiYa9X78TsF_INPA_ESl6RgOJrcj18_r7TeL14WRUDmnEyus4__fR18iz3nH_Yjq33jaL-VPapubqv7EVyUOxXKV51MyI8Cw5zgTuLbf2-G_7Err2nE4esb04aXy9L_FQA9yaurmyZ-Mrca68xHU15xrCfutA4cL9gvudn-gaX67hMX0BdAlyz3XzTbBC4NCbbVmanpmsOykTT2G9LofhBRBHamoDN76Lo5CYlyAY) {
    const timestamp = Date.now();
    const tokens = {
        GHL_ACCESS_TOKEN: { token: accessToken, timestamp },
        GHL_REFRESH_TOKEN: { token: refreshToken, timestamp }
    };
    saveTokens(tokens);
}

// Function to check token expiration and refresh if needed
async function checkAndRefreshToken() {
    const tokens = loadTokens();
    const tokenTimestamp = tokens.GHL_ACCESS_TOKEN?.timestamp || 0;
    const TOKEN_REFRESH_INTERVAL = 20 * 60 * 60 * 1000; // 20 hours

    if (Date.now() - tokenTimestamp >= TOKEN_REFRESH_INTERVAL) {
        const { GHL_ACCESS_TOKEN, tokenTimestamp } = await refreshGHLToken();
        return { GHL_ACCESS_TOKEN, tokenTimestamp };
    }

    return { GHL_ACCESS_TOKEN: tokens.GHL_ACCESS_TOKEN?.token, tokenTimestamp };
}

// Function to handle API call with token refresh on 401 error
async function handleApiCallWithTokenRefresh(apiCall) {
    try {
        return await apiCall();
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('🔄 Refreshing GHL API token due to 401 error...');
            const { GHL_ACCESS_TOKEN, tokenTimestamp } = await refreshGHLToken();
            return await apiCall();
        } else {
            throw error;
        }
    }
}

module.exports = { storeGUID, loadGUIDs, updateGHLTokens, loadTokens, refreshGHLToken, setGHLTokens, checkAndRefreshToken, handleApiCallWithTokenRefresh };
