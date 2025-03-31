const axios = require('axios');
const express = require('express');
const router = express.Router();
const cors = require('cors');
require('dotenv').config();
const { client } = require('../dataBase');

const locationId = process.env.LOCATION_ID;

// Enable CORS for all routes
router.use(cors({
  origin: '*', // Allow all origins - update this to your frontend domain in production
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
      console.log('Contact Details received:', JSON.stringify(contactDetails, null, 2));
      
      // Extract only the required fields
      const extractedDetails = {
        firstName: contactDetails.firstName || '',
        lastName: contactDetails.lastName || '',
        email: contactDetails.email || '',
        phone: contactDetails.phone || '',
        source: '' // Only keep the source field for headshot URL
      };
      
      // Look for the realtor_headshot custom field and set it as source
      if (contactDetails.customFields && Array.isArray(contactDetails.customFields)) {
        const headshotField = contactDetails.customFields.find(field => 
          field.id === 'realtor_headshot' || 
          field.name === 'realtor_headshot' || 
          field.key === 'realtor_headshot'
        );
        
        if (headshotField && headshotField.value) {
          extractedDetails.source = headshotField.value;
        }
      }
      
      // Check for source field directly in the contact details
      if (!extractedDetails.source && contactDetails.source) {
        extractedDetails.source = contactDetails.source;
      }
      
      // Check in attributes for profile picture or image URL
      if (!extractedDetails.source && contactDetails.attributionObj && contactDetails.attributionObj.profilePictureUrl) {
        extractedDetails.source = contactDetails.attributionObj.profilePictureUrl;
      }
      
      // Look for image in custom fields if we still don't have an image
      if (!extractedDetails.source && contactDetails.customFields) {
        const imageField = contactDetails.customFields.find(field => 
          field.name && field.name.toLowerCase().includes('image') || 
          field.name && field.name.toLowerCase().includes('photo') ||
          field.key && field.key.toLowerCase().includes('image') ||
          field.key && field.key.toLowerCase().includes('photo')
        );
        
        if (imageField && imageField.value) {
          extractedDetails.source = imageField.value;
        }
      }
      
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

// Ensure we're exporting the router correctly
module.exports = router;
