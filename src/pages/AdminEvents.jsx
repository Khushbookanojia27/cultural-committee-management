import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, getAuthHeaders, API_BASE_URL } from "../auth";

function AdminEvents() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Dance",
    date: "",
    time: "",
    endTime: "",
    venue: "",
    registrationDeadline: "",
    maxParticipants: 100,
    eventType: "Solo",
    poster: "",
    status: "Upcoming",
    registrationOpen: false,
  });

  /* =========================
     AUTH CHECK + LOAD EVENTS
  ========================= */

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/events/admin/all`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load events.");
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error("Admin Events Error:", err);
      setError(err.message || "Unable to load events.");
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

    Promise.resolve().then(fetchEvents);
  }, [currentUserId, currentUserRole, navigate]);

  /* =========================
     START / STOP REGISTRATION
  ========================= */

  const toggleRegistration = async (eventId, currentOpen) => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setActionLoading(eventId);
      setError("");

      const endpoint = currentOpen
        ? `${API_BASE_URL}/events/${eventId}/stop-registration`
        : `${API_BASE_URL}/events/${eventId}/start-registration`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Action failed.");
      }

      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? { ...ev, registrationOpen: !currentOpen }
            : ev
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update registration status.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     ADD EVENT
  ========================= */

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setActionLoading("create");
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create event.");
      }

      setAddModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     EDIT EVENT
  ========================= */

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "Dance",
      date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
      time: event.time || "",
      endTime: event.endTime || "",
      venue: event.venue || "",
      registrationDeadline: event.registrationDeadline
        ? new Date(event.registrationDeadline).toISOString().split("T")[0]
        : "",
      maxParticipants: event.maxParticipants || 100,
      eventType: event.eventType || "Solo",
      poster: event.poster || "",
      status: event.status || "Upcoming",
      registrationOpen: Boolean(event.registrationOpen),
    });
    setEditModalOpen(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      setActionLoading("update");
      const res = await fetch(`${API_BASE_URL}/events/${selectedEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update event.");
      }

      setEditModalOpen(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================
     DELETE EVENT
  ========================= */

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete the event "${title}"?`)) {
      return;
    }

    try {
      setActionLoading(eventId);
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete event.");
      }

      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Dance",
      date: "",
      time: "",
      endTime: "",
      venue: "",
      registrationDeadline: "",
      maxParticipants: 100,
      eventType: "Solo",
      poster: "",
      status: "Upcoming",
      registrationOpen: false,
    });
  };

  const formatDate = (date) => {
    if (!date) return "Date not available";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#12192F] font-semibold">Loading Events...</p>
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
              Manage Events
            </h1>
            <p className="text-gray-500 mt-2">
              Create, edit, manage registration, and monitor participants.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setAddModalOpen(true);
              }}
              className="bg-[#F5B800] text-[#12192F] px-5 py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
            >
              + Add New Event
            </button>

            <button
              onClick={() => navigate("/admin-dashboard")}
              className="bg-[#12192F] text-white px-5 py-3 rounded-xl hover:bg-[#1b2444] transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* EVENTS LIST */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-[#12192F]">
              No Events Found
            </h2>
            <p className="text-gray-500 mt-2">
              Click "+ Add New Event" to create your first cultural event.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const isLoading = actionLoading === event._id;

              return (
                <div
                  key={event._id}
                  className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* CARD HEADER */}
                    {event.poster ? (
                      <div className="h-44 w-full overflow-hidden relative">
                        <img
                          src={event.poster}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-[#12192F]/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold">
                          {event.category}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#12192F] p-6 text-white">
                        <div className="flex justify-between items-start gap-3">
                          <h2 className="text-xl font-bold">{event.title}</h2>
                          <span className="text-2xl">🎭</span>
                        </div>
                        <p className="text-gray-300 text-sm mt-2">
                          {event.category}
                        </p>
                      </div>
                    )}

                    {/* CARD BODY */}
                    <div className="p-6">
                      {event.poster && (
                        <h2 className="text-xl font-bold text-[#12192F] mb-3">
                          {event.title}
                        </h2>
                      )}

                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold">📅 Date:</span>{" "}
                          {formatDate(event.date)}
                        </p>

                        <p>
                          <span className="font-semibold">🕐 Time:</span>{" "}
                          {event.time || "Not specified"} - {event.endTime || "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold">📍 Venue:</span>{" "}
                          {event.venue || "Campus Auditorium"}
                        </p>

                        <p>
                          <span className="font-semibold">👥 Capacity:</span>{" "}
                          {event.registeredCount || 0} / {event.maxParticipants || 100} Registered
                        </p>

                        <p>
                          <span className="font-semibold">🏷️ Status:</span>{" "}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              event.status === "Completed"
                                ? "bg-gray-100 text-gray-700"
                                : event.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {event.status || "Upcoming"}
                          </span>
                        </p>
                      </div>

                      {/* STATUS */}
                      <div className="mt-5">
                        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">
                          Registration Status
                        </p>
                        {event.registrationOpen ? (
                          <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                            🟢 OPEN FOR REGISTRATION
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                            🔴 CLOSED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="p-6 pt-0 space-y-2.5">
                    {event.registrationOpen ? (
                      <button
                        onClick={() =>
                          toggleRegistration(event._id, event.registrationOpen)
                        }
                        disabled={isLoading}
                        className="w-full bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition text-sm disabled:opacity-50"
                      >
                        {isLoading ? "Stopping..." : "⛔ Stop Registration"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          toggleRegistration(event._id, event.registrationOpen)
                        }
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition text-sm disabled:opacity-50"
                      >
                        {isLoading ? "Starting..." : "▶ Start Registration"}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        navigate(`/registrations?eventId=${event._id}`)
                      }
                      className="w-full bg-[#F5B800] text-[#12192F] py-2.5 rounded-xl font-semibold hover:bg-yellow-400 transition text-sm"
                    >
                      📝 View Registrations ({event.registeredCount || 0})
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(event)}
                        className="border border-gray-300 hover:bg-gray-100 text-gray-800 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        ✏️ Edit Details
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteEvent(event._id, event.title)
                        }
                        className="border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-xl text-xs font-semibold transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= ADD EVENT MODAL ================= */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#12192F]">
                Add New Event
              </h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    placeholder="e.g. Annual Dance Gala"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  >
                    <option value="Dance">Dance</option>
                    <option value="Music">Music</option>
                    <option value="Drama">Drama</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Art">Art</option>
                    <option value="Literary">Literary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    placeholder="e.g. 10:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    placeholder="e.g. 1:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    placeholder="Auditorium / Campus Grounds"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDeadline: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Event Poster URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.poster}
                    onChange={(e) =>
                      setFormData({ ...formData, poster: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  placeholder="Enter event overview, rules, requirements..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="regOpenCheck"
                  checked={formData.registrationOpen}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationOpen: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#F5B800] rounded focus:ring-0"
                />
                <label
                  htmlFor="regOpenCheck"
                  className="text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  Start registration immediately upon creation
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="flex-1 bg-[#F5B800] text-[#12192F] py-3 rounded-xl font-bold hover:bg-yellow-400 transition"
                >
                  {actionLoading === "create"
                    ? "Creating Event..."
                    : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-6 py-3 border rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT EVENT MODAL ================= */}
      {editModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#12192F]">
                Edit Event: {selectedEvent.title}
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  >
                    <option value="Dance">Dance</option>
                    <option value="Music">Music</option>
                    <option value="Drama">Drama</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Art">Art</option>
                    <option value="Literary">Literary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDeadline: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  value={formData.poster}
                  onChange={(e) =>
                    setFormData({ ...formData, poster: e.target.value })
                  }
                  className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editRegOpenCheck"
                  checked={formData.registrationOpen}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationOpen: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#F5B800] rounded focus:ring-0"
                />
                <label
                  htmlFor="editRegOpenCheck"
                  className="text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  Registration is Open
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={actionLoading === "update"}
                  className="flex-1 bg-[#12192F] text-white py-3 rounded-xl font-bold hover:bg-[#1b2444] transition"
                >
                  {actionLoading === "update"
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-6 py-3 border rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEvents;