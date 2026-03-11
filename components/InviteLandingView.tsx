import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { WorkspaceRole } from '../types';
import LandingPage from './LandingPage';

interface InviteLandingViewProps {
    inviteId: string;
    onComplete: () => void;
}

const InviteLandingView: React.FC<InviteLandingViewProps> = ({ inviteId, onComplete }) => {
    const { currentUser, signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState<any>(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const inviteRef = doc(db, 'inviteLinks', inviteId);
                const docSnap = await getDoc(inviteRef);
                if (docSnap.exists()) {
                    setInviteData(docSnap.data());
                } else {
                    setError('This invite link is invalid or has expired.');
                }
            } catch (err) {
                console.error("Failed to fetch invite", err);
                setError('Could not establish a connection to verify this invite.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, [inviteId]);

    const handleJoin = async () => {
        if (!currentUser || !inviteData) return;
        setJoining(true);
        try {
            const workspaceRef = doc(db, 'workspaces', inviteData.workspaceId);
            const wsDoc = await getDoc(workspaceRef);
            if (wsDoc.exists()) {
                const data = wsDoc.data();
                const members = data.members || {};
                const memberIds = data.memberIds || [];

                if (!memberIds.includes(currentUser.uid)) {
                    members[currentUser.uid] = {
                        uid: currentUser.uid,
                        role: WorkspaceRole.MEMBER,
                        email: currentUser.email,
                        displayName: currentUser.displayName || 'User',
                        photoURL: currentUser.photoURL || null
                    };
                    memberIds.push(currentUser.uid);
                    await updateDoc(workspaceRef, { members, memberIds });
                }
                // Strip the /invite/XYZ from URL and go back to dashboard
                window.history.replaceState({}, '', '/');
                onComplete();
            } else {
                setError('The workspace for this invite no longer exists.');
            }
        } catch (err) {
            console.error("Failed to join workspace", err);
            setError('Failed to join the workspace. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined !text-3xl">error</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Invalid Invite</h2>
                    <p className="text-sm text-slate-500 font-bold mb-6">{error}</p>
                    <button onClick={() => { window.history.replaceState({}, '', '/'); onComplete(); }} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 uppercase tracking-widest text-xs">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="relative">
                <LandingPage onLogin={signInWithGoogle} darkMode={false} onToggleDarkMode={() => { }} />
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-primary/20 flex items-center gap-3 animate-in slide-in-from-top-4">
                    <span className="material-symbols-outlined text-primary">group_add</span>
                    <p className="text-sm font-black text-slate-800">Please log in or sign up to join <span className="text-primary">{inviteData.workspaceName}</span></p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 pt-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-6 shadow-inner">
                    <span className="text-3xl font-black">{inviteData.workspaceName?.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">You're Invited!</h2>
                <p className="text-slate-500 font-bold mb-8">
                    You have been invited to join the <span className="text-slate-800 dark:text-white">"{inviteData.workspaceName}"</span> workspace.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                    >
                        {joining ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Accept & Join Workspace'}
                    </button>
                    <button
                        onClick={() => { window.history.replaceState({}, '', '/'); onComplete(); }}
                        disabled={joining}
                        className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteLandingView;
