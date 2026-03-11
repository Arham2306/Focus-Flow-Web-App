import React, { useState, useRef, useEffect } from 'react';
import { useActiveWorkspace } from '../WorkspaceContext';
import WorkspaceSettingsModal from './WorkspaceSettingsModal'; // We will create this next
import DialogModal, { DialogModalConfig } from './DialogModal';

const WorkspaceSwitcher: React.FC = () => {
    const { workspaces, activeWorkspace, setActiveWorkspaceId, createWorkspace } = useActiveWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<DialogModalConfig>({ isOpen: false, title: '', message: '' });
    const openDialog = (config: Omit<DialogModalConfig, 'isOpen'>) => setDialogConfig({ ...config, isOpen: true });
    const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreate = async () => {
        if (!newWorkspaceName.trim()) return;
        setIsCreating(true);
        try {
            const newId = await createWorkspace(newWorkspaceName.trim());
            setActiveWorkspaceId(newId);
            setShowCreateModal(false);
            setNewWorkspaceName('');
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create workspace', error);
            openDialog({ title: 'Error', message: 'Failed to create workspace. Please try again.', type: 'danger' });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <span className="hidden sm:inline-block text-sm font-bold text-slate-800 dark:text-white max-w-[120px] truncate">
                        {activeWorkspace?.name || 'Select Workspace'}
                    </span>
                    <span className="hidden sm:inline-block material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 zoom-in-95 duration-200">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Workspaces</p>
                            {workspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => {
                                        setActiveWorkspaceId(ws.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left flex items-center justify-between px-2 py-2 rounded-lg text-sm font-bold transition-colors ${activeWorkspace?.id === ws.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="truncate pr-4">{ws.name}</span>
                                    {activeWorkspace?.id === ws.id && (
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 flex flex-col gap-1">
                            <button
                                onClick={() => {
                                    setShowSettingsModal(true);
                                    setIsOpen(false);
                                }}
                                disabled={!activeWorkspace}
                                className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                Workspace Settings
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(true);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Create Workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Workspace Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Create New Workspace</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a dedicated space for specific projects, teams, or personal tasks.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Workspace Name</label>
                                    <input
                                        type="text"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        placeholder="e.g., Marketing Team"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newWorkspaceName.trim() || isCreating}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isCreating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Create'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal Hookup */}
            {showSettingsModal && activeWorkspace && (
                <WorkspaceSettingsModal
                    workspace={activeWorkspace}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            <DialogModal {...dialogConfig} onClose={closeDialog} />
        </>
    );
};

export default WorkspaceSwitcher;
