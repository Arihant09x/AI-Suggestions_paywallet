const { default: mongoose } = require("mongoose");
const monggose = require("mongoose");

const userSchema = new monggose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  FirstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 20,
  },
  LastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 20,
  },
  Phone_No: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 10,
    maxLength: 15,
  },
});
const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
});

const transactionSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, required: true },
});
const TransactionHistory = mongoose.model("Transaction", transactionSchema);

const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
module.exports = {
  User,
  Account,
  TransactionHistory,
};
