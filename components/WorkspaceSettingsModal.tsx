import React, { useState, useEffect } from 'react';
import { Workspace, WorkspaceInvite } from '../types';
import { useActiveWorkspace } from '../WorkspaceContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { WorkspaceRole } from '../types';
import DialogModal, { DialogModalConfig } from './DialogModal';

interface WorkspaceSettingsModalProps {
    workspace: Workspace;
    onClose: () => void;
}

const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ workspace, onClose }) => {
    const { updateWorkspaceName, leaveWorkspace, deleteWorkspace, removeMember } = useActiveWorkspace();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
    const [editName, setEditName] = useState(workspace.name);
    const [isSaving, setIsSaving] = useState(false);

    // Invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [inviteMessage, setInviteMessage] = useState('');
    const [pendingInvites, setPendingInvites] = useState<WorkspaceInvite[]>([]);

    // Shareable link states
    const [inviteLink, setInviteLink] = useState('');
    const [generatingLink, setGeneratingLink] = useState(false);

    // Dialog state
    const [dialogConfig, setDialogConfig] = useState<DialogModalConfig>({ isOpen: false, title: '', message: '' });
    const openDialog = (config: Omit<DialogModalConfig, 'isOpen'>) => setDialogConfig({ ...config, isOpen: true });
    const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

    const currentUserRole = workspace.members[currentUser?.uid || '']?.role || WorkspaceRole.MEMBER;
    const canManageWorkspace = currentUserRole === WorkspaceRole.OWNER || currentUserRole === WorkspaceRole.ADMIN;
    const isOwner = currentUser?.uid === workspace.ownerId;

    useEffect(() => {
        // Fetch pending invites for this workspace
        const fetchInvites = async () => {
            if (!canManageWorkspace) return;
            try {
                const invitesRef = collection(db, 'invites');
                const q = query(invitesRef, where('workspaceId', '==', workspace.id), where('status', '==', 'pending'));
                const snapshot = await getDocs(q);
                const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkspaceInvite));
                setPendingInvites(invitesData);
            } catch (err) {
                console.error("Failed to fetch pending invites", err);
            }
        };
        fetchInvites();
    }, [workspace.id, isOwner]);

    const handleSaveName = async () => {
        if (!editName.trim() || editName === workspace.name) return;
        setIsSaving(true);
        try {
            await updateWorkspaceName(workspace.id, editName.trim());
            // We don't close, just show success implicitly or toast
        } catch (error) {
            console.error('Failed to rename workspace', error);
            openDialog({ title: 'Error', message: 'Failed to rename workspace.', type: 'danger' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeaveOrDelete = async () => {
        const action = isOwner ? 'delete' : 'leave';
        const confirmMessage = isOwner
            ? `Are you sure you want to permanently delete "${workspace.name}"? This cannot be undone.`
            : `Are you sure you want to leave "${workspace.name}"?`;

        openDialog({
            title: isOwner ? 'Delete Workspace' : 'Leave Workspace',
            message: confirmMessage,
            type: 'danger',
            confirmText: isOwner ? 'Delete' : 'Leave',
            hideCancel: false,
            onConfirm: async () => {
                try {
                    if (isOwner) {
                        await deleteWorkspace(workspace.id);
                    } else {
                        await leaveWorkspace(workspace.id);
                    }
                    onClose();
                } catch (error) {
                    console.error(`Failed to ${action} workspace`, error);
                    openDialog({ title: 'Error', message: `Failed to ${action} workspace.`, type: 'danger' });
                }
            }
        });
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !currentUser) return;

        // Prevent self-invite
        if (inviteEmail.toLowerCase() === currentUser.email?.toLowerCase()) {
            setInviteStatus('error');
            setInviteMessage('You cannot invite yourself.');
            return;
        }

        // Check if already a member
        const alreadyMember = Object.values(workspace.members).some(m => m.email.toLowerCase() === inviteEmail.toLowerCase());
        if (alreadyMember) {
            setInviteStatus('error');
            setInviteMessage('User is already a member of this workspace.');
            return;
        }

        // Check if already invited
        if (pendingInvites.some(inv => inv.inviteeEmail.toLowerCase() === inviteEmail.toLowerCase())) {
            setInviteStatus('error');
            setInviteMessage('An invitation is already pending for this email.');
            return;
        }

        setInviteStatus('loading');
        setInviteMessage('');

        try {
            // 1. Validation: Check if user exists on Focus Flow
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', inviteEmail.toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setInviteStatus('error');
                setInviteMessage('User account does not exist on Focus Flow.');
                return;
            }

            // User exists, create invite document
            const newInvite = {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                inviterName: currentUser.displayName || currentUser.email || 'A user',
                inviterId: currentUser.uid,
                inviteeEmail: inviteEmail.toLowerCase(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'invites'), newInvite);

            setPendingInvites(prev => [...prev, { id: docRef.id, ...newInvite } as WorkspaceInvite]);
            setInviteStatus('success');
            setInviteMessage(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');

        } catch (error) {
            console.error('Error sending invite:', error);
            setInviteStatus('error');
            setInviteMessage('Failed to send invite. Please try again.');
        }
    };

    const cancelInvite = async (inviteId: string) => {
        try {
            await deleteDoc(doc(db, 'invites', inviteId));
            setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
        } catch (err) {
            openDialog({ title: 'Error', message: 'Failed to cancel invite.', type: 'danger' });
        }
    };

    const handleGenerateLink = async () => {
        if (!currentUser) return;
        setGeneratingLink(true);
        try {
            const inviteLinksRef = collection(db, 'inviteLinks');
            const docRef = await addDoc(inviteLinksRef, {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                active: true
            });
            const link = `${window.location.origin}/invite/${docRef.id}`;
            setInviteLink(link);
        } catch (error) {
            console.error(error);
            openDialog({ title: 'Error', message: 'Failed to generate link.', type: 'danger' });
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleRemoveMember = async (memberUid: string, memberName: string) => {
        openDialog({
            title: 'Remove Member',
            message: `Are you sure you want to remove ${memberName} from the workspace?`,
            type: 'danger',
            confirmText: 'Remove',
            hideCancel: false,
            onConfirm: async () => {
                try {
                    await removeMember(workspace.id, memberUid);
                } catch (error) {
                    console.error("Failed to remove member", error);
                    openDialog({ title: 'Error', message: "Failed to remove member. " + (error as Error).message, type: 'danger' });
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                            {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Workspace Settings</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{workspace.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex gap-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-4 text-sm font-black uppercase tracking-wider relative transition-colors ${activeTab === 'general' ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        General
                        {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`py-4 text-sm font-black uppercase tracking-wider relative transition-colors ${activeTab === 'members' ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Members
                        {activeTab === 'members' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'general' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* Rename */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Workspace Name</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Change the display name of this workspace.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        disabled={!canManageWorkspace}
                                        className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white disabled:opacity-50"
                                    />
                                    {canManageWorkspace && (
                                        <button
                                            onClick={handleSaveName}
                                            disabled={isSaving || editName === workspace.name || !editName.trim()}
                                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
                                        >
                                            {isSaving ? 'Saving...' : 'Rename'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                                <h3 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Danger Zone</h3>
                                <p className="text-xs text-red-500/80 dark:text-red-400/80 mb-4">
                                    {isOwner
                                        ? 'Permanently delete this workspace and all its data. This action cannot be undone.'
                                        : 'Leave this workspace. You will lose access to all tasks inside.'}
                                </p>
                                <button
                                    onClick={handleLeaveOrDelete}
                                    className="px-6 py-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                >
                                    {isOwner ? 'Delete Workspace' : 'Leave Workspace'}
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* Invite Section */}
                            {canManageWorkspace && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Invite Members</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Invite others to collaborate in this workspace.</p>

                                    <form onSubmit={handleInvite} className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[18px]">mail</span>
                                                <input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => {
                                                        setInviteEmail(e.target.value);
                                                        setInviteStatus('idle');
                                                        setInviteMessage('');
                                                    }}
                                                    placeholder="Email address"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={inviteStatus === 'loading' || !inviteEmail.trim()}
                                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[100px]"
                                            >
                                                {inviteStatus === 'loading' ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : 'Send Invite'}
                                            </button>
                                        </div>

                                        {inviteMessage && (
                                            <p className={`text-xs font-bold px-1 ${inviteStatus === 'error' ? 'text-red-500' : 'text-green-500'
                                                }`}>
                                                {inviteMessage}
                                            </p>
                                        )}
                                    </form>

                                    {/* Shareable Link Section */}
                                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Shareable Invite Link</h4>
                                        <p className="text-[10px] text-slate-500 mb-3">Generate a link that anyone can use to join this workspace instantly.</p>

                                        {!inviteLink ? (
                                            <button
                                                type="button"
                                                onClick={handleGenerateLink}
                                                disabled={generatingLink}
                                                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined !text-[18px]">link</span>
                                                {generatingLink ? 'Generating...' : 'Generate New Link'}
                                            </button>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-center gap-2 p-1 pl-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={inviteLink}
                                                    className="flex-1 bg-transparent text-xs font-bold text-primary outline-none truncate"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { navigator.clipboard.writeText(inviteLink); openDialog({ title: 'Success', message: 'Link copied to clipboard!', type: 'success' }); }}
                                                    className="px-4 py-2 sm:py-1.5 bg-primary text-white text-[10px] sm:text-[10px] w-full sm:w-auto font-black uppercase tracking-widest rounded-lg hover:bg-primary-dark transition-colors shrink-0"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pending Invites List */}
                                    {pendingInvites.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Pending Invitations</h4>
                                            <div className="space-y-2">
                                                {pendingInvites.map(inv => (
                                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                <span className="material-symbols-outlined !text-[16px] text-slate-400">schedule</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.inviteeEmail}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelInvite(inv.id)}
                                                            className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Members List */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 px-1">Active Members ({Object.keys(workspace.members).length})</h3>
                                <div className="space-y-3">
                                    {Object.values(workspace.members).map((member) => (
                                        <div key={member.uid} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                {member.photoURL ? (
                                                    <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                                        <span className="text-primary font-black">{member.displayName.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                        {member.displayName}
                                                        {member.uid === currentUser?.uid && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">You</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${member.role === 'owner'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                                {canManageWorkspace && member.uid !== currentUser?.uid && member.role !== 'owner' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(member.uid, member.displayName)}
                                                        className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </div>

            <DialogModal {...dialogConfig} onClose={closeDialog} />
        </div>
    );
};

export default WorkspaceSettingsModal;
