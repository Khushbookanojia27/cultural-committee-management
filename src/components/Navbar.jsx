import { Link } from "react-router-dom";
import collegeLogo from "../assets/college-logo.png";

function Navbar() {
  return (
    <nav className="bg-[#10162E] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">

        {/* Logo + Website Name */}
        <Link to="/" className="flex items-center gap-4">

          {/* Circular Logo */}
          <div className="w-16 h-16 rounded-full bg-white border-2 border-[#F5B800] flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={collegeLogo}
              alt="Cultural Committee Logo"
              className="w-full h-full object-contain p-1"
            />
          </div>

          {/* Title */}
          <span className="text-2xl font-bold text-white">
            Cultural Committee
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-10">

          <Link
            to="/"
            className="text-[#F5B800] font-semibold hover:text-white transition duration-300"
          >
            Home
          </Link>

          <Link
            to="/events"
            className="text-white font-semibold hover:text-[#F5B800] transition duration-300"
          >
            Events
          </Link>

          <Link
            to="/gallery"
            className="text-white font-semibold hover:text-[#F5B800] transition duration-300"
          >
            Gallery
          </Link>

          <Link
            to="/feedback"
            className="text-white font-semibold hover:text-[#F5B800] transition duration-300"
          >
            Feedback
          </Link>

        </div>

        {/* Login + Register */}
        <div className="flex items-center gap-4">

          <Link
            to="/login"
            className="px-6 py-3 rounded-lg border-2 border-[#F5B800] text-[#F5B800] font-semibold hover:bg-[#F5B800] hover:text-[#10162E] transition duration-300"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-6 py-3 rounded-lg bg-[#F44336] text-white font-semibold hover:bg-[#D9362E] transition duration-300 shadow-md"
          >
            Register
          </Link>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;