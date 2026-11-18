const { MongoClient } = require("mongodb");

let client;
let dbPromise;

async function getDB() {
  if (!dbPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }

    const newClient = new MongoClient(uri);
    client = newClient;
    dbPromise = (async () => {
      await newClient.connect();
      const db = newClient.db("studiospace");

      await Promise.all([
        db.collection("wishlists").createIndex(
          { userEmail: 1, studioId: 1 },
          { unique: true },
        ),
        db.collection("bookings").createIndex({ studioId: 1, date: 1, status: 1 }),
        db.collection("studios").createIndex({ createdAt: 1 }),
      ]);

      return db;
    })().catch(async (error) => {
      dbPromise = undefined;
      if (client === newClient) {
        client = undefined;
      }

      try {
        await newClient.close();
      } catch (closeError) {
        console.error("Failed to close MongoDB client after initialization error:", closeError);
      }

      throw error;
    });
  }

  return dbPromise;
}

module.exports = { getDB };