import React, { useState } from 'react';
import './Patient.css';
import Sidebar from '../Sidebar/Sidebar';
import { savePatient } from '../../utils/store';
import { useNavigate } from 'react-router-dom';

export default function PatientForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  const handleCancel = () => {
    setFirstName('');
    setLastName('');
    setAge('');
    setDob('');
    setGender('');
    setNotes('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // create a patient with unique id
    const patient = {
      patientId: `p_${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: age ? Number(age) : null,
      dob,
      gender,
      notes
    };
    savePatient(patient);
    // navigate to profile for the created patient
    navigate('/PatientProfile', { state: { patientId: patient.patientId } });
    // reset form
    handleCancel();
  };

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="patient-root">
        <div className="patient-options-container">
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
            <label>Age</label>
            <input className="input" type="number" min="0" placeholder="e.g., 8" value={age} onChange={(e)=>setAge(e.target.value)} />
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
          <button type="button" className="btn-cancel" onClick={handleCancel}>CANCEL</button>
          <button type="submit" className="btn-green">ADD PATIENT</button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}
