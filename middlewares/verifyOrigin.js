const allowedOrigins = process.env.CLIENT_URL.split(",").map((url) => url.trim());

const verifyOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).send({ message: "forbidden origin" });
  }

  next();
};

module.exports = verifyOrigin;