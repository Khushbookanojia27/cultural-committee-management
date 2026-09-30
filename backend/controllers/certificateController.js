const Certificate = require("../models/Certificate");
const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

const CERTIFICATE_FIELDS =
  "certificateTitle certificateNumber certificateType achievement awardedDate certificateDate participantCode collegeName authorizedName signature certificateUrl issuedBy event student";

const escapePdfText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

/* ==========================================================
   GENERATE A4 LANDSCAPE VECTOR PDF CERTIFICATE
========================================================== */
const buildCertificatePdf = ({ certificate, student }) => {
  const eventTitle = certificate.event?.title || "Cultural Committee Event";
  const studentName = student?.name || "Participant";
  const achievement = certificate.achievement || "Participation";
  const certificateType = certificate.certificateType ||
    (achievement === "1st Position" ? "first" : achievement === "2nd Position" ? "second" : achievement === "3rd Position" ? "third" : "participation");
  const title = certificateType === "participation" ? "CERTIFICATE OF PARTICIPATION" : "CERTIFICATE OF ACHIEVEMENT";
  const stream = [
    "q",
    "0.06 0.17 0.30 rg",
    "0 0 842 595 re f",
    "0.98 0.97 0.93 rg",
    "22 22 798 551 re f",
    "0.06 0.17 0.30 RG 1 w",
    "30 30 782 535 re S",
    "0.79 0.57 0.13 RG 3 w",
    "40 40 762 515 re S",
    "0.06 0.17 0.30 rg",
    "650 22 170 420 re f",
    "0.79 0.57 0.13 rg",
    "652 22 4 420 re f",
    "814 22 4 420 re f",
    "0.79 0.57 0.13 RG 2 w",
    "55 540 m 85 540 l 85 570 l S",
    "757 540 m 787 540 l 787 570 l S",
    "55 55 m 85 55 l 85 25 l S",
    "757 55 m 787 55 l 787 25 l S",
    "0.06 0.17 0.30 rg",
    "BT /F2 12 Tf 1 0 0 1 82 518 Tm (CULTURAL COMMITTEE) Tj ET",
    "0.79 0.57 0.13 rg",
    `BT /F1 10 Tf 1 0 0 1 82 501 Tm (${escapePdfText(certificate.issuedBy || "Official Recognition")}) Tj ET`,
    "0.06 0.17 0.30 rg",
    `BT /F2 28 Tf 1 0 0 1 82 445 Tm (${escapePdfText(title)}) Tj ET`,
    "0.79 0.57 0.13 rg",
    "82 425 150 4 re f",
    "0.15 0.21 0.28 rg",
    "BT /F1 15 Tf 1 0 0 1 82 378 Tm (This certificate is proudly presented to) Tj ET",
    `BT /F2 30 Tf 1 0 0 1 82 332 Tm (${escapePdfText(studentName)}) Tj ET`,
    "0.15 0.21 0.28 RG 1 w",
    "82 322 m 470 322 l S",
    "0.15 0.21 0.28 rg",
    "BT /F1 15 Tf 1 0 0 1 82 285 Tm (for securing) Tj ET",
    `BT /F2 22 Tf 1 0 0 1 82 250 Tm (${escapePdfText(achievement)}) Tj ET`,
    `BT /F1 15 Tf 1 0 0 1 82 212 Tm (in ${escapePdfText(eventTitle)}) Tj ET`,
    `BT /F1 11 Tf 1 0 0 1 82 183 Tm (held on ${escapePdfText(formatDate(certificate.event?.date))}) Tj ET`,
    `BT /F1 10 Tf 1 0 0 1 82 112 Tm (Participant Code: ${escapePdfText(certificate.participantCode || certificate.certificateNumber)}) Tj ET`,
    `BT /F1 10 Tf 1 0 0 1 300 112 Tm (Certificate Date: ${escapePdfText(formatDate(certificate.certificateDate || certificate.awardedDate))}) Tj ET`,
    "0.06 0.17 0.30 RG 1 w",
    "82 85 m 245 85 l S",
    `BT /F1 10 Tf 1 0 0 1 104 67 Tm (${escapePdfText(certificate.authorizedName || "Authorized Person")}) Tj ET`,
    `BT /F1 9 Tf 1 0 0 1 112 53 Tm (${escapePdfText(certificate.issuedBy || "Cultural Committee")}) Tj ET`,
    "0.98 0.97 0.93 rg",
    "690 112 90 90 re f",
    "0.79 0.57 0.13 RG 5 w",
    "700 122 70 70 re S",
    "0.06 0.17 0.30 rg",
    "BT /F2 20 Tf 1 0 0 1 718 155 Tm (CC) Tj ET",
    "BT /F1 7 Tf 1 0 0 1 716 137 Tm (2026) Tj ET",
    "Q",
  ];
  const streamBody = stream.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(streamBody, "utf8")} >>\nstream\n${streamBody}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const serializeCertificate = (certificate) => {
  const data = certificate.toObject ? certificate.toObject() : certificate;
  return {
    ...data,
    downloadUrl: `/api/certificates/${data._id}/download`,
  };
};

// GET /api/certificates/my
const getStudentCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .select(CERTIFICATE_FIELDS)
      .populate("event", "title date venue category")
      .sort({ awardedDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      certificates: certificates.map((cert) => serializeCertificate(cert, req)),
    });
  } catch (error) {
    console.error("Get student certificates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching certificates.",
    });
  }
};

// GET /api/certificates/admin/all
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate("student", "name email department rollNumber")
      .populate("event", "title date category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates: certificates.map((cert) => serializeCertificate(cert, req)),
    });
  } catch (error) {
    console.error("Get all certificates error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching certificates.",
    });
  }
};

