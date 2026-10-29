const isText = (value, max) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

const isUrl = (value) => {
  if (typeof value !== "string" || value.length > 500) return false;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch (error) {
    return false;
  }
};

const parseMeal = (body) => {
  const price = Number(body.price);

  if (!isText(body.foodName, 100)) {
    return { error: "Food name is required (max 100 characters)" };
  }

  if (!isUrl(body.foodImage)) {
    return { error: "A valid food image is required" };
  }

  if (!Number.isFinite(price) || price < 100 || price > 50000) {
    return { error: "Price must be between 100 and 50000 BDT" };
  }

  if (
    !Array.isArray(body.ingredients) ||
    body.ingredients.length < 1 ||
    body.ingredients.length > 30 ||
    !body.ingredients.every((item) => isText(item, 60))
  ) {
    return { error: "Add between 1 and 30 ingredients" };
  }

  if (!isText(body.deliveryArea, 100)) {
    return { error: "Delivery area is required (max 100 characters)" };
  }

  const minutes = Number.parseInt(body.estimatedDeliveryTime, 10);

  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 300) {
    return { error: "Delivery time must be between 5 and 300 minutes" };
  }

  const years = Number.parseInt(body.chefExperience, 10);

  if (!Number.isInteger(years) || years < 0 || years > 60) {
    return { error: "Experience must be between 0 and 60 years" };
  }

  return {
    data: {
      foodName: body.foodName.trim(),
      foodImage: body.foodImage,
      price: Math.round(price),
      ingredients: body.ingredients.map((item) => item.trim()),
      deliveryArea: body.deliveryArea.trim(),
      estimatedDeliveryTime: `${minutes} minutes`,
      chefExperience: `${years} ${years === 1 ? "year" : "years"}`,
      chefExperienceYears: years,
    },
  };
};

module.exports = { isText, isUrl, parseMeal };