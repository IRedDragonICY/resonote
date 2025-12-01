import React, { useState } from 'react';
import { Session } from '../types';

type ExportType = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'doc' | 'midi' | 'wav' | 'mp3' | 'abc' | 'txt';

interface HomeViewProps {
  sessions: Session[];
  onOpenSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onExportSession: (id: string, type: ExportType) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ sessions, onOpenSession, onNewSession, onDeleteSession, onExportSession }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  
  // State to track which export menu is open. 
  const [exportMenu, setExportMenu] = useState<{ id: string, top: number, right: number } | null>(null);

  // Sort sessions by lastModified descending
  const sortedSessions = [...sessions].sort((a, b) => b.lastModified - a.lastModified);
  
  const filteredSessions = sortedSessions.filter(s => 
      s.title.toLowerCase().includes(filter.toLowerCase()) || 
      (s.data.abc && s.data.abc.includes(filter))
  );

  const handleExportClick = (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Calculate position relative to viewport for fixed positioning
      setExportMenu({
          id: sessionId,
          top: rect.bottom + 5,
          right: window.innerWidth - rect.right
      });
  };

  const closeMenu = () => setExportMenu(null);

  return (
    <div className="flex-1 bg-md-sys-background flex flex-col h-full overflow-hidden relative transition-colors duration-200" onClick={closeMenu}>
      
      {/* Home Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-md-sys-onSurface mb-1">Recent</h1>
          <p className="text-sm text-md-sys-secondary">Resume your work or start a new transcription</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Search */}
             <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-md-sys-secondary text-[18px]">search</span>
                <input 
                    type="text" 
                    placeholder="Search files..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-md-sys-surface border border-md-sys-outline/20 rounded-full pl-9 pr-4 py-2 text-sm text-md-sys-onSurface focus:outline-none focus:border-md-sys-primary transition-colors w-64 shadow-sm"
                />
             </div>

             {/* View Toggle */}
             <div className="bg-md-sys-surface rounded-lg p-1 border border-md-sys-outline/20 flex shadow-sm">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-md-sys-secondary/20 text-md-sys-onSurface' : 'text-md-sys-secondary hover:text-md-sys-onSurface'}`}
                >
                    <span className="material-symbols-rounded text-[20px]">view_list</span>
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-md-sys-secondary/20 text-md-sys-onSurface' : 'text-md-sys-secondary hover:text-md-sys-onSurface'}`}
                >
                    <span className="material-symbols-rounded text-[20px]">grid_view</span>
                </button>
             </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
         {filteredSessions.length === 0 && !filter ? (
             <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                 <div className="w-20 h-20 bg-md-sys-surface rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <span className="material-symbols-rounded text-4xl text-md-sys-secondary">library_music</span>
                 </div>
                 <h3 className="text-lg font-medium text-md-sys-onSurface mb-2">No recent files</h3>
                 <button 
                    onClick={onNewSession}
                    className="text-md-sys-primary hover:underline"
                 >
                    Create your first score
                 </button>
             </div>
         ) : (
            <>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {/* New File Card */}
                        <button 
                            onClick={onNewSession}
                            className="aspect-[3/4] rounded-xl border border-dashed border-md-sys-outline/30 hover:border-md-sys-primary hover:bg-md-sys-primary/5 transition-all flex flex-col items-center justify-center group text-md-sys-secondary hover:text-md-sys-primary"
                        >
                            <span className="material-symbols-rounded text-4xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
                            <span className="font-medium text-sm">New Transcription</span>
                        </button>

                        {filteredSessions.map(session => {
                            const firstFile = session.data.files[0];
                            const isPdf = firstFile && (firstFile.file.type === 'application/pdf' || firstFile.file.name.toLowerCase().endsWith('.pdf'));

                            return (
                                <div 
                                    key={session.id}
                                    className="group relative aspect-[3/4] bg-md-sys-surface rounded-xl border border-md-sys-outline/20 hover:border-md-sys-primary/50 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                                >
                                    {/* 1. Click Overlay (Z-10) - Handles Opening */}
                                    <div 
                                        className="absolute inset-0 z-10 cursor-pointer"
                                        onClick={() => onOpenSession(session.id)}
                                        title={`Open ${session.title}`}
                                    />

                                    {/* 2. Visual Content (Behind Actions) */}
                                    <div className="h-2/3 bg-md-sys-surfaceVariant/30 p-0 flex items-center justify-center overflow-hidden relative">
                                        {/* Abstract background pattern */}
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: 'var(--md-sys-outline)' }}></div>
                                        
                                        <div className="w-full h-full flex items-center justify-center bg-md-sys-surface/5 pointer-events-none">
                                            {session.data.thumbnail ? (
                                                <div className="w-full h-full p-2">
                                                    <div className="w-full h-full bg-white rounded overflow-hidden shadow-sm border border-black/5">
                                                        <img src={session.data.thumbnail} className="w-full h-full object-contain" alt="score cover" />
                                                    </div>
                                                </div>
                                            ) : session.data.files.length > 0 ? (
                                                isPdf ? (
                                                    <div className="w-full h-full bg-md-sys-surfaceVariant flex flex-col items-center justify-center transition-colors">
                                                        <span className="material-symbols-rounded text-red-400 text-4xl mb-2">picture_as_pdf</span>
                                                        <span className="text-[10px] text-md-sys-secondary max-w-[80%] truncate text-center px-2">{firstFile.file.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full relative">
                                                        <img src={firstFile.preview} className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all" alt="upload preview" />
                                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="material-symbols-rounded text-4xl text-md-sys-outline/40">music_note</span>
                                            )}
                                        </div>

                                        {/* 3. Actions Overlay (Z-30) - Sits above Open Overlay */}
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                            <button 
                                                onClick={(e) => handleExportClick(e, session.id)}
                                                className={`p-1.5 bg-md-sys-surface/90 hover:bg-md-sys-primary text-md-sys-secondary hover:text-md-sys-onPrimary rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-sm border border-md-sys-outline/20 ${exportMenu?.id === session.id ? 'opacity-100 bg-md-sys-primary text-md-sys-onPrimary' : ''}`}
                                                title="Export As..."
                                            >
                                                <span className="material-symbols-rounded text-[16px] block">ios_share</span>
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    onDeleteSession(session.id);
                                                }}
                                                className="p-1.5 bg-md-sys-surface/90 hover:bg-md-sys-error text-md-sys-secondary hover:text-white rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-sm border border-md-sys-outline/20"
                                                title="Delete Project"
                                            >
                                                <span className="material-symbols-rounded text-[16px] block">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Meta Area */}
                                    <div className="h-1/3 p-4 flex flex-col justify-between bg-md-sys-surface border-t border-md-sys-outline/10 pointer-events-none">
                                        <div>
                                            <h3 className="text-sm font-medium text-md-sys-onSurface truncate group-hover:text-md-sys-primary transition-colors">
                                                {session.title || "Untitled Project"}
                                            </h3>
                                            <p className="text-[10px] text-md-sys-secondary mt-1 uppercase tracking-wider">ABC • {new Date(session.lastModified).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-md-sys-secondary/10 text-md-sys-secondary font-medium">
                                                {session.data.model.replace('gemini-', '').split('-')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider border-b border-md-sys-outline/10 mb-2">
                            <div className="col-span-5">Name</div>
                            <div className="col-span-3">Date Modified</div>
                            <div className="col-span-3">Model</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {/* New Item Row */}
                        <button 
                             onClick={onNewSession}
                             className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-md-sys-surfaceVariant/30 text-left items-center group transition-colors"
                        >
                            <div className="col-span-5 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-md-sys-primary/10 flex items-center justify-center text-md-sys-primary">
                                    <span className="material-symbols-rounded text-lg">add</span>
                                </div>
                                <span className="text-sm font-medium text-md-sys-primary">Create New Transcription</span>
                            </div>
                            <div className="col-span-3"></div>
                            <div className="col-span-3"></div>
                            <div className="col-span-1"></div>
                        </button>

                        {filteredSessions.map(session => {
                            const firstFile = session.data.files[0];
                            const isPdf = firstFile && (firstFile.file.type === 'application/pdf' || firstFile.file.name.toLowerCase().endsWith('.pdf'));

                            return (
                                <div
                                    key={session.id}
                                    onClick={() => onOpenSession(session.id)}
                                    className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-md-sys-surfaceVariant/50 text-left items-center group border border-transparent hover:border-md-sys-outline/10 transition-all cursor-pointer relative"
                                >
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-md-sys-surfaceVariant flex items-center justify-center overflow-hidden border border-md-sys-outline/10 relative">
                                            {session.data.thumbnail ? (
                                                <div className="w-full h-full bg-white">
                                                     <img src={session.data.thumbnail} className="w-full h-full object-contain" alt="cover" />
                                                </div>
                                            ) : isPdf ? (
                                                <div className="w-full h-full bg-md-sys-surfaceVariant flex items-center justify-center">
                                                     <span className="material-symbols-rounded text-lg text-red-400">picture_as_pdf</span>
                                                </div>
                                            ) : firstFile ? (
                                                <img src={firstFile.preview} className="w-full h-full object-cover opacity-80" alt="cover" />
                                            ) : (
                                                <span className="material-symbols-rounded text-lg text-md-sys-secondary group-hover:text-md-sys-onSurface">description</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-medium text-md-sys-onSurface group-hover:text-md-sys-primary truncate">
                                                {session.title || "Untitled Project"}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-xs text-md-sys-secondary">
                                        {new Date(session.lastModified).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-3 text-xs text-md-sys-secondary">
                                        <span className="px-2 py-0.5 rounded bg-md-sys-surfaceVariant border border-md-sys-outline/10">
                                            {session.data.model}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-right flex justify-end gap-1">
                                         <button 
                                            onClick={(e) => handleExportClick(e, session.id)}
                                            className={`p-1.5 hover:bg-md-sys-surfaceVariant text-md-sys-secondary hover:text-md-sys-onSurface rounded-md transition-colors opacity-0 group-hover:opacity-100 ${exportMenu?.id === session.id ? 'opacity-100 text-md-sys-onSurface' : ''}`}
                                            title="Export As..."
                                        >
                                            <span className="material-symbols-rounded text-lg">ios_share</span>
                                        </button>
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onDeleteSession(session.id);
                                            }}
                                            className="p-1.5 hover:bg-md-sys-error/20 text-md-sys-secondary hover:text-md-sys-error rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-rounded text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
         )}
      </div>

      {/* Floating Export Menu */}
      {exportMenu && (
          <div 
             className="fixed z-50 bg-md-sys-surface rounded-lg shadow-2xl py-2 w-56 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
             style={{ top: exportMenu.top, right: exportMenu.right }}
             onClick={(e) => e.stopPropagation()} 
          >
             <div className="px-3 py-1.5 mb-1 border-b border-md-sys-outline/10">
                 <span className="text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Export As</span>
             </div>
             
             {/* Text Formats */}
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'abc'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">code</span>
                 ABC Notation
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'txt'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">description</span>
                 Plain Text
             </button>

             <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

             {/* Documents */}
             <div className="px-3 py-1 mt-1 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Documents</div>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'pdf'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-red-400">picture_as_pdf</span>
                 PDF Document
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'doc'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-blue-400">description</span>
                 Word (.doc)
             </button>

             <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

             {/* Visual */}
             <div className="px-3 py-1 mt-1 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Images</div>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'png'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                 PNG
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'jpg'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                 JPG
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'webp'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                 WebP
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'svg'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-orange-400">draw</span>
                 SVG
             </button>

             <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
             
             {/* Audio */}
             <div className="px-3 py-1 mt-1 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Audio</div>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'midi'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-amber-400">piano</span>
                 MIDI File
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'wav'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-blue-400">headphones</span>
                 Audio (.wav)
             </button>
             <button 
                 onClick={() => { onExportSession(exportMenu.id, 'mp3'); closeMenu(); }}
                 className="w-full text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
             >
                 <span className="material-symbols-rounded text-[18px] text-purple-400">music_note</span>
                 Audio (.mp3)
             </button>
          </div>
      )}
    </div>
  );
};