const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

const markAttendance = async (req, res) => {
  try {
    const { registrationId, qrCode, qrPayload } = req.body;
    let registration = null;

    // Search by raw registration ID
    if (registrationId && mongoose.isValidObjectId(registrationId)) {
      registration = await Registration.findById(registrationId);
    }

    // Search by QR payload string
    const tokenToSearch = (qrPayload || qrCode || "").trim();

    if (!registration && tokenToSearch) {
      if (tokenToSearch.startsWith("CULTURAL_EVENT_ATTENDANCE:")) {
        const parts = tokenToSearch.split(":");
        const extractedRegId = parts[1];
        if (extractedRegId && mongoose.isValidObjectId(extractedRegId)) {
          registration = await Registration.findById(extractedRegId);
        }
      }

      if (!registration) {
        registration = await Registration.findOne({
          $or: [
            { qrPayload: tokenToSearch },
            { qrCode: tokenToSearch },
            ...(mongoose.isValidObjectId(tokenToSearch)
              ? [{ _id: tokenToSearch }]
              : []),
          ],
        });
      }
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found for the provided QR code.",
      });
    }

    // Check if attendance already marked
    const existingAttendance = await Attendance.findOne({
      $or: [
        { registration: registration._id },
        { event: registration.event, student: registration.student },
      ],
    }).populate("student", "name email department");

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: `Attendance already marked for ${existingAttendance.student?.name || "this student"}! Duplicate attendance is not allowed.`,
        attendance: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      registration: registration._id,
      event: registration.event,
      student: registration.student,
      markedBy: req.user.id,
      markedAt: new Date(),
    });

    await Registration.findByIdAndUpdate(registration._id, {
      status: "Present",
      attendanceTime: attendance.markedAt,
    });

    // Award +10 Culture points
    await User.findByIdAndUpdate(registration.student, {
      $inc: { culturePoints: 10 },
    });

    await attendance.populate([
      { path: "student", select: "name email department phone rollNumber" },
      { path: "event", select: "title date venue time" },
    ]);

    // Send notification to student
    await createNotification({
      recipient: registration.student,
      role: "student",
      title: `Attendance Confirmed!`,
      message: `Your attendance for "${attendance.event?.title || "the event"}" has been marked. +10 Culture Points added!`,
      type: "general",
      eventId: registration.event,
    });

    return res.status(201).json({
      success: true,
      message: `Attendance marked successfully for ${attendance.student?.name || "student"}!`,
      attendance,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance has already been marked for this student.",
      });
    }

    console.error("Mark attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error marking attendance.",
    });
  }
};

const getEventAttendance = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const attendance = await Attendance.find({ event: req.params.eventId })
      .populate("student", "name email department phone rollNumber")
      .populate("markedBy", "name")
      .sort({ markedAt: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching attendance.",
    });
  }
};

module.exports = {
  markAttendance,
  getEventAttendance,
};