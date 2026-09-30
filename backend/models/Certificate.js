const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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

    certificateTitle: {
      type: String,
      required: true,
    },

    awardedDate: {
      type: Date,
      default: Date.now,
    },

    certificateNumber: {
      type: String,
      unique: true,
      required: true,
    },

    achievement: {
      type: String,
      enum: ["Participation", "1st Position", "2nd Position", "3rd Position", "Best Performance", "Volunteer"],
      default: "Participation",
    },

    certificateType: {
      type: String,
      enum: ["first", "second", "third", "participation"],
      default: "participation",
    },

    participantCode: {
      type: String,
      default: "",
    },

    collegeName: {
      type: String,
      default: "College Cultural Committee",
    },

    authorizedName: {
      type: String,
      default: "Committee Coordinator",
    },

    signature: {
      type: String,
      default: "Authorized Signature",
    },

    certificateDate: {
      type: Date,
      default: Date.now,
    },

    certificateUrl: {
      type: String,
      default: "",
    },

    issuedBy: {
      type: String,
      default: "Cultural Committee",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Certificate", certificateSchema);
