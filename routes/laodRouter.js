const express = require("express");
const loadRouter = express.Router();
const sendUserData = require("../controllers/loadController");
const authMiddleware = require("../middlewares/authMiddleware");
loadRouter.get("/me", authMiddleware, sendUserData);
module.exports = loadRouter;
