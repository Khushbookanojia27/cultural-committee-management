const Notice = require("../models/Notice");

// GET /api/notices
// Only active, unexpired notices are visible, newest first.
const getNotices = async (req, res) => {
  try {
    const now = new Date();
    const notices = await Notice.find({
      isActive: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    })
      .select("title description content category priority publishedDate expiryDate createdAt")
      .sort({ publishedDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error("Get notices error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notices.",
    });
  }
};

module.exports = { getNotices };
