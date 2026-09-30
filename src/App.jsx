import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CommitteeDashboard from "./pages/CommitteeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import Certificates from "./pages/Certificates";
import AdminEvents from "./pages/AdminEvents";
import AdminRegistrations from "./pages/AdminRegistrations";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/committee-dashboard" element={<CommitteeDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/certificates" element={<Certificates />} />
      <Route path="/admin/events" element={<AdminEvents />}/>
      <Route path="/registrations" element={<AdminRegistrations />} />
    </Routes>
  );
}

export default App;