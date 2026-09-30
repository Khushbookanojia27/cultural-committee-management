const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../utils/token");

/* =========================
   AUTHENTICATE USER
========================= */

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    const [scheme, token] = authorization.split(" ");

    // Check Bearer token
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required. Please login.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, getJwtSecret());

    // Find user in database
    const user = await User.findById(decoded.id).select(
      "_id name email role status"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked.",
      });
    }

    // Store authenticated user in request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

/* =========================
   STUDENT ONLY
========================= */

const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Student access only.",
    });
  }

  next();
};

/* =========================
   ADMIN ONLY
========================= */

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

const requireAdminOrCommittee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "committee") {
    return res.status(403).json({
      success: false,
      message: "Admin or committee access only.",
    });
  }

  next();
};

/* =========================
   STUDENT OR ADMIN
========================= */

const requireStudentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "student" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  next();
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  authenticate,
  requireStudent,
  requireAdmin,
  requireAdminOrCommittee,
  requireStudentOrAdmin,
};