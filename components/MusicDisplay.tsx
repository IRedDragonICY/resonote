
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
  // Use stable IDs for the DOM elements
  const uniqueId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const paperId = `abc-paper-${uniqueId}`;
  const audioId = `abc-audio-${uniqueId}`;
  
  const editorRef = useRef<any>(null);
  const thumbnailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [exportingState, setExportingState] = useState<string | null>(null);

  // Mixer & Instrument State
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [muted, setMuted] = useState<Set<number>>(new Set());
  const [solos, setSolos] = useState<Set<number>>(new Set());
  const [instrument, setInstrument] = useState<number>(0); // 0 = Grand Piano

  // Visualization State
  const [activeMidiNotes, setActiveMidiNotes] = useState<number[]>([]);
  
  // Track unscaled content size to update scroll container when zoomed
  const [contentHeight, setContentHeight] = useState<number>(0);
  
  // Stable ref for the callbacks to prevent re-triggering effects on prop changes
  const onThumbnailGeneratedRef = useRef(onThumbnailGenerated);
  const onNotePlayRef = useRef(onNotePlay);

  useEffect(() => {
    onThumbnailGeneratedRef.current = onThumbnailGenerated;
  }, [onThumbnailGenerated]);

  useEffect(() => {
    onNotePlayRef.current = onNotePlay;
  }, [onNotePlay]);

  // --- 1. Voice Detection Logic (Decoupled from Editor) ---
  useEffect(() => {
    // Handle Empty State immediately
    if (!abcNotation || abcNotation.trim() === "") {
        setVoices([]);
        setMuted(new Set());
        setSolos(new Set());
        return;
    }

    // Parse ABC synchronously to get voice metadata
    const tunes = abcjs.parseOnly(abcNotation);
    const tune = tunes[0];

    if (tune && tune.lines) {
        const detectedVoices: VoiceInfo[] = [];
        let vCount = 0;
        
        const firstMusicLine = tune.lines.find((l: any) => l.staff);
        
        if (firstMusicLine && firstMusicLine.staff) {
            firstMusicLine.staff.forEach((st: any) => {
                    if (st.voices) {
                        st.voices.forEach((v: any, idx: number) => {
                            let name = `Track ${vCount + 1}`;
                            if (st.title && st.title[idx]) {
                                if (st.title[idx].name) name = st.title[idx].name;
                                else if (st.title[idx].subname) name = st.title[idx].subname;
                            }
                            detectedVoices.push({ id: vCount, name });
                            vCount++;
                        });
                    }
            });
        }
        
        setVoices(prev => {
            if (JSON.stringify(detectedVoices) !== JSON.stringify(prev)) {
                if (detectedVoices.length !== prev.length) {
                    setMuted(new Set());
                    setSolos(new Set());
                }
                return detectedVoices;
            }
            return prev;
        });
    } else {
        setVoices([]);
    }
  }, [abcNotation]);

  // --- 2. Editor Initialization ---
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20;

    const initEditor = () => {
      const paper = document.getElementById(paperId);
      const audio = document.getElementById(audioId);
      const textarea = document.getElementById(textareaId);

      if (paper && audio && textarea) {
        
        // --- CLEANUP LOGIC ---
        // Fix for "piling up" audio: Stop previous instance before creating new one
        if (editorRef.current) {
            // 1. Try to stop playback if active by finding the pushed start button
            const pauseBtn = audio.querySelector('.abcjs-midi-start.abcjs-pushed');
            if (pauseBtn && pauseBtn instanceof HTMLElement) {
                pauseBtn.click(); // Programmatically trigger pause
            }
            
            // 2. Clear the audio div to remove old controls and force fresh init
            audio.innerHTML = "";
        }
        
        const cursorControl = {
          onStart: () => {
            setActiveMidiNotes([]); // Clear piano
            const svg = paper.querySelector("svg");
            if (svg) {
                const existing = svg.querySelector(".abcjs-cursor");
                if(existing) existing.remove();

                const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
                cursor.setAttribute("class", "abcjs-cursor");
                cursor.setAttributeNS(null, 'x1', '0');
                cursor.setAttributeNS(null, 'y1', '0');
                cursor.setAttributeNS(null, 'x2', '0');
                cursor.setAttributeNS(null, 'y2', '0');
                cursor.style.pointerEvents = "none";
                svg.appendChild(cursor);
            }
          },
          onEvent: (ev: any) => {
             if (!ev) return;
             
             // --- Update Virtual Piano ---
             if (ev.midiPitches && ev.midiPitches.length > 0) {
                 setActiveMidiNotes(ev.midiPitches.map((p: any) => p.pitch));
             } else {
                 // If rests or formatting events, clear keys
                 setActiveMidiNotes([]);
             }
             
             // --- Synchronized Editor Highlight ---
             // Priority 1: Direct startChar/endChar from event object (Most reliable for timing)
             let start = ev.startChar;
             let end = ev.endChar;

             // Priority 2: Check SVG elements metadata if direct props are missing
             if ((start === undefined || end === undefined) && ev.elements && ev.elements.length > 0) {
                 // 1. Check direct elements
                 for (const el of ev.elements) {
                     if ((el as any).abcelem) {
                         start = (el as any).abcelem.startChar;
                         end = (el as any).abcelem.endChar;
                         break;
                     }
                 }
                 
                 // 2. If not found, check parent group (abcjs sometimes attaches to the <g>)
                 if ((start === undefined) && ev.elements[0].parentElement && (ev.elements[0].parentElement as any).abcelem) {
                     const parentAbcElem = (ev.elements[0].parentElement as any).abcelem;
                     start = parentAbcElem.startChar;
                     end = parentAbcElem.endChar;
                 }
             }

             // Dispatch highlight event if we found valid coordinates
             if (typeof start === 'number' && typeof end === 'number' && start !== -1) {
                 if (onNotePlayRef.current) {
                     onNotePlayRef.current(start, end);
                 }
             } else if (ev.elements && ev.elements.length === 0 && activeMidiNotes.length === 0) {
                // If event has no visual elements and no notes (e.g. a rest or spacer that has no visual), clear highlight
                if (onNotePlayRef.current) {
                   // Keep current highlight or clear? Usually better to keep the last note highlighted until next one,
                   // but for rests, maybe clearing is better. Let's clear only if explicitly needed.
                   // onNotePlayRef.current(-1, -1); 
                }
             }

             if (ev.measureStart && ev.left === null) return;

             const cursor = paper.querySelector(".abcjs-cursor") as SVGLineElement;
             if (cursor) {
               const newLeft = ev.left !== undefined ? ev.left - 2 : 0;
               const newTop = ev.top !== undefined ? ev.top : 0;
               const newHeight = ev.height !== undefined ? ev.height : 0;
               
               // --- Smooth Interpolation Logic ---
               const prevX = parseFloat(cursor.getAttribute('x1') || '0');
               const prevY = parseFloat(cursor.getAttribute('y1') || '0');

               // Determine movement type
               // 1. New Line: Vertical change > threshold (e.g., 5px)
               const isNewLine = Math.abs(newTop - prevY) > 5;
               // 2. Backward Jump: Repeat sign or D.C. al Fine
               const isBackward = newLeft < prevX;

               if (isNewLine || isBackward) {
                   // Snap instantly for big jumps to prevent diagonal flying
                   cursor.style.transition = 'none';
               } else {
                   // Smooth glide for consecutive notes on the same system
                   // 0.1s ensures responsiveness without lag, bridging the gap between discrete events
                   cursor.style.transition = 'x1 0.1s linear, x2 0.1s linear, y1 0.1s linear, y2 0.1s linear';
               }

               cursor.setAttribute("x1", newLeft.toString());
               cursor.setAttribute("x2", newLeft.toString());
               cursor.setAttribute("y1", newTop.toString());
               cursor.setAttribute("y2", (newTop + newHeight).toString());
             }
             
             const lastSelection = paper.querySelectorAll(".abcjs-highlight");
             for (let k = 0; k < lastSelection.length; k++)
                 lastSelection[k].classList.remove("abcjs-highlight");
 
             if (ev.elements) {
                 for (let i = 0; i < ev.elements.length; i++ ) {
                     const note = ev.elements[i];
                     if (note) {
                        for (let j = 0; j < note.length; j++) {
                            note[j].classList.add("abcjs-highlight");
                        }
                     }
                 }
             }
          },
          onFinished: () => {
            setActiveMidiNotes([]); // Clear piano
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
            
            // Clear Editor Highlight
            if (onNotePlayRef.current) {
                onNotePlayRef.current(-1, -1);
            }
          }
        };

        // We re-create Editor when instrument changes to force synth re-init with new program
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
                    program: instrument, // Bind Instrument
                    soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" // Ensure full soundfont
                }
            },
            abcjsParams: {
                add_classes: true, // Crucial for getting abcelem data attached
                // IMPORTANT: Adding a dummy clickListener forces abcjs to attach 'abcelem' metadata 
                // to SVG elements, which is required for our synchronization logic (as fallback).
                clickListener: (abcElem: any) => {}, 
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
      } else {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initEditor, 100);
        }
      }
    };

    initEditor();
    
    // Cleanup on unmount or re-run
    return () => {
         const audio = document.getElementById(audioId);
         if (editorRef.current && audio) {
             const pauseBtn = audio.querySelector('.abcjs-midi-start.abcjs-pushed');
             if (pauseBtn && pauseBtn instanceof HTMLElement) {
                 pauseBtn.click();
             }
             audio.innerHTML = "";
         }
    };

  }, [textareaId, paperId, audioId, warningId, instrument]); // Add instrument dependency

  // Monitor Paper Height for Zoom Scroll Fix
  useEffect(() => {
    const paper = document.getElementById(paperId);
    if (!paper) return;

    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            // We read the clientHeight of the paper, assuming abcjs sizes it correctly based on SVG content
            setContentHeight(entry.contentRect.height);
        }
    });
    
    observer.observe(paper);
    return () => observer.disconnect();
  }, [paperId, abcNotation]);

  // --- 3. Sync React State with abcjs Editor ---
  useEffect(() => {
     const ta = document.getElementById(textareaId);
     if(ta) {
        ta.dispatchEvent(new Event('change')); 
        ta.dispatchEvent(new Event('input')); 
     }
  }, [abcNotation, textareaId]);

  // --- 4. Update Synth when Mixer state changes ---
  useEffect(() => {
      if (!editorRef.current) return;

      const voicesOff: number[] = [];
      if (solos.size > 0) {
          voices.forEach(v => {
              if (!solos.has(v.id)) voicesOff.push(v.id);
          });
      } else {
          muted.forEach(id => voicesOff.push(id));
      }

      if (editorRef.current.synthParamChanged) {
           editorRef.current.synthParamChanged({ voicesOff });
      }
  }, [muted, solos, voices]);

  // --- Auto Thumbnail Generation ---
  const generateThumbnail = useCallback(() => {
    const callback = onThumbnailGeneratedRef.current;
    if (!callback) return;

    const paper = document.getElementById(paperId);
    if (!paper) return;

    const svg = paper.querySelector("svg");
    if (!svg) return;

    const svgClone = svg.cloneNode(true) as SVGElement;
    
    const style = document.createElement("style");
    style.textContent = `
      text, tspan, path { fill: #000000 !important; }
      path[stroke] { stroke: #000000 !important; fill: none !important; }
      .abcjs-cursor, .abcjs-highlight { opacity: 0 !important; } 
    `;
    svgClone.prepend(style);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    const rect = svg.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;

    if (width === 0 || height === 0) {
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(' ').map(parseFloat);
            if (parts.length === 4) {
                width = parts[2];
                height = parts[3];
            }
        }
    }

    if (!width || width === 0) width = 595;
    if (!height || height === 0) height = 842;

    const targetWidth = 400;
    const scale = targetWidth / width;
    const targetHeight = height * scale;

    img.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            callback(base64);
        }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

  }, [paperId]);

  useEffect(() => {
    const paper = document.getElementById(paperId);
    if (!paper) return;

    const observer = new MutationObserver((mutations) => {
        if (thumbnailTimeoutRef.current) {
            clearTimeout(thumbnailTimeoutRef.current);
        }
        thumbnailTimeoutRef.current = setTimeout(() => {
            generateThumbnail();
        }, 1500); 
    });
    
    observer.observe(paper, { childList: true, subtree: true, attributes: true });

    return () => {
        observer.disconnect();
        if (thumbnailTimeoutRef.current) clearTimeout(thumbnailTimeoutRef.current);
    };
  }, [paperId, generateThumbnail]);


  const handleExport = async (type: 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'doc' | 'midi' | 'wav' | 'mp3') => {
      if (exportingState) return;
      setExportingState(type);

      try {
        await exportMusic(type, {
            abcNotation,
            paperId,
            editorInstance: editorRef.current
        });
      } catch (e: any) {
        console.error("Export error", e);
        alert("Export failed: " + e.message);
      } finally {
        setExportingState(null);
      }
  };

  useImperativeHandle(ref, () => ({
    exportFile: handleExport
  }));

  const toggleMute = (voiceId: number) => {
      setMuted(prev => {
          const next = new Set(prev);
          if (next.has(voiceId)) next.delete(voiceId);
          else next.add(voiceId);
          return next;
      });
  };

  const toggleSolo = (voiceId: number) => {
      setSolos(prev => {
          const next = new Set(prev);
          if (next.has(voiceId)) next.delete(voiceId);
          else next.add(voiceId);
          return next;
      });
  };

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
             {/* Music Paper with scaling support */}
             <div className="flex-1 w-full relative">
                 {/* Scroll Wrapper to enforce height on zoom */}
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
        
        {/* Virtual Piano Visualization Area */}
        <VirtualPiano activeNotes={activeMidiNotes} />
    </div>
  );
});

MusicDisplay.displayName = 'MusicDisplay';
