const express = require("express");
const { ObjectId } = require("mongodb");
const {
  reviewsCollection,
  mealsCollection,
  usersCollection,
} = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const updateMealRating = require("../utils/updateMealRating");

const router = express.Router();

router.get("/reviews", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 6, 1), 50);

  const reviews = await reviewsCollection
    .find()
    .sort({ date: -1 })
    .limit(limit)
    .toArray();

  res.send(reviews);
});

router.get("/reviews/meal/:id", async (req, res) => {
  const reviews = await reviewsCollection
    .find({ foodId: req.params.id })
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

router.post("/reviews", verifyToken, async (req, res) => {
  const { foodId, rating, comment } = req.body;

  if (!ObjectId.isValid(foodId)) {
    return res.status(400).send({ message: "Invalid meal id" });
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
    comment,
    date: new Date().toISOString(),
  });

  await updateMealRating(foodId);
  res.send(result);
});

router.patch("/reviews/:id", verifyToken, async (req, res) => {
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

  const result = await reviewsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { rating: numericRating, comment: req.body.comment } }
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
    return res.status(403).send({ message: "forbidden access" });
  }

  const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

  await updateMealRating(review.foodId);
  res.send(result);
});

module.exports = router;