const { User, Account } = require("../Model/db.js");
//handle the user related routes
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const express = require("express");
const router = express.Router();
router.use(express.json());
const { z } = require("zod");
const { userAuth } = require("../Middleware/userAuth.js");
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the User API",
  });
});

router.post("/signup", async (req, res) => {
  const parseResult = registerZodSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      message:
        parseResult.error.errors.map((error) => error.message).join(", ") ||
        "Invalid input",
      errors: parseResult.error.errors,
    });
  }

  const { username, firstname, lastname, password, Phone_No } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({
        message: "Username/email already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      FirstName: firstname,
      LastName: lastname,
      Phone_No: Phone_No,
      password: hashedPassword,
    });
    // Create an account for the new user with a random initial balance
    await Account.create({
      userId: newUser._id,
      balance: (1 + Math.floor(Math.random() * 10000)) * 100, //initial balance between 1 and 10,000.00
    });
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "7Days",
    });
    res.status(201).json({
      message: "User created successfully",
      token: token,
    });
  } catch (e) {
    console.error("Error during signup:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/signin", async (req, res) => {
  const parseResult = loginZodSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      message:
        parseResult.error.errors.map((error) => error.message).join(",") ||
        "Invalid input",
      errors: parseResult.error.errors,
    });
  }
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
      username: username,
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid username or Please Signup",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }
    const token = await jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7Days",
    });
    res.status(200).json({
      message: "Login successful",
      token: token,
    });
  } catch (e) {
    console.error("Error during signin:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.put("/update", userAuth, async (req, res) => {
  const parseResult = updateZodSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(411).json({
      message: "Error while updating information",
      errors: parseResult.error.errors.map((error) => error.message).join(", "),
    });
  }
  const updateData = {};
  if (req.body.firstname) {
    updateData.FirstName = req.body.firstname;
  }
  if (req.body.lastname) {
    updateData.LastName = req.body.lastname;
  }
  if (req.body.Phone_No) {
    updateData.Phone_No = req.body.Phone_No;
  }
  if (req.body.password) {
    updateData.password = await bcrypt.hash(req.body.password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      message: "No valid fields to update",
    });
  }
  try {
    await User.updateOne({ _id: req.userId }, { $set: updateData });
    res.status(200).json({
      message: ` Updated fields: ${Object.keys(updateData).join(", ")}`,
    });
  } catch (e) {
    console.error("Error during update:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/users", async (req, res) => {
  const filter = req.query.filter || "";
  try {
    const users = await User.find({
      //doing mutiple DB queries to find users
      $or: [
        { username: { $regex: filter, $options: "i" } },
        { FirstName: { $regex: filter, $options: "i" } }, //case insensitive search
        { LastName: { $regex: filter, $options: "i" } },
        { Phone_No: { $regex: filter, $options: "i" } },
      ],
    });
    res.status(200).json({
      message: "Users fetched successfully",
      user: users.map((user) => ({
        id: user._id,
        username: user.username,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Phone_No: user.Phone_No,
      })),
    });
  } catch (e) {
    console.error("Error during update:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/profile", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Zod schemas for validation
const registerZodSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters long")
    .email("Invalid email format"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
  Phone_No: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must not exceed 15 characters")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

const loginZodSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters long")
    .email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
});

const updateZodSchema = z.object({
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .optional(),
  Phone_No: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must not exceed 15 characters")
    .regex(/^\d+$/, "Phone number must contain only digits")
    .optional(),
});

module.exports = router;
