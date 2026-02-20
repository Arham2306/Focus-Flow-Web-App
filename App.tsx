import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import AddTaskBar from './components/AddTaskBar';
import TaskModal from './components/TaskModal';
import PomodoroTimer from './components/PomodoroTimer';
import AdventureView from './components/AdventureView';
import LandingPage from './components/LandingPage';
import ProfileView from './components/ProfileView';
import EditProfileView from './components/EditProfileView';
import SetPasswordView from './components/SetPasswordView';
import { INITIAL_TASKS, NAV_ITEMS } from './constants';
import { Task, ColumnId, TaskStatus, ColumnData, SortOption, TaskPriority, AppNotification, NotificationType } from './types';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { currentUser, loading, signInWithGoogle, logout, needsPassword } = useAuth();
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
  const [viewMode, setViewMode] = useState<'board' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 'table';
    return 'board';
  });
  const [adventureMode, setAdventureMode] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focusflow-notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse notifications", e);
        }
      }
    }
    return [
      {
        id: 'welcome',
        title: 'Welcome to FocusFlow!',
        message: 'Start by adding your first task and managing your day.',
        type: NotificationType.INFO,
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ];
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem('focusflow-notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to save notifications", e);
    }
  }, [notifications]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      removed.completedDate = new Date().toISOString();
      removed.previousColumnId = source.droppableId;
    } else {
      removed.status = TaskStatus.TODO;
      delete removed.completedDate;
      delete removed.previousColumnId;
    }
    removed.columnId = destination.droppableId;

    newTasks.push(removed);
    setTasks(newTasks);

    if (destination.droppableId === ColumnId.COMPLETED && source.droppableId !== ColumnId.COMPLETED) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF5F5F', '#FFD700', '#4ade80'] });
      addNotification(
        'Task Completed!',
        `Great job! You've finished: ${removed.title}`,
        NotificationType.SUCCESS,
        { label: 'Undo', onClick: 'undo-complete', payload: { taskId: removed.id } }
      );
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

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => {
      const oldTask = prev.find(t => t.id === updatedTask.id);
      if (oldTask) {
        // Detect Completion Transition
        if (updatedTask.status === TaskStatus.COMPLETED && oldTask.status !== TaskStatus.COMPLETED) {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#FF5F5F', '#FFD700', '#4ade80'] });
          addNotification(
            'Task Completed!',
            `Great job! You've finished: ${updatedTask.title}`,
            NotificationType.SUCCESS,
            { label: 'Undo', onClick: 'undo-complete', payload: { taskId: updatedTask.id } }
          );
          updatedTask.completedDate = updatedTask.completedDate || new Date().toISOString();
          updatedTask.previousColumnId = updatedTask.columnId !== ColumnId.COMPLETED ? updatedTask.columnId : oldTask.columnId;
          updatedTask.columnId = ColumnId.COMPLETED;
        }
        // Detect Un-completion Transition (Undo)
        else if (updatedTask.status !== TaskStatus.COMPLETED && oldTask.status === TaskStatus.COMPLETED) {
          delete updatedTask.completedDate;
          if (updatedTask.columnId === ColumnId.COMPLETED) {
            updatedTask.columnId = updatedTask.previousColumnId || ColumnId.TODAY;
            delete updatedTask.previousColumnId;
          }
        }
      }
      return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
    });
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
    if (task) {
      addNotification('Task Deleted', `"${task.title}" has been removed.`, NotificationType.WARNING);
    }
  };

  const addNotification = (title: string, message: string, type: NotificationType = NotificationType.INFO, action?: AppNotification['action']) => {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      action
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Add to toasts
    setActiveToasts(prev => [...prev, newNotification]);
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotification.id));
    }, 5000);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleNotificationAction = (notif: AppNotification) => {
    if (!notif.action) return;

    switch (notif.action.onClick) {
      case 'undo-complete':
        const taskId = notif.action.payload.taskId;
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          updateTask({
            ...task,
            status: TaskStatus.TODO,
            columnId: task.previousColumnId || ColumnId.TODAY,
            completedDate: undefined,
            previousColumnId: undefined
          });
          addNotification('Undone', `Task "${task.title}" moved back.`, NotificationType.INFO);
        }
        break;
      // Add more actions here
    }

    markNotificationAsRead(notif.id);
    setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: AppNotification[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notif => {
      const date = new Date(notif.timestamp);
      if (date >= today) groups['Today'].push(notif);
      else if (date >= yesterday) groups['Yesterday'].push(notif);
      else groups['Earlier'].push(notif);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [notifications]);

  const toggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompleted = task.status === TaskStatus.COMPLETED;
    const newStatus = isCompleted ? TaskStatus.TODO : TaskStatus.COMPLETED;

    updateTask({
      ...task,
      status: newStatus,
      // columnId and completedDate will be handled by updateTask's transition logic
    });
  };



  const toggleImportant = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newImportant = !task.isImportant;
      updateTask({ ...task, isImportant: newImportant });
      if (newImportant) {
        addNotification('Priority Set', `"${task.title}" has been marked as important.`, NotificationType.INFO);
      }
    }
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

  if (needsPassword) return <SetPasswordView />;

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
            {activeNav === 'profile' || activeNav === 'edit-profile' ? (
              <button
                onClick={() => setActiveNav(activeNav === 'edit-profile' ? 'profile' : 'my-day')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-primary flex items-center gap-1"
              >
                <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Back</span>
              </button>
            ) : (
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">menu</span>
              </button>
            )}
            <div className="truncate">
              <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-white tracking-tight truncate">
                {activeNav === 'profile' ? 'Profile' : activeNav === 'edit-profile' ? 'Edit Profile' : (NAV_ITEMS.find(n => n.id === activeNav)?.label || 'Dashboard')}
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

            {/* Notifications Dropdown */}
            <div className="relative flex items-center" ref={notificationDropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 transition-all relative ${notificationsOpen ? 'bg-primary/10 border-primary text-primary' : 'text-slate-400 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined !text-[18px] sm:!text-[20px]">notifications</span>
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div className="fixed sm:absolute right-4 sm:right-0 top-[70px] sm:top-full mt-2 w-[calc(100vw-32px)] sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 zoom-in-95 duration-200 z-50">

                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Notifications</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {notifications.filter(n => !n.isRead).length} Unread
                        </p>
                      </div>
                      {notifications.length > 0 && (
                        <div className="flex gap-2">
                          <button onClick={markAllNotificationsAsRead} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-2 py-1">Mark all read</button>
                          <button onClick={clearNotifications} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors px-2 py-1">Clear</button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                          {groupedNotifications.map(([groupName, items]) => (
                            <div key={groupName}>
                              <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 text-[8px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100/50 dark:border-slate-800/50">
                                {groupName}
                              </div>
                              {items.map((notif) => (
                                <div
                                  key={notif.id}
                                  className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${!notif.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                >
                                  <div
                                    onClick={() => markNotificationAsRead(notif.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${notif.type === NotificationType.SUCCESS ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                      notif.type === NotificationType.WARNING ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                        'bg-primary/10 text-primary'
                                      }`}
                                  >
                                    <span className="material-symbols-outlined !text-[18px]">
                                      {notif.type === NotificationType.SUCCESS ? 'check_circle' :
                                        notif.type === NotificationType.WARNING ? 'warning' : 'info'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0" onClick={() => markNotificationAsRead(notif.id)}>
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {notif.title}
                                      </h4>
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className={`text-[10px] mt-0.5 line-clamp-2 leading-relaxed ${!notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                      {notif.message}
                                    </p>
                                    {notif.action && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleNotificationAction(notif); }}
                                        className="mt-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                      >
                                        {notif.action.label}
                                      </button>
                                    )}
                                  </div>
                                  {!notif.isRead && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 !text-2xl">notifications_off</span>
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar with Dropdown */}
            <div className="relative ml-1 flex items-center" ref={profileDropdownRef}>
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="focus:outline-none flex items-center">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profile'}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 object-cover transition-colors ${profileDropdownOpen ? 'border-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary'}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 bg-primary/10 flex items-center justify-center transition-colors ${profileDropdownOpen ? 'border-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary'}`}>
                    <span className="text-primary font-black text-xs sm:text-sm">
                      {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 zoom-in-95 duration-200 z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-black text-sm">{(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser?.displayName || 'User'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => { setActiveNav('profile'); setProfileDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined !text-[20px] text-slate-400">person</span>
                      Profile
                    </button>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); logout(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined !text-[20px]">logout</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeNav === 'profile' ? (
            <ProfileView
              currentUser={currentUser}
              tasks={tasks}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              onLogout={logout}
              onEditProfile={() => setActiveNav('edit-profile')}
            />
          ) : activeNav === 'edit-profile' ? (
            <EditProfileView onBack={() => setActiveNav('profile')} />
          ) : adventureMode ? (
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

        {activeNav !== 'profile' && activeNav !== 'edit-profile' && <AddTaskBar onAddTask={addTask} />}
        <PomodoroTimer />
        {selectedTask && (
          <TaskModal task={selectedTask} columns={columns} onClose={() => setSelectedTask(null)} onUpdate={updateTask} onDelete={deleteTask} />
        )}

        {/* Toast Overlay */}
        <div className="fixed bottom-24 right-4 sm:right-8 flex flex-col gap-3 z-[60] pointer-events-none">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className="w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 p-4 flex gap-3 animate-in slide-in-from-right-full duration-300 pointer-events-auto group"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toast.type === NotificationType.SUCCESS ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                toast.type === NotificationType.WARNING ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                  'bg-primary/10 text-primary'
                }`}>
                <span className="material-symbols-outlined !text-[20px]">
                  {toast.type === NotificationType.SUCCESS ? 'check_circle' :
                    toast.type === NotificationType.WARNING ? 'warning' : 'info'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{toast.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => handleNotificationAction(toast)}
                    className="mt-2 px-3 py-1 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined !text-[16px] text-slate-400">close</span>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;