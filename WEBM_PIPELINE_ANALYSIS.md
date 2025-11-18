# WebM Audio Processing Pipeline - Complete Flow Analysis

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER RECORDING                               │
│                          (RecordingForm.jsx)                            │
└──────────────────┬──────────────────────────────────────────────────────┘
                   │
                   ├─── User clicks "Start Recording"
                   │
                   ├─── getUserMedia() with constraints:
                   │    • echoCancellation: true
                   │    • noiseSuppression: true
                   │    • autoGainControl: true
                   │
                   ├─── MediaRecorder starts capturing
                   │    • Codec: Vorbis (WebM container)
                   │    • Sample Rate: 48 kHz (browser default)
                   │    • Format: audio/webm MIME type
                   │
                   ├─── ondataavailable event fires regularly
                   │    • Only chunks with size > 0 pushed to array
                   │    • audioChunksRef.current = [chunk1, chunk2, ...]
                   │
                   ├─── User clicks "Stop Recording"
                   │
                   ├─── Blob created on onstop event:
                   │    const blob = new Blob(audioChunksRef.current, 
                   │                           { type: 'audio/webm' })
                   │
                   ├─── Properties at this point:
                   │    ✓ blob.type = 'audio/webm'
                   │    ✓ blob.size = depends on duration
                   │    ✓ Codec: Vorbis @ 48 kHz
                   │
                   └─► recordedBlob state updated
                       │
└──────────────────────┼──────────────────────────────────────────────────┘
                       │
              ┌────────▼──────────┐
              │   USER CLICKS     │
              │    "ANALYZE"      │
              └────────┬──────────┘
                       │
                       ├─── Blob → File conversion:
                       │    const audioFile = new File(
                       │      [recordedBlob],
                       │      'recording.webm',        ← FILENAME
                       │      { type: 'audio/webm' }   ← MIME TYPE
                       │    )
                       │
                       ├─── Frontend validation:
                       │    ✓ File.name = 'recording.webm' → ends with .webm ✓
                       │    ✓ File.type = 'audio/webm' → in validTypes ✓
                       │    RESULT: Validation PASSES
                       │
                       ├─── Create FormData:
                       │    formData.append('file', audioFile)
                       │
                       ├─── POST to /analyze endpoint:
                       │    fetch('http://127.0.0.1:8001/analyze', {
                       │      method: 'POST',
                       │      body: formData
                       │    })
                       │
                       └─► HTTP request sent to FastAPI backend
                           │
└──────────────────────────┼────────────────────────────────────────────────┘
                           │
               ┌───────────▼─────────────┐
               │  FASTAPI BACKEND        │
               │  (analyze_api.py)       │
               │  /analyze endpoint      │
               └────────┬────────────────┘
                        │
                        ├─── file.filename = 'recording.webm' (from FormData)
                        │
                        ├─── File type validation:
                        │    if not filename.endswith('.wav' or '.mp3' or '.webm'):
                        │       raise HTTPException
                        │    else:
                        │       PASS ✓
                        │
                        ├─── Read file bytes:
                        │    contents = await file.read()
                        │    # WebM byte stream in memory
                        │
                        ├─── Detect format from filename:
                        │    file_format = 'webm'  ← detected from .webm extension
                        │
                        ├─── Load with librosa (CRITICAL STEP):
                        │    waveform, _ = librosa.load(
                        │      io.BytesIO(contents),
                        │      sr=TARGET_SR,          ← 16000 Hz
                        │      mono=True,             ← Convert to mono
                        │      format='webm'          ← EXPLICIT FORMAT HINT
                        │    )
                        │
                        │    INPUT:  WebM bytes @ 48 kHz, Vorbis codec
                        │    OUTPUT: numpy array @ 16 kHz, mono, float32
                        │
                        ├─── Create sliding window chunks:
                        │    • chunk_size = 3 seconds @ 16 kHz = 48,000 samples
                        │    • step_size = 1 second @ 16 kHz = 16,000 samples
                        │    • Creates overlapping 3-sec chunks with 2-sec overlap
                        │
                        ├─── Convert chunks to PyTorch tensors:
                        │    for chunk in all_chunks:
                        │      torch.from_numpy(chunk).float()
                        │
                        ├─── Stack into batch tensor:
                        │    padded_waveforms = torch.stack(all_chunks)
                        │    shape: (num_chunks, chunk_samples)
                        │
                        ├─── Create attention mask:
                        │    input_attention_mask = (padded_waveforms != 0.0)
                        │    # Identifies real vs padded samples
                        │
                        └─► Batch ready for WavLM feature extraction
                            │
