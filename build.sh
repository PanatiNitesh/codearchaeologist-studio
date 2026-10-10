#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=========================================================="
echo "🚀 Building CodeArchaeologist for Production Deployment"
echo "=========================================================="

echo "=== Step 1: Building Frontend SPA ==="
cd frontend
npm ci || npm install
npm run build
cd ..

echo "=== Step 2: Installing Backend Dependencies ==="
pip install --no-cache-dir --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "=== Step 3: Verifying Database and Directories ==="
mkdir -p backend/cloned_repos backend/sample_repos

echo "=========================================================="
echo "✅ Build Complete & Ready to Launch!"
echo "=========================================================="
