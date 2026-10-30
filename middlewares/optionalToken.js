const getRequestEmail = require("../utils/getRequestEmail");

const optionalToken = async (req, res, next) => {
  const email = await getRequestEmail(req);

  if (email) {
    req.decoded = { email };
  }

  next();
};

module.exports = optionalToken;