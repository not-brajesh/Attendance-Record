import Dexie from "dexie";

export const db = new Dexie("AttendanceRecordDB");

db.version(2).stores({
  students: "++id, name",
  attendance: "++id, studentId, date, startTime, endTime",
  downloads: "++id, fileName, createdAt",
});