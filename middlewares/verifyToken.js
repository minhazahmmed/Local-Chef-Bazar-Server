const getRequestEmail = require("../utils/getRequestEmail");

const verifyToken = async (req, res, next) => {
  const email = await getRequestEmail(req);

  if (!email) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  req.decoded = { email };
  next();
};

module.exports = verifyToken;