const API_URL = "http://localhost:5000/api/events";

export const getAllEvents = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      events: [],
    };
  }
};