const express = require("express");

const {
  createEvent,
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  startRegistration,
  stopRegistration,
  updateEvent,
  deleteEvent,
} = require("../controllers/EventController");

const {
  authenticate,
  requireAdmin,
  requireAdminOrCommittee,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   STUDENT EVENTS
========================= */

// Logged-in students can see upcoming events
router.get(
  "/",
  getUpcomingEvents
);

/* =========================
   ADMIN EVENTS
========================= */

// Admin can see ALL events
router.get(
  "/admin/all",
  authenticate,
  requireAdminOrCommittee,
  getAllEvents
);

/* =========================
   CREATE EVENT
========================= */

router.post(
  "/",
  authenticate,
  requireAdmin,
  createEvent
);

/* =========================
   START REGISTRATION
========================= */

router.post(
  "/:id/start-registration",
  authenticate,
  requireAdmin,
  startRegistration
);

/* =========================
   STOP REGISTRATION
========================= */

router.post(
  "/:id/stop-registration",
  authenticate,
  requireAdmin,
  stopRegistration
);

/* =========================
   GET EVENT BY ID
========================= */

router.get(
  "/:id",
  authenticate,
  getEventById
);

/* =========================
   UPDATE EVENT
========================= */

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  updateEvent
);

/* =========================
   DELETE EVENT
========================= */

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  deleteEvent
);

module.exports = router;