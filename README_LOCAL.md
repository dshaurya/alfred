# 🖥️ Running Alfred Workstation as a Standalone Local Desktop Application

Alfred has been compiled into a fully integrated standalone native application (built with Electron). Running it locally gives you a dedicated native HUD window that behaves exactly like a local app—no physical web browser or URL typing required! It mounts a background Express Node.js core, runs local automation scripts, and binds directly to your local **Ollama** models with zero CORS restrictions.

---

## 🚀 Quick Start Guide (Load Natively)

### 1. Export the App Code
1. Open the **Settings Panel** (Gear icon ⚙️) in your AI Studio Build workspace.
2. Select **Export code** and download the project as a **ZIP Archive** (or publish it to a GitHub repository).
3. Extract the downloaded ZIP folder anywhere on your computer.

### 2. Verify Your System Prep
Make sure you have these two light dependencies installed:
* **Node.js**: (v18 or higher with npm) — [Download here](https://nodejs.org/)
* **Python**: (Since you have it installed, you are fully set!)

### 3. Launch the Alfred Standalone Desktop Application

* **On Windows**:  
  Double-click the `./start-local.bat` script. This script automatically builds your assets and launches the standalone Electron Alfred shell window.
  
* **On macOS & Linux**:  
  Open your terminal in the extracted directory, make the launcher script executable, and run it:
  ```bash
  chmod +x start-local.sh
  ./start-local.sh
  ```

Once launched, the terminal window will initialize the core server in the background and boot the **Alfred Standalone desktop app window** automatically!

---

## 🐍 Integrating Your Python Workspace

You can run your customized scripts within Alfred's local directory sandbox.

### 1. Requirements Setup
We have prepared a Python requirements file listing all automation handlers. Install them in your environment:
```bash
pip install -r requirements.txt
```

### 2. Run the Executable Automation Module `run.py`
We made the driver file `/workspace/run.py` fully executable. You can run it from your command line to test your settings, verify setups, and query Ollama state:

* **List available local Ollama models and diagnose connection**:
  ```bash
  python workspace/run.py status
  ```
* **Install prerequisites automated**:
  ```bash
  python workspace/run.py install
  ```
* **Run active script validations in the workspace**:
  ```bash
  python workspace/run.py test
  ```

---

## 🦙 Configuring & Connecting Ollama

Alfred acts as a fully native desktop client interface for Ollama.

1. **Boot Ollama**: Open Ollama on your machine (runs continuously in your background on `http://localhost:11434` by default).
2. **Download Models**: In your terminal, download any model of your choice to your local computer:
   ```bash
   ollama run llama3.2:3b
   # or
   ollama run deepseek-coder:6.7b
   ```
3. **Select on Alfred HUD**: In the bottom chat command input area or in the customization sections, Alfred will query your live system, detect your models, and let you select them from the model dropdown switcher!
4. **Proxy Mechanism**: Because Alfred uses a custom Express Node.js backend relay route, all requests made from the browser are proxied local server-to-server, bypassing any CORS boundaries.

Enjoy your ultimate private cyber developer workstation running directly on your machine!
