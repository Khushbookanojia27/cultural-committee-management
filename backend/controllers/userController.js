const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createToken } = require("../utils/token");

const DEPARTMENTS = User.DEPARTMENTS || [
  "IT",
  "CS",
  "DS",
  "BMS",
  "BCA",
  "BAF",
  "Micro Biology",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  department: user.department,
  rollNumber: user.rollNumber,
  role: user.role,
  status: user.status || "Active",
  avatar: user.avatar || "",
  culturePoints: user.culturePoints || 0,
  campusRank: user.campusRank || null,
});

const validateStudentDetails = ({ name, phone, department, rollNumber }) => {
  const cleanedName = cleanText(name);
  const cleanedPhone = cleanText(phone).replace(/[\s()-]/g, "");
  const cleanedDepartment = cleanText(department);

  if (cleanedName.length < 2 || cleanedName.length > 100) {
    return { error: "Name must be between 2 and 100 characters." };
  }

  if (cleanedPhone && !PHONE_PATTERN.test(cleanedPhone)) {
    return { error: "Please provide a valid 10-digit phone number." };
  }

  if (cleanedDepartment && !DEPARTMENTS.includes(cleanedDepartment)) {
    return { error: "Please select a valid department." };
  }

  return {
    value: {
      name: cleanedName,
      phone: cleanedPhone,
      department: cleanedDepartment,
      rollNumber: cleanText(rollNumber),
    },
  };
};

const validatePassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 128
  ) {
    return "Password must be between 6 and 128 characters long.";
  }
  return null;
};

// POST /api/auth/register
// Strictly registers students only; admin registration is disallowed.
const register = async (req, res) => {
  try {
    const { name, email, phone, password, department, rollNumber } = req.body;
    const cleanedEmail = cleanText(email).toLowerCase();

    if (!cleanedEmail || !EMAIL_PATTERN.test(cleanedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const details = validateStudentDetails({
      name,
      phone,
      department,
      rollNumber,
    });
    if (details.error) {
      return res.status(400).json({ success: false, message: details.error });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existingUser = await User.findOne({ email: cleanedEmail }).select("_id");
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in instead.",
      });
    }

    // Role is strictly forced to "student"
    const user = await User.create({
      ...details.value,
      email: cleanedEmail,
      password: await bcrypt.hash(password, 12),
      role: "student",
      status: "Active",
      culturePoints: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please log in.",
      user: serializeUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in instead.",
      });
    }

    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again later.",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const cleanedEmail = cleanText(req.body.email).toLowerCase();
    const { password } = req.body;

    if (!cleanedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({ email: cleanedEmail }).select("+password");
    const isPasswordValid =
      user && (await bcrypt.compare(password, user.password));

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check account status
    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account is currently blocked. Please contact the administrator.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: createToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching profile.",
    });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { name, phone, department, rollNumber, avatar } = req.body;

    if (name && cleanText(name)) {
      user.name = cleanText(name);
    }

    if (phone !== undefined) {
      const cleanedPhone = cleanText(phone).replace(/[\s()-]/g, "");
      if (cleanedPhone && !PHONE_PATTERN.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number.",
        });
      }
      user.phone = cleanedPhone;
    }

    if (department !== undefined && user.role === "student") {
      if (department && !DEPARTMENTS.includes(department)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid department.",
        });
      }
      user.department = department;
    }

    if (rollNumber !== undefined) {
      user.rollNumber = cleanText(rollNumber);
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating profile.",
    });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing password.",
    });
  }
};

// GET /api/users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
};

// PATCH /api/users/:id/status (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Toggle between Active and Blocked
    user.status = user.status === "Blocked" ? "Active" : "Blocked";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}.`,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing user status.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
};