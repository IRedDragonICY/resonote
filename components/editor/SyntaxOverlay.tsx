
import React, { memo, useMemo } from 'react';
import { EditorError, tokenizeLine, getTokenColor } from '../../utils/abcHighlighter';

interface SyntaxOverlayProps {
  lines: string[];
  errors: EditorError[];
  overlayRef: React.RefObject<HTMLDivElement>;
  highlight?: { start: number; end: number } | null;
}

export const SyntaxOverlay = memo(({ lines, errors, overlayRef, highlight }: SyntaxOverlayProps) => {
  
  // Memoize tokenization: Regex parsing only happens when content (lines) changes.
  // This allows the highlight prop to change rapidly during playback without triggering a re-parse.
  const tokenizedLines = useMemo(() => {
      return lines.map(line => tokenizeLine(line));
  }, [lines]);

  // Pre-calculate line start indices for fast O(1) lookups during rendering
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
            const lineStartAbs = lineOffsets[i];
            const lineEndAbs = lineStartAbs + lineContent.length;
            
            // Fast Intersection Check: Skip highlight processing if line is completely outside range
            const isLineIntersectingHighlight = highlight && 
                                      highlight.end > lineStartAbs && 
                                      highlight.start < lineEndAbs;
            
            // Errors for this line
            const lineNum = i + 1;
            const lineErrors = errors.filter(e => e.line === lineNum && e.col !== undefined);

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
                         
                         // Determine exact highlighting
                         const isTokenHighlighted = isLineIntersectingHighlight && 
                                               Math.max(tokenStartAbs, highlight!.start) < Math.min(tokenEndAbs, highlight!.end);

                         const highlightStyle = isTokenHighlighted 
                            ? "bg-md-sys-primary/30 rounded-[2px] shadow-[0_0_0_1px_rgba(var(--md-sys-primary),0.2)]" 
                            : "";

                         // If no errors overlap this token, render simple span
                         const tokenErrors = lineErrors.filter(e => {
                             const errIdx = e.col! - 1;
                             return errIdx >= tokenStartRel && errIdx < tokenEndRel;
                         });

                         if (tokenErrors.length === 0) {
                             return (
                                <span key={tIdx} className={`${colorClass} ${highlightStyle}`}>
                                    {token.content}
                                </span>
                             );
                         }
                         
                         // Render with error indicators inside token
                         const nodes: React.ReactNode[] = [];
                         let lastTokenIdx = 0;
                         const sortedErrors = tokenErrors.sort((a,b) => a.col! - b.col!);
                         
                         sortedErrors.forEach((err, errSeq) => {
                             const errIdxInToken = (err.col! - 1) - tokenStartRel;
                             
                             if (errIdxInToken > lastTokenIdx) {
                                 nodes.push(token.content.substring(lastTokenIdx, errIdxInToken));
                             }
                             
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
