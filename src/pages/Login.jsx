import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { loginStudent, saveAuthSession, validateLoginForm } from "../auth";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateLoginForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = await loginStudent(formData);
      saveAuthSession(data);

      // Redirect
      switch (data.user.role?.toLowerCase()) {
        case "admin":
          navigate("/admin-dashboard");
          break;

        case "committee":
          navigate("/committee-dashboard");
          break;

        default:
          navigate("/student-dashboard");
      }

    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#10162E] flex items-center justify-center px-6 py-16">

        <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#F5B800] p-8 w-full max-w-md">

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-[#10162E]">
              Welcome Back
            </h1>

            <p className="text-gray-500 mt-2">
              Login to your account
            </p>

          </div>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="mb-5">

              <label className="block font-semibold mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800]"
                required
              />

            </div>

            <div className="mb-6">

              <label className="block font-semibold mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-[#F5B800]"
                required
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F44336] hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p className="text-center mt-6">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-[#F5B800] font-bold"
            >
              Register
            </Link>

          </p>

        </div>

      </div>

      <Footer />
    </>
  );
}

export default Login;
