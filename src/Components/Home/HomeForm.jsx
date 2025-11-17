import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Sidebar from '../Sidebar/Sidebar';
import { getPatients, getSessions } from '../../utils/store';

export default function HomeForm() {
 
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');

  useEffect(() => {
    function load() {
      setPatients(getPatients());
      // sort sessions newest -> oldest by createdAt
      const sess = getSessions();
      sess.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setSessions(sess);
    }

    load();
    window.addEventListener('tf:patients-updated', load);
    window.addEventListener('tf:sessions-updated', load);
    return () => {
      window.removeEventListener('tf:patients-updated', load);
      window.removeEventListener('tf:sessions-updated', load);
    };
  }, []);

  const stats = { patients: patients.length, sessions: sessions.length };

  // flatten sessions for table with patient name lookup (already sorted newest -> oldest)
  const sessionsForTable = sessions.map(s => {
    const p = patients.find(x => x.patientId === s.patientId);
    return { id: s.id, date: s.date || s.createdAt, patient: p ? `${p.firstName} ${p.lastName}` : 'Unknown' };
  });

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="home-root">
      <div className="home-header">
        <div>
          <h1>Welcome back, {user && user.firstName ? user.firstName : ''}!</h1>
          <p className="home-sub">Let's see how your patients are progressing today.</p>
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
          <div className="patients-actions">
            <input
              className="patient-search"
              type="search"
              placeholder="Search Patients"
              value={patientQuery}
              onChange={e => setPatientQuery(e.target.value)}
              aria-label="Search patients by name"
            />
            <button className="btn-green" onClick={() => navigate('/Patient')}>ADD NEW PATIENT</button>
          </div>
        </div>
        <p className="patients-sub">Manage patient profiles, track their progress, and celebrate every step toward confident communication.</p>

        <div className="patient-list">
          {(() => {
            const q = (patientQuery || '').trim().toLowerCase();
            const filtered = q === '' ? patients : patients.filter(p => (`${p.firstName} ${p.lastName}`).toLowerCase().includes(q));
            if (patients.length === 0) return <div className="patient-empty">No patients yet</div>;
            if (filtered.length === 0) return <div className="patient-empty">No matching patients</div>;
            return filtered.map((p) => {
             const patientSessions = sessions.filter(s => s.patientId === p.patientId);
             const sessionCount = patientSessions.length;
             const latest = sessionCount > 0 ? (patientSessions[0].date || patientSessions[0].createdAt) : '-';
             return (
             <button
               type="button"
               key={p.patientId}
               className="patient-card"
               onClick={() => navigate('/PatientProfile', { state: { patientId: p.patientId } })}
             >
               <div className="patient-name">{p.firstName} {p.lastName}</div>
               <table className="patient-meta-table" aria-hidden="false">
                 <tbody>
                   <tr>
                     <td className="meta-label">Age</td>
                     <td className="meta-value">{p.age != null ? p.age : '-'}</td>
                   </tr>
                   <tr>
                     <td className="meta-label">Sessions</td>
                     <td className="meta-value">{sessionCount}</td>
                   </tr>
                   <tr>
                     <td className="meta-label">Last Session</td>
                     <td className="meta-value">{latest}</td>
                   </tr>
                 </tbody>
               </table>
             </button>
            );
            });
          })()}
        </div>
      </section>

      <section className="sessions">
        <div className="sessions-header">
          <h4>Sessions</h4>
          <button className="btn-orange" onClick={() => navigate('/SessionOptions')}>START NEW SESSION</button>
        </div>
        <p className="sessions-sub">Review your patient's speech sessions, analyze results, and track every step toward fluent communication.</p>

  <div className="sessions-table-wrap">
  <table className="sessions-table">
          <thead>
            <tr>
              <th>Last Session</th>
              <th>Patient Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionsForTable.length === 0 && (
              <tr><td colSpan={3}>No sessions yet</td></tr>
            )}
            {sessionsForTable.map((s, i) => (
              <tr key={i}>
                <td>{s.date}</td>
                <td>{s.patient}</td>
                <td><a href="/" onClick={(e) => { e.preventDefault(); navigate('/Session', { state: { sessionId: s.id } }); }}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
      </div>
    </div>
  );
}
