
import React from 'react';

interface AudioMixerProps {
    voices: { id: number; name: string }[];
    muted: Set<number>;
    solos: Set<number>;
    onToggleMute: (id: number) => void;
    onToggleSolo: (id: number) => void;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({ voices, muted, solos, onToggleMute, onToggleSolo }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-64 bg-md-sys-surface rounded-xl shadow-2xl border border-md-sys-outline/10 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100 text-md-sys-onSurface">
            <div className="px-4 py-3 border-b border-md-sys-outline/10 bg-md-sys-surfaceVariant/30 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-md-sys-secondary">Mixer</h4>
                <span className="text-[10px] bg-md-sys-onSurface/10 px-2 py-0.5 rounded-full text-md-sys-secondary">{voices.length} Tracks</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
                {voices.map(v => {
                    const isMuted = muted.has(v.id);
                    const isSolo = solos.has(v.id);
                    const isImplicitlyMuted = solos.size > 0 && !isSolo;

                    return (
                        <div key={v.id} className={`flex items-center justify-between p-2 rounded-lg mb-1 ${isImplicitlyMuted ? 'opacity-50' : ''} hover:bg-md-sys-surfaceVariant/50 transition-all`}>
                            <span className="text-xs font-medium truncate flex-1 mr-2 text-md-sys-onSurface" title={v.name}>{v.name}</span>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => onToggleMute(v.id)}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${isMuted ? 'bg-md-sys-error text-white' : 'bg-md-sys-outline/20 text-md-sys-secondary hover:bg-md-sys-outline/40 hover:text-md-sys-onSurface'}`}
                                    title="Mute"
                                >
                                    M
                                </button>
                                <button 
                                    onClick={() => onToggleSolo(v.id)}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${isSolo ? 'bg-yellow-500 text-black' : 'bg-md-sys-outline/20 text-md-sys-secondary hover:bg-md-sys-outline/40 hover:text-md-sys-onSurface'}`}
                                    title="Solo"
                                >
                                    S
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
