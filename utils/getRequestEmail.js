const jwt = require("jsonwebtoken");
const firebaseAuth = require("../config/firebaseAdmin");

const fromFirebaseToken = async (idToken) => {
  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    return decoded.email || null;
  } catch (error) {
    return null;
  }
};

const fromCookieToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return decoded.email || null;
  } catch (error) {
    return null;
  }
};

const getRequestEmail = async (req) => {
  const header = req.headers.authorization || "";

  if (header.startsWith("Bearer ")) {
    return fromFirebaseToken(header.slice(7));
  }

  const token = req.cookies?.token;

  if (token) return fromCookieToken(token);

  return null;
};

module.exports = getRequestEmail;