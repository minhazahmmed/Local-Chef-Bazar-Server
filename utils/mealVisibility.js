const publicMealFilter = {
  hidden: { $ne: true },
  status: { $nin: ["pending", "rejected"] },
};

const isPublicMeal = (meal) =>
  !meal.hidden && !["pending", "rejected"].includes(meal.status);

module.exports = { publicMealFilter, isPublicMeal };