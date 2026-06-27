import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { sendMail } from "../utils/email.js";

async function register(req, res) {
  try {
    const { name, email, password, timezone, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      timezone: timezone || "Asia/Kolkata",
      country: country || "IN",
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    sendMail({
      to: user.email,
      subject: "Welcome to Vibe2Ship - The Last-Minute Life Saver",
      html: `<p>Hi ${user.name},</p><p>Your account is ready. From now on, we'll watch your deadlines so you never miss another one - with reminders 1 day, 1 hour, and 20 minutes before anything is due.</p>`,
    }).catch(() => {});

    res.status(201).json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed. Database may be offline." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed. Database may be offline." });
  }
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: "Refresh token invalid" });
    }
    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Refresh token invalid or expired" });
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne({ _id: req.userId }, { $pull: { refreshTokens: refreshToken } });
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Logout failed" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("Me error:", err.message);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, timezone, country, notificationPrefs } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (country) user.country = country;
    if (notificationPrefs) user.notificationPrefs = { ...user.notificationPrefs, ...notificationPrefs };
    await user.save();
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("UpdateProfile error:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export { register, login, refresh, logout, me, updateProfile };
