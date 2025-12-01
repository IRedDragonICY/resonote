
import React, { useMemo } from 'react';

interface VirtualPianoProps {
  activeNotes: number[]; // Array of MIDI numbers currently playing
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({ activeNotes }) => {
  // Generate keys for a standard range (e.g., C2 to C7: MIDI 36 to 96)
  // Or responsive based on active notes? Let's do a fixed generic range for stability.
  const startNote = 36; // C2
  const endNote = 84;   // C6
  
  const keys = useMemo(() => {
    const k = [];
    for (let i = startNote; i <= endNote; i++) {
      const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
      k.push({ midi: i, isBlack });
    }
    return k;
  }, []);

  return (
    <div className="w-full h-24 bg-md-sys-surfaceVariant/30 border-t border-md-sys-outline/20 relative overflow-hidden flex items-start justify-center select-none shadow-inner">
      <div className="relative flex h-full">
        {keys.map((key) => {
          const isActive = activeNotes.includes(key.midi);
          
          if (key.isBlack) return null; // Render black keys separately to overlay

          // Render White Keys
          return (
            <div
              key={key.midi}
              className={`
                relative w-8 h-full border-r border-md-sys-outline/20 last:border-r-0 transition-colors duration-75 ease-out
                ${isActive 
                  ? 'bg-md-sys-primary shadow-[inset_0_-10px_20px_rgba(0,0,0,0.2)]' 
                  : 'bg-md-sys-surface hover:bg-white'
                }
              `}
            >
               {isActive && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/50 blur-sm" />}
            </div>
          );
        })}

        {/* Render Black Keys Overlay */}
        <div className="absolute inset-0 flex pointer-events-none">
           {keys.map((key, index) => {
              if (!key.isBlack) {
                 // Spacer for white key position
                 return <div key={index} className="w-8 h-full invisible" />;
              }

              // It's a black key. It sits ON TOP of the previous white key boundary.
              // We need to shift it left by half a width (approx).
              const isActive = activeNotes.includes(key.midi);
              
              return (
                <div 
                    key={key.midi}
                    className="w-0 relative" // Zero width container to not disrupt flow
                >
                    <div 
                        className={`
                            absolute top-0 -left-3 w-6 h-[60%] z-10 rounded-b-md shadow-md transition-colors duration-75 border-x border-b border-black/30
                            ${isActive 
                                ? 'bg-md-sys-primary/80' 
                                : 'bg-md-sys-onSurface'
                            }
                        `}
                    >
                         {isActive && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50 blur-sm" />}
                    </div>
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );
};
