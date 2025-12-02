
import React, { memo } from 'react';

export const HeaderLogo = memo(() => (
  <div className="flex items-center gap-3 mr-2 select-none">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6">
      <rect width="32" height="32" rx="10" className="fill-md-sys-primary"/>
      <path d="M20 10V6h-7v12.5c0 1.93-1.57 3.5-3.5 3.5S6 20.43 6 18.5 7.57 15 9.5 15c.47 0 .91.1 1.32.26V10h9z" className="fill-md-sys-onPrimary" transform="translate(2, 2)"/>
      <path d="M26 4l-1.5 3L21.5 8.5 24.5 10 26 13l1.5-3 3-1.5-3-1.5z" className="fill-md-sys-onPrimary"/>
    </svg>
    <span className="text-sm font-bold tracking-tight text-md-sys-onSurface">Resonote</span>
  </div>
));
HeaderLogo.displayName = 'HeaderLogo';
