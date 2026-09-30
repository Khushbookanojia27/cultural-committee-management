import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, getAuthHeaders, API_BASE_URL } from "../auth";
import * as XLSX from "xlsx";

function Reports() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState({ totalResponses: 0, averageRating: 0, eventSummary: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login", { replace: true });
      return;
    }
    if (currentUserRole !== "admin") {
      navigate("/student-dashboard", { replace: true });
      return;
    }

    const loadReportsData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [evRes, regRes, certRes, feedbackRes] = await Promise.all([
          fetch(`${API_BASE_URL}/events/admin/all`, { headers }),
          fetch(`${API_BASE_URL}/registrations/admin/all`, { headers }),
          fetch(`${API_BASE_URL}/certificates/admin/all`, { headers }),
          fetch(`${API_BASE_URL}/feedback/admin/report`, { headers }),
        ]);

        const evData = await evRes.json();
        const regData = await regRes.json();
        const certData = await certRes.json();
        const feedbackData = await feedbackRes.json();

        setEvents(evData.events || []);
        setRegistrations(regData.registrations || []);
        setCertificates(certData.certificates || []);
        setFeedback(feedbackData.feedback || []);
        setFeedbackSummary(feedbackData.summary || { totalResponses: 0, averageRating: 0, eventSummary: [] });
      } catch (err) {
        console.error("Reports error:", err);
      } finally {
        setLoading(false);
      }
    };

    Promise.resolve().then(loadReportsData);
  }, [currentUserId, currentUserRole, navigate]);

  // Overall Statistics
  const totalRegistrations = registrations.length;
  const totalAttended = registrations.filter((r) => r.status === "Present").length;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((totalAttended / totalRegistrations) * 100)
      : 0;

  // Department Breakdown
  const deptMap = {};
  registrations.forEach((reg) => {
    const dept = reg.student?.department || "Unspecified";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  // Event Summary Table
  const eventSummaries = events.map((ev) => {
    const eventRegs = registrations.filter(
      (r) => String(r.event?._id || r.event) === String(ev._id)
    );
    const presentCount = eventRegs.filter((r) => r.status === "Present").length;
    const rate =
      eventRegs.length > 0
        ? Math.round((presentCount / eventRegs.length) * 100)
        : 0;

    return {
      id: ev._id,
      title: ev.title,
      category: ev.category,
      date: ev.date ? new Date(ev.date).toLocaleDateString() : "—",
      capacity: ev.maxParticipants || 100,
      registrations: eventRegs.length,
      present: presentCount,
      rate: `${rate}%`,
    };
  });

  const exportFeedbackExcel = () => {
    const data = feedback.map((item, index) => ({
      "Sr No": index + 1,
      Event: item.event?.title || "—",
      Student: item.name || item.student?.name || "—",
      Email: item.email || item.student?.email || "—",
      Department: item.department || item.student?.department || "—",
      "Event Experience": item.eventExperience,
      "Event Management": item.eventManagement,
      Rating: item.rating,
      Suggestions: item.suggestions || "",
      Submitted: item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback Report");
    XLSX.writeFile(wb, "Cultural_Committee_Feedback_Report.xlsx");
  };

  // Export Summary Report
  const exportSummaryExcel = () => {
    const data = eventSummaries.map((item, index) => ({
      "Sr No": index + 1,
      "Event Title": item.title,
      "Category": item.category,
      "Date": item.date,
      "Max Capacity": item.capacity,
      "Total Registrations": item.registrations,
      "Attended (Present)": item.present,
      "Turnout Rate": item.rate,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Event Summary");
    XLSX.writeFile(wb, "Cultural_Committee_Summary_Report.xlsx");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#12192F] font-semibold">Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-[#F5B800] font-semibold uppercase tracking-wide">
              Administrator
            </p>
            <h1 className="text-4xl font-bold text-[#12192F] mt-1">
              Cultural Reports & Analytics
            </h1>
            <p className="text-gray-500 mt-2">
              Review turnout rates, department engagement, and export institutional summaries.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportSummaryExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition text-sm flex items-center gap-2 shadow"
            >
              📊 Export Report (.xlsx)
            </button>

            <button
              onClick={exportFeedbackExcel}
              className="bg-[#673ab7] hover:bg-[#512da8] text-white px-5 py-3 rounded-xl font-bold transition text-sm flex items-center gap-2 shadow"
            >
              💬 Export Feedback
            </button>

            <button
              onClick={() => navigate("/admin-dashboard")}
              className="bg-[#12192F] text-white px-5 py-3 rounded-xl hover:bg-[#1b2444] transition text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Total Registrations
            </p>
            <h2 className="text-3xl font-bold text-[#12192F] mt-2">
              {totalRegistrations}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Total Present (Attended)
            </p>
            <h2 className="text-3xl font-bold text-emerald-600 mt-2">
              {totalAttended}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Overall Turnout Rate
            </p>
            <h2 className="text-3xl font-bold text-[#F5B800] mt-2">
              {attendanceRate}%
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Certificates Issued
            </p>
            <h2 className="text-3xl font-bold text-indigo-600 mt-2">
              {certificates.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Feedback Responses
            </p>
            <h2 className="text-3xl font-bold text-[#673ab7] mt-2">
              {feedbackSummary.totalResponses}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              Average Feedback Rating
            </p>
            <h2 className="text-3xl font-bold text-amber-500 mt-2">
              {feedbackSummary.averageRating} / 5
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Breakdown Table */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#12192F]">
                Event Performance Breakdown
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                {events.length} Events Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Registrations</th>
                    <th className="px-6 py-4">Attended</th>
                    <th className="px-6 py-4">Turnout</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {eventSummaries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-[#12192F]">
                        {item.title}
                        <span className="block text-xs text-gray-400 font-normal">
                          {item.date}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">{item.category}</td>

                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {item.registrations} / {item.capacity}
                      </td>

                      <td className="px-6 py-4 text-emerald-600 font-semibold">
                        {item.present}
                      </td>

                      <td className="px-6 py-4 font-bold text-[#12192F]">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            parseInt(item.rate) >= 70
                              ? "bg-green-100 text-green-700"
                              : parseInt(item.rate) >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Department Engagement */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-[#12192F] mb-4">
                Department Engagement
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Total registrations by academic department
              </p>

              <div className="space-y-4 text-sm">
                {Object.keys(deptMap).length === 0 ? (
                  <p className="text-gray-400 text-xs">No registrations recorded yet.</p>
                ) : (
                  Object.entries(deptMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([dept, count]) => {
                      const pct = Math.round((count / totalRegistrations) * 100);
                      return (
                        <div key={dept}>
                          <div className="flex justify-between font-semibold mb-1 text-gray-800">
                            <span>{dept}</span>
                            <span>{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#F5B800] h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </aside>
        </div>

        <section className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden mt-8">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-[#12192F]">Event Feedback Report</h2>
              <p className="text-sm text-gray-500 mt-1">Admin-only responses submitted after completed events.</p>
            </div>
            <span className="text-xs text-gray-500 font-medium">{feedback.length} responses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Responses</th>
                  <th className="px-6 py-4">Average Rating</th>
                  <th className="px-6 py-4">Latest Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feedbackSummary.eventSummary.map((item) => {
                  const latest = feedback.find((entry) => String(entry.event?._id) === String(item.event?._id));
                  return (
                    <tr key={item.event?._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-[#12192F]">{item.event?.title || "—"}</td>
                      <td className="px-6 py-4">{item.responses}</td>
                      <td className="px-6 py-4 font-semibold text-amber-600">{item.averageRating} / 5</td>
                      <td className="px-6 py-4 max-w-xl text-gray-600">{latest?.suggestions || "No comment provided."}</td>
                    </tr>
                  );
                })}
                {!feedbackSummary.eventSummary.length && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No feedback has been submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Reports;