# TalkFlow Deployment Guide

## Architecture
- **Frontend**: React app deployed on Vercel
- **Backend**: Python FastAPI server deployed on Railway

## Deployment Steps

### 1. Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `talkflow` repository
4. Railway will auto-detect the Python app in `/server`
5. Add environment variable (if needed):
   - Railway auto-sets `PORT` variable
6. Click "Deploy"
7. Once deployed, copy your Railway app URL (e.g., `https://talkflow-production.up.railway.app`)

**Important for Railway:**
- The `Procfile`, `requirements.txt`, and `runtime.txt` must be in the `/server` folder
- Railway will automatically detect and use them
- Your models in `src/Components/wavlm_models/` must be committed to git (check file size limits)

### 2. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click "Add New Project"
3. Import your `talkflow` repository
4. Vercel will auto-detect it's a React app
5. Before deploying, add environment variable:
   - Name: `REACT_APP_API_URL`
   - Value: Your Railway backend URL (e.g., `https://talkflow-production.up.railway.app`)
6. Click "Deploy"

### 3. Update CORS in Backend

After deployment, update the CORS settings in `server/analyze_api.py` to include your Vercel URL:

```python
allow_origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://your-app.vercel.app",  # Add your Vercel URL here
    "https://*.vercel.app",  # Allow all Vercel preview deployments
]
```

Then redeploy Railway backend.

## Local Development

Frontend:
```bash
npm start
```

Backend:
```bash
cd server
python analyze_api.py
```

## Environment Variables

### Vercel (Frontend)
- `REACT_APP_API_URL` - Railway backend URL

### Railway (Backend)
- `PORT` - Auto-set by Railway
- Model files should be in your git repository

## Notes

- Model files (.pth) must be in your git repository for Railway to access them
- If models are too large (>100MB), consider using Git LFS or hosting them separately
- Railway free tier has limitations on RAM/CPU - monitor usage
- Vercel deployment is automatic on git push
