import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, FileText, Download } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/downloads', label: 'Export', icon: Download },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Attendance</h2>
        <span className="offline-tag">Offline • Local</span>
      </div>

      <div className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