└────────────────────────────┼──────────────────────────────────────────────┘
                             │
            ┌────────────────▼──────────────────┐
            │  WAVLM FEATURE EXTRACTION         │
            │  (WavLMLayeredExtractor forward)  │
            └────────────┬─────────────────────┘
                         │
                         ├─── Input: padded_waveforms (batch of audio chunks)
                         │
                         ├─── WavLMModel forward pass:
                         │    outputs = wavlm(
                         │      input_values=audio,
                         │      attention_mask=mask
                         │    )
                         │
                         ├─── Extract hidden states from 12 transformer layers:
                         │    stacked_layers = outputs.hidden_states[1:13]
                         │    shape: (12, batch_size, seq_len, 768)
                         │
                         ├─── Compute learned weighted average:
                         │    normalized_weights = softmax(learnable_params)
                         │    weighted_avg = sum(weights * layers)
                         │    shape: (batch_size, seq_len, 768)
                         │
                         ├─── Generate feature-level attention mask:
                         │    output_mask = get_feature_vector_attention_mask()
                         │
                         └─► Features ready for task-specific models
                             │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
        ├─► For each of 5 tasks (block, wordrep,    │
        │   soundrep, prolongation, interjection):  │
        │                                             │
        └─► TASK-SPECIFIC INFERENCE                  │
            │                                         │
            ├─── Load task model (TemporalDisfluencyNet)
            │    • LSTM(input_dim=768, hidden_dim=128, layers=2, bidirectional)
            │    • Attention mechanism
            │    • Binary classifier (2 output classes)
            │
            ├─── Forward pass:
            │    logits, attention_weights = model(features, mask)
            │    shape: (batch_size, 2)  ← [prob_fluent, prob_disfluent]
            │
            ├─── Get predictions:
            │    preds = argmax(logits, dim=1)  ← 0 or 1
            │    probs = softmax(logits)        ← confidence scores
            │
            ├─── For each chunk predicted as disfluent (pred == 1):
            │    ├─ Extract start/end times from chunk timing
            │    ├─ Extract confidence score: probs[i, 1]
            │    ├─ Extract attention weights for visualization
            │    └─ Create detection dict:
            │       {
            │         "type": "Block" | "WP" | "SND" | "Pro" | "Intrj",
            │         "start": 2.5,
            │         "end": 5.5,
            │         "confidence": 87.3,
            │         "attention": [weights...]
            │       }
            │
            └─── Increment summary counter for task
                 
└─────────────────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │    AGGREGATE RESULTS      │
            │                           │
            ├─ Collect all detections
            ├─ Compute summary counts
            ├─ Calculate total duration
            │
            └─► Return JSON response:
                {
                  "disfluencies": [
                    {
                      "type": "Block",
                      "start": 2.5,
                      "end": 5.5,
                      "confidence": 87.3,
                      "attention": [...]
                    },
                    ...
                  ],
                  "summary": {
                    "blocks": 2,
                    "wordRepetitions": 1,
                    "soundRepetitions": 0,
                    "prolongations": 1,
                    "interjections": 0
                  },
                  "duration": 45.23
                }
                │
