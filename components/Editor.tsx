import React, { useEffect, useState } from 'react';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  warningId?: string;
  textareaId?: string;
  onImport: () => void;
  onExport: () => void;
}

export const Editor: React.FC<EditorProps> = ({ 
  value, 
  onChange, 
  warningId, 
  textareaId,
  onImport,
  onExport
}) => {
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!warningId) return;

    const el = document.getElementById(warningId);
    if (!el) return;

    const checkStatus = () => {
      const text = el.innerText || "";
      // Check if the text explicitly indicates "No errors"
      // If the user specifically sees "No errors", we style it green.
      // Otherwise, we assume it's an error message (Red).
      const hasNoErrorsMessage = text.toLowerCase().includes("no error");
      setIsSuccess(hasNoErrorsMessage);
    };

    // Initial check
    checkStatus();

    // Observe changes to the element's text content
    const observer = new MutationObserver(checkStatus);
    observer.observe(el, { childList: true, characterData: true, subtree: true });

    return () => observer.disconnect();
  }, [warningId]);

  return (
    <div className="w-full h-full flex flex-col bg-md-sys-surface rounded-3xl border border-md-sys-outline overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-sys-outline bg-md-sys-surfaceVariant/50">
        <div className="flex items-center">
          <span className="material-symbols-rounded text-md-sys-primary mr-3">code</span>
          <h3 className="text-md font-medium text-white tracking-wide">ABC Notation Source</h3>
        </div>
        <div className="flex items-center gap-1">
             <button 
                onClick={onImport} 
                className="p-2 hover:bg-white/10 rounded-lg text-md-sys-secondary hover:text-white transition-colors" 
                title="Import Source (.abc, .txt)"
             >
                <span className="material-symbols-rounded text-[20px]">upload_file</span>
             </button>
             <button 
                onClick={onExport} 
                className="p-2 hover:bg-white/10 rounded-lg text-md-sys-secondary hover:text-white transition-colors" 
                title="Export Source (.abc)"
             >
                <span className="material-symbols-rounded text-[20px]">download</span>
             </button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full bg-transparent p-6 text-sm font-mono text-md-sys-secondary resize-none focus:outline-none focus:ring-0 leading-relaxed"
          spellCheck={false}
        />
        <div className="absolute bottom-4 right-4 text-xs text-md-sys-outline pointer-events-none">
          Powered by Google AI
        </div>
      </div>
      {warningId && (
        <div 
          id={warningId}
          className={`empty:hidden border-t border-md-sys-outline/30 text-xs font-mono p-4 max-h-[150px] overflow-auto whitespace-pre-wrap shadow-inner transition-colors duration-300 ${
            isSuccess 
              ? "bg-emerald-900/20 text-emerald-400 border-emerald-500/20" 
              : "bg-[#2a1515] text-red-300 border-red-500/20"
          }`}
        >
        </div>
      )}
    </div>
  );
};