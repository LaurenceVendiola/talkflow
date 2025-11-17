import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdPerson } from 'react-icons/io';
import { LuBookOpenText } from 'react-icons/lu';
import { FaMicrophone } from 'react-icons/fa';
import { RiSpeakLine } from 'react-icons/ri';
import './SessionOptions.css';
import WavUploader from './WavUploader';
import Sidebar from '../Sidebar/Sidebar';
import { getPatients, addSession } from '../../utils/store';
import { analyzeAudioFile, formatAnalysisResults, checkServerHealth } from '../../services/disfluencyAnalyzer';

export default function SessionOptionsForm() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sessionType, setSessionType] = useState('reading');
  const [startMethod, setStartMethod] = useState('record');
  const [patients, setPatients] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    function load() {
      setPatients(getPatients());
      // default select first if exists
      const list = getPatients();
      if (list.length > 0 && selectedPatient === null) setSelectedPatient(list[0].patientId);
    }
    load();
    window.addEventListener('tf:patients-updated', load);
    return () => window.removeEventListener('tf:patients-updated', load);
  }, []);

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="session-options-root">
      <header className="so-header">
        <h1>Start New Session</h1>
        <p className="so-sub">Select a patient and session type to begin.</p>
      </header>

      <section className="so-section">
        <h3>1. Select Patient</h3>
        <div className="patient-select-header">
          <div className="patient-select-actions">
            <input
              className="patient-search"
              type="search"
              placeholder="Search patients..."
              value={patientQuery}
              onChange={e => setPatientQuery(e.target.value)}
              aria-label="Search patients by name"
            />
          </div>
        </div>
        <div className="patient-list">
          {(() => {
            const q = (patientQuery || '').trim().toLowerCase();
            const filtered = q === '' ? patients : patients.filter(p => (`${p.firstName} ${p.lastName}`).toLowerCase().includes(q));
            if (patients.length === 0) return <div className="patient-empty">No patients yet — add one first.</div>;
            if (filtered.length === 0) return <div className="patient-empty">No matching patients</div>;
            return filtered.map((p) => (
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

          <button type="button" className="patient-card add-new" onClick={() => navigate('/Patient')}>
            <div className="patient-avatar plus">+</div>
            <div className="patient-name">Add New</div>
          </button>
        </div>
      </section>

      <section className="so-section">
        <h3>2. Choose Session Type</h3>
        <div className="type-row">
          <button
            className={`type-card ${sessionType === 'free' ? 'selected' : ''}`}
            onClick={() => setSessionType('free')}
          >
            <div className="type-icon"><RiSpeakLine /></div>
            <div className="type-title">Free Speech</div>
            <div className="type-desc">Analyze spontaneous speech.</div>
          </button>

          <button
            className={`type-card ${sessionType === 'reading' ? 'selected' : ''}`}
            onClick={() => setSessionType('reading')}
          >
            <div className="type-icon"><LuBookOpenText /></div>
            <div className="type-title">Reading Passage</div>
            <div className="type-desc">Use a standardized text.</div>
          </button>
        </div>
      </section>

      <section className="so-section start-grid">
        <h3>3. Start Session</h3>
        <div className="start-row">
          <WavUploader
            className={`upload-card ${startMethod === 'upload' ? 'selected' : ''}`}
            onActivate={() => setStartMethod('upload')}
            onFileSelected={(f) => {
              setStartMethod('upload');
              setUploadedFile(f);
              setAnalysisError('');
              console.log('WavUploader selected file:', f);
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
            disabled={isAnalyzing}
            onClick={async () => {
              if (!selectedPatient) {
                alert('Please select a patient first');
                return;
              }

              setAnalysisError('');

              // For upload method, analyze the file with Python API
              if (startMethod === 'upload' && uploadedFile) {
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
                    type: sessionType === 'reading' ? 'Reading Passage' : 'Free Speech',
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
              } else if (startMethod === 'record') {
                // For recording method, use mock data for now
                const soundRepetitions = Math.floor(Math.random() * 10) + 1;
                const prolongations = Math.floor(Math.random() * 10) + 1;
                const interjections = Math.floor(Math.random() * 10) + 1;
                const blocks = Math.floor(Math.random() * 10) + 1;
                const wordRepetitions = Math.floor(Math.random() * 10) + 1;
                
                const session = {
                  id: `s_${Date.now()}`,
                  patientId: selectedPatient,
                  date: new Date().toLocaleDateString(),
                  type: sessionType === 'reading' ? 'Reading Passage' : 'Free Speech',
                  method: 'Recording',
                  results: {
                    disfluencies: { soundRepetitions, prolongations, interjections, blocks, wordRepetitions }
                  },
                  createdAt: new Date().toISOString()
                };
                addSession(session);
                navigate('/Session', { state: { sessionId: session.id } });
              } else {
                alert('Please upload an audio file or select recording method');
              }
            }}
          >
            {isAnalyzing ? '⏳ Analyzing...' : '▶ Start Session'}
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
