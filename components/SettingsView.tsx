
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { AVAILABLE_MODELS } from '../constants/models';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

type SettingsTab = 'general' | 'models';

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSaveSettings 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showKey, setShowKey] = useState(false);

  // Helper to update settings immediately (VS Code style auto-save behavior)
  const updateSetting = (updates: Partial<UserSettings>) => {
    onSaveSettings({ ...settings, ...updates });
  };

  const toggleModel = (modelId: string) => {
    const isEnabled = settings.enabledModels.includes(modelId);
    let newModels;
    if (isEnabled) {
        newModels = settings.enabledModels.filter(id => id !== modelId);
    } else {
        newModels = [...settings.enabledModels, modelId];
    }
    updateSetting({ enabledModels: newModels });
  };

  return (
    <div className="flex h-full w-full bg-[#121212] text-gray-300 font-sans">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-[#181818] flex flex-col pt-4 shrink-0">
            <div className="px-5 mb-4">
                 <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Preferences</h2>
            </div>
            <nav className="flex-1 px-2 space-y-0.5">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-rounded text-[18px]">tune</span>
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('models')}
                    className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 ${activeTab === 'models' ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-rounded text-[18px]">smart_toy</span>
                    Models
                </button>
            </nav>
            <div className="p-4 text-[10px] text-gray-600 border-t border-white/5">
                Resonote Settings
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center px-8 bg-[#1e1e1e] shrink-0">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>User</span>
                    <span className="material-symbols-rounded text-[14px]">chevron_right</span>
                    <span className="text-white capitalize">{activeTab}</span>
                </div>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl custom-scrollbar">
                 {activeTab === 'general' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section>
                            <h3 className="text-lg font-medium text-white mb-1">API Configuration</h3>
                            <p className="text-sm text-gray-500 mb-4">Manage your connection to Google AI Studio.</p>
                            
                            <div className="bg-[#252525] border border-white/5 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type={showKey ? "text" : "password"}
                                            value={settings.apiKey}
                                            onChange={(e) => updateSetting({ apiKey: e.target.value })}
                                            className="w-full bg-[#181818] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-md-sys-primary focus:ring-1 focus:ring-md-sys-primary transition-colors placeholder:text-gray-600 font-mono"
                                            placeholder="AIzaSy..."
                                        />
                                        <button 
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                        >
                                            <span className="material-symbols-rounded text-[18px]">{showKey ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-start gap-2 p-2 bg-[#1E1E1E] rounded border border-white/5 text-xs text-gray-400">
                                    <span className="material-symbols-rounded text-[16px] text-md-sys-primary mt-0.5">info</span>
                                    <p>Your key is stored locally in your browser's Local Storage. Leaving this blank will use the shared deployment key (which has stricter rate limits).</p>
                                </div>
                            </div>
                        </section>
                     </div>
                 )}

                 {activeTab === 'models' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section>
                            <h3 className="text-lg font-medium text-white mb-1">Model Visibility</h3>
                            <p className="text-sm text-gray-500 mb-4">Configure which AI models are available in the composer dropdown.</p>

                            <div className="space-y-1">
                                {AVAILABLE_MODELS.map(model => {
                                    const isEnabled = settings.enabledModels.includes(model.id);
                                    return (
                                        <div key={model.id} className="flex items-center justify-between p-4 bg-[#252525] border border-transparent hover:border-white/5 first:rounded-t-lg last:rounded-b-lg border-b-white/5 group transition-colors">
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{model.name}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{model.id}</div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => toggleModel(model.id)}
                                                className={`
                                                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                    ${isEnabled ? 'bg-md-sys-primary' : 'bg-[#404040]'}
                                                `}
                                            >
                                                <span 
                                                    className={`
                                                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                        ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};
