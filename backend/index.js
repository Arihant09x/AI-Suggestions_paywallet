const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: "https://paywallet.vercel.app",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

const mainrouter = require("./routes/index");
app.use("/api/v1", mainrouter);

// --- MongoDB connection for serverless ---
let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;
  const MONGO_URi = process.env.MONGO_URi;
  try {
    await mongoose.connect(MONGO_URi, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (e) {
    console.error("MongoDB connection error:", e);
  }
}

// Middleware to ensure DB connection on every request (for serverless)
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Export the app for Vercel serverless
module.exports = app;
