
import React, { memo, useMemo } from 'react';
import { EditorError, tokenizeLine, getTokenColor } from '../../utils/abcHighlighter';

interface SyntaxOverlayProps {
  lines: string[];
  errors: EditorError[];
  overlayRef: React.RefObject<HTMLDivElement>;
  highlight?: { start: number; end: number } | null;
}

export const SyntaxOverlay = memo(({ lines, errors, overlayRef, highlight }: SyntaxOverlayProps) => {
  
  // Memoize tokenization to avoid re-parsing regex on every playback frame (high freq updates)
  // This ensures that when 'highlight' prop changes, we only re-render the lightweight components, 
  // not re-run the heavy tokenizeLine function.
  const tokenizedLines = useMemo(() => {
      return lines.map(line => tokenizeLine(line));
  }, [lines]);

  // Calculate line start indices for absolute positioning map
  const lineOffsets = useMemo(() => {
    const offsets: number[] = [];
    let current = 0;
    for (const line of lines) {
      offsets.push(current);
      current += line.length + 1; // +1 for \n character
    }
    return offsets;
  }, [lines]);

  return (
    <div 
        ref={overlayRef}
        className="absolute inset-0 p-6 pt-6 editor-sync-font whitespace-pre overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
    >
        {lines.map((lineContent, i) => {
            const lineNum = i + 1;
            const lineStartAbs = lineOffsets[i];
            const lineEndAbs = lineStartAbs + lineContent.length;
            
            const lineErrors = errors.filter(e => e.line === lineNum && e.col !== undefined);
            
            // Optimization: Only process highlight logic if line potentially intersects
            const isLineHighlighted = highlight && 
                                      highlight.end > lineStartAbs && 
                                      highlight.start < lineEndAbs;

            // Use memoized tokens
            const tokens = tokenizedLines[i];
            let charIndex = 0; // Relative to line

            if (lineContent.length === 0) {
                 return <div key={i} className="h-[24px]">&nbsp;</div>;
            }

            return (
                <div key={i} className="h-[24px] relative">
                     {tokens.map((token, tIdx) => {
                         const tokenStartRel = charIndex;
                         const tokenEndRel = charIndex + token.content.length;
                         const tokenStartAbs = lineStartAbs + tokenStartRel;
                         const tokenEndAbs = lineStartAbs + tokenEndRel;
                         
                         charIndex = tokenEndRel;
                         
                         const colorClass = getTokenColor(token);
                         
                         // Determine if this token intersects with the highlight range
                         const isTokenHighlighted = isLineHighlighted && 
                                               Math.max(tokenStartAbs, highlight!.start) < Math.min(tokenEndAbs, highlight!.end);

                         // Check for error overlap
                         const tokenErrors = lineErrors.filter(e => {
                             const errIdx = e.col! - 1;
                             return errIdx >= tokenStartRel && errIdx < tokenEndRel;
                         });
                         
                         // Base Wrapper Style for Highlight
                         const highlightStyle = isTokenHighlighted 
                            ? "bg-md-sys-primary/30 rounded-[2px] shadow-[0_0_0_1px_rgba(var(--md-sys-primary),0.2)] transition-colors duration-75" 
                            : "";

                         if (tokenErrors.length === 0) {
                             return (
                                <span key={tIdx} className={`${colorClass} ${highlightStyle}`}>
                                    {token.content}
                                </span>
                             );
                         }
                         
                         // Handle token split due to error (Complex case)
                         const nodes: React.ReactNode[] = [];
                         let lastTokenIdx = 0;
                         const sortedErrors = tokenErrors.sort((a,b) => a.col! - b.col!);
                         
                         sortedErrors.forEach((err, errSeq) => {
                             const errIdxInToken = (err.col! - 1) - tokenStartRel;
                             
                             if (errIdxInToken > lastTokenIdx) {
                                 nodes.push(token.content.substring(lastTokenIdx, errIdxInToken));
                             }
                             
                             // Error Char
                             nodes.push(
                                 <span key={`err-${tIdx}-${errSeq}`} className="bg-red-500/50 border-b-2 border-red-500 text-white rounded-sm">
                                     {token.content.charAt(errIdxInToken)}
                                 </span>
                             );
                             
                             lastTokenIdx = errIdxInToken + 1;
                         });
                         
                         if (lastTokenIdx < token.content.length) {
                             nodes.push(token.content.substring(lastTokenIdx));
                         }
                         
                         return <span key={tIdx} className={`${colorClass} ${highlightStyle}`}>{nodes}</span>;
                     })}
                     
                     {/* EOL Error */}
                     {lineErrors.some(e => (e.col! - 1) >= lineContent.length) && (
                        <span className="bg-red-500/50 border-b-2 border-red-500 inline-block w-[1ch]">&nbsp;</span>
                     )}
                </div>
            );
        })}
    </div>
  );
});

SyntaxOverlay.displayName = 'SyntaxOverlay';
