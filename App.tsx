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
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { currentUser, loading, signInWithGoogle, logout } = useAuth();
  const isLoggedIn = !!currentUser;

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

  const [columns, setColumns] = useState<ColumnData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focusflow-columns');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse columns from storage", e);
        }
      }
    }
    return [
      { id: ColumnId.TODAY, title: 'Today', colorClass: 'bg-primary', sortBy: SortOption.CREATION },
      { id: ColumnId.UPCOMING, title: 'Upcoming', colorClass: 'bg-accent', sortBy: SortOption.CREATION },
      { id: ColumnId.COMPLETED, title: 'Completed', colorClass: 'bg-green-400', sortBy: SortOption.CREATION }
    ];
  });

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
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('focusflow-columns', JSON.stringify(columns));
    } catch (e) {
      console.error("Failed to save columns", e);
    }
  }, [columns]);



  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('focusflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('focusflow-theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newTasks = [...tasks];
    const taskIndex = tasks.findIndex(t => t.id === result.draggableId);
    if (taskIndex === -1) return;

    const [removed] = newTasks.splice(taskIndex, 1);

    if (destination.droppableId === ColumnId.COMPLETED) {
      removed.status = TaskStatus.COMPLETED;
    } else {
      removed.status = TaskStatus.TODO;
    }
    removed.columnId = destination.droppableId;

    newTasks.push(removed);
    setTasks(newTasks);

    if (destination.droppableId === ColumnId.COMPLETED && source.droppableId !== ColumnId.COMPLETED) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF5F5F', '#FFD700', '#4ade80'] });
    }
  };

  const addTask = (data: string | Partial<Task>, dueDate?: string, hasNotification?: boolean) => {
    const newTask: Task = typeof data === 'string' ? {
      id: `task-${Date.now()}`,
      title: data,
      status: TaskStatus.TODO,
      isImportant: false,
      columnId: (dueDate && !dueDate.toLowerCase().includes('today')) ? ColumnId.UPCOMING : ColumnId.TODAY,
      dueDate: dueDate,
      hasNotification: hasNotification,
      priority: TaskPriority.MEDIUM
    } : {
      id: `task-${Date.now()}`,
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

    setTasks(prev => [newTask, ...prev]);
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) {
      setIsAddingColumn(false);
      return;
    }
    const newCol: ColumnData = {
      id: `custom-${Date.now()}`,
      title: newColumnTitle.trim(),
      colorClass: 'bg-slate-400',
      sortBy: SortOption.CREATION
    };
    setColumns(prev => [...prev, newCol]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const deleteColumn = (id: string) => {
    // Prevent deletion of system columns
    if (id === ColumnId.TODAY || id === ColumnId.UPCOMING || id === ColumnId.COMPLETED) return;

    const confirmMessage = "Are you sure you want to delete this column? All tasks inside will be permanently removed.";
    if (window.confirm(confirmMessage)) {
      setColumns(prev => prev.filter(c => c.id !== id));
      setTasks(prev => prev.filter(t => t.columnId !== id));
    }
  };

  const updateTask = (updatedTask: Task) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  const deleteTask = (taskId: string) => { setTasks(prev => prev.filter(t => t.id !== taskId)); setSelectedTask(null); };

  const toggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    const newColumnId = newStatus === TaskStatus.COMPLETED ? ColumnId.COMPLETED : ColumnId.TODAY;
    updateTask({ ...task, status: newStatus, columnId: newColumnId });
    if (newStatus === TaskStatus.COMPLETED) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#FF5F5F', '#FFD700', '#4ade80'] });
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
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, sortBy: option } : c));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) return <LandingPage onLogin={signInWithGoogle} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;

  return (
    <div className="flex h-screen bg-background-light dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <Sidebar
        darkMode={darkMode} toggleDarkMode={toggleDarkMode} activeNav={activeNav} setActiveNav={setActiveNav}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} tasks={tasks} onLogout={logout}
        onAddTask={addTask}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="p-3 sm:p-4 lg:p-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">menu</span>
            </button>
            <div className="truncate">
              <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-white tracking-tight truncate">
                {NAV_ITEMS.find(n => n.id === activeNav)?.label || 'Dashboard'}
              </h2>
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={() => setAdventureMode(false)} className={`p-1.5 rounded-md sm:rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all ${!adventureMode ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined !text-[16px] sm:!text-[18px]">grid_view</span>
                <span className="hidden xs:inline">Board</span>
              </button>
              <button onClick={() => setAdventureMode(true)} className={`p-1.5 rounded-md sm:rounded-lg flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all ${adventureMode ? 'bg-white dark:bg-slate-700 text-accent shadow-sm' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined !text-[16px] sm:!text-[18px]">map</span>
                <span className="hidden xs:inline">Adventure</span>
              </button>
            </div>
            <button onClick={() => setViewMode(viewMode === 'board' ? 'table' : 'board')} className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary ${adventureMode ? 'opacity-50' : ''}`} disabled={adventureMode}>
              <span className="material-symbols-outlined !text-[18px] sm:!text-[20px]">{viewMode === 'board' ? 'list' : 'dashboard'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {adventureMode ? (
            <AdventureView tasks={filteredTasks} onTaskClick={setSelectedTask} onToggleStatus={toggleStatus} />
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className={`h-full p-3 sm:p-4 lg:p-6 pb-24 sm:pb-32 overflow-x-auto custom-scrollbar flex transition-all ${viewMode === 'board' ? 'gap-4 sm:gap-6 items-start' : 'flex-col gap-4 sm:gap-6'}`}>
                {columns.map((col) => (
                  <Column
                    key={col.id} id={col.id} title={col.title} colorClass={col.colorClass}
                    tasks={filteredTasks.filter(t => t.columnId === col.id)}
                    onToggleStatus={toggleStatus} onToggleImportant={toggleImportant}
                    onTaskClick={setSelectedTask} sortBy={col.sortBy} onSortChange={(opt) => handleSortChange(col.id, opt)}
                    onDelete={() => deleteColumn(col.id)}
                    viewMode={viewMode}
                  />
                ))}

                <div className={`${viewMode === 'board' ? 'board-column shrink-0' : 'w-full'} flex flex-col`}>
                  {!isAddingColumn ? (
                    <button onClick={() => setIsAddingColumn(true)} className={`w-full ${viewMode === 'board' ? 'h-24 sm:h-32' : 'h-16'} border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary transition-all group shrink-0`}>
                      <span className="material-symbols-outlined !text-xl sm:!text-2xl transition-transform group-hover:scale-110">add_circle</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Column</span>
                    </button>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 sm:p-4 rounded-2xl shadow-xl shrink-0">
                      <input autoFocus value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addColumn()} onBlur={addColumn} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm font-bold placeholder-slate-400 mb-2" placeholder="Title..." />
                      <div className="flex gap-2">
                        <button onClick={addColumn} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold">Add</button>
                        <button onClick={() => setIsAddingColumn(false)} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-bold">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DragDropContext>
          )}
        </div>

        <AddTaskBar onAddTask={addTask} />
        <PomodoroTimer />
        {selectedTask && (
          <TaskModal task={selectedTask} columns={columns} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
        )}
      </main>
    </div>
  );
};

export default App;