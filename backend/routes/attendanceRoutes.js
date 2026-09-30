const express = require("express");
const { markAttendance, getEventAttendance } = require("../controllers/attendanceController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate, requireAdmin);
router.post("/mark", markAttendance);
router.get("/event/:eventId", getEventAttendance);

module.exports = router;