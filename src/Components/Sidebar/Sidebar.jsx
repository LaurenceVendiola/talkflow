import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { PiUsersThreeFill, PiUserSoundFill } from 'react-icons/pi';
import logo from './talkflow_logo_sidebar.png';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="tf-sidebar">
      <div className="sidebar-top">
        <img src={logo} alt="talkflow" className="tf-logo" />
        <span className="tf-wordmark">talkflow</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/Home"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <FaHome className="nav-icon" />
          <span className="nav-label">DASHBOARD</span>
        </NavLink>

        <NavLink
          to="/Patient"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <PiUsersThreeFill className="nav-icon" />
          <span className="nav-label">PATIENTS</span>
        </NavLink>

        <NavLink
          to="/Session"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <PiUserSoundFill className="nav-icon" />
          <span className="nav-label">SESSIONS</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
