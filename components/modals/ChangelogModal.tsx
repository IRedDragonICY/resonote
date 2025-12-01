
import React, { useEffect, useState } from 'react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Release {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('https://api.github.com/repos/IRedDragonICY/resonote/releases')
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch releases');
            return res.json();
        })
        .then(data => {
            setReleases(data);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setError("Could not load release notes from GitHub.");
            setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-md-sys-surface rounded-[28px] shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-md-sys-outline/20 max-h-[85vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-md-sys-outline/10 flex items-center gap-4 bg-md-sys-surface rounded-t-[28px]">
               <div className="w-10 h-10 rounded-full bg-md-sys-surfaceVariant/50 flex items-center justify-center text-md-sys-primary">
                  <span className="material-symbols-rounded text-2xl">history</span>
              </div>
              <div>
                  <h2 className="text-xl font-bold text-md-sys-onSurface">Changelog</h2>
                  <p className="text-sm text-md-sys-secondary">Latest updates from Resonote</p>
              </div>
          </div>

          {/* Content */}
          <div className="p-0 overflow-y-auto custom-scrollbar bg-md-sys-surface flex-1">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-md-sys-secondary">
                      <span className="material-symbols-rounded animate-spin text-3xl">sync</span>
                      <p className="text-sm">Fetching releases...</p>
                  </div>
              ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-md-sys-error">
                      <span className="material-symbols-rounded text-3xl">wifi_off</span>
                      <p className="text-sm">{error}</p>
                      <a 
                        href="https://github.com/IRedDragonICY/resonote/releases" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-md-sys-primary hover:underline"
                      >
                        View on GitHub
                      </a>
                  </div>
              ) : releases.length === 0 ? (
                  <div className="p-8 text-center text-md-sys-secondary">
                      <p>No releases found. This might be a development version.</p>
                  </div>
              ) : (
                  <div className="divide-y divide-md-sys-outline/10">
                      {releases.map((release) => (
                          <div key={release.id} className="p-6 hover:bg-md-sys-surfaceVariant/20 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-baseline gap-3">
                                      <h3 className="text-lg font-bold text-md-sys-onSurface">
                                          {release.name || release.tag_name}
                                      </h3>
                                      <span className="px-2 py-0.5 rounded-full bg-md-sys-primary/10 text-md-sys-primary text-[10px] font-mono font-bold border border-md-sys-primary/20">
                                          {release.tag_name}
                                      </span>
                                  </div>
                                  <span className="text-xs text-md-sys-secondary font-mono">
                                      {new Date(release.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                              </div>
                              <div className="text-sm text-md-sys-secondary leading-relaxed whitespace-pre-wrap font-mono text-[13px] opacity-90">
                                  {release.body}
                              </div>
                              <div className="mt-4">
                                  <a 
                                    href={release.html_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1 text-xs text-md-sys-primary hover:text-md-sys-onSurface transition-colors"
                                  >
                                    View full release
                                    <span className="material-symbols-rounded text-[14px]">open_in_new</span>
                                  </a>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-md-sys-outline/10 bg-md-sys-surface rounded-b-[28px] flex justify-between items-center">
              <p className="text-[10px] text-md-sys-secondary">
                  Data retrieved from GitHub API
              </p>
              <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-md-sys-surfaceVariant text-md-sys-onSurface rounded-full text-xs font-medium hover:bg-md-sys-surfaceVariant/80 transition-colors border border-md-sys-outline/10"
              >
                  Close
              </button>
          </div>
      </div>
    </div>
  );
};
