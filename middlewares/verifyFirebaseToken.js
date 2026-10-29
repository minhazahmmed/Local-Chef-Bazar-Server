const firebaseAuth = require("../config/firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(header.slice(7));

    if (!decoded.email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    req.firebaseUser = decoded;
    next();
  } catch (error) {
    res.status(401).send({ message: "unauthorized access" });
  }
};

module.exports = verifyFirebaseToken;