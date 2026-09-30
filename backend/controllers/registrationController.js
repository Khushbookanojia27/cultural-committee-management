const mongoose = require("mongoose");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Attendance = require("../models/Attendance");
const { getEventStart } = require("../utils/eventHelpers");
const {
  createNotification,
  checkAndTriggerEventQRCodes,
  generateQrDataUrl,
} = require("./notificationController");

const EVENT_FIELDS =
  "title description category date time endTime venue registrationDeadline maxParticipants eventType poster status";

const eventHasStarted = (event) => {
  const start = getEventStart(event);
  return !Number.isNaN(start.getTime()) && start <= new Date();
};

const isValidEventId = (eventId) => mongoose.isValidObjectId(eventId);

// POST /api/registrations/register
const registerEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!isValidEventId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This event has been cancelled.",
      });
    }

    if (!event.registrationOpen) {
      return res.status(409).json({
        success: false,
        message: "Registration is currently closed for this event.",
      });
    }

    if (
      event.registrationDeadline &&
      new Date(event.registrationDeadline) < new Date()
    ) {
      return res.status(409).json({
        success: false,
        message: "The registration deadline for this event has passed.",
      });
    }

    // Check duplicate registration
    const existingRegistration = await Registration.findOne({
      student: req.user.id,
      event: eventId,
    }).select("_id");

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }

    // Check capacity
    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: { $in: ["Registered", "Approved", "Present"] },
    });

    if (
      Number.isFinite(event.maxParticipants) &&
      event.maxParticipants > 0 &&
      registeredCount >= event.maxParticipants
    ) {
      // Alert Admins that event is full
      await createNotification({
        role: "admin",
        title: `Event Full: ${event.title}`,
        message: `Event "${event.title}" has reached its maximum capacity of ${event.maxParticipants} students.`,
        type: "event_full",
        eventId: event._id,
      });

      return res.status(409).json({
        success: false,
        message: "This event has reached its maximum participant limit.",
      });
    }

    // Determine 1-hour window
    const now = new Date();
    const eventStart = getEventStart(event);
    const oneHourBeforeStart = new Date(eventStart.getTime() - 60 * 60 * 1000);
    const twelveHoursAfter = new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);

    const isWithinOneHour =
      !Number.isNaN(eventStart.getTime()) &&
      now >= oneHourBeforeStart &&
      now <= twelveHoursAfter;

    const registrationId = new mongoose.Types.ObjectId();
    const qrPayload = `CULTURAL_EVENT_ATTENDANCE:${registrationId}:${req.user.id}:${eventId}`;

    let qrCodeDataUrl = "";
    let qrAvailable = false;
    let qrGeneratedAt = null;

    if (isWithinOneHour) {
      qrCodeDataUrl = await generateQrDataUrl(qrPayload);
      qrAvailable = true;
      qrGeneratedAt = new Date();
    }

    const registration = await Registration.create({
      _id: registrationId,
      student: req.user.id,
      event: eventId,
      status: "Registered",
      qrPayload,
      qrCode: qrCodeDataUrl,
      qrAvailable,
      qrGeneratedAt,
    });

    await registration.populate("event", EVENT_FIELDS);

    // If QR code is available right away, notify student
    if (qrAvailable) {
      await createNotification({
        recipient: req.user.id,
        role: "student",
        title: `QR Code Ready: ${event.title}`,
        message: `Your entry QR code for "${event.title}" is now available in your dashboard! Show it at the entrance for attendance.`,
        type: "qr_ready",
        eventId: event._id,
      });
    }

    // Notify Admins about new registration
    await createNotification({
      role: "admin",
      title: `New Registration: ${event.title}`,
      message: `${req.user.name} registered for "${event.title}" (${registeredCount + 1}/${event.maxParticipants || "∞"}).`,
      type: "new_registration",
      eventId: event._id,
    });

    // Check if registration now reached max participants
    if (
      Number.isFinite(event.maxParticipants) &&
      registeredCount + 1 >= event.maxParticipants
    ) {
      await createNotification({
        role: "admin",
        title: `Capacity Reached: ${event.title}`,
        message: `Event "${event.title}" has reached its full capacity of ${event.maxParticipants} participants.`,
        type: "event_full",
        eventId: event._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: isWithinOneHour
        ? "Registration successful! Your QR code is now available."
        : "Registration successful! Your QR code will unlock 1 hour before the event start.",
      registration,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }

    console.error("Register event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering for the event.",
    });
  }
};

// GET /api/registrations/my
const getStudentRegistrations = async (req, res) => {
  try {
    // Run 1-hour trigger check
    await checkAndTriggerEventQRCodes(req.user.id);

    const registrations = await Registration.find({ student: req.user.id })
      .populate("event", EVENT_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error("Get student registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching registered events.",
    });
  }
};

// DELETE /api/registrations/cancel
const cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!isValidEventId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const registration = await Registration.findOne({
      student: req.user.id,
      event: eventId,
    }).populate("event", EVENT_FIELDS);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (registration.event) {
      const deadline = registration.event.registrationDeadline
        ? new Date(registration.event.registrationDeadline)
        : null;

      if (deadline && new Date() > deadline) {
        return res.status(409).json({
          success: false,
          message: "You cannot cancel your registration after the registration deadline has passed.",
        });
      }

      if (eventHasStarted(registration.event)) {
        return res.status(409).json({
          success: false,
          message: "You cannot cancel after an event has started.",
        });
      }
    }

    await registration.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling registration.",
    });
  }
};

// GET /api/registrations/admin/all
const getAllRegistrations = async (req, res) => {
  try {
    const { search = "", status, eventId } = req.query;
    const query = {};

    if (status && status !== "All") query.status = status;
    if (eventId && mongoose.isValidObjectId(eventId)) query.event = eventId;

    const registrations = await Registration.find(query)
      .populate("student", "name email phone department rollNumber status avatar")
      .populate("event", EVENT_FIELDS)
      .sort({ createdAt: -1 });

    const normalizedSearch = String(search).trim().toLowerCase();
    const filtered = normalizedSearch
      ? registrations.filter((reg) => {
          const student = reg.student || {};
          const event = reg.event || {};
          return [student.name, student.email, student.department, event.title]
            .filter(Boolean)
            .some((val) => String(val).toLowerCase().includes(normalizedSearch));
        })
      : registrations;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      registrations: filtered,
    });
  } catch (error) {
    console.error("Get all registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching registrations.",
    });
  }
};

// PATCH /api/registrations/:id/status
const updateRegistrationStatus = async (req, res) => {
  const allowedStatuses = [
    "Registered",
    "Approved",
    "Rejected",
    "Present",
    "Absent",
  ];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration status.",
    });
  }

  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("student", "name email phone department")
      .populate("event", EVENT_FIELDS);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (status === "Present") {
      const attendance = await Attendance.findOneAndUpdate(
        { registration: registration._id },
        {
          registration: registration._id,
          event: registration.event?._id || registration.event,
          student: registration.student?._id || registration.student,
          markedBy: req.user.id,
          markedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Registration.findByIdAndUpdate(registration._id, {
        attendanceTime: attendance.markedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Registration status updated to ${status}.`,
      registration,
    });
  } catch (error) {
    console.error("Update registration status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating registration.",
    });
  }
};

module.exports = {
  registerEvent,
  getStudentRegistrations,
  getRegistrations: getStudentRegistrations,
  cancelRegistration,
  getAllRegistrations,
  updateRegistrationStatus,
};
