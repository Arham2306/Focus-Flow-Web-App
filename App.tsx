import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import AddTaskBar from './components/AddTaskBar';
import TaskModal from './components/TaskModal';
import PomodoroTimer from './components/PomodoroTimer';
import AdventureView from './components/AdventureView';
import LandingPage from './components/LandingPage';
import { INITIAL_TASKS, NAV_ITEMS } from './constants';
import { Task, ColumnId, TaskStatus, ColumnData, SortOption, TaskPriority } from './types';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('focusflow-auth') === 'true';
    }
    return false;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('focusflow-tasks');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse tasks from storage", e);
            }
        }
    }
    return INITIAL_TASKS;
  });

  const [columns, setColumns] = useState<ColumnData[]>([
    { id: ColumnId.TODAY, title: 'Today', colorClass: 'bg-primary', sortBy: SortOption.CREATION },
    { id: ColumnId.UPCOMING, title: 'Upcoming', colorClass: 'bg-accent', sortBy: SortOption.CREATION },
    { id: ColumnId.COMPLETED, title: 'Completed', colorClass: 'bg-green-400', sortBy: SortOption.CREATION }
  ]);

  const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('focusflow-theme') === 'dark' || 
                 (!localStorage.getItem('focusflow-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      return false;
  });

  const [activeNav, setActiveNav] = useState('my-day');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [adventureMode, setAdventureMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('focusflow-auth', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('focusflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('focusflow-theme', 'light');
    }
  }, [darkMode]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newTasks = [...tasks];
    const taskIndex = tasks.findIndex(t => t.id === result.draggableId);
    if (taskIndex === -1) return;

    const [removed] = newTasks.splice(taskIndex, 1);
    
    // Update status based on destination column
    if (destination.droppableId === ColumnId.COMPLETED) {
        removed.status = TaskStatus.COMPLETED;
    } else {
        removed.status = TaskStatus.TODO;
    }
    removed.columnId = destination.droppableId;

    // We don't necessarily support re-ordering indices within the full array for simplicity,
    // but we can re-insert it so it feels right. 
    newTasks.push(removed);
    setTasks(newTasks);

    if (destination.droppableId === ColumnId.COMPLETED && source.droppableId !== ColumnId.COMPLETED) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF5F5F', '#FFD700', '#4ade80']
        });
    }
  };

  const addTask = (data: string | Partial<Task>, dueDate?: string, hasNotification?: boolean) => {
    const newTask: Task = typeof data === 'string' ? {
      id: Date.now().toString(),
      title: data,
      status: TaskStatus.TODO,
      isImportant: false,
      columnId: ColumnId.TODAY,
      dueDate: dueDate,
      hasNotification: hasNotification,
      priority: TaskPriority.MEDIUM
    } : {
      id: Date.now().toString(),
      title: data.title || 'Untitled Task',
      status: TaskStatus.TODO,
      isImportant: data.isImportant || false,
      columnId: (data.dueDate && data.dueDate.toLowerCase().includes('today')) ? ColumnId.TODAY : ColumnId.UPCOMING,
      dueDate: data.dueDate,
      description: data.description,
      priority: data.priority || TaskPriority.MEDIUM,
      category: data.category,
      subtasks: data.subtasks || [],
      hasNotification: data.hasNotification
    };

    setTasks([newTask, ...tasks]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  const toggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    const newColumnId = newStatus === TaskStatus.COMPLETED ? ColumnId.COMPLETED : ColumnId.TODAY;
    
    updateTask({ ...task, status: newStatus, columnId: newColumnId });

    if (newStatus === TaskStatus.COMPLETED) {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FF5F5F', '#FFD700', '#4ade80']
        });
    }
  };

  const toggleImportant = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, isImportant: !task.isImportant });
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (activeNav === 'important') result = tasks.filter(t => t.isImportant);
    if (activeNav === 'completed') result = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    if (activeNav === 'planned') result = tasks.filter(t => t.dueDate);
    return result;
  }, [tasks, activeNav]);

  const handleSortChange = (colId: string, option: SortOption) => {
    setColumns(columns.map(c => c.id === colId ? { ...c, sortBy: option } : c));
  };

  if (!isLoggedIn) {
    return <LandingPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <Sidebar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        activeNav={activeNav} 
        setActiveNav={setActiveNav}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tasks={tasks}
        onLogout={() => setIsLoggedIn(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <header className="p-4 lg:p-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">menu</span>
            </button>
            <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                    {NAV_ITEMS.find(n => n.id === activeNav)?.label || 'Dashboard'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setAdventureMode(false)}
                    className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${!adventureMode ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <span className="material-symbols-outlined !text-[18px]">grid_view</span>
                    <span className="hidden sm:inline">Board</span>
                </button>
                <button 
                    onClick={() => setAdventureMode(true)}
                    className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${adventureMode ? 'bg-white dark:bg-slate-700 text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <span className="material-symbols-outlined !text-[18px]">map</span>
                    <span className="hidden sm:inline">Adventure</span>
                </button>
             </div>
             <button 
                onClick={() => setViewMode(viewMode === 'board' ? 'table' : 'board')} 
                className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all shadow-sm ${adventureMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={adventureMode}
             >
                <span className="material-symbols-outlined !text-[20px]">{viewMode === 'board' ? 'list' : 'dashboard'}</span>
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden">
          {adventureMode ? (
            <AdventureView 
                tasks={filteredTasks} 
                onTaskClick={setSelectedTask} 
                onToggleStatus={toggleStatus} 
            />
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className={`h-full p-4 lg:p-6 overflow-x-auto custom-scrollbar transition-all ${viewMode === 'board' ? 'flex gap-6 items-start' : 'flex flex-col gap-6'}`}>
                {columns.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    colorClass={col.colorClass}
                    tasks={filteredTasks.filter(t => t.columnId === col.id)}
                    onToggleStatus={toggleStatus}
                    onToggleImportant={toggleImportant}
                    onTaskClick={setSelectedTask}
                    sortBy={col.sortBy}
                    onSortChange={(opt) => handleSortChange(col.id, opt)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </DragDropContext>
          )}
        </div>

        {/* Global UI Components */}
        <AddTaskBar onAddTask={addTask} />
        <PomodoroTimer />
        {selectedTask && (
          <TaskModal 
            task={selectedTask} 
            columns={columns} 
            onClose={() => setSelectedTask(null)} 
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        )}
      </main>
    </div>
  );
};

export default App;