/* =========================
   EVENT START TIME HELPER
========================= */

const getEventStart = (event) => {
  if (!event || !event.date) return new Date(NaN);
  const start = new Date(event.date);

  if (Number.isNaN(start.getTime()) || !event.time) {
    return start;
  }

  const match = String(event.time)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) {
    return start;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (hours > 23 || minutes > 59) {
    return start;
  }

  if (meridiem === "PM" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  start.setHours(hours, minutes, 0, 0);

  return start;
};

const getEventEnd = (event) => {
  if (!event || !event.date) return new Date(NaN);
  const end = new Date(event.date);

  if (Number.isNaN(end.getTime()) || !event.endTime) return end;

  const match = String(event.endTime)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) return end;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (hours > 23 || minutes > 59) return end;
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  end.setHours(hours, minutes, 0, 0);
  return end;
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

module.exports = {
  getEventStart,
  getEventEnd,
  getStartOfToday,
};
