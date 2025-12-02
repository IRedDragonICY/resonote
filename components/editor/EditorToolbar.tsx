
import React, { useState, useRef, useEffect } from 'react';
import { extractKeyFromABC, calculateSemitoneDistance } from '../../utils/abcTransposer';

interface EditorToolbarProps {
  abcContent?: string;
  onImport: () => void;
  onExport: () => void;
  onTransposeClick: (semitones: number) => void;
}

const KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 
  'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ abcContent, onImport, onExport, onTransposeClick }) => {
  const [showKeySelector, setShowKeySelector] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Detect current key
  const currentKeyInfo = abcContent ? extractKeyFromABC(abcContent) : null;
  const currentRoot = currentKeyInfo ? currentKeyInfo.root : 'C'; // Default to C if unknown
  const currentMode = currentKeyInfo ? currentKeyInfo.mode : '';

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside BOTH the popover and the toggle button to prevent immediate toggle-off
      if (
        selectorRef.current && 
        !selectorRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowKeySelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSmartTranspose = (targetRoot: string) => {
      const diff = calculateSemitoneDistance(currentRoot, targetRoot);
      onTransposeClick(diff);
      setShowKeySelector(false);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-md-sys-outline/20 bg-md-sys-surfaceVariant/50 backdrop-blur-sm z-20 relative">
      <div className="flex items-center">
        <span className="material-symbols-rounded text-md-sys-primary mr-3 text-[22px]">code</span>
        <h3 className="text-sm font-bold text-md-sys-onSurface tracking-wider uppercase opacity-90">ABC Editor</h3>
      </div>
      <div className="flex items-center gap-1">
           {/* Transposition Group */}
           <div className="flex items-center mr-2 bg-md-sys-surface/80 rounded-lg p-0.5 border border-md-sys-outline/10 shadow-sm relative">
              <button 
                onClick={() => onTransposeClick(-1)} 
                className="p-1.5 hover:bg-md-sys-surfaceVariant rounded-md text-md-sys-onSurface hover:text-md-sys-primary transition-colors" 
                title="Transpose Down (-1 Semitone)"
              >
                 <span className="material-symbols-rounded text-[18px]">remove</span>
              </button>
              
              <span className="text-[10px] font-bold text-md-sys-secondary px-2 uppercase tracking-wider select-none">Transpose</span>
              
              <button 
                onClick={() => onTransposeClick(1)} 
                className="p-1.5 hover:bg-md-sys-surfaceVariant rounded-md text-md-sys-onSurface hover:text-md-sys-primary transition-colors" 
                title="Transpose Up (+1 Semitone)"
              >
                 <span className="material-symbols-rounded text-[18px]">add</span>
              </button>

              <div className="w-px h-4 bg-md-sys-outline/10 mx-1"></div>

              {/* Smart Transpose Button */}
              <button 
                 ref={toggleButtonRef}
                 onClick={() => setShowKeySelector(!showKeySelector)}
                 className={`p-1.5 rounded-md transition-colors ${showKeySelector ? 'bg-md-sys-primary text-md-sys-onPrimary' : 'text-md-sys-secondary hover:bg-md-sys-surfaceVariant hover:text-md-sys-onSurface'}`}
                 title="Smart Transpose to Key..."
              >
                 <span className="material-symbols-rounded text-[18px]">auto_fix</span>
              </button>

              {/* Smart Transpose Popover */}
              {showKeySelector && (
                  <div 
                    ref={selectorRef}
                    className="absolute top-full right-0 mt-2 w-64 bg-md-sys-surface rounded-xl shadow-2xl border border-md-sys-outline/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
                  >
                      <div className="px-3 py-2 bg-md-sys-surfaceVariant/50 border-b border-md-sys-outline/10 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Transpose To...</span>
                          <span className="text-[10px] font-mono text-md-sys-primary bg-md-sys-primary/10 px-1.5 py-0.5 rounded">
                              Current: {currentRoot}{currentMode}
                          </span>
                      </div>
                      
                      <div className="p-2 grid grid-cols-4 gap-1">
                          {KEYS.map(key => {
                              const isCurrent = key === currentRoot;
                              return (
                                  <button
                                    type="button"
                                    key={key}
                                    onClick={() => handleSmartTranspose(key)}
                                    className={`
                                        h-9 rounded-md text-xs font-medium transition-colors border
                                        ${isCurrent 
                                            ? 'bg-md-sys-primary text-md-sys-onPrimary border-md-sys-primary shadow-sm' 
                                            : 'bg-md-sys-surface text-md-sys-onSurface border-md-sys-outline/10 hover:bg-md-sys-surfaceVariant hover:border-md-sys-outline/30'
                                        }
                                    `}
                                  >
                                    {key}
                                  </button>
                              );
                          })}
                      </div>
                      <div className="px-3 py-2 bg-md-sys-surface/50 border-t border-md-sys-outline/10 text-[10px] text-md-sys-secondary text-center">
                          Calculates shortest path
                      </div>
                  </div>
              )}
           </div>

           <div className="w-px h-6 bg-md-sys-outline/20 mx-2"></div>
           
           <button onClick={onImport} className="p-2 hover:bg-md-sys-surfaceVariant rounded-lg text-md-sys-secondary hover:text-md-sys-onSurface transition-colors" title="Import">
              <span className="material-symbols-rounded text-[20px]">upload_file</span>
           </button>
           <button onClick={onExport} className="p-2 hover:bg-md-sys-surfaceVariant rounded-lg text-md-sys-secondary hover:text-md-sys-onSurface transition-colors" title="Export">
              <span className="material-symbols-rounded text-[20px]">download</span>
           </button>
      </div>
    </div>
  );
};
