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

  // Check if form is valid - all required fields must be filled
  const isFormValid = firstName.trim() !== '' && 
                      lastName.trim() !== '' && 
                      age.trim() !== '' && 
                      dob !== '' && 
                      gender !== '';

  // Handle first/last name input - only allow alphabet characters and spaces
  const handleNameChange = (value) => {
    return value.replace(/[^a-zA-Z\s]/g, '');
  };

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
    if (!isFormValid) return;
    
    // create a patient with unique id
    const patient = {
      patientId: `p_${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: age ? Number(age) : null,
      dob,
      gender,
      notes: notes.trim()
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
            <input 
              className="input" 
              placeholder="e.g., John" 
              value={firstName} 
              onChange={(e) => setFirstName(handleNameChange(e.target.value))}
              required
            />
          </div>
          <div className="field">
            <label>Last Name</label>
            <input 
              className="input" 
              placeholder="e.g., Doe" 
              value={lastName} 
              onChange={(e) => setLastName(handleNameChange(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="row two">
          <div className="field">
            <label>Age</label>
            <input 
              className="input" 
              type="number" 
              min="0" 
              max="120"
              placeholder="e.g., 8" 
              value={age} 
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Date of Birth</label>
            <input 
              className="input" 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row two">
          <div className="field">
            <label>Gender</label>
            <select 
              className="select" 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Initial Notes</label>
            <textarea 
              className="textarea" 
              placeholder="Any initial observations or background information." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>CLEAR</button>
          <button 
            type="submit" 
            className="btn-green" 
            disabled={!isFormValid}
          >
            ADD PATIENT
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}
