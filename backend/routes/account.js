const express = require("express");
const axios = require("axios");
const QRCode = require("qrcode");
const { userAuth } = require("../Middleware/userAuth");
const { default: mongoose } = require("mongoose");
const { TransactionHistory, User, Account } = require("../Model/db");
const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
router.get("/balance", userAuth, async (req, res) => {
  const acccount = await Account.findOne({ userId: req.userId });
  if (!acccount) {
    return res.status(404).json({
      message: "Account not found",
    });
  }
  res.status(200).json({
    message: "Account balance fetched successfully",
    balance: (acccount.balance / 100).toFixed(2), // Convert to float with two decimals
  });
});

router.post("/transfer", userAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { amount, to } = req.body;
    amount = Math.round(Number(amount) * 100); // Convert to integer paise/cents

    const account = await Account.findOne({ userId: req.userId }).session(
      session
    );
    if (!account || account.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Insufficient balance ",
      });
    }
    const toAccount = await Account.findOne({ userId: to }).session(session);
    if (!toAccount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Recipient account not found",
      });
    }

    // Perform the transfer
    await Account.updateOne(
      { userId: req.userId },
      { $inc: { balance: -amount } },
      { session }
    );
    await Account.updateOne(
      { userId: to },
      { $inc: { balance: amount } },
      { session }
    );

    // CREATE TRANSACTION HISTORY RECORD HERE
    await TransactionHistory.create(
      [
        {
          from: req.userId,
          to: to,
          amount,
          status: "Transfer",
          timestamp: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Return balance as float with two decimals
    const updatedAccount = await Account.findOne({ userId: req.userId });
    res.status(200).json({
      message: "Transfer successful",
      balance: (updatedAccount.balance / 100).toFixed(2),
    });
  } catch (e) {
    console.error("Error during transfer:", e);
    await session.abortTransaction();
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  } finally {
    session.endSession();
  }
});

router.get("/transaction-history", userAuth, async (req, res) => {
  try {
    const transactions = await TransactionHistory.find({
      $or: [{ from: req.userId }, { to: req.userId }],
    })
      .populate("from", "username FirstName LastName")
      .populate("to", "username FirstName LastName")
      .sort({ timestamp: -1 });

    res.status(200).json({
      message: "Transaction history fetched successfully",
      transactions,
    });
  } catch (e) {
    console.error("Error fetching transaction history:", e);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/add-money", userAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { amount } = req.body;
    amount = Math.round(Number(amount) * 100);
    const account = await Account.findOne({ userId: req.userId }).session(
      session
    );
    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Account not found" });
    }
    account.balance += amount;
    await account.save({ session });

    await TransactionHistory.create(
      [
        {
          from: req.userId,
          to: req.userId,
          amount,
          status: "Add Money",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({
      message: "Money added successfully",
      balance: (account.balance / 100).toFixed(2),
    });
  } catch (e) {
    await session.abortTransaction();
    console.error("Error during add money:", e);
    res.status(500).json({ message: "Internal server error", e });
  } finally {
    session.endSession();
  }
});

router.get("/generate-qr", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const qrData = user.Phone_No; // or user._id
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    res.status(200).json({ qrCode: qrCodeUrl });
  } catch (e) {
    res.status(500).json({ message: "Failed to generate QR code" });
  }
});

router.post("/pay-via-qr", userAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { qrData, amount } = req.body;
    amount = Math.round(Number(amount) * 100);

    const senderAccount = await Account.findOne({ userId: req.userId }).session(
      session
    );
    const receiverUser = await User.findOne({ Phone_No: qrData }).session(
      session
    );
    if (!receiverUser) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Receiver not found" });
    }
    const receiverAccount = await Account.findOne({
      userId: receiverUser._id,
    }).session(session);

    if (!senderAccount || senderAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    senderAccount.balance -= amount;
    receiverAccount.balance += amount;
    await senderAccount.save({ session });
    await receiverAccount.save({ session });

    await TransactionHistory.create(
      [
        {
          from: req.userId,
          to: receiverUser._id,
          amount,
          status: "Paid via QR",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({
      message: "Payment successful",
      balance: (senderAccount.balance / 100).toFixed(2),
    });
  } catch (e) {
    await session.abortTransaction();
    console.error("Error during QR payment:", e);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
});

router.post("/smart-suggestion", userAuth, async (req, res) => {
  try {
    const transactions = await TransactionHistory.find({
      $or: [{ from: req.userId }, { to: req.userId }],
    })
      .populate("from", "username")
      .populate("to", "username")
      .sort({ timestamp: -1 });

    // Prepare prompt for Gemini
    const prompt = `
You are a smart assistant for a payment app. Given the user's past transactions (as JSON), suggest the top 2 most likely recipients and amounts for their next transfers.
Respond with a JSON array of objects: [{ "recipient": "recipient_username", "amount": 1234 }, ...]
Transactions: ${JSON.stringify(transactions)}
`;

    // Call Gemini
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const geminiData = geminiRes.data;

    // Try to parse Gemini's response as an array
    try {
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const arr = JSON.parse(text.match(/\[.*\]/s)[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return res.json(arr);
      }
    } catch {}

    // Fallback: Frequency-based suggestions
    const freq = {};
    for (const tx of transactions) {
      const key = tx.to.username;
      if (!freq[key]) freq[key] = { count: 0, total: 0 };
      freq[key].count += 1;
      freq[key].total += tx.amount;
    }
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .map(([recipient, data]) => ({
        recipient,
        amount: Math.round(data.total / data.count) || 100, // average or fallback
      }));
    return res.json(sorted);
  } catch (e) {
    res.status(500).json({ message: "Failed to get smart suggestions" });
  }
});
module.exports = router;
