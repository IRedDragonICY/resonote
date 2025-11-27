import React, { useCallback } from 'react';
import { UploadFileState } from '../types';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  currentFiles: UploadFileState[];
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, onFileRemove, currentFiles }) => {
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      onFilesSelected(filesArray);
    }
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      onFilesSelected(filesArray);
    }
  };

  return (
    <div className="w-full">
      {currentFiles.length === 0 ? (
        <label 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-md-sys-outline rounded-3xl cursor-pointer bg-md-sys-surface hover:bg-md-sys-surfaceVariant/50 transition-colors duration-300 group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 rounded-full bg-md-sys-surfaceVariant mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="material-symbols-rounded text-4xl text-md-sys-primary">add_a_photo</span>
            </div>
            <p className="mb-2 text-sm text-md-sys-secondary">
              <span className="font-semibold text-md-sys-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-md-sys-outline">SVG, PNG, JPG or GIF</p>
          </div>
          <input type="file" className="hidden" multiple accept="image/*" onChange={handleChange} />
        </label>
      ) : (
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {currentFiles.map((fileState) => (
            <div key={fileState.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-md-sys-outline bg-md-sys-surface">
              <img src={fileState.preview} alt="preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity select-none" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 pointer-events-none">
                <p className="text-xs text-white truncate w-full">{fileState.file.name}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove(fileState.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-md-sys-error text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10 hover:scale-105 active:scale-95"
                title="Remove file"
              >
                <span className="material-symbols-rounded text-[16px] block">close</span>
              </button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-md-sys-outline rounded-2xl cursor-pointer hover:bg-md-sys-surfaceVariant/50 transition-colors">
             <span className="material-symbols-rounded text-2xl text-md-sys-secondary">add</span>
             <input type="file" className="hidden" multiple accept="image/*" onChange={handleChange} />
          </label>
        </div>
      )}
    </div>
  );
};