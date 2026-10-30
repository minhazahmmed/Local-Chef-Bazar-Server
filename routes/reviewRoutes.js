const express = require("express");
const { ObjectId } = require("mongodb");
const {
  reviewsCollection,
  mealsCollection,
  usersCollection,
  ordersCollection,
} = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const optionalToken = require("../middlewares/optionalToken");
const { verifyAdmin, verifyActive } = require("../middlewares/verifyRole");
const updateMealRating = require("../utils/updateMealRating");

const router = express.Router();

const publicFilter = { status: { $nin: ["pending", "rejected"] } };

router.get("/reviews", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 6, 1), 50);

  const reviews = await reviewsCollection
    .find(publicFilter, { projection: { reviewerEmail: 0 } })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();

  res.send(reviews);
});

router.get("/reviews/admin", verifyToken, verifyAdmin, async (req, res) => {
  const reviews = await reviewsCollection.find().sort({ date: -1 }).toArray();
  res.send(reviews);
});

router.get("/reviews/meal/:id", optionalToken, async (req, res) => {
  const conditions = [publicFilter];

  if (req.decoded?.email) {
    conditions.push({ status: "pending", reviewerEmail: req.decoded.email });
  }

  const reviews = await reviewsCollection
   .find(
  { foodId: req.params.id, $or: conditions },
  { projection: { reviewerEmail: 0 } }
)
    .sort({ date: -1 })
    .toArray();

  res.send(reviews);
});

router.get("/reviews/user/:email", verifyToken, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const reviews = await reviewsCollection
    .find({ reviewerEmail: req.params.email })
    .sort({ date: -1 })
    .toArray();

  res.send(reviews);
});

const hasOrdered = async (email, foodId) => {
  const order = await ordersCollection.findOne({
    userEmail: email,
    foodId,
    orderStatus: { $ne: "cancelled" },
  });
  return !!order;
};

router.get("/reviews/can-review/:foodId", verifyToken, async (req, res) => {
  const canReview = await hasOrdered(req.decoded.email, req.params.foodId);
  res.send({ canReview });
});

router.post("/reviews", verifyToken, verifyActive, async (req, res) => {
  const { foodId, rating, comment } = req.body;

  if (typeof foodId !== "string" || !ObjectId.isValid(foodId)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  if (typeof comment !== "string" || !comment.trim() || comment.length > 500) {
    return res
      .status(400)
      .send({ message: "Comment is required (max 500 characters)" });
  }

  const numericRating = Number(rating);

  if (!(numericRating >= 1 && numericRating <= 5)) {
    return res.status(400).send({ message: "Rating must be between 1 and 5" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(foodId) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (meal.userEmail === req.decoded.email) {
    return res.status(400).send({ message: "You cannot review your own meal" });
  }

  const ordered = await hasOrdered(req.decoded.email, foodId);

  if (!ordered) {
    return res
      .status(403)
      .send({ message: "You can review only the meals you have ordered" });
  }

  const user = await usersCollection.findOne({ email: req.decoded.email });

  if (!user) {
    return res.status(404).send({ message: "user not found" });
  }

  const result = await reviewsCollection.insertOne({
    foodId,
    mealName: meal.foodName,
    reviewerName: user.name,
    reviewerEmail: user.email,
    reviewerImage: user.image,
    rating: numericRating,
    comment: comment.trim(),
    status: "pending",
    date: new Date().toISOString(),
  });

  res.send(result);
});

router.patch("/reviews/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid review id" });
  }

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

  if (!review) {
    return res.status(404).send({ message: "Review not found" });
  }

  const result = await reviewsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  await updateMealRating(review.foodId);
  res.send(result);
});

router.patch("/reviews/:id", verifyToken, verifyActive, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid review id" });
  }

  const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

  if (!review) {
    return res.status(404).send({ message: "Review not found" });
  }

  if (review.reviewerEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const numericRating = Number(req.body.rating);

  if (!(numericRating >= 1 && numericRating <= 5)) {
    return res.status(400).send({ message: "Rating must be between 1 and 5" });
  }

  const newComment = req.body.comment;

  if (typeof newComment !== "string" || !newComment.trim() || newComment.length > 500) {
    return res
      .status(400)
      .send({ message: "Comment is required (max 500 characters)" });
  }

  const result = await reviewsCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        rating: numericRating,
        comment: newComment.trim(),
        status: "pending",
      },
    }
  );

  await updateMealRating(review.foodId);
  res.send(result);
});

router.delete("/reviews/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid review id" });
  }

  const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

  if (!review) {
    return res.status(404).send({ message: "Review not found" });
  }

  if (review.reviewerEmail !== req.decoded.email) {
    const user = await usersCollection.findOne({ email: req.decoded.email });

    if (user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
  }

  const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

  await updateMealRating(review.foodId);
  res.send(result);
});

module.exports = router;