const express = require("express");
const jwt = require("jsonwebtoken");
const cookieOptions = require("../utils/cookieOptions");

const router = express.Router();

router.post("/jwt", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
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