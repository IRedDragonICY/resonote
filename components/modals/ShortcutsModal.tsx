
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../../types';
import { DEFAULT_SHORTCUTS, SHORTCUT_LABELS } from '../../constants/defaults';
import { normalizeKeyEvent, formatShortcutForDisplay } from '../../utils/keyboardUtils';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, settings, onSaveSettings }) => {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  
  // Group shortcuts by category
  const groupedShortcuts = Object.entries(settings.shortcuts).reduce((acc, [id, key]) => {
      const meta = SHORTCUT_LABELS[id] || { label: id, category: 'Other' };
      if (!acc[meta.category]) acc[meta.category] = [];
      acc[meta.category].push({ id, key, label: meta.label });
      return acc;
  }, {} as Record<string, { id: string; key: string; label: string }[]>);

  // Sort categories
  const categories = ['General', 'Edit', 'View', 'Help'].filter(c => groupedShortcuts[c]);

  // Listener for recording
  useEffect(() => {
      if (!recordingId) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();

          const normalized = normalizeKeyEvent(e);
          if (!normalized) return; // Modifier only

          // Escape cancels recording
          if (e.key === 'Escape') {
              setRecordingId(null);
              return;
          }

          // Save
          const newShortcuts = { ...settings.shortcuts, [recordingId]: normalized };
          onSaveSettings({ ...settings, shortcuts: newShortcuts });
          setRecordingId(null);
      };

      window.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recordingId, settings, onSaveSettings]);

  if (!isOpen) return null;

  const handleReset = () => {
      if (confirm("Reset all shortcuts to default?")) {
          onSaveSettings({ ...settings, shortcuts: { ...DEFAULT_SHORTCUTS } });
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-md-sys-surface rounded-[28px] shadow-2xl max-w-4xl w-full flex flex-col ring-1 ring-md-sys-outline/20 max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-md-sys-outline/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-md-sys-surfaceVariant/50 flex items-center justify-center text-md-sys-primary">
                  <span className="material-symbols-rounded text-2xl">keyboard</span>
              </div>
              <div>
                  <h2 className="text-xl font-bold text-md-sys-onSurface">Keyboard Shortcuts</h2>
                  <p className="text-sm text-md-sys-secondary">Click any shortcut to edit</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-md-sys-surfaceVariant rounded-full transition-colors text-md-sys-secondary">
                <span className="material-symbols-rounded">close</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {categories.map(cat => (
                    <div key={cat}>
                        <h3 className="text-xs font-bold text-md-sys-secondary uppercase tracking-widest mb-3 border-b border-md-sys-outline/10 pb-1">
                            {cat}
                        </h3>
                        <div className="space-y-2">
                            {groupedShortcuts[cat].map(item => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <span className="text-sm text-md-sys-onSurface font-medium">{item.label}</span>
                                    <button 
                                        onClick={() => setRecordingId(item.id)}
                                        className={`
                                            relative h-8 min-w-[80px] px-3 rounded-lg border text-xs font-mono font-bold transition-all flex items-center justify-center
                                            ${recordingId === item.id 
                                                ? 'bg-md-sys-primary text-md-sys-onPrimary border-md-sys-primary shadow-[0_0_10px_rgba(var(--md-sys-primary),0.5)] animate-pulse' 
                                                : 'bg-md-sys-surfaceVariant/30 text-md-sys-secondary border-md-sys-outline/20 hover:bg-md-sys-surfaceVariant hover:text-md-sys-onSurface hover:border-md-sys-outline/40'
                                            }
                                        `}
                                    >
                                        {recordingId === item.id ? 'Press keys...' : formatShortcutForDisplay(item.key)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-md-sys-outline/10 flex justify-between items-center bg-md-sys-surfaceVariant/10 rounded-b-[28px]">
            <button 
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-md-sys-error hover:bg-md-sys-error/10 rounded-full transition-colors"
            >
                Reset to Defaults
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-md-sys-primary text-md-sys-onPrimary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
