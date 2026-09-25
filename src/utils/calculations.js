// ✅ Central calculation helpers — used by Dashboard, Reports, Attendance, XLSX export

export const calculateMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let start = sh * 60 + sm;
  let end = eh * 60 + em;

  if (end < start) end += 24 * 60;

  return end - start;
};

export const calculateHours = (startTime, endTime) => {
  return calculateMinutes(startTime, endTime) / 60;
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0m";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const calculateEarning = (minutes, hourlyRate) => {
  return (minutes / 60) * Number(hourlyRate || 0);
};