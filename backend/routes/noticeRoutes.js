const express = require("express");
const { getNotices } = require("../controllers/noticeController");
const { authenticate, requireStudent } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, requireStudent, getNotices);

module.exports = router;
