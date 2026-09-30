import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../auth";

const initialEvents = [
  { id: 1, name: "Dance Competition", date: "15 Sept 2026", registrations: 84, status: "Published" },
  { id: 2, name: "Singing Competition", date: "20 Sept 2026", registrations: 62, status: "Published" },
  { id: 3, name: "Drama Competition", date: "28 Sept 2026", registrations: 41, status: "Draft" },
];

function CommitteeDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", date: "" });

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    setEvents([...events, { id: Date.now(), name: newEvent.name, date: newEvent.date, registrations: 0, status: "Draft" }]);
    setNewEvent({ name: "", date: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><Link to="/" className="text-2xl font-bold">Cultural Committee</Link><p className="text-indigo-200 text-sm mt-1">Committee Dashboard</p></div>
          <div className="flex items-center gap-4"><span className="bg-white/15 px-4 py-2 rounded-lg">👤 {user?.name || "Committee Member"}</span><button onClick={handleLogout} className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-semibold">Logout</button></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div><h1 className="text-3xl md:text-4xl font-bold">Committee Overview</h1><p className="text-gray-600 mt-2">Manage cultural events, registrations and student participation.</p></div>
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-indigo-700">+ Create Event</button>
        </div>

        {showForm && (
          <form onSubmit={addEvent} className="bg-white border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Create New Event</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="Event name" className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3 mt-4"><button className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold">Save Event</button><button type="button" onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-lg">Cancel</button></div>
          </form>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <Stat label="Active Events" value={events.length} icon="🎭" />
        <Stat label="Total Registrations" value={events.reduce((sum, e) => sum + e.registrations, 0)} icon="👥" />
        <Stat label="Pending Approvals" value="12" icon="⏳" />
        <Stat label="Feedback Received" value="96" icon="💬" />
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-2xl font-bold">Event Management</h2><p className="text-gray-500 text-sm mt-1">Monitor your events and student registrations.</p></div>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 text-gray-600 text-sm"><tr><th className="px-6 py-4">Event</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Registrations</th><th className="px-6 py-4">Status</th></tr></thead><tbody className="divide-y">
            {events.map((event) => <tr key={event.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-semibold">{event.name}</td><td className="px-6 py-4 text-gray-600">{event.date}</td><td className="px-6 py-4">{event.registrations}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === "Published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{event.status}</span></td></tr>)}
            </tbody></table></div>
        </section>

        <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-xl font-bold mb-4">Committee Tools</h2><div className="space-y-3"><Link to="/reports" className="block bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg font-semibold">📊 View Reports</Link><Link to="/events" className="block bg-purple-50 text-purple-700 px-4 py-3 rounded-lg font-semibold">📅 Manage Events</Link><Link to="/feedback" className="block bg-blue-50 text-blue-700 px-4 py-3 rounded-lg font-semibold">💬 Review Feedback</Link></div></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-xl font-bold mb-4">Recent Activity</h2><Activity text="24 students registered for Singing Competition" time="10 min ago" /><Activity text="Drama Competition was created" time="1 hour ago" /><Activity text="18 feedback responses received" time="Yesterday" /></div>
        </aside>
        </div>
    </main>
    </div>
);
}

function Stat({ label, value, icon }) { return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"><div className="text-2xl mb-3">{icon}</div><p className="text-gray-500 text-sm">{label}</p><p className="text-3xl font-bold mt-1">{value}</p></div>; }
function Activity({ text, time }) { return <div className="border-b last:border-0 py-3"><p className="text-sm font-medium text-gray-800">{text}</p><p className="text-xs text-gray-400 mt-1">{time}</p></div>; }

export default CommitteeDashboard;
