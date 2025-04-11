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
  
  // Log the incoming request
  console.log(`\n========== REALTOR REQUEST ==========`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Business Name: ${businessName}`);
  console.log(`Request IP: ${req.ip}`);
  console.log(`User Agent: ${req.get('user-agent')}`);
  console.log(`======================================\n`);
  
  try {
    // First, retrieve the access token from Redis
    const redisKey = `tokens:${locationId}`;
    const accessToken = await client.hGet(redisKey, 'accessToken');

    if (!accessToken) {
      console.error('Access token not found in Redis!');
      return res.status(401).send("Access token not found");
    }

    // After getting the access token, make the call to search for realtors
    console.log(`Making API request to search for realtor: ${businessName}`);
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
    console.log(`Found ${realtors ? realtors.length : 0} contacts matching the search query`);

    if (realtors && realtors.length > 0) {
      // Extract the contactId from the first realtor
      const contactId = realtors[0].id;
      console.log(`Getting detailed info for contact ID: ${contactId}`);

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
      
      // Log the raw contact details for debugging
      console.log(`\n======== RAW CONTACT DETAILS ========`);
      console.log(JSON.stringify(contactDetails, null, 2));
      console.log(`=====================================\n`);
      
      // Extract only the required fields - using only the source field for the image
      const extractedDetails = {
        firstName: contactDetails.firstName || '',
        lastName: contactDetails.lastName || '',
        email: contactDetails.email || '',
        phone: contactDetails.phone || '',
        source: contactDetails.source || '',
        id: contactDetails.id || '',
        instagram: '',
        facebook: '',
        linkedin: ''
      };
      
      // Extract custom fields if they exist
      if (contactDetails.customFields && Array.isArray(contactDetails.customFields)) {
        // Find instagram field
        const instagramField = contactDetails.customFields.find(field => field.id === 'v6yO7jM96Pd5mCai7x70');
        if (instagramField && instagramField.value) {
          extractedDetails.instagram = instagramField.value;
        }
        
        // Find facebook field
        const facebookField = contactDetails.customFields.find(field => field.id === 'zhEVZR493qJgoSC4fjLv');
        if (facebookField && facebookField.value) {
          extractedDetails.facebook = facebookField.value;
        }
        
        // Find linkedin field
        const linkedinField = contactDetails.customFields.find(field => field.id === 'zNhP0A55zZlJ7TbJ2In5');
        if (linkedinField && linkedinField.value) {
          extractedDetails.linkedin = linkedinField.value;
        }
      }
      
      // Log the extracted details
      console.log(`\n======== EXTRACTED DETAILS ========`);
      console.log(`Name: ${extractedDetails.firstName} ${extractedDetails.lastName}`);
      console.log(`Email: ${extractedDetails.email}`);
      console.log(`Phone: ${extractedDetails.phone}`);
      console.log(`Image URL: ${extractedDetails.source}`);
      console.log(`ID: ${extractedDetails.id}`);
      console.log(`Instagram: ${extractedDetails.instagram}`);
      console.log(`Facebook: ${extractedDetails.facebook}`);
      console.log(`LinkedIn: ${extractedDetails.linkedin}`);
      console.log(`===================================\n`);
      
      res.json(extractedDetails);
    } else {
      console.log(`No realtors found for query: ${businessName}`);
      res.json({ 
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: '',
        id: '',
        instagram: '',
        facebook: '',
        linkedin: ''
      });
    }
  } catch (error) {
    console.error(`\n======== ERROR FETCHING REALTOR ========`);
    console.error(`Business Name: ${businessName}`);
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.error(`=======================================\n`);
    res.status(500).send("Error fetching realtors");
  }
});

module.exports = router;
