import { useState, useCallback, useEffect } from 'react';
import { UploadFileState } from '../types';

export const useFileHandler = () => {
  const [files, setFiles] = useState<UploadFileState[]>([]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const fileStates: UploadFileState[] = newFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      preview: URL.createObjectURL(f),
      status: 'idle'
    }));
    setFiles(prev => [...prev, ...fileStates]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleReorderFiles = useCallback((newOrder: UploadFileState[]) => {
    setFiles(newOrder);
  }, []);

  const resetFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Global Paste Listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Check if clipboard has items
      if (!e.clipboardData || !e.clipboardData.items) return;

      const items = Array.from(e.clipboardData.items);
      const validFiles: File[] = [];

      for (const item of items) {
        if (item.kind === 'file') {
          // Allow Images AND PDF
          if (item.type.startsWith('image/') || item.type === 'application/pdf') {
             const file = item.getAsFile();
             if (file) validFiles.push(file);
          }
        }
      }

      // If we found valid files, add them and prevent default paste (which might paste text if mixed)
      if (validFiles.length > 0) {
        e.preventDefault();
        handleFilesSelected(validFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleFilesSelected]);

  return {
    files,
    handleFilesSelected,
    handleRemoveFile,
    handleReorderFiles,
    resetFiles
  };
};