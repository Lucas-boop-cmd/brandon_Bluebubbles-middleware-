const axios = require('axios');
const express = require('express');
const router = express.Router();
const { client } = require('../../dataBase');
const { createLowercaseBusinessName, validateContactData } = require('../createBusinessname');
require('dotenv').config();

const locationId = process.env.LOCATION_ID;

/**
 * Webhook endpoint to process contact names
 * Combines first and last name, converts to lowercase, and updates businessName
 */
router.post('/update-business-name', async (req, res) => {
  try {
    const contactData = { 
      firstName: req.body.firstName, 
      lastName: req.body.lastName, 
      contactId: req.body.contactId 
    };
    
    // Log the incoming request
    console.log(`\n========== BUSINESS NAME UPDATE REQUEST ==========`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Contact ID: ${contactData.contactId}`);
    console.log(`First Name: ${contactData.firstName}`);
    console.log(`Last Name: ${contactData.lastName}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log(`=================================================\n`);
    
    // Validate contact data using the utility function
    const validation = validateContactData(contactData);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Use the utility function to create the lowercase business name
    const combinedName = createLowercaseBusinessName(contactData.firstName, contactData.lastName);
    console.log(`Combined lowercase name: ${combinedName}`);
    
    // Get the access token from Redis
    const redisKey = `tokens:${locationId}`;
    const accessToken = await client.hGet(redisKey, 'accessToken');
    
    if (!accessToken) {
      console.error('Access token not found in Redis!');
      return res.status(401).json({
        success: false,
        message: 'Access token not found'
      });
    }
    
    // Update the businessName in Go High Level
    const updateResponse = await axios.put(
      `https://services.leadconnectorhq.com/contacts/${contactData.contactId}`,
      {
        businessName: combinedName
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n========== BUSINESS NAME UPDATE RESPONSE ==========`);
    console.log(`Status: ${updateResponse.status}`);
    console.log(`Response: ${JSON.stringify(updateResponse.data, null, 2)}`);
    console.log(`====================================================\n`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Business name updated successfully',
      data: {
        contactId: contactData.contactId,
        businessName: combinedName
      }
    });
    
  } catch (error) {
    console.error(`\n======== ERROR UPDATING BUSINESS NAME ========`);
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.error(`===========================================\n`);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update business name',
      error: error.message
    });
  }
});

module.exports = router;
