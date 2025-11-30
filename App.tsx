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

  const closeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    sessionRefs.current.delete(id);
    if (activeTabId === id) {
        setActiveTabId('home');
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
        const reordered = newOrderIds.map(id => sessionMap.get(id)).filter(Boolean) as Session[];
        return reordered;
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

  // --- Rendering ---
  
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

      {/* Tabs - Fixed Top Bar */}
      <TabBar 
        tabs={sessions.map(s => ({ id: s.id, title: s.title }))} 
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={closeSession}
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
                onOpenSession={setActiveTabId} 
                onNewSession={() => createNewSession()} 
             />
        </div>

        {/* Render Workspaces for ALL open sessions - Keep them mounted to persist audio/state */}
        {sessions.map(session => (
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