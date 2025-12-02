
import React, { useEffect, useRef, useImperativeHandle, useCallback, useState } from 'react';
import abcjs from 'abcjs';
import { MusicToolbar } from './music/MusicToolbar';
import { VirtualPiano } from './music/VirtualPiano';
import { exportMusic } from '../utils/exportHandler';

interface MusicDisplayProps {
  abcNotation: string;
  warningId?: string;
  textareaId: string;
  onThumbnailGenerated?: (base64: string) => void;
  zoomLevel?: number;
  onNotePlay?: (startChar: number, endChar: number) => void;
}

export interface MusicDisplayHandle {
  exportFile: (type: 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'doc' | 'midi' | 'wav' | 'mp3') => void;
}

interface VoiceInfo {
  id: number;
  name: string;
}

export const MusicDisplay = React.forwardRef<MusicDisplayHandle, MusicDisplayProps>(({ 
  abcNotation, 
  warningId, 
  textareaId,
  onThumbnailGenerated,
  zoomLevel = 1.0,
  onNotePlay
}, ref) => {
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const paperId = `abc-paper-${uniqueId}`;
  const audioId = `abc-audio-${uniqueId}`;
  
  const editorRef = useRef<any>(null);
  const thumbnailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotePlayRef = useRef(onNotePlay);
  
  const [exportingState, setExportingState] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [muted, setMuted] = useState<Set<number>>(new Set());
  const [solos, setSolos] = useState<Set<number>>(new Set());
  const [instrument, setInstrument] = useState<number>(0);
  const [activeMidiNotes, setActiveMidiNotes] = useState<number[]>([]);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => { onNotePlayRef.current = onNotePlay; }, [onNotePlay]);

  useEffect(() => {
    if (!abcNotation?.trim()) {
        setVoices([]);
        setMuted(new Set());
        setSolos(new Set());
        return;
    }

    const tunes = abcjs.parseOnly(abcNotation);
    const tune = tunes[0];

    if (tune?.lines) {
        const detectedVoices: VoiceInfo[] = [];
        let vCount = 0;
        const firstMusicLine = tune.lines.find((l: any) => l.staff);
        
        if (firstMusicLine?.staff) {
            firstMusicLine.staff.forEach((st: any) => {
                if (st.voices) {
                    st.voices.forEach((v: any, idx: number) => {
                        let name = `Track ${vCount + 1}`;
                        if (st.title?.[idx]) {
                            name = st.title[idx].name || st.title[idx].subname || name;
                        }
                        detectedVoices.push({ id: vCount, name });
                        vCount++;
                    });
                }
            });
        }
        
        setVoices(prev => JSON.stringify(detectedVoices) !== JSON.stringify(prev) ? detectedVoices : prev);
    }
  }, [abcNotation]);

  useEffect(() => {
    const paper = document.getElementById(paperId);
    const audio = document.getElementById(audioId);

    if (paper && audio) {
        if (editorRef.current) {
            const pauseBtn = audio.querySelector('.abcjs-midi-start.abcjs-pushed') as HTMLElement;
            if (pauseBtn) pauseBtn.click();
            audio.innerHTML = "";
        }
        
        const cursorControl = {
          onStart: () => {
            setActiveMidiNotes([]);
            const svg = paper.querySelector("svg");
            if (svg && !svg.querySelector(".abcjs-cursor")) {
                const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
                cursor.setAttribute("class", "abcjs-cursor");
                cursor.setAttribute("x1", "0");
                cursor.setAttribute("y1", "0");
                cursor.setAttribute("x2", "0");
                cursor.setAttribute("y2", "0");
                cursor.style.pointerEvents = "none";
                svg.appendChild(cursor);
            }
          },
          onEvent: (ev: any) => {
             if (!ev) return;
             
             // 1. Piano Visualization
             setActiveMidiNotes(ev.midiPitches?.map((p: any) => p.pitch) || []);
             
             // 2. Code Highlighting - Direct Property Access (Fastest)
             const start = ev.startChar ?? -1;
             const end = ev.endChar ?? -1;

             // Only dispatch if we have a valid range range
             if (onNotePlayRef.current && start !== -1 && end !== -1) {
                 onNotePlayRef.current(start, end);
             }

             // 3. Cursor Movement
             if (ev.measureStart && ev.left === null) return;

             const cursor = paper.querySelector(".abcjs-cursor");
             if (cursor) {
               const newLeft = (ev.left ?? 0) - 2;
               const newTop = ev.top ?? 0;
               const newHeight = ev.height ?? 0;
               
               const prevX = parseFloat(cursor.getAttribute('x1') || '0');
               const prevY = parseFloat(cursor.getAttribute('y1') || '0');

               // Optimize transition: Snap on large jumps (newlines/repeats), glide on steps
               const isJump = Math.abs(newTop - prevY) > 5 || newLeft < prevX;
               (cursor as SVGElement).style.transition = isJump ? 'none' : 'all 0.1s linear';

               cursor.setAttribute("x1", newLeft.toString());
               cursor.setAttribute("x2", newLeft.toString());
               cursor.setAttribute("y1", newTop.toString());
               cursor.setAttribute("y2", (newTop + newHeight).toString());
             }
             
             // 4. SVG Element Highlighting
             const lastSelection = paper.querySelectorAll(".abcjs-highlight");
             for (let k = 0; k < lastSelection.length; k++)
                 lastSelection[k].classList.remove("abcjs-highlight");
 
             if (ev.elements) {
                 for (let i = 0; i < ev.elements.length; i++ ) {
                     const els = ev.elements[i];
                     if (els) {
                        for (let j = 0; j < els.length; j++) {
                            els[j].classList.add("abcjs-highlight");
                        }
                     }
                 }
             }
          },
          onFinished: () => {
            setActiveMidiNotes([]);
            const cursor = paper.querySelector(".abcjs-cursor");
            if (cursor) {
               cursor.setAttribute("x1", "0");
               cursor.setAttribute("x2", "0");
               cursor.setAttribute("y1", "0");
               cursor.setAttribute("y2", "0");
            }
            const lastSelection = paper.querySelectorAll(".abcjs-highlight");
             for (let k = 0; k < lastSelection.length; k++)
                 lastSelection[k].classList.remove("abcjs-highlight");
            
            if (onNotePlayRef.current) onNotePlayRef.current(-1, -1);
          }
        };

        editorRef.current = new abcjs.Editor(textareaId, {
            paper_id: paperId,
            warnings_id: warningId,
            synth: {
                el: `#${audioId}`,
                cursorControl: cursorControl,
                options: { 
                    displayLoop: true, 
                    displayRestart: true, 
                    displayPlay: true, 
                    displayProgress: true, 
                    displayWarp: true,
                    program: instrument,
                    soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/"
                }
            },
            abcjsParams: {
                add_classes: true,
                clickListener: () => {}, // Force metadata attachment
                responsive: 'resize',
                jazzchords: true,
                format: {
                    gchordfont: "Inter 12",
                    textfont: "Inter 12",
                    annotationfont: "Inter 10 italic",
                    vocalfont: "Inter 12",
                    partsfont: "Inter 12 box",
                    wordsfont: "Inter 12",
                    titlefont: "Inter 20 bold",
                    subtitlefont: "Inter 14",
                    composerfont: "Inter 12 italic",
                    footerfont: "Inter 10"
                }
            },
            onchange: () => {}
        });
      }

  }, [textareaId, paperId, audioId, warningId, instrument]);

  // Content Height Observer for Zoom
  useEffect(() => {
    const paper = document.getElementById(paperId);
    if (!paper) return;

    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            setContentHeight(entry.contentRect.height);
        }
    });
    
    observer.observe(paper);
    return () => observer.disconnect();
  }, [paperId, abcNotation]);

  // Sync changes
  useEffect(() => {
     const ta = document.getElementById(textareaId);
     if(ta) {
        ta.dispatchEvent(new Event('change')); 
        ta.dispatchEvent(new Event('input')); 
     }
  }, [abcNotation, textareaId]);

  // Mixer Updates
  useEffect(() => {
      if (!editorRef.current?.synthParamChanged) return;

      const voicesOff: number[] = [];
      if (solos.size > 0) {
          voices.forEach(v => {
              if (!solos.has(v.id)) voicesOff.push(v.id);
          });
      } else {
          muted.forEach(id => voicesOff.push(id));
      }

      editorRef.current.synthParamChanged({ voicesOff });
  }, [muted, solos, voices]);

  const handleExport = async (type: any) => {
      if (exportingState) return;
      setExportingState(type);
      try {
        await exportMusic(type, { abcNotation, paperId, editorInstance: editorRef.current });
      } catch (e: any) {
        console.error(e);
        alert("Export failed: " + e.message);
      } finally {
        setExportingState(null);
      }
  };

  useImperativeHandle(ref, () => ({ exportFile: handleExport }));

  const toggleMute = (id: number) => setMuted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
  });

  const toggleSolo = (id: number) => setSolos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
  });

  return (
    <div className="w-full h-full flex flex-col relative" style={{ backgroundColor: 'var(--sheet-music-bg)', color: 'var(--sheet-music-ink)' }}>
        <MusicToolbar 
            audioId={audioId}
            voices={voices}
            muted={muted}
            solos={solos}
            onToggleMute={toggleMute}
            onToggleSolo={toggleSolo}
            onExport={handleExport}
            exportingState={exportingState}
            instrument={instrument}
            onInstrumentChange={setInstrument}
        />

        <div className="flex-1 min-h-0 overflow-auto p-4 custom-scrollbar relative flex flex-col" style={{ backgroundColor: 'var(--sheet-music-bg)' }}>
             <div className="flex-1 w-full relative">
                 <div style={{ height: contentHeight > 0 && zoomLevel !== 1 ? contentHeight * zoomLevel : 'auto', transformOrigin: 'top left' }}>
                    <div 
                        id={paperId} 
                        className="w-full min-h-full transition-transform duration-200 ease-out origin-top-left" 
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                    />
                 </div>

                 {(!abcNotation) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                         <div className="text-center text-md-sys-secondary">
                            <span className="material-symbols-rounded text-6xl">music_note</span>
                            <p className="mt-2 text-sm">Visualization area</p>
                         </div>
                    </div>
                 )}
             </div>
        </div>
        <VirtualPiano activeNotes={activeMidiNotes} />
    </div>
  );
});

MusicDisplay.displayName = 'MusicDisplay';
