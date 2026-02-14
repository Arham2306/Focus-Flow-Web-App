import React from 'react';
import { NAV_ITEMS } from '../constants';
import { Task, TaskStatus } from '../types';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeNav: string;
  setActiveNav: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const Sidebar: React.FC<SidebarProps> = ({ darkMode, toggleDarkMode, activeNav, setActiveNav, isOpen, onClose, tasks }) => {
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <>
      {/* Mobile Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-bg dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 shadow-xl lg:shadow-sm shrink-0 h-full transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-primary text-xl font-extrabold tracking-tight">FocusFlow</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Minimalist Task Manager</p>
            </div>
            {/* Close button for mobile only */}
            <button 
                onClick={onClose} 
                className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                    setActiveNav(item.id);
                    onClose();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all w-full text-left
                  ${activeNav === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  } group`}
              >
                <span 
                  className={`material-symbols-outlined !text-[22px] transition-colors
                    ${activeNav === item.id ? '' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'}
                  `}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Productivity Stats Widget */}
          <div className="mt-auto px-3 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daily Goal</span>
                <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
             </div>
             <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-out rounded-full" 
                    style={{ width: `${progressPercentage}%` }} 
                />
             </div>
             <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                {completedCount} of {totalCount} tasks completed
             </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div 
            onClick={toggleDarkMode}
            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined !text-[22px] text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">
                dark_mode
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Dark Mode</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div 
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out
                  ${darkMode ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'}
                `} 
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;