const { ObjectId } = require("mongodb");
const { reviewsCollection, mealsCollection } = require("../config/db");

const updateMealRating = async (foodId) => {
  const result = await reviewsCollection
    .aggregate([
      { $match: { foodId } },
      { $group: { _id: null, average: { $avg: "$rating" } } },
    ])
    .toArray();

  const average = result[0]?.average || 0;

  await mealsCollection.updateOne(
    { _id: new ObjectId(foodId) },
    { $set: { rating: Number(average.toFixed(1)) } }
  );
};

module.exports = updateMealRating;