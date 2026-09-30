const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Specific student/admin recipient, or null if broadcast to all users of a given role
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Targeted role: "student", "admin", or "all"
    role: {
      type: String,
      enum: ["student", "admin", "all"],
      default: "student",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "event_open",
        "event_close",
        "event_update",
        "event_cancel",
        "certificate_issued",
        "qr_ready",
        "new_registration",
        "event_full",
        "feedback_available",
        "general",
      ],
      default: "general",
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Users who have acknowledged/read this notification (especially for broadcast)
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
