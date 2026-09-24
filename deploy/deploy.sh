#!/bin/bash
# ==========================================
# DealsRadar EG - Automated Deployment Script
# ==========================================

set -e

echo "🚀 [1/4] Checking environment dependencies..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required."; exit 1; }
command -v python >/dev/null 2>&1 || { echo "❌ Python 3.11+ is required."; exit 1; }

echo "📦 [2/4] Building Frontend PWA with Vite..."
cd frontend
npm install
npm run build
cd ..

echo "📂 [3/4] Packaging static PWA assets for FastAPI..."
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

echo "🐍 [4/4] Installing Python Backend dependencies & running tests..."
cd backend
pip install -r requirements.txt
python -m pytest tests/

echo ""
echo "🎉 Build and test validation SUCCESSFUL!"
echo "✨ Start local production server with:"
echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "🌐 For Cloud Public Deployment (Render):"
echo "   1. Push repo to GitHub: git push origin main"
echo "   2. Create new Web Service on Render using deploy/render.yaml"
echo "   3. Your live HTTPS link will be available automatically!"
