import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Workspace } from './components/Workspace';
import { HomeView } from './components/HomeView';
import { AboutModal } from './components/modals/AboutModal';
import { FeedbackModal } from './components/modals/FeedbackModal';
import { TermsModal } from './components/modals/TermsModal';
import { ChangelogModal } from './components/modals/ChangelogModal';
import { convertImageToABC } from './services/geminiService';
import { Session, GenerationState, LogEntry } from './types';
import { DEFAULT_ABC } from './constants/defaults';
import { DEFAULT_MODEL_ID } from './constants/models';
import { validateABC } from './utils/abcValidator';
import { MusicDisplayHandle } from './components/MusicDisplay';

const STORAGE_KEY = 'resonote_sessions_v1';

export default function App() {
  // --- State Management ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | 'home'>('home');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Modals
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Refs
  const sessionRefs = useRef<Map<string, MusicDisplayHandle>>(new Map());
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // --- Persistence Logic ---
  
  // Load sessions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Session[] = JSON.parse(saved);
        // Hydrate: Ensure files array is empty (can't restore Files) but logs/abc are kept
        const hydrated = parsed.map(s => ({
            ...s,
            // Default isOpen to false for legacy data to keep top bar clean on fresh load, 
            // or respect persisted state if present.
            isOpen: s.isOpen ?? false, 
            data: {
                ...s.data,
                files: [], // Files cannot be persisted securely
                // Reset loading state on reload
                generation: { ...s.data.generation, isLoading: false, error: null } 
            }
        }));
        setSessions(hydrated);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, []);

  // Save sessions on change
  useEffect(() => {
    if (sessions.length > 0) {
        // Serialize sessions without File objects to avoid circular structure and quota issues
        const toSave = sessions.map(s => ({
            ...s,
            data: {
                ...s.data,
                files: [], // Don't save files
            }
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } else {
        // If no sessions, clear storage to reflect empty state
        localStorage.removeItem(STORAGE_KEY);
    }
  }, [sessions]);

  // Trigger resize event when switching tabs to ensure abcjs redraws correctly if needed
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [activeTabId]);

  // --- Session Helpers ---

  const createNewSession = useCallback((initialAbc?: string, title?: string) => {
    const newSession: Session = {
        id: Date.now().toString(),
        title: title || `Untitled Project`,
        lastModified: Date.now(),
        isOpen: true, // New sessions are open by default
        data: {
            files: [],
            prompt: "",
            abc: initialAbc || DEFAULT_ABC,
            model: DEFAULT_MODEL_ID,
            generation: {
                isLoading: false,
                error: null,
                result: null,
                logs: []
            }
        }
    };
    setSessions(prev => [...prev, newSession]);
    setActiveTabId(newSession.id);
  }, []);

  const closeSessionTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Close the tab by setting isOpen to false, but keep in sessions list
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isOpen: false } : s));
    
    // Cleanup refs to avoid memory leaks
    sessionRefs.current.delete(id);

    // Navigate to home if the closed tab was active
    if (activeTabId === id) {
        setActiveTabId('home');
    }
  };

  const handleOpenSession = (id: string) => {
    // Re-open a closed session
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isOpen: true } : s));
    setActiveTabId(id);
  };

  const deleteSession = (id: string) => {
      if (window.confirm("Are you sure you want to permanently delete this project? This cannot be undone.")) {
          setSessions(prev => prev.filter(s => s.id !== id));
          sessionRefs.current.delete(id);
          if (activeTabId === id) {
              setActiveTabId('home');
          }
      }
  };

  const updateSession = useCallback((id: string, updates: Partial<Session['data']>) => {
    setSessions(prev => prev.map(s => {
        if (s.id !== id) return s;
        
        let newTitle = s.title;
        if (updates.abc) {
            const match = updates.abc.match(/T:(.*)/);
            if (match && match[1]) {
                newTitle = match[1].trim();
            }
        }

        return {
            ...s,
            title: newTitle,
            lastModified: Date.now(),
            data: { ...s.data, ...updates }
        };
    }));
  }, []);

  const handleTabRename = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
        s.id === id ? { ...s, title: newTitle, lastModified: Date.now() } : s
    ));
  };

  const handleTabsReorder = (newOrderIds: string[]) => {
    setSessions(prev => {
        const sessionMap = new Map(prev.map(s => [s.id, s]));
        // Reconstruct order based on Tabs, append closed sessions at the end (order doesn't matter for hidden)
        const reorderedOpen = newOrderIds.map(id => sessionMap.get(id)).filter(Boolean) as Session[];
        const closed = prev.filter(s => !s.isOpen);
        return [...reorderedOpen, ...closed];
    });
  };

  // --- Generation Logic ---

  const addLogToSession = useCallback((sessionId: string, message: string, type: LogEntry['type']) => {
    setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        
        const currentLogs = s.data.generation.logs;
        const lastLog = currentLogs[currentLogs.length - 1];
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Streaming update optimization
        if (type === 'thinking' && lastLog?.type === 'thinking') {
             if (lastLog.message === message) return s;
             const newLogs = [...currentLogs];
             newLogs[newLogs.length - 1] = { ...lastLog, message };
             return { ...s, data: { ...s.data, generation: { ...s.data.generation, logs: newLogs } } };
        }

        return {
            ...s,
            data: {
                ...s.data,
                generation: {
                    ...s.data.generation,
                    logs: [...currentLogs, { timestamp, message, type }]
                }
            }
        };
    }));
  }, []);

  const handleGenerate = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const { data } = session;

    if (data.files.length === 0 && !data.prompt.trim()) return;

    // Reset State for this session
    updateSession(sessionId, { 
        abc: "", 
        generation: { isLoading: true, error: null, result: null, logs: [] } 
    });

    try {
      const rawFiles = data.files.map(f => f.file);
      
      const result = await convertImageToABC(
        rawFiles, 
        data.prompt,
        data.model,
        (msg, type) => addLogToSession(sessionId, msg, type),
        (streamedText) => updateSession(sessionId, { abc: streamedText }),
        validateABC
      );

      // Final update
      setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
              ...s,
              data: {
                  ...s.data,
                  abc: result.abc,
                  generation: { ...s.data.generation, isLoading: false, result }
              }
          };
      }));
      addLogToSession(sessionId, "Generation Complete.", 'success');

    } catch (err: any) {
        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            return {
                ...s,
                data: {
                    ...s.data,
                    generation: { ...s.data.generation, isLoading: false, error: err.message || "Unknown error" }
                }
            };
        }));
    }
  };

  // --- Import / Export Logic ---

  const handleImportClick = () => {
    // FIX: Directly trigger file input without intermediate confirmation dialogs.
    // This prevents "User cancelled" errors caused by browser security blocking event loops.
    // The "Import" action implies intent to replace content.
    if (importInputRef.current) {
        importInputRef.current.value = ''; // Reset to allow re-selecting same file
        importInputRef.current.click();
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target?.result as string || "");
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
        
        if (!text.trim()) {
            alert("The selected file is empty.");
            return;
        }

        if (activeTabId === 'home') {
            createNewSession(text, file.name.replace(/\.(abc|txt)$/i, ''));
        } else {
             updateSession(activeTabId, { abc: text });
        }
    } catch (error) {
        console.error(error);
        alert("Failed to read file.");
    }
  };

  const handleExport = (type: 'png' | 'pdf' | 'midi' | 'wav' | 'mp3' | 'abc' | 'txt') => {
    if (activeTabId === 'home') return;

    // Source Export (handled by App directly)
    if (type === 'abc' || type === 'txt') {
        const session = sessions.find(s => s.id === activeTabId);
        if (!session) return;

        const blob = new Blob([session.data.abc], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title || 'music'}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }

    // Visual/Audio Export (handled by MusicDisplay component)
    const ref = sessionRefs.current.get(activeTabId);
    if (ref) {
        ref.exportFile(type);
    }
  };

  // Function to export session source/media directly from HomeView
  const handleExportFromHome = (sessionId: string, type: 'png' | 'pdf' | 'midi' | 'wav' | 'mp3' | 'abc' | 'txt') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Text formats - handled directly here
    if (type === 'abc' || type === 'txt') {
        const blob = new Blob([session.data.abc], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title || 'music'}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }

    // Media formats - delegate to MusicDisplay logic via Ref
    // Note: MusicDisplay components are mounted but hidden, so refs should be available.
    const ref = sessionRefs.current.get(sessionId);
    if (ref) {
        ref.exportFile(type);
    } else {
        alert("Unable to export media. Please open the project first to initialize the engine.");
    }
  };

  // --- Rendering ---
  
  // Filter active tabs for the top bar
  const openSessions = sessions.filter(s => s.isOpen);

  return (
    <div className="min-h-screen bg-md-sys-background text-md-sys-secondary selection:bg-md-sys-primary selection:text-md-sys-onPrimary font-sans flex flex-col overflow-hidden">
      
      {/* Hidden Import Input */}
      <input 
        type="file" 
        ref={importInputRef} 
        className="hidden" 
        accept=".abc,.txt" 
        onChange={handleFileImport}
      />

      <Header 
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onOpenAbout={() => setShowAbout(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        onOpenTerms={() => setShowTerms(true)}
        onOpenChangelog={() => setShowChangelog(true)}
        onImport={handleImportClick}
        onExport={handleExport}
      />

      {/* Tabs - Fixed Top Bar (Only show Open Sessions) */}
      <TabBar 
        tabs={openSessions.map(s => ({ id: s.id, title: s.title }))} 
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeSessionTab}
        onNewTab={() => createNewSession()}
        onTabsReorder={handleTabsReorder}
        onTabRename={handleTabRename}
      />

      {/* Main Content - Added padding top to account for fixed Header + TabBar (40px + 40px = 80px -> pt-20) */}
      <main className="flex-1 overflow-hidden relative pt-20">
        
        {/* Render Home View - Persist in DOM but hide/show */}
        <div className={`absolute inset-0 top-20 z-10 bg-md-sys-background transition-opacity duration-200 ${activeTabId === 'home' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             <HomeView 
                sessions={sessions} 
                onOpenSession={handleOpenSession} 
                onNewSession={() => createNewSession()} 
                onDeleteSession={deleteSession}
                onExportSession={handleExportFromHome}
             />
        </div>

        {/* Render Workspaces for OPEN sessions - Keep them mounted to persist audio/state */}
        {openSessions.map(session => (
            <div 
                key={session.id} 
                className={`w-full h-full pt-4 pb-2 px-4 lg:px-6 max-w-[1920px] mx-auto ${activeTabId === session.id ? 'block' : 'hidden'}`}
            >
                <Workspace 
                    session={session}
                    onUpdateSession={updateSession}
                    onGenerate={handleGenerate}
                    musicDisplayRef={(el) => {
                        if (el) sessionRefs.current.set(session.id, el);
                        else sessionRefs.current.delete(session.id);
                    }}
                    onImport={handleImportClick}
                    onExport={() => handleExport('abc')}
                />
            </div>
        ))}

        {/* Fallback Empty State */}
        {sessions.length === 0 && activeTabId !== 'home' && (
             <div className="flex items-center justify-center h-full text-gray-500">
                 Session not found.
             </div>
        )}

      </main>

      {/* Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

    </div>
  );
}