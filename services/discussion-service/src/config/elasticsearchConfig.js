const { Client } = require("@elastic/elasticsearch");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  node: process.env.ES_ENDPOINT,
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

module.exports = client;
