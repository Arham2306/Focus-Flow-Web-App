import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Task, ColumnData } from '../types';
import { useActiveWorkspace } from '../WorkspaceContext';

// Helper to remove undefined values since Firestore doesn't support them
const removeUndefined = (obj: any) => {
    return Object.keys(obj).reduce((acc: any, key) => {
        if (obj[key] !== undefined) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};

export const useWorkspaceData = () => {
    const { activeWorkspace } = useActiveWorkspace();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<ColumnData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeWorkspace) {
            setTasks([]);
            setColumns([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const tasksRef = collection(db, 'workspaces', activeWorkspace.id, 'tasks');
        const columnsRef = collection(db, 'workspaces', activeWorkspace.id, 'columns');

        const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Task[];
            setTasks(fetchedTasks);
        });

        const unsubscribeColumns = onSnapshot(columnsRef, (snapshot) => {
            const fetchedColumns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ColumnData[];

            // Provide defaults if empty
            if (fetchedColumns.length === 0) {
                // We don't automatically create default docs here to avoid infinite loops or permission issues, 
                // usually defaults are created upon workspace creation. For now, we seed state if empty.
                setColumns([
                    { id: 'TODAY', title: 'Today', colorClass: 'bg-primary', sortBy: 'CREATION' as any },
                    { id: 'UPCOMING', title: 'Upcoming', colorClass: 'bg-accent', sortBy: 'CREATION' as any },
                    { id: 'COMPLETED', title: 'Completed', colorClass: 'bg-green-400', sortBy: 'CREATION' as any }
                ]);
            } else {
                setColumns(fetchedColumns);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeColumns();
        };
    }, [activeWorkspace]);

    const addTask = async (task: Task) => {
        if (!activeWorkspace) return;
        const taskRef = doc(collection(db, 'workspaces', activeWorkspace.id, 'tasks'), task.id);
        await setDoc(taskRef, removeUndefined(task));
    };

    const updateTask = async (task: Task) => {
        if (!activeWorkspace) return;
        const taskRef = doc(db, 'workspaces', activeWorkspace.id, 'tasks', task.id);
        await updateDoc(taskRef, removeUndefined(task));
    };

    const deleteTask = async (taskId: string) => {
        if (!activeWorkspace) return;
        const taskRef = doc(db, 'workspaces', activeWorkspace.id, 'tasks', taskId);
        await deleteDoc(taskRef);
    };

    const addColumn = async (column: ColumnData) => {
        if (!activeWorkspace) return;
        const colRef = doc(collection(db, 'workspaces', activeWorkspace.id, 'columns'), column.id);
        await setDoc(colRef, removeUndefined(column));
    };

    const updateColumn = async (column: ColumnData) => {
        if (!activeWorkspace) return;
        const colRef = doc(db, 'workspaces', activeWorkspace.id, 'columns', column.id);
        await updateDoc(colRef, removeUndefined(column));
    };

    const deleteColumn = async (columnId: string) => {
        if (!activeWorkspace) return;
        const colRef = doc(db, 'workspaces', activeWorkspace.id, 'columns', columnId);
        await deleteDoc(colRef);
    };

    return {
        tasks,
        columns,
        loading,
        addTask,
        updateTask,
        deleteTask,
        addColumn,
        updateColumn,
        deleteColumn
    };
};
