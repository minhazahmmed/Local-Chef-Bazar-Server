require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const mealRoutes = require("./routes/mealRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const requestRoutes = require("./routes/requestRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL.split(","),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("LocalChefBazaar server is running");
});

app.use(authRoutes);
app.use(userRoutes);
app.use(mealRoutes);
app.use(reviewRoutes);
app.use(favoriteRoutes);
app.use(orderRoutes);
app.use(requestRoutes);
app.use(paymentRoutes);
app.use(statsRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: "Something went wrong on the server" });
});

connectDB().catch((error) => console.error("MongoDB connection failed:", error));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;