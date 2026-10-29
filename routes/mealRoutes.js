const express = require("express");
const { ObjectId } = require("mongodb");
const { mealsCollection, usersCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyChef, verifyAdmin, verifyActive } = require("../middlewares/verifyRole");
const { publicMealFilter, isPublicMeal } = require("../utils/mealVisibility");
const { parseMeal } = require("../utils/validators");

const router = express.Router();

const visibleFilter = publicMealFilter;

const syncChefExperience = async (email, years, label) => {
  await usersCollection.updateOne(
    { email },
    { $set: { chefExperienceYears: years } }
  );
  await mealsCollection.updateMany(
    { userEmail: email },
    { $set: { chefExperience: label } }
  );
};

router.get("/meals", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  let sortQuery = { createdAt: -1 };
  if (req.query.sort === "asc") sortQuery = { price: 1 };
  if (req.query.sort === "desc") sortQuery = { price: -1 };

  const total = await mealsCollection.countDocuments(visibleFilter);
  const meals = await mealsCollection
    .find(visibleFilter)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  res.send({ meals, total });
});

router.get("/meals/chef/:email", verifyToken, verifyChef, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const meals = await mealsCollection
    .find({ userEmail: req.params.email })
    .sort({ createdAt: -1 })
    .toArray();

  res.send(meals);
});

router.get("/meals/admin", verifyToken, verifyAdmin, async (req, res) => {
  const meals = await mealsCollection.find().sort({ createdAt: -1 }).toArray();
  res.send(meals);
});

router.patch("/meals/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  const result = await mealsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).send({ message: "Meal not found" });
  }

  res.send({ success: true });
});

router.get("/meals/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (!isPublicMeal(meal) && meal.userEmail !== req.decoded.email) {
    const viewer = await usersCollection.findOne({ email: req.decoded.email });

    if (viewer?.role !== "admin") {
      return res.status(404).send({ message: "Meal not found" });
    }
  }

  res.send(meal);
});

router.post("/meals", verifyToken, verifyChef, verifyActive, async (req, res) => {
  const { data, error } = parseMeal(req.body);

  if (error) {
    return res.status(400).send({ message: error });
  }

  const { chefExperienceYears, ...mealData } = data;

  const result = await mealsCollection.insertOne({
    ...mealData,
    chefName: req.user.name,
    status: "pending",
    rating: 0,
    chefId: req.user.chefId,
    userEmail: req.user.email,
    createdAt: new Date(),
  });

  await syncChefExperience(req.user.email, chefExperienceYears, mealData.chefExperience);

  res.send(result);
});

router.patch("/meals/:id", verifyToken, verifyChef, verifyActive, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (meal.userEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const { data, error } = parseMeal(req.body);

  if (error) {
    return res.status(400).send({ message: error });
  }

  const { chefExperienceYears, ...mealData } = data;

  const needsReview =
    mealData.foodImage !== meal.foodImage || mealData.foodName !== meal.foodName;

  const updates = needsReview ? { ...mealData, status: "pending" } : mealData;

  const result = await mealsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );

  await syncChefExperience(req.user.email, chefExperienceYears, mealData.chefExperience);

  res.send({ ...result, sentForReview: needsReview });
});

router.delete("/meals/:id", verifyToken, verifyChef, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (meal.userEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

module.exports = router;