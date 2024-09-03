const { MongoClient } = require('mongodb');
const { MONGODB_URI } = process.env;

let db;

const connectToDatabase = async () => {
  if (!db) {
    try {
      const client = await MongoClient.connect(MONGODB_URI);
      db = client.db('Takuhai-chan');
    } catch (error) {
      console.error('Error connecting to the database:', error.message);
      throw new Error('Could not connect to the database');
    }
  }
  return db;
};

const getCollection = async (collectionName) => {
  try {
    const database = await connectToDatabase();
    return database.collection(collectionName);
  } catch (error) {
    console.error('Error getting collection:', error.message);
    throw new Error('Could not get the collection');
  }
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