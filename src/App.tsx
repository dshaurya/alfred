import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Lock,
  Unlock,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Code,
  Play,
  Folder,
  FileText,
  CheckCircle,
  Database,
  Shield,
  Zap,
  Sparkles,
  AlertCircle,
  HardDrive,
  Wifi,
  Eye,
  EyeOff,
  Check,
  X,
  Menu,
  Server,
  CloudLightning,
  Monitor,
  Cpu,
  Save,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

import {
  Message,
  Conversation,
  CustomModel,
  Settings as AppSettings,
  WorkspaceFile,
  SystemDiagnostic,
  SyncRecord,
} from "./types";

import MatrixRain from "./components/MatrixRain";

const renderFormattedText = (text: string) => {
  if (!text) return null;
  
  // Split message text by standard triple backtick markdown blocks first.
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(codeBlockRegex);
  
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeLines = part.slice(3, -3).trim();
      const firstNewLine = codeLines.indexOf("\n");
      let lang = "";
      let code = codeLines;
      if (firstNewLine !== -1 && firstNewLine < 15) {
        lang = codeLines.substring(0, firstNewLine).trim();
        code = codeLines.substring(firstNewLine + 1);
      }
      return (
        <div key={i} className="my-2.5 border border-purple-900/40 rounded-xl overflow-hidden bg-black/95 font-mono shadow-md">
          {lang && (
            <div className="bg-zinc-900 border-b border-purple-900/20 px-3 py-1 text-[9px] text-fuchsia-400 font-bold flex justify-between items-center select-none uppercase">
              <span>{lang}</span>
              <span className="text-[8px] text-zinc-500 font-normal">Alfred Sandbox Node</span>
            </div>
          )}
          <pre className="p-3 text-[11px] overflow-x-auto text-green-400 style-scrollbar leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    
    // Process markdown double asterisk bold, single asterisk bold, and single backticks
    const inlineRegex = /(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|`[\s\S]*?`)/g;
    const subParts = part.split(inlineRegex);
    
    return (
      <span key={i} className="inline-block w-full whitespace-pre-wrap leading-relaxed">
        {subParts.map((subPart, j) => {
          if (subPart.startsWith("**") && subPart.endsWith("**")) {
            return (
              <strong key={j} className="font-bold text-fuchsia-300 font-sans tracking-wide">
                {subPart.slice(2, -2)}
              </strong>
            );
          }
          if (subPart.startsWith("*") && subPart.endsWith("*")) {
            return (
              <strong key={j} className="font-bold text-fuchsia-300 font-sans tracking-wide">
                {subPart.slice(1, -1)}
              </strong>
            );
          }
          if (subPart.startsWith("`") && subPart.endsWith("`")) {
            return (
              <code key={j} className="px-1.5 py-0.5 rounded bg-black border border-purple-900/40 text-cyan-300 font-mono text-[11px] mx-0.5">
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        })}
      </span>
    );
  });
};

export default function App() {
  // Passcode Auth & Lock Screen
  const [authStatus, setAuthStatus] = useState<{ initialized: boolean; unlocked: boolean }>({
    initialized: false,
    unlocked: false,
  });
  const [passcode, setPasscode] = useState("");
  const [passcodeConfirm, setPasscodeConfirm] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Vault Payload Data (Only loaded in memory after unlock)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: "deep-purple",
    matrixRain: true,
    ollamaUrl: "http://localhost:11434",
    autoLockMinutes: 10,
    resourceRefreshRate: 2,
  });

  // Active User Selection
  const [activeSessionId, setActiveSessionId] = useState<string>("welcome-session");
  const [selectedModelId, setSelectedModelId] = useState<string>("onyx-pro-coder");
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatIndicator, setChatIndicator] = useState("");

  // Views & UI flow
  const [activeTab, setActiveTab] = useState<"chat" | "files" | "models" | "sync" | "diagnostics">("chat");
  const [dashboardOpen, setDashboardOpen] = useState(true); // Persistent launcher indicator toggles this
  const [systemLogs, setSystemLogs] = useState<string[]>(["[04:25:14] Alfred Workstation initialized."]);

  // Workspace Files
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [editingFileContent, setEditingFileContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Custom Model Form state (Open WebUI style Custom Actions)
  const [newModelName, setNewModelName] = useState("");
  const [newModelBase, setNewModelBase] = useState("");
  const [newModelPrompt, setNewModelPrompt] = useState("");
  const [newModelTemp, setNewModelTemp] = useState(0.7);
  const [newModelStop, setNewModelStop] = useState("");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [modelCreationError, setModelCreationError] = useState("");

  // System Diagnostics (LIGHTWEIGHT resource monitoring)
  const [diagnostic, setDiagnostic] = useState<SystemDiagnostic>({
    ollamaOnline: false,
    activeModels: [],
    cpu: 4,
    ram: 220,
    timestamp: "04:25:14",
    loadHistory: [2, 4, 3, 5, 4],
  });

  const [fetchedOllamaModels, setFetchedOllamaModels] = useState<any[]>([]);

  // Terminal state inside Workspace
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; err: boolean }>>([
    {
      cmd: "help",
      out: `=== Onyx Custom Workspace Simulator Console ===\nAvailable Commands:\n  ls                      List files in secure workspace node.\n  cat <file>              Fetch and inspect binary content of file node.\n  python3 <file.py>        Interpret Python execution file in workspace sandbox.\n  bash <file.sh>          Run automation scripts.\n  help                    Print out helper diagnostic directives.\n  clear                   Clear terminal history records.\n`,
      err: false,
    },
  ]);

  // Cloud multi-platform settings
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [cloudEndpoint, setCloudEndpoint] = useState("https://onyx-cloud.cyber.secure/v1/sync");
  const [cloudSyncLogs, setCloudSyncLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Chat/Terminal Ref scrolling
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch authentication status initially
  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status");
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data);
        if (data.unlocked) {
          fetchVaultData();
        }
      }
    } catch (err) {
      addLog("[-] Remote authorization bridge connection failed.");
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch decrypted key records
  const fetchVaultData = async () => {
    try {
      const response = await fetch("/api/vault/data");
      if (response.ok) {
        const data = await response.json();
        if (data.conversations) setConversations(data.conversations);
        if (data.customModels) setCustomModels(data.customModels);
        if (data.settings) {
          setSettings(data.settings);
          // Apply model URL or defaults
        }
        addLog("[+] Decrypted in-memory payload successfully loaded.");
      } else {
        // Clear state if server rebooted / became locked
        setAuthStatus({ initialized: true, unlocked: false });
      }
    } catch (e) {
      addLog("[-] Desync error during decrypt memory mapping.");
    }
  };

  // Setup Vault passcode
  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length < 4) {
      setAuthError("Master passphrase must be at least 4 chars.");
      return;
    }
    if (passcode !== passcodeConfirm) {
      setAuthError("Passcodes do not match.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthStatus({ initialized: true, unlocked: true });
        fetchVaultData();
        setPasscode("");
        setPasscodeConfirm("");
        addLog("[+] Cryptographic AES vault initialized and secured.");
      } else {
        setAuthError(data.error || "Cryptographic failure.");
      }
    } catch (err) {
      setAuthError("Node communication error.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Unlock existing vault
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setAuthError("Passcode input required.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthStatus({ initialized: true, unlocked: true });
        await fetchVaultData();
        setPasscode("");
        addLog("[+] Decryption keys loaded. Safe node unlock approved.");
      } else {
        setAuthError(data.error || "Decryption failed. Invalid pass-signature.");
      }
    } catch (err) {
      setAuthError("Decryption processor link offline.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Relock vault (wipe active keys from memory)
  const handleLockVault = async () => {
    try {
      const response = await fetch("/api/auth/lock", { method: "POST" });
      if (response.ok) {
        setAuthStatus(prev => ({ ...prev, unlocked: false }));
        setConversations([]);
        setSelectedFile(null);
        addLog("[*] Emitted flush memory command. Security keys dropped.");
      }
    } catch (err) {
      // Offline fallback
      setAuthStatus(prev => ({ ...prev, unlocked: false }));
    }
  };

  // Completely wipe and reset vault if passcode is forgotten
  const handleResetVault = async () => {
    if (!window.confirm("Are you sure you want to completely wipe the Alfred Security Vault? All customized model behaviors and stored conversation history details will be deleted permanently.")) {
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth/reset", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setAuthStatus({ initialized: false, unlocked: false });
        setPasscode("");
        setPasscodeConfirm("");
        setConversations([]);
        addLog("[*] System wiped successfully. Vault reset to initial state.");
      } else {
        setAuthError(data.error || "Reset command rejected.");
      }
    } catch (err) {
      setAuthError("Failed to issue remote system wipe command.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Save current volatile memory back to encrypted file index
  const saveVaultToServer = async (
    updatedConversations: Conversation[],
    updatedCustomModels: CustomModel[] = customModels,
    updatedSettings: AppSettings = settings
  ) => {
    try {
      await fetch("/api/vault/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversations: updatedConversations,
          customModels: updatedCustomModels,
          settings: updatedSettings,
        }),
      });
    } catch (e) {
      addLog("[-] Failed to auto-commit encryption block index.");
    }
  };

  // Fetch lightweight system diagnostics
  const refreshDiagnostics = async () => {
    try {
      const response = await fetch(`/api/system/status?ollamaUrl=${encodeURIComponent(settings.ollamaUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setDiagnostic(data);
      }
    } catch (err) {
      // Offline simulation fallback
    }
  };

  // Fetch the full list of Ollama models from the local config
  const fetchOllamaModelsList = async () => {
    try {
      const response = await fetch(`/api/ollama/models?ollamaUrl=${encodeURIComponent(settings.ollamaUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setFetchedOllamaModels(data.models || []);
      }
    } catch (err) {
      // Simulation or failure fallback
    }
  };

  // Fetch workspace files list
  const refreshWorkspaceFiles = async () => {
    try {
      const response = await fetch("/api/workspace/files");
      if (response.ok) {
        const data = await response.json();
        setWorkspaceFiles(data.files || []);
      }
    } catch (err) {
      addLog("[-] Unable to mount local files index.");
    }
  };

  // Poll system and workspace properties
  useEffect(() => {
    if (authStatus.unlocked) {
      refreshDiagnostics();
      refreshWorkspaceFiles();
      fetchOllamaModelsList();

      const timerIdx = setInterval(() => {
        refreshDiagnostics();
      }, settings.resourceRefreshRate * 1000);

      return () => clearInterval(timerIdx);
    }
  }, [authStatus.unlocked, settings.resourceRefreshRate, settings.ollamaUrl]);

  // Log feed updates
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [...prev.slice(-9), `[${timestamp}] ${msg}`]);
  };

  // Scrollers
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, chatLoading]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const activeSession = conversations.find(c => c.id === activeSessionId) || conversations[0];
  
  let activeModel = customModels.find(m => m.id === selectedModelId);
  if (!activeModel && selectedModelId && selectedModelId.startsWith("ollama_")) {
    const modelName = selectedModelId.replace("ollama_", "");
    activeModel = {
      id: selectedModelId,
      name: `Ollama: ${modelName}`,
      baseModel: modelName,
      systemPrompt: "You are Alfred, a secure terminal automation workstation agent. Write standard markdown blocks containing full code files with '[FILE: filename.ext]'. Ensure your replies are extremely professional, helpful, concise.",
      temperature: 0.7,
      stopSequences: "",
      description: `Direct interactive channel to Ollama custom model: ${modelName}`
    };
  }
  if (!activeModel) {
    activeModel = customModels[0];
  }

  // Model Behavior Builder (Open WebUI Custom Model generation)
  const handleCreateCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName || !newModelBase || !newModelPrompt) {
      setModelCreationError("Required specifications not fulfilled.");
      return;
    }

    const newId = `custom-agent-${Date.now()}`;
    const newAgent: CustomModel = {
      id: newId,
      name: newModelName,
      baseModel: newModelBase,
      systemPrompt: newModelPrompt,
      temperature: newModelTemp,
      stopSequences: newModelStop || undefined,
      description: newModelDesc || `Child node derived from ${newModelBase}`,
    };

    const updatedAgents = [...customModels, newAgent];
    setCustomModels(updatedAgents);
    setSelectedModelId(newId);
    
    // reset form fields
    setNewModelName("");
    setNewModelBase("");
    setNewModelPrompt("");
    setNewModelTemp(0.7);
    setNewModelStop("");
    setNewModelDesc("");
    setModelCreationError("");
    setActiveTab("chat");

    addLog(`[+] Configured behavior system [${newAgent.name}] derived from [${newAgent.baseModel}]`);
    await saveVaultToServer(conversations, updatedAgents, settings);
  };

  const handleDeleteCustomModel = async (id: string) => {
    if (id === "onyx-pro-coder" || id === "alfred-pro-coder") return; // Keep base
    const updated = customModels.filter(m => m.id !== id);
    setCustomModels(updated);
    if (selectedModelId === id) {
      setSelectedModelId("onyx-pro-coder");
    }
    addLog(`[-] Purged model layout [${id}]`);
    await saveVaultToServer(conversations, updated, settings);
  };

  // CHAT INTERACTION DAEMON
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || chatLoading) return;

    const userText = newMessage;
    setNewMessage("");

    // Setup active session if not found
    let workingSession = activeSession;
    let freshConvs = [...conversations];

    if (!workingSession) {
      workingSession = {
        id: `sess-${Date.now()}`,
        title: userText.split(" ").slice(0, 4).join(" ") + "...",
        model: activeModel?.name || "Local Base Network",
        lastUpdated: new Date().toISOString(),
        messages: [],
      };
      freshConvs = [workingSession, ...freshConvs];
      setConversations(freshConvs);
      setActiveSessionId(workingSession.id);
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString(),
    };

    const updatedMsgs = [...workingSession.messages, userMsg];
    workingSession.messages = updatedMsgs;
    workingSession.lastUpdated = new Date().toISOString();
    
    // Update first conversation title if generic
    if (workingSession.title === "New Terminal Query" || workingSession.id === "welcome-session" && workingSession.messages.length <= 3) {
      workingSession.title = userText.charAt(0).toUpperCase() + userText.slice(1, 26) + "...";
    }

    setConversations([...freshConvs]);
    setChatLoading(true);
    setChatIndicator("Decrypting pipeline stream...");

    try {
      addLog(`[*] Emitted system prompt node context mapping with ${activeModel.name}`);
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs,
          model: activeModel.baseModel,
          systemPrompt: activeModel.systemPrompt,
          temperature: activeModel.temperature,
          ollamaUrl: settings.ollamaUrl,
        }),
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        
        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: chatData.text || "An unexpected silent failure trace occurred.",
          timestamp: new Date().toISOString(),
        };

        workingSession.messages = [...updatedMsgs, assistantMsg];
        setConversations([...freshConvs]);
        await saveVaultToServer([...freshConvs], customModels, settings);

        if (chatData.autoSyncedFiles && chatData.autoSyncedFiles.length > 0) {
          addLog(`[⚡] Files auto-created by assistant in workspace: ${chatData.autoSyncedFiles.join(", ")}`);
          refreshWorkspaceFiles();
        }

        addLog(`[+] Response fetched via ${chatData.source}`);
      } else {
         const errorData = await chatRes.json();
         const errorMsg: Message = {
          id: `err-${Date.now()}`,
          sender: "system",
          text: `Pipeline failure error code: ${chatRes.status}. Message: ${errorData.error || "Internal Error"}`,
          timestamp: new Date().toISOString(),
        };
        workingSession.messages = [...updatedMsgs, errorMsg];
        setConversations([...freshConvs]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "system",
        text: `Secure stream routing error: Server backend link unreachable. Check developer configuration. Detail: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      workingSession.messages = [...updatedMsgs, errorMsg];
      setConversations([...freshConvs]);
    } finally {
      setChatLoading(false);
      setChatIndicator("");
    }
  };

  const handleStartNewSession = () => {
    const newSess: Conversation = {
      id: `session-${Date.now()}`,
      title: "New Terminal Query",
      model: activeModel?.name || "Local Network",
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: `Active session bound with model: ${activeModel?.name || "Llama3.2/Gemini Fallback"}. Workspace secure.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const updated = [newSess, ...conversations];
    setConversations(updated);
    setActiveSessionId(newSess.id);
    setActiveTab("chat");
    addLog(`[+] Spawned new conversation stream instance.`);
    saveVaultToServer(updated);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    }
    addLog(`[-] Deleted session query sector [${id}]`);
    await saveVaultToServer(updated);
  };

  // WORKSPACE FILE ACTIONS
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      const fileRes = await fetch("/api/workspace/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedFile.name, content: editingFileContent }),
      });
      if (fileRes.ok) {
        addLog(`[+] File ${selectedFile.name} successfully updated on workspace node.`);
        refreshWorkspaceFiles();
        // Update local object representation
        setSelectedFile(prev => prev ? { ...prev, content: editingFileContent } : null);
      }
    } catch (e) {
      addLog("[-] File input output streaming write failed.");
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const fileRes = await fetch("/api/workspace/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFileName, content: "## Workspace Cyber Node File\n# Created in workspace." }),
      });
      if (fileRes.ok) {
        setNewFileName("");
        setIsCreatingFile(false);
        refreshWorkspaceFiles();
        addLog(`[+] Workspace allocation success: created [${newFileName}]`);
      }
    } catch (err) {
      addLog("[-] Create file failure protocol.");
    }
  };

  const handleDeleteFile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const delRes = await fetch("/api/workspace/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (delRes.ok) {
        if (selectedFile?.name === name) {
          setSelectedFile(null);
        }
        refreshWorkspaceFiles();
        addLog(`[-] Swept workspace sector: deleted [${name}]`);
      }
    } catch (e) {
      addLog("[-] File wipe operation halted.");
    }
  };

  // TERMINAL MOCK CONTROLLER
  const handleRunTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput("");

    if (cmd === "clear") {
      setTerminalHistory([]);
      return;
    }

    try {
      const resp = await fetch("/api/workspace/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setTerminalHistory(prev => [...prev, { cmd, out: data.output, err: data.error }]);
      }
    } catch (err) {
      setTerminalHistory(prev => [...prev, { cmd, out: "Simulation command failed to ping host.", err: true }]);
    }
  };

  // MULTI-PLATFORM CLOUD SYNC SIMULATOR
  const handleTriggerCloudSync = async () => {
    setSyncing(true);
    setCloudSyncLogs([`[04:25:22] Compiling encrypted file indexes...`]);
    try {
      const resp = await fetch("/api/sync/cloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configList: [cloudEndpoint, "MainframeSync"] }),
      });
      if (resp.ok) {
        const data = await resp.json();
        let loopIndex = 0;
        const syncTimer = setInterval(() => {
          if (loopIndex < data.logs.length) {
            setCloudSyncLogs(prev => [...prev, data.logs[loopIndex]]);
            loopIndex++;
          } else {
            clearInterval(syncTimer);
            setSyncing(false);
            addLog(`[+] Offline database synchronization with server complete.`);
          }
        }, 800);
      }
    } catch (err) {
      setSyncing(false);
      setCloudSyncLogs(prev => [...prev, "[-] Pipeline sync error: Multi-cloud endpoint reject."]);
    }
  };

  // Update system configurations securely
  const handleUpdateSettings = async (updated: Partial<AppSettings>) => {
    const fresh = { ...settings, ...updated };
    setSettings(fresh);
    addLog("[*] Configuration preferences modified.");
    await saveVaultToServer(conversations, customModels, fresh);
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-hidden ${settings.theme === 'matrix-green' ? 'text-green-400 bg-black font-mono scanline' : 'text-purple-300 bg-black font-mono scanline'}`}>
      
      {/* Immersive Cyber Matrix Rain Background Component */}
      <MatrixRain theme={settings.theme} enabled={settings.matrixRain} />

      {/* FIXED ON-SCREEN QUICK LAUNCHER WIDGET AT BOTTOM LEFT (Toggle full dashboard widget seamless) */}
      <div className="fixed bottom-3 left-4 z-50 flex items-center space-x-2">
        <button
          id="btn-bottom-left-launcher"
          onClick={() => {
            setDashboardOpen(!dashboardOpen);
            addLog(`[Launcher] Operator dashboard toggle command: ${!dashboardOpen ? 'EXPAND' : 'COLLAPSE'}`);
          }}
          className={`flex items-center justify-center h-12 w-12 rounded-full border shadow-lg ${
            dashboardOpen
              ? "bg-purple-950/90 hover:bg-purple-900 border-purple-500 text-purple-200"
              : "bg-black/90 hover:bg-zinc-900 border-purple-600 text-purple-400 animate-pulse"
          } transition-all duration-300 scale-100 hover:scale-110 active:scale-95 cursor-pointer`}
          title="Toggle Alfred Dashboard Node"
        >
          <Terminal className="h-6 w-6" />
        </button>
        {!dashboardOpen && (
          <div className="bg-black/85 border border-purple-950 px-3 py-1.5 rounded-lg text-xs tracking-wider font-mono animate-fade-in text-zinc-400 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            <span>Alfred Cyber Agent: Active/Minified</span>
          </div>
        )}
      </div>

      {/* LOCKED ENTRY VAULT KEYPAD SECURITY (Passlock Encryption Component) */}
      {!authStatus.unlocked && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-4 z-40 font-mono crt-screen">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/15 via-black to-black opacity-90 pointer-events-none"></div>
          
          <div className="max-w-md w-full bg-zinc-950 border border-purple-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500"></div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-purple-950/40 text-purple-400 border border-purple-700/40 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse">
                <Shield className="h-9 w-9 text-purple-300" />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-widest text-purple-100 font-sans">
                Alfred Cyber Workstation
              </h1>
              <p className="text-xs text-purple-400 mt-2 tracking-wide font-sans">
                AES-256 SECURED CRYPTO-SANDBOX
              </p>
            </div>

            {/* If first time boot, create passcode settings */}
            {!authStatus.initialized ? (
              <form onSubmit={handleSetupVault} className="space-y-4">
                <div className="bg-purple-950/20 border border-purple-800/35 p-4 rounded-xl text-xs leading-relaxed text-purple-300 space-y-2">
                  <div className="font-bold text-purple-200 uppercase tracking-wider flex items-center">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                    <span>Choose Your Passcode!</span>
                  </div>
                  <p>
                    You are initializing this workstation for the first time. **There is no default passcode!** Please type any passkey of your choice below to encrypt your local database.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-purple-400 tracking-widest block font-sans">Configure Master Vault Key</label>
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter a secure unlock secret"
                      className="w-full bg-black/80 border border-purple-800/80 rounded-xl p-3 text-purple-100 placeholder-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-3.5 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showPasscode ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-purple-400 tracking-widest block font-sans">Re-Verify Key Integrity</label>
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcodeConfirm}
                    onChange={(e) => setPasscodeConfirm(e.target.value)}
                    placeholder="Verify passcode"
                    className="w-full bg-black/80 border border-purple-800/80 rounded-xl p-3 text-purple-100 placeholder-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono transition-all duration-200"
                    required
                  />
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-950/65 border border-red-800/80 text-red-300 rounded-xl text-xs flex items-center space-x-2 font-sans">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-purple-800 to-fuchsia-800 hover:from-purple-700 hover:to-fuchsia-700 text-purple-50 font-bold p-3.5 rounded-xl tracking-widest cursor-pointer uppercase transition duration-200 shadow-lg border border-purple-600/50 flex items-center justify-center space-x-2"
                >
                  {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4.5 w-4.5" />}
                  <span>Secure & Deploy Workspace</span>
                </button>
              </form>
            ) : (
              // Unlock active passcode
              <form onSubmit={handleUnlockVault} className="space-y-4">
                <div className="bg-purple-950/20 border border-purple-900/40 p-3.5 rounded-xl text-xs leading-relaxed text-purple-300/90 space-y-2">
                  <div className="text-zinc-400 font-sans text-[11px]">
                    <span className="text-cyan-400 font-semibold">[Locked Node]:</span> Enter your custom passcode to decrypt your local memory environment.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-purple-400 tracking-widest">Master Key Authorization</label>
                    <span className="text-[10px] text-green-500 font-mono flex items-center space-x-1">
                      <Wifi className="h-3 w-3 inline" />
                      <span>Node Online</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Input passcode key to decrypt"
                      className="w-full bg-black/80 border border-purple-800/80 rounded-xl p-3.5 text-purple-100 placeholder-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono text-center tracking-widest text-lg"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-4 top-4.5 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showPasscode ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-950/65 border border-red-800/80 text-red-300 rounded-xl text-xs flex items-center space-x-2 font-sans">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-purple-800 border border-purple-600 hover:bg-purple-700 text-purple-50 font-semibold p-3.5 rounded-xl tracking-widest cursor-pointer uppercase transition duration-200 flex items-center justify-center space-x-2"
                >
                  {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unlock className="h-4.5 w-4.5" />}
                  <span>Unlock Alfred Workstation</span>
                </button>

                {/* DYNAMIC RESET OPTION FOR Operator WHO FORGOT PASSCODE */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResetVault}
                    className="text-[10px] uppercase tracking-wider text-purple-500 hover:text-cyan-400 hover:underline transition-colors font-sans focus:outline-none cursor-pointer"
                  >
                    Forgot passcode? Wipe Workspace & Reset Vault &rarr;
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-purple-900/40 flex justify-between text-[10px] text-purple-500">
              <span>ALGORITHM: AES-256-CBC</span>
              <span>EPHEMERAL DECRYPTER STATE</span>
            </div>
          </div>
        </div>
      )}

      {/* MINIMIZED WATERMARK DESKTOP RUNNING SCREEN */}
      {!dashboardOpen && authStatus.unlocked && (
        <div className="flex-1 w-full bg-[#020106]/40 flex flex-col items-center justify-center relative select-none p-6 font-mono">
          <div className="absolute top-4 right-4 bg-zinc-950/80 border border-zinc-800/60 rounded-lg p-3 max-w-xs animate-fade-in z-10 w-64 text-xs space-y-2">
            <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-1.5 uppercase font-sans font-semibold tracking-wider text-[10px]">
              <span>Node Statistics</span>
              <span className="text-green-500">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Ollama API:</span>
              <span className={diagnostic.ollamaOnline ? "text-green-400" : "text-amber-500"}>
                {diagnostic.ollamaOnline ? "Connected" : "Gemini Fallback"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CPU Usage:</span>
              <span>{diagnostic.cpu}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">RAM Load:</span>
              <span>{diagnostic.ram} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Files Sync:</span>
              <span className="text-purple-400 hover:underline cursor-pointer" onClick={() => setDashboardOpen(true)}>{workspaceFiles.length} Nodes</span>
            </div>
          </div>

          <div className="text-center space-y-4 max-w-md bg-zinc-950/60 p-8 rounded-2xl border border-purple-950/30 backdrop-blur-sm shadow-2xl">
            <h2 className="text-3xl font-display font-semibold tracking-widest opacity-80 uppercase text-purple-400">
              Alfred Terminal App
            </h2>
            <p className="text-xs text-zinc-500 tracking-wide leading-relaxed max-w-sm">
              Your Linux cyberpunk system console is minified. Live code listeners and auto-file compilers continue to compile script streams silently. Click the glowing toggle at the bottom-left to expand the HUD.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setDashboardOpen(true)}
                className="bg-purple-950/40 hover:bg-purple-950/80 text-purple-300 text-xs tracking-widest uppercase border border-purple-800/40 px-5 py-2.5 rounded-lg transition-all duration-300 outline-none cursor-pointer"
              >
                Access Cyber Dashboard
              </button>
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="absolute bottom-6 left-20 text-[11px] text-zinc-600 max-w-md bg-black/50 p-2.5 rounded border border-zinc-900/60">
            <span className="text-purple-500 font-semibold">[Workspace Sector]:</span> Keep Ollama running on <span className="underline">localhost:11434</span> to chat on native local models, or configure Gemini on secrets API bridge.
          </div>
        </div>
      )}

      {/* EXPANDED SYSTEM DASHBOARD WINDOW */}
      {dashboardOpen && authStatus.unlocked && (
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full z-10 crt-screen">
          
          {/* LEFT SIDEBAR: CONVERSATIONS & CUSTOM MODELS SETUP */}
          <div className="lg:col-span-3 bg-zinc-950/95 border-r border-purple-950 flex flex-col justify-between overflow-y-auto min-h-0">
            <div className="p-4 space-y-6">
              
              {/* BRAND HEADER & LOGOUT */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-950/60">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-purple-400" />
                  <span className="font-display font-bold text-sm tracking-wider uppercase text-purple-200">
                    Alfred OS Workspace
                  </span>
                </div>
                <button
                  onClick={handleLockVault}
                  className="p-1 px-2 border border-purple-900 bg-purple-950/35 hover:bg-purple-900 text-purple-300 rounded text-[10px] uppercase font-semibold cursor-pointer transition flex items-center space-x-1"
                  title="Lock Encryption Block and flush memory"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Lock</span>
                </button>
              </div>

              {/* CORE LAUNCH SESSION BUTTON */}
              <button
                onClick={handleStartNewSession}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-950/60 to-purple-800/40 hover:from-purple-900 hover:to-purple-700/50 text-purple-100 text-xs font-semibold py-2.5 px-3 rounded-lg border border-purple-700/55 transition duration-200 shadow-md cursor-pointer outline-none"
              >
                <Plus className="h-4 w-4" />
                <span className="uppercase tracking-widest text-[11px]">Spawn New Session</span>
              </button>

              {/* CONVERSATIONS HISTORY SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans px-1">
                  <span>Active Query Sectors</span>
                  <span>({conversations.length})</span>
                </div>
                {conversations.length === 0 ? (
                  <div className="p-3 text-xs text-zinc-600 italic">No stored conversations history.</div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveSessionId(conv.id);
                          setActiveTab("chat");
                        }}
                        className={`group flex items-center justify-between p-2 rounded text-xs transition-all duration-150 cursor-pointer ${
                          conv.id === activeSessionId
                            ? "bg-purple-950/70 border border-purple-800 text-purple-100"
                            : "bg-black/40 hover:bg-zinc-900/40 text-zinc-400 hover:text-purple-300 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <Terminal className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                          <span className="truncate font-mono text-[11px]">{conv.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MODEL PROPERTIES & BEHAVIORS CONFIGS (Ollama-style) */}
              <div className="space-y-3 pt-3 border-t border-purple-950/40">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans">
                    Core Decrypt Agent UI
                  </span>
                  <button
                    onClick={() => setActiveTab("models")}
                    className="text-[10px] bg-purple-950/40 border border-purple-900/50 hover:bg-purple-950 px-1.5 py-0.5 rounded text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    <span>Create Agent</span>
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {customModels.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedModelId(agent.id)}
                      className={`group flex flex-col p-2 rounded text-xs transition cursor-pointer ${
                        agent.id === selectedModelId
                          ? "bg-purple-900/30 border border-purple-700/60 text-purple-100"
                          : "bg-black/20 hover:bg-zinc-900/20 text-zinc-500 hover:text-purple-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[11px] truncate flex items-center space-x-1">
                          <Sparkles className="h-3 w-3 text-purple-400 mr-1 inline shrink-0" />
                          <span>{agent.name}</span>
                        </span>
                        {agent.id !== "onyx-pro-coder" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomModel(agent.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-0.5 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5 flex justify-between">
                        <span>Base: {agent.baseModel}</span>
                        <span>t={agent.temperature}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* QUICK LINK CONTROLS BOTTOM OF SIDEBAR */}
            <div className="p-4 bg-black/40 border-t border-purple-950/60 space-y-2">
              <button
                onClick={() => setActiveTab("files")}
                className={`w-full flex items-center space-x-2 text-xs p-2 rounded transition cursor-pointer ${
                  activeTab === "files" ? "bg-purple-950 text-purple-200" : "hover:bg-zinc-900 text-zinc-400"
                }`}
              >
                <Folder className="h-4 w-4 text-purple-500" />
                <span>Sandbox Workspace</span>
                <span className="ml-auto bg-purple-900/50 px-1.5 py-0.2 rounded text-[9px]">
                  {workspaceFiles.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("sync")}
                className={`w-full flex items-center space-x-2 text-xs p-2 rounded transition cursor-pointer ${
                  activeTab === "sync" ? "bg-purple-950 text-purple-200" : "hover:bg-zinc-900 text-zinc-400"
                }`}
              >
                <CloudLightning className="h-4 w-4 text-cyan-400" />
                <span>Multi-Cloud Sync</span>
              </button>

              <div className="text-[10px] text-zinc-600 space-y-1 pt-1.5 border-t border-purple-950/20">
                <div className="flex justify-between">
                  <span>Server Local Port</span>
                  <span>3000 (Proxy in)</span>
                </div>
                <div className="flex justify-between">
                  <span>Encrypt Core</span>
                  <span className="text-green-500">AES-CBC-256</span>
                </div>
              </div>
            </div>

          </div>

          {/* CENTER PANEL: DETAILED WORKSPACES */}
          <div className="lg:col-span-6 bg-black flex flex-col justify-between overflow-hidden min-h-0 border-r border-purple-950">
            
            {/* CENTRAL TABS ROUTER BAR */}
            <div className="bg-zinc-950/90 border-b border-purple-950 p-2 text-xs flex items-center justify-between">
              <div className="flex space-x-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded transition uppercase border cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-purple-950 border-purple-800 text-purple-100 font-bold"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-purple-300"
                  }`}
                >
                  Console Terminal
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`px-3 py-1.5 rounded transition uppercase border cursor-pointer ${
                    activeTab === "files"
                      ? "bg-purple-950 border-purple-800 text-purple-100 font-bold"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-purple-300"
                  }`}
                >
                  Workspace Code Blocks
                </button>
                <button
                  onClick={() => setActiveTab("models")}
                  className={`px-3 py-1.5 rounded transition uppercase border cursor-pointer ${
                    activeTab === "models"
                      ? "bg-purple-950 border-purple-800 text-purple-100 font-bold"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-purple-300"
                  }`}
                >
                  Custom Model Builder
                </button>
                <button
                  onClick={() => setActiveTab("sync")}
                  className={`px-3 py-1.5 rounded transition uppercase border cursor-pointer ${
                    activeTab === "sync"
                      ? "bg-purple-950 border-purple-800 text-purple-100 font-bold"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-purple-300"
                  }`}
                >
                  Offline Cloud Sync
                </button>
              </div>

              {/* ACTIVE MODEL SUMMARY METADATA */}
              <div className="hidden sm:flex items-center space-x-2 bg-purple-950/20 border border-purple-900/50 px-2 py-1 rounded">
                <Server className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-purple-200 font-mono tracking-wider">
                  Active agent: {activeModel?.name || "Local CPU"}
                </span>
              </div>
            </div>

            {/* TAB CONTENT: CONSOLE CHAT */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                {/* Conversations Message Feed Frame */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {activeSession ? (
                    activeSession.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col space-y-1 max-w-[85%] ${
                          msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        {/* Sender Node Name */}
                        <span className="text-[9px] text-zinc-500 uppercase font-mono px-1">
                          {msg.sender === "user" ? "Operator" : msg.sender === "system" ? "Kernel Security" : activeModel?.name}
                        </span>

                        {/* Speech Bubble Grid */}
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed font-mono border whitespace-pre-wrap ${
                            msg.sender === "user"
                              ? "bg-purple-950/55 border-purple-800 text-purple-100"
                              : msg.sender === "system"
                              ? "bg-amber-950/30 border-amber-800 text-amber-300 font-semibold"
                              : "bg-zinc-950/90 border-purple-950/90 text-zinc-300"
                          }`}
                        >
                          {renderFormattedText(msg.text)}
                          
                          {/* Code extract flag if relevant */}
                          {msg.sender === "assistant" && msg.text.includes("[FILE:") && (
                            <div className="mt-3 bg-black/90 rounded border border-purple-900 p-2 text-[10px] text-purple-300 font-mono space-y-1">
                              <div className="flex items-center justify-between text-green-400">
                                <span className="font-bold flex items-center space-x-1">
                                  <Code className="h-3.5 w-3.5 inline mr-1" />
                                  <span>COGNITIVE PHYSICAL COMPILER TRACE DETECTED</span>
                                </span>
                                <span className="bg-green-950/50 px-1 py-0.2 text-[8px] border border-green-800 rounded">Automatic Sync Success</span>
                              </div>
                              <p className="text-zinc-400 text-[9.5px]">
                                Your assistant's output contained direct file system syntax instruction rules. This script code stream was automatically formatted and pushed into your `/workspace` partition directory.
                              </p>
                              <button
                                onClick={() => setActiveTab("files")}
                                className="text-purple-400 underline hover:text-purple-300 text-left cursor-pointer"
                              >
                                View full generated files inside Sandbox &rarr;
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp indicator */}
                        <span className="text-[8px] text-zinc-600 px-1.5 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 space-y-2 mt-8">
                      <Terminal className="h-10 w-10 text-purple-950 animate-spin" />
                      <p className="text-sm">Initiating connection bridge matrix... Click 'Spawn New Session' on left bar</p>
                    </div>
                  )}

                  {chatLoading && (
                    <div className="flex flex-col space-y-1 mr-auto items-start max-w-[85%]">
                      <span className="text-[9px] text-purple-400 uppercase font-mono animate-pulse">
                        ALFRED CYBER DAEMON ({activeModel?.name})
                      </span>
                      <div className="bg-zinc-950 border border-purple-900/50 p-3 rounded-lg text-xs font-mono text-zinc-400 flex items-center space-x-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-500" />
                        <span className="animate-pulse">{chatIndicator || "Compiling local neural network cascade... Ready."}</span>
                      </div>
                    </div>
                  )}

                  <div ref={messageEndRef} />
                </div>

                 {/* BOTTOM CHAT INPUT SYSTEM */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3.5 border-t border-purple-900/40 bg-zinc-950/98 space-y-3 shadow-[0_-4px_25px_rgba(0,0,0,0.45)]"
                >
                  {/* Model quick switcher bar */}
                  <div className="flex flex-wrap items-center gap-2 pb-0.5 text-xs">
                    <span className="text-[10px] text-purple-400 font-mono uppercase tracking-widest flex items-center space-x-1 select-none">
                      <Cpu className="h-3 w-3 text-cyan-400" />
                      <span>Operator Model:</span>
                    </span>
                    
                    <select
                      value={selectedModelId}
                      onChange={(e) => {
                        setSelectedModelId(e.target.value);
                        addLog(`[*] Shifted interface terminal channel target: ${e.target.value}`);
                      }}
                      className="bg-black border border-purple-700/60 rounded-xl text-[10px] px-2.5 py-1 text-purple-200 placeholder-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono cursor-pointer transition-all duration-150 select-none hover:border-purple-500"
                    >
                      <optgroup label="Workstation Custom Agents" className="bg-zinc-950 text-purple-300 text-xs">
                        {customModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} [t={m.temperature}]
                          </option>
                        ))}
                      </optgroup>
                      
                      {fetchedOllamaModels.length > 0 && (
                        <optgroup label="Detected Local Ollama Models" className="bg-zinc-950 text-cyan-400 text-xs">
                          {fetchedOllamaModels.map((m: any) => (
                            <option key={m.name} value={`ollama_${m.name}`}>
                              Ollama: {m.name} ({m.details?.parameter_size || "local"})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {/* How to configure trigger badge */}
                    <button
                      type="button"
                      onClick={() => {
                        alert(
                          "HOW TO CONFIGURE LOCAL OLLAMA WITH ALFRED:\n\n" +
                          "1. Boot up Ollama on your computer (default port is 11434).\n" +
                          "2. Keep settings URL pointing to 'http://localhost:11434'.\n" +
                          "3. Since Alfred utilizes a server-side Node proxy, queries are relayed directly from the server to your computer, fully bypassing CORS restrictions!\n" +
                          "4. Run model commands (e.g., 'ollama run llama3.2') to load them into your local library. They will show up in this selection instantly!"
                        );
                      }}
                      className="text-[9px] uppercase tracking-wider text-cyan-300 hover:text-white transition-colors font-sans ml-auto flex items-center space-x-1 cursor-pointer bg-purple-950/40 px-2.5 py-1 border border-purple-800/40 rounded-xl"
                    >
                      <HelpCircle className="h-3 w-3 text-cyan-300" />
                      <span>How to setup Ollama?</span>
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Send terminal command to Alfred agent [Model: ${activeModel?.name || "Ollama"}]...`}
                      className="flex-1 bg-black border-2 border-purple-500 rounded-xl p-3 text-xs text-fuchsia-100 placeholder-purple-400 placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-400 shadow-[0_0_20px_rgba(168,85,247,0.18)] font-mono text-[11.5px] transition-all duration-200"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="bg-purple-600 border-2 border-purple-400 px-5 py-3 text-xs rounded-xl uppercase font-bold text-white hover:bg-fuchsia-600 hover:border-fuchsia-400 md:scale-100 hover:scale-102 active:scale-98 transition duration-200 cursor-pointer disabled:opacity-50 flex items-center space-x-2 shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      <Zap className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
                      <span className="hidden sm:inline">Send Command</span>
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono leading-none select-none">
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3 inline text-purple-400" />
                      <span>Write Python game, Node scripts, Shell variables etc.</span>
                    </span>
                    <span className="hidden md:inline text-purple-400/80">Ollama local binary link proxy configured active</span>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: PHYSICAL FILES MANAGER & SIMULATED RUNNING */}
            {activeTab === "files" && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                {/* Sidebar index files list */}
                <div className="w-full md:w-3/7 border-b md:border-b-0 md:border-r border-purple-950 flex flex-col justify-between overflow-y-auto">
                  <div className="p-3 space-y-3">
                    <div className="flex justify-between items-center border-b border-purple-950/50 pb-2">
                      <span className="text-[10px] text-purple-500 uppercase tracking-widest font-semibold flex items-center space-x-1">
                        <Folder className="h-3.5 w-3.5 inline text-purple-400 mr-1" />
                        <span>Workstation sector registry</span>
                      </span>
                      <button
                        onClick={() => setIsCreatingFile(!isCreatingFile)}
                        className="text-[10px] bg-purple-950 border border-purple-900 hover:bg-purple-900 text-purple-300 px-2 py-0.5 rounded flex items-center space-x-1"
                      >
                        <Plus className="h-2.5 w-2.5 inline" />
                        <span>Add</span>
                      </button>
                    </div>

                    {isCreatingFile && (
                      <form onSubmit={handleCreateFile} className="p-2 border border-purple-800 bg-neutral-950 rounded space-y-2">
                        <label className="text-[9px] uppercase tracking-wider text-purple-400 block">Allocate File Sector Node</label>
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          placeholder="filename.py, system_test.sh"
                          className="w-full bg-black border border-purple-800 p-1.5 rounded text-[11px] text-purple-200 focus:outline-none"
                          required
                        />
                        <div className="flex justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setIsCreatingFile(false)}
                            className="px-2 py-0.5 text-[9px] bg-zinc-900 border border-zinc-800 rounded text-zinc-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-2 py-0.5 text-[9px] bg-purple-900 border border-purple-700 rounded text-purple-100"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-1">
                      {workspaceFiles.map((file) => (
                        <div
                          key={file.name}
                          onClick={() => {
                            setSelectedFile(file);
                            setEditingFileContent(file.content);
                          }}
                          className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition ${
                            selectedFile?.name === file.name
                              ? "bg-purple-950/60 border border-purple-800 text-purple-200"
                              : "bg-black hover:bg-zinc-950 border border-transparent text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Code className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                            <span className="truncate text-[11px]">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[8px] text-zinc-600 font-sans">{(file.size / 1024).toFixed(1)}kb</span>
                            <button
                              onClick={(e) => handleDeleteFile(file.name, e)}
                              className="text-zinc-600 hover:text-red-400 p-0.5 transition"
                              title="Delete physical file"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MINI TERMINAL OUTPUT SIMULATOR (Write/Run code section) */}
                  <div className="p-3 bg-zinc-950 border-t border-purple-950/80">
                    <div className="text-[10px] text-purple-400 uppercase tracking-wider flex items-center justify-between mb-1">
                      <span>Live Terminal Execution</span>
                      <Terminal className="h-3.5 w-3.5 inline text-cyan-400" />
                    </div>
                    <p className="text-[9px] text-zinc-500 mb-2">Simulate script runs inside workstation sandbox node.</p>
                    
                    <form onSubmit={handleRunTerminal} className="flex space-x-1">
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="python3 main.py, bash cyber_shell.sh"
                        className="flex-1 bg-black border border-purple-950 text-[10px] p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-purple-600 text-fuchsia-400 font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-purple-950 hover:bg-purple-950 border border-purple-800 px-2.5 py-1 text-[10px] uppercase font-bold text-fuchsia-400 rounded cursor-pointer shrink-0"
                      >
                        Run
                      </button>
                    </form>
                  </div>
                </div>

                {/* Main central active file code editor panels */}
                <div className="flex-1 bg-neutral-950/25 flex flex-col justify-between overflow-y-auto">
                  {selectedFile ? (
                    <div className="p-4 flex flex-col h-full justify-between min-h-0">
                      
                      <div className="space-y-3 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center bg-black/80 border border-purple-950 p-2 rounded">
                          <div className="flex items-center space-x-2 text-xs">
                            <FileText className="h-4 w-4 text-purple-400" />
                            <span className="font-bold text-purple-300">{selectedFile.name}</span>
                            <span className="text-[9px] bg-purple-900/40 text-purple-300 pointer-events-none rounded px-1.5">Sector: Physical Workspace</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                // Simulate run file directly in emulator
                                try {
                                  let runCmd = `python3 ${selectedFile.name}`;
                                  if (selectedFile.name.endsWith(".sh")) {
                                    runCmd = `bash ${selectedFile.name}`;
                                  }
                                  const resp = await fetch("/api/workspace/run", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ command: runCmd }),
                                  });
                                  if (resp.ok) {
                                    const data = await resp.json();
                                    setTerminalHistory(prev => [...prev, { cmd: runCmd, out: data.output, err: data.error }]);
                                    addLog(`[⚡] Dispatched run command: ${runCmd}`);
                                  }
                                } catch (err) {
                                  addLog("[-] Dispatched run execution server crash.");
                                }
                              }}
                              className="bg-black border border-fuchsia-700 hover:bg-neutral-900 rounded px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider font-semibold text-fuchsia-300 flex items-center space-x-1 cursor-pointer"
                            >
                              <Play className="h-3 w-3" />
                              <span>Execute script</span>
                            </button>
                            <button
                              onClick={handleSaveFile}
                              className="bg-purple-900 hover:bg-purple-800 rounded px-3 py-1 text-[10px] uppercase font-semibold text-white flex items-center space-x-1 cursor-pointer"
                            >
                              <Save className="h-3 w-3" />
                              <span>Commit edits</span>
                            </button>
                          </div>
                        </div>

                        {/* Text / Script Content Code Box */}
                        <div className="flex-1 min-h-[180px] flex flex-col">
                          <label className="text-[9px] text-[#888] pb-1 font-mono">Workspace sector physical stream buffer editor</label>
                          <textarea
                            value={editingFileContent}
                            onChange={(e) => setEditingFileContent(e.target.value)}
                            className="bg-black border border-purple-950 p-3 rounded flex-1 text-xs text-fuchsia-100 placeholder-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono resize-none leading-relaxed"
                            rows={14}
                          />
                        </div>
                      </div>

                      {/* Display recent execution logs console below */}
                      <div className="mt-4 border-t border-purple-950/50 pt-3">
                        <div className="text-[9px] text-zinc-500 uppercase font-bold pb-2 tracking-widest">
                          Console Terminal Output Stream
                        </div>
                        <div className="bg-black/90 border border-purple-950 p-3.5 rounded-lg text-[10.5px] font-mono h-32 overflow-y-auto space-y-2">
                          {terminalHistory.map((item, index) => (
                            <div key={index} className="space-y-1">
                              <div className="text-zinc-500">
                                $ <span className="text-purple-400">{item.cmd}</span>
                              </div>
                              <pre className={`whitespace-pre-wrap font-mono ${item.err ? "text-red-400" : "text-green-400"}`}>
                                {item.out}
                              </pre>
                            </div>
                          ))}
                          <div ref={terminalEndRef} />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-600 space-y-4">
                      <Folder className="h-12 w-12 text-purple-900/60" />
                      <div>
                        <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-400">Sandbox Code Blocks Editor</h4>
                        <p className="text-xs max-w-sm mt-1 leading-relaxed text-zinc-500">
                          Select a script or workspace file node on the left file manager index to view, edit, or parse live executions in the terminal simulator block.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: WEB UI CUSTOM MODEL BUILDER (Open WebUI Custom Behavior Style) */}
            {activeTab === "models" && (
              <div className="flex-1 p-5 overflow-y-auto font-mono">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-purple-200 border-b border-purple-950 pb-2">
                      Open WebUI Custom Behavior Core Builder
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure custom prompt personalities, code execution rules, and system instructions. These models map straight to local Ollama nodes directly with customizable settings.
                    </p>
                  </div>

                  <form onSubmit={handleCreateCustomModel} className="space-y-4 bg-zinc-950/80 p-5 rounded-xl border border-purple-950">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-purple-400 tracking-wider">Behavior Alias Name</label>
                        <input
                          type="text"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="e.g. Cyber Security Auditor, Rust compiler"
                          className="w-full bg-black border border-purple-950 rounded p-2 text-xs text-purple-100 placeholder-purple-900 focus:outline-none focus:border-purple-600"
                          required
                        />
                      </div>

                      <div className="space-y-1 font-mono">
                        <label className="text-[10px] uppercase text-purple-400 tracking-wider">Local Ollama Base Target</label>
                        <select
                          value={newModelBase}
                          onChange={(e) => setNewModelBase(e.target.value)}
                          className="w-full bg-black border border-purple-800/80 rounded-xl p-2.5 text-xs text-purple-100 focus:outline-none font-mono"
                          required
                        >
                          <option value="">-- Choose local parent model --</option>
                          <optgroup label="Default Workstation Templates" className="bg-zinc-950 text-purple-400 font-mono text-xs">
                            <option value="llama3.2:3b">llama3.2:3b [Lightweight generalist]</option>
                            <option value="deepseek-coder:6.7b">deepseek-coder:6.7b [Recommended coding]</option>
                            <option value="mistral:7b">mistral:7b [General purpose]</option>
                            <option value="phi3:medium">phi3:medium [Terse responsive]</option>
                            <option value="gemma2:9b">gemma2:9b [Structured math/logic]</option>
                          </optgroup>
                          {fetchedOllamaModels.length > 0 && (
                            <optgroup label="Detected Local Ollama Library" className="bg-zinc-950 text-cyan-400 font-mono text-xs">
                              {fetchedOllamaModels.map((m: any) => (
                                <option key={m.name} value={m.name}>
                                  Ollama: {m.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-purple-400 tracking-wider">Model Description (Meta Summary)</label>
                      <input
                        type="text"
                        value={newModelDesc}
                        onChange={(e) => setNewModelDesc(e.target.value)}
                        placeholder="Explain model purpose and specific cognitive focus..."
                        className="w-full bg-black border border-purple-950 rounded p-2 text-xs text-purple-100 placeholder-purple-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-purple-400 tracking-wider">Custom System Crypt-Prompt (Instructions)</label>
                      <textarea
                        value={newModelPrompt}
                        onChange={(e) => setNewModelPrompt(e.target.value)}
                        placeholder="You are a hacker coder AI assistant. Every file you make must match: [FILE: filename] code blocks. Output extremely terse solutions..."
                        className="w-full bg-black border border-purple-950 rounded p-3 text-xs text-purple-100 focus:outline-none placeholder-purple-900 leading-relaxed font-mono"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase text-purple-400 tracking-wider">Temperature</label>
                          <span className="text-xs text-purple-300">{newModelTemp}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.5"
                          step="0.05"
                          value={newModelTemp}
                          onChange={(e) => setNewModelTemp(parseFloat(e.target.value))}
                          className="w-full accent-purple-600 bg-purple-950"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-purple-400 tracking-wider">Stop Sequencing (Optional)</label>
                        <input
                          type="text"
                          value={newModelStop}
                          placeholder="e.g. Stop sequencing keywords"
                          className="w-full bg-black border border-purple-950 rounded p-2 text-xs text-purple-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    {modelCreationError && (
                      <div className="p-3 bg-red-950/60 border border-red-900 rounded text-xs text-red-300">
                        {modelCreationError}
                      </div>
                    )}

                    <div className="pt-3 border-t border-purple-950/60 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab("chat")}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 text-xs rounded uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded uppercase font-bold tracking-widest cursor-pointer border border-purple-500"
                      >
                        Deploy New Behavior Setup
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* TAB CONTENT: OFFLINE DATA SYNC & MULTI-CLOUD CONFIGS */}
            {activeTab === "sync" && (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-purple-200 border-b border-purple-950 pb-2">
                      Offline Storage Synchronization & Cloud Node Setup
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure multi-platform cloud syncing relays. Keep conversations, custom parameters, and workspace code records completely identical on various operator devices.
                    </p>
                  </div>

                  <div className="bg-zinc-950/90 border border-purple-950 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs uppercase font-bold text-zinc-300">Synchronize Encryption Registry</h4>
                        <p className="text-[10px] text-zinc-500">Pushes current encrypted vault data safely</p>
                      </div>
                      <button
                        onClick={handleTriggerCloudSync}
                        disabled={syncing}
                        className="bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 px-4 py-2 rounded text-xs uppercase font-mono tracking-widest font-semibold cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                      >
                        {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" /> : <Save className="h-4 w-4 shrink-0" />}
                        <span>{syncing ? "Syncing..." : "Sync Online Now"}</span>
                      </button>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-purple-950/45">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase text-zinc-400 tracking-wider">Multi-Platform Cloud Relayer Status</label>
                        <span className={`text-[9px] px-2 py-0.5 border rounded uppercase ${cloudSyncEnabled ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-red-950 text-red-400 border-red-800'}`}>
                          {cloudSyncEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-purple-400 block tracking-wider">Mainframe Remote Sync Target URL</label>
                        <input
                          type="url"
                          value={cloudEndpoint}
                          onChange={(e) => setCloudEndpoint(e.target.value)}
                          placeholder="https://cloud.cyber.secure/api/sync"
                          className="w-full bg-black border border-purple-950 rounded p-2 text-xs text-purple-100 placeholder-purple-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {cloudSyncLogs.length > 0 && (
                      <div className="pt-3 border-t border-purple-950/40 space-y-1.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Cryptographic Sync Ledger Matrix</span>
                        <div className="bg-black/95 p-3 rounded-lg border border-purple-950 text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed text-zinc-300 space-y-1">
                          {cloudSyncLogs.map((logStr, i) => (
                            <div key={i} className="flex space-x-2">
                              <span className="text-cyan-400 shrinkage-0">&gt;</span>
                              <span>{logStr}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-purple-950/15 border border-purple-900/40 p-4 rounded-lg text-xs leading-relaxed text-purple-300/80">
                    <span className="font-bold uppercase text-purple-400 block mb-1">Passlock End-To-End Integrity Checklist:</span>
                    Data backup file <code className="bg-black px-1.5 py-0.2 rounded text-fuchsia-400">vault.enc</code> is encrypted using AES-256 before upload. Cloud relayers never decode or inspect content nodes because decryption keys reside strictly inside your computer CPU memory block boundaries.
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR: HIGH TECH DIAGNOSTICS & HARDWARE INTERACTION (軽量) */}
          <div className="lg:col-span-3 bg-zinc-950/95 border-l border-purple-950 p-4 space-y-6 overflow-y-auto min-h-0 relative select-none">
            
            {/* SYSTEM RESOURCE GAUGES (LIGHTWEIGHT ANALYTIC METRICS) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans border-b border-purple-950/60 pb-1.5">
                <span>Workstation Resource Gauges</span>
                <span className="text-xs flex items-center space-x-1 font-mono text-xs">
                  <Cpu className="h-4 w-4 inline text-purple-400 mr-1" />
                </span>
              </div>

              {/* CPU load bars */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400 font-sans">
                  <span>CPU Node Core Loader</span>
                  <span className="text-purple-300 font-semibold">{diagnostic.cpu}%</span>
                </div>
                <div className="w-full h-2 bg-black border border-purple-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-800 to-cyber-purple transition-all duration-500"
                    style={{ width: `${diagnostic.cpu}%` }}
                  />
                </div>
              </div>

              {/* Ram load bars */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400 font-sans">
                  <span>Secure RAM Allocation</span>
                  <span className="text-purple-300 font-semibold">{diagnostic.ram} MB</span>
                </div>
                <div className="w-full h-2 bg-black border border-purple-950 rounded-full overflow-hidden font-mono">
                  <div
                    className="h-full bg-gradient-to-r from-purple-950 to-purple-600 transition-all duration-500"
                    style={{ width: `${(diagnostic.ram / 1024) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dynamic load graph timeline nodes (simulates system rain monitors) */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] text-zinc-500 uppercase block font-sans tracking-wide">CPU History Rain Log</span>
                <div className="flex items-end justify-between h-9 bg-black/90 p-1 border border-purple-950 rounded">
                  {diagnostic.loadHistory.map((val, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-600/70 hover:bg-purple-500 rounded-sm w-[15%] cursor-pointer transition-all duration-300"
                      style={{ height: `${Math.max(10, val * 3)}%` }}
                      title={`Tick load: ${val}%`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* OLLAMA CONNECTION HEALTH CHECKS */}
            <div className="space-y-3 pt-4 border-t border-purple-950/40">
              <span className="text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans block">
                Local Ollama Network Link
              </span>

              <div className="p-3 bg-black border border-purple-950 rounded-lg space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Link Status:</span>
                  {diagnostic.ollamaOnline ? (
                    <span className="text-green-400 font-bold flex items-center">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      Ollama API Offline
                    </span>
                  )}
                </div>

                {diagnostic.ollamaOnline ? (
                  <div className="space-y-1 text-[10px] text-zinc-400 font-mono">
                    <span className="block text-zinc-500">AVAILABLE NETWORK MODELS:</span>
                    {diagnostic.activeModels.length === 0 ? (
                      <span className="italic text-zinc-600 block">No models detected inside Ollama library. Compile using OpenWebUI models menu &rarr;</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {diagnostic.activeModels.map(name => (
                          <span key={name} className="bg-purple-950/50 border border-purple-900 px-1 py-0.2 rounded text-[9px] text-purple-300">{name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9.5px] leading-relaxed text-zinc-500">
                    Host server is not responding to Ollama tag scans on <code className="bg-neutral-900 text-amber-300 border border-amber-900/50 px-1 rounded">{settings.ollamaUrl}</code>. No worries! Alfred automatically proxies chat requests with organic **Gemini-3.5-flash** if you provide a Gemini secrets API key.
                  </div>
                )}
              </div>
            </div>

            {/* DYNAMIC SETTINGS CONSOLE COMPONENT */}
            <div className="space-y-4 pt-4 border-t border-purple-950/40">
              <span className="text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans block">
                Settings Terminal Configuration
              </span>

              <div className="space-y-3.5">
                {/* Theme presets */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Accent Laser Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
                    className="w-full bg-black border border-purple-950 text-xs p-1.5 focus:outline-none text-purple-300"
                  >
                    <option value="deep-purple">Carbon Violet (Deep Purple)</option>
                    <option value="matrix-green">Hacker Digital Rain (Classic Green)</option>
                  </select>
                </div>

                {/* Matrix background toggle */}
                <div className="flex items-center justify-between font-sans">
                  <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Aesthetic Rain Canvas</label>
                  <input
                    type="checkbox"
                    checked={settings.matrixRain}
                    onChange={(e) => handleUpdateSettings({ matrixRain: e.target.checked })}
                    className="accent-purple-600 h-4.5 w-4.5 rounded cursor-pointer"
                  />
                </div>

                {/* Local URL config */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-400 tracking-wider font-mono">Backend API Target</label>
                  <input
                    type="text"
                    value={settings.ollamaUrl}
                    onChange={(e) => handleUpdateSettings({ ollamaUrl: e.target.value })}
                    className="w-full bg-black border border-purple-950 rounded text-xs p-1.5 text-zinc-300 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RUNNING SYSTEM KERNEL DIAGNOSTIC LOG FEED */}
            <div className="space-y-1.5 pt-4 border-t border-purple-950/30">
              <span className="text-[10px] text-purple-500 uppercase tracking-widest font-semibold font-sans block">
                Workstation Kernel logs
              </span>
              <div className="bg-black/90 p-2.5 rounded border border-purple-950/70 text-[9.5px] font-mono h-28 overflow-y-auto leading-relaxed text-zinc-500 space-y-1">
                {systemLogs.map((log, index) => (
                  <div key={index} className="truncate select-text">
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* FOOTER BAR / DESKTOP STATUS RAIL */}
      <div className="bg-zinc-950 border-t border-purple-950 text-[10px] font-mono p-2 flex flex-col sm:flex-row justify-between items-center z-10 shrink-0">
        <div className="flex items-center space-x-3 text-zinc-500 select-none pb-1 sm:pb-0">
          <span>ALFRED RUNNING DAEMON: v1.0.8 [LINUX COMPATIBLE]</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-[9.5px] flex items-center text-cyan-500">
            <Database className="h-3 w-3 inline mr-1" />
            <span>Secure encryption vault mounted</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <span className="text-zinc-500 uppercase font-sans tracking-wide">SYSTEM REBOOT MEMORY DESTRUCTION BLOCK DETECTOR:</span>
          <span className="text-purple-400 uppercase font-semibold">Active</span>
        </div>
      </div>

    </div>
  );
}
