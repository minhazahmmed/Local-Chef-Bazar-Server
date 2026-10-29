const express = require("express");
const Stripe = require("stripe");
const { ObjectId } = require("mongodb");
const { ordersCollection, paymentsCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyActive } = require("../middlewares/verifyRole");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const clientUrl = process.env.CLIENT_URL.split(",")[0];

const currency = (process.env.STRIPE_CURRENCY || "bdt").toLowerCase();
const bdtPerUsd = Number(process.env.BDT_PER_USD || 122);

const toMinorUnits = (bdtAmount) =>
  currency === "usd"
    ? Math.round((bdtAmount / bdtPerUsd) * 100)
    : Math.round(bdtAmount * 100);

router.post("/create-checkout-session", verifyToken, verifyActive, async (req, res) => {
  const { orderId } = req.body;

  if (typeof orderId !== "string" || !ObjectId.isValid(orderId)) {
    return res.status(400).send({ message: "Invalid order id" });
  }

  const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

  if (!order) {
    return res.status(404).send({ message: "Order not found" });
  }

  if (order.userEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const canPay =
    order.orderStatus === "accepted" &&
    order.paymentStatus.toLowerCase() === "pending";

  if (!canPay) {
    return res.status(400).send({ message: "This order cannot be paid right now" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.userEmail,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: toMinorUnits(order.price),
          product_data: { name: order.mealName },
        },
        quantity: order.quantity,
      },
    ],
    metadata: { orderId: order._id.toString() },
    success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/dashboard/my-orders`,
  });

  res.send({ url: session.url });
});

router.post("/payments/confirm", verifyToken, async (req, res) => {
  const { sessionId } = req.body;

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).send({ message: "Session id is required" });
  }

  let session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    return res.status(400).send({ message: "Invalid payment session" });
  }

  if (session.payment_status !== "paid") {
    return res.status(400).send({ message: "Payment is not completed" });
  }

  const orderId = session.metadata?.orderId;

  if (!orderId || !ObjectId.isValid(orderId)) {
    return res.status(400).send({ message: "Invalid payment session" });
  }

  const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

  if (!order || order.userEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  if (session.amount_total !== toMinorUnits(order.price) * order.quantity) {
    return res.status(400).send({ message: "Payment amount does not match" });
  }

  try {
    await paymentsCollection.insertOne({
      orderId: order._id.toString(),
      mealName: order.mealName,
      userEmail: order.userEmail,
      amount: order.price * order.quantity,
      currency: "bdt",
      chargedAmount: session.amount_total / 100,
      chargedCurrency: session.currency,
      transactionId: session.payment_intent,
      sessionId,
      paidAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  await ordersCollection.updateOne(
    { _id: order._id },
    { $set: { paymentStatus: "paid" } }
  );

  res.send({ success: true });
});

module.exports = router;