import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace } from './types';
import { useWorkspace } from './hooks/useWorkspace';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspaceId: (id: string | null) => void;
    loading: boolean;
    createWorkspace: (name: string) => Promise<string>;
    updateWorkspaceName: (id: string, name: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    leaveWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useActiveWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useActiveWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const {
        workspaces,
        loading: workspacesLoading,
        createWorkspace,
        updateWorkspaceName,
        deleteWorkspace,
        leaveWorkspace,
    } = useWorkspace();

    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

    // Auto-select first workspace if none selected, or clear if signed out
    useEffect(() => {
        if (!currentUser) {
            setActiveWorkspaceId(null);
            return;
        }

        if (workspaces.length > 0 && !activeWorkspaceId) {
            // Try resolving from local storage first to maintain session
            const saved = localStorage.getItem(`focusflow-active-workspace-${currentUser.uid}`);
            if (saved && workspaces.some(w => w.id === saved)) {
                setActiveWorkspaceId(saved);
            } else {
                setActiveWorkspaceId(workspaces[0].id);
            }
        } else if (workspaces.length > 0 && activeWorkspaceId) {
            // If active workspace was deleted, jump to first available
            if (!workspaces.some(w => w.id === activeWorkspaceId)) {
                setActiveWorkspaceId(workspaces[0].id);
            }
        }
    }, [workspaces, activeWorkspaceId, currentUser]);

    // Persist active workspace choice
    useEffect(() => {
        if (currentUser && activeWorkspaceId) {
            localStorage.setItem(`focusflow-active-workspace-${currentUser.uid}`, activeWorkspaceId);
        }
    }, [activeWorkspaceId, currentUser]);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                activeWorkspace,
                setActiveWorkspaceId,
                loading: workspacesLoading,
                createWorkspace,
                updateWorkspaceName,
                deleteWorkspace,
                leaveWorkspace,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
