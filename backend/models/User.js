const mongoose = require("mongoose");

const DEPARTMENTS = ["IT", "CS", "DS", "BMS", "BCA", "BAF", "Micro Biology"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Phone number must contain exactly 10 digits"],
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

 department: {
  type: String,
  trim: true,
  default: "",
},

    rollNumber: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["student", "admin", "committee"],
      default: "student",
      immutable: true,
    },

    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },

    avatar: {
      type: String,
      default: "",
    },

    culturePoints: {
      type: Number,
      default: 0,
    },

    campusRank: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.DEPARTMENTS = DEPARTMENTS;
