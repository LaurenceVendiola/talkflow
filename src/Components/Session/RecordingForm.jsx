import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaStop, FaArrowLeft } from 'react-icons/fa';
import './Recording.css';
import { analyzeAudioFile, formatAnalysisResults, checkServerHealth } from '../../services/disfluencyAnalyzer';
import { addSession } from '../../utils/store';
import Sidebar from '../Sidebar/Sidebar';

const rainbowPassage = `When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow. Throughout the centuries people have explained the rainbow in various ways. Some have accepted it as a miracle without physical explanation. To the Hebrews it was a token that there would be no more universal floods. The Greeks used to imagine that it was a sign from the gods to foretell war or heavy rain. The Norsemen considered the rainbow as a bridge over which the gods passed from earth to their home in the sky. Others have tried to explain the phenomenon physically. Aristotle thought that the rainbow was caused by reflection of the sun's rays by the rain. Since then physicists have found that it is not reflection, but refraction by the raindrops which causes the rainbows. Many complicated ideas about the rainbow have been formed. The difference in the rainbow depends considerably upon the size of the drops, and the width of the colored band increases as the size of the drops increases. The actual primary rainbow observed is said to be the effect of super imposition of a number of bows. If the red of the second bow falls upon the green of the first, the result is to give a bow with an abnormally wide yellow band, since red and green light when mixed form yellow. This is a very common type of bow, one showing mainly red and yellow, with little or no green or blue.`;

export default function RecordingForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPatient = location.state?.patientId;

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      setError('');
      setRecordedBlob(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Blob created with type:', blob.type);
        console.log('Blob size:', blob.size, 'bytes');
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      setError('Unable to access microphone. Please check your browser permissions.');
      console.error('Microphone error:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async () => {
    if (!recordedBlob) {
      setError('No recording found');
      return;
    }

    if (!selectedPatient) {
      setError('Patient not selected. Please go back and select a patient.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      console.log('=== Starting Analysis ===');
      console.log('Blob type:', recordedBlob.type);
      console.log('Blob size:', recordedBlob.size);
      
      // Check server health
      await checkServerHealth();

      // Create a File object from the Blob with proper filename
      const audioFile = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });
      console.log('Created File object:', audioFile.name, audioFile.type);

      // Analyze the recorded audio
      const analysisResult = await analyzeAudioFile(audioFile);
      console.log('Analysis result:', analysisResult);
      const formattedResults = formatAnalysisResults(analysisResult);

      // Create audio URL for playback
      const audioURL = URL.createObjectURL(recordedBlob);

      // Create session with real analysis results
      const session = {
        id: `s_${Date.now()}`,
        patientId: selectedPatient,
        date: new Date().toLocaleDateString(),
        method: 'Recording',
        audioFileName: 'Recorded Audio',
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
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="recording-interface">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FaArrowLeft /> BACK
        </button>

      <div className="recording-header">
        <h1>Recording Session</h1>
        <p className="recording-sub">Read the passage below while recording</p>
      </div>

      <section className="transcript">
        <div className="transcript-card">
          <p>{rainbowPassage}</p>
        </div>
      </section>

      <section className="recording-controls">
        {error && (
          <div className="recording-error" role="alert">{error}</div>
        )}

        <div className="timer-display">
          {isRecording && formatTime(recordingTime)}
        </div>

        {recordedBlob && (
          <div className="audio-playback-section">
            <div className="audio-info">
              <strong>Recorded Audio</strong>
            </div>
            <audio 
              controls 
              className="audio-player" 
              src={URL.createObjectURL(recordedBlob)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="button-group">
          {!isRecording && !recordedBlob && (
            <button 
              className="btn-record"
              onClick={handleStartRecording}
              disabled={isAnalyzing}
            >
              <FaMicrophone /> Start Recording
            </button>
          )}

          {isRecording && (
            <button 
              className="btn-stop"
              onClick={handleStopRecording}
            >
              <FaStop /> Stop Recording
            </button>
          )}

          {recordedBlob && !isRecording && (
            <>
              <button 
                className="btn-record"
                onClick={handleStartRecording}
                disabled={isAnalyzing}
              >
                <FaMicrophone /> Start Recording Again
              </button>
              <button 
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
    </div>
  );
}
