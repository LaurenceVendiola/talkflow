import React, { useRef, useState, useCallback } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import './WavUploader.css';

/**
 * WavUploader
 * - Renders a visible upload area/button which opens the file picker when clicked
 * - Supports drag & drop of files
 * - Accepts only .wav files (by mime type and/or extension)
 * - Calls `onFileSelected(file)` when a valid file is chosen
 * - Shows a friendly error message for invalid files
 * - Shows selected file name and a clear/remove button
 *
 * Props:
 * - onFileSelected: (file: File) => void
 * - maxSizeBytes?: number  (optional max size in bytes)
 * - className?: string     (passes through for styling)
 * - onActivate?: () => void (optional callback when user focuses/activates uploader)
 */
export default function WavUploader({ onFileSelected, maxSizeBytes = 10 * 1024 * 1024, className = '', onActivate }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const reset = useCallback(() => {
    setFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const openPicker = () => {
    setError('');
    if (onActivate) onActivate();
    inputRef.current && inputRef.current.click();
  };

  // Accept both WAV and MP3 formats by extension or common MIME types
  const isAcceptedAudio = f => {
    if (!f) return false;
    const name = (f.name || '').toLowerCase();
    const type = (f.type || '').toLowerCase();
    return (
      name.endsWith('.wav') ||
      name.endsWith('.mp3') ||
      type === 'audio/wav' ||
      type === 'audio/x-wav' ||
      type === 'audio/mpeg' ||
      type === 'audio/mp3'
    );
  };

  const validateAndEmit = f => {
    setError('');
    if (!f) {
      setError('No file selected.');
      return;
    }
    if (!isAcceptedAudio(f)) {
      setError('Invalid file type — please select a .wav or .mp3 audio file.');
      return;
    }
    if (maxSizeBytes && f.size > maxSizeBytes) {
      setError(`File is too large. Maximum ${Math.round(maxSizeBytes / 1024 / 1024)} MB.`);
      return;
    }
    setFile(f);
    setError('');
    onFileSelected && onFileSelected(f);
  };

  const onInputChange = e => {
    const f = e.target.files && e.target.files[0];
    validateAndEmit(f);
  };

  const onDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    validateAndEmit(f);
  };

  const onDragOver = e => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = e => {
    e.preventDefault();
    setDragOver(false);
  };

  const onKeyDown = e => {
    // make the div/button keyboard-accessible (Enter or Space)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      className={`wav-uploader ${className} ${dragOver ? 'dragover' : ''}`}
      onClick={openPicker}
      onKeyDown={onKeyDown}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      role="button"
      tabIndex={0}
      aria-pressed={!!file}
      aria-describedby={error ? 'wav-uploader-error' : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/*"
        style={{ display: 'none' }}
        onChange={onInputChange}
        aria-hidden="true"
      />

      <div className="upload-icon" aria-hidden="true"><FiUploadCloud/></div>
      <div className="upload-title">Upload Audio File</div>
      <div className="upload-sub">Drag & drop or click to browse</div>

      {file && (
        <div className="wav-selected">
          <span className="wav-filename" title={file.name}>{file.name}</span>
          <button
            type="button"
            className="wav-clear"
            onClick={e => { e.stopPropagation(); reset(); }}
            aria-label="Remove selected file"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div id="wav-uploader-error" className="wav-error" role="alert">{error}</div>
      )}
    </div>
  );
}
