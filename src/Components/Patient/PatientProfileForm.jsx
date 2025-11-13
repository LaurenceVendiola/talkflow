import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { findPatientById, getSessionsForPatient } from '../../utils/store';
import Sidebar from '../Sidebar/Sidebar';
import './PatientProfile.css';
import { savePatient, deletePatient } from '../../utils/store';

function formatDateForInput(dob) {
  if (!dob) return '';
  // try to parse common formats
  const dt = new Date(dob);
  if (!isNaN(dt.getTime())) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  // fallback: return raw string
  return dob;
}

function PatientEditor({ patient, setPatient, forceEdit, onEditingChange }) {
  const [editing, setEditing] = React.useState(!!forceEdit);
  const [form, setForm] = React.useState({});

  React.useEffect(() => {
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      age: patient.age || '',
      dob: formatDateForInput(patient.dob) || '',
      gender: patient.gender || '',
      notes: patient.notes || ''
    });
  }, [patient]);

  React.useEffect(() => {
    if (forceEdit) setEditing(true);
  }, [forceEdit]);

  function updateField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function onSave() {
    // build updated patient
    const updated = {
      ...patient,
      firstName: form.firstName,
      lastName: form.lastName,
      age: form.age === '' ? null : Number(form.age),
      dob: form.dob,
      gender: form.gender,
      notes: form.notes
    };
    // optimistic update in UI
    setPatient(updated);
    setEditing(false);
    // persist
    try {
      savePatient(updated);
      if (typeof onEditingChange === 'function') onEditingChange(false);
    } catch (e) {
      console.error('Failed to save patient', e);
    }
  }

  function onCancel() {
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      age: patient.age || '',
      dob: formatDateForInput(patient.dob) || '',
      gender: patient.gender || '',
      notes: patient.notes || ''
    });
    setEditing(false);
    if (typeof onEditingChange === 'function') onEditingChange(false);
  }

  return (
    <div className="patient-editor">
      {!editing ? (
        <div className="info-display">
          <div className="info-row"><span className="label">First Name</span><span className="value">{patient.firstName}</span></div>
          <div className="info-row"><span className="label">Last Name</span><span className="value">{patient.lastName}</span></div>
          <div className="info-row"><span className="label">Age</span><span className="value">{patient.age != null ? patient.age : '-'}</span></div>
          <div className="info-row"><span className="label">Date of Birth</span><span className="value">{patient.dob || '-'}</span></div>
          <div className="info-row"><span className="label">Gender</span><span className="value">{patient.gender || '-'}</span></div>
          <div className="info-row full"><span className="label">Notes</span><p className="value notes">{patient.notes}</p></div>
          {/* Edit button removed - use header menu to Edit/Delete */}
        </div>
      ) : (
        <form className="info-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <label className="form-row"><span className="label">First Name</span><input className="tf-input" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} /></label>
          <label className="form-row"><span className="label">Last Name</span><input className="tf-input" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} /></label>
          <label className="form-row"><span className="label">Age</span><input className="tf-input" type="number" min="0" value={form.age} onChange={e => updateField('age', e.target.value)} /></label>
          <label className="form-row"><span className="label">Date of Birth</span><input className="tf-input" type="date" value={form.dob} onChange={e => updateField('dob', e.target.value)} /></label>
          <label className="form-row"><span className="label">Gender</span>
            <select className="tf-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
              <option value="">Not specified</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label className="form-row full"><span className="label">Notes</span><textarea className="tf-textarea" value={form.notes} onChange={e => updateField('notes', e.target.value)} /></label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-light" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-green">Save</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PatientProfileForm() {
  const navigate = useNavigate();

  const location = useLocation();
  const [patient, setPatient] = React.useState(null);
  const [sessions, setSessions] = React.useState([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [forceEdit, setForceEdit] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  function handleDelete() {
    // open modal from menu
    setMenuOpen(false);
    setShowDeleteModal(true);
  }

  async function handleConfirmDelete() {
    setShowDeleteModal(false);
    if (!patient || !patient.patientId) return;
    try {
      await deletePatient(patient.patientId);
      // navigate back to home after deletion
      navigate('/Home');
    } catch (e) {
      console.error('Failed to delete patient', e);
      alert('Failed to delete patient. See console for details.');
    }
  }

  React.useEffect(() => {
    // prefer patientId passed via state
    const patientId = location && location.state && (location.state.patientId || (location.state.patient && location.state.patient.patientId));
    if (patientId) {
      const p = findPatientById(patientId);
      setPatient(p);
      setSessions(getSessionsForPatient(patientId).sort((a,b)=> b.createdAt.localeCompare(a.createdAt)));
    } else if (location && location.state && location.state.patient) {
      // fallback to full patient object
      setPatient(location.state.patient);
      setSessions([]);
    } else {
      // no state provided — leave null
      setPatient(null);
      setSessions([]);
    }
  }, [location]);

  // sessions state is populated from the store in useEffect

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="patient-profile-root">
        <header className="pp-header">
          <div>
            <h1>{patient ? `${patient.firstName} ${patient.lastName}` : 'Patient not found'}</h1>
            <p className="pp-sub">Patient profile and session history</p>
          </div>

          <div className="pp-actions">
            <button className="btn-green" onClick={() => navigate('/SessionOptions')}>New Session</button>
          </div>
        </header>

        <section className="pp-main">
          <div className="pp-left">
            <div className="info-card">
              <div className="info-card-header">
                <h3>Basic Information</h3>
                <div className="info-card-menu">
                  <button className="dot-menu" onClick={() => setMenuOpen(o => !o)} aria-haspopup="true" aria-expanded={menuOpen}>⋮</button>
                  {menuOpen && (
                    <div className="menu-pop" role="menu">
                      <button className="menu-item" onClick={() => { setForceEdit(true); setMenuOpen(false); }}>Edit</button>
                      <button className="menu-item delete" onClick={handleDelete}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
              {patient ? (
                <PatientEditor patient={patient} setPatient={setPatient} forceEdit={forceEdit} onEditingChange={setForceEdit} />
              ) : (
                <div>No patient selected.</div>
              )}
            </div>
            {showDeleteModal && (
              <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete patient">
                <div className="modal-box">
                  <h2>Are you absolutely sure?</h2>
                  <p className="muted">This action cannot be undone. This will permanently delete the patient record for <strong>{patient ? `${patient.firstName} ${patient.lastName}` : ''}</strong> and remove all associated data from our servers including:</p>
                  <ul className="delete-list">
                    <li>Personal information</li>
                    <li>Session records</li>
                  </ul>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    <button className="btn-green" onClick={handleConfirmDelete}>Delete</button>
                  </div>
                </div>
              </div>
            )}
            {/* Replace latest summary with a simple line chart of total dysfluencies across sessions */}
            <div className="results-card">
              <h3>Total Dysfluencies Over Time</h3>
              {sessions && sessions.length > 0 ? (
                <div className="dys-chart" role="img" aria-label="Total dysfluencies over sessions">
                  {(() => {
                    // prepare totals oldest -> newest
                    const ordered = sessions.slice().reverse();
                    const totals = ordered.map(s => {
                      const d = (s.results && s.results.disfluencies) || {};
                      return (Number(d.soundRepetitions || 0) + Number(d.wordRepetitions || 0) + Number(d.prolongations || 0) + Number(d.interjections || 0) + Number(d.blocks || 0));
                    });
                    const labels = ordered.map(s => s.date || s.createdAt || '');

                    const w = 600; const h = 160; const pad = 28;
                    const n = totals.length;
                    const min = Math.min(...totals, 0);
                    const max = Math.max(...totals, 1);
                    const xFor = i => pad + (n > 1 ? (i * (w - pad * 2) / (n - 1)) : (w / 2));
                    const yFor = v => pad + (1 - ( (v - min) / (max - min || 1) )) * (h - pad * 2);

                    const points = totals.map((t, i) => `${xFor(i)},${yFor(t)}`);
                    const pathD = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ');

                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="chart-svg">
                        {/* area fill */}
                        <path d={`${pathD} L ${xFor(n-1)},${h - pad} L ${xFor(0)},${h - pad} Z`} fill="rgba(83,209,19,0.08)" stroke="none" />
                        {/* line */}
                        <path d={pathD} fill="none" stroke="var(--tf-green)" strokeWidth={2.3} strokeLinejoin="round" strokeLinecap="round" />
                        {/* points */}
                        {totals.map((t, i) => {
                          const x = xFor(i); const y = yFor(t);
                          return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--tf-green)" />;
                        })}
                        {/* x labels: show up to first, middle, last to avoid clutter */}
                        {(() => {
                          const idxs = n <= 3 ? [...Array(n).keys()] : [0, Math.floor((n-1)/2), n-1];
                          return idxs.map((i, k) => (
                            <text key={k} x={xFor(i)} y={h - 6} fontSize="10" fill="#666" textAnchor="middle">{labels[i]}</text>
                          ));
                        })()}
                      </svg>
                    );
                  })()}
                </div>
              ) : (
                <div>No session results for this patient yet.</div>
              )}
            </div>
          </div>

          <div className="pp-right">
            <h3>Session History</h3>
            <div className="session-list">
              {sessions.map(s => (
                <div key={s.id} className="session-card">
                  <div className="session-head">
                    <div className="session-date">{s.date}</div>
                    <div className="session-type">{s.type} · {s.method}</div>
                  </div>

                  <div className="session-body">
                    <div className="sr-breakdown">
                      <div><small>Sound Repetitions</small><div>{s.results.disfluencies.soundRepetitions}</div></div>
                      <div><small>Word Repetitions</small><div>{s.results.disfluencies.wordRepetitions}</div></div>
                      <div><small>Prolongations</small><div>{s.results.disfluencies.prolongations}</div></div>
                      <div><small>Interjections</small><div>{s.results.disfluencies.interjections}</div></div>
                      <div><small>Blocks</small><div>{s.results.disfluencies.blocks}</div></div>
                    </div>
                  </div>

                  <div className="session-actions">
                    <button className="btn-light" onClick={() => navigate('/Session', { state: { sessionId: s.id } })}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
