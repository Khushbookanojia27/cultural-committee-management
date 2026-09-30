const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
} = require("../controllers/userController");

const {
  authenticate,
  requireAdmin,
  requireAdminOrCommittee,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Admin routes
router.get("/", authenticate, requireAdminOrCommittee, getAllUsers);
router.patch("/:id/status", authenticate, requireAdmin, toggleUserStatus);

// User Profile (Students & Admins)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

// Aliases
router.get("/me", authenticate, getProfile);
router.put("/me", authenticate, updateProfile);

module.exports = router;