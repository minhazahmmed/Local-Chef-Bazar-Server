const express = require("express");
const { ObjectId } = require("mongodb");
const { favoritesCollection, mealsCollection } = require("../config/db");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/favorites", verifyToken, async (req, res) => {
  const { mealId } = req.body;
  const userEmail = req.decoded.email;

  if (!ObjectId.isValid(mealId)) {
    return res.status(400).send({ message: "Invalid meal id" });
  }

  const meal = await mealsCollection.findOne({ _id: new ObjectId(mealId) });

  if (!meal) {
    return res.status(404).send({ message: "Meal not found" });
  }

  if (meal.userEmail === userEmail) {
    return res
      .status(400)
      .send({ message: "You cannot add your own meal to favorites" });
  }

  const alreadyAdded = await favoritesCollection.findOne({ userEmail, mealId });

  if (alreadyAdded) {
    return res.send({ exists: true });
  }

  const result = await favoritesCollection.insertOne({
    userEmail,
    mealId,
    mealName: meal.foodName,
    chefId: meal.chefId,
    chefName: meal.chefName,
    price: meal.price,
    addedTime: new Date().toISOString(),
  });

  res.send(result);
});

router.get("/favorites/user/:email", verifyToken, async (req, res) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const favorites = await favoritesCollection
    .find({ userEmail: req.params.email })
    .sort({ addedTime: -1 })
    .toArray();

  res.send(favorites);
});

router.delete("/favorites/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: "Invalid favorite id" });
  }

  const favorite = await favoritesCollection.findOne({ _id: new ObjectId(id) });

  if (!favorite) {
    return res.status(404).send({ message: "Favorite not found" });
  }

  if (favorite.userEmail !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

module.exports = router;