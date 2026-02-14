
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
import { Task, ColumnId, TaskStatus, ColumnData, SortOption } from './types';
import confetti from 'canvas-confetti';

const COLUMN_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-teal-400'
];

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
    { id: ColumnId.COMPLETED, title: 'Completed', colorClass: 'bg-slate-300', sortBy: SortOption.CREATION }
  ]);
  
  const [activeNav, setActiveNav] = useState('my-day');
  const [darkMode, setDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'adventure'>(() => {
    if (typeof window !== 'undefined') {
        return window.innerWidth < 1024 ? 'table' : 'board';
    }
    return 'board';
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Ref to focus the bottom task input
  const addTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  useEffect(() => {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('focusflow-auth', String(isLoggedIn));
  }, [isLoggedIn]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5F5F', '#FFD700', '#60A5FA', '#34D399']
    });
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newId = `col-${Date.now()}`;
    const randomColor = COLUMN_COLORS[Math.floor(Math.random() * COLUMN_COLORS.length)];
    const completedIndex = columns.findIndex(c => c.id === ColumnId.COMPLETED);
    const newColumn: ColumnData = {
        id: newId,
        title: newColumnTitle.trim(),
        colorClass: randomColor,
        sortBy: SortOption.CREATION
    };
    if (completedIndex !== -1) {
        const newCols = [...columns];
        newCols.splice(completedIndex, 0, newColumn);
        setColumns(newCols);
    } else {
        setColumns([...columns, newColumn]);
    }
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleAddTask = (taskInput: string | Partial<Task>, dueDateArg?: string, hasNotificationArg?: boolean) => {
    let title = '';
    let dueDate = dueDateArg;
    let hasNotification = hasNotificationArg;
    let additionalData: Partial<Task> = {};
    if (typeof taskInput === 'string') {
        title = taskInput;
    } else {
        title = taskInput.title || 'Untitled Task';
        if (taskInput.dueDate !== undefined) dueDate = taskInput.dueDate;
        if (taskInput.hasNotification !== undefined) hasNotification = taskInput.hasNotification;
        additionalData = taskInput;
    }
    let targetColumn = ColumnId.TODAY;
    let icon = additionalData.categoryIcon || 'event';
    if (dueDate) {
        const lowerDate = dueDate.toLowerCase();
        if (lowerDate.includes('tomorrow') || lowerDate.includes('next week') || (lowerDate.startsWith('due ') && !lowerDate.includes('today'))) {
            targetColumn = ColumnId.UPCOMING;
            icon = 'calendar_month';
        }
    }
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: TaskStatus.TODO,
      isImportant: additionalData.isImportant || false,
      columnId: additionalData.columnId || targetColumn,
      dueDate: dueDate || 'Due today',
      categoryIcon: icon,
      hasNotification: hasNotification ?? false,
      description: additionalData.description,
      priority: additionalData.priority,
      category: additionalData.category,
      subtasks: additionalData.subtasks
    };
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (updatedTask.status === TaskStatus.COMPLETED && tasks.find(t => t.id === updatedTask.id)?.status !== TaskStatus.COMPLETED) {
        triggerConfetti();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const draggedTask = tasks.find(t => t.id === draggableId);
    if (!draggedTask) return;
    const newColumnId = destination.droppableId;
    let newStatus = draggedTask.status;
    if (newColumnId === ColumnId.COMPLETED) {
        newStatus = TaskStatus.COMPLETED;
        if (draggedTask.status !== TaskStatus.COMPLETED) triggerConfetti();
    } else {
        newStatus = TaskStatus.TODO;
    }
    const newTasks = tasks.map(t => t.id === draggableId ? { ...t, columnId: newColumnId, status: newStatus } : t);
    setTasks(newTasks);
  };

  const handleToggleStatus = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newStatus = task.status === TaskStatus.TODO ? TaskStatus.COMPLETED : TaskStatus.TODO;
        if (newStatus === TaskStatus.COMPLETED) triggerConfetti();
        let newColumnId = task.columnId;
        if (newStatus === TaskStatus.COMPLETED) newColumnId = ColumnId.COMPLETED;
        else if (task.columnId === ColumnId.COMPLETED) newColumnId = ColumnId.TODAY;
        return { ...task, status: newStatus, columnId: newColumnId };
      }
      return task;
    }));
  };

  const handleToggleImportant = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, isImportant: !task.isImportant } : task));
  };

  const handleSortColumn = (colId: string, sortOption: SortOption) => {
    setColumns(columns.map(col => col.id === colId ? { ...col, sortBy: sortOption } : col));
  };

  const handleFocusAddTask = () => {
    addTaskInputRef.current?.focus();
  };

  // Central Filtering Logic based on activeNav and Search
  const filteredTasksByView = useMemo(() => {
    let result = [...tasks];
    
    // 1. Filter by Active Tab
    if (activeNav === 'important') {
        result = result.filter(t => t.isImportant);
    } else if (activeNav === 'planned') {
        result = result.filter(t => t.dueDate && t.dueDate.trim() !== '' && t.dueDate.toLowerCase() !== 'no date');
    } else if (activeNav === 'completed') {
        result = result.filter(t => t.status === TaskStatus.COMPLETED);
    } else if (activeNav === 'tasks') {
        // "Tasks" tab usually shows everything
    } else if (activeNav === 'my-day') {
        // Dashboard view
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.title.toLowerCase().includes(lowerQuery) || 
            t.description?.toLowerCase().includes(lowerQuery) ||
            t.category?.toLowerCase().includes(lowerQuery)
        );
    }
    
    return result;
  }, [tasks, activeNav, searchQuery]);

  const getTasksForColumn = (colId: string) => {
      return filteredTasksByView.filter(t => t.columnId === colId);
  };

  const getHeaderTitle = () => {
    const item = NAV_ITEMS.find(n => n.id === activeNav);
    return item ? item.label : 'My Day';
  };

  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-slate-950 transition-colors duration-200">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tasks={tasks}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300"><span className="material-symbols-outlined">menu</span></button>
                 <span className="font-extrabold text-primary text-lg tracking-tight">FocusFlow</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setViewMode('board')} className={`p-1 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 dark:text-slate-500'}`}><span className="material-symbols-outlined !text-[20px]">view_column</span></button>
                    <button onClick={() => setViewMode('table')} className={`p-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 dark:text-slate-500'}`}><span className="material-symbols-outlined !text-[20px]">table_rows</span></button>
                    <button onClick={() => setViewMode('adventure')} className={`p-1 rounded-md transition-all ${viewMode === 'adventure' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 dark:text-slate-500'}`}><span className="material-symbols-outlined !text-[20px]">map</span></button>
                </div>
                <button onClick={handleFocusAddTask} className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-slate-900 shadow-sm"><span className="material-symbols-outlined !text-[20px]">add</span></button>
             </div>
        </div>
        <header className="px-4 lg:px-8 pt-6 lg:pt-10 pb-4 lg:pb-6 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 shrink-0">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{getHeaderTitle()}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-lg">{currentDate}</p>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[20px] text-slate-400">search</span>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-none rounded-xl text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary/20 placeholder-slate-400 dark:text-white transition-all" />
             </div>
            <div className="hidden lg:flex gap-4">
                 <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><span className="material-symbols-outlined !text-[18px]">view_column</span> Board</button>
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><span className="material-symbols-outlined !text-[18px]">table_rows</span> List</button>
                    <button onClick={() => setViewMode('adventure')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'adventure' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><span className="material-symbols-outlined !text-[18px]">map</span> Map</button>
                 </div>
                <button onClick={handleFocusAddTask} className="bg-accent text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"><span className="material-symbols-outlined !text-lg">add</span> Add Task</button>
            </div>
          </div>
        </header>
        {viewMode === 'adventure' ? (
          <AdventureView tasks={filteredTasksByView} onTaskClick={setSelectedTask} onToggleStatus={handleToggleStatus} />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
              <div className={`flex-1 ${viewMode === 'board' ? 'overflow-x-auto px-4 lg:px-8 pb-10 custom-scrollbar snap-x snap-mandatory' : 'overflow-y-auto px-4 lg:px-8 pb-20 custom-scrollbar'}`}>
                  <div className={`${viewMode === 'board' ? 'flex gap-4 lg:gap-6 h-full items-start min-w-max' : 'flex flex-col gap-6 max-w-4xl mx-auto'}`}>
                      {columns.map(col => (
                          <Column 
                              key={col.id}
                              id={col.id}
                              title={col.title} 
                              tasks={getTasksForColumn(col.id)} 
                              colorClass={col.colorClass}
                              sortBy={col.sortBy}
                              onToggleStatus={handleToggleStatus}
                              onToggleImportant={handleToggleImportant}
                              onTaskClick={setSelectedTask}
                              onSortChange={(option) => handleSortColumn(col.id, option)}
                              viewMode={viewMode}
                          />
                      ))}
                      {isAddingColumn ? (
                          <div className={`${viewMode === 'board' ? 'board-column h-32 w-80 shrink-0 snap-center' : 'w-full'} bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-center gap-3 shadow-lg animate-in zoom-in-95 duration-200`}>
                              <input autoFocus type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white transition-all outline-none" placeholder="Column title..." value={newColumnTitle} onChange={e => setNewColumnTitle(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleAddColumn(); }} />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsAddingColumn(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleAddColumn} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">Add</button>
                              </div>
                          </div>
                      ) : (
                          <button onClick={() => setIsAddingColumn(true)} className={`${viewMode === 'board' ? 'board-column h-32 w-80 shrink-0 snap-center flex-col' : 'w-full py-6 flex-row gap-3'} border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary hover:border-primary/40 hover:bg-white dark:hover:bg-slate-800 transition-all group`}><span className="material-symbols-outlined !text-3xl group-hover:scale-110 transition-transform">add</span><span className="text-xs font-bold uppercase tracking-widest">Add Column</span></button>
                      )}
                  </div>
              </div>
          </DragDropContext>
        )}
        <AddTaskBar ref={addTaskInputRef} onAddTask={handleAddTask} />
        <PomodoroTimer />
        {selectedTask && <TaskModal task={selectedTask} columns={columns} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />}
      </main>
    </div>
  );
};

export default App;
