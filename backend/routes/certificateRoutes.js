const express = require("express");
const {
  getStudentCertificates,
  getAllCertificates,
  generateCertificate,
  bulkGenerateParticipationCertificates,
  downloadCertificate,
} = require("../controllers/certificateController");
const {
  authenticate,
  requireStudent,
  requireAdminOrCommittee,
  requireStudentOrAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

// Student
router.get("/my", requireStudent, getStudentCertificates);

// Admin
router.get("/admin/all", requireAdminOrCommittee, getAllCertificates);
router.post("/generate", requireAdminOrCommittee, generateCertificate);
router.post("/bulk-participation", requireAdminOrCommittee, bulkGenerateParticipationCertificates);

// Download (Student or Admin)
router.get("/:id/download", requireStudentOrAdmin, downloadCertificate);

module.exports = router;
