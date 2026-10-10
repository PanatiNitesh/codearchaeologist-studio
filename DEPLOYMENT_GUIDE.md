# 🚀 Cloud Deployment Guide (Render & Hugging Face Spaces)

This repository is fully configured for production cloud deployment on **Render** and **Hugging Face Spaces** with zero manual server configuration.

---

## 🌐 Option 1: Deploy on Render (Recommended)

Render offers instant deployment for full-stack apps with automated builds, health checks, and public HTTPS endpoints.

### Method A: Blueprint Deployment (1-Click via `render.yaml`)

1. **Push your code to GitHub** (when you are ready to push):
   ```bash
   git add .
   git commit -m "Deploy CodeArchaeologist to Render"
   git push origin main
   ```
2. **Open Render Dashboard**:
   - Navigate to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** → **Blueprint**.
   - Connect your GitHub repository `CodeArchaeologist`.
   - Render will detect `render.yaml` and configure everything automatically!
   - Click **Apply**.

---

### Method B: Manual Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repo (`PanatiNitesh/CodeArchaeologist`).
3. Fill in the following settings:
   - **Name**: `code-archaeologist`
   - **Region**: `Oregon (US West)` or nearest
   - **Branch**: `main`
   - **Runtime**: `Python 3` (or `Docker`)
   - **Build Command**: `./build.sh` (or `npm --prefix frontend install && npm --prefix frontend run build && pip install -r requirements.txt`)
   - **Start Command**: `python backend/run.py`
   - **Plan**: `Free`
4. In **Advanced** → **Environment Variables**, add:
   - `RENDER` = `true`
   - `HOST` = `0.0.0.0`
   - `PORT` = `10000` (or leave default, Render automatically provides `$PORT`)
5. Click **Create Web Service**.

---

## 🤗 Option 2: Deploy on Hugging Face Spaces

This repository includes a multi-stage `Dockerfile` optimized for Hugging Face Spaces (Port `7860`, user UID `1000`).

1. **Create Space on Hugging Face**:
   - Navigate to [huggingface.co/new-space](https://huggingface.co/new-space).
   - Enter **Space name** (e.g. `CodeArchaeologist`).
   - Select **Space SDK**: **Docker** (Blank).
   - Choose **Public** visibility.
2. **Link to GitHub**:
   - In your newly created Space, go to **Settings** → **GitHub** section.
   - Click **Connect to GitHub** and select `PanatiNitesh/CodeArchaeologist`.
   - Hugging Face will automatically build and launch!

---

## 🔍 Verifying Your Live Deployment

Once deployed on either platform:
1. **Health Check**: Test `https://<your-app-url>/api/health` — it will return status `ready`.
2. **Interactive UI**: Open `https://<your-app-url>/` in any browser.
3. **Analyze Any Public GitHub Repo**:
   - Click **+ Ingest Repo** in the header.
   - Enter any public repository (e.g. `pallets/flask`, `https://github.com/expressjs/express`, or `fastapi/fastapi`).
   - The backend will shallow-clone, extract AST symbols, compute dependency topology, mine Git history, and display the complete interactive dashboard in real time!
