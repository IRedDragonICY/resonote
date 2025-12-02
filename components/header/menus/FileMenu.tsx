
import React, { useState } from 'react';

interface FileMenuProps {
  onImport: () => void;
  onExport: (type: any) => void;
  onClose: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({ onImport, onExport, onClose }) => {
  const [showExportSubmenu, setShowExportSubmenu] = useState(false);

  return (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 mt-2 w-64 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-visible flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
            
            {/* Import Option */}
            <button 
                onClick={() => { onImport(); onClose(); }}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
            >
                <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">upload_file</span>
                Import Source...
            </button>

            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

            {/* Export As Group */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowExportSubmenu(true)}
              onMouseLeave={() => setShowExportSubmenu(false)}
            >
                <button 
                    className="w-full text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowExportSubmenu(!showExportSubmenu);
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-[18px] text-md-sys-primary">ios_share</span>
                        Export As
                    </div>
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary group-hover:text-md-sys-onSurface">chevron_right</span>
                </button>

                {/* Submenu */}
                {showExportSubmenu && (
                    <div className="absolute left-full top-0 -ml-1 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20 animate-in fade-in zoom-in-95 duration-100">
                        
                        <div className="px-4 py-1.5 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Source</div>
                        <button onClick={() => { onExport('abc'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">code</span> ABC Notation
                        </button>
                        <button onClick={() => { onExport('txt'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">description</span> Plain Text
                        </button>

                        <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
                        <div className="px-4 py-1.5 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Visual & Doc</div>

                        <button onClick={() => { onExport('pdf'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-red-400">picture_as_pdf</span> PDF Document
                        </button>
                        <button onClick={() => { onExport('png'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span> Image (.png)
                        </button>
                        <button onClick={() => { onExport('svg'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-orange-400">draw</span> Vector (.svg)
                        </button>

                        <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
                        <div className="px-4 py-1.5 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">Audio</div>

                        <button onClick={() => { onExport('midi'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-amber-400">piano</span> MIDI File
                        </button>
                        <button onClick={() => { onExport('mp3'); onClose(); }} className="text-left px-4 py-2 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                            <span className="material-symbols-rounded text-[18px] text-purple-400">music_note</span> Audio (.mp3)
                        </button>
                    </div>
                )}
            </div>
        </div>
    </>
  );
};
