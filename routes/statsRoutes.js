const express = require("express");
const {
  usersCollection,
  ordersCollection,
  paymentsCollection,
} = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyAdmin } = require("../middlewares/verifyRole");

const router = express.Router();

router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  const totalUsers = await usersCollection.countDocuments();

  const ordersPending = await ordersCollection.countDocuments({
    orderStatus: { $in: ["pending", "accepted"] },
  });

  const ordersDelivered = await ordersCollection.countDocuments({
    orderStatus: "delivered",
  });

  const payments = await paymentsCollection
    .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
    .toArray();

  res.send({
    totalPayment: payments[0]?.total || 0,
    totalUsers,
    ordersPending,
    ordersDelivered,
  });
});

module.exports = router;