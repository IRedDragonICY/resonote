
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface AILoggerProps {
  logs: LogEntry[];
  visible: boolean;
}

// Robust Markdown Formatter with Optimized Animation Logic
const MarkdownText: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
  const lines = text.split('\n');

  // Efficiently find the starting index of the *last* thought section.
  const animationStartIndex = isStreaming 
    ? lines.reduce((lastIdx, line, idx) => {
        const trimmed = line.trim();
        // Detect Headers: **Bold**, ## Markdown Header, or *ItalicStart* (excluding lists '* ')
        if (trimmed.startsWith('**') || trimmed.startsWith('##') || (trimmed.startsWith('*') && !trimmed.startsWith('* '))) {
          return idx;
        }
        return lastIdx;
      }, 0)
    : Infinity;

  return (
    <>
      {lines.map((line, i) => {
        // Only animate if this line is part of the active section
        const shouldPulse = i >= animationStartIndex;

        return (
          <div 
            key={i} 
            className={`min-h-[1.2em] ${line.trim() === '' ? 'h-2' : ''} whitespace-pre-wrap transition-opacity duration-300 ${shouldPulse ? 'animate-pulse' : ''}`}
          >
            {/* 
              Parser for:
              1. **Bold**
              2. *Italic*
              3. `Code`
              4. "Quotes"
            */}
            {line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|".*?")/g).map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-md-sys-onSurface font-bold">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j} className="text-md-sys-tertiary italic">{part.slice(1, -1)}</em>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={j} className="bg-md-sys-surfaceVariant px-1.5 py-0.5 rounded text-amber-500 font-mono text-[11px] font-bold mx-0.5 border border-md-sys-outline/20">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
                return <span key={j} className="text-emerald-500">{part}</span>;
              }
              return <span key={j}>{part}</span>;
            })}
          </div>
        );
      })}
    </>
  );
};

export const AILogger: React.FC<AILoggerProps> = ({ logs, visible }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, visible]);

  if (!visible && logs.length === 0) return null;

  return (
    <div className={`mt-4 w-full rounded-xl overflow-hidden bg-md-sys-surface border border-md-sys-outline/20 shadow-sm transition-all duration-500 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-md-sys-surfaceVariant/50 border-b border-md-sys-outline/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-mono font-bold text-md-sys-secondary uppercase tracking-widest">System Status</span>
        </div>
        <span className="text-[10px] font-mono text-md-sys-outline">RESONOTE-AI</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="p-4 max-h-[300px] overflow-y-auto font-mono text-xs space-y-3 scroll-smooth"
      >
        {logs.map((log, idx) => {
          const isLatest = idx === logs.length - 1;
          const isStreaming = log.type === 'thinking' && isLatest;

          return (
            <div key={idx} className="flex gap-3 group">
              <span className="text-md-sys-outline shrink-0 opacity-40 select-none pt-0.5 text-[10px] w-[50px]">{log.timestamp}</span>
              <div className={`flex-1 break-words leading-relaxed ${
                log.type === 'warning' ? 'text-red-500' :
                log.type === 'success' ? 'text-emerald-500' :
                log.type === 'thinking' ? 'text-md-sys-primary' :
                'text-md-sys-secondary'
              }`}>
                <div className="flex gap-2">
                  <span className={`opacity-50 mt-[1px] ${isStreaming ? 'animate-pulse text-md-sys-primary' : 'text-md-sys-outline'}`}>{'>'}</span>
                  <div className="flex-1">
                      <MarkdownText text={log.message} isStreaming={isStreaming} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {visible && logs.length > 0 && logs[logs.length-1].type !== 'success' && logs[logs.length-1].type !== 'warning' && (
           <div className="flex gap-3 animate-pulse opacity-50 pl-[74px]">
             <span className="text-md-sys-primary">_</span>
           </div>
        )}
      </div>
    </div>
  );
};
