import React, { useEffect, useState } from 'react';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  warningId?: string;
  textareaId?: string;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, warningId, textareaId }) => {
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
      <div className="flex items-center px-6 py-4 border-b border-md-sys-outline bg-md-sys-surfaceVariant/50">
        <span className="material-symbols-rounded text-md-sys-primary mr-3">code</span>
        <h3 className="text-md font-medium text-white tracking-wide">ABC Notation Source</h3>
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