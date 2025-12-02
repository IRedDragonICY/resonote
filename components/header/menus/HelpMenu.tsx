
import React, { useState } from 'react';

interface HelpMenuProps {
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  onOpenTerms: () => void;
  onOpenChangelog: () => void;
  onClose: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ 
  onOpenAbout, onOpenFeedback, onOpenTerms, onOpenChangelog, onClose 
}) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    
    try {
        const res = await fetch('https://api.github.com/repos/IRedDragonICY/resonote/releases/latest');
        if (res.ok) {
            const data = await res.json();
            window.open(data.html_url, '_blank');
        } else {
            alert("Could not connect to GitHub to check for updates.");
        }
    } catch (e) {
        console.error(e);
        window.open('https://github.com/IRedDragonICY/resonote/releases', '_blank');
    } finally {
        setCheckingUpdate(false);
        onClose();
    }
  };

  return (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 mt-2 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
            <button 
                onClick={handleCheckForUpdates}
                disabled={checkingUpdate}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3 w-full"
            >
                <span className={`material-symbols-rounded text-[18px] text-md-sys-primary ${checkingUpdate ? 'animate-spin' : ''}`}>
                {checkingUpdate ? 'sync' : 'update'}
                </span>
                {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </button>
            <button onClick={() => { onOpenChangelog(); onClose(); }} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                <span className="material-symbols-rounded text-[18px] text-md-sys-primary">history</span> Changelog
            </button>
            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
            <button onClick={() => { onOpenAbout(); onClose(); }} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                <span className="material-symbols-rounded text-[18px] text-md-sys-primary">info</span> About Resonote
            </button>
            <button onClick={() => { onOpenFeedback(); onClose(); }} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">feedback</span> Give Feedback
            </button>
            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
            <button onClick={() => { onOpenTerms(); onClose(); }} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">gavel</span> Terms of Service
            </button>
        </div>
    </>
  );
};
