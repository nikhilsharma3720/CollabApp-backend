const jwt = require("jsonwebtoken");
require("dotenv").config(); // load .env

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookie
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
