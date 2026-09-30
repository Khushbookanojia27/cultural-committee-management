const express = require("express");
const {
  getAvailableFeedback,
  submitFeedback,
  getFeedbackReport,
} = require("../controllers/feedbackController");
const { authenticate, requireStudent, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin/report", authenticate, requireAdmin, getFeedbackReport);
router.use(authenticate, requireStudent);
router.get("/available", getAvailableFeedback);
router.post("/", submitFeedback);

module.exports = router;
