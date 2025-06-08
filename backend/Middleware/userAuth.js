const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader.split(" ").length !== 2) {
    console.error("Authorization header is missing or malformed");
    return res.status(401).json({
      message: "Unauthorized access, please login/token not found",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Unauthorized access, invalid token",
      });
    }
    req.userId = decoded.id;
    next();
  } catch (e) {
    console.error("Error during token verification:", e);
    return res.status(401).json({
      message: "Unauthorized access, token verification failed",
    });
  }
};

module.exports = { userAuth };
