import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Workspace, WorkspaceMember, WorkspaceRole } from '../types';
import { useAuth } from '../AuthContext';

export const useWorkspace = () => {
    const { currentUser } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use refs to merge results from two listeners
    const ownerResultsRef = useRef<Workspace[]>([]);
    const memberResultsRef = useRef<Workspace[]>([]);
    const loadedCountRef = useRef(0);

    useEffect(() => {
        if (!currentUser) {
            setWorkspaces([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        loadedCountRef.current = 0;

        const workspacesRef = collection(db, 'workspaces');

        // Query 1: Workspaces owned by the user (always works, even for old docs without memberIds)
        const ownerQuery = query(workspacesRef, where('ownerId', '==', currentUser.uid));

        // Query 2: Workspaces where user is in the memberIds array (for shared/invited workspaces)
        const memberQuery = query(workspacesRef, where('memberIds', 'array-contains', currentUser.uid));

        const mergeAndSet = () => {
            // Merge results from both queries and deduplicate by id
            const allWorkspaces = [...ownerResultsRef.current, ...memberResultsRef.current];
            const uniqueMap = new Map<string, Workspace>();
            allWorkspaces.forEach(ws => uniqueMap.set(ws.id, ws));
            const merged = Array.from(uniqueMap.values());

            setWorkspaces(merged);
            setError(null);

            // Set loading to false as soon as ANY query has responded
            // (the persistent cache will provide instant results)
            if (loadedCountRef.current >= 1) {
                setLoading(false);
            }
        };

        // Auto-backfill: if a workspace is missing memberIds, add it
        const backfillMemberIds = async (ws: Workspace) => {
            if (!ws.memberIds || ws.memberIds.length === 0) {
                const ids = ws.members ? Object.keys(ws.members) : [currentUser.uid];
                try {
                    await updateDoc(doc(db, 'workspaces', ws.id), { memberIds: ids });
                } catch (e) {
                    console.warn('[Workspace] Failed to backfill memberIds for', ws.id, e);
                }
            }
        };

        const unsubOwner = onSnapshot(ownerQuery, (snapshot) => {
            const fetched = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Workspace[];
            ownerResultsRef.current = fetched;
            loadedCountRef.current = Math.min(loadedCountRef.current + 1, 2);

            // Backfill memberIds for any old workspace missing it
            fetched.forEach(ws => backfillMemberIds(ws));

            mergeAndSet();
        }, (err) => {
            console.error('[Workspace] Error in owner query:', err.code, err.message);
            loadedCountRef.current = Math.min(loadedCountRef.current + 1, 2);
            mergeAndSet();
        });

        const unsubMember = onSnapshot(memberQuery, (snapshot) => {
            const fetched = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Workspace[];
            memberResultsRef.current = fetched;
            loadedCountRef.current = Math.min(loadedCountRef.current + 1, 2);
            mergeAndSet();
        }, (err) => {
            console.error('[Workspace] Error in member query:', err.code, err.message);
            loadedCountRef.current = Math.min(loadedCountRef.current + 1, 2);
            mergeAndSet();
        });

        return () => {
            unsubOwner();
            unsubMember();
        };
    }, [currentUser]);

    const createWorkspace = async (name: string) => {
        if (!currentUser) throw new Error("Not authenticated");

        const newWorkspaceRef = doc(collection(db, 'workspaces'));

        const ownerMember: WorkspaceMember = {
            uid: currentUser.uid,
            role: WorkspaceRole.OWNER,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Unknown',
            photoURL: currentUser.photoURL || null
        };

        const newWorkspace: Partial<Workspace> = {
            name,
            ownerId: currentUser.uid,
            createdAt: new Date().toISOString(),
            members: {
                [currentUser.uid]: ownerMember
            },
            memberIds: [currentUser.uid]
        };

        await setDoc(newWorkspaceRef, newWorkspace);
        return newWorkspaceRef.id;
    };

    const updateWorkspaceName = async (workspaceId: string, newName: string) => {
        if (!currentUser) return;
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        await updateDoc(workspaceRef, { name: newName });
    };

    const leaveWorkspace = async (workspaceId: string) => {
        if (!currentUser) return;
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        const wsDoc = await getDoc(workspaceRef);
        if (wsDoc.exists()) {
            const data = wsDoc.data() as Workspace;
            if (data.ownerId === currentUser.uid) {
                throw new Error("Owner cannot leave the workspace. Transfer ownership or delete it instead.");
            }
            const members = { ...data.members };
            delete members[currentUser.uid];
            const memberIds = data.memberIds ? data.memberIds.filter(id => id !== currentUser.uid) : [];
            await updateDoc(workspaceRef, { members, memberIds });
        }
    }

    const deleteWorkspace = async (workspaceId: string) => {
        if (!currentUser) return;
        const workspaceRef = doc(db, 'workspaces', workspaceId);

        // In a production app, you would also want to delete all nested tasks and columns 
        // using a Cloud Function or batch deletion to avoid orphaned documents.
        await deleteDoc(workspaceRef);
    };

    return {
        workspaces,
        loading,
        error,
        createWorkspace,
        updateWorkspaceName,
        deleteWorkspace,
        leaveWorkspace
    };
};
