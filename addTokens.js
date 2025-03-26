const redis = require('redis');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
require('dotenv').config();
const { setGHLTokens } = require('./dataBase');

const redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();

  const question = (query) => new Promise((resolve) => {
    readline.question(query, resolve);
  });

  try {
    const locationId = await question("Enter Location ID: ");
    const accessToken = await question("Enter Access Token: ");
    const refreshToken = await question("Enter Refresh Token: ");

    // Call the setGHLTokens function to store the tokens in Redis
    await setGHLTokens(locationId, accessToken, refreshToken);

    console.log('Tokens added successfully!');
  } catch (error) {
    console.error('Error adding tokens:', error);
  } finally {
    readline.close();
    await redisClient.quit();
  }
})();
