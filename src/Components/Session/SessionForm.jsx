import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Session.css';
import Sidebar from '../Sidebar/Sidebar';
import AttentionHeatmap from './AttentionHeatmap';
import { findSessionById, getSessions, findPatientById, deleteSession } from '../../utils/store';

export default function SessionForm() {
  const text = `When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow. Throughout the centuries people have explained the rainbow in various ways. Some have accepted it as a miracle without physical explanation. To the Hebrews it was a token that there would be no more universal floods. The Greeks used to imagine that it was a sign from the gods to foretell war or heavy rain. The Norsemen considered the rainbow as a bridge over which the gods passed from earth to their home in the sky. Others have tried to explain the phenomenon physically. Aristotle thought that the rainbow was caused by reflection of the sun's rays by the rain. Since then physicists have found that it is not reflection, but refraction by the raindrops which causes the rainbows. Many complicated ideas about the rainbow have been formed. The difference in the rainbow depends considerably upon the size of the drops, and the width of the colored band increases as the size of the drops increases. The actual primary rainbow observed is said to be the effect of super imposition of a number of bows. If the red of the second bow falls upon the green of the first, the result is to give a bow with an abnormally wide yellow band, since red and green light when mixed form yellow. This is a very common type of bow, one showing mainly red and yellow, with little or no green or blue.`;

  const navigate = useNavigate();
  const location = useLocation();
  let session = null;
  if (location && location.state && location.state.sessionId) {
    session = findSessionById(location.state.sessionId);
  }
  // fallback to latest session if no id provided
  if (!session) {
    const all = getSessions();
    if (all.length > 0) session = all[all.length - 1];
  }

  // try to resolve patient from session
  const patient = session && session.patientId ? findPatientById(session.patientId) : null;
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : null;

  const [showDeleteSessionModal, setShowDeleteSessionModal] = React.useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = React.useState(50);

  async function handleConfirmDeleteSession() {
    setShowDeleteSessionModal(false);
    if (!session || !session.id) return;
    try {
      await deleteSession(session.id);
      // after deleting a session, go to the patient profile so the user sees remaining sessions
      if (session.patientId) {
        navigate('/PatientProfile', { state: { patientId: session.patientId } });
      } else {
        navigate('/SessionOptions');
      }
    } catch (e) {
      console.error('Failed to delete session', e);
      alert('Failed to delete session. See console for details.');
    }
  }

  const results = React.useMemo(() => {
    if (!session || !session.detections) return [];
    
    const filteredDetections = session.detections.filter(d => d.confidence >= confidenceThreshold);
    
    return [
      { label: 'Sound Repetitions', value: filteredDetections.filter(d => d.type === 'SND').length },
      { label: 'Word Repetitions', value: filteredDetections.filter(d => d.type === 'WP').length },
      { label: 'Prolongations', value: filteredDetections.filter(d => d.type === 'Pro').length },
      { label: 'Interjections', value: filteredDetections.filter(d => d.type === 'Intrj').length },
      { label: 'Blocks', value: filteredDetections.filter(d => d.type === 'Block').length }
    ];
  }, [session, confidenceThreshold]);

  // Format timestamp as MM:SS.mmm
  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Format time range
  const formatTimeRange = (startSeconds, endSeconds) => {
    return `${formatTimestamp(startSeconds)} - ${formatTimestamp(endSeconds)}`;
  };

  // Get sorted detections (oldest to newest)
  const detectionLogs = React.useMemo(() => {
    return session && session.detections 
      ? [...session.detections]
          .filter(d => d.confidence >= confidenceThreshold)
          .sort((a, b) => a.start - b.start)
      : [];
  }, [session, confidenceThreshold]);

  // Debug: log detections
  React.useEffect(() => {
    if (session) {
      console.log('Session detections:', session.detections);
      console.log('Detection logs:', detectionLogs);
    }
  }, [session, detectionLogs]);

  // Map short type names to full labels
  const typeLabels = {
    'Block': 'Block',
    'WP': 'Word Repetition',
    'SND': 'Sound Repetition',
    'Pro': 'Prolongation',
    'Intrj': 'Interjection'
  };

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="session-root">
      <header className="session-header">
        <div style={{width: '100%'}}>
          <div className="session-toolbar">
            <button className="btn-back" onClick={() => navigate('/SessionOptions')}>BACK TO SESSIONS</button>
            <div style={{marginLeft: 'auto', display: 'flex', gap: 8}}>
              <button className="btn-delete" onClick={() => setShowDeleteSessionModal(true)}>DELETE</button>
            </div>
          </div>

          <h1>Speech Analysis Results</h1>
          <p className="session-sub">{patientName ? `${patientName}'s speech analysis has been completed.` : 'Your speech analysis has been completed.'}</p>
          {session && session.id && (
            <p className="session-id">Session ID: {session.id}</p>
          )}
          
          {/* Audio playback section */}
          {session && session.audioURL && (
            <div className="audio-container">
              <div className="audio-playback-section">
                <div className="audio-info">
                  <strong>Audio File:</strong> {session.audioFileName || 'Uploaded Audio'}
                </div>
                <audio controls className="audio-player" src={session.audioURL}>
                  Your browser does not support the audio element.
                </audio>
                
                {/* Attention Heatmap */}
                <AttentionHeatmap 
                  detections={session.detections || []}
                  duration={session.audioDuration || 30}
                  width={800}
                  height={200}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {showDeleteSessionModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete session">
          <div className="modal-box">
            <h2>Delete Speech Analysis?</h2>
            <p className="muted">This action cannot be undone. This will permanently delete the speech analysis results for <strong>{patientName || 'this patient'}</strong>.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-cancel-blue" onClick={() => setShowDeleteSessionModal(false)}>CANCEL</button>
              <button className="btn-delete" onClick={handleConfirmDeleteSession}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="results">
          <h3>Results</h3>
          <p className="results-subtitle">Displays the total count of detected stuttering events (e.g., repetitions, blocks, prolongations) for the session.</p>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={r.label}>
                <div className="result-label">{r.label}</div>
                <div className="result-value">{r.value}</div>
              </div>
            ))}
          </div>
        </section>

        {detectionLogs.length > 0 && (
          <section className="detection-logs">
            <h3>Detection Logs</h3>
            <p className="detection-logs-subtitle">Lists detected events with timestamps and confidence scores. Filter results using the confidence threshold slider.</p>
            
            <div className="confidence-filter">
              <label>Confidence Threshold: {confidenceThreshold}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="confidence-slider"
                style={{ '--value': `${confidenceThreshold}%` }}
              />
              <div className="slider-labels">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="logs-container">
              {detectionLogs.length > 0 ? (
                detectionLogs.map((detection, index) => (
                  <div className="log-entry" key={index}>
                    <div className="log-timestamp">{formatTimeRange(detection.start, detection.end)}</div>
                    <div className="log-type">{typeLabels[detection.type] || detection.type}</div>
                    <div className="log-confidence">{detection.confidence}% confidence</div>
                  </div>
                ))
              ) : (
                <div className="no-detections">No detections match the selected confidence threshold.</div>
              )}
            </div>
          </section>
        )} {session && session.detections && session.detections.length > 0 && detectionLogs.length === 0 && (
          <section className="detection-logs">
            <h3>Detection Logs</h3>
            <p className="detection-logs-subtitle">Lists detected events with timestamps and confidence scores. Filter results using the confidence threshold slider.</p>
            
            <div className="confidence-filter">
              <label>Confidence Threshold: {confidenceThreshold}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="confidence-slider"
                style={{ '--value': `${confidenceThreshold}%` }}
              />
              <div className="slider-labels">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="logs-container">
              <div className="no-detections">No detections match the selected confidence threshold.</div>
            </div>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}
