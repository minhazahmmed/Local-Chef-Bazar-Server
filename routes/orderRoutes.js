const express = require("express");
const { ObjectId } = require("mongodb");
const { ordersCollection, mealsCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyChef, verifyActive } = require("../middlewares/verifyRole");

const router = express.Router();

const allowedChanges = {
  pending: ["accepted", "cancelled"],
  accepted: ["delivered"],
};

router.post("/orders", verifyToken, verifyActive, async (req, res) => {
  const { foodId, quantity, userAddress } = req.body;

  if (!ObjectId.isValid(foodId)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const numericQuantity = Number(quantity);

  if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
    return res.status(400).send({ message: "Quantity must be at least 1" });
  }

  if (!userAddress) {
    return res.status(400).send({ message: "Delivery address is required" });
  }

    const meal = await mealsCollection.findOne({ _id: new ObjectId(foodId) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (meal.userEmail === req.decoded.email) {
    return res.status(400).send({ message: "You cannot order your own meal" });
  }

  const result = await ordersCollection.insertOne({
    foodId,
    mealName: meal.foodName,
    price: meal.price,
    quantity: numericQuantity,
    chefId: meal.chefId,
    chefName: meal.chefName,
    estimatedDeliveryTime: meal.estimatedDeliveryTime,
    paymentStatus: "Pending",
    userEmail: req.decoded.email,
    userAddress,
    orderStatus: "pending",
    orderTime: new Date().toISOString(),
  });

  res.send(result);
});

router.get("/orders/user/:email", verifyToken, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const orders = await ordersCollection
    .find({ userEmail: req.params.email })
    .sort({ orderTime: -1 })
    .toArray();

  res.send(orders);
});

router.get("/orders/chef/:chefId", verifyToken, verifyChef, async (req, res) => {
  if (req.user.chefId !== req.params.chefId) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const orders = await ordersCollection
    .find({ chefId: req.params.chefId })
    .sort({ orderTime: -1 })
    .toArray();

  res.send(orders);
});

router.patch("/orders/:id/status", verifyToken, verifyChef, async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid order id" });
  }

  const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

  if (!order) {
    return res.status(404).send({ message: "Order not found" });
  }

  if (order.chefId !== req.user.chefId) {
    return res.status(403).send({ message: "forbidden access" });
  }

  if (!allowedChanges[order.orderStatus]?.includes(orderStatus)) {
    return res.status(400).send({ message: "This status change is not allowed" });
  }

  const result = await ordersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { orderStatus } }
  );

  res.send(result);
});

module.exports = router;