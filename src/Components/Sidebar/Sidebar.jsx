import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { PiUsersThreeFill, PiUserSoundFill } from 'react-icons/pi';
import logo from './talkflow_logo_sidebar.png';
import './Sidebar.css';
import useAuth from '../../hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);

  const isSessionsActive = ['/SessionOptions', '/Recording', '/Session'].includes(location.pathname);
  const isDashboardActive = ['/Home', '/PatientProfile'].includes(location.pathname);

  
  const displayName = user
    ? `${user.firstName || ''}${user.lastName ? ' ' + (user.lastName.charAt(0).toUpperCase() + '.') : ''}`.trim()
    : '';

  async function handleLogout() {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Sign out failed', e);
    }
    navigate('/LogIn');
  }
  return (
    <aside className="tf-sidebar">
      <div className="sidebar-top">
        <img src={logo} alt="talkflow" className="tf-logo" />
        <span className="tf-wordmark">talkflow</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/Home"
          className={isDashboardActive ? 'nav-item active' : 'nav-item'}
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
          to="/SessionOptions"
          className={isSessionsActive ? 'nav-item active' : 'nav-item'}
        >
          <PiUserSoundFill className="nav-icon" />
          <span className="nav-label">SESSIONS</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-avatar" role="button" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>{user ? ( (user.firstName || '').charAt(0).toUpperCase() || '') : ''}</div>
  <div className="sidebar-username">{displayName}</div>

        {menuOpen && (
          <div className="sidebar-menu-pop" role="menu">
            <button className="sidebar-menu-item" onClick={() => { setViewProfileOpen(true); setMenuOpen(false); }}>View profile</button>
            <button className="sidebar-menu-item" onClick={handleLogout}>Log out</button>
          </div>
        )}

        {viewProfileOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="User profile">
            <div className="modal-box">
              <h2>Your Profile</h2>
              <p><strong>Name:</strong> {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}</p>
              <p><strong>Email:</strong> {user ? user.email : ''}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn-light" onClick={() => setViewProfileOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
