
import React, { useState, useMemo } from 'react';
import { AudioMixer } from './AudioMixer';

interface MusicToolbarProps {
    audioId: string;
    voices: { id: number; name: string }[];
    muted: Set<number>;
    solos: Set<number>;
    onToggleMute: (id: number) => void;
    onToggleSolo: (id: number) => void;
    onExport: (type: 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'doc' | 'midi' | 'wav' | 'mp3') => void;
    exportingState: string | null;
    instrument: number;
    onInstrumentChange: (program: number) => void;
}

// Curated General MIDI Instruments grouped by Category
const INSTRUMENT_GROUPS = [
    {
        category: "Keyboards",
        items: [
            { name: 'Acoustic Grand Piano', program: 0 },
            { name: 'Bright Acoustic Piano', program: 1 },
            { name: 'Electric Grand Piano', program: 2 },
            { name: 'Honky-tonk Piano', program: 3 },
            { name: 'Electric Piano 1 (Rhodes)', program: 4 },
            { name: 'Electric Piano 2 (DX7)', program: 5 },
            { name: 'Harpsichord', program: 6 },
            { name: 'Clavinet', program: 7 },
            { name: 'Celesta', program: 8 },
            { name: 'Glockenspiel', program: 9 },
            { name: 'Music Box', program: 10 },
            { name: 'Vibraphone', program: 11 },
            { name: 'Marimba', program: 12 },
            { name: 'Xylophone', program: 13 },
        ]
    },
    {
        category: "Organs",
        items: [
            { name: 'Drawbar Organ', program: 16 },
            { name: 'Percussive Organ', program: 17 },
            { name: 'Rock Organ', program: 18 },
            { name: 'Church Organ', program: 19 },
            { name: 'Reed Organ', program: 20 },
            { name: 'Accordion', program: 21 },
            { name: 'Harmonica', program: 22 },
        ]
    },
    {
        category: "Guitars & Bass",
        items: [
            { name: 'Acoustic Guitar (Nylon)', program: 24 },
            { name: 'Acoustic Guitar (Steel)', program: 25 },
            { name: 'Electric Guitar (Jazz)', program: 26 },
            { name: 'Electric Guitar (Clean)', program: 27 },
            { name: 'Overdriven Guitar', program: 29 },
            { name: 'Distortion Guitar', program: 30 },
            { name: 'Acoustic Bass', program: 32 },
            { name: 'Electric Bass (Finger)', program: 33 },
            { name: 'Electric Bass (Pick)', program: 34 },
            { name: 'Fretless Bass', program: 35 },
            { name: 'Slap Bass 1', program: 36 },
            { name: 'Synth Bass 1', program: 38 },
        ]
    },
    {
        category: "Strings & Orchestral",
        items: [
            { name: 'Violin', program: 40 },
            { name: 'Viola', program: 41 },
            { name: 'Cello', program: 42 },
            { name: 'Contrabass', program: 43 },
            { name: 'Tremolo Strings', program: 44 },
            { name: 'Pizzicato Strings', program: 45 },
            { name: 'Orchestral Harp', program: 46 },
            { name: 'Timpani', program: 47 },
            { name: 'String Ensemble 1', program: 48 },
            { name: 'String Ensemble 2', program: 49 },
            { name: 'Synth Strings 1', program: 50 },
            { name: 'Choir Aahs', program: 52 },
            { name: 'Voice Oohs', program: 53 },
        ]
    },
    {
        category: "Brass & Winds",
        items: [
            { name: 'Trumpet', program: 56 },
            { name: 'Trombone', program: 57 },
            { name: 'Tuba', program: 58 },
            { name: 'Muted Trumpet', program: 59 },
            { name: 'French Horn', program: 60 },
            { name: 'Brass Section', program: 61 },
            { name: 'Soprano Sax', program: 64 },
            { name: 'Alto Sax', program: 65 },
            { name: 'Tenor Sax', program: 66 },
            { name: 'Baritone Sax', program: 67 },
            { name: 'Oboe', program: 68 },
            { name: 'Bassoon', program: 70 },
            { name: 'Clarinet', program: 71 },
            { name: 'Piccolo', program: 72 },
            { name: 'Flute', program: 73 },
            { name: 'Pan Flute', program: 75 },
        ]
    },
    {
        category: "Synths & Pads",
        items: [
            { name: 'Lead 1 (Square)', program: 80 },
            { name: 'Lead 2 (Sawtooth)', program: 81 },
            { name: 'Lead 3 (Calliope)', program: 82 },
            { name: 'Pad 1 (New age)', program: 88 },
            { name: 'Pad 2 (Warm)', program: 89 },
            { name: 'Pad 3 (Polysynth)', program: 90 },
            { name: 'FX 1 (Rain)', program: 96 },
            { name: 'FX 4 (Atmosphere)', program: 99 },
            { name: 'FX 5 (Brightness)', program: 100 },
        ]
    }
];

