import React, { useEffect, useRef } from 'react';
import abcjs from 'abcjs';

interface MusicDisplayProps {
  abcNotation: string;
  warningId?: string;
  textareaId: string;
}

export const MusicDisplay: React.FC<MusicDisplayProps> = ({ abcNotation, warningId, textareaId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  // Store the editor instance to prevent duplicates
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Wait for DOM to be ready
    const paperId = containerRef.current?.id || `abc-paper-${Math.random().toString(36).substr(2, 9)}`;
    const audioId = audioContainerRef.current?.id || `abc-audio-${Math.random().toString(36).substr(2, 9)}`;
    
    if (containerRef.current) containerRef.current.id = paperId;
    if (audioContainerRef.current) audioContainerRef.current.id = audioId;

    // Use a timeout to ensure the textarea sibling is mounted and has its ID set in the DOM
    const timer = setTimeout(() => {
        if (!editorInstanceRef.current && document.getElementById(textareaId)) {
            // Initialize ABCJS Editor which handles binding text, visuals, and audio automatically.
            // This class specifically handles the logic of clearing the synth when the textarea is empty.
            editorInstanceRef.current = new abcjs.Editor(textareaId, {
                paper_id: paperId,
                warnings_id: warningId,
                synth: {
                    el: `#${audioId}`,
                    options: { 
                        displayLoop: true, 
                        displayRestart: true, 
                        displayPlay: true, 
                        displayProgress: true, 
                        displayWarp: true 
                    }
                },
                abcjsParams: {
                    add_classes: true,
                    responsive: 'resize',
                    jazzchords: true,
                    // Use clickListener to handle selection if needed
                    clickListener: (abcelem: any) => {
                        console.log("Note clicked", abcelem);
                    }
                },
                selectionChangeCallback: (start: number, end: number) => {
                    // Optional: sync back to React state if needed, but handled by text input usually
                }
            });
        }
    }, 100);

    return () => {
        clearTimeout(timer);
        // abcjs.Editor doesn't have a strict destroy method, 
        // but we clear the ref so it can be recreated if component unmounts/remounts
        editorInstanceRef.current = null;
    };
  }, [textareaId, warningId]); // Init once based on IDs

  // Sync Effect:
  // Since ABCJS.Editor binds to standard DOM events (keyup/change), 
  // and React updates the textarea value programmatically (via props),
  // we need to manually trigger a change event on the textarea when `abcNotation` changes 
  // so that the ABCJS.Editor picks up the change.
  useEffect(() => {
    const textarea = document.getElementById(textareaId);
    if (textarea && editorInstanceRef.current) {
        // Dispatch 'input' event to simulate user typing, prompting abcjs to re-render
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [abcNotation, textareaId]);

  return (
    <div className="w-full h-full relative flex flex-col bg-white overflow-hidden p-4 md:p-8">
      {/* Audio Controls */}
      <div className="w-full flex justify-center mb-6">
         <div id="audio" ref={audioContainerRef} className="w-full max-w-3xl"></div>
      </div>
      
      {/* Visual Sheet Music */}
      <div 
        ref={containerRef} 
        id="paper"
        className="flex-1 w-full overflow-auto"
      ></div>
    </div>
  );
};