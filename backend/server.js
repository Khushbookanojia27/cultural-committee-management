const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Route Imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const { checkAndTriggerEventQRCodes } = require("./controllers/notificationController");
const { syncFeedbackAvailability } = require("./controllers/feedbackController");

const app = express();

/* ===========================
   Middleware
=========================== */

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ===========================
   API Routes
=========================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);

/* ===========================
   Home Route
=========================== */

app.get("/", (req, res) => {
  res.send("Cultural Committee API is running...");
});

/* ===========================
   MongoDB Connection
=========================== */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Periodic check for 1-hour event QR code generation and notifications
    setInterval(() => {
      checkAndTriggerEventQRCodes().catch((err) =>
        console.error("Interval QR check error:", err.message)
      );
      syncFeedbackAvailability().catch((err) =>
        console.error("Interval feedback check error:", err.message)
      );
    }, 60 * 1000); // Check every minute
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Failed");
    console.log(err.message);
  });

/* ===========================
   Start Server
=========================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});