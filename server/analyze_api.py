import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import WavLMModel
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import librosa
import numpy as np
import io
from typing import List, Dict, Any

# --- Configuration ---
TARGET_SR = 16000
CHUNK_SIZE_SEC = 3.0  # Analyze in 3-second chunks
STEP_SIZE_SEC = 1.0   # With a 1-second step (2-second overlap)
TASKS = ["block", "wordrep", "soundrep", "prolongation", "interjection"]
MODEL_DIR = "src/Components/wavlm_models"  # WavLM trained models (from project root)

# Model Hyperparameters (MUST match what you trained with)
LSTM_HIDDEN_DIM = 128
LSTM_LAYERS = 2
DROPOUT = 0.3

# --- 1. Model Definitions ---

class WavLMLayeredExtractor(nn.Module):
    """
    A feature extractor that wraps a pre-trained WavLM model and
    computes a *learned* weighted average of its intermediate transformer layers.
    """
    def __init__(self, model_name="microsoft/wavlm-base-plus"):
        super().__init__()
        
        # Load the pre-trained model
        self.wavlm = WavLMModel.from_pretrained(
            model_name,
            output_hidden_states=True,
            use_safetensors=True
        )
        
        # Freeze the WavLM model - only using for feature extraction
        for param in self.wavlm.parameters():
            param.requires_grad = False
        
        # 12 transformer layers - create trainable weight for each
        num_transformer_layers = 12
        self.layer_weights = nn.Parameter(torch.ones(num_transformer_layers))

    def forward(self, audio_input, attention_mask):
        """
        Processes raw audio input and returns a weighted-average feature tensor.
        
        Args:
            audio_input (Tensor): Raw waveform tensor of shape (Batch, NumSamples).
            attention_mask (Tensor): Boolean mask of shape (Batch, NumSamples)
        
        Returns:
            Tensor: Weighted feature tensor of shape (Batch, SeqLen, 768).
        """
        outputs = self.wavlm(
            input_values=audio_input,
            attention_mask=attention_mask
        )
        
        # Stack the 12 transformer layers (index 1 to 13)
        stacked_layers = torch.stack(outputs.hidden_states[1:], dim=0)
        
        # Compute weighted average
        normalized_weights = F.softmax(self.layer_weights, dim=0)
        weights_reshaped = normalized_weights.view(-1, 1, 1, 1)
        weighted_average = torch.sum(stacked_layers * weights_reshaped, dim=0)
        
        # Get attention mask for output sequence
        output_attention_mask = self.wavlm._get_feature_vector_attention_mask(
            outputs.hidden_states[0].shape[1],
            attention_mask
        )
        
        return weighted_average, output_attention_mask

class Attention(nn.Module):
    """Attention mechanism for the temporal model."""
    def __init__(self, hidden_dim):
        super(Attention, self).__init__()
        self.W = nn.Linear(hidden_dim, hidden_dim, bias=False)
        self.v = nn.Linear(hidden_dim, 1, bias=False)

    def forward(self, lstm_output, mask):
        energy = torch.tanh(self.W(lstm_output))
        scores = self.v(energy)
        scores = scores.squeeze(2)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attention_weights = F.softmax(scores, dim=1)
        context_vector = torch.sum(lstm_output * attention_weights.unsqueeze(2), dim=1)
        return context_vector, attention_weights

