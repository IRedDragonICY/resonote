
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-md-sys-surface rounded-[28px] p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-md-sys-outline/20">
        <h3 className="text-xl font-bold text-md-sys-onSurface mb-2">{title}</h3>
        <p className="text-sm text-md-sys-secondary mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-md-sys-secondary hover:bg-md-sys-surfaceVariant transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              isDestructive
                ? 'bg-md-sys-error text-white hover:opacity-90'
                : 'bg-md-sys-primary text-md-sys-onPrimary hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
