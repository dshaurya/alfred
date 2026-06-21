const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Clean up child processes on exit
function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
    serverProcess = null;
  }
}

function startBackend() {
  console.log('[Alfred Main]: Initializing background Cyber Server...');
  
  // Set default node env to production for packaging
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  // Path to our compiled express server bundle
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');

  try {
    // Spawn server as independent child process to isolate context perfectly
    serverProcess = spawn(process.execPath || 'node', [serverPath], {
      env: { ...process.env },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Alfred Server]: ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Alfred Server Error]: ${data.toString().trim()}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`[Alfred Server]: Process exited with code ${code}`);
    });
  } catch (error) {
    console.error('[Alfred Main]: Failed to start backend subprocess:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Alfred Cyber Workstation",
    backgroundColor: '#09090b', // Tailwind zinc-950 base
    show: false, // Prevent white flash before render finishes
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Custom minimalist menu bar suitable for a hacker utility
  const template = [
    {
      label: 'System',
      submenu: [
        { label: 'Reload Workspace', role: 'reload' },
        { label: 'Force Reload UI', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Toggle Terminal Inspector', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Mute/Exit Workstation', role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Reset Display Zoom', role: 'resetZoom' },
        { label: 'Zoom In HUD', role: 'zoomIn' },
        { label: 'Zoom Out HUD', role: 'zoomOut' }
      ]
    },
    {
      label: 'Diagnostics',
      submenu: [
        {
          label: 'Ollama Node Manual Check',
          click: async () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Ollama Link Status',
              message: 'Local Ollama Connection Profile',
              detail: 'Alfred connects directly to http://localhost:11434 from the local workstation. Ensure you have run "ollama run <model>" on your system terminal to load models.'
            });
          }
        },
        {
          label: 'Wipe Passcode Memory Cache',
          click: async () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                fetch('/api/auth/reset', { method: 'POST' })
                  .then(() => window.location.reload());
              `);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load our active local server HUD
  mainWindow.loadURL('http://localhost:3000');

  // Show window only when fully loaded and styled to preserve high-contrast dark theme
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Bootstrapper initialization
app.whenReady().then(() => {
  startBackend();

  // Give the background node express server 1.2s to claim port 3000 safely
  setTimeout(() => {
    createWindow();
  }, 1200);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanup();
});
