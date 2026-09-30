import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuthHeaders,
  getCurrentUser,
  logoutUser,
  updateCurrentUser,
} from '../auth';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

const eventIcons = ['💃', '🎤', '🎭', '👗', '🎶'];

const getEventStart = (event) => {
  const date = new Date(event?.date);
  if (Number.isNaN(date.getTime())) return date;

  const match = String(event?.time || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) return date;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (hours > 23 || minutes > 59) return date;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not available';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMonthYear = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
};

const mapEventForDashboard = (event, index = 0) => {
  if (!event || typeof event !== 'object') return null;

  const id = String(event._id || event.id || '');
  if (!id) return null;

  return {
    id,
    eventId: id,
    name: event.title || event.name || 'Untitled event',
    date: formatDate(event.date),
    dateObj: getEventStart(event),
    startTime: event.time || '',
    endTime: event.endTime || '',
    location: event.venue || 'Venue not available',
    type: event.category || 'Event',
    image: eventIcons[index % eventIcons.length],
    registrationDeadline: event.registrationDeadline,
  };
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : {};

  if (!response.ok) {
    const error = new Error(data.message || 'Unable to complete this request.');
    error.status = response.status;
    throw error;
  }

  return data;
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [studentUser, setStudentUser] = useState(() => getCurrentUser());
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [notices, setNotices] = useState([]);
  const [feedbackEvents, setFeedbackEvents] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: studentUser?.name || '',
    phone: studentUser?.phone || '',
    department: studentUser?.department || '',
  });

  const studentDataComputed = {
    name: studentUser?.name || 'Not Available',
    email: studentUser?.email || 'Not Available',
    phone: studentUser?.phone || 'Not Available',
    department: studentUser?.department || 'Not Available',
    role: studentUser?.role
      ? studentUser.role.charAt(0).toUpperCase() + studentUser.role.slice(1)
      : 'Student',
  };
  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2600);
  }, []);

  const handleLogout = () => {
    logoutUser();
    showToast('Logged out successfully');
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1000);
  };

  const handleEditProfileOpen = () => {
    setEditFormData({
      name: studentDataComputed.name,
      phone: studentDataComputed.phone,
      department: studentDataComputed.department,
    });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!editFormData.name.trim() || !editFormData.phone.trim() || !editFormData.department.trim()) {
      showToast('Please fill all fields');
      return;
    }

    try {
      const data = await apiRequest('/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim(),
          department: editFormData.department.trim(),
        }),
      });

      updateCurrentUser(data.user);
      setStudentUser(data.user);
      setEditFormData({
        name: data.user.name,
        phone: data.user.phone,
        department: data.user.department,
      });

      setEditModalOpen(false);
      showToast('Profile updated successfully!');
    } catch (error) {
      showToast(error.message || 'Unable to update profile');
    }
  };

  /* Replaced by the authenticated, student-scoped loader below.
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    const loadDashboardData = async () => {
      try {
        // Fetch all events
        const eventsResponse = await fetch('http://localhost:5000/api/events');
        const eventsData = await eventsResponse.json();

        if (eventsResponse.ok && Array.isArray(eventsData.events)) {
          const mappedEvents = eventsData.events.map((event, index) => ({
            id: event._id || String(index),
            eventId: event._id,
            name: event.title || event.name,
            date: new Date(event.date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            dateObj: new Date(event.date),
            location: event.venue || 'Campus Hall',
            type: event.category || 'Popular',
            image: ['💃', '🎤', '🎭', '👗', '🎶'][index % 5],
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${event.title || 'Cultural'}-${currentUser.name}-${event.date}`)}`,
          }));

          setEvents(mappedEvents);

          // Find nearest upcoming event
          const today = new Date();
          const upcomingEvents = mappedEvents.filter(e => e.dateObj >= today);
          if (upcomingEvents.length > 0) {
            upcomingEvents.sort((a, b) => a.dateObj - b.dateObj);
            setFeaturedEvent(upcomingEvents[0]);
          } else if (mappedEvents.length > 0) {
            setFeaturedEvent(mappedEvents[0]);
          }

          // Fetch registrations
          const registrationResponse = await fetch('http://localhost:5000/api/registrations');
          const registrationData = await registrationResponse.json();

          if (registrationResponse.ok && Array.isArray(registrationData.registrations)) {
            const userRegistrations = registrationData.registrations.filter((registration) => {
              const studentId = registration.student?._id || registration.student;
              return studentId === currentUser.id;
            });

            const mappedRegistrations = {};
            userRegistrations.forEach((registration) => {
              const eventId = registration.event?._id || registration.event;
              const matchedEvent = mappedEvents.find((event) => event.eventId === eventId);
              if (matchedEvent) {
                mappedRegistrations[matchedEvent.id] = true;
              }
            });

            setRegistered(mappedRegistrations);
          }
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Unable to load events right now.');
      }
    };

    loadDashboardData();
  }, [currentUser, navigate]);
  */

  useEffect(() => {
    if (!studentUser?.id) {
      navigate('/login', { replace: true });
      return undefined;
    }

    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const profileData = await apiRequest('/users/profile');
        if (!isMounted) return;

        updateCurrentUser(profileData.user);
        setStudentUser(profileData.user);
        setEditFormData({
          name: profileData.user.name || '',
          phone: profileData.user.phone || '',
          department: profileData.user.department || '',
        });

        const results = await Promise.allSettled([
          apiRequest('/events'),
          apiRequest('/registrations/my'),
          apiRequest('/certificates/my'),
          apiRequest('/notices'),
          apiRequest('/feedback/available'),
        ]);

        if (!isMounted) return;

        const [eventsResult, registrationsResult, certificatesResult, noticesResult, feedbackResult] = results;
        if (eventsResult.status === 'fulfilled') {
          const mappedEvents = Array.isArray(eventsResult.value.events)
            ? eventsResult.value.events
                .map((event, index) => mapEventForDashboard(event, index))
                .filter(Boolean)
            : [];
          setEvents(mappedEvents);
        }
        if (registrationsResult.status === 'fulfilled') {
          setRegistrations(Array.isArray(registrationsResult.value.registrations)
            ? registrationsResult.value.registrations
            : []);
        }
        if (certificatesResult.status === 'fulfilled') {
          setCertificates(Array.isArray(certificatesResult.value.certificates)
            ? certificatesResult.value.certificates
            : []);
        }
        if (noticesResult.status === 'fulfilled') {
          setNotices(Array.isArray(noticesResult.value.notices)
            ? noticesResult.value.notices
            : []);
        }
        if (feedbackResult.status === 'fulfilled') {
          setFeedbackEvents(Array.isArray(feedbackResult.value.events)
            ? feedbackResult.value.events.filter((event) => !event.submitted)
            : []);
        }

        if (results.some((result) => result.status === 'rejected')) {
          showToast('Some dashboard details could not be loaded. Please try again.');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.status === 401) {
          logoutUser();
          navigate('/login', { replace: true });
          return;
        }
        showToast(error.message || 'Unable to load your dashboard right now.');
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [navigate, showToast, studentUser?.id]);

  const registeredByEvent = registrations.reduce((index, registration) => {
    const eventId = registration?.event?._id || registration?.event;
    if (eventId) index[String(eventId)] = registration;
    return index;
  }, {});

  const registeredEvents = registrations
    .map((registration, index) => {
      const event = mapEventForDashboard(registration.event, index);
      return event ? { ...event, qrCode: registration.qrCode, registrationId: registration._id } : null;
    })
    .filter(Boolean);

  const featuredEvent = [...events]
    .filter((event) => event.dateObj >= new Date())
    .sort((first, second) => first.dateObj - second.dateObj)[0] || null;

  const recentActivity = [
    ...registrations.map((registration) => ({
      id: `registration-${registration._id}`,
      date: new Date(registration.createdAt || 0),
      text: `You registered for ${registration.event?.title || 'an event'}`,
    })),
    ...certificates.map((certificate) => ({
      id: `certificate-${certificate._id}`,
      date: new Date(certificate.awardedDate || certificate.createdAt || 0),
      text: `Certificate added for ${certificate.event?.title || certificate.certificateTitle}`,
    })),
  ]
    .sort((first, second) => second.date - first.date)
    .slice(0, 2);

  const culturePoints = Number(studentUser?.culturePoints || 0);
  const campusRank = studentUser?.campusRank ? `#${studentUser.campusRank}` : '—';

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegister = async (id) => {
    if (!studentUser) {
      navigate('/login', { replace: true });
      return;
    }

    const selectedEvent = events.find((event) => event.id === id);
    if (!selectedEvent) return;

    if (registeredByEvent[id]) {
      showToast('You are already registered for this event.');
      return;
    }

    try {
      const data = await apiRequest('/registrations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.eventId,
        }),
      });

      setRegistrations((previous) => [data.registration, ...previous]);
      showToast(`Registered for ${selectedEvent.name}!`);
    } catch (error) {
      showToast(error.message || 'Unable to register right now.');
    }
  };

  const handleUnregister = async (id) => {
    if (!studentUser) {
      navigate('/login', { replace: true });
      return;
    }

    const selectedEvent = events.find((event) => event.id === id);
    if (!selectedEvent) return;

    try {
      await apiRequest('/registrations/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.eventId,
        }),
      });

      setRegistrations((previous) => previous.filter((registration) => {
        const eventId = registration?.event?._id || registration?.event;
        return String(eventId) !== String(selectedEvent.eventId);
      }));
      showToast(`Unregistered from ${selectedEvent.name}.`);
    } catch (error) {
      showToast(error.message || 'Unable to unregister right now.');
    }
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/certificates/${certificate._id}/download`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to download certificate.');
      }

      const file = await response.blob();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      const certificateNumber = certificate.certificateNumber || certificate._id;
      link.href = objectUrl;
      link.download = `certificate-${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      showToast('Certificate downloaded successfully!');
    } catch (error) {
      showToast(error.message || 'Unable to download certificate.');
    }
  };

  const handleDownloadQr = (event) => {
    if (!event.qrCode) return;

    const link = document.createElement('a');
    link.href = event.qrCode;
    link.download = `${event.name}-qr-code.png`;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('QR code download started!');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --navy: #080f2b;
            --navy-2: #111d49;
            --yellow: #f7be19;
            --coral: #f05245;
            --paper: #f5f6fb;
            --ink: #111938;
            --muted: #6f7792;
            --line: #e7e9f2;
          }
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          body { margin: 0; font-family: "DM Sans", sans-serif; color: var(--ink); background: var(--paper); }
          button, a { -webkit-tap-highlight-color: transparent; }
          button:focus-visible, a:focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }
          
          .app-shell { width: 100%; min-height: 100vh; display: grid; grid-template-columns: 258px 1fr; }
          .sidebar {
            position: relative;
            overflow: hidden;
            background: var(--navy);
            color: white;
            padding: 24px 20px;
            min-height: 100vh;
          }
          .sidebar:before {
            content: "";
            position: absolute;
            width: 310px;
            height: 310px;
            right: -210px;
            bottom: -140px;
            border-radius: 999px;
            background: var(--yellow);
            opacity: 0.6;
          }
          .sidebar:after {
            content: "";
            position: absolute;
            width: 180px;
            height: 180px;
            right: -90px;
            top: 130px;
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 999px;
          }
          
          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            position: relative;
            z-index: 10;
          }
          .logo-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--yellow);
            color: var(--navy);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }
          .logo-text h3 {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.2;
            margin: 0;
            color: white;
          }
          .logo-text p {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: var(--yellow);
            margin: 0;
          }
          
          .nav {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 32px;
            position: relative;
            z-index: 10;
          }
          .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            cursor: pointer;
            color: rgba(255,255,255,.62);
            transition: .2s ease;
            background: transparent;
            border: none;
            font-size: 14px;
            font-weight: 600;
            text-align: left;
          }
          .nav-item:hover {
            color: white;
            background: rgba(255,255,255,.09);
          }
          .nav-item.active {
            color: white;
            background: rgba(255,255,255,.09);
            box-shadow: inset 3px 0 0 var(--yellow);
          }
          
          .user-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.1);
            position: relative;
            z-index: 10;
            margin-top: auto;
          }
          .user-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--yellow);
            flex-shrink: 0;
          }
          .user-info h4 {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: white;
          }
          .user-info p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: rgba(255,255,255,.6);
          }
          
          .main-content {
            background: radial-gradient(circle at 83% 2%, rgba(247,190,25,.15), transparent 19rem), var(--paper);
            padding: 32px;
            overflow-y: auto;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .header-title {
            color: var(--ink);
            font-weight: 700;
            font-size: 28px;
            margin: 0;
            line-height: 1.2;
          }
          .header-subtitle {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #a76b00;
            margin: 0 0 8px 0;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: white;
            color: var(--ink);
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(11,19,52,.06);
            transition: .2s ease;
            position: relative;
          }
          .icon-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11,19,52,.1);
          }
          .notification-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--coral);
            right: 8px;
            top: 8px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: white;
            border: 1px solid var(--line);
            box-shadow: 0 7px 20px rgba(11,19,52,.04);
            border-radius: 16px;
            padding: 16px;
          }
          .stat-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--muted);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #fff4cf;
            color: #b87800;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--ink);
            margin-top: 12px;
          }
          
          .main-grid {
            display: grid;
            grid-template-columns: 1.35fr 0.65fr;
            gap: 24px;
            margin-bottom: 24px;
          }
          
          .card {
            background: white;
            border: 1px solid var(--line);
            box-shadow: 0 10px 30px rgba(11,19,52,.06);
            border-radius: 16px;
            padding: 20px;
          }
          
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }
          .card-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--ink);
            margin: 0;
          }
          .card-subtitle {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #a76b00;
            margin: 0 0 8px 0;
          }
          .edit-btn {
            background: white;
            border: 1px solid var(--ink);
            color: var(--ink);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            transition: .2s ease;
          }
          .edit-btn:hover {
            background: var(--ink);
            color: white;
          }
          
          .profile-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .profile-item {
            background: #f7f8fc;
            border-radius: 8px;
            padding: 12px;
          }
          .profile-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #81889d;
            margin-bottom: 6px;
          }
          .profile-value {
            font-size: 14px;
            font-weight: 700;
            color: var(--ink);
          }
          
          .events-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .event-row {
            background: white;
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
            transition: .2s ease;
            cursor: pointer;
          }
          .event-row:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(11,19,52,.09);
            border-color: var(--yellow);
          }
          .event-icon {
            font-size: 32px;
            flex-shrink: 0;
          }
          .event-info {
            flex: 1;
            min-width: 0;
          }
          .event-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--ink);
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
          }
          .event-badge {
            background: #fff4cf;
            color: #926100;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
          }
          .event-meta {
            font-size: 12px;
            color: var(--muted);
          }
          .register-btn {
            background: var(--coral);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            transition: .2s ease;
          }
          .register-btn:hover {
            background: #d94136;
          }
          .register-btn:disabled {
            background: #95a5a6;
          }
          .registered-badge {
            background: #def7e6;
            color: #137241;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
          }
          
          .feature-card {
            background: linear-gradient(135deg, #101a42 0%, #192a63 62%, #bb453f 100%);
            color: white;
            position: relative;
            overflow: hidden;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
          }
          .feature-card:after {
            content: "";
            position: absolute;
            width: 180px;
            height: 180px;
            border-radius: 999px;
            background: var(--yellow);
            opacity: 0.95;
            top: -85px;
            right: -75px;
          }
          .feature-content {
            position: relative;
            z-index: 10;
          }
          .feature-title {
            font-size: 18px;
            font-weight: 700;
            margin: 12px 0 0 0;
          }
          .feature-text {
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.85;
            margin: 12px 0;
          }
          .feature-btn {
            background: var(--yellow);
            color: var(--navy);
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            transition: .2s ease;
            margin-top: 12px;
          }
          .feature-btn:hover {
            background: #ffed4e;
          }
          
          .quick-actions {
            display: grid;
            gap: 8px;
          }
          .quick-btn {
            background: #fff6da;
            color: #725000;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: .2s ease;
            text-align: left;
          }
          .quick-btn:first-child {
            background: #fff6da;
            color: #725000;
          }
          .quick-btn:not(:first-child) {
            background: #f5f6fb;
            color: var(--ink);
          }
          .quick-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11,19,52,.08);
          }
          
          .bottom-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 24px;
          }
          
          .notice-item {
            padding-bottom: 12px;
            margin-bottom: 12px;
            border-left: 2px solid var(--yellow);
            padding-left: 12px;
          }
          .notice-item:last-child {
            border: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }
          .notice-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--ink);
            margin: 0;
          }
          .notice-text {
            font-size: 12px;
            color: var(--muted);
            margin: 6px 0 0 0;
            line-height: 1.4;
          }
          
          .cert-item {
            background: #fff6da;
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
          }
          .cert-name {
            font-size: 13px;
            font-weight: 700;
            color: var(--ink);
            margin: 0;
          }
          .cert-detail {
            font-size: 12px;
            color: var(--muted);
            margin: 4px 0;
          }
          .cert-btn {
            background: var(--yellow);
            color: var(--navy);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            margin-top: 8px;
            transition: .2s ease;
          }
          .cert-btn:hover {
            background: #ffed4e;
          }
          
          .activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
          }
          .activity-item {
            display: flex;
            gap: 10px;
            font-size: 12px;
            color: var(--muted);
            line-height: 1.4;
          }
          .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--yellow);
            margin-top: 4px;
            flex-shrink: 0;
          }
          .activity-text strong {
            color: var(--ink);
            font-weight: 600;
          }
          
          .registered-tickets {
            margin-top: 24px;
          }
          .ticket-item {
            background: white;
            border: 2px solid var(--line);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: center;
          }
          .ticket-info h4 {
            font-size: 14px;
            font-weight: 700;
            color: var(--ink);
            margin: 0 0 8px 0;
          }
          .ticket-info p {
            font-size: 12px;
            color: var(--muted);
            margin: 0 0 4px 0;
          }
          .ticket-qr {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .qr-code {
            width: 120px;
            height: 120px;
            border: 2px solid var(--line);
            border-radius: 8px;
            padding: 4px;
            background: white;
          }
          .download-qr {
            background: var(--yellow);
            color: var(--navy);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: .2s ease;
          }
          .download-qr:hover {
            background: #ffed4e;
          }
          
          .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--navy);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            opacity: 0;
            transform: translateY(18px);
            pointer-events: none;
          }
          .toast.show {
            opacity: 1;
            transform: translateY(0);
          }
          
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(4,8,25,.76);
            backdrop-filter: blur(5px);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px;
            z-index: 50;
          }
          .modal-backdrop.open {
            display: flex;
          }
          .modal-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
            width: 100%;
            max-width: 500px;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
          }
          .modal-close {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f4f5fa;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: .2s ease;
          }
          .modal-close:hover {
            background: #e8eaf1;
          }
          .modal-content {
            margin-top: 16px;
            font-size: 13px;
            line-height: 1.5;
            color: var(--muted);
          }
          .modal-details {
            background: #f7f8fc;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
          }
          .modal-details p {
            margin: 0 0 8px 0;
            font-size: 13px;
            font-weight: 700;
            color: var(--ink);
          }
          .modal-details p:last-child {
            margin-bottom: 0;
          }
          .modal-btn {
            width: 100%;
            background: var(--navy);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            margin-top: 20px;
            transition: .2s ease;
          }
          .modal-btn:hover {
            background: #0a1220;
          }
          
          @media (max-width: 1024px) {
            .main-grid {
              grid-template-columns: 1fr;
            }
            .bottom-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 768px) {
            .app-shell {
              grid-template-columns: 1fr;
            }
            .sidebar {
              display: none;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .bottom-grid {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />

      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar" aria-label="Main navigation">
          <div className="logo">
            <div className="logo-icon">✨</div>
            <div className="logo-text">
              <p>Campus Collective</p>
              <h3>Cultural<br/>Committee</h3>
            </div>
          </div>

          <nav className="nav" aria-label="Dashboard sections">
            <button className="nav-item active" onClick={() => scrollToSection('profile')}>📊 Dashboard</button>
            <button className="nav-item" onClick={() => scrollToSection('events')}>📅 Events</button>
            <button className="nav-item" onClick={() => scrollToSection('certificates')}>🏆 Certificates</button>
            <button className="nav-item" onClick={() => scrollToSection('notices')}>🔔 Notices</button>
          </nav>

          <div className="user-card">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              👤
            </div>
            <div className="user-info">
              <h4>{studentDataComputed.name}</h4>
              <p>{studentDataComputed.role}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="header">
            <div>
              <p className="header-subtitle">Student Space</p>
              <h1 className="header-title">Your cultural dashboard</h1>
            </div>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => showToast(notices.length ? `${notices.length} active notice${notices.length === 1 ? '' : 's'}` : 'No new notifications')} aria-label="Notifications">
                🔔
                <span className="notification-dot"></span>
              </button>
              <button className="icon-btn" onClick={handleLogout} title="Logout">
                🚪
              </button>
            </div>
          </div>

          {/* Stats */}
          <section aria-label="Student statistics" className="stats-grid">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">📅 Events joined</div>
                <div className="stat-icon">📅</div>
              </div>
              <div className="stat-value">{String(registeredEvents.length).padStart(2, '0')}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">🏆 Certificates</div>
                <div className="stat-icon">🏆</div>
              </div>
              <div className="stat-value">{String(certificates.length).padStart(2, '0')}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">⭐ Culture points</div>
                <div className="stat-icon">⭐</div>
              </div>
              <div className="stat-value">{culturePoints}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">🏅 Campus rank</div>
                <div className="stat-icon">🏅</div>
              </div>
              <div className="stat-value">{campusRank}</div>
            </div>
          </section>

          {/* Main Grid */}
          <section className="main-grid">
            {/* Left Column */}
            <div>
              {/* Profile */}
<div id="profile" className="card">
  <div className="card-header">
    <div>
      <p className="card-subtitle">Account Overview</p>
      <h2 className="card-title">Student Profile</h2>
    </div>

    <button
      className="edit-btn"
      onClick={handleEditProfileOpen}
    >
      ✎ Edit Profile
    </button>
  </div>

  <div className="profile-grid">

    <div className="profile-item">
      <div className="profile-label">Full Name</div>
      <div className="profile-value">
        {studentDataComputed.name}
      </div>
    </div>

    <div className="profile-item">
      <div className="profile-label">Email Address</div>
      <div
        className="profile-value"
        style={{ fontSize: "13px", wordBreak: "break-word" }}
      >
        {studentDataComputed.email}
      </div>
    </div>

    <div className="profile-item">
      <div className="profile-label">Phone Number</div>
      <div className="profile-value">
        {studentDataComputed.phone}
      </div>
    </div>

    <div className="profile-item">
      <div className="profile-label">Department</div>
      <div className="profile-value">
        {studentDataComputed.department}
      </div>
    </div>

    <div className="profile-item">
      <div className="profile-label">Role</div>
      <div className="profile-value">
        {studentDataComputed.role}
      </div>
    </div>

  </div>
</div>

              {/* Events */}
              <div id="events" className="card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                  <div>
                    <p className="card-subtitle">Find Your Stage</p>
                    <h2 className="card-title">Upcoming Events</h2>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)', margin: 0 }}>
                    {events.filter((event) => !registeredByEvent[event.id]).length} open registrations
                  </p>
                </div>
                <div className="events-list">
                  {events.map(event => (
                    <div key={event.id} className="event-row">
                      <div className="event-icon">{event.image}</div>
                      <div className="event-info">
                        <div className="event-name">
                          {event.name}
                          <span className="event-badge">{event.type}</span>
                        </div>
                        <div className="event-meta">📅 {event.date} • 🕐 {event.startTime || 'Time not set'}{event.endTime ? ` - ${event.endTime}` : ''} • 📍 {event.location}</div>
                      </div>
                      {registeredByEvent[event.id] ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div className="registered-badge">✓ Registered</div>
                          <button className="register-btn" onClick={() => handleUnregister(event.id)} style={{ background: '#f05245' }}>
                            Unregister
                          </button>
                        </div>
                      ) : (
                        <button className="register-btn" onClick={() => handleRegister(event.id)}>
                          Register
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Featured Event - Nearest Upcoming Event */}
              {featuredEvent && (
                <div className="feature-card">
                  <div className="feature-content">
                    <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#ffd65a', margin: 0 }}>
                      {featuredEvent.image} {featuredEvent.name}
                    </p>
                    <h3 className="feature-title">{featuredEvent.name}</h3>
                    <p className="feature-text">
                      {registeredByEvent[featuredEvent.id] 
                        ? `You're registered! Mark your calendar for ${featuredEvent.date} at ${featuredEvent.location}.` 
                        : `Don't miss out on this upcoming event on ${featuredEvent.date}!`}
                    </p>
                    <button className="feature-btn" onClick={() => setModalOpen(true)}>
                      View event details
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="card">
                <p className="card-subtitle">Shortcuts</p>
                <h2 className="card-title">Quick Actions</h2>
                <div className="quick-actions" style={{ marginTop: '16px' }}>
                  <button className="quick-btn" onClick={() => scrollToSection('events')}>
                    📅 Browse all events
                  </button>
                  <button className="quick-btn" onClick={() => scrollToSection('certificates')}>
                    🏆 My certificates
                  </button>
                  <button className="quick-btn" onClick={() => scrollToSection('notices')}>
                    🔔 Latest notices
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Grid */}
          <section className="bottom-grid">
            {/* Feedback */}
            <div id="feedback" className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>💬</span>
                <h2 className="card-title" style={{ margin: 0 }}>Event Feedback</h2>
              </div>
              {feedbackEvents.length ? feedbackEvents.map((event) => (
                <div className="notice-item" key={event._id}>
                  <h3 className="notice-title">{event.title}</h3>
                  <p className="notice-text">The event has ended. Share your experience with the Cultural Committee.</p>
                  <button className="cert-btn" onClick={() => navigate(`/feedback?eventId=${event._id}`)}>
                    Give feedback
                  </button>
                </div>
              )) : (
                <div className="notice-item">
                  <p className="notice-text">Feedback forms will appear here after your registered events end.</p>
                </div>
              )}
            </div>

            {/* Notices */}
            <div id="notices" className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📢</span>
                <h2 className="card-title" style={{ margin: 0 }}>Notice Board</h2>
              </div>
              {notices.length ? notices.map((notice) => (
                <div className="notice-item" key={notice._id}>
                  <h3 className="notice-title">{notice.title}</h3>
                  <p className="notice-text">{notice.description || notice.content}</p>
                </div>
              )) : (
                <div className="notice-item">
                  <p className="notice-text">No notices available right now.</p>
                </div>
              )}
            </div>

            {/* Certificates */}
            <div id="certificates" className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>🏆</span>
                <h2 className="card-title" style={{ margin: 0 }}>Latest Certificate</h2>
              </div>
              {certificates.length ? certificates.map((certificate) => (
                <div className="cert-item" key={certificate._id}>
                  <h3 className="cert-name">{certificate.certificateTitle || certificate.event?.title}</h3>
                  <p className="cert-detail">{certificate.achievement} · {formatMonthYear(certificate.awardedDate)}</p>
                  <button className="cert-btn" onClick={() => handleDownloadCertificate(certificate)}>
                    Download certificate
                  </button>
                </div>
              )) : (
                <div className="cert-item">
                  <p className="cert-detail">No certificates available yet.</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📝</span>
                <h2 className="card-title" style={{ margin: 0 }}>Recent Activity</h2>
              </div>
              <div className="activity-list">
                {recentActivity.length ? recentActivity.map((activity) => (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-dot"></div>
                    <div>{activity.text}</div>
                  </div>
                )) : (
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div>No recent activity yet.</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Registered Events with QR Codes */}
          {registeredEvents.length > 0 && (
            <section className="registered-tickets">
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>
                🎟️ Your Event Tickets & QR Codes
              </h2>
              {registeredEvents.map(event => (
                <div key={event.id} className="ticket-item">
                  <div>
                    <h4>{event.name}</h4>
                    <p>📅 {event.date} • 📍 {event.location}</p>
                    <p style={{ fontSize: '11px', color: '#b87800', fontWeight: '600', margin: '8px 0 0 0' }}>
                      Status: ✓ Confirmed
                    </p>
                  </div>
                  <div className="ticket-qr">
                    {event.qrCode && (
                      <>
                        <img src={event.qrCode} alt={`QR Code for ${event.name}`} className="qr-code" />
                        <button className="download-qr" onClick={() => handleDownloadQr(event)}>
                          📥 Download
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <div className={`modal-backdrop ${editModalOpen ? 'open' : ''}`} onClick={() => setEditModalOpen(false)}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="card-subtitle">Account Settings</p>
              <h2 className="card-title">Edit Profile</h2>
            </div>
            <button className="modal-close" onClick={() => setEditModalOpen(false)}>✕</button>
          </div>
          <div className="modal-content" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#81889d', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e7e9f2',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#81889d', marginBottom: '6px' }}>
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={studentDataComputed.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e7e9f2',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    backgroundColor: '#f7f8fc',
                    color: '#6f7792',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#81889d', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e7e9f2',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#81889d', marginBottom: '6px' }}>
                  Department
                </label>
                <select
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditFormChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e7e9f2',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="CS">CS</option>
                  <option value="DS">DS</option>
                  <option value="BMS">BMS</option>
                  <option value="BCA">BCA</option>
                  <option value="BAF">BAF</option>
                  <option value="Micro Biology">Micro Biology</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="modal-btn"
              onClick={handleSaveProfile}
              style={{ flex: 1, background: '#080f2b' }}
            >
              Save Changes
            </button>
            <button
              className="modal-btn"
              onClick={() => setEditModalOpen(false)}
              style={{ flex: 1, background: '#6f7792' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <div className={`modal-backdrop ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="card-subtitle">Event Details</p>
              <h2 className="card-title">{featuredEvent?.name || 'Event Details'}</h2>
            </div>
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
          </div>
          <div className="modal-content">
            {registeredByEvent[featuredEvent?.id] 
              ? 'You are registered for this event. Make sure to arrive on time and bring all necessary items as per event requirements.'
              : 'Get ready to showcase your talent and be part of our cultural celebration. Register now to secure your spot!'}
          </div>
          <div className="modal-details">
            <p>📅 {featuredEvent?.date}</p>
            <p>📍 {featuredEvent?.location}</p>
            <p>🎭 {featuredEvent?.type}</p>
          </div>
          <button className="modal-btn" onClick={() => setModalOpen(false)}>Done</button>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
