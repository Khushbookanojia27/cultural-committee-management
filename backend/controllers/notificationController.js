const QRCode = require("qrcode");
const Notification = require("../models/Notification");
const Registration = require("../models/Registration");
const { getEventStart } = require("../utils/eventHelpers");

// Helper: generate QR code data URL
const generateQrDataUrl = async (payload) => {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#10162E",
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;
  }
};

// Helper: send notification
const createNotification = async ({
  recipient = null,
  role = "student",
  title,
  message,
  type = "general",
  eventId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      role,
      title,
      message,
      type,
      eventId,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

/**
 * 1-Hour QR Code Generation & Notification Trigger:
 * Checks registered events starting within 1 hour.
 * Generates the unique QR code in MongoDB and sends a notification to the student.
 */
const checkAndTriggerEventQRCodes = async (userId = null) => {
  try {
    const now = new Date();
    // One hour from now
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    // Up to 12 hours ago (in case event is ongoing)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const query = {
      qrAvailable: { $ne: true },
    };

    if (userId) {
      query.student = userId;
    }

    const pendingRegistrations = await Registration.find(query)
      .populate("event")
      .populate("student", "name email");

    for (const reg of pendingRegistrations) {
      if (!reg.event) continue;

      const eventStart = getEventStart(reg.event);
      if (Number.isNaN(eventStart.getTime())) continue;

      // Check if event start is within 1 hour from now or already started recently
      if (eventStart <= oneHourFromNow && eventStart >= twelveHoursAgo) {
        const qrPayload = `CULTURAL_EVENT_ATTENDANCE:${reg._id}:${reg.student._id || reg.student}:${reg.event._id}`;
        const qrCodeDataUrl = await generateQrDataUrl(qrPayload);

        reg.qrCode = qrCodeDataUrl;
        reg.qrPayload = qrPayload;
        reg.qrAvailable = true;
        reg.qrGeneratedAt = new Date();
        await reg.save();

        // Send 1-hour alert notification to student
        const existingNotif = await Notification.findOne({
          recipient: reg.student._id || reg.student,
          eventId: reg.event._id,
          type: "qr_ready",
        });

        if (!existingNotif) {
          await createNotification({
            recipient: reg.student._id || reg.student,
            role: "student",
            title: `QR Code Ready: ${reg.event.title}`,
            message: `Your entry QR code for "${reg.event.title}" is now available! Event starts at ${reg.event.time || "scheduled time"}. Show this QR code at the entrance for attendance.`,
            type: "qr_ready",
            eventId: reg.event._id,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking 1-hour QR codes:", error.message);
  }
};

// GET /api/notifications
const getUserNotifications = async (req, res) => {
  try {
    // Run 1-hour check for logged-in user
    await checkAndTriggerEventQRCodes(req.user.id);

    const query = {
      $or: [
        { recipient: req.user.id },
        { role: req.user.role, recipient: null },
        { role: "all", recipient: null },
      ],
    };

    const notifications = await Notification.find(query)
      .populate("eventId", "title date time venue")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter(
      (n) => !n.isRead && (!n.readBy || !n.readBy.some((uid) => String(uid) === String(req.user.id)))
    ).length;

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

// PATCH /api/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notification.recipient && String(notification.recipient) === String(req.user.id)) {
      notification.isRead = true;
    } else {
      if (!notification.readBy) notification.readBy = [];
      if (!notification.readBy.some((uid) => String(uid) === String(req.user.id))) {
        notification.readBy.push(req.user.id);
      }
    }

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating notification.",
    });
  }
};

// PATCH /api/notifications/mark-all-read
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    await Notification.updateMany(
      {
        recipient: null,
        $or: [{ role: req.user.role }, { role: "all" }],
        readBy: { $ne: req.user.id },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({
      success: false,
      message: "Error marking notifications as read.",
    });
  }
};

module.exports = {
  createNotification,
  checkAndTriggerEventQRCodes,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  generateQrDataUrl,
};
