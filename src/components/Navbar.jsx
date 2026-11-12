import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Download,
  Zap,
} from "lucide-react";
import "./Navbar.css";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/students", label: "Students", icon: Users },
  { path: "/attendance", label: "Attendance", icon: CalendarCheck },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/downloads", label: "Export", icon: Download },
];

function Navbar() {
  return (
    <aside className="navbar">
      {/* Brand Header — Desktop Only */}
      <div className="navbar-brand">
        <div className="brand-icon">
          <Zap size={20} strokeWidth={2.4} />
        </div>
        <div className="brand-titles">
          <h2>Tuition</h2>
          <span>Attendance</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="nav-menu">
        {NAV_ITEMS.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            <Icon size={19} className="nav-icon" strokeWidth={2} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer — Desktop Only */}
      <div className="sidebar-footer">
        <span className="offline-pill">Offline · Local</span>
      </div>
    </aside>
  );
}

export default Navbar;
