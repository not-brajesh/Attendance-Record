import { useEffect, useState } from "react";
import { db } from "../db/database";
import {
  calculateMinutes,
  calculateEarning,
  formatDuration,
} from "../utils/calculations";
import {
  getMonthStart,
  getMonthEnd,
} from "../utils/dateUtils";
import "./Students.css";

function Students() {
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const studentData = await db.students.toArray();
    const attendanceData = await db.attendance.toArray();

    setStudents(studentData);
    setAttendance(attendanceData);
  };

  const addStudent = async () => {
    if (!name.trim()) {
      alert("Please enter student name.");
      return;
    }

    await db.students.add({
      name: name.trim(),
      className: className.trim(),
      hourlyRate: Number(hourlyRate) || 0,
      createdAt: new Date().toISOString(),
    });

    setName("");
    setHourlyRate("");
    setClassName("");
    setShowForm(false);

    loadData();
  };

  const deleteStudent = async (id) => {
    const student = students.find(
      (s) => s.id === id
    );

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
        total +
        calculateMinutes(
          record.startTime,
          record.endTime
        ),
      0
    );

    const student = students.find(
      (s) => s.id === studentId
    );

    return {
      classes: records.length,
      minutes,
      earning: calculateEarning(
        minutes,
        student?.hourlyRate
      ),
    };
  };

  return (
    <div className="students-page">

      <div className="students-header">
        <div>
          <h1>Students</h1>
          <p>
            Manage your students and tuition details
          </p>
        </div>

        <button
          className="add-student-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + Add Student
        </button>
      </div>

      {showForm && (
        <div className="student-form">

          <h2>Add Student</h2>

          <div className="form-grid">

            <div className="form-field">
              <label>Student Name</label>

              <input
                type="text"
                placeholder="e.g. Rahul"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Class</label>

              <input
                type="text"
                placeholder="e.g. Class 7"
                value={className}
                onChange={(e) =>
                  setClassName(e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Hourly Rate</label>

              <input
                type="number"
                placeholder="₹300"
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(e.target.value)
                }
              />
            </div>

          </div>

          <div className="form-actions">
            <button
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button
              className="save-btn"
              onClick={addStudent}
            >
              Add Student
            </button>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div className="empty-students">
          <h2>No students yet</h2>
          <p>
            Add your first student to start tracking
            tuition classes.
          </p>

          <button
            onClick={() => setShowForm(true)}
          >
            + Add Student
          </button>
        </div>
      ) : (
        <div className="students-grid">

          {students.map((student) => {

            const stats = getStudentStats(
              student.id
            );

            return (
              <div
                className="student-card"
                key={student.id}
              >

                <div className="student-card-top">

                  <div className="student-avatar">
                    {student.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2>{student.name}</h2>

                    <p>
                      {student.className ||
                        "Class not specified"}
                    </p>
                  </div>

                </div>

                <div className="student-rate">
                  <span>Hourly Rate</span>

                  <strong>
                    ₹{student.hourlyRate || 0}
                  </strong>
                </div>

                <div className="student-stats">

                  <div>
                    <span>Classes</span>
                    <strong>
                      {stats.classes}
                    </strong>
                  </div>

                  <div>
                    <span>Hours</span>
                    <strong>
                      {formatDuration(
                        stats.minutes
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Earnings</span>
                    <strong>
                      ₹{stats.earning.toFixed(0)}
                    </strong>
                  </div>

                </div>

                <div className="student-actions">

                  <button
                    className="delete-student"
                    onClick={() =>
                      deleteStudent(student.id)
                    }
                  >
                    Delete
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
