
import React, { useState, useRef, useEffect } from 'react';
import { HistoryEntry } from '../../../types';

interface EditMenuProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  onJumpToHistory?: (index: number) => void;
  onClose: () => void;
}

export const EditMenu: React.FC<EditMenuProps> = ({ 
  onUndo, onRedo, canUndo, canRedo, history, historyIndex, onJumpToHistory, onClose 
}) => {
  const [showHistorySubmenu, setShowHistorySubmenu] = useState(false);
  const historyListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for history
  useEffect(() => {
    if (showHistorySubmenu && historyListRef.current) {
        const activeItem = historyListRef.current.querySelector('[data-active="true"]');
        if (activeItem) {
            setTimeout(() => activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
        }
    }
  }, [showHistorySubmenu]);

  return (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 mt-2 w-64 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-visible flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
            <button 
                onClick={() => { onUndo(); onClose(); }}
                disabled={!canUndo}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">undo</span>
                    Undo
                </div>
                <span className="text-[10px] text-md-sys-secondary">Ctrl+Z</span>
            </button>
            <button 
                onClick={() => { onRedo(); onClose(); }}
                disabled={!canRedo}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">redo</span>
                    Redo
                </div>
                <span className="text-[10px] text-md-sys-secondary">Ctrl+Y</span>
            </button>

            {/* History List Submenu */}
            {history.length > 0 && (
                <>
                <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
                <div 
                    className="relative group"
                    onMouseEnter={() => setShowHistorySubmenu(true)}
                    onMouseLeave={() => setShowHistorySubmenu(false)}
                >
                    <button 
                        className="w-full text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowHistorySubmenu(!showHistorySubmenu);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">history</span>
                            History List
                        </div>
                        <span className="material-symbols-rounded text-[18px] text-md-sys-secondary group-hover:text-md-sys-onSurface">chevron_right</span>
                    </button>

                    {showHistorySubmenu && (
                        <div className="absolute left-full top-0 -ml-1 w-80 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-1 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 border-b border-md-sys-outline/10 bg-md-sys-surfaceVariant/10 flex justify-between items-center backdrop-blur-sm">
                                <span className="text-[10px] font-bold text-md-sys-primary uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-rounded text-[14px]">history</span>
                                    Version History
                                </span>
                                <span className="text-[10px] font-mono text-md-sys-secondary bg-md-sys-secondary/10 px-1.5 py-0.5 rounded">
                                    {historyIndex + 1} / {history.length}
                                </span>
                            </div>
                            
                            <div ref={historyListRef} className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                <div className="relative border-l border-md-sys-outline/20 ml-2 pl-3 space-y-1 py-1">
                                    {history.map((entry, idx) => {
                                        const isActive = idx === historyIndex;
                                        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        
                                        return (
                                            <button
                                                key={idx}
                                                data-active={isActive}
                                                onClick={() => {
                                                    if (onJumpToHistory) {
                                                        onJumpToHistory(idx);
                                                        onClose();
                                                    }
                                                }}
                                                className={`w-full text-left relative flex flex-col px-3 py-2 rounded-md transition-all group border border-transparent ${isActive ? 'bg-md-sys-primary/5 border-md-sys-primary/10' : 'hover:bg-md-sys-surfaceVariant/50 hover:border-md-sys-outline/5'}`}
                                            >
                                                {/* Dot indicator */}
                                                <div className={`absolute -left-[17px] top-[18px] w-2 h-2 rounded-full border-2 border-md-sys-surface transition-colors ${isActive ? 'bg-md-sys-primary scale-110' : 'bg-md-sys-outline/30 group-hover:bg-md-sys-secondary'}`} />
                                                
                                                <div className="flex items-center justify-between w-full">
                                                    <span className={`text-[12px] font-medium truncate pr-2 ${isActive ? 'text-md-sys-primary' : 'text-md-sys-onSurface group-hover:text-md-sys-onSurface'}`}>
                                                        {entry.label}
                                                    </span>
                                                    <span className="text-[10px] text-md-sys-secondary font-mono opacity-70 shrink-0">{time}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    </>
  );
};
