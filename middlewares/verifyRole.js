const { usersCollection } = require("../config/db");

const loadUser = async (req) => {
  if (!req.user) {
    req.user = await usersCollection.findOne({ email: req.decoded.email });
  }
  return req.user;
};

const verifyAdmin = async (req, res, next) => {
  const user = await loadUser(req);

  if (user?.role !== "admin") {
    return res.status(403).send({ message: "forbidden access" });
  }

  next();
};

const verifyChef = async (req, res, next) => {
  const user = await loadUser(req);

  if (user?.role !== "chef") {
    return res.status(403).send({ message: "forbidden access" });
  }

  next();
};

const verifyActive = async (req, res, next) => {
  const user = await loadUser(req);

  if (!user) {
    return res.status(403).send({ message: "forbidden access" });
  }

  if (user.status === "fraud") {
    return res.status(403).send({
      message: "Your account has been marked as fraud, so this action is not allowed",
    });
  }

  next();
};

module.exports = { verifyAdmin, verifyChef, verifyActive };