const express = require("express");
const { signup, login, logout } = require("../controllers/authController"); // no destructuring
const authRouter = express.Router(); // ✅ call Router

authRouter.post("/signup", signup);
authRouter.post("/signin", login);
authRouter.post("/logout", logout);

module.exports = authRouter;
