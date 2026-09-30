const express = require("express");
const {
  registerEvent,
  getStudentRegistrations,
  cancelRegistration,
  getAllRegistrations,
  updateRegistrationStatus,
} = require("../controllers/registrationController");
const { authenticate, requireStudent, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin/all", authenticate, requireAdmin, getAllRegistrations);
router.patch("/:id/status", authenticate, requireAdmin, updateRegistrationStatus);

router.use(authenticate, requireStudent);

router.post("/register", registerEvent);
router.get("/my", getStudentRegistrations);
router.get("/", getStudentRegistrations);
router.delete("/cancel", cancelRegistration);

// A REST-style alternative for clients that place the event id in the URL.
router.delete("/:eventId", (req, res, next) => {
  req.body = { ...(req.body || {}), eventId: req.params.eventId };
  next();
}, cancelRegistration);

module.exports = router;
