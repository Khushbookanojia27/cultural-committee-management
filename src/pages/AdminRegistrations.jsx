import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, getAuthHeaders, API_BASE_URL } from "../auth";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function AdminRegistrations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "All";

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || "";
  const currentUserRole = currentUser?.role || "";

  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // QR Attendance Scanner Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInputToken, setQrInputToken] = useState("");
  const [scanResult, setScanResult] = useState({ success: false, message: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [regRes, eventRes] = await Promise.all([
        fetch(`${API_BASE_URL}/registrations/admin/all`, { headers }),
        fetch(`${API_BASE_URL}/events/admin/all`, { headers }),
      ]);

      const regData = await regRes.json();
      const eventData = await eventRes.json();

      setRegistrations(regData.registrations || []);
      setEvents(eventData.events || []);
    } catch (err) {
      console.error("Load registrations error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login", { replace: true });
      return;
    }
    if (currentUserRole !== "admin") {
      navigate("/student-dashboard", { replace: true });
      return;
    }
    Promise.resolve().then(loadData);
  }, [currentUserId, currentUserRole, navigate]);

  /* =========================
     UPDATE STATUS (APPROVE / REJECT)
  ========================= */

  const updateStatus = async (id, status) => {
    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE_URL}/registrations/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      setRegistrations((prev) =>
        prev.map((reg) => (reg._id === id ? { ...reg, status } : reg))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     MARK ATTENDANCE VIA QR
  ========================= */

  const handleVerifyAttendance = async (e) => {
    e.preventDefault();
    if (!qrInputToken.trim()) return;

    try {
      setActionLoading("verify");
      setScanResult({ success: false, message: "" });

      const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          qrPayload: qrInputToken.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanResult({
          success: false,
          message: data.message || "Verification failed.",
        });
        return;
      }

      setScanResult({
        success: true,
        message: data.message || "Attendance marked successfully!",
      });

      setQrInputToken("");
      // Refresh list
      loadData();
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || "Server connection error.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     FILTERED REGISTRATIONS
  ========================= */

  const filteredRegistrations = registrations.filter((reg) => {
    const eventId = reg.event?._id || reg.event;
    const matchesEvent =
      selectedEventId === "All" || String(eventId) === String(selectedEventId);

    const matchesStatus =
      selectedStatus === "All" || reg.status === selectedStatus;

    const studentName = reg.student?.name || "";
    const studentEmail = reg.student?.email || "";
    const studentDept = reg.student?.department || "";
    const eventTitle = reg.event?.title || "";

    const matchesSearch =
      !searchTerm ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentDept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventTitle.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEvent && matchesStatus && matchesSearch;
  });

  /* =========================
     EXPORT TO EXCEL
  ========================= */

  const exportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert("No registrations available to export.");
      return;
    }

    const dataToExport = filteredRegistrations.map((reg, index) => ({
      "Sr No": index + 1,
      "Student Name": reg.student?.name || "N/A",
      "Email": reg.student?.email || "N/A",
      "Phone": reg.student?.phone || "N/A",
      "Department": reg.student?.department || "N/A",
      "Roll No": reg.student?.rollNumber || "N/A",
      "Event Title": reg.event?.title || "N/A",
      "Event Date": reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : "N/A",
      "Event Venue": reg.event?.venue || "N/A",
      "Registration Status": reg.status,
      "Attendance Marked": reg.status === "Present" ? "Yes" : "No",
      "Attendance Time": reg.attendanceTime ? new Date(reg.attendanceTime).toLocaleString() : "N/A",
      "Registered On": new Date(reg.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    const eventName =
      selectedEventId !== "All"
        ? events.find((e) => e._id === selectedEventId)?.title || "event"
        : "all_events";

    XLSX.writeFile(
      workbook,
      `Cultural_Registrations_${eventName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`
    );
  };

  /* =========================
     EXPORT TO PDF
  ========================= */

  const exportToPdf = () => {
    if (filteredRegistrations.length === 0) {
      alert("No registrations available to export.");
      return;
    }

    const doc = new jsPDF("landscape");

    const eventName =
      selectedEventId !== "All"
        ? events.find((e) => e._id === selectedEventId)?.title || "Event"
        : "All Cultural Events";

    // Title
    doc.setFontSize(18);
    doc.setTextColor(18, 25, 47);
    doc.text("College Cultural Committee - Registrations Report", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Event: ${eventName} | Total Records: ${filteredRegistrations.length} | Exported: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableColumn = [
      "#",
      "Student Name",
      "Email",
      "Department",
      "Event",
      "Status",
      "Attendance",
      "Registered Date",
    ];

    const tableRows = filteredRegistrations.map((reg, index) => [
      index + 1,
      reg.student?.name || "—",
      reg.student?.email || "—",
      reg.student?.department || "—",
      reg.event?.title || "—",
      reg.status,
      reg.status === "Present" ? "Present" : "Absent / Pending",
      new Date(reg.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      theme: "grid",
      headStyles: {
        fillColor: [18, 25, 47],
        textColor: [245, 184, 0],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 252],
      },
    });

    doc.save(`Cultural_Registrations_${eventName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#12192F] font-semibold">
            Loading Registrations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-[#F5B800] font-semibold uppercase tracking-wide">
              Administrator
            </p>
            <h1 className="text-4xl font-bold text-[#12192F] mt-1">
              Event Registrations
            </h1>
            <p className="text-gray-500 mt-2">
              Review participants, verify QR attendance, approve/reject, and export data.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setScanResult({ success: false, message: "" });
                setQrInputToken("");
                setQrModalOpen(true);
              }}
              className="bg-[#12192F] text-[#F5B800] px-4 py-2.5 rounded-xl font-bold hover:bg-[#1b2444] transition flex items-center gap-2 text-sm shadow"
            >
              📷 Scan / Verify QR
            </button>

            <button
              onClick={exportToExcel}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 text-sm shadow"
            >
              📊 Export Excel (.xlsx)
            </button>

            <button
              onClick={exportToPdf}
              className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 text-sm shadow"
            >
              📄 Export PDF
            </button>

            <button
              onClick={() => navigate("/admin-dashboard")}
              className="bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* CONTROLS (FILTER & SEARCH) */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-5 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Filter By Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              >
                <option value="All">All Events ({registrations.length})</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Filter By Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              >
                <option value="All">All Statuses</option>
                <option value="Registered">Registered</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Present">Present (Attended)</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Search Participant
              </label>
              <input
                type="text"
                placeholder="Search name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>
        </div>

        {/* REGISTRATIONS TABLE */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#12192F]">
              Registrations List ({filteredRegistrations.length})
            </h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
              Showing {filteredRegistrations.length} of {registrations.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No registrations found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg, index) => (
                    <tr key={reg._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-400 font-mono">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-[#12192F]">
                          {reg.student?.name || "Student"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reg.student?.department || "Dept not specified"}
                          {reg.student?.rollNumber ? ` • ${reg.student.rollNumber}` : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-800">{reg.student?.email}</div>
                        <div className="text-xs text-gray-500">
                          {reg.student?.phone || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {reg.event?.title || "Event"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            reg.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : reg.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : reg.status === "Present"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {reg.status === "Present" ? (
                          <div className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            ✓ Verified
                            {reg.attendanceTime && (
                              <span className="text-[10px] text-gray-400 block font-normal">
                                {new Date(reg.attendanceTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">— Not Marked —</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {reg.status !== "Approved" && reg.status !== "Present" && (
                            <button
                              onClick={() => updateStatus(reg._id, "Approved")}
                              disabled={actionLoading === reg._id}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                            >
                              Approve
                            </button>
                          )}

                          {reg.status !== "Rejected" && (
                            <button
                              onClick={() => updateStatus(reg._id, "Rejected")}
                              disabled={actionLoading === reg._id}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          )}

                          {reg.status !== "Present" && (
                            <button
                              onClick={() => updateStatus(reg._id, "Present")}
                              disabled={actionLoading === reg._id}
                              className="bg-[#12192F] text-[#F5B800] hover:bg-[#1b2444] px-3 py-1 rounded-lg text-xs font-bold transition"
                            >
                              Mark Present
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ================= QR VERIFICATION MODAL ================= */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#12192F]">
                Verify Attendance QR
              </h3>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              Scan with barcode reader or paste student registration QR payload.
            </p>

            {scanResult.message && (
              <div
                className={`p-3 rounded-lg mb-4 text-sm ${
                  scanResult.success
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {scanResult.message}
              </div>
            )}

            <form onSubmit={handleVerifyAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  QR Token / Registration Payload
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste QR payload e.g. CULTURAL_EVENT_ATTENDANCE:..."
                  value={qrInputToken}
                  onChange={(e) => setQrInputToken(e.target.value)}
                  className="w-full border rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading === "verify"}
                  className="flex-1 bg-[#12192F] text-[#F5B800] py-3 rounded-xl font-bold hover:bg-[#1b2444] transition"
                >
                  {actionLoading === "verify" ? "Verifying..." : "✓ Confirm Attendance"}
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-5 py-3 border rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRegistrations;
