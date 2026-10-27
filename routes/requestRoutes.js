const express = require("express");
const { ObjectId } = require("mongodb");
const { usersCollection, requestsCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyRole");
const generateChefId = require("../utils/generateChefId");

const router = express.Router();

router.post("/requests", verifyToken, async (req, res) => {
  const { requestType } = req.body;

  if (!["chef", "admin"].includes(requestType)) {
    return res.status(400).send({ message: "Invalid request type" });
  }

  const user = await usersCollection.findOne({ email: req.decoded.email });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  if (user.role === "admin") {
    return res.status(400).send({ message: "Admins cannot send this request" });
  }

  if (requestType === "chef" && user.role === "chef") {
    return res.status(400).send({ message: "You are already a chef" });
  }

  const pendingRequest = await requestsCollection.findOne({
    userEmail: user.email,
    requestStatus: "pending",
  });

  if (pendingRequest) {
    return res.status(400).send({
      message: "You already have a pending request. Please wait for the admin",
    });
  }

  const result = await requestsCollection.insertOne({
    userName: user.name,
    userEmail: user.email,
    requestType,
    requestStatus: "pending",
    requestTime: new Date().toISOString(),
  });

  res.send(result);
});

router.get("/requests", verifyToken, verifyAdmin, async (req, res) => {
  const requests = await requestsCollection
    .find()
    .sort({ requestTime: -1 })
    .toArray();

  res.send(requests);
});

router.get("/requests/user/:email", verifyToken, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const requests = await requestsCollection
    .find({ userEmail: req.params.email })
    .sort({ requestTime: -1 })
    .toArray();

  res.send(requests);
});

router.patch("/requests/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid request id" });
  }

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).send({ message: "Invalid action" });
  }

  const request = await requestsCollection.findOne({ _id: new ObjectId(id) });

  if (!request) {
    return res.status(404).send({ message: "Request not found" });
  }

  if (request.requestStatus !== "pending") {
    return res.status(400).send({ message: "This request is already handled" });
  }

  if (action === "approve") {
    if (request.requestType === "chef") {
      const chefId = await generateChefId();
      await usersCollection.updateOne(
        { email: request.userEmail },
        { $set: { role: "chef", chefId } }
      );
    } else {
      await usersCollection.updateOne(
        { email: request.userEmail },
        { $set: { role: "admin" } }
      );
    }
  }

  await requestsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { requestStatus: action === "approve" ? "approved" : "rejected" } }
  );

  res.send({ success: true });
});

module.exports = router;