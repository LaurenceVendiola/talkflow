import React, { useState } from 'react';
import './Patient.css';
import Sidebar from '../Sidebar/Sidebar';

export default function PatientForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');

  const handleCancel = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setDob('');
    setGender('');
    setNotes('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire up save logic
    console.log('New patient', { firstName, lastName, email, dob, gender, notes });
    alert('Patient added (demo)');
    handleCancel();
  };

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="patient-root">
      <h1>Add New Patient</h1>
      <p className="patient-sub">Enter the patient's details below to create a new profile.</p>

      <form className="patient-form" onSubmit={handleSubmit}>
        <div className="row two">
          <div className="field">
            <label>First Name</label>
            <input className="input" placeholder="e.g., John" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          </div>
          <div className="field">
            <label>Last Name</label>
            <input className="input" placeholder="e.g., Doe" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="field full">
            <label>Email Address</label>
            <input className="input" placeholder="e.g., john.doe@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
        </div>

        <div className="row two">
          <div className="field">
            <label>Date of Birth</label>
            <input className="input" type="date" value={dob} onChange={(e)=>setDob(e.target.value)} />
          </div>
          <div className="field">
            <label>Gender</label>
            <select className="select" value={gender} onChange={(e)=>setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field full">
            <label>Initial Notes</label>
            <textarea className="textarea" placeholder="Any initial observations or background information..." value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="btn-green">Add Patient</button>
        </div>
      </form>
      </div>
    </div>
  );
}
