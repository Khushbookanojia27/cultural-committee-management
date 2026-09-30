const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Dance",
        "Music",
        "Drama",
        "Fashion",
        "Art",
        "Fine Art",
        "Literary",
        "Other",
      ],
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    venue: {
      type: String,
      required: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
    },

    maxParticipants: {
      type: Number,
      default: 100,
    },

    eventType: {
      type: String,
      enum: ["Solo", "Team"],
      default: "Solo",
    },

    // Admin controls whether student registration is open or closed
    registrationOpen: {
      type: Boolean,
      default: false,
    },

    poster: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);