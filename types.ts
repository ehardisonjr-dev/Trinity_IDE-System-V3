
export type AgentRole = 'Conductor' | 'Research Lead' | 'Specialized Researcher' | 'Coder' | 'Validator' | 'System';

export interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  agent: AgentRole;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pendingChange?: CodeProposal;
}

export interface CodeProposal {
  fileName: string;
  content: string;
  description: string;
}

export interface SystemConfig {
  conductorModel: string;
  researchModel: string;
  coderModel: string;
  validatorModel: string;
  searchEngineId?: string;
}
