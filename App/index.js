// Local variables for environment variables
const BLUEBUBBLES_API_URL = 'http://myimessage.hopto.org:1234';
const BLUEBUBBLES_PASSWORD = 'Dasfad1234$';
let GHL_ACCESS_TOKEN = 'your_ineyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsiY29udmVyc2F0aW9ucy5yZWFkb25seSIsImNvbnZlcnNhdGlvbnMud3JpdGUiLCJjb252ZXJzYXRpb25zL21lc3NhZ2UucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zL21lc3NhZ2Uud3JpdGUiLCJjb250YWN0cy5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwib2F1dGgucmVhZG9ubHkiLCJ1c2Vycy5yZWFkb25seSJdLCJjbGllbnQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUiLCJjbGllbnRLZXkiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X21vbnRobHlfMjk3In0sImlhdCI6MTc0MTk3ODA0Ni4xNjMsImV4cCI6MTc0MjA2NDQ0Ni4xNjN9.AC4Edy_fyOsQQS7MIScGN0xzHkGLlHY84XgiLPTKvQi7SEetbIItDw3SdBuZr81LDkhz-lMce4KqcsLD9i7YcWn-f3o47fmaDlfsc0MUWVX_lR0aIj30yaRuOLconm0_14_9AdNNqtP3pnur3Giq-70u55ao4Qgmq1G0YRfY0NQKDOdf41fC2sG8YyTkvFU0xprF5m7a9sLY1a49ve8Q-2JKi3XcTZO4KpqdjUBsRXED5K0c316G0QD45yMC3_n84I453F1yLMkPUZ7yZQf1wO4lHTHghnbRFpEnZ2ZD0CXOxH6yWfMeyBL8ItXCqk3rvWMWyzlgzdrkBAHn4W8Y1yYLJZ8bGy6lhM7I3HNE0pU7_QNdNokzftjjsXLxmwzLUiD37ryM4PJjbnivXblHH5Z18ZxvP61jZLhFBg9RuLn8FEzM0c5WN7ghaaYO7ttXuZjfRRArpMcK1GfibYKSniZoiGhHm9hwBXdqMa78hdOIYZLSAL0uN71nYNTKytghZxwre7zV3Eb5Uo4nPHTts8I31tNtT1n8iSvxuVnn-WxJsg1yeR2DSd9_AabvNWZGxGNysCooP9xy5vhSa1Sc1ovY1Cu5S9BOJUX1fkp39AZBOI5GHjfjmbJT-jZGRfaxiD4N3G2knnTrJuprQXavGRAI2rgwtwiqeHvcebZoUD8itial_ghl_api_token';
let GHL_REFRESH_TOKEN = 'yeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJvVWN3RE5nUzMxTkxVZG1aU2pSYSIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsiY29udmVyc2F0aW9ucy5yZWFkb25seSIsImNvbnZlcnNhdGlvbnMud3JpdGUiLCJjb252ZXJzYXRpb25zL21lc3NhZ2UucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zL21lc3NhZ2Uud3JpdGUiLCJjb250YWN0cy5yZWFkb25seSIsIm9hdXRoLndyaXRlIiwib2F1dGgucmVhZG9ubHkiLCJ1c2Vycy5yZWFkb25seSJdLCJjbGllbnQiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUiLCJjbGllbnRLZXkiOiI2N2NlZTM2ZTZjMjMxMTgxY2QzMWMxZGUtbTgzOW4wN2oifSwiaWF0IjoxNzQxOTc4MDQ2LjE2OSwiZXhwIjoxNzczNTE0MDQ2LjE2OSwidW5pcXVlSWQiOiJjMjQzYTE2My01NjIzLTRkNzktODk3MS0wMGNiOTQ4NjQyMjQifQ.DGeW8yQ3xb6i_rD6TG3bdh5Ps3GZqQLFg7T8ldJl__QSEGii-ttaAzHuTmHgD81rmsH3ECJhzphuRdklLZzENWJtKiz_ocVFIgwc71Gmh8wZ4_0DL2XJUewTYHSD1ZWwAuBIKa5VVsN3r_fhZRCwv1CbF-Dh8HBopICALv_RNFjlnecUnLHnFwuNzhZvkftZVZMEGwcIEVeYF81wWVwQQk9U-ygYzZtp9w5RlfodAjEfWX_jWikSUDwN23UrzQlB9kOTAb57uCFYHHMEWYbAlMNuE9ZU5kF6D0515fWFacf9Xi9lpL0huMUJ2QHOT_o26a6ugafRdMv9g9h0T42JWZMRXEFx9RDd60_U8JVeEJRNxqA-8l2O-JAMyfYWRguLyegdOpBwTDcFX0dvCkafSVZCjHDcskBOqBXjFoqhW90MOMTcwMhrMXiKCetFOWFy3RC8V1MxvXijtPSaPFEq1UEv-oyQTzTQtyrQuxPDjriMEHZGICGDGPiKBA6Ng4BBdmOdr8EtNthadSH-sOLZ4EpLuob5kY78peP-YShX2FokxUxtnY984EkshrzRnpVFJgfUGn0hNbyjJUsh7TrXME4EUT5qjqbY85f-mWkUxLC22ChNt3SZ1fJznBOw_68Bi_S3WVToXKeOoYsZdi9tyi2kRxwe5oxi9OkKidQ7z08our_ghl_refresh_token';
const CLIENT_ID = '67cee36e6c231181cd31c1de-m839n07j';
const GHL_CLIENT_SECRET = '6eaa7eb4-5408-49b2-a02d-afd1d6adcf9e';
let tokenExpiration = Date.now() + 22 * 60 * 60 * 1000; // 22 hours from now

// Function to refresh GHL API token
async function refreshGHLToken() {
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

        GHL_ACCESS_TOKEN = response.data.access_token;
        GHL_REFRESH_TOKEN = response.data.refresh_token;
        tokenExpiration = Date.now() + 22 * 60 * 60 * 1000; // Reset expiration to 22 hours from now

        console.log('✅ GHL API token refreshed successfully');
    } catch (error) {
        console.error('❌ Error refreshing GHL API token:', error.response ? error.response.data : error.message);
    }
}

// Middleware to check token expiration before API calls
async function checkTokenExpiration(req, res, next) {
    if (Date.now() >= tokenExpiration) {
        await refreshGHLToken();
    }
    next();
}