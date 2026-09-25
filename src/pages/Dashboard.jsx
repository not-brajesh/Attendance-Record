import { useEffect, useState } from "react";
import { db } from "../db/database";
import StatCard from "../components/StatCard";
import {
  calculateMinutes,
  calculateEarning,
  formatDuration,
} from "../utils/calculations";
import { getLocalDate, getMonthStart, getMonthEnd } from "../utils/dateUtils";
import "./Dashboard.css";

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const studentData = await db.students.toArray();
    const attendanceData = await db.attendance.toArray();

    setStudents(studentData);
    setAttendance(attendanceData);
    setLoading(false);
  };

  // ---- Student lookup map (fast) ----
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.id] = s;
  });

  // ---- Overall totals ----
  const totalMinutes = attendance.reduce(
    (t, r) => t + calculateMinutes(r.startTime, r.endTime),
    0
  );

  const totalEarning = attendance.reduce((t, r) => {
    const student = studentMap[r.studentId];
    const mins = calculateMinutes(r.startTime, r.endTime);
    return t + calculateEarning(mins, student?.hourlyRate);
  }, 0);

  // ---- This Month ----
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();

  const monthRecords = attendance.filter(
    (r) => r.date >= monthStart && r.date <= monthEnd
  );

  const monthMinutes = monthRecords.reduce(
    (t, r) => t + calculateMinutes(r.startTime, r.endTime),
    0
  );

  const monthEarning = monthRecords.reduce((t, r) => {
    const student = studentMap[r.studentId];
    const mins = calculateMinutes(r.startTime, r.endTime);
    return t + calculateEarning(mins, student?.hourlyRate);
  }, 0);

  // ---- Student-wise Summary ----
  const studentSummary = students
    .map((student) => {
      const recs = attendance.filter((r) => r.studentId === student.id);

      const minutes = recs.reduce(
        (t, r) => t + calculateMinutes(r.startTime, r.endTime),
        0
      );

      return {
        id: student.id,
        name: student.name,
        classes: recs.length,
        hours: minutes / 60,
        rate: Number(student.hourlyRate || 0),
        earning: calculateEarning(minutes, student.hourlyRate),
      };
    })
    .sort((a, b) => b.earning - a.earning);

  // ---- Today's Classes ----
  const today = getLocalDate();

  const todayRecords = attendance
    .filter((r) => r.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // ---- Loading state ----
  if (loading) {
    return <div className="dashboard-loading">Loading…</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-sub">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      {/* -------- Row 1 — Overall Stats -------- */}
      <section className="stats-grid">
        <StatCard label="Students" value={students.length} icon="👥" />
        <StatCard label="Total Classes" value={attendance.length} icon="📚" />
        <StatCard
          label="Teaching Hours"
          value={formatDuration(totalMinutes)}
          icon="⏱️"
        />
        <StatCard
          label="Total Earnings"
          value={`₹${totalEarning.toFixed(0)}`}
          icon="💰"
          accent
        />
      </section>

      {/* -------- Row 2 — This Month -------- */}
      <section className="dashboard-section">
        <h2 className="section-title">This Month</h2>

        <div className="stats-grid month-grid">
          <StatCard label="Classes" value={monthRecords.length} icon="📖" />
          <StatCard
            label="Hours"
            value={formatDuration(monthMinutes)}
            icon="🕒"
          />
          <StatCard
            label="Earnings"
            value={`₹${monthEarning.toFixed(0)}`}
            icon="💵"
            accent
          />
        </div>
      </section>

      {/* -------- Row 3 — Student Summary + Today -------- */}
      <section className="dashboard-columns">
        {/* Student Summary */}
        <div className="dashboard-panel">
          <h2 className="section-title">Student Summary</h2>

          {studentSummary.length === 0 ? (
            <p className="empty-text">No students added yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Classes</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Earnings</th>
                  </tr>
                </thead>

                <tbody>
                  {studentSummary.map((s) => (
                    <tr key={s.id}>
                      <td className="cell-strong">{s.name}</td>
                      <td>{s.classes}</td>
                      <td>{s.hours.toFixed(1)}</td>
                      <td>₹{s.rate}</td>
                      <td className="cell-earn">₹{s.earning.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Today's Classes */}
        <div className="dashboard-panel">
          <h2 className="section-title">Today's Classes</h2>

          {todayRecords.length === 0 ? (
            <p className="empty-text">No classes scheduled today.</p>
          ) : (
            <ul className="today-list">
              {todayRecords.map((r) => {
                const student = studentMap[r.studentId];
                const mins = calculateMinutes(r.startTime, r.endTime);

                return (
                  <li key={r.id} className="today-item">
                    <div className="today-main">
                      <span className="today-name">
                        {student?.name || "Unknown"}
                      </span>
                      <span className="today-time">
                        {r.startTime} – {r.endTime}
                      </span>
                    </div>

                    <span className="today-duration">
                      {formatDuration(mins)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;