import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCurrentUser, getAuthHeaders } from "../auth";

function Events() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());
  const [registeringEvent, setRegisteringEvent] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ===========================
      NEW EVENT FORM
  =========================== */

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    category: "Dance",
    date: "",
    time: "",
    venue: "",
    registrationDeadline: "",
    maxParticipants: 100,
    eventType: "Solo",
    poster: "",
  });

  /* ===========================
      LOAD EVENTS
  =========================== */

  useEffect(() => {
    fetchEvents();

    if (currentUser && !isAdmin) {
      fetch("http://localhost:5000/api/registrations/my", {
        headers: getAuthHeaders(),
      })
        .then((res) => (res.ok ? res.json() : { registrations: [] }))
        .then((data) => {
          setRegisteredEvents(
            new Set(
              (data.registrations || [])
                .map((registration) => registration.event?._id || registration.event)
                .filter(Boolean)
            )
          );
        })
        .catch(() => {});
    }
  }, [currentUser, isAdmin]);

  async function registerForEvent(eventId) {
    if (!currentUser) {
      alert("Please log in to register for an event.");
      return;
    }

    try {
      setRegisteringEvent(eventId);
      const res = await fetch("http://localhost:5000/api/registrations/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Unable to register for this event.");
        return;
      }

      setRegisteredEvents((previous) => new Set(previous).add(eventId));
      alert(data.message || "Registration successful! Check your student dashboard.");
      fetchEvents();
    } catch {
      alert("Unable to connect to the server.");
    } finally {
      setRegisteringEvent(null);
    }
  }

  async function fetchEvents() {
    try {
      const endpoint = isAdmin
        ? "http://localhost:5000/api/events/admin/all"
        : "http://localhost:5000/api/events";

      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ===========================
      ADD EVENT
  =========================== */

  async function addEvent() {
    try {
      const res = await fetch(
        "http://localhost:5000/api/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(newEvent),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add event");
        return;
      }

      alert("Event Added Successfully");

      setNewEvent({
        title: "",
        description: "",
        category: "Dance",
        date: "",
        time: "",
        venue: "",
        registrationDeadline: "",
        maxParticipants: 100,
        eventType: "Solo",
        poster: "",
      });

      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Error adding event");
    }
  }

  /* ===========================
      START / STOP REGISTRATION
  =========================== */

  async function toggleRegistration(id, status) {
    if (!currentUser || currentUser.role !== "admin") {
      window.location.assign("/login");
      return;
    }

    try {
      const endpoint = status
        ? `http://localhost:5000/api/events/${id}/stop-registration`
        : `http://localhost:5000/api/events/${id}/start-registration`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update registration status");
      }
    } catch (err) {
      console.error(err);
    }
  }

  /* ===========================
      DELETE EVENT (ADMIN)
  =========================== */

  async function deleteEvent(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        alert("Event deleted successfully");
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete event");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Categories list
  const categories = [
    "All",
    "Dance",
    "Music",
    "Drama",
    "Fashion",
    "Art",
    "Literary",
    "Other",
  ];

  // Filtered events
  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "All" ||
      event.category === selectedCategory ||
      (selectedCategory === "Art" && event.category === "Fine Art");

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Open" && event.registrationOpen) ||
      (statusFilter === "Closed" && !event.registrationOpen);

    const matchesSearch =
      !searchTerm ||
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#10162E] text-white text-2xl">
        Loading Events...
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#10162E] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-[#F5B800] uppercase font-semibold tracking-widest">
              Cultural Committee
            </p>

            <h1 className="text-5xl font-bold text-white mt-2">
              Upcoming Events
            </h1>

            <div className="w-20 h-1 bg-[#F5B800] mx-auto rounded-full mt-5"></div>

            <p className="text-gray-300 mt-5">
              Explore all upcoming cultural events.
            </p>
          </div>

          {/* ================= ADMIN PANEL ================= */}
          {isAdmin && (
            <div className="bg-[#08162E] border border-[#F5B800] rounded-2xl p-6 mb-12">
              <h2 className="text-2xl text-white font-bold mb-6">
                Add New Event
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      title: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <select
                  value={newEvent.category}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      category: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                >
                  <option value="Dance">Dance</option>
                  <option value="Music">Music</option>
                  <option value="Drama">Drama</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Art">Art</option>
                  <option value="Literary">Literary</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      date: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <input
                  placeholder="Time (e.g. 10:00 AM)"
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      time: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <input
                  placeholder="Venue"
                  value={newEvent.venue}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      venue: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <input
                  type="date"
                  placeholder="Registration Deadline"
                  value={newEvent.registrationDeadline}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      registrationDeadline: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <input
                  type="number"
                  placeholder="Max Participants (e.g. 100)"
                  value={newEvent.maxParticipants}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      maxParticipants: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <input
                  type="url"
                  placeholder="Event Poster Image URL (Optional)"
                  value={newEvent.poster}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      poster: e.target.value,
                    })
                  }
                  className="p-3 rounded bg-white"
                />

                <textarea
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      description: e.target.value,
                    })
                  }
                  className="md:col-span-2 p-3 rounded bg-white h-32"
                />
              </div>

              <button
                onClick={addEvent}
                className="mt-6 bg-[#F5B800] text-[#08162E] px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition"
              >
                Add Event
              </button>
            </div>
          )}

          {/* ================= SEARCH & FILTERS ================= */}
          <div className="mb-10 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <input
                type="text"
                placeholder="🔍 Search events by name, venue, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:max-w-md p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-[#F5B800]"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    statusFilter === "All"
                      ? "bg-[#F5B800] text-[#10162E]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter("Open")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    statusFilter === "Open"
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Open Only
                </button>
                <button
                  onClick={() => setStatusFilter("Closed")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    statusFilter === "Closed"
                      ? "bg-red-500 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Closed Only
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-[#F5B800] text-[#10162E]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {cat === "Dance" && "💃 "}
                  {cat === "Music" && "🎤 "}
                  {cat === "Drama" && "🎭 "}
                  {cat === "Fashion" && "👗 "}
                  {cat === "Art" && "🎨 "}
                  {cat === "Literary" && "📚 "}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ================= EVENT CARDS ================= */}
          {filteredEvents.length === 0 ? (
            <div className="bg-[#08162E] border border-white/10 rounded-3xl p-12 text-center text-white">
              <p className="text-4xl mb-3">🎭</p>
              <h3 className="text-xl font-bold">No Events Match Your Search</h3>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredEvents.map((event) => {
                const deadlinePassed =
                  event.registrationDeadline &&
                  new Date(event.registrationDeadline) < new Date();
                const seatsAvailable =
                  event.availableSeats !== undefined
                    ? event.availableSeats
                    : Math.max(0, (event.maxParticipants || 100) - (event.registeredCount || 0));
                const isFull = seatsAvailable <= 0;

                return (
                  <div
                    key={event._id}
                    className="bg-[#08162E] rounded-3xl border-2 border-[#F5B800] overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Event Banner */}
                      {event.poster ? (
                        <img
                          src={event.poster}
                          alt={event.title}
                          className="h-52 w-full object-cover"
                        />
                      ) : (
                        <div className="h-52 flex items-center justify-center text-7xl bg-[#10162E]/60">
                          {event.category === "Dance" && "💃"}
                          {event.category === "Music" && "🎤"}
                          {event.category === "Drama" && "🎭"}
                          {event.category === "Fashion" && "👗"}
                          {(event.category === "Art" || event.category === "Fine Art") && "🎨"}
                          {event.category === "Literary" && "📚"}
                          {event.category === "Other" && "🎪"}
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <h2 className="text-white text-2xl font-bold">
                            {event.title}
                          </h2>
                        </div>

                        <p className="text-[#F5B800] mt-3">
                          📅 {new Date(event.date).toLocaleDateString()} {event.time ? `• 🕐 ${event.time}` : ""}
                        </p>

                        <p className="text-gray-300 mt-2">
                          📍 {event.venue}
                        </p>

                        {/* Seat Availability & Deadline */}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="bg-white/10 text-gray-200 px-2.5 py-1 rounded-md">
                            👥 {seatsAvailable} seats left
                          </span>
                          {event.registrationDeadline && (
                            <span className="bg-white/10 text-gray-200 px-2.5 py-1 rounded-md">
                              ⏳ Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-300 mt-4 line-clamp-3">
                          {event.description}
                        </p>

                        {/* Registration Status */}
                        <div className="mt-4">
                          {event.registrationOpen && !deadlinePassed && !isFull ? (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                              Registration Open
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                              {deadlinePassed ? "Deadline Passed" : isFull ? "Seats Full" : "Registration Closed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      {/* ================= ADMIN BUTTONS ================= */}
                      {isAdmin ? (
                        <div className="mt-6 space-y-3">
                          <button
                            onClick={() =>
                              toggleRegistration(
                                event._id,
                                event.registrationOpen
                              )
                            }
                            className={`w-full py-3 rounded-lg font-semibold ${
                              event.registrationOpen
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            {event.registrationOpen
                              ? "Stop Registration"
                              : "Start Registration"}
                          </button>

                          <button
                            onClick={() => deleteEvent(event._id, event.title)}
                            className="w-full py-2.5 rounded-lg font-semibold bg-gray-700 hover:bg-red-800 text-white transition text-sm"
                          >
                            🗑️ Delete Event
                          </button>
                        </div>
                      ) : (
                        /* ================= STUDENT BUTTON ================= */
                        <button
                          disabled={
                            !event.registrationOpen ||
                            deadlinePassed ||
                            isFull ||
                            registeredEvents.has(event._id) ||
                            registeringEvent === event._id
                          }
                          onClick={() => registerForEvent(event._id)}
                          className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                            registeredEvents.has(event._id)
                              ? "bg-green-600 text-white cursor-default"
                              : event.registrationOpen && !deadlinePassed && !isFull
                              ? "bg-[#F5B800] text-[#08162E] hover:bg-yellow-400"
                              : "bg-gray-500 text-white cursor-not-allowed"
                          }`}
                        >
                          {registeredEvents.has(event._id)
                            ? "✓ Already Registered"
                            : registeringEvent === event._id
                            ? "Registering..."
                            : event.registrationOpen && !deadlinePassed && !isFull
                            ? "Register for Event"
                            : deadlinePassed
                            ? "Deadline Passed"
                            : isFull
                            ? "Seats Full"
                            : "Registration Closed"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Events;