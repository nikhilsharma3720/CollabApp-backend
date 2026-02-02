const jwt = require("jsonwebtoken");
require("dotenv").config(); // load .env

const authenticateToken = async (req, res, next) => {
  // Check cookies first (this is where httpOnly cookies live)
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id and email
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
module.exports = authenticateToken;
