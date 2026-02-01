const User = require("../models/userModal");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // load .env

// SIGNUP

// SIGNUP
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body; // include name

    console.log("Signup attempt:", email, name);

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({ name, email, password }); // save name too

    console.log("User created:", user);

    // Return user info
    res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        name: user.name, // send name in response
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in DB
    const user = await User.findOne({ email });

    // Check credentials
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      id: user._id,
      email: user.email,
    };

    // Sign token (expires in 1 hour)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Send token as HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
    });

    // Send response
    res.json({
      message: "Login success",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
function logout(req, res) {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only over https
    expires: new Date(0), // expire immediately
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
}

module.exports = { signup, login, logout };
