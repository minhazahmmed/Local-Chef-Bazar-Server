const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("localChefBazaar");

const usersCollection = db.collection("users");
const mealsCollection = db.collection("meals");
const reviewsCollection = db.collection("reviews");
const favoritesCollection = db.collection("favorites");
const ordersCollection = db.collection("order_collection");
const requestsCollection = db.collection("requests");
const paymentsCollection = db.collection("payments");

const connectDB = async () => {
  await client.connect();
  await paymentsCollection.createIndex({ sessionId: 1 }, { unique: true });
  console.log("MongoDB connected");
};

module.exports = {
  connectDB,
  usersCollection,
  mealsCollection,
  reviewsCollection,
  favoritesCollection,
  ordersCollection,
  requestsCollection,
  paymentsCollection,
};