import React, { useEffect, useState } from "react";
import { db } from "../db/database";
import {
  calculateMinutes,
  calculateStudentEarning,
  formatDuration,
  getPaymentDetails,
} from "../utils/calculations";
import { getMonthStart, getMonthEnd } from "../utils/dateUtils";
import {
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import "./Students.css";

function Students() {
  const [name, setName] = useState("");
  const [paymentType, setPaymentType] = useState("hourly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const studentData = await db.students.toArray();
      const attendanceData = await db.attendance.toArray();
      setStudents(studentData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error("Students: failed to load data from IndexedDB", err);
      setStudents([]);
      setAttendance([]);
    }
  };

  const addStudent = async () => {
    if (!name.trim()) {
      alert("Please enter student name.");
      return;
    }

    await db.students.add({
      name: name.trim(),
      className: className.trim(),
      paymentType,
      paymentAmount: Number(paymentAmount) || 0,
      hourlyRate: paymentType === "hourly" ? Number(paymentAmount) || 0 : 0,
      createdAt: new Date().toISOString(),
    });

    setName("");
    setPaymentType("hourly");
    setPaymentAmount("");
    setClassName("");
    setShowForm(false);

    loadData();
  };

  const deleteStudent = async (id) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    const confirmDelete = confirm(
      `Delete ${student.name}?\n\nAttendance records will remain.`
    );
    if (!confirmDelete) return;

    await db.students.delete(id);
    loadData();
  };

  const getStudentStats = (studentId) => {
    const monthStart = getMonthStart();
    const monthEnd = getMonthEnd();

    const records = attendance.filter(
      (record) =>
        record.studentId === studentId &&
        record.date >= monthStart &&
        record.date <= monthEnd
    );

    const minutes = records.reduce(
      (total, record) =>
        total + calculateMinutes(record.startTime, record.endTime),
      0
    );

    const student = students.find((s) => s.id === studentId);
    const earning = calculateStudentEarning(student, minutes, records.length);

    return {
      classes: records.length,
      minutes,
      earning,
    };
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <div>
          <p className="page-eyebrow">Learners</p>
          <h1>Students</h1>
          <p className="page-subtitle">
            Manage your students, fee structures, and tuition details.
          </p>
        </div>

        <button
          className="add-student-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Add Student</span>
        </button>
      </div>

      {showForm && (
        <div className="student-form card">
          <div className="form-title-row">
            <h2>New Student</h2>
            <p className="form-sub">Set up student profile and fee model</p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Student Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Class / Grade</label>
              <input
                type="text"
                placeholder="e.g. Class 10"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Payment Model</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="hourly">Hourly Rate</option>
                <option value="daily">Per Class (Flat)</option>
                <option value="monthly">Fixed Monthly</option>
              </select>
            </div>

            <div className="form-field">
              <label>
                {paymentType === "hourly"
                  ? "Hourly Rate (₹)"
                  : paymentType === "daily"
                  ? "Per Class Fee (₹)"
                  : "Monthly Fee (₹)"}
              </label>
              <input
                type="number"
                min="0"
                placeholder={
                  paymentType === "hourly"
                    ? "400"
                    : paymentType === "daily"
                    ? "500"
                    : "4000"
                }
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="save-btn" onClick={addStudent}>
              <Plus size={16} strokeWidth={2.4} />
              <span>Save Student</span>
            </button>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div className="empty-students card">
          <div className="empty-icon-wrap">
            <Users size={32} strokeWidth={1.8} />
          </div>
          <h2>No students enrolled yet</h2>
          <p>
            Add your first learner to start logging sessions and tracking
            tuition earnings.
          </p>
          <button className="add-student-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={2.4} />
            <span>Add Student</span>
          </button>
        </div>
      ) : (
        <div className="students-grid">
          {students.map((student) => {
            const stats = getStudentStats(student.id);
            const paymentDetails = getPaymentDetails(student);
            const initial = student.name ? student.name.charAt(0).toUpperCase() : "?";

            return (
              <div className="student-card" key={student.id}>
                <div className="student-card-top">
                  <div className="student-avatar">{initial}</div>
                  <div className="student-info-main">
                    <h2>{student.name}</h2>
                    <span className="student-class-tag">
                      {student.className || "Standard"}
                    </span>
                  </div>
                </div>

                <div className="student-rate">
                  <span className="rate-label">{paymentDetails.label}</span>
                  <strong className="rate-amount">
                    {paymentDetails.rateDisplay}
                  </strong>
                </div>

                <div className="student-stats">
                  <div className="stat-pill">
                    <span className="stat-pill-label">Classes</span>
                    <strong className="stat-pill-val">{stats.classes}</strong>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">Time</span>
                    <strong className="stat-pill-val">
                      {formatDuration(stats.minutes)}
                    </strong>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-pill-label">This Month</span>
                    <strong className="stat-pill-val stat-pill-val--earn">
                      ₹{stats.earning.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="student-card-actions">
                  <button
                    className="delete-student"
                    onClick={() => deleteStudent(student.id)}
                    title="Delete Student"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Students;
