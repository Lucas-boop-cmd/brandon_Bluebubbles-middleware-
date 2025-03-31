const axios = require('axios');
const express = require('express');
const router = express.Router();
const cors = require('cors');

const locationId = process.env.LOCATION_ID;

const getRealtors = async (businessName) => {
  try {
    const response = await axios.get('https://services.leadconnectorhq.com/contacts', {
      params: {
        locationId: locationId,
        businessName: businessName
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching realtors:", error);
    throw error;
  }
};

router.get('/realtors', async (req, res) => {
  const { businessName } = req.query;
  try {
    const realtors = await getRealtors(businessName);
    res.json(realtors);
  } catch (error) {
    res.status(500).send("Error fetching realtors");
  }
});

module.exports = router;
