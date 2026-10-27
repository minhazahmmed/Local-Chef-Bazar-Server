const express = require("express");
const { ObjectId } = require("mongodb");
const {
  usersCollection,
  reviewsCollection,
  mealsCollection,
  ordersCollection,
} = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyRole");

const router = express.Router();

router.post("/users", async (req, res) => {
  const { name, email, image, address } = req.body;

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  const existingUser = await usersCollection.findOne({ email });

  if (existingUser) {
    return res.send({ message: "user already exists", insertedId: null });
  }

  const result = await usersCollection.insertOne({
    name,
    email,
    image,
    address,
    role: "user",
    status: "active",
    createdAt: new Date().toISOString(),
  });

  res.send(result);
});

router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const users = await usersCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(users);
});

router.get("/users/:email", verifyToken, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const user = await usersCollection.findOne({ email: req.params.email });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  res.send(user);
});

router.patch("/users/profile", verifyToken, async (req, res) => {
  const { name, image, address } = req.body;
  const email = req.decoded.email;

  if (!name || !address) {
    return res.status(400).send({ message: "Name and address are required" });
  }

  const updates = { name, address };
  if (image) updates.image = image;

  const result = await usersCollection.updateOne({ email }, { $set: updates });

  if (result.matchedCount === 0) {
    return res.status(404).send({ message: "user not found" });
  }

  const reviewUpdates = { reviewerName: name };
  if (image) reviewUpdates.reviewerImage = image;
  await reviewsCollection.updateMany(
    { reviewerEmail: email },
    { $set: reviewUpdates }
  );

  const user = await usersCollection.findOne({ email });

  if (user.role === "chef") {
    await mealsCollection.updateMany(
      { userEmail: email },
      { $set: { chefName: name } }
    );
    await ordersCollection.updateMany(
      { chefId: user.chefId },
      { $set: { chefName: name } }
    );
  }

  res.send({ success: true });
});

router.patch("/users/:id/fraud", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid user id" });
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  if (user.role === "admin") {
    return res.status(400).send({ message: "An admin cannot be marked as fraud" });
  }

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "fraud" } }
  );

  res.send(result);
});

module.exports = router;