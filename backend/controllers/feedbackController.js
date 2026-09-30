const mongoose = require("mongoose");
const Event = require("../models/Event");
const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const Registration = require("../models/Registration");
const { getEventStart, getEventEnd } = require("../utils/eventHelpers");

const FEEDBACK_DELAY_HOURS = 12;
const RATING_OPTIONS = ["Excellent", "Good", "Average", "Needs improvement"];

const isEventEnded = (event, now = new Date()) => {
  if (!event) return false;
  if (event.status === "Completed") return true;

  const eventEnd = event.endTime
    ? getEventEnd(event)
    : new Date(getEventStart(event).getTime() + FEEDBACK_DELAY_HOURS * 60 * 60 * 1000);
  if (Number.isNaN(eventEnd.getTime())) return false;

  return eventEnd.getTime() <= now.getTime();
};

const notifyStudents = async (event, studentIds) => {
  for (const studentId of studentIds) {
    const existingNotification = await Notification.findOne({
      recipient: studentId,
      eventId: event._id,
      type: "feedback_available",
    }).select("_id");

    if (!existingNotification) {
      await Notification.create({
        recipient: studentId,
        role: "student",
        title: `Feedback available: ${event.title}`,
        message: `The feedback form for "${event.title}" is now available in your student dashboard.`,
        type: "feedback_available",
        eventId: event._id,
      });
    }
  }
};

const syncFeedbackAvailability = async () => {
  const events = await Event.find({
    status: { $in: ["Upcoming", "Ongoing", "Completed"] },
  }).select("title date time endTime status");
  const now = new Date();

  for (const event of events) {
    if (!isEventEnded(event, now)) continue;

    if (event.status !== "Completed") {
      event.status = "Completed";
      event.registrationOpen = false;
      await event.save();
    }

    const registrations = await Registration.find({ event: event._id }).select("student");
    await notifyStudents(event, registrations.map((registration) => registration.student));
  }
};

const getAvailableFeedback = async (req, res) => {
  try {
    await syncFeedbackAvailability();

    const registrations = await Registration.find({ student: req.user.id })
      .populate("event", "title date time endTime venue status category")
      .sort({ createdAt: -1 });
    const eventIds = registrations
      .filter((registration) => isEventEnded(registration.event))
      .map((registration) => registration.event._id);
    const submitted = await Feedback.find({
      student: req.user.id,
      event: { $in: eventIds },
    }).select("event");
    const submittedIds = new Set(submitted.map((item) => String(item.event)));

    const events = registrations
      .filter((registration) => registration.event && isEventEnded(registration.event))
      .map((registration) => ({
        ...registration.event.toObject(),
        registrationId: registration._id,
        submitted: submittedIds.has(String(registration.event._id)),
      }));

    return res.json({ success: true, events });
  } catch (error) {
    console.error("Get available feedback error:", error);
    return res.status(500).json({ success: false, message: "Unable to load available feedback forms." });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "A valid event is required." });
    }

    const registration = await Registration.findOne({ student: req.user.id, event: eventId })
      .populate("event", "title date time status");
    if (!registration) {
      return res.status(403).json({ success: false, message: "You can only review events you registered for." });
    }
    if (!isEventEnded(registration.event)) {
      return res.status(409).json({ success: false, message: "Feedback becomes available after the event ends." });
    }

    const requiredFields = [
      "name", "year", "rollNumber", "email", "division", "department",
      "eventExperience", "eventManagement", "rating",
    ];
    const missingField = requiredFields.find((field) => !String(req.body[field] ?? "").trim());
    if (missingField) {
      return res.status(400).json({ success: false, message: "Please complete all required feedback questions." });
    }
    if (!RATING_OPTIONS.includes(req.body.eventExperience) || !RATING_OPTIONS.includes(req.body.eventManagement)) {
      return res.status(400).json({ success: false, message: "Please choose valid feedback options." });
    }
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Please choose a rating from 1 to 5." });
    }

    const feedback = await Feedback.create({
      student: req.user.id,
      event: eventId,
      name: req.body.name,
      year: req.body.year,
      rollNumber: req.body.rollNumber,
      email: req.body.email,
      division: req.body.division,
      department: req.body.department,
      eventExperience: req.body.eventExperience,
      eventManagement: req.body.eventManagement,
      suggestions: req.body.suggestions || "",
      rating,
    });

    return res.status(201).json({ success: true, message: "Feedback submitted successfully.", feedback });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already submitted feedback for this event." });
    }
    console.error("Submit feedback error:", error);
    return res.status(500).json({ success: false, message: "Unable to save feedback." });
  }
};

const getFeedbackReport = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("student", "name email department rollNumber")
      .populate("event", "title date category")
      .sort({ createdAt: -1 });
    const ratings = feedback.map((item) => item.rating);
    const averageRating = ratings.length
      ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(2))
      : 0;

    const byEvent = feedback.reduce((result, item) => {
      const eventId = String(item.event?._id || item.event);
      if (!result[eventId]) {
        result[eventId] = { event: item.event, responses: 0, ratingTotal: 0 };
      }
      result[eventId].responses += 1;
      result[eventId].ratingTotal += item.rating;
      return result;
    }, {});

    const eventSummary = Object.values(byEvent).map((item) => ({
      event: item.event,
      responses: item.responses,
      averageRating: Number((item.ratingTotal / item.responses).toFixed(2)),
    }));

    return res.json({
      success: true,
      summary: { totalResponses: feedback.length, averageRating, eventSummary },
      feedback,
    });
  } catch (error) {
    console.error("Get feedback report error:", error);
    return res.status(500).json({ success: false, message: "Unable to load feedback report." });
  }
};

module.exports = {
  getAvailableFeedback,
  submitFeedback,
  getFeedbackReport,
  syncFeedbackAvailability,
};
