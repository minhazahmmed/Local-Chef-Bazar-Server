const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    { algorithms: ["HS256"] },
    (error, decoded) => {
      if (error || !decoded?.email) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      req.decoded = decoded;
      next();
    }
  );
};

module.exports = verifyToken;