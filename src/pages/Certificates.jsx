import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CertificateTemplate from "../components/CertificateTemplate";
import { certificateTypes } from "../data/certificateTypes";
import { API_BASE_URL, getAuthHeaders, getCurrentUser } from "../auth";

const achievementToType = {
  Participation: "participation",
  "1st Position": "first",
  "2nd Position": "second",
  "3rd Position": "third",
};

const typeToAchievement = Object.fromEntries(
  Object.entries(achievementToType).map(([achievement, type]) => [type, achievement])
);

const initialForm = {
  eventId: "",
  studentId: "",
  certificateType: "participation",
  achievement: "Participation",
  certificateTitle: "",
  issuedBy: "Cultural Committee",
  authorizedName: "Committee Coordinator",
};

const getEventName = (certificate) =>
  certificate?.event?.title || certificate?.eventName || "Cultural Event";

const getCertificateType = (certificate) =>
  certificate?.certificateType ||
  achievementToType[certificate?.achievement] ||
  "participation";

function Certificates() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isIssuer = ["admin", "committee"].includes(currentUser?.role);
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const previewData = useMemo(() => {
    if (selectedCertificate) {
      return {
        certificateType: getCertificateType(selectedCertificate),
        studentName: selectedCertificate.student?.name || selectedCertificate.studentName,
        eventName: getEventName(selectedCertificate),
        achievement: certificateTypes[getCertificateType(selectedCertificate)].achievement,
        eventDate: selectedCertificate.event?.date || selectedCertificate.eventDate,
        certificateDate: selectedCertificate.awardedDate || selectedCertificate.certificateDate,
        participantCode: selectedCertificate.participantCode || `CUL-2026-${selectedCertificate.certificateNumber || "XXXXX"}`,
        collegeName: selectedCertificate.collegeName || "College Cultural Committee",
        committeeName: selectedCertificate.issuedBy || "Cultural Committee",
        authorizedName: selectedCertificate.authorizedName || "Committee Coordinator",
        signature: selectedCertificate.signature || "Authorized Signature",
      };
    }

    const event = events.find((item) => item._id === form.eventId);
    const student = students.find((item) => item._id === form.studentId);
    return {
      certificateType: form.certificateType,
      studentName: student?.name || "Student Name",
      eventName: event?.title || "Cultural Event",
      achievement: form.achievement,
      eventDate: event?.date,
      certificateDate: new Date(),
      participantCode: "CUL-2026-XXXXX",
      collegeName: "College Cultural Committee",
      committeeName: form.issuedBy,
      authorizedName: form.authorizedName,
      signature: "Authorized Signature",
    };
  }, [events, form, selectedCertificate, students]);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (isIssuer) {
        const [certRes, eventRes, userRes] = await Promise.all([
          fetch(`${API_BASE_URL}/certificates/admin/all`, { headers }),
          fetch(`${API_BASE_URL}/events/admin/all`, { headers }),
          fetch(`${API_BASE_URL}/users`, { headers }),
        ]);
        const [certData, eventData, userData] = await Promise.all([
          certRes.json(),
          eventRes.json(),
          userRes.json(),
        ]);
        if (!certRes.ok) throw new Error(certData.message || "Unable to load certificates.");
        setCertificates(certData.certificates || []);
        setEvents(eventData.events || []);
        setStudents((userData.users || []).filter((user) => user.role === "student"));
      } else {
        const response = await fetch(`${API_BASE_URL}/certificates/my`, { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load certificates.");
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Unable to load certificates." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.resolve().then(loadData);
  }, [currentUser?.id, currentUser?.role, navigate]);

  const updateForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSelectedCertificate(null);
  };

  const handleTypeChange = (value) => {
    setForm((previous) => ({
      ...previous,
      certificateType: value,
      achievement: typeToAchievement[value],
    }));
    setSelectedCertificate(null);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!form.eventId || !form.studentId) {
      setMessage({ type: "error", text: "Select both an event and a student." });
      return;
    }
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to generate certificate.");
      setMessage({ type: "success", text: data.message || "Certificate issued successfully." });
      await loadData();
      setSelectedCertificate(data.certificate);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!form.eventId || !window.confirm("Generate participation certificates for present students?")) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/certificates/bulk-participation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ eventId: form.eventId, issuedBy: form.issuedBy }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bulk generation failed.");
      setMessage({ type: "success", text: data.message });
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/${certificate._id}/download`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Unable to download certificate.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Certificate_${certificate.certificateNumber || certificate._id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#10162E] text-white">Loading Certificates...</div>;
  }

  return (
    <>
      <div className="print:hidden"><Navbar /></div>
      <main className="min-h-screen bg-[#10162E] px-4 py-10 sm:px-6 lg:py-16 print:bg-white print:p-0">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10 text-center print:hidden">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#F5B800]">Cultural Committee</p>
            <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">{isIssuer ? "Certificate Management" : "My Certificates"}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-300">Preview, issue, print, and download professional certificates for college cultural events.</p>
          </header>

          {message.text && <div className={`mx-auto mb-8 max-w-3xl rounded-xl border p-4 text-center print:hidden ${message.type === "success" ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>{message.text}</div>}

          {isIssuer && (
            <section className="mb-10 rounded-2xl border border-[#F5B800]/60 bg-[#08162E] p-5 shadow-xl sm:p-7 print:hidden">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-2xl font-bold text-white">Generate Certificate</h2><p className="mt-1 text-sm text-gray-400">Select a participant and preview the certificate instantly.</p></div>
                <button type="button" onClick={handleBulkGenerate} disabled={actionLoading || !form.eventId} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Bulk participation</button>
              </div>
              <form onSubmit={handleGenerate} className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-[#F5B800]">Event<select value={form.eventId} onChange={(event) => updateForm("eventId", event.target.value)} required className="mt-1 w-full rounded-lg bg-white p-3 text-gray-900"><option value="">Choose event</option>{events.map((event) => <option key={event._id} value={event._id}>{event.title} ({new Date(event.date).toLocaleDateString()})</option>)}</select></label>
                <label className="text-sm font-semibold text-[#F5B800]">Student<select value={form.studentId} onChange={(event) => updateForm("studentId", event.target.value)} required className="mt-1 w-full rounded-lg bg-white p-3 text-gray-900"><option value="">Choose student</option>{students.map((student) => <option key={student._id} value={student._id}>{student.name} ({student.email})</option>)}</select></label>
                <label className="text-sm font-semibold text-[#F5B800]">Certificate type<select value={form.certificateType} onChange={(event) => handleTypeChange(event.target.value)} className="mt-1 w-full rounded-lg bg-white p-3 text-gray-900">{Object.entries(certificateTypes).map(([key, type]) => <option key={key} value={key}>{type.achievement}</option>)}</select></label>
                <label className="text-sm font-semibold text-[#F5B800]">Committee name<input value={form.issuedBy} onChange={(event) => updateForm("issuedBy", event.target.value)} className="mt-1 w-full rounded-lg bg-white p-3 text-gray-900" /></label>
                <label className="text-sm font-semibold text-[#F5B800] md:col-span-2">Authorized person<input value={form.authorizedName} onChange={(event) => updateForm("authorizedName", event.target.value)} className="mt-1 w-full rounded-lg bg-white p-3 text-gray-900" /></label>
                <button type="submit" disabled={actionLoading} className="rounded-lg bg-[#F5B800] px-5 py-3 font-bold text-[#08162E] disabled:opacity-60 md:col-span-2">{actionLoading ? "Generating..." : "Generate and issue certificate"}</button>
              </form>
            </section>
          )}

          <section className="certificate-print-root mb-12">
            <CertificateTemplate {...previewData} />
          </section>

          <div className="mb-12 flex flex-wrap justify-center gap-3 print:hidden">
            <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#F5B800] px-5 py-3 font-bold text-[#10162E]">Print Certificate</button>
            {selectedCertificate && <button type="button" onClick={() => handleDownload(selectedCertificate)} className="rounded-lg border border-[#F5B800] px-5 py-3 font-bold text-[#F5B800]">Download Certificate</button>}
          </div>

          <section className="print:hidden">
            <h2 className="mb-5 text-2xl font-bold text-white">{isIssuer ? `Issued certificates (${certificates.length})` : `Your certificates (${certificates.length})`}</h2>
            {certificates.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#08162E] p-10 text-center text-gray-300">No certificates available yet.</div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{certificates.map((certificate) => <article key={certificate._id} className="flex flex-col justify-between rounded-2xl border border-[#F5B800]/60 bg-[#08162E] p-5"><div><p className="text-xs font-bold uppercase tracking-widest text-[#F5B800]">{certificate.achievement}</p><h3 className="mt-2 text-xl font-bold text-white">{getEventName(certificate)}</h3>{isIssuer && <p className="mt-2 text-sm text-amber-200">{certificate.student?.name || "Student"}</p>}<p className="mt-3 text-sm text-gray-400">Certificate {certificate.certificateNumber}</p></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setSelectedCertificate(certificate)} className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#10162E]">Preview</button><button type="button" onClick={() => handleDownload(certificate)} className="flex-1 rounded-lg bg-[#F5B800] px-3 py-2 text-sm font-bold text-[#10162E]">Download</button></div></article>)}</div>}
          </section>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </>
  );
}

export default Certificates;
