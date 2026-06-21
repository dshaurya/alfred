# 🖥️ Running Alfred Workstation Locally on Your PC

Alfred is a fully functional React + Node.js (Express) cyber-themed developer workstation. Because it includes a dedicated backend server, running it locally gives you the power to execute automation scripts, read/write local files securely, and connect directly to your local **Ollama** models with zero browser CORS restrictions.

---

## 🚀 Quick Start Guide (Run with 1 Click)

### 1. Export the App Code
1. Open the **Settings Panel** (Gear icon ⚙️) in your AI Studio Build workspace.
2. Select **Export code** and download the project as a **ZIP Archive** (or publish it to a GitHub repository).
3. Extract the downloaded ZIP folder anywhere on your computer.

### 2. Verify Your System Prep
Make sure you have these two light dependencies installed:
* **Node.js**: (v18 or higher) — [Download here](https://nodejs.org/)
* **Python**: (Since you have it installed, you are fully set!)

### 3. Launch Alfred Natively

* **On Windows**:  
  Double-click the `./start-local.bat` script.
  
* **On macOS & Linux**:  
  Open your terminal in the extracted directory, make the launcher script executable, and run it:
  ```bash
  chmod +x start-local.sh
  ./start-local.sh
  ```

Once launched, Alfred will automatically spin up on:  
👉 **[http://localhost:3000](http://localhost:3000)**

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

Alfred is designed to act as your ultimate frontend dashboard for Ollama.

1. **Boot Ollama**: Open Ollama on your machine (it runs continuously in your background on `http://localhost:11434` by default).
2. **Download Models**: In your terminal, download any model of your choice to your local computer:
   ```bash
   ollama run llama3.2:3b
   # or
   ollama run deepseek-coder:6.7b
   ```
3. **Select on Alfred HUD**: Open Alfred in your browser at `http://localhost:3000`. In the bottom chat command input area or in the customization sections, Alfred will query your live system, detect your models, and let you select them from the model dropdown switcher!
4. **Proxy Mechanism**: Because Alfred uses a custom Express Node.js backend relay route, all requests made from the browser are proxied local server-to-server, bypassing any CORS boundaries.

Enjoy your ultimate private cyber developer workstation running directly on your machine!
