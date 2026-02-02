const User = require("../models/userModal");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ------------------ SIGNUP ------------------
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Signup attempt:", email, name);

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    console.log("User created:", user);

    res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// ------------------ LOGIN ------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ Production-ready cookie for cross-origin (Vercel → Render)
res.cookie("token", token, {
  httpOnly: true,
  secure: true, // MUST be true for HTTPS (Render is HTTPS)
  sameSite: "none", // allow cross-site cookies
  maxAge: 3600000,
});


    res.json({
      message: "Login success",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ------------------ LOGOUT ------------------
function logout(req, res) {
  res.cookie("token", "", {
    httpOnly: true,
    // If testing cross-domain (Local frontend -> Render backend), 
    // this MUST be true even in dev.
    secure: true, 
    sameSite: "none", 
    expires: new Date(0),
    path: "/", // Explicitly set path to ensure it matches the original cookie
  });
  res.status(200).json({ message: "Logged out successfully" });
}

module.exports = { signup, login, logout };
