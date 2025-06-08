const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const mainrouter = require("./routes/index");
app.use("/api/v1", mainrouter);
const connect = () => {
  console.log("Paytm backend server started");
  const MONGO_URi = process.env.MONGO_URi;
  try {
    mongoose
      .connect(MONGO_URi)
      .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(process.env.PORT || 5000, () => {
          console.log(`Server is running on port ${process.env.PORT || 5000}`);
        });
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
      });
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  }
};
connect();
