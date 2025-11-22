import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoMdPerson } from 'react-icons/io';
import { FaMicrophone } from 'react-icons/fa';
import './SessionOptions.css';
import AudioUploader from './AudioUploader';
import Sidebar from '../Sidebar/Sidebar';
import { getPatients, addSession } from '../../utils/store';
import { analyzeAudioFile, formatAnalysisResults, checkServerHealth } from '../../services/disfluencyAnalyzer';

export default function SessionOptionsForm() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [startMethod, setStartMethod] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function load() {
      setPatients(getPatients());
    }
    load();
    window.addEventListener('tf:patients-updated', load);
    return () => window.removeEventListener('tf:patients-updated', load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-select patient from navigation state
    if (location && location.state && location.state.patientId) {
      setSelectedPatient(location.state.patientId);
    }
  }, [location]);

  const handleAnalysisComplete = (session) => {
    addSession(session);
    navigate('/Session', { state: { sessionId: session.id } });
  };

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="session-options-root">
        <div className="session-options-container">
          <header className="so-header">
            <h1>Start New Session</h1>
            <p className="so-sub">Select a patient and choose to upload audio or record live</p>
          </header>

          <section className="so-section">
        <h3>Select Patient</h3>
        <div className="patient-select-header">
          <div className="patient-select-actions">
            <input
              className="patient-search"
              type="search"
              placeholder="Search Patients"
              value={patientQuery}
              onChange={e => setPatientQuery(e.target.value)}
              aria-label="Search patients by name"
            />
          </div>
        </div>
        
        <div className="patient-list">
          {patientQuery.trim() === '' && (
            <button type="button" className="patient-card add-new" onClick={() => navigate('/Patient')}>
              <div className="patient-avatar plus">+</div>
              <div className="patient-name">Add New</div>
            </button>
          )}

          {(() => {
            const q = (patientQuery || '').trim().toLowerCase();
            const filtered = q === '' ? patients : patients.filter(p => (`${p.firstName} ${p.lastName}`).toLowerCase().includes(q));
            
            // Always show selected patient first (even when not searching)
            let displayPatients = filtered;
            if (selectedPatient) {
              const selected = patients.find(p => p.patientId === selectedPatient);
              if (selected) {
                // Remove selected from filtered if present, then add to beginning
                displayPatients = [selected, ...filtered.filter(p => p.patientId !== selectedPatient)];
              }
            }
            
            if (patients.length === 0) return null;
            if (displayPatients.length === 0 && q !== '') return <div className="patient-empty">No matching patients</div>;
            return displayPatients.map((p) => (
              <button
                key={p.patientId}
                className={`patient-card ${selectedPatient === p.patientId ? 'selected' : ''}`}
                onClick={() => setSelectedPatient(p.patientId)}
              >
                <div className="patient-avatar"><IoMdPerson /></div>
                <div className="patient-name">{p.firstName} {p.lastName}</div>
              </button>
            ));
          })()}
        </div>
      </section>

      

      <section className="so-section start-grid">
        <h3>Choose Your Approach</h3>
        <div className="start-row">
          <AudioUploader
            className={`upload-card ${startMethod === 'upload' ? 'selected' : ''}`}
            onActivate={() => setStartMethod('upload')}
            onFileSelected={(f) => {
              setStartMethod('upload');
              setUploadedFile(f);
              setAnalysisError('');
            }}
            maxSizeBytes={10 * 1024 * 1024}
          />

          <button
            type="button"
            className={`record-card ${startMethod === 'record' ? 'selected' : ''}`}
            onClick={() => setStartMethod('record')}
            aria-pressed={startMethod === 'record'}
          >
            <div className="record-icon"><FaMicrophone /></div>
            <div className="record-title">Start Recording</div>
            <div className="record-sub">Record audio directly in the browser</div>
          </button>
        </div>

        <div className="start-cta-wrap">
          {analysisError && (
            <div className="analysis-error" role="alert">{analysisError}</div>
          )}
          <button
            type="button"
            className="start-cta"
            disabled={isAnalyzing || !selectedPatient || !startMethod}
            onClick={async () => {
              if (!selectedPatient) {
                alert('Please select a patient first');
                return;
              }

              setAnalysisError('');

              // For recording method, navigate to RecordingForm
              if (startMethod === 'record') {
                navigate('/Recording', { state: { patientId: selectedPatient } });
              } else if (startMethod === 'upload' && uploadedFile) {
                setIsAnalyzing(true);
                try {
                  // Check if server is running
                  await checkServerHealth();

                  // Analyze the audio file
                  const analysisResult = await analyzeAudioFile(uploadedFile);
                  const formattedResults = formatAnalysisResults(analysisResult);

                  // Create audio URL for playback in session view
                  const audioURL = URL.createObjectURL(uploadedFile);

                  // Create session with real analysis results
                  const session = {
                    id: `s_${Date.now()}`,
                    patientId: selectedPatient,
                    date: new Date().toLocaleDateString(),
                    method: 'Upload',
                    audioFileName: uploadedFile.name,
                    audioURL: audioURL,
                    detections: formattedResults.detections || [],
                    audioDuration: analysisResult.duration || 30,
                    results: {
                      disfluencies: formattedResults.disfluencies
                    },
                    createdAt: new Date().toISOString()
                  };
                  addSession(session);
                  navigate('/Session', { state: { sessionId: session.id } });
                } catch (error) {
                  console.error('Analysis error:', error);
                  setAnalysisError(error.message || 'Analysis failed. Please try again.');
                } finally {
                  setIsAnalyzing(false);
                }
              } else {
                alert('Please select a valid option');
              }
            }}
          >
            {isAnalyzing ? ' ANALYZING' : 'START SESSION'}
          </button>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}
