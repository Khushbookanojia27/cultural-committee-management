const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { createNotification } = require("./notificationController");
const { getEventStart, getEventEnd } = require("../utils/eventHelpers");

const validateEventTimes = ({ date, time, endTime, category }) => {
  const start = getEventStart({ date, time });
  const end = getEventEnd({ date, endTime });

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return "The event end time must be after the start time.";
  }

  const durationHours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  if (!["Dance", "Music"].includes(category) && durationHours > 3) {
    return "Events can be a maximum of 3 hours, except Dance and Music events.";
  }

  return "";
};

/* Helper: attach registration counts */
const attachRegistrationCounts = async (events) => {
  if (!events || !events.length) return [];

  const eventIds = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: eventIds } } },
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);

  const countMap = counts.reduce((acc, curr) => {
    acc[String(curr._id)] = curr.count;
    return acc;
  }, {});

  return events.map((ev) => {
    const obj = ev.toObject ? ev.toObject() : ev;
    const registeredCount = countMap[String(obj._id)] || 0;
    const max = Number(obj.maxParticipants) || 100;
    const availableSeats = Math.max(0, max - registeredCount);

    return {
      ...obj,
      registeredCount,
      availableSeats,
    };
  });
};

/* =========================
   CREATE EVENT
========================= */

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      endTime,
      venue,
      registrationDeadline,
      maxParticipants,
      eventType,
      registrationOpen,
      poster,
      status,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !date ||
      !time ||
      !endTime ||
      !venue ||
      !registrationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const timeError = validateEventTimes({ date, time, endTime, category });
    if (timeError) {
      return res.status(400).json({ success: false, message: timeError });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category,
      date,
      time: time.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      registrationDeadline,
      maxParticipants: Number(maxParticipants) || 100,
      eventType: eventType || "Solo",
      registrationOpen: Boolean(registrationOpen),
      poster: poster || "",
      status: status || "Upcoming",
      createdBy: req.user?.id,
    });

    // If created with open registration, notify all students
    if (event.registrationOpen) {
      await createNotification({
        role: "student",
        title: `New Event: ${event.title}`,
        message: `Registrations are open for "${event.title}" (${event.category}) scheduled for ${new Date(event.date).toLocaleDateString()}. Register now!`,
        type: "event_open",
        eventId: event._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error creating event.",
    });
  }
};

/* =========================
   GET ALL EVENTS (ADMIN)
========================= */

const getAllEvents = async (req, res) => {
  try {
    const rawEvents = await Event.find()
      .populate("createdBy", "name email")
      .sort({ date: 1 });

    const events = await attachRegistrationCounts(rawEvents);

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get all events error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching events.",
    });
  }
};

/* =========================
   GET UPCOMING / ALL PUBLIC EVENTS (STUDENT)
========================= */

const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const rawEvents = await Event.find()
      .where("date")
      .gte(now)
      .where("status")
      .nin(["Completed", "Cancelled"])
      .populate("createdBy", "name email")
      .sort({ date: 1 });

    const events = await attachRegistrationCounts(rawEvents);

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching events.",
    });
  }
};

/* =========================
   GET EVENT BY ID
========================= */

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const [enriched] = await attachRegistrationCounts([event]);

    return res.status(200).json({
      success: true,
      event: enriched,
    });
  } catch (error) {
    console.error("Get event by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching event.",
    });
  }
};

/* =========================
   START REGISTRATION (ADMIN)
========================= */

const startRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const now = new Date();

    if (
      event.registrationDeadline &&
      new Date(event.registrationDeadline) < now
    ) {
      return res.status(400).json({
        success: false,
        message: "The registration deadline has already passed.",
      });
    }

    event.registrationOpen = true;
    await event.save();

    // Broadcast notification to all students
    await createNotification({
      role: "student",
      title: `Registration Opened: ${event.title}`,
      message: `Registrations are now open for "${event.title}". Secure your spot before the deadline!`,
      type: "event_open",
      eventId: event._id,
    });

    return res.status(200).json({
      success: true,
      message: "Registration started successfully.",
      event,
    });
  } catch (error) {
    console.error("Start registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error starting registration.",
    });
  }
};

/* =========================
   STOP REGISTRATION (ADMIN)
========================= */

const stopRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    event.registrationOpen = false;
    await event.save();

    // Notify students
    await createNotification({
      role: "student",
      title: `Registration Closed: ${event.title}`,
      message: `Registrations have now closed for "${event.title}".`,
      type: "event_close",
      eventId: event._id,
    });

    return res.status(200).json({
      success: true,
      message: "Registration stopped successfully.",
      event,
    });
  } catch (error) {
    console.error("Stop registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error stopping registration.",
    });
  }
};

/* =========================
   UPDATE EVENT (ADMIN)
========================= */

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      category,
      date,
      time,
      endTime,
      venue,
      registrationDeadline,
      maxParticipants,
      eventType,
      registrationOpen,
      poster,
      status,
    } = req.body;

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const wasOpen = existingEvent.registrationOpen;

    const timeError = validateEventTimes({
      date: date ?? existingEvent.date,
      time: time ?? existingEvent.time,
      endTime: endTime ?? existingEvent.endTime,
      category: category ?? existingEvent.category,
    });
    if (timeError) {
      return res.status(400).json({ success: false, message: timeError });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time.trim();
    if (endTime !== undefined) updateData.endTime = endTime.trim();
    if (venue !== undefined) updateData.venue = venue.trim();
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline;
    if (maxParticipants !== undefined) updateData.maxParticipants = Number(maxParticipants);
    if (eventType !== undefined) updateData.eventType = eventType;
    if (typeof registrationOpen === "boolean") updateData.registrationOpen = registrationOpen;
    if (poster !== undefined) updateData.poster = poster;
    if (status !== undefined) updateData.status = status;

    const event = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Notify registered students about updates
    const registeredStudents = await Registration.find({ event: id }).select("student");
    const studentIds = registeredStudents.map((r) => r.student);

    if (updateData.status === "Cancelled") {
      for (const studentId of studentIds) {
        await createNotification({
          recipient: studentId,
          role: "student",
          title: `Event Cancelled: ${event.title}`,
          message: `Notice: The event "${event.title}" has been cancelled.`,
          type: "event_cancel",
          eventId: event._id,
        });
      }
    } else {
      for (const studentId of studentIds) {
        await createNotification({
          recipient: studentId,
          role: "student",
          title: `Event Updated: ${event.title}`,
          message: `The schedule or details for "${event.title}" were updated. Please review the event page.`,
          type: "event_update",
          eventId: event._id,
        });
      }
    }

    // If registration was just opened via update
    if (!wasOpen && updateData.registrationOpen) {
      await createNotification({
        role: "student",
        title: `Registration Opened: ${event.title}`,
        message: `Registrations are now open for "${event.title}".`,
        type: "event_open",
        eventId: event._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating event.",
    });
  }
};

/* =========================
   DELETE EVENT (ADMIN)
========================= */

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Notify registered students
    const registeredStudents = await Registration.find({ event: id }).select("student");
    for (const reg of registeredStudents) {
      await createNotification({
        recipient: reg.student,
        role: "student",
        title: `Event Cancelled: ${event.title}`,
        message: `The event "${event.title}" has been cancelled and removed.`,
        type: "event_cancel",
      });
    }

    await Registration.deleteMany({ event: id });
    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting event.",
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  startRegistration,
  stopRegistration,
  updateEvent,
  deleteEvent,
  getEventStart,
};