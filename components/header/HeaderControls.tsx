
import React, { memo } from 'react';
import { ViewSettings } from '../../App';

interface HeaderControlsProps {
  viewSettings: ViewSettings;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const HeaderControls = memo(({ viewSettings, theme, onToggleTheme, onOpenSettings }: HeaderControlsProps) => {
  return (
    <div className="flex items-center gap-4">
      {/* Zoom indicator */}
      {viewSettings.zoomLevel !== 1 && (
        <div className="hidden md:flex items-center gap-1 bg-md-sys-surfaceVariant px-2 py-0.5 rounded text-[10px] text-md-sys-primary border border-md-sys-outline/20 animate-in fade-in">
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

      {/* OS-style Traffic Lights (Decorative) */}
      <div className="flex gap-2 pl-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer transition-all"></div>
          <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer transition-all"></div>
          <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10 shadow-sm hover:brightness-110 cursor-pointer transition-all"></div>
      </div>
    </div>
  );
});
HeaderControls.displayName = 'HeaderControls';