// POST /api/certificates/generate
const generateCertificate = async (req, res) => {
  try {
    const {
      studentId,
      eventId,
      achievement = "Participation",
      certificateType,
      certificateTitle,
      issuedBy,
      participantCode,
      collegeName,
      authorizedName,
      signature,
    } = req.body;

    if (!studentId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "studentId and eventId are required.",
      });
    }

    const [student, event] = await Promise.all([
      User.findById(studentId),
      Event.findById(eventId),
    ]);

    if (!student || student.role !== "student" || !event) {
      return res.status(404).json({
        success: false,
        message: "Student or Event not found.",
      });
    }

    // Check if certificate with this achievement already issued for this student & event
    const existing = await Certificate.findOne({
      student: studentId,
      event: eventId,
      achievement,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `${achievement} certificate has already been issued to ${student.name} for this event.`,
        certificate: existing,
      });
    }

    const count = await Certificate.countDocuments();
    const certificateNumber = `CC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const title =
      certificateTitle ||
      `${achievement === "Participation" ? "Participation" : "Winner"} Certificate - ${event.title}`;

    const certificate = await Certificate.create({
      student: studentId,
      event: eventId,
      certificateTitle: title,
      certificateNumber,
      certificateType:
        certificateType ||
        (achievement === "1st Position"
          ? "first"
          : achievement === "2nd Position"
          ? "second"
          : achievement === "3rd Position"
          ? "third"
          : "participation"),
      achievement,
      participantCode: participantCode || `CUL-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`,
      collegeName: collegeName || "College Cultural Committee",
      authorizedName: authorizedName || "Committee Coordinator",
      signature: signature || "Authorized Signature",
      issuedBy: issuedBy || "Cultural Committee",
      awardedDate: new Date(),
      certificateDate: new Date(),
    });

    await certificate.populate([
      { path: "student", select: "name email department" },
      { path: "event", select: "title date category" },
    ]);

    // Send notification to student
    await createNotification({
      recipient: studentId,
      role: "student",
      title: `Certificate Awarded: ${achievement}!`,
      message: `Congratulations! Your certificate for "${event.title}" (${achievement}) is now available for download.`,
      type: "certificate_issued",
      eventId: event._id,
    });

    return res.status(201).json({
      success: true,
      message: `Certificate issued successfully to ${student.name}!`,
      certificate: serializeCertificate(certificate, req),
    });
  } catch (error) {
    console.error("Generate certificate error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error generating certificate.",
    });
  }
};

// POST /api/certificates/bulk-participation
const bulkGenerateParticipationCertificates = async (req, res) => {
  try {
    const { eventId, issuedBy } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    // Find all registrations marked Present OR in Attendance
    const attendances = await Attendance.find({ event: eventId }).select("student");
    const presentRegistrations = await Registration.find({
      event: eventId,
      status: "Present",
    }).select("student");

    const studentIdSet = new Set([
      ...attendances.map((a) => String(a.student)),
      ...presentRegistrations.map((r) => String(r.student)),
    ]);

    if (studentIdSet.size === 0) {
      return res.status(400).json({
        success: false,
        message: "No students have been marked as Present for this event yet.",
      });
    }

    const studentIds = Array.from(studentIdSet);
    let issuedCount = 0;
    let totalCount = await Certificate.countDocuments();

    for (const studentId of studentIds) {
      const existing = await Certificate.findOne({
        student: studentId,
        event: eventId,
        achievement: "Participation",
      });

      if (!existing) {
        totalCount += 1;
        const certificateNumber = `CC-${new Date().getFullYear()}-${String(totalCount).padStart(5, "0")}`;

        await Certificate.create({
          student: studentId,
          event: eventId,
          certificateTitle: `Certificate of Participation - ${event.title}`,
          certificateNumber,
          certificateType: "participation",
          achievement: "Participation",
          participantCode: `CUL-${new Date().getFullYear()}-${String(totalCount).padStart(5, "0")}`,
          collegeName: "College Cultural Committee",
          authorizedName: "Committee Coordinator",
          signature: "Authorized Signature",
          issuedBy: issuedBy || "Cultural Committee",
          awardedDate: new Date(),
          certificateDate: new Date(),
        });

        // Notify student
        await createNotification({
          recipient: studentId,
          role: "student",
          title: `Participation Certificate Available!`,
          message: `Your Certificate of Participation for "${event.title}" is ready to view and download.`,
          type: "certificate_issued",
          eventId: event._id,
        });

        issuedCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Generated ${issuedCount} new participation certificates for "${event.title}".`,
      issuedCount,
    });
  } catch (error) {
    console.error("Bulk certificate error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error bulk generating certificates.",
    });
  }
};

// GET /api/certificates/:id/download
const downloadCertificate = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    // If student, only their own
    if (req.user.role === "student") {
      query.student = req.user.id;
    }

    const certificate = await Certificate.findOne(query)
      .populate("event", "title date category")
      .populate("student", "name email department");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    const pdf = buildCertificatePdf({
      certificate,
      student: certificate.student || req.user,
    });

    const safeNumber = String(
      certificate.certificateNumber || certificate._id
    ).replace(/[^a-z0-9_-]/gi, "-");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=certificate-${safeNumber}.pdf`,
      "Content-Length": pdf.length,
    });

    return res.status(200).send(pdf);
  } catch (error) {
    console.error("Download certificate error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error downloading certificate.",
    });
  }
};

module.exports = {
  getStudentCertificates,
  getAllCertificates,
  generateCertificate,
  bulkGenerateParticipationCertificates,
  downloadCertificate,
};
