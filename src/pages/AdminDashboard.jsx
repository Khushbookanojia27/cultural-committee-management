import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logoutUser,
  getAuthHeaders,
  toggleUserStatus,
  changeUserPassword,
  updateUserProfile,
  updateCurrentUser,
  API_BASE_URL,
} from "../auth";

function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  /* =========================
      STATES
  ========================= */

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Profile / Password Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editPhone, setEditPhone] = useState(currentUser?.phone || "");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [modalMsg, setModalMsg] = useState({ type: "", text: "" });

  const loadDashboard = async () => {
    try {
      const headers = getAuthHeaders();

      const [usersRes, eventsRes, registrationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, { headers }),
        fetch(`${API_BASE_URL}/events/admin/all`, { headers }),
        fetch(`${API_BASE_URL}/registrations/admin/all`, { headers }),
      ]);

      if (!usersRes.ok || !eventsRes.ok || !registrationsRes.ok) {
        const failedResponse = [usersRes, eventsRes, registrationsRes].find((response) => !response.ok);
        const failedData = await failedResponse.json().catch(() => ({}));
        throw new Error(failedData.message || "Unable to load admin dashboard data.");
      }

      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();
      const registrationsData = await registrationsRes.json();

      setUsers(usersData.users || []);
      setEvents(eventsData.events || []);
      setRegistrations(registrationsData.registrations || []);
    } catch (err) {
      console.error("Dashboard Load Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      AUTH CHECK
  ========================= */

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (currentUser.role !== "admin") {
      navigate("/student-dashboard", { replace: true });
      return;
    }

    Promise.resolve().then(loadDashboard);
  }, [currentUser?.id, currentUser?.role, navigate]);

  /* =========================
      LOGOUT
  ========================= */

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  /* =========================
      SEARCH & FILTER
  ========================= */

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.role?.toLowerCase().includes(search.toLowerCase()) ||
      user.department?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "All" ||
      user.role?.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  /* =========================
      STATISTICS
  ========================= */

  const totalStudents = users.filter((user) => user.role === "student").length;
  const totalEvents = events.length;

  const activeEvents = events.filter(
    (e) => e.registrationOpen || e.status === "Upcoming" || e.status === "Ongoing"
  ).length;

  const closedEvents = events.filter(
    (e) => !e.registrationOpen || e.status === "Completed"
  ).length;

  const totalRegistrations = registrations.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysEvents = events.filter((e) => {
    if (!e.date) return false;
    const evDateStr = new Date(e.date).toISOString().split("T")[0];
    return evDateStr === todayStr;
  }).length;

  /* =========================
      BLOCK / ACTIVATE USER
  ========================= */

  const handleToggleStatus = async (id) => {
    try {
      const data = await toggleUserStatus(id);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === id
            ? { ...user, status: data.user?.status || (user.status === "Blocked" ? "Active" : "Blocked") }
            : user
        )
      );
    } catch (error) {
      alert(error.message || "Failed to update user status");
    }
  };

  /* =========================
      UPDATE PROFILE
  ========================= */

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setModalMsg({ type: "", text: "" });

    try {
      const res = await updateUserProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      updateCurrentUser(res.user);
      setCurrentUser(res.user);
      setModalMsg({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setProfileModalOpen(false), 1200);
    } catch (err) {
      setModalMsg({ type: "error", text: err.message || "Update failed." });
    }
  };

  /* =========================
      CHANGE PASSWORD
  ========================= */

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setModalMsg({ type: "", text: "" });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setModalMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      await changeUserPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setModalMsg({ type: "success", text: "Password changed successfully!" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordModalOpen(false), 1200);
    } catch (err) {
      setModalMsg({ type: "error", text: err.message || "Failed to change password." });
    }
  };

  /* =========================
      RECENT ACTIVITIES
  ========================= */

  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 3);

  /* =========================
      LOADING SCREEN
  ========================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 font-semibold text-[#12192F]">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* ================= HEADER ================= */}
      <header className="bg-[#12192F] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center flex-wrap gap-4">
          <div>
            <Link to="/" className="text-3xl font-bold text-[#F5B800]">
              Cultural Committee
            </Link>
            <p className="text-gray-300 mt-1">Administrator Dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditName(currentUser?.name || "");
                setEditPhone(currentUser?.phone || "");
                setModalMsg({ type: "", text: "" });
                setProfileModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition"
            >
              👤 {currentUser?.name} (Edit)
            </button>

            <button
              onClick={() => {
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setModalMsg({ type: "", text: "" });
                setPasswordModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition"
            >
              🔑 Password
            </button>

            <button
              onClick={handleLogout}
              className="bg-[#F5B800] text-black px-5 py-2 rounded-xl font-semibold hover:bg-yellow-400 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#12192F]">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-gray-500 mt-2">
            Manage students, events, registrations, certificates and attendance.
          </p>
        </div>

        {/* ================= DYNAMIC STATS (6 CARDS) ================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <Stat label="Total Students" value={totalStudents} icon="🎓" color="blue" />
          <Stat label="Total Events" value={totalEvents} icon="🎭" color="orange" />
          <Stat label="Active Events" value={activeEvents} icon="🟢" color="green" />
          <Stat label="Closed Events" value={closedEvents} icon="🔴" color="red" />
          <Stat label="Registrations" value={totalRegistrations} icon="📝" color="purple" />
          <Stat label="Today's Events" value={todaysEvents} icon="📅" color="blue" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ================= USER TABLE ================= */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow border border-gray-200">
            <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#12192F]">
                  User Management
                </h2>
                <p className="text-gray-500">
                  {filteredUsers.length} Registered User{filteredUsers.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                >
                  <option value="All">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>

                <input
                  type="text"
                  placeholder="Search user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] grow"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-sm">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Department</th>
                    <th className="px-6 py-4 text-left">Role</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.department || "—"}
                      </td>
                      <td className="px-6 py-4 capitalize font-semibold">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === "Blocked"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.status || "Active"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {user.role !== "admin" ? (
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`font-semibold hover:underline text-xs ${
                              user.status === "Blocked"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {user.status === "Blocked" ? "Activate" : "Block"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= RIGHT SIDEBAR ================= */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-[#12192F] mb-5">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <Link
                  to="/admin/events"
                  className="block bg-[#12192F] text-white px-4 py-3 rounded-xl hover:bg-[#1b2444] transition"
                >
                  🎭 Manage Events & Add Event
                </Link>

                <Link
                  to="/registrations"
                  className="block bg-[#F5B800] text-black px-4 py-3 rounded-xl hover:bg-yellow-400 font-semibold transition"
                >
                  📝 View Registrations & Scan QR
                </Link>

                <Link
                  to="/certificates"
                  className="block bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition"
                >
                  🏆 Generate & Manage Certificates
                </Link>

                <Link
                  to="/reports"
                  className="block bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition"
                >
                  📊 View Reports & Analytics
                </Link>
              </div>
            </div>

            {/* Recent Activities from MongoDB */}
            <div className="bg-[#12192F] text-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activities</h2>

              <div className="space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
                  New Registrations
                </p>
                {recentRegistrations.length ? (
                  recentRegistrations.map((reg) => (
                    <div
                      key={reg._id}
                      className="border-b border-white/10 pb-2 last:border-0"
                    >
                      <p className="font-medium text-white">
                        {reg.student?.name || "A student"} registered for{" "}
                        {reg.event?.title || "an event"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs">No registrations yet.</p>
                )}

                <p className="text-xs font-semibold uppercase tracking-wider text-[#F5B800] pt-2">
                  Recently Added Events
                </p>
                {recentEvents.length ? (
                  recentEvents.map((ev) => (
                    <div
                      key={ev._id}
                      className="border-b border-white/10 pb-2 last:border-0"
                    >
                      <p className="font-medium text-white">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.date).toLocaleDateString()} • {ev.venue}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs">No events added yet.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#12192F] mb-4">
              Edit Admin Profile
            </h3>

            {modalMsg.text && (
              <div
                className={`p-3 rounded-lg mb-4 text-sm ${
                  modalMsg.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#F5B800] text-[#12192F] py-2.5 rounded-lg font-bold hover:bg-yellow-400 transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#12192F] mb-4">
              Change Password
            </h3>

            {modalMsg.text && (
              <div
                className={`p-3 rounded-lg mb-4 text-sm ${
                  modalMsg.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#12192F] text-white py-2.5 rounded-lg font-bold hover:bg-[#1b2444] transition"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-100"
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

/* =========================
    STAT CARD COMPONENT
========================= */

function Stat({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 ${colors[color]}`}
      >
        {icon}
      </div>

      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
        {label}
      </p>

      <h2 className="text-2xl font-bold text-[#12192F] mt-1">{value}</h2>
    </div>
  );
}

export default AdminDashboard;
