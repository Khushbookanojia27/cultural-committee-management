
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">

      {/* ================= BACKGROUND IMAGE ================= */}

      <img
        src="https://images.pexels.com/photos/38218440/pexels-photo-38218440.jpeg"
        alt="Cultural dance performance"
        className="absolute inset-0 w-full h-full object-cover scale-[1.02] saturate-[1.15]"
      />


      {/* ================= DARK OVERLAY ================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-[#0d1336]/95 via-[#0d1336]/80 to-[#0d1336]/40" />


      {/* ================= YELLOW DECORATION ================= */}

      <div className="absolute -top-48 -right-20 w-[28rem] h-[28rem] rounded-full bg-[#f7b801] opacity-95" />


      {/* ================= CONTENT ================= */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 lg:px-14 py-16 md:py-20 min-h-[calc(100vh-80px)] flex flex-col justify-center">

        <div className="max-w-4xl">


          {/* ================= BADGE ================= */}

          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#f7b801] text-[#11152f] text-xs font-bold tracking-[0.18em] uppercase">

            Cultural Committee Presents

          </div>


          {/* ================= HEADING ================= */}

          <h1
            className="text-[#fff7e8] font-black leading-[0.95] tracking-tight"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(3rem, 7vw, 6.5rem)",
            }}
          >
            Where every rhythm finds its stage.
          </h1>


          {/* ================= DESCRIPTION ================= */}

          <div className="mt-8 flex flex-col md:flex-row md:items-end gap-7">

            <p className="max-w-xl text-[#fff7e8] text-base md:text-lg leading-relaxed font-medium">

              A year-round celebration of the voices, movement, music
              and imagination that make our campus unforgettable.

            </p>


            {/* ================= DATE ================= */}

            <div className="relative bg-[#f04438] px-7 py-4 min-w-[190px]">

              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff7e8]">
                The cultural season
              </span>

              <span className="block text-2xl font-bold mt-1 text-[#fff7e8]">
                2026 — 27
              </span>

            </div>

          </div>


          {/* ================= BUTTONS ================= */}

          <div className="flex flex-wrap gap-4 mt-9">

            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#f7b801] text-[#11152f] font-bold hover:bg-[#ffd34d] transition-all duration-300 hover:-translate-y-1"
            >

              <CalendarDays size={19} />

              Explore Events

              <ArrowRight size={18} />

            </Link>


            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#fff7e8] text-[#fff7e8] font-bold hover:bg-[#fff7e8] hover:text-[#11152f] transition-all duration-300"
            >

              Register Now

              <ArrowRight size={18} />

            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;
