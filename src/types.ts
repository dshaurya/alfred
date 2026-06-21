export interface Message {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  lastUpdated: string;
  messages: Message[];
}

export interface CustomModel {
  id: string;
  name: string;
  baseModel: string;
  systemPrompt: string;
  temperature: number;
  stopSequences?: string;
  description?: string;
}

export interface Settings {
  theme: "deep-purple" | "matrix-green" | "cyber-blue" | "crimson-ghost";
  matrixRain: boolean;
  ollamaUrl: string;
  autoLockMinutes: number;
  resourceRefreshRate: number;
}

export interface WorkspaceFile {
  name: string;
  size: number;
  updated: string;
  content: string;
  type: "python" | "shell" | "markdown" | "text" | string;
}

export interface SystemDiagnostic {
  ollamaOnline: boolean;
  activeModels: string[];
  cpu: number;
  ram: number;
  timestamp: string;
  loadHistory: number[];
}

export interface SyncRecord {
  success: boolean;
  logs: string[];
  lastSynced: string;
}
