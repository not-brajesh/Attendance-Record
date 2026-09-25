import { useEffect, useState } from "react";
import { db } from "../db/database";
import {
  calculateMinutes,
  formatDuration,
  calculateEarning,
} from "../utils/calculations";
import { getLocalDate } from "../utils/dateUtils";
import "./Attendance.css";

function Attendance() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const data = await db.students.toArray();
    setStudents(data);
  };

  const selectedStudent = students.find(
    (student) => student.id === Number(studentId)
  );

  const durationMinutes = calculateMinutes(startTime, endTime);

  const estimatedEarning = selectedStudent
    ? calculateEarning(durationMinutes, selectedStudent.hourlyRate)
    : 0;

  const saveAttendance = async () => {
    if (!studentId) {
      alert("Please select a student.");
      return;
    }

    if (!date) {
      alert("Please select a class date.");
      return;
    }

    if (!startTime) {
      alert("Please select start time.");
      return;
    }

    if (!endTime) {
      alert("Please select end time.");
      return;
    }

    if (durationMinutes <= 0) {
      alert("End time must be after start time.");
      return;
    }

    try {
      await db.attendance.add({
        studentId: Number(studentId),
        date: date,
        startTime,
        endTime,
      });

      alert("Attendance saved successfully!");

      setStudentId("");
      setDate(getLocalDate());
      setStartTime("");
      setEndTime("");
    } catch (error) {
      console.error(error);
      alert("Error saving attendance: " + error.message);
    }
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">CLASS MANAGEMENT</p>
          <h1>Attendance</h1>
          <p className="page-subtitle">
            Record today's tuition session and calculate your earnings.
          </p>
        </div>
      </div>

      <div className="attendance-card">
        <div className="form-section">
          <label>Student</label>

          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label>Class Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {selectedStudent && (
          <div className="student-info">
            <div>
              <span>Student</span>
              <strong>{selectedStudent.name}</strong>
            </div>

            <div>
              <span>Hourly Rate</span>
              <strong>
                ₹{Number(selectedStudent.hourlyRate || 0).toLocaleString(
                  "en-IN"
                )}
                /hr
              </strong>
            </div>
          </div>
        )}

        <div className="time-grid">
          <div className="form-section">
            <label>Start Time</label>

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>End Time</label>

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {(startTime || endTime) && (
          <div className="session-summary">
            <div className="summary-item">
              <span>Duration</span>
              <strong>{formatDuration(durationMinutes)}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <span>Estimated Earnings</span>
              <strong>₹{estimatedEarning.toFixed(2)}</strong>
            </div>
          </div>
        )}

        <button className="save-attendance" onClick={saveAttendance}>
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default Attendance;