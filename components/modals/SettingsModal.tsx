import React, { useState } from 'react';
import { UserSettings } from '../../types';
import { AVAILABLE_MODELS } from '../../constants/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

type SettingsTab = 'general' | 'models';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showKey, setShowKey] = useState(false);

  // Sync with props when opened
  React.useEffect(() => {
    if (isOpen) {
        setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const toggleModel = (modelId: string) => {
    setLocalSettings(prev => {
        const isEnabled = prev.enabledModels.includes(modelId);
        let newModels;
        if (isEnabled) {
            newModels = prev.enabledModels.filter(id => id !== modelId);
        } else {
            newModels = [...prev.enabledModels, modelId];
        }
        return { ...prev, enabledModels: newModels };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121212] w-[800px] h-[550px] rounded-xl shadow-2xl flex overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-[200px] bg-[#181818] border-r border-white/5 flex flex-col pt-6 pb-4">
            <div className="px-4 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Settings</h2>
            </div>
            
            <nav className="flex-1 flex flex-col gap-0.5 px-2">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                        activeTab === 'general' ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-[18px]">settings</span>
                        General
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('models')}
                    className={`text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                        activeTab === 'models' ? 'bg-[#2A2A2A] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-[18px]">model_training</span>
                        Models
                    </div>
                </button>
            </nav>

            <div className="px-4 mt-auto">
                <p className="text-[10px] text-gray-600">Resonote v2.1.0</p>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#121212]">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-[#121212]">
                <h3 className="text-lg font-medium text-white capitalize">{activeTab}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <span className="material-symbols-rounded text-xl">close</span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Google AI Studio API Key</label>
                            <p className="text-xs text-gray-500 mb-2">
                                Leave blank to use the default key provided by the deployment environment. 
                                Providing your own key allows for higher rate limits.
                            </p>
                            <div className="relative">
                                <input 
                                    type={showKey ? "text" : "password"}
                                    value={localSettings.apiKey}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-md-sys-primary focus:ring-1 focus:ring-md-sys-primary transition-all placeholder:text-gray-600"
                                />
                                <button 
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <span className="material-symbols-rounded text-lg">{showKey ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Additional General Settings could go here */}
                    </div>
                )}

                {activeTab === 'models' && (
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 mb-4">
                            Select which models appear in the dropdown menu. You can disable older models to keep your workspace clean.
                        </p>
                        
                        <div className="space-y-1">
                            {AVAILABLE_MODELS.map(model => {
                                const isEnabled = localSettings.enabledModels.includes(model.id);
                                return (
                                    <div 
                                        key={model.id} 
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1C1C1C] transition-colors border border-transparent hover:border-white/5 group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-200">{model.name}</span>
                                            <span className="text-[11px] font-mono text-gray-500">{model.id}</span>
                                        </div>
                                        
                                        {/* Cursor-style Toggle Switch */}
                                        <button 
                                            onClick={() => toggleModel(model.id)}
                                            className={`
                                                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                ${isEnabled ? 'bg-md-sys-primary' : 'bg-[#333]'}
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
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 bg-[#181818] flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-md-sys-primary text-black rounded-md text-xs font-bold hover:brightness-110 transition-all"
                >
                    Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};