import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { registerStudent, validateRegistrationForm } from "../auth";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateRegistrationForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await registerStudent(formData);

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-[#10162E] px-6 py-16">

        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg border-2 border-[#F5B800]">

          <div className="text-center mb-8">

            <p className="text-[#F5B800] font-semibold uppercase tracking-wider mb-2">
              Cultural Committee
            </p>

            <h2 className="text-3xl font-bold text-[#10162E]">
              Create Your Account
            </h2>

            <div className="w-16 h-1 bg-[#F5B800] mx-auto mt-3 rounded-full"></div>

            <p className="text-gray-500 mt-3">
              Join the Cultural Committee community
            </p>

          </div>

          {message && (
            <div className="mb-5 p-3 rounded-lg bg-green-100 text-green-700 text-center font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-100 text-red-600 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Phone Number
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              />
            </div>

            {/* Department */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Department
              </label>

              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              >
                <option value="">Select Department</option>
                <option value="IT">BSC.Information Technology</option>
                <option value="CS">BSC.Computer Science</option>
                <option value="DS">BSC.Data Science</option>
                <option value="BMS">Bachelor of Management Studies (BMS)</option>
                <option value="BCA">Bachelor of Computer Applications (BCA)</option>
                <option value="BAF">Bachelor of Accounting & Finance (BAF)</option>
                <option value="Micro Biology">Micro Biology</option>
              </select>
            </div>
                        {/* Password */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-[#10162E]">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/30 transition"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F44336] text-white py-3 rounded-lg font-semibold hover:bg-[#D9362E] transition duration-300 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#F5B800] font-bold hover:text-[#D99F00] transition"
            >
              Login
            </a>
          </p>

        </div>
      </div>

      <Footer />
    </>
  );
}

export default Register;
