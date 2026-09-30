import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL, getAuthHeaders, getCurrentUser } from "../auth";

const initialFormData = {
    eventId: "",
    name: "",
    year: "",
    rollNumber: "",
    email: "",
    division: "",
    department: "",
    eventExperience: "",
    eventManagement: "",
    suggestions: "",
    rating: "",
};

const inputClassName =
    "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-[#673ab7] focus:ring-2 focus:ring-[#673ab7]/20";

function Feedback() {
    const currentUser = getCurrentUser();
    const requestedEventId = new URLSearchParams(window.location.search).get("eventId") || "";
    const [formData, setFormData] = useState({
        ...initialFormData,
        eventId: requestedEventId,
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        department: currentUser?.department || "",
        rollNumber: currentUser?.rollNumber || "",
    });
    const [availableEvents, setAvailableEvents] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadAvailableEvents = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/feedback/available`, {
                    headers: getAuthHeaders(),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Unable to load feedback forms.");
                const events = (data.events || []).filter((event) => !event.submitted);
                setAvailableEvents(events);
                setFormData((previous) => ({
                    ...previous,
                    eventId: events.some((event) => event._id === requestedEventId)
                        ? requestedEventId
                        : events[0]?._id || "",
                }));
            } catch (loadError) {
                setError(loadError.message);
            } finally {
                setLoading(false);
            }
        };

        loadAvailableEvents();
    }, [requestedEventId]);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
        setSubmitted(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/feedback`, {
                method: "POST",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to submit feedback.");

            setSubmitted(true);
            setAvailableEvents((previous) => previous.filter((item) => item._id !== formData.eventId));
            setFormData({
                ...initialFormData,
                name: currentUser?.name || "",
                email: currentUser?.email || "",
                department: currentUser?.department || "",
                rollNumber: currentUser?.rollNumber || "",
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0ebf8] text-gray-800">
            <Navbar />

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
                <section className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="h-2 bg-[#673ab7]" />
                    <div className="border-b border-gray-200 px-6 py-7 sm:px-10">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#673ab7]">
                            Cultural Committee
                        </p>
                        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                            Event Feedback Form
                        </h1>
                        <p className="mt-3 text-gray-600">
                            Your feedback helps us make every cultural event better. Please
                            fill in the form below.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            <span className="text-red-600">*</span> Indicates required
                            question
                        </p>
                    </div>

                    {loading && <p className="px-6 pt-6 text-gray-500 sm:px-10">Loading available feedback forms...</p>}

                    {!loading && !availableEvents.length && !error && (
                        <p className="mx-6 mt-6 rounded-md bg-gray-50 px-4 py-3 text-gray-600 sm:mx-10">
                            No completed event feedback forms are available for you right now.
                        </p>
                    )}

                    {error && (
                        <p className="mx-6 mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 sm:mx-10" role="alert">
                            {error}
                        </p>
                    )}

                    {submitted && (
                        <div
                            className="mx-6 mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 sm:mx-10"
                            role="status"
                        >
                            Thank you. Your feedback has been submitted successfully.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-10">
                        <div>
                            <label htmlFor="eventId" className="mb-2 block font-medium text-gray-900">
                                Event <span className="text-red-600">*</span>
                            </label>
                            <select id="eventId" name="eventId" value={formData.eventId} onChange={handleChange} className={inputClassName} required disabled={!availableEvents.length}>
                                <option value="">Choose the completed event</option>
                                {availableEvents.map((event) => (
                                    <option key={event._id} value={event._id}>{event.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="name" className="mb-2 block font-medium text-gray-900">
                                Full name <span className="text-red-600">*</span>
                            </label>
                            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={inputClassName} placeholder="Your answer" required />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="year" className="mb-2 block font-medium text-gray-900">
                                    Year <span className="text-red-600">*</span>
                                </label>
                                <select id="year" name="year" value={formData.year} onChange={handleChange} className={inputClassName} required>
                                    <option value="">Choose your year</option>
                                    <option value="First Year">First Year</option>
                                    <option value="Second Year">Second Year</option>
                                    <option value="Third Year">Third Year</option>
                                    <option value="Fourth Year">Fourth Year</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="rollNumber" className="mb-2 block font-medium text-gray-900">
                                    Roll number <span className="text-red-600">*</span>
                                </label>
                                <input id="rollNumber" name="rollNumber" type="text" value={formData.rollNumber} onChange={handleChange} className={inputClassName} placeholder="Your answer" required />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-2 block font-medium text-gray-900">
                                Email address <span className="text-red-600">*</span>
                            </label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={inputClassName} placeholder="name@example.com" required />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="division" className="mb-2 block font-medium text-gray-900">
                                    Division <span className="text-red-600">*</span>
                                </label>
                                <input id="division" name="division" type="text" value={formData.division} onChange={handleChange} className={inputClassName} placeholder="e.g. A" required />
                            </div>

                            <div>
                                <label htmlFor="department" className="mb-2 block font-medium text-gray-900">
                                    Department <span className="text-red-600">*</span>
                                </label>
                                <select id="department" name="department" value={formData.department} onChange={handleChange} className={inputClassName} required>
                                    <option value="">Choose your department</option>
                                    <option value="BSc Information Technology">BSc Information Technology</option>
                                    <option value="BSc Computer Science">BSc Computer Science</option>
                                    <option value="BSc Data Science">BSc Data Science</option>
                                    <option value="BMS">Bachelor of Management Studies (BMS)</option>
                                    <option value="BCA">Bachelor of Computer Applications (BCA)</option>
                                    <option value="BAF">Bachelor of Accounting and Finance (BAF)</option>
                                    <option value="Microbiology">Microbiology</option>
                                </select>
                            </div>
                        </div>

                        <fieldset>
                            <legend className="mb-3 font-medium text-gray-900">
                                How was the event? <span className="text-red-600">*</span>
                            </legend>
                            <div className="space-y-3">
                                {["Excellent", "Good", "Average", "Needs improvement"].map((option) => (
                                    <label key={option} className="flex cursor-pointer items-center gap-3 text-gray-700">
                                        <input type="radio" name="eventExperience" value={option} checked={formData.eventExperience === option} onChange={handleChange} className="h-4 w-4 accent-[#673ab7]" required />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="eventManagement" className="mb-2 block font-medium text-gray-900">
                                How was the management of the event? <span className="text-red-600">*</span>
                            </label>
                            <select id="eventManagement" name="eventManagement" value={formData.eventManagement} onChange={handleChange} className={inputClassName} required>
                                <option value="">Choose an option</option>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Needs improvement">Needs improvement</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="suggestions" className="mb-2 block font-medium text-gray-900">
                                Anything you would like to tell us?
                            </label>
                            <textarea id="suggestions" name="suggestions" value={formData.suggestions} onChange={handleChange} className={`${inputClassName} min-h-28 resize-y`} placeholder="Your answer" />
                        </div>

                        <fieldset>
                            <legend className="mb-3 font-medium text-gray-900">
                                Rate the event from 1 to 5 <span className="text-red-600">*</span>
                            </legend>
                            <div className="flex flex-wrap gap-4">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <label key={rating} className="flex cursor-pointer flex-col items-center gap-2 text-sm text-gray-700">
                                        <input type="radio" name="rating" value={rating} checked={formData.rating === String(rating)} onChange={handleChange} className="h-5 w-5 accent-[#673ab7]" required />
                                        {rating}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <button type="submit" disabled={submitting || !availableEvents.length} className="rounded-md bg-[#673ab7] px-7 py-3 font-semibold text-white transition hover:bg-[#512da8] focus:outline-none focus:ring-2 focus:ring-[#673ab7] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                                {submitting ? "Submitting..." : "Submit feedback"}
                            </button>
                            <button type="reset" onClick={() => setFormData(initialFormData)} className="self-start font-medium text-[#673ab7] hover:text-[#512da8] sm:self-auto">
                                Clear form
                            </button>
                        </div>
                    </form>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Feedback;