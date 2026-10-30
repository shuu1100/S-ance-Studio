# Séance Studio — Installation & Setup Guide

This guide details the complete, step-by-step setup procedure for running **Séance Studio: Interactive AI Ghost Stories** on a local Windows 10/11 machine.

---

## 1. System Requirements

### Hardware Requirements
- **OS**: Windows 10 or Windows 11 (64-bit)
- **Processor**: 4-core CPU (Intel Core i5/i7 or AMD Ryzen 5/7)
- **RAM**: Minimum 8 GB RAM (16 GB recommended for smooth LLM inference)
- **Storage**: ~7 GB free disk space (app files + ~2.5 GB for `qwen3:4b` weights)
- **GPU (Optional)**: NVIDIA GPU with CUDA or AMD with DirectML/Vulkan for sub-second dialogue synthesis. CPU-only inference is fully supported.

### Software Prerequisites
1. **Python 3.10 – 3.14**: [python.org](https://www.python.org/downloads/) *(Ensure "Add python.exe to PATH" is checked during installation)*
2. **Node.js 18.x or 20.x LTS**: [nodejs.org](https://nodejs.org/)
3. **Ollama for Windows**: [ollama.com](https://ollama.com/download)

---

## 2. Local AI Model Installation (Ollama)

> [!IMPORTANT]
> **Zero Auto-Download Policy**: Séance Studio will **never** automatically download model weights or trigger background network downloads. You must explicitly pull the model before first play.

1. Open PowerShell or Command Prompt.
2. Pull the primary dialogue generation model:
   ```powershell
   ollama pull qwen3:4b
   ```
3. *(Optional)* Pull the vision-language model for optical evidence inspection:
   ```powershell
   ollama pull qwen3-vl:8b
   ```
4. Verify the models are installed:
   ```powershell
   ollama list
   ```
   *Expected output:*
   ```text
   NAME            ID              SIZE      MODIFIED
   qwen3:4b        ...             2.5 GB    ...
   qwen3-vl:8b     ...             4.9 GB    ...
   ```

### Model Licensing & Distribution Notice
- The **Qwen** model weights are developed by the Qwen Team / Alibaba Cloud and distributed under the **Apache 2.0 / Qwen Research License**.
- Model weights are stored exclusively on your local workstation in `%USERPROFILE%\.ollama\models`.
- No model data or user prompts are transmitted to cloud APIs.

---

## 3. Repository Setup

Clone or download the repository into your desired working folder:
```powershell
cd C:\local_disc_D\Hackathan\week_4
```

### Step 3.1: Python Virtual Environment & Backend Setup
1. Create a dedicated virtual environment in the project root:
   ```powershell
   python -m venv .venv
   ```
2. Activate the virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
   *(If PowerShell blocks script execution, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*
3. Install backend Python dependencies:
   ```powershell
   pip install --upgrade pip
   pip install -r backend\requirements.txt
   ```
4. Initialize the SQLite database schema and run migrations:
   ```powershell
   cd backend
   alembic upgrade head
   cd ..
   ```

### Step 3.2: Frontend Setup (Next.js)
1. Navigate to the `frontend/` directory:
   ```powershell
   cd frontend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Return to the root directory:
   ```powershell
   cd ..
   ```

### Step 3.3: Environment Configuration
Copy the safe template `.env.example` to `.env`:
```powershell
copy .env.example .env
```
*(The default settings are preconfigured for loopback `127.0.0.1` and offline strict mode.)*

---

## 4. Launching Séance Studio

### Option A: 1-Click Launch (Recommended)
Double-click `start.bat` in the root folder, or execute:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch.ps1
```
The launcher will:
- Check all Python, Node.js, and Ollama prerequisites.
- Verify that `qwen3:4b` is ready.
- Launch the FastAPI backend on `http://127.0.0.1:8000`.
- Launch the Next.js frontend on `http://localhost:3000`.
- Automatically open your default browser to `http://localhost:3000`.

### Option B: Manual Two-Terminal Launch

**Terminal 1 — Backend (FastAPI on Port 8000):**
```powershell
# From repository root:
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

# Or using the dedicated launcher script:
powershell -ExecutionPolicy Bypass -File .\scripts\dev-backend.ps1
```
*Health Probe:* [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)  
*API Documentation:* [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Terminal 2 — Frontend (Next.js on Port 3000):**
```powershell
# From repository root:
npm run dev

# Or from frontend/ folder:
cd frontend; npm run dev
```
*Play Game:* [http://localhost:3000](http://localhost:3000)

---

## 5. Stopping the Application

To shut down services cleanly:
- Press `Ctrl+C` in the terminal running `launch.ps1`, **OR**
- Execute the cleanup script:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\stop.ps1
  ```
*(Only the processes started for Séance Studio on ports 8000 and 3000 will be terminated.)*

---

## 6. Troubleshooting & FAQs

### PowerShell "Execution of scripts is disabled on this system"
Run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Port 8000 or Port 3000 Already in Use
Run `scripts\stop.ps1` to terminate lingering development processes:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop.ps1
```

### "Ollama daemon not detected" Warning
Ensure the Ollama application is running in your Windows taskbar tray. You can test reachability by running:
```powershell
curl.exe http://127.0.0.1:11434/api/tags
```
If Ollama is stopped, Séance Studio will smoothly engage its deterministic scripted atmosphere engine so you can continue playing without interruption.
