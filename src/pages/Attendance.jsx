import React, { useEffect, useState } from "react";
import { db } from "../db/database";
import {
  calculateMinutes,
  formatDuration,
  calculateStudentEarning,
  getPaymentDetails,
} from "../utils/calculations";
import { getLocalDate } from "../utils/dateUtils";
import {
  CalendarCheck,
  Clock,
  IndianRupee,
  User,
  CheckCircle2,
} from "lucide-react";
import "./Attendance.css";

function Attendance() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await db.students.toArray();
      setStudents(data);
    } catch (err) {
      console.error("Attendance: failed to load students from IndexedDB", err);
      setStudents([]);
    }
  };

  const selectedStudent = students.find(
    (student) => student.id === Number(studentId)
  );

  const durationMinutes = calculateMinutes(startTime, endTime);
  const paymentDetails = selectedStudent
    ? getPaymentDetails(selectedStudent)
    : null;

  const estimatedEarning = selectedStudent
    ? calculateStudentEarning(selectedStudent, durationMinutes, 1)
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

      setStatusMessage("Attendance saved successfully!");
      setStudentId("");
      setDate(getLocalDate());
      setStartTime("");
      setEndTime("");
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (error) {
      console.error(error);
      alert("Error saving attendance: " + error.message);
    }
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Class Management</p>
          <h1>Attendance</h1>
          <p className="page-subtitle">
            Record today's tuition session and calculate your earnings.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="status-toast">
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

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
                {student.name} {student.className ? `(${student.className})` : ""}
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

        {selectedStudent && paymentDetails && (
          <div className="student-info-badge">
            <div className="student-info-item">
              <div className="info-icon info-icon--indigo">
                <User size={16} />
              </div>
              <div>
                <span>Student</span>
                <strong>{selectedStudent.name}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <div className="info-icon info-icon--terracotta">
                <IndianRupee size={16} />
              </div>
              <div>
                <span>Rate ({paymentDetails.label})</span>
                <strong>{paymentDetails.rateDisplay}</strong>
              </div>
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
              <div className="summary-label-row">
                <Clock size={15} />
                <span>Duration</span>
              </div>
              <strong>{formatDuration(durationMinutes)}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <div className="summary-label-row">
                <IndianRupee size={15} />
                <span>Estimated Earnings</span>
              </div>
              <strong className="summary-earn">
                ₹{estimatedEarning.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        )}

        <button className="save-attendance" onClick={saveAttendance}>
          <CalendarCheck size={18} strokeWidth={2.2} />
          <span>Save Attendance</span>
        </button>
      </div>
    </div>
  );
}

export default Attendance;
