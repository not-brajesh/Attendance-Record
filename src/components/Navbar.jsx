import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Download,
  Zap,
} from "lucide-react";
import "./Navbar.css";

function Navbar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Zap size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h2>Tuition</h2>
          <span>Attendance</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end>
          <span>
            <LayoutDashboard size={20} strokeWidth={2} />
          </span>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        <NavLink to="/students">
          <span>
            <Users size={20} strokeWidth={2} />
          </span>
          <span className="nav-label">Students</span>
        </NavLink>

        <NavLink to="/attendance">
          <span>
            <ClipboardCheck size={20} strokeWidth={2} />
          </span>
          <span className="nav-label">Attendance</span>
        </NavLink>

        <NavLink to="/reports">
          <span>
            <FileText size={20} strokeWidth={2} />
          </span>
          <span className="nav-label">Reports</span>
        </NavLink>

        <NavLink to="/downloads">
          <span>
            <Download size={20} strokeWidth={2} />
          </span>
          <span className="nav-label">Export History</span>
          <span className="nav-label-short">Export</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>Offline • Local Storage</span>
      </div>
    </aside>
  );
}

export default Navbar;