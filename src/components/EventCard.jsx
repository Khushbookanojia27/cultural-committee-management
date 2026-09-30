function EventCard({ title, date, location }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition duration-300 border-2 border-[#F5B800]">

            <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=600"
                alt={title}
                className="w-full h-48 object-cover"
            />

            <div className="p-5">

                <h2 className="text-xl font-bold text-[#10162E]">
                    {title}
                </h2>

                <p className="text-gray-600 mt-3">
                    📅 {date}
                </p>

                <p className="text-gray-600 mt-1">
                    📍 {location}
                </p>

                <button
                    className="mt-4 bg-[#F44336] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#D9362E] transition duration-300 shadow-md"
                >
                    Register
                </button>

            </div>
        </div>
    );
}

export default EventCard;