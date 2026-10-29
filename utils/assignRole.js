const { usersCollection, mealsCollection } = require("../config/db");
const generateChefId = require("./generateChefId");

const assignRole = async (user, role) => {
  const updates = { role };

  if (role === "chef") {
    updates.chefId = user.chefId || (await generateChefId());
  }

  await usersCollection.updateOne({ _id: user._id }, { $set: updates });

  if (role === "chef") {
    await mealsCollection.updateMany(
      { userEmail: user.email },
      { $set: { hidden: false } }
    );
  } else if (user.role === "chef") {
    await mealsCollection.updateMany(
      { userEmail: user.email },
      { $set: { hidden: true } }
    );
  }
};

module.exports = assignRole;