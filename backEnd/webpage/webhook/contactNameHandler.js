const axios = require('axios');
const express = require('express');
const router = express.Router();
const { client } = require('../../dataBase');
const { createLowercaseBusinessName, validateContactData } = require('../createBusinessname');
require('dotenv').config();

const businessNameUpdateUrl = process.env.BUSINESS_NAME_UPDATE_URL;

/**
 * Webhook endpoint to process contact names
 * Combines first and last name, converts to lowercase, and updates businessName
 */
router.post('/update-business-name', async (req, res) => {
  try {
    const contactData = { 
      firstName: req.body.firstName, 
      lastName: req.body.lastName, 
      contactId: req.body.contactId,
      phone: req.body.phone  // Add phone field
    };
    
    // Send immediate 200 OK response to acknowledge data receipt
    res.status(200).json({
      success: true,
      message: 'Request received, processing business name update',
      receivedData: contactData
    });
    
    // Log the incoming request
    console.log(`\n========== BUSINESS NAME UPDATE REQUEST ==========`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Contact ID: ${contactData.contactId}`);
    console.log(`First Name: ${contactData.firstName}`);
    console.log(`Last Name: ${contactData.lastName}`);
    console.log(`Phone: ${contactData.phone}`);
    console.log(`=================================================\n`);
    
    // Validate contact data using the utility function
    const validation = validateContactData(contactData);
    if (!validation.success) {
      console.error(`Validation failed: ${validation.message}`);
      return; // Early return, response already sent
    }
    
    // Use the utility function to create the lowercase business name
    const combinedName = createLowercaseBusinessName(contactData.firstName, contactData.lastName);
    console.log(`Combined lowercase name: ${combinedName}`);
    
    // Check if the BUSINESS_NAME_UPDATE_URL is set
    if (!businessNameUpdateUrl) {
      console.error('BUSINESS_NAME_UPDATE_URL is not configured in the environment variables');
      return; // Early return, response already sent
    }
    
    // Prepare the GHL-ready payload with firstName, lastName, phone, and businessName
    const webhookPayload = {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      phone: contactData.phone,
      businessName: combinedName
    };
    
    console.log(`\n========== SENDING TO GHL WORKFLOW ==========`);
    console.log(`URL: ${businessNameUpdateUrl}`);
    console.log(`Payload: ${JSON.stringify(webhookPayload, null, 2)}`);
    console.log(`=========================================\n`);
    
    // Send the data to the GHL Workflow webhook URL
    const webhookResponse = await axios.post(
      businessNameUpdateUrl,
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`\n========== GHL WORKFLOW RESPONSE ==========`);
    console.log(`Status: ${webhookResponse.status}`);
    console.log(`Response: ${JSON.stringify(webhookResponse.data, null, 2)}`);
    console.log(`=========================================\n`);
    
    // Note: Remove the final res.status(200).json(...) since we've already sent the response
    
  } catch (error) {
    console.error(`\n======== ERROR UPDATING BUSINESS NAME ========`);
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.error(`===========================================\n`);
    
    // Don't try to send another response if an error occurs after we've already sent one
    // Just log the error
  }
});

module.exports = router;
