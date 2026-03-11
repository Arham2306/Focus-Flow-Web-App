import React from 'react';

export interface DialogModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'danger' | 'success';
    confirmText?: string;
    onConfirm?: () => void;
    hideCancel?: boolean;
}

interface DialogModalProps extends DialogModalConfig {
    onClose: () => void;
}

const DialogModal: React.FC<DialogModalProps> = ({
    isOpen, onClose, title, message, type = 'info', confirmText = 'OK', onConfirm, hideCancel = true
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        {type === 'danger' && <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>}
                        {type === 'success' && <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>}
                        {type === 'info' && <span className="material-symbols-outlined text-blue-500 text-2xl">info</span>}
                        <h3 className={`text-lg font-black ${type === 'danger' ? 'text-red-500' : type === 'success' ? 'text-green-500' : 'text-slate-800 dark:text-white'}`}>
                            {title}
                        </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold leading-relaxed">{message}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl">
                    {!hideCancel && (
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Cancel
                        </button>
                    )}
                    <button onClick={handleConfirm} className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary hover:bg-primary-dark shadow-primary/20'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DialogModal;
