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

// Backward-compatible helper (jab tak saare pages update nahi ho jaate)
export const calculateEarning = (minutes, hourlyRate) => {
  return Math.round((minutes / 60) * Number(hourlyRate || 0));
};

// ✅ Naya unified earning calculator (Hourly, Per Class, Fixed Monthly)
export const calculateStudentEarning = (student, totalMinutes = 0, classCount = 0) => {
  if (!student) return 0;

  const type = student.paymentType || "hourly";
  const amount = Number(student.paymentAmount ?? student.hourlyRate ?? 0);

  if (type === "per_class" || type === "daily") {
    return classCount * amount;
  }

  if (type === "monthly") {
    return classCount > 0 ? amount : 0;
  }

  // Default: hourly
  return Math.round((totalMinutes / 60) * amount);
};

// ✅ UI mein clean badge aur formatted rate dikhane ke liye helper
export const getPaymentDetails = (student) => {
  const type = student?.paymentType || "hourly";
  const amount = Number(student?.paymentAmount ?? student?.hourlyRate ?? 0);

  if (type === "per_class" || type === "daily") {
    return {
      type: "per_class",
      label: "Per Class",
      rateDisplay: `₹${amount} / class`,
    };
  }

  if (type === "monthly") {
    return {
      type: "monthly",
      label: "Fixed Monthly",
      rateDisplay: `₹${amount} / month`,
    };
  }

  return {
    type: "hourly",
    label: "Per Hour",
    rateDisplay: `₹${amount} / hr`,
  };
};
