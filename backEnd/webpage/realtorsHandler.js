const axios = require('axios');
const express = require('express');
const router = express.Router();
const cors = require('cors');
require('dotenv').config();
const { client } = require('../dataBase');

const locationId = process.env.LOCATION_ID;

// Enable CORS for all routes
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

router.get('/realtors', async (req, res) => {
  const { businessName } = req.query;
  try {
    // First, retrieve the access token from Redis
    const redisKey = `tokens:${locationId}`;
    const accessToken = await client.hGet(redisKey, 'accessToken');

    if (!accessToken) {
      console.error('Access token not found in Redis!');
      return res.status(401).send("Access token not found");
    }

    // After getting the access token, make the call to search for realtors
    const realtorsResponse = await axios.get(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${businessName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2021-07-28',
        }
      }
    );
    
    const realtors = realtorsResponse.data.contacts;

    if (realtors && realtors.length > 0) {
      // Extract the contactId from the first realtor
      const contactId = realtors[0].id;

      // Use the contactId to get more detailed information
      const contactDetailsResponse = await axios.get(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Version: '2021-07-28',
          }
        }
      );

      const contactDetails = contactDetailsResponse.data.contact;
      
      // Extract only the required fields - using only the source field for the image
      const extractedDetails = {
        firstName: contactDetails.firstName || '',
        lastName: contactDetails.lastName || '',
        email: contactDetails.email || '',
        phone: contactDetails.phone || '',
        source: contactDetails.source || ''
      };
      
      // Log the final extracted details to confirm what we're sending
      console.log('Extracted details being sent:', extractedDetails);
      res.json(extractedDetails);
    } else {
      res.json({ 
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: ''
      });
    }
  } catch (error) {
    console.error("Error fetching realtors:", error.response ? error.response.data : error.message);
    res.status(500).send("Error fetching realtors");
  }
});

module.exports = router;
