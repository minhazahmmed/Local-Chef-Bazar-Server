const express = require("express");
const { ObjectId } = require("mongodb");
const { mealsCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");
const { verifyChef, verifyActive } = require("../middlewares/verifyRole");

const router = express.Router();

router.get("/meals", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  let sortQuery = { createdAt: -1 };
  if (req.query.sort === "asc") sortQuery = { price: 1 };
  if (req.query.sort === "desc") sortQuery = { price: -1 };

  const total = await mealsCollection.countDocuments();
  const meals = await mealsCollection
    .find()
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

router.get("/meals/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  res.send(meal);
});

router.post("/meals", verifyToken, verifyChef, verifyActive, async (req, res) => {
  const {
    foodName,
    chefName,
    foodImage,
    price,
    rating,
    ingredients,
    deliveryArea,
    estimatedDeliveryTime,
    chefExperience,
  } = req.body;

  const meal = {
    foodName,
    chefName,
    foodImage,
    price: Number(price),
    rating: Number(rating) || 0,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    deliveryArea,
    estimatedDeliveryTime,
    chefExperience,
    chefId: req.user.chefId,
    userEmail: req.user.email,
    createdAt: new Date(),
  };

  const result = await mealsCollection.insertOne(meal);
  res.send(result);
});

router.patch("/meals/:id", verifyToken, verifyChef, async (req, res) => {
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

  const {
    foodName,
    foodImage,
    price,
    rating,
    ingredients,
    deliveryArea,
    estimatedDeliveryTime,
    chefExperience,
  } = req.body;

  const result = await mealsCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        foodName,
        foodImage,
        price: Number(price),
        rating: Number(rating) || 0,
        ingredients,
        deliveryArea,
        estimatedDeliveryTime,
        chefExperience,
      },
    }
  );

  res.send(result);
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