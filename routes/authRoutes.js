const express = require("express");
const jwt = require("jsonwebtoken");
const cookieOptions = require("../utils/cookieOptions");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

const router = express.Router();

router.post("/jwt", verifyFirebaseToken, (req, res) => {
  const token = jwt.sign({ email: req.firebaseUser.email }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });

  res
    .cookie("token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .send({ success: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions).send({ success: true });
});

module.exports = router;