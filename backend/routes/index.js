//handle non-user related routes
const express = require("express");
const router = express.Router();
const userRoutes = require("./user.js");
const accoounRoutes = require("./account.js");
router.use("/user", userRoutes);
router.use("/account", accoounRoutes);
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the User API",
  });
});
module.exports = router;
