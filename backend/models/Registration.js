const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    status: {
      type: String,
      enum: ["Registered", "Approved", "Rejected", "Present", "Absent"],
      default: "Registered",
    },

    qrCode: {
      type: String,
      default: "",
    },

    qrPayload: {
      type: String,
      default: "",
    },

    qrAvailable: {
      type: Boolean,
      default: false,
    },

    qrGeneratedAt: {
      type: Date,
      default: null,
    },

    attendanceTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registration
registrationSchema.index(
  { student: 1, event: 1 },
  { unique: true }
);

module.exports = mongoose.model("Registration", registrationSchema);