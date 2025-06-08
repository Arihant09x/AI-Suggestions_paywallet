//handle non-user related routes
const express = require("express");
const router = express.Router();
const userRoutes = require("./user.js");
const accoounRoutes = require("./account.js");
router.use("/user", userRoutes);
router.use("/account", accoounRoutes);
module.exports = router;
