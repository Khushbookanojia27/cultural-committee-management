const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    division: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    eventExperience: {
      type: String,
      required: true,
      enum: ["Excellent", "Good", "Average", "Needs improvement"],
    },
    eventManagement: {
      type: String,
      required: true,
      enum: ["Excellent", "Good", "Average", "Needs improvement"],
    },
    suggestions: { type: String, trim: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

feedbackSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
