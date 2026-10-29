const jwt = require("jsonwebtoken");

const optionalToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    { algorithms: ["HS256"] },
    (error, decoded) => {
      if (!error && decoded?.email) {
        req.decoded = decoded;
      }
      next();
    }
  );
};

module.exports = optionalToken;