# Disfluency Analysis Server

This Python server provides real-time audio analysis for detecting speech disfluencies using WavLM-based deep learning models.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. Navigate to the server directory:
```powershell
cd server
```

2. Install required Python packages:
```powershell
pip install torch torchaudio transformers fastapi uvicorn librosa numpy python-multipart
```

Or install from requirements file (if available):
```powershell
pip install -r requirements.txt
```

## Running the Server

1. Make sure you're in the project root directory:
```powershell
cd C:\Users\Laurence\talkflow
```

2. Start the analysis server:
```powershell
python server\analyze_api.py
```

The server will start on `http://127.0.0.1:8000`

You should see output like:
```
Loading models onto device: cpu (or cuda if GPU available)
Successfully loaded WavLM feature extractor
Successfully loaded model for task: block
Successfully loaded model for task: wordrep
Successfully loaded model for task: soundrep
Successfully loaded model for task: prolongation
Successfully loaded model for task: interjection
Model loading complete. Loaded 5 models.
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Testing the Server

1. Open your browser and go to: `http://127.0.0.1:8000`
   - You should see a welcome message

2. Go to: `http://127.0.0.1:8000/docs`
   - This shows the interactive API documentation

3. Check health: `http://127.0.0.1:8000/health`
   - This shows if models are loaded correctly

## Using with the React App

1. Start the Python server (as described above)
2. In a separate terminal, start the React app:
```powershell
npm start
```

3. Navigate to Session Options in the app
4. Upload a .wav or .mp3 file
5. Click "Start Session" - the file will be analyzed by the Python server
6. Results will be displayed in the Session view

## Troubleshooting

### "Models are not loaded" error
- Wait a few seconds after starting the server for models to load
- Check the console output to see if models loaded successfully
- Verify that model files exist in `src/Components/wavlm_models/`

### "Cannot connect to analysis server" error
- Make sure the Python server is running
- Check that it's running on port 8000
- Verify no firewall is blocking the connection

### "transformers" module errors
- Install transformers: `pip install transformers`
- May need to download model files on first run (requires internet)

### CUDA/GPU errors
- Server will automatically fall back to CPU if CUDA is not available
- For faster processing, install PyTorch with CUDA support

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check and model status
- `POST /analyze` - Analyze audio file (multipart/form-data with 'file' field)
- `GET /docs` - Interactive API documentation

## Model Files

The server expects model files in: `src/Components/wavlm_models/`

Required files:
- `best_model_block_wavlm.pth`
- `best_model_wordrep_wavlm.pth`
- `best_model_soundrep_wavlm.pth`
- `best_model_prolongation_wavlm.pth`
- `best_model_interjection_wavlm.pth`

## Performance Notes

- First analysis may be slower due to model initialization
- Typical analysis time: 2-5 seconds for a 30-second audio file
- GPU acceleration (if available) significantly improves speed
- Longer audio files are automatically split into 3-second chunks with 2-second overlap
