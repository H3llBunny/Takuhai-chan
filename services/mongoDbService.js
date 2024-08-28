const { MongoClient } = require('mongodb');
require('dotenv').config();
const { MONGODB_URI } = process.env;

let db;

const connectToDatabase = async () => {
  if (!db) {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db('Takuhai-chan');
  }

  return db;
};

const getCollection = async (collectionName) => {
    const database = await connectToDatabase();
    return database.collection(collectionName);
}

const closeConnection = async () => {
    if (client) {
      await client.close();
      client = null;
      db = null;
    }
  };

  module.exports = {
    connectToDatabase,
    getCollection,
    closeConnection,
  };