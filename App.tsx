import React, { useState } from 'react';
import abcjs from 'abcjs';
import { UploadZone } from './components/UploadZone';
import { MusicDisplay } from './components/MusicDisplay';
import { Editor } from './components/Editor';
import { Button } from './components/Button';
import { AILogger } from './components/AILogger';
import { convertImageToABC } from './services/geminiService';
import { UploadFileState, GenerationState, LogEntry, ValidationResult } from './types';

// Default ABC example with chords for synth and visual test
const DEFAULT_ABC = `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|"Em"EB{c}BA B2 EB|~B2 AB dBAG|"D"FDAD BDAD|FDAD dAFD|
"Em"EBBA B2 EB|B2 AB defg|"D"afe^c dBAF|"Em"DEFD E2:|
|:gf|"Em"eB B2 efge|eB B2 gedB|"D"A2 FA DAFA|A2 FA defg|
"Em"eB B2 eBgB|eB B2 defg|"D"afe^c dBAF|"Em"DEFD E2:|`;

const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Agent)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

export default function App() {
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-preview');
  const [generation, setGeneration] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
    logs: []
  });
  // Initialize with DEFAULT_ABC directly, so we don't rely on fallbacks during render
  const [manualAbc, setManualAbc] = useState<string>(DEFAULT_ABC);

  // UI State for Menus
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackTitle, setFeedbackTitle] = useState("");

  const handleFilesSelected = (newFiles: File[]) => {
    const fileStates: UploadFileState[] = newFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      preview: URL.createObjectURL(f),
      status: 'idle'
    }));
    setFiles(prev => [...prev, ...fileStates]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleReorderFiles = (newOrder: UploadFileState[]) => {
    setFiles(newOrder);
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'thinking' = 'info') => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setGeneration(prev => {
      const logs = [...prev.logs];
      const lastLog = logs[logs.length - 1];

      // STREAMING LOGIC:
      // If the new log is 'thinking' and the previous log was also 'thinking',
      // we update the previous log's message instead of adding a new entry.
      // This allows for smooth text streaming in the UI.
      if (type === 'thinking' && lastLog?.type === 'thinking') {
          // If content is identical, skip update to prevent re-renders
          if (lastLog.message === message) return prev;

          logs[logs.length - 1] = {
              ...lastLog,
              message: message 
          };
          return { ...prev, logs };
      }

      return {
        ...prev,
        logs: [...logs, { timestamp, message, type }]
      };
    });
  };

  // The Validator Function: This runs on the client but is called by the AI Agent
  const validateABC = (abcCode: string): ValidationResult => {
    try {
        if (!abcjs || typeof abcjs.parseOnly !== 'function') {
             // Fallback if abcjs isn't fully ready
             return { isValid: false, errors: ["System error: abcjs parser not initialized."] };
        }

        // Use abcjs parseOnly to get structural warnings/errors without rendering to DOM
        // Note: abcjs doesn't throw for syntax errors, it returns them in the warnings array
        // We simulate a render to capture all potential issues
        const tune = abcjs.parseOnly(abcCode);
        
        // Casting tune to any[] to avoid TypeScript error where it might infer fixed tuple length '1'
        if (!tune || (tune as any[]).length === 0) {
            return { isValid: false, errors: ["No valid ABC music data found."] };
        }

        const warnings = tune[0].warnings || [];
        
        // Filter out minor formatting warnings if strictness isn't required
        // Handle both string warnings and object warnings to satisfy TS and runtime
        const criticalErrors = warnings.map((w: any) => {
            if (typeof w === 'string') return w;
            // Safe extraction of message, prevent circular object leakage
            return w?.message || "Unknown syntax warning";
        });

        if (criticalErrors.length > 0) {
            return { isValid: false, errors: criticalErrors };
        }

        return { isValid: true, errors: [] };
    } catch (e: any) {
        return { isValid: false, errors: [e.message || "Unknown parsing error"] };
    }
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;

    setGeneration({ isLoading: true, error: null, result: null, logs: [] });
    setManualAbc(''); // Clear previous result
    
    try {
      const rawFiles = files.map(f => f.file);
      
      const result = await convertImageToABC(
        rawFiles, 
        selectedModel,
        (msg, type) => {
          addLog(msg, type);
        },
        (streamedText) => {
          setManualAbc(streamedText);
        },
        validateABC // Pass the validator function to the service
      );

      setGeneration(prev => ({ 
        ...prev, 
        isLoading: false, 
        result 
      }));
      setManualAbc(result.abc); // Ensure final result is set
      addLog("Conversion and Verification Complete.", 'success');

    } catch (err: any) {
      setGeneration(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Something went wrong"
      }));
    }
  };

  const handleReset = () => {
    setFiles([]);
    setGeneration({ isLoading: false, error: null, result: null, logs: [] });
    // Restore default ABC on explicit reset
    setManualAbc(DEFAULT_ABC);
  };

  // Shared ID for the editor textarea so MusicDisplay can bind to it
  const EDITOR_TEXTAREA_ID = "abc-source-textarea";

  return (
    <div className="min-h-screen bg-md-sys-background text-md-sys-secondary selection:bg-md-sys-primary selection:text-md-sys-onPrimary font-sans flex flex-col">
      
      {/* Desktop Menu Bar */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-[#1e1e1e] border-b border-black z-50 flex items-center justify-between px-4 select-none shadow-md">
        <div className="flex items-center gap-4">
            {/* Icon & Title */}
            <div className="flex items-center gap-3 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6">
                  <rect width="32" height="32" rx="10" fill="#A8C7FA"/>
                  <path d="M20 10V6h-7v12.5c0 1.93-1.57 3.5-3.5 3.5S6 20.43 6 18.5 7.57 15 9.5 15c.47 0 .91.1 1.32.26V10h9z" fill="#062E6F" transform="translate(2, 2)"/>
                  <path d="M26 4l-1.5 3L21.5 8.5 24.5 10 26 13l1.5-3 3-1.5-3-1.5z" fill="#062E6F"/>
                </svg>
                <span className="text-sm font-bold tracking-tight text-white/90">Resonote</span>
            </div>
            
            {/* Desktop Menu Items */}
            <div className="hidden md:flex items-center gap-1">
                 {['File', 'View'].map(item => (
                     <button key={item} className="px-3 py-1 rounded hover:bg-white/10 text-[12px] text-md-sys-secondary hover:text-white transition-colors cursor-default">
                        {item}
                     </button>
                 ))}
                 
                 {/* Help Menu Dropdown */}
                 <div className="relative">
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'Help' ? null : 'Help')}
                        className={`px-3 py-1 rounded transition-colors cursor-default text-[12px] ${
                            activeMenu === 'Help' 
                            ? 'bg-white/10 text-white' 
                            : 'text-md-sys-secondary hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        Help
                    </button>

                    {activeMenu === 'Help' && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute top-full left-0 mt-2 w-56 bg-[#2B2B2B] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5">
                                <button 
                                    onClick={() => { setShowAbout(true); setActiveMenu(null); }}
                                    className="text-left px-4 py-2.5 text-[13px] text-[#E3E3E3] hover:bg-[#3d3d3d] transition-colors flex items-center gap-3"
                                >
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">info</span>
                                    About Resonote
                                </button>
                                <button 
                                    onClick={() => { setShowFeedback(true); setActiveMenu(null); }}
                                    className="text-left px-4 py-2.5 text-[13px] text-[#E3E3E3] hover:bg-[#3d3d3d] transition-colors flex items-center gap-3"
                                >
                                     <span className="material-symbols-rounded text-[18px] text-md-sys-primary">feedback</span>
                                     Give Feedback
                                </button>
                            </div>
                        </>
                    )}
                 </div>
            </div>
        </div>

        {/* Right Side Status & Traffic Lights */}
        <div className="flex items-center gap-4">
             {/* Traffic Lights */}
             <div className="flex gap-2 pl-2">
                 <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/20 shadow-sm hover:brightness-110 cursor-pointer"></div>
                 <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/20 shadow-sm hover:brightness-110 cursor-pointer"></div>
                 <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/20 shadow-sm hover:brightness-110 cursor-pointer"></div>
             </div>
        </div>
      </div>

      <main className="flex-1 pt-14 pb-6 px-4 lg:px-6 max-w-[1920px] mx-auto w-full">
        
        {/* Main Grid - Header removed, height adjusted to fill space */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
          
          {/* Left Column: Input & Editor */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-1">
            
            {/* Upload Section */}
            <div className="p-4 rounded-xl bg-md-sys-surface border border-md-sys-outline/40 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-rounded text-sm">input</span>
                    Input Source
                 </h3>
                 {files.length > 0 && (
                   <button onClick={handleReset} className="text-[10px] text-md-sys-error hover:text-white transition-colors uppercase font-bold tracking-wide">Clear all</button>
                 )}
              </div>
              
              <UploadZone 
                onFilesSelected={handleFilesSelected} 
                onFileRemove={handleRemoveFile}
                onFilesReordered={handleReorderFiles}
                currentFiles={files} 
              />

              {/* Status Logger */}
              <AILogger logs={generation.logs} visible={generation.logs.length > 0} />

              <div className="mt-4">
                {/* Model Selector */}
                <div className="flex items-center justify-between mb-3 bg-md-sys-surfaceVariant/30 p-2 rounded-lg border border-md-sys-outline/10">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-md-sys-primary text-[18px]">smart_toy</span>
                        <span className="text-xs font-medium text-md-sys-secondary">Model</span>
                    </div>
                    <div className="relative">
                        <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="appearance-none bg-transparent text-xs font-bold text-white/90 pl-2 pr-6 py-1 outline-none cursor-pointer text-right w-[140px]"
                        >
                            {AVAILABLE_MODELS.map(model => (
                            <option key={model.id} value={model.id} className="bg-[#2d2d2d] text-white">
                                {model.name}
                            </option>
                            ))}
                        </select>
                        <span className="material-symbols-rounded absolute right-0 top-1/2 -translate-y-1/2 text-[16px] text-md-sys-secondary pointer-events-none">expand_more</span>
                    </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={files.length === 0} 
                  isLoading={generation.isLoading}
                  className="w-full !h-10 !text-xs uppercase tracking-widest font-bold"
                  icon="piano"
                >
                  {generation.isLoading ? 'Convert & Verify' : 'Convert to Music'}
                </Button>
                {generation.error && (
                  <p className="mt-3 text-xs text-md-sys-error bg-md-sys-error/10 p-2 rounded border border-md-sys-error/20 flex items-center gap-2">
                    <span className="material-symbols-rounded text-sm">error</span>
                    {generation.error}
                  </p>
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[300px] flex flex-col">
              <Editor 
                value={manualAbc} 
                onChange={setManualAbc} 
                warningId="abc-parse-warnings"
                textareaId={EDITOR_TEXTAREA_ID}
              />
            </div>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-7 h-full flex flex-col">
             <div className="flex-1 bg-md-sys-surface rounded-2xl border border-md-sys-outline/20 overflow-hidden relative shadow-2xl">
                 <MusicDisplay 
                   abcNotation={manualAbc} 
                   warningId="abc-parse-warnings" 
                   textareaId={EDITOR_TEXTAREA_ID}
                 />
             </div>
          </div>

        </div>
      </main>

      {/* --- MODALS --- */}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#2B2B2B] rounded-[28px] p-8 shadow-2xl max-w-md w-full flex flex-col items-center animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
                
                <div className="w-16 h-16 bg-md-sys-primary/10 rounded-2xl flex items-center justify-center mb-6 text-md-sys-primary shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-10 h-10 fill-current">
                        <rect width="32" height="32" rx="10" className="opacity-0"/> 
                        <path d="M20 10V6h-7v12.5c0 1.93-1.57 3.5-3.5 3.5S6 20.43 6 18.5 7.57 15 9.5 15c.47 0 .91.1 1.32.26V10h9z" transform="translate(2, 2)"/>
                        <path d="M26 4l-1.5 3L21.5 8.5 24.5 10 26 13l1.5-3 3-1.5-3-1.5z"/>
                    </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Resonote</h2>
                <p className="text-xs font-mono text-md-sys-primary mb-6 bg-md-sys-primary/10 px-2 py-1 rounded">v1.0.0 Public Preview</p>
                
                <p className="text-sm text-gray-300 text-center leading-relaxed mb-8 px-2">
                    Resonote is an advanced AI-powered sheet music digitizer. 
                    Leveraging the multimodal capabilities of <strong className="text-white">Gemini 3 Pro</strong>, 
                    it transforms static sheet music images into editable, playable ABC notation with high fidelity—preserving rhythm, pitch, and lyrics.
                </p>

                <div className="w-full bg-[#1E1E1E] rounded-xl p-4 mb-8 flex items-center gap-4 border border-white/5">
                   <div className="w-10 h-10 rounded-full bg-md-sys-surfaceVariant flex items-center justify-center text-md-sys-secondary">
                        <span className="material-symbols-rounded text-xl">person</span>
                   </div>
                   <div className="flex-1">
                        <p className="text-xs text-md-sys-secondary uppercase tracking-wider font-bold mb-0.5">Created by</p>
                        <p className="text-sm text-white font-medium">IRedDragonICY</p>
                        <p className="text-[10px] text-gray-400">Mohammad Farid Hendianto</p>
                   </div>
                </div>

                <button 
                    onClick={() => setShowAbout(false)}
                    className="w-full py-3 bg-md-sys-primary text-md-sys-onPrimary rounded-full font-semibold hover:bg-[#8AB4F8] transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#2B2B2B] rounded-[28px] p-6 shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center text-md-sys-primary">
                        <span className="material-symbols-rounded text-2xl">chat</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Give Feedback</h2>
                        <p className="text-sm text-md-sys-secondary">Submit issues directly to our GitHub repository.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <input
                        type="text"
                        value={feedbackTitle}
                        onChange={(e) => setFeedbackTitle(e.target.value)}
                        placeholder="Title (e.g., Feature: Dark Mode)"
                        className="w-full bg-[#1E1E1E] text-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-md-sys-primary/50 transition-all placeholder:text-gray-500 font-medium"
                    />
                    <textarea 
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Describe your issue, feature request, or suggestion..."
                        className="w-full h-48 bg-[#1E1E1E] text-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-md-sys-primary/50 transition-all resize-none placeholder:text-gray-500"
                    />
                </div>
                
                <div className="flex justify-end gap-3">
                    <button 
                    onClick={() => setShowFeedback(false)}
                    className="px-6 py-2.5 text-md-sys-primary hover:bg-[#1E1E1E] rounded-full text-sm font-medium transition-colors"
                    >
                    Cancel
                    </button>
                    <button 
                    onClick={() => {
                        const title = encodeURIComponent(feedbackTitle);
                        const body = encodeURIComponent(feedbackInput);
                        window.open(`https://github.com/IRedDragonICY/resonote/issues/new?title=${title}&body=${body}`, '_blank');
                        setShowFeedback(false);
                        setFeedbackInput("");
                        setFeedbackTitle("");
                    }}
                    className="px-6 py-2.5 bg-md-sys-primary text-md-sys-onPrimary rounded-full text-sm font-semibold hover:bg-[#8AB4F8] transition-colors flex items-center gap-2"
                    >
                    Continue to GitHub
                    <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}