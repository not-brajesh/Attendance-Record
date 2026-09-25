// ✅ Local-timezone-safe date helpers (avoids toISOString() UTC shift bug)

export const getLocalDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getMonthStart = (date = new Date()) => {
  return getLocalDate(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );
};

export const getMonthEnd = (date = new Date()) => {
  return getLocalDate(
    new Date(date.getFullYear(), date.getMonth() + 1, 0)
  );
};