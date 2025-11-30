export interface ABCResult {
  abc: string;
  thoughtSignature?: string;
  thoughts?: string;
}

export interface UploadFileState {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'thinking';
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: ABCResult | null;
  logs: LogEntry[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface Session {
  id: string;
  title: string;
  lastModified: number;
  isOpen?: boolean; // Tracks if the session is currently open in a tab
  data: {
    files: UploadFileState[];
    prompt: string;
    abc: string;
    model: string;
    generation: GenerationState;
    thumbnail?: string;
  };
}