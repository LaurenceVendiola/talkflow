import React from 'react';
import './Home.css';
import Sidebar from '../Sidebar/Sidebar';

export default function HomeForm() {
  // Static/dummy data to match the provided UI
  const stats = { patients: 5, sessions: 9 };
  const patients = [
    { name: 'Marc Zelo', age: 8, sessions: 1, last: '10/5/2025' },
    { name: 'Lope Jena', age: 12, sessions: 2, last: '10/3/2025' },
    { name: 'Andre Bon', age: 11, sessions: 2, last: '10/2/2025' },
    { name: 'Josefa Riza', age: 9, sessions: 2, last: '10/1/2025' },
    { name: 'Emi Aldo', age: 7, sessions: 2, last: '9/31/2025' }
  ];

  const sessions = [
    { date: 'October 5, 2025', patient: 'Marc Zelo' },
    { date: 'October 3, 2025', patient: 'Lope Jena' },
    { date: 'October 2, 2025', patient: 'Andre Bon' },
    { date: 'October 1, 2025', patient: 'Josefa Riza' },
    { date: 'September 30, 2025', patient: 'Emi Aldo' },
    { date: 'September 26, 2025', patient: 'Lope Jena' },
    { date: 'September 25, 2025', patient: 'Andre Bon' },
    { date: 'September 24, 2025', patient: 'Josefa Riza' },
    { date: 'September 23, 2025', patient: 'Emi Aldo' }
  ];

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="home-root">
      <div className="home-header">
        <div>
          <h1>Welcome back, Maria!</h1>
          <p className="home-sub">Let's see how your patients are progressing today.</p>
        </div>
        <div className="avatar"> 
          <div className="avatar-circle">M</div>
        </div>
      </div>

      <section className="overview">
        <h3>Overview</h3>
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Patients</div>
            <div className="stat-value">{stats.patients}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sessions</div>
            <div className="stat-value">{stats.sessions}</div>
          </div>
        </div>
      </section>

      <section className="patients">
        <div className="patients-header">
          <h4>Patients</h4>
          <button className="btn-green">ADD NEW PATIENT</button>
        </div>
        <p className="patients-sub">Manage patient profiles, track their progress, and celebrate every step toward confident communication.</p>

        <div className="patient-list">
          {patients.map((p) => (
            <div className="patient-card" key={p.name}>
              <div className="patient-name">{p.name}</div>
              <div className="patient-meta">Age {p.age}</div>
              <div className="patient-meta">Sessions {p.sessions}</div>
              <div className="patient-meta small">Last Session {p.last}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="sessions">
        <div className="sessions-header">
          <h4>Sessions</h4>
          <button className="btn-orange">START NEW SESSION</button>
        </div>
        <p className="sessions-sub">Review your patient's speech sessions, analyze results, and track every step toward fluent communication.</p>

        <table className="sessions-table">
          <thead>
            <tr>
              <th>Last Session</th>
              <th>Patient Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i}>
                <td>{s.date}</td>
                <td>{s.patient}</td>
                <td><a href="#">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
    </div>
  );
}
