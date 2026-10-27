const { usersCollection } = require("../config/db");

const generateChefId = async () => {
  while (true) {
    const chefId = `chef-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await usersCollection.findOne({ chefId });

    if (!exists) {
      return chefId;
    }
  }
};

module.exports = generateChefId;