└───────────┼────────────────────────────────────────────────────────────┘
            │
            │ HTTP 200 + JSON body
            │
┌───────────▼────────────────────────────────────────────────────────────┐
│           FRONTEND RESULT PROCESSING                                    │
│           (RecordingForm.jsx → disfluencyAnalyzer.js)                  │
└────────────┬──────────────────────────────────────────────────────────┘
             │
             ├─── formatAnalysisResults():
             │    ├─ Extract disfluency counts from summary
             │    ├─ Transform detection format for UI
             │    └─ Return formatted object
             │
             ├─── Create session object:
             │    {
             │      id, patientId, date, method: 'Recording',
             │      audioFileName: 'Recorded Audio',
             │      audioURL: blob URL for playback,
             │      detections: formatted detections,
             │      duration: from analysis,
             │      results: { disfluencies: counts }
             │    }
             │
             ├─── Store session:
             │    addSession(session)  → localStorage
             │
             ├─── Navigate to results:
             │    navigate('/Session', { state: { sessionId } })
             │
             └─► SessionForm displays detections with timeline/heatmap
                 │
                 └─ User can see:
                    • Timeline of detected disfluencies
                    • Confidence scores
                    • Attention heatmaps
                    • Summary statistics
```

---

## ✅ Validation Checklist

### Frontend (RecordingForm.jsx)
- [x] **Blob Creation**: `new Blob(audioChunksRef.current, { type: 'audio/webm' })`
  - ✓ MIME type correct: `audio/webm`
  - ✓ Chunks filtered: Only size > 0 chunks included
  
- [x] **File Conversion**: `new File([recordedBlob], 'recording.webm', { type: 'audio/webm' })`
  - ✓ Filename: `recording.webm` (ends with .webm)
  - ✓ MIME type: `audio/webm`
  - ✓ Constructor signature correct
  
- [x] **Validation** (disfluencyAnalyzer.js):
  ```javascript
  validTypes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/webm']
  validExtensions = ['.wav', '.mp3', '.webm']
  ```
  - ✓ 'audio/webm' in validTypes ✓
  - ✓ '.webm' in validExtensions ✓
  - ✓ Both checks pass for 'recording.webm'

- [x] **FormData Creation**:
  ```javascript
  formData.append('file', audioFile)
  ```
  - ✓ File object properly created with name and type
  - ✓ FormData correctly encodes binary audio data

### Backend (analyze_api.py)

- [x] **File Type Validation**:
  ```python
  if not (filename.endswith('.wav') or filename.endswith('.mp3') or filename.endswith('.webm')):
      raise HTTPException(...)
  ```
  - ✓ Accepts `.webm` extension
  - ✓ Error message includes WebM support

- [x] **Format Detection**:
  ```python
  if filename.endswith('.webm'):
      file_format = 'webm'
  elif filename.endswith('.mp3'):
      file_format = 'mp3'
  elif filename.endswith('.wav'):
      file_format = 'wav'
  ```
  - ✓ Explicitly detects 'webm' format from filename
  - ✓ Fallback to other formats or auto-detection

- [x] **librosa Loading** (CRITICAL):
  ```python
  waveform, _ = librosa.load(
      io.BytesIO(contents),
      sr=TARGET_SR,        # 16000 Hz
      mono=True,           # Mono conversion
      format=file_format   # EXPLICIT FORMAT HINT (webm)
  )
  ```
  - ✓ Uses explicit `format='webm'` parameter
  - ✓ Resamples to 16 kHz (TARGET_SR)
  - ✓ Converts to mono
  - ✓ Returns numpy float32 array

- [x] **Audio Processing Pipeline**:
  - ✓ Chunks audio into 3-second windows
  - ✓ 1-second step size (2-second overlap)
  - ✓ Pads last chunk if needed
  - ✓ Converts to PyTorch tensors
  - ✓ Creates attention masks

- [x] **Feature Extraction** (WavLMLayeredExtractor):
  - ✓ Loads WavLM model
  - ✓ Extracts 12 transformer layers
  - ✓ Computes learned weighted average
  - ✓ Returns features (Batch, SeqLen, 768)

- [x] **Task-Specific Models**:
  - ✓ Loads 5 models (block, wordrep, soundrep, prolongation, interjection)
  - ✓ Binary classification (fluent vs disfluent)
  - ✓ Extracts confidence scores
  - ✓ Maps predictions to time ranges

- [x] **Result Aggregation**:
  - ✓ Collects detections from all tasks
  - ✓ Computes summary counts
  - ✓ Includes audio duration
  - ✓ Returns properly formatted JSON

---

## 🔧 Configuration Summary

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Audio Sample Rate (Browser)** | 48 kHz | MediaRecorder default |
| **Audio Sample Rate (Backend)** | 16 kHz | librosa TARGET_SR |
| **Audio Format (Browser)** | WebM + Vorbis | MediaRecorder default codec |
| **Audio Format (Filename)** | `.webm` | Explicit format hint for librosa |
| **Chunk Size** | 3 seconds | Analysis window duration |
| **Step Size** | 1 second | Overlap = 2 seconds |
| **WavLM Layers** | 12 transformer | Feature extraction depth |
| **LSTM Hidden Dim** | 128 | Task model hidden state size |
| **Output Classes** | 2 (fluent/disfluent) | Binary classification |
| **Resampling** | librosa.load() | Automatic rate conversion |

---

## 🎯 Key Success Criteria

✅ **Frontend to Backend**:
- Blob properly created with WebM MIME type
- File object created with .webm filename
- FormData correctly encodes binary data
- HTTP POST succeeds

✅ **Backend Audio Loading**:
- librosa detects WebM format from filename
- BytesIO object properly decoded
- Waveform resampled to 16 kHz
- Mono conversion applied

✅ **Feature Extraction**:
- WavLM model processes audio chunks
- 12-layer transformer outputs captured
- Weighted averaging computes features
- Output shape (Batch, SeqLen, 768)

✅ **Task Models**:
- 5 models load successfully
- LSTM processes features
- Attention weights computed
- Confidence scores generated

✅ **Result Delivery**:
- Detection objects with time ranges
- Summary counts aggregated
- Duration calculated
- JSON response formatted

---

## 🐛 Troubleshooting Guide

### "Format not recognised" Error
**Symptoms**: `librosa.load()` fails with format error
**Cause**: BytesIO object without explicit format hint
**Solution**: ✅ Already implemented with `format=file_format` parameter

### "Could not read audio file" Error
**Symptoms**: File upload succeeds but analysis fails
**Cause**: librosa cannot decode WebM bytes
**Diagnosis**: Check server logs for detailed error message
**Solution**: Ensure ffmpeg is installed or convert to WAV

### Empty Detections
**Symptoms**: Analysis completes but no disfluencies detected
**Cause**: Model predictions all negative (class 0)
**Diagnosis**: Check model confidence scores and attention weights
**Solution**: May indicate fluent speech or threshold adjustment needed

### Audio Playback Missing
**Symptoms**: Results page shows no audio player
**Cause**: audioURL not properly created from blob
**Solution**: ✅ Already implemented in RecordingForm

---

## 📝 Notes

- **Filename matters**: librosa format detection relies on filename extension
- **Explicit format hint**: `format='webm'` parameter is critical for BytesIO
- **Resampling**: librosa automatically handles 48 kHz → 16 kHz conversion
- **Mono conversion**: Important for consistent feature dimensions
- **Error handling**: Frontend catches analysis errors and displays to user
- **Session storage**: Results persist in localStorage for playback

---

**Last Updated**: 2025-11-18
**Status**: ✅ Complete pipeline implemented and validated
**Deployment**: Ready for production (requires ffmpeg on server for WebM support)
