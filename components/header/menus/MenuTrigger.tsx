
import React from 'react';

interface MenuTriggerProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export const MenuTrigger: React.FC<MenuTriggerProps> = ({ label, isActive, onClick, onMouseEnter }) => (
  <button 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`relative z-50 px-3 py-1 rounded transition-colors cursor-default text-[12px] font-medium ${
          isActive 
          ? 'bg-md-sys-onSurface/10 text-md-sys-onSurface' 
          : 'text-md-sys-secondary hover:bg-md-sys-onSurface/5 hover:text-md-sys-onSurface'
      }`}
  >
      {label}
  </button>
);