export const MusicToolbar: React.FC<MusicToolbarProps> = ({
    audioId,
    voices,
    muted,
    solos,
    onToggleMute,
    onToggleSolo,
    onExport,
    exportingState,
    instrument,
    onInstrumentChange
}) => {
    const [showMixer, setShowMixer] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showInstrumentMenu, setShowInstrumentMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const toggleExportMenu = () => {
        setShowExportMenu(!showExportMenu);
        setShowMixer(false);
        setShowInstrumentMenu(false);
    };

    const toggleMixer = () => {
        setShowMixer(!showMixer);
        setShowExportMenu(false);
        setShowInstrumentMenu(false);
    };

    const toggleInstrumentMenu = () => {
        setShowInstrumentMenu(!showInstrumentMenu);
        setShowMixer(false);
        setShowExportMenu(false);
        if (!showInstrumentMenu) {
            setSearchTerm(""); // Reset search when opening
        }
    };

    const handleInstrumentSelect = (prog: number) => {
        onInstrumentChange(prog);
        setShowInstrumentMenu(false);
        setSearchTerm("");
    };

    const currentInstrumentName = useMemo(() => {
        for (const group of INSTRUMENT_GROUPS) {
            const found = group.items.find(i => i.program === instrument);
            if (found) return found.name;
        }
        return 'Grand Piano';
    }, [instrument]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return INSTRUMENT_GROUPS;
        const lowerTerm = searchTerm.toLowerCase();
        
        return INSTRUMENT_GROUPS.map(group => ({
            ...group,
            items: group.items.filter(item => 
                item.name.toLowerCase().includes(lowerTerm)
            )
        })).filter(group => group.items.length > 0);
    }, [searchTerm]);

    return (
        <div className="flex flex-col border-b border-md-sys-outline/10 bg-md-sys-surfaceVariant/10 z-10" onClick={(e) => e.stopPropagation()}>
            
            {/* Row 1: Audio Player (Full Width) */}
            <div className="w-full px-4 py-2 border-b border-md-sys-outline/10">
                 <div id={audioId} className="w-full min-h-[40px] flex items-center justify-center">
                     {/* Audio controls render here automatically by abcjs */}
                 </div>
            </div>
            
            {/* Row 2: Menu Controls (Right Aligned) */}
            <div className="flex items-center justify-end px-4 py-2 gap-2 overflow-visible relative">
                
                {/* Instrument Selector */}
                <div className="relative">
                     <button
                        onClick={toggleInstrumentMenu}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border ${showInstrumentMenu ? 'bg-md-sys-surfaceVariant border-md-sys-outline/20 text-md-sys-onSurface shadow-inner' : 'border-transparent hover:bg-md-sys-surfaceVariant/50 text-md-sys-secondary hover:text-md-sys-onSurface'}`}
                        title="Change Instrument"
                     >
                        <span className="material-symbols-rounded text-lg">piano</span>
                        <span className="text-sm font-medium hidden sm:block max-w-[150px] truncate">
                            {currentInstrumentName}
                        </span>
                        <span className="material-symbols-rounded text-sm opacity-60">expand_more</span>
                     </button>

                     {showInstrumentMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowInstrumentMenu(false)}></div>
                            <div className="absolute top-full right-0 mt-2 w-64 bg-md-sys-surface rounded-xl shadow-2xl border border-md-sys-outline/10 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/5">
                                
                                {/* Search Header */}
                                <div className="p-2 border-b border-md-sys-outline/10 bg-md-sys-surface">
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-2.5 top-1/2 -translate-y-1/2 text-md-sys-secondary text-[16px]">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Find instrument..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-md-sys-surfaceVariant/50 text-md-sys-onSurface text-[13px] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-md-sys-primary border border-transparent placeholder:text-md-sys-outline"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>

                                {/* Scrollable List */}
                                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {filteredGroups.length === 0 ? (
                                        <div className="p-8 text-center text-md-sys-secondary flex flex-col items-center gap-2 opacity-60">
                                            <span className="material-symbols-rounded text-2xl">music_off</span>
                                            <span className="text-xs">No sounds found</span>
                                        </div>
                                    ) : (
                                        filteredGroups.map((group, groupIdx) => (
                                            <div key={groupIdx} className="border-b border-md-sys-outline/10 last:border-b-0">
                                                <div className="px-4 py-1.5 bg-md-sys-surfaceVariant/20 sticky top-0 backdrop-blur-sm z-10">
                                                    <span className="text-[10px] font-bold text-md-sys-primary uppercase tracking-widest">
                                                        {group.category}
                                                    </span>
                                                </div>
                                                <div>
                                                    {group.items.map((inst) => (
                                                        <button
                                                            key={inst.program}
                                                            onClick={() => handleInstrumentSelect(inst.program)}
                                                            className={`w-full text-left px-4 py-2 text-[13px] transition-colors flex items-center gap-2 group ${instrument === inst.program ? 'bg-md-sys-primary/10 text-md-sys-primary' : 'text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50'}`}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${instrument === inst.program ? 'bg-md-sys-primary' : 'bg-transparent group-hover:bg-md-sys-outline/20'}`}></div>
                                                            {inst.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                     )}
                </div>

                <div className="w-px h-6 bg-md-sys-outline/20 mx-1"></div>

                {/* Mixer Button */}
                {voices.length > 0 && (
                    <div className="relative">
                        <button 
                            onClick={toggleMixer}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 border ${showMixer ? 'bg-md-sys-primary border-md-sys-primary text-md-sys-onPrimary shadow-md' : 'border-transparent hover:bg-md-sys-surfaceVariant/50 text-md-sys-secondary hover:text-md-sys-onSurface'}`}
                            title="Audio Mixer"
                        >
                            <span className="material-symbols-rounded text-lg">tune</span>
                        </button>

                        {/* Mixer Popover */}
                        {showMixer && (
                            <AudioMixer 
                                voices={voices}
                                muted={muted}
                                solos={solos}
                                onToggleMute={onToggleMute}
                                onToggleSolo={onToggleSolo}
                            />
                        )}
                    </div>
                )}

                <div className="w-px h-6 bg-md-sys-outline/20 mx-1"></div>

                {/* Grouped Export Button */}
                <div className="relative">
                    <button
                        onClick={toggleExportMenu}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border ${showExportMenu ? 'bg-md-sys-surfaceVariant border-md-sys-outline/20 text-md-sys-onSurface' : 'border-transparent hover:bg-md-sys-surfaceVariant/50 text-md-sys-secondary hover:text-md-sys-onSurface'}`}
                        disabled={!!exportingState}
                    >
                        {exportingState ? (
                            <span className="material-symbols-rounded text-lg animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-rounded text-lg">ios_share</span>
                        )}
                        <span className="text-sm font-medium">Export</span>
                        <span className="material-symbols-rounded text-sm opacity-60">expand_more</span>
                    </button>

                    {/* Nested Export Menu */}
                    {showExportMenu && (
                        <>
                             <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                             <div className="absolute top-full right-0 mt-2 w-56 bg-md-sys-surface rounded-xl shadow-2xl border border-md-sys-outline/10 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/5">
                                 
                                 {/* Documents Group */}
                                 <div className="px-3 py-1.5 border-b border-md-sys-outline/10 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider">
                                     Documents
                                 </div>
                                 <button onClick={() => onExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-red-400">picture_as_pdf</span> PDF Document
                                 </button>
                                 <button onClick={() => onExport('doc')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-blue-400">description</span> Word (.doc)
                                 </button>

                                 {/* Images Group */}
                                 <div className="px-3 py-1.5 mt-1 border-y border-md-sys-outline/10 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider bg-md-sys-surfaceVariant/20">
                                     Images
                                 </div>
                                 <button onClick={() => onExport('png')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-emerald-400">image</span> PNG
                                 </button>
                                 <button onClick={() => onExport('jpg')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-emerald-400">image</span> JPG
                                 </button>
                                 <button onClick={() => onExport('webp')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-emerald-400">image</span> WebP
                                 </button>
                                 <button onClick={() => onExport('svg')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-orange-400">draw</span> SVG
                                 </button>

                                 {/* Audio Group */}
                                 <div className="px-3 py-1.5 mt-1 border-y border-md-sys-outline/10 text-[10px] font-bold text-md-sys-secondary uppercase tracking-wider bg-md-sys-surfaceVariant/20">
                                     Audio
                                 </div>
                                 <button onClick={() => onExport('midi')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-amber-400">piano</span> MIDI
                                 </button>
                                 <button onClick={() => onExport('wav')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-blue-400">headphones</span> WAV
                                 </button>
                                 <button onClick={() => onExport('mp3')} className="w-full text-left px-4 py-2 text-sm text-md-sys-onSurface hover:bg-md-sys-surfaceVariant/50 transition-colors flex items-center gap-3">
                                     <span className="material-symbols-rounded text-lg text-purple-400">music_note</span> MP3
                                 </button>
                             </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
