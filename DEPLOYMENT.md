# TalkFlow Deployment Guide

## Architecture
- **Frontend**: React app deployed on Vercel
- **Backend**: Python FastAPI server deployed on AWS EC2
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Deployment Steps

### 1. Deploy Backend to AWS EC2

1. Launch an EC2 instance (Ubuntu recommended)
2. SSH into your instance
3. Install Python 3.11, pip, and required system dependencies
4. Clone your repository to the EC2 instance
5. Install Python dependencies: `pip install -r server/requirements.txt`
6. Set environment variables:
   - `PORT=8001` (or your preferred port)
7. Run the FastAPI server: `uvicorn analyze_api:app --host 0.0.0.0 --port 8001 --workers 4`
8. Configure security group to allow inbound traffic on your chosen port
9. (Optional) Set up a process manager like systemd or supervisor for auto-restart
10. (Optional) Configure nginx as a reverse proxy
11. Note your EC2 public IP or domain for frontend configuration

**Important for AWS EC2:**
- The server runs independently 24/7 on AWS infrastructure
- Your models in `src/Components/wavlm_models/` must be on the EC2 instance
- Consider using an Elastic IP for a stable endpoint address
- Monitor instance resources (CPU, RAM) and scale as needed

### 2. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click "Add New Project"
3. Import your `talkflow` repository
4. Vercel will auto-detect it's a React app
5. Before deploying, add environment variable:
   - Name: `REACT_APP_API_URL`
   - Value: Your AWS EC2 backend URL (e.g., `http://your-ec2-ip:8001` or `https://your-domain.com`)
6. Click "Deploy"

### 3. Update CORS in Backend

The backend is configured with CORS to allow all origins for development and production flexibility:

```python
allow_origins=["*"]  # Allows Vercel frontend and development environments
```

For production, you can restrict this to specific origins:

```python
allow_origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://your-app.vercel.app",  # Your production Vercel URL
    "https://*.vercel.app",  # Vercel preview deployments
]
```

After updating CORS, restart the FastAPI server on EC2.

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
- `REACT_APP_API_URL` - AWS EC2 backend URL (e.g., `http://your-ec2-ip:8001`)
- Firebase configuration (already in `firebaseConfig.js`)

### AWS EC2 (Backend)
- `PORT` - Server port (default: 8001)
- Model files should be on the EC2 instance filesystem

## Notes

- Model files (.pth) must be on your EC2 instance (in `src/Components/wavlm_models/`)
- EC2 instance runs independently 24/7 - no need to keep your local PC running
- Monitor EC2 instance resources and scale as needed
- Vercel frontend deployment is automatic on git push
- Backend updates require SSH into EC2 and pulling latest code
