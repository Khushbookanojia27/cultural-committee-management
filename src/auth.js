const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export { API_BASE_URL };

const DEPARTMENTS = ["IT", "CS", "DS", "BMS", "BCA", "BAF", "Micro Biology"];
const PASSWORD_MIN_LENGTH = 6;

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function authRequest(path, options) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      "Unable to connect to the server. Make sure the backend is running."
    );
  }

  let data;

  try {
    data = await readResponse(response);
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
}

export function validateRegistrationForm({
  name,
  email,
  phone,
  department,
  password,
  confirmPassword,
}) {
  if (!name?.trim()) return "Please enter your full name.";

  if (!/^\S+@\S+\.\S+$/.test(email?.trim() || "")) {
    return "Please enter a valid email address.";
  }

  const normalizedPhone = (phone || "").replace(/[\s()-]/g, "");
  if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
    return "Please enter a valid phone number.";
  }

  if (!DEPARTMENTS.includes(department)) {
    return "Please select a valid department.";
  }

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (password !== confirmPassword) return "Passwords do not match.";

  return "";
}

export function validateLoginForm({ email, password }) {
  if (!/^\S+@\S+\.\S+$/.test(email?.trim() || "")) {
    return "Please enter a valid email address.";
  }

  if (!password) return "Please enter your password.";

  return "";
}

export function registerStudent(formData) {
  return authRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/[\s()-]/g, ""),
      department: formData.department,
      password: formData.password,
      role: "student",
    }),
  });
}

export function loginStudent({ email, password }) {
  return authRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

export function saveAuthSession({ token, user }) {
  if (!token || !user) {
    throw new Error("The server did not return valid login information.");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
}

export function updateCurrentUser(user) {
  if (user) localStorage.setItem("currentUser", JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
}

export function updateUserProfile(profileData) {
  return authRequest("/users/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(profileData),
  });
}

export function changeUserPassword({ currentPassword, newPassword }) {
  return authRequest("/users/change-password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function toggleUserStatus(userId) {
  return authRequest(`/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
}

