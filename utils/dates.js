// Small date helpers written by hand (no extra library, and Intl support
// varies between Hermes, iOS and web).
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// A Date `daysFromToday` days away at hour:minute local time.
export function atTime(daysFromToday, hour, minute = 0) {
  const d = addDays(startOfDay(new Date()), daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatShortDate(date) {
  const d = new Date(date);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// "Today", "Tomorrow", "Yesterday" or "Mon 20 Oct".
export function formatDay(date) {
  const d = new Date(date);
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(d) - today) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatShortDate(d);
}

export function formatTime(date) {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${h12} ${suffix}`
    : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// "Tomorrow · 6 PM – 8 PM"
export function formatSlot(startIso, durationMin) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * MINUTE);
  return `${formatDay(start)} · ${formatTime(start)} – ${formatTime(end)}`;
}

export function slotEnd(startIso, durationMin) {
  return new Date(startIso).getTime() + durationMin * MINUTE;
}

// True when two [start, start+duration) ranges overlap.
export function overlaps(aStart, aMin, bStart, bMin) {
  const a0 = new Date(aStart).getTime();
  const b0 = new Date(bStart).getTime();
  return a0 < b0 + bMin * MINUTE && b0 < a0 + aMin * MINUTE;
}

export function formatMonthYear(date) {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
