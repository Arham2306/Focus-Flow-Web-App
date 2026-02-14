
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
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ darkMode, toggleDarkMode, activeNav, setActiveNav, isOpen, onClose, tasks, onLogout }) => {
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-sidebar-bg dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 shadow-xl lg:shadow-none shrink-0 h-full transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-primary text-2xl font-black tracking-tighter">FocusFlow</h1>
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
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl font-bold transition-all w-full text-left
                  ${activeNav === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  } group`}
              >
                <span 
                  className={`material-symbols-outlined !text-[24px] transition-colors
                    ${activeNav === item.id ? 'filled' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'}
                  `}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Productivity Stats Widget */}
          <div className="mt-auto px-4 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daily Goal</span>
                <span className="text-xs font-black text-primary">{progressPercentage}%</span>
             </div>
             <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {completedCount} of {totalCount} tasks completed
             </p>
          </div>
        </div>

        {/* Footer Area */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-sm">
              <span className="material-symbols-outlined !text-[20px]">
                {darkMode ? 'dark_mode' : 'light_mode'}
              </span>
              Dark Mode
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-2 py-2 w-full text-slate-400 hover:text-red-500 transition-colors font-bold text-sm"
          >
            <span className="material-symbols-outlined !text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
