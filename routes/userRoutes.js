const express = require("express");
const { ObjectId } = require("mongodb");
const {
  usersCollection,
  reviewsCollection,
  mealsCollection,
  ordersCollection,
  requestsCollection,
} = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { isText, isUrl } = require("../utils/validators");
const { verifyAdmin } = require("../middlewares/verifyRole");
const assignRole = require("../utils/assignRole");

const router = express.Router();

router.post("/users", verifyFirebaseToken, async (req, res) => {
  const email = req.firebaseUser.email;
  const { name, image, address } = req.body;

  const existingUser = await usersCollection.findOne({ email });

  if (existingUser) {
    return res.send({ message: "user already exists", insertedId: null });
  }

  const result = await usersCollection.insertOne({
    name: isText(name, 80) ? name.trim() : req.firebaseUser.name || "User",
    email,
    image: isUrl(image) ? image : req.firebaseUser.picture || "",
    address: typeof address === "string" ? address.trim().slice(0, 200) : "",
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

  if (!isText(name, 80) || !isText(address, 200)) {
    return res.status(400).send({ message: "Name and address are required" });
  }

  const updates = { name: name.trim(), address: address.trim() };
  if (image && isUrl(image)) updates.image = image;

  const result = await usersCollection.updateOne({ email }, { $set: updates });

  if (result.matchedCount === 0) {
    return res.status(404).send({ message: "user not found" });
  }

  const reviewUpdates = { reviewerName: updates.name };
  if (image) reviewUpdates.reviewerImage = image;
  await reviewsCollection.updateMany(
    { reviewerEmail: email },
    { $set: reviewUpdates }
  );

  const user = await usersCollection.findOne({ email });

  if (user.role === "chef") {
    await mealsCollection.updateMany(
      { userEmail: email },
      { $set: { chefName: updates.name } }
    );
    await ordersCollection.updateMany(
      { chefId: user.chefId },
      { $set: { chefName: updates.name } }
    );
  }

  res.send({ success: true });
});

router.patch("/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid user id" });
  }

  if (!["user", "chef", "admin"].includes(role)) {
    return res.status(400).send({ message: "Invalid role" });
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  if (user.email === req.decoded.email) {
    return res.status(400).send({ message: "You cannot change your own role" });
  }

  if (user.role === role) {
    return res.send({ success: true });
  }

  if (user.role === "chef") {
    const openOrders = await ordersCollection.countDocuments({
      chefId: user.chefId,
      orderStatus: { $in: ["pending", "accepted"] },
    });

    if (openOrders > 0) {
      return res.status(400).send({
        message: "This chef still has pending or accepted orders",
      });
    }
  }

  await assignRole(user, role);

  await requestsCollection.updateMany(
    { userEmail: user.email, requestType: role, requestStatus: "pending" },
    { $set: { requestStatus: "approved" } }
  );

  res.send({ success: true });
});

router.patch("/users/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid user id" });
  }

  if (!["active", "fraud"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  if (user.email === req.decoded.email) {
    return res.status(400).send({ message: "You cannot change your own status" });
  }

  if (user.role === "admin" && status === "fraud") {
    return res.status(400).send({ message: "An admin cannot be marked as fraud" });
  }

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  res.send(result);
});

module.exports = router;