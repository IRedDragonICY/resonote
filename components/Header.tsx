
import React, { useState } from 'react';
import { ViewSettings } from '../App';

interface HeaderProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  onOpenTerms: () => void;
  onOpenChangelog: () => void;
  onOpenSettings: () => void;
  onImport: () => void;
  onExport: (type: 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'doc' | 'midi' | 'wav' | 'mp3' | 'abc' | 'txt') => void;
  viewSettings: ViewSettings;
  onToggleSidebar: () => void;
  onZoom: (delta: number) => void;
  onResetZoom: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeMenu, 
  setActiveMenu, 
  onOpenAbout, 
  onOpenFeedback,
  onOpenTerms,
  onOpenChangelog,
  onOpenSettings,
  onImport,
  onExport,
  viewSettings,
  onToggleSidebar,
  onZoom,
  onResetZoom,
  theme,
  onToggleTheme
}) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showExportSubmenu, setShowExportSubmenu] = useState(false);

  const handleCheckForUpdates = async () => {
      setCheckingUpdate(true);
      setActiveMenu(null);
      
      try {
          const res = await fetch('https://api.github.com/repos/IRedDragonICY/resonote/releases/latest');
          if (res.ok) {
              const data = await res.json();
              window.open(data.html_url, '_blank');
          } else {
              alert("Could not connect to GitHub to check for updates.");
          }
      } catch (e) {
          console.error(e);
          window.open('https://github.com/IRedDragonICY/resonote/releases', '_blank');
      } finally {
          setCheckingUpdate(false);
      }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    setActiveMenu(null);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-md-sys-surface border-b border-md-sys-outline/20 z-50 flex items-center justify-between px-4 select-none shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-4">
          {/* Icon & Title */}
          <div className="flex items-center gap-3 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6">
                <rect width="32" height="32" rx="10" className="fill-md-sys-primary"/>
                <path d="M20 10V6h-7v12.5c0 1.93-1.57 3.5-3.5 3.5S6 20.43 6 18.5 7.57 15 9.5 15c.47 0 .91.1 1.32.26V10h9z" className="fill-md-sys-onPrimary" transform="translate(2, 2)"/>
                <path d="M26 4l-1.5 3L21.5 8.5 24.5 10 26 13l1.5-3 3-1.5-3-1.5z" className="fill-md-sys-onPrimary"/>
              </svg>
              <span className="text-sm font-bold tracking-tight text-md-sys-onSurface">Resonote</span>
          </div>
          
          {/* Desktop Menu Items */}
          <div className="hidden md:flex items-center gap-1">
               
               {/* File Menu */}
               <div className="relative">
                  <button 
                      onClick={() => {
                          if (activeMenu === 'File') {
                              setActiveMenu(null);
                          } else {
                              setActiveMenu('File');
                              setShowExportSubmenu(false);
                          }
                      }}
                      className={`px-3 py-1 rounded transition-colors cursor-default text-[12px] font-medium ${
                          activeMenu === 'File' 
                          ? 'bg-md-sys-onSurface/10 text-md-sys-onSurface' 
                          : 'text-md-sys-secondary hover:bg-md-sys-onSurface/5 hover:text-md-sys-onSurface'
                      }`}
                  >
                      File
                  </button>

                  {activeMenu === 'File' && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute top-full left-0 mt-2 w-64 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-visible flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
                              
                              {/* Import Option */}
                              <button 
                                  onClick={() => { onImport(); setActiveMenu(null); }}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                              >
                                  <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">upload_file</span>
                                  Import Source...
                              </button>

                              <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                              {/* Export As Group */}
                              <div 
                                className="relative group"
                                onMouseEnter={() => setShowExportSubmenu(true)}
                                onMouseLeave={() => setShowExportSubmenu(false)}
                              >
                                  <button 
                                      className="w-full text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setShowExportSubmenu(!showExportSubmenu);
                                      }}
                                  >
                                      <div className="flex items-center gap-3">
                                          <span className="material-symbols-rounded text-[18px] text-md-sys-primary">ios_share</span>
                                          Export As
                                      </div>
                                      <span className="material-symbols-rounded text-[18px] text-md-sys-secondary group-hover:text-md-sys-onSurface">chevron_right</span>
                                  </button>

                                  {/* Submenu */}
                                  {showExportSubmenu && (
                                      <div className="absolute left-full top-0 -ml-1 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20 animate-in fade-in zoom-in-95 duration-100">
                                          
                                          {/* Source Exports */}
                                          <button 
                                              onClick={() => { onExport('abc'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">code</span>
                                              ABC Notation
                                          </button>
                                          <button 
                                              onClick={() => { onExport('txt'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">description</span>
                                              Plain Text
                                          </button>

                                          {/* Divider */}
                                          <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                                          {/* Documents */}
                                           <button 
                                              onClick={() => { onExport('pdf'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-red-400">picture_as_pdf</span>
                                              PDF Document
                                          </button>
                                          <button 
                                              onClick={() => { onExport('doc'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-blue-400">description</span>
                                              Word (.doc)
                                          </button>

                                          <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                                          {/* Visual Exports */}
                                          <button 
                                              onClick={() => { onExport('png'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                                              Image (.png)
                                          </button>
                                          <button 
                                              onClick={() => { onExport('jpg'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                                              Image (.jpg)
                                          </button>
                                          <button 
                                              onClick={() => { onExport('webp'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-emerald-400">image</span>
                                              Image (.webp)
                                          </button>
                                          <button 
                                              onClick={() => { onExport('svg'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-orange-400">draw</span>
                                              Vector (.svg)
                                          </button>

                                          <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                                          {/* Audio Exports */}
                                          <button 
                                              onClick={() => { onExport('midi'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-amber-400">piano</span>
                                              MIDI File
                                          </button>
                                          <button 
                                              onClick={() => { onExport('wav'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-blue-400">headphones</span>
                                              Audio (.wav)
                                          </button>
                                          <button 
                                              onClick={() => { onExport('mp3'); setActiveMenu(null); }}
                                              className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                                          >
                                              <span className="material-symbols-rounded text-[18px] text-purple-400">music_note</span>
                                              Audio (.mp3)
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </>
                  )}
               </div>

               {/* View Menu */}
               <div className="relative">
                 <button 
                     onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}
                     className={`px-3 py-1 rounded transition-colors cursor-default text-[12px] font-medium ${
                         activeMenu === 'View' 
                         ? 'bg-md-sys-onSurface/10 text-md-sys-onSurface' 
                         : 'text-md-sys-secondary hover:bg-md-sys-onSurface/5 hover:text-md-sys-onSurface'
                     }`}
                 >
                    View
                 </button>

                 {activeMenu === 'View' && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                        <div className="absolute top-full left-0 mt-2 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
                            
                            {/* Focus Mode */}
                            <button 
                                onClick={() => { onToggleSidebar(); setActiveMenu(null); }}
                                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-primary">
                                        {viewSettings.showSidebar ? 'dock_to_right' : 'dock_to_left'}
                                    </span>
                                    {viewSettings.showSidebar ? 'Focus Mode' : 'Show Editor'}
                                </div>
                                {!viewSettings.showSidebar && <span className="text-[10px] text-emerald-400 font-bold">ON</span>}
                            </button>

                            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                            {/* Zoom Controls */}
                            <button 
                                onClick={() => onZoom(0.1)}
                                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">zoom_in</span>
                                    Zoom In
                                </div>
                                <span className="text-[10px] text-md-sys-secondary">Ctrl +</span>
                            </button>
                            <button 
                                onClick={() => onZoom(-0.1)}
                                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">zoom_out</span>
                                    Zoom Out
                                </div>
                                <span className="text-[10px] text-md-sys-secondary">Ctrl -</span>
                            </button>
                            <button 
                                onClick={() => { onResetZoom(); setActiveMenu(null); }}
                                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">center_focus_strong</span>
                                    Reset Zoom
                                </div>
                                <span className="text-[10px] text-md-sys-secondary">{Math.round(viewSettings.zoomLevel * 100)}%</span>
                            </button>

                            <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>

                            {/* Full Screen */}
                            <button 
                                onClick={toggleFullscreen}
                                className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-[18px] text-md-sys-secondary">fullscreen</span>
                                    Enter Fullscreen
                                </div>
                                <span className="text-[10px] text-md-sys-secondary">F11</span>
                            </button>

                        </div>
                    </>
                 )}
               </div>
               
               {/* Help Menu Dropdown */}
               <div className="relative">
                  <button 
                      onClick={() => setActiveMenu(activeMenu === 'Help' ? null : 'Help')}
                      className={`px-3 py-1 rounded transition-colors cursor-default text-[12px] font-medium ${
                          activeMenu === 'Help' 
                          ? 'bg-md-sys-onSurface/10 text-md-sys-onSurface' 
                          : 'text-md-sys-secondary hover:bg-md-sys-onSurface/5 hover:text-md-sys-onSurface'
                      }`}
                  >
                      Help
                  </button>

                  {activeMenu === 'Help' && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute top-full left-0 mt-2 w-56 bg-md-sys-surface rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-md-sys-outline/10 border border-md-sys-outline/20">
                              <button 
                                  onClick={handleCheckForUpdates}
                                  disabled={checkingUpdate}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3 w-full"
                              >
                                  <span className={`material-symbols-rounded text-[18px] text-md-sys-primary ${checkingUpdate ? 'animate-spin' : ''}`}>
                                    {checkingUpdate ? 'sync' : 'update'}
                                  </span>
                                  {checkingUpdate ? 'Checking...' : 'Check for Updates'}
                              </button>
                              <button 
                                  onClick={() => { onOpenChangelog(); setActiveMenu(null); }}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                              >
                                  <span className="material-symbols-rounded text-[18px] text-md-sys-primary">history</span>
                                  Changelog
                              </button>
                              <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
                              <button 
                                  onClick={() => { onOpenAbout(); setActiveMenu(null); }}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                              >
                                  <span className="material-symbols-rounded text-[18px] text-md-sys-primary">info</span>
                                  About Resonote
                              </button>
                              <button 
                                  onClick={() => { onOpenFeedback(); setActiveMenu(null); }}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                              >
                                   <span className="material-symbols-rounded text-[18px] text-md-sys-primary">feedback</span>
                                   Give Feedback
                              </button>
                              <div className="h-px bg-md-sys-outline/10 my-1 mx-2"></div>
                              <button 
                                  onClick={() => { onOpenTerms(); setActiveMenu(null); }}
                                  className="text-left px-4 py-2.5 text-[13px] text-md-sys-onSurface hover:bg-md-sys-surfaceVariant transition-colors flex items-center gap-3"
                              >
                                   <span className="material-symbols-rounded text-[18px] text-md-sys-primary">gavel</span>
                                   Terms of Service
                              </button>
                          </div>
                      </>
                  )}
               </div>
          </div>
      </div>

      {/* Right Side Status & Traffic Lights */}
      <div className="flex items-center gap-4">
           {/* Zoom indicator (Optional) */}
           {viewSettings.zoomLevel !== 1 && (
             <div className="hidden md:flex items-center gap-1 bg-md-sys-surfaceVariant px-2 py-0.5 rounded text-[10px] text-md-sys-primary border border-md-sys-outline/20">
                <span className="material-symbols-rounded text-[12px]">search</span>
                {Math.round(viewSettings.zoomLevel * 100)}%
             </div>
           )}
           
           {/* Theme Toggle */}
           <button 
             onClick={onToggleTheme}
             className="w-8 h-8 rounded-full hover:bg-md-sys-surfaceVariant flex items-center justify-center transition-colors text-md-sys-secondary hover:text-md-sys-onSurface"
             title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
           >
             <span className="material-symbols-rounded text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
             </span>
           </button>

           {/* Settings Trigger */}
           <button 
             onClick={onOpenSettings}
             className="w-8 h-8 rounded-full hover:bg-md-sys-surfaceVariant flex items-center justify-center transition-colors text-md-sys-secondary hover:text-md-sys-onSurface"
             title="Settings"
           >
             <span className="material-symbols-rounded text-[18px]">settings</span>
           </button>

           {/* Traffic Lights */}
           <div className="flex gap-2 pl-2">
               <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer"></div>
               <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer"></div>
               <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer"></div>
           </div>
      </div>
    </div>
  );
};
