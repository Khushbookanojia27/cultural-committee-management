const express = require("express");
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/", getUserNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/mark-all-read", markAllNotificationsRead);

module.exports = router;
