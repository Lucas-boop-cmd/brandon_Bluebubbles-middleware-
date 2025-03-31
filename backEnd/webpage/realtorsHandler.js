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
      
      // Detailed logging to identify where images might be stored
      console.log('Contact Details received:', JSON.stringify(contactDetails, null, 2));
      console.log('Contact custom fields:', contactDetails.customFields);
      console.log('Contact attribution:', contactDetails.attributionObj);
      
      // Extract only the required fields
      const extractedDetails = {
        firstName: contactDetails.firstName || '',
        lastName: contactDetails.lastName || '',
        email: contactDetails.email || '',
        phone: contactDetails.phone || '',
        source: '' // Only keep the source field for headshot URL
      };
      
      // Look for images in various locations...
      
      // 1. Check for avatar URL (common in many APIs)
      if (contactDetails.avatar || contactDetails.avatarUrl) {
        extractedDetails.source = contactDetails.avatar || contactDetails.avatarUrl;
        console.log('Found avatar URL:', extractedDetails.source);
      }
      
      // 2. Look for profilePicture field
      if (!extractedDetails.source && (contactDetails.profilePicture || contactDetails.profileImage)) {
        extractedDetails.source = contactDetails.profilePicture || contactDetails.profileImage;
        console.log('Found profile picture field:', extractedDetails.source);
      }
      
      // 3. Look for the realtor_headshot custom field and set it as source
      if (!extractedDetails.source && contactDetails.customFields && Array.isArray(contactDetails.customFields)) {
        const headshotField = contactDetails.customFields.find(field => 
          field.id === 'realtor_headshot' || 
          field.name === 'realtor_headshot' || 
          field.key === 'realtor_headshot'
        );
        
        if (headshotField && headshotField.value) {
          extractedDetails.source = headshotField.value;
          console.log('Found in custom field realtor_headshot:', extractedDetails.source);
        }
      }
      
      // 4. Check for source field directly in the contact details
      if (!extractedDetails.source && contactDetails.source) {
        extractedDetails.source = contactDetails.source;
        console.log('Found in source field:', extractedDetails.source);
      }
      
      // 5. Check in attributes for profile picture or image URL
      if (!extractedDetails.source && contactDetails.attributionObj) {
        if (contactDetails.attributionObj.profilePictureUrl) {
          extractedDetails.source = contactDetails.attributionObj.profilePictureUrl;
          console.log('Found in attributionObj.profilePictureUrl:', extractedDetails.source);
        } else if (contactDetails.attributionObj.imageUrl) {
          extractedDetails.source = contactDetails.attributionObj.imageUrl;
          console.log('Found in attributionObj.imageUrl:', extractedDetails.source);
        }
      }
      
      // 6. Look for image in custom fields if we still don't have an image
      if (!extractedDetails.source && contactDetails.customFields) {
        // Log all custom field names to help identify the right one
        console.log('All custom field keys:', contactDetails.customFields.map(f => f.name || f.key || f.id).join(', '));
        
        const imageField = contactDetails.customFields.find(field => {
          const nameMatch = field.name && typeof field.name === 'string' && 
            (field.name.toLowerCase().includes('image') || field.name.toLowerCase().includes('photo') || 
             field.name.toLowerCase().includes('picture') || field.name.toLowerCase().includes('avatar'));
             
          const keyMatch = field.key && typeof field.key === 'string' && 
            (field.key.toLowerCase().includes('image') || field.key.toLowerCase().includes('photo') || 
             field.key.toLowerCase().includes('picture') || field.key.toLowerCase().includes('avatar'));
             
          return nameMatch || keyMatch;
        });
        
        if (imageField && imageField.value) {
          extractedDetails.source = imageField.value;
          console.log('Found in custom field by naming pattern:', extractedDetails.source);
        }
      }
      
      // 7. Last resort: Check if the contact itself is an image URL (unusual but possible)
      if (!extractedDetails.source && typeof contactDetails === 'string' && isValidImageUrl(contactDetails)) {
        extractedDetails.source = contactDetails;
        console.log('Contact itself appears to be an image URL:', extractedDetails.source);
      }
      
      // Log whether we found an image source
      if (extractedDetails.source) {
        console.log('Final image source found:', extractedDetails.source);
      } else {
        console.log('No image source found in any field');
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

// Helper function to check if a string might be an image URL
function isValidImageUrl(str) {
  try {
    const url = new URL(str);
    const path = url.pathname.toLowerCase();
    return path.endsWith('.jpg') || path.endsWith('.jpeg') || 
           path.endsWith('.png') || path.endsWith('.gif') || 
           path.endsWith('.webp') || path.endsWith('.svg');
  } catch (e) {
    return false;
  }
}

// Ensure we're exporting the router correctly
module.exports = router;
