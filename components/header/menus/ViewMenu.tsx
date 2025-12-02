
import React from 'react';
import { ViewSettings } from '../../../App';

interface ViewMenuProps {
  viewSettings: ViewSettings;
  onToggleSidebar: () => void;
  onZoom: (delta: number) => void;
  onResetZoom: () => void;
  onToggleFocusMode: () => void;
  canFocusMode: boolean;
  onClose: () => void;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ 
  viewSettings, onToggleSidebar, onZoom, onResetZoom, onToggleFocusMode, canFocusMode, onClose 
}) => {

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    onClose();
  };

  return (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 mt-2 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
            
            {/* Focus Mode */}
                <button 
                onClick={() => { onToggleFocusMode(); onClose(); }}
                disabled={!canFocusMode}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">center_focus_weak</span>
                    Focus Mode (Zen)
                </div>
            </button>
            
            {/* Sidebar Toggle */}
            <button 
                onClick={() => { onToggleSidebar(); onClose(); }}
                disabled={viewSettings.isFocusMode || !canFocusMode}
                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">
                        {viewSettings.showSidebar ? 'dock_to_right' : 'dock_to_left'}
                    </span>
                    {viewSettings.showSidebar ? 'Hide Editor' : 'Show Editor'}
                </div>
            </button>

            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

            {/* Zoom Controls */}
            <button onClick={() => onZoom(0.1)} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">zoom_in</span>
                    Zoom In
                </div>
                <span className="text-[10px] text-md-sys-secondary">Ctrl +</span>
            </button>
            <button onClick={() => onZoom(-0.1)} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">zoom_out</span>
                    Zoom Out
                </div>
                <span className="text-[10px] text-md-sys-secondary">Ctrl -</span>
            </button>
            <button onClick={() => { onResetZoom(); onClose(); }} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">center_focus_strong</span>
                    Reset Zoom
                </div>
                <span className="text-[10px] text-md-sys-secondary">{Math.round(viewSettings.zoomLevel * 100)}%</span>
            </button>

            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

            {/* Full Screen */}
            <button onClick={toggleFullscreen} className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">fullscreen</span>
                    Enter Fullscreen
                </div>
                <span className="text-[10px] text-md-sys-secondary">F11</span>
            </button>

        </div>
    </>
  );
};