class TemporalDisfluencyNet(nn.Module):
    """LSTM-based temporal disfluency detection network."""
    def __init__(self, input_dim=768, lstm_hidden_dim=128, num_lstm_layers=2, dropout=0.3):
        super(TemporalDisfluencyNet, self).__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=lstm_hidden_dim,
            num_layers=num_lstm_layers,
            bidirectional=True,
            batch_first=True,
            dropout=dropout if num_lstm_layers > 1 else 0
        )
        self.attention = Attention(lstm_hidden_dim * 2)
        self.classifier = nn.Sequential(
            nn.Linear(lstm_hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(64, 2)
        )

    def forward(self, x, mask):
        lstm_output, _ = self.lstm(x)
        context_vector, attention_weights = self.attention(lstm_output, mask)
        logits = self.classifier(context_vector)
        return logits, attention_weights

# --- 2. FastAPI App Initialization ---

app = FastAPI(title="Disfluency Analyzer API")

# Global variables to hold models
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
feature_extractor = None
model_bank = {}

# Add CORS middleware to allow React app to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_models():
    """Load all models into memory when the server starts."""
    global feature_extractor, model_bank, device
    print(f"Loading models onto device: {device}...")
    print(f"Current working directory: {Path.cwd()}")
    print(f"Looking for models in: {Path(MODEL_DIR).absolute()}")
    
    try:
        feature_extractor = WavLMLayeredExtractor().to(device)
        feature_extractor.eval()
        print("Successfully loaded WavLM feature extractor")
    except Exception as e:
        print(f"CRITICAL: Failed to load WavLMLayeredExtractor: {e}")
        print("This is often due to a missing 'transformers' install or network issue.")
        return

    for task_name in TASKS:
        model_path = Path(f"{MODEL_DIR}/best_model_{task_name}_wavlm.pth")
        
        if not model_path.exists():
            print(f"WARNING: Model file not found for task '{task_name}' at {model_path}")
            continue
            
        try:
            model = TemporalDisfluencyNet(
                input_dim=768,
                lstm_hidden_dim=LSTM_HIDDEN_DIM,
                num_lstm_layers=LSTM_LAYERS,
                dropout=DROPOUT
            ).to(device)
            
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()
            model_bank[task_name] = model
            print(f"Successfully loaded model for task: {task_name}")
            
        except Exception as e:
            print(f"ERROR: Failed to load model for task '{task_name}': {e}")
            
    print(f"Model loading complete. Loaded {len(model_bank)} models.")

# --- 3. The Analyzer Endpoint ---

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyzes an audio file (.wav or .mp3) for all 5 disfluency types.
    Returns detected disfluencies and summary counts.
    """
    if not feature_extractor or not model_bank:
        raise HTTPException(status_code=503, detail="Models are not loaded. Server may be starting.")
    
    # Validate file type
    filename = file.filename.lower()
    if not (filename.endswith('.wav') or filename.endswith('.mp3')):
        raise HTTPException(status_code=400, detail="Only .wav and .mp3 files are supported")
    
    # 1. Read and load audio file
    try:
        contents = await file.read()
        # Load with librosa (auto-resamples to TARGET_SR and handles both wav/mp3)
        # Note: MP3 support requires ffmpeg or audioread backend
        waveform, _ = librosa.load(io.BytesIO(contents), sr=TARGET_SR, mono=True)
    except Exception as e:
        error_msg = str(e)
        if 'mp3' in filename and ('audioread' in error_msg or 'decode' in error_msg):
            raise HTTPException(
                status_code=400, 
                detail="MP3 file could not be processed. Install ffmpeg or convert to WAV format."
            )
        raise HTTPException(status_code=400, detail=f"Could not read audio file: {error_msg}")

    # 2. Create sliding window chunks
    chunk_samples = int(CHUNK_SIZE_SEC * TARGET_SR)
    step_samples = int(STEP_SIZE_SEC * TARGET_SR)
    
    all_chunks = []
    chunk_start_times = []
    
    for start in range(0, len(waveform), step_samples):
        end = start + chunk_samples
        chunk = waveform[start:end]
        
        # Pad the last chunk if it's too short
        if len(chunk) < chunk_samples:
            chunk = np.pad(chunk, (0, chunk_samples - len(chunk)), 'constant')
            
        all_chunks.append(torch.from_numpy(chunk).float())
        chunk_start_times.append(start / TARGET_SR)
        
        if end >= len(waveform):
            break
            
    if not all_chunks:
        return {"disfluencies": [], "summary": {}}

    # 3. Batch process all chunks
    padded_waveforms = torch.stack(all_chunks).to(device)
    input_attention_mask = (padded_waveforms != 0.0).to(device)

    # Run feature extraction ONCE for the whole batch
    with torch.no_grad():
        features, mask = feature_extractor(padded_waveforms, input_attention_mask)
    
    # 4. Run inference for all 5 models
    all_detections = []
    summary_counts = {
        "blocks": 0,
        "wordRepetitions": 0,
        "soundRepetitions": 0,
        "prolongations": 0,
        "interjections": 0
    }
    
    with torch.no_grad():
        for task_name, model in model_bank.items():
            logits, attention_weights = model(features, mask)
            preds = torch.argmax(logits, dim=1)
            
            # Map predictions back to time
            for i, prediction in enumerate(preds):
                if prediction.item() == 1:  # 1 means DISFLUENT
                    start_time = chunk_start_times[i]
                    end_time = start_time + CHUNK_SIZE_SEC
                    
                    # Extract attention weights for this chunk (convert to list)
                    attn_weights = attention_weights[i].cpu().numpy().tolist()
                    
                    # Map task_name to the label and summary key
                    label_map = {
                        "block": ("Block", "blocks"),
                        "wordrep": ("WP", "wordRepetitions"),
                        "soundrep": ("SND", "soundRepetitions"),
                        "prolongation": ("Pro", "prolongations"),
                        "interjection": ("Intrj", "interjections")
                    }
                    
                    label, summary_key = label_map.get(task_name, ("Unknown", None))
                    
                    all_detections.append({
                        "type": label,
                        "start": round(start_time, 2),
                        "end": round(end_time, 2),
                        "attention": attn_weights
                    })
                    
                    if summary_key:
                        summary_counts[summary_key] += 1

    # 5. Return results with summary and duration
    duration = len(waveform) / TARGET_SR
    return {
        "disfluencies": all_detections,
        "summary": summary_counts,
        "duration": round(duration, 2)
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    models_loaded = len(model_bank)
    return {
        "status": "healthy" if models_loaded > 0 else "starting",
        "models_loaded": models_loaded,
        "device": str(device)
    }

@app.get("/")
def read_root():
    return {
        "message": "Disfluency Analyzer API is running",
        "endpoints": {
            "/analyze": "POST - Upload audio file for analysis",
            "/health": "GET - Check API health status",
            "/docs": "GET - Interactive API documentation"
        }
    }

if __name__ == "__main__":
    # Run the server
    # Go to http://127.0.0.1:8001/docs to see the automatic API docs
    uvicorn.run(app, host="127.0.0.1", port=8001)
