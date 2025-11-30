import React, { useState } from 'react';

interface TabBarProps {
  tabs: { id: string; title: string }[];
  activeTabId: string | 'home';
  onTabClick: (id: string | 'home') => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onTabsReorder: (newOrder: string[]) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose,
  onNewTab,
  onTabsReorder
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: Make the drag image transparent or custom if needed
    // e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetId) return;

    const currentOrder = tabs.map(t => t.id);
    const oldIndex = currentOrder.indexOf(draggedTabId);
    const newIndex = currentOrder.indexOf(targetId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, draggedTabId);

    onTabsReorder(newOrder);
    setDraggedTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };

  return (
    <div className="fixed top-10 left-0 right-0 z-40 flex items-end w-full h-10 bg-[#1e1e1e] border-b border-black select-none pt-1 shadow-sm transition-all">
      {/* Home Button (Not draggable) */}
      <button
        onClick={() => onTabClick('home')}
        className={`
          flex items-center justify-center w-12 h-full rounded-t-lg mx-1 transition-colors relative
          ${activeTabId === 'home' 
            ? 'bg-md-sys-background text-md-sys-primary' 
            : 'text-md-sys-secondary hover:bg-white/5 hover:text-white'
          }
        `}
        title="Home / Recent"
      >
        <span className={`material-symbols-rounded text-[20px] ${activeTabId === 'home' ? 'font-variation-filled' : ''}`}>
          home
        </span>
        {activeTabId === 'home' && (
             <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-md-sys-primary z-10" />
        )}
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 mb-2"></div>

      {/* Scrollable Tab Area */}
      <div className="flex-1 flex overflow-x-auto custom-scrollbar-hide h-full items-end">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            onClick={() => onTabClick(tab.id)}
            className={`
              group relative flex items-center min-w-[120px] max-w-[200px] h-[34px] px-3 mr-1 rounded-t-lg cursor-pointer border-t border-x border-transparent transition-all
              ${activeTabId === tab.id 
                ? 'bg-md-sys-background text-md-sys-onPrimary border-black/20' 
                : 'bg-[#2a2a2a] text-md-sys-secondary hover:bg-[#333]'
              }
              ${draggedTabId === tab.id ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <span className="text-[12px] truncate flex-1 mr-2 font-medium">
              {tab.title || "Untitled Project"}
            </span>
            
            <button
              onClick={(e) => onTabClose(tab.id, e)}
              className={`
                p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10
                ${activeTabId === tab.id ? 'text-md-sys-primary' : 'text-gray-400'}
              `}
            >
              <span className="material-symbols-rounded text-[14px] block">close</span>
            </button>

            {/* Active Indicator Line */}
            {activeTabId === tab.id && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-md-sys-primary" />
            )}
            {/* Mask bottom border to blend with content */}
             {activeTabId === tab.id && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-md-sys-background z-10" />
            )}
          </div>
        ))}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-md-sys-secondary hover:text-white transition-colors ml-1 mb-0.5 flex-shrink-0"
          title="New Tab"
        >
          <span className="material-symbols-rounded text-[20px]">add</span>
        </button>
      </div>
    </div>
  );
};