import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { Task, TaskStatus } from '../types';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeNav: string;
  setActiveNav: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onLogout: () => void;
  onAddTask: (title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ darkMode, toggleDarkMode, activeNav, setActiveNav, isOpen, onClose, tasks, onLogout, onAddTask }) => {
  const { userMetadata } = useAuth();
  const [sidebarTaskInput, setSidebarTaskInput] = useState('');

  const todayStr = new Date().toDateString();
  const completedToday = tasks.filter(t => {
    if (t.status !== TaskStatus.COMPLETED) return false;
    if (!t.completedDate) return true;
    return new Date(t.completedDate).toDateString() === todayStr;
  }).length;

  const goalTarget = userMetadata.dailyGoal || 5;
  const progressPercentage = Math.min(100, Math.round((completedToday / goalTarget) * 100));

  const handleSidebarTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sidebarTaskInput.trim()) {
      onAddTask(sidebarTaskInput.trim());
      setSidebarTaskInput('');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-[110] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 shadow-2xl lg:shadow-none shrink-0 h-full transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-8 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-primary text-2xl font-black tracking-tighter">FocusFlow</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Flow state unlocked</p>
            </div>
            {/* Close button for mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Quick Add Task Input - Styled for the Sidebar */}
          <div className="px-2">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">New Entry</h4>
            <form onSubmit={handleSidebarTaskSubmit} className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[18px] text-slate-300 dark:text-slate-600 group-focus-within:text-primary transition-colors">edit_note</span>
              <input
                type="text"
                value={sidebarTaskInput}
                onChange={(e) => setSidebarTaskInput(e.target.value)}
                placeholder="What's next?"
                className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-xs font-bold placeholder-slate-400 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
              {sidebarTaskInput && (
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary p-1 animate-in zoom-in duration-200">
                  <span className="material-symbols-outlined !text-[20px]">send</span>
                </button>
              )}
            </form>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-3">Navigation</h4>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  onClose();
                }}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black transition-all w-full text-left group
                  ${activeNav === item.id
                    ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <span
                  className={`material-symbols-outlined !text-[22px] transition-all duration-300 group-hover:scale-110
                    ${activeNav === item.id ? 'filled' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'}
                  `}
                >
                  {item.icon}
                </span>
                <span className="text-xs uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Productivity Stats Widget */}
          <div className="mt-auto px-5 py-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Progress</span>
              <span className="text-xs font-black text-primary">{progressPercentage}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-4 shadow-sm">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,95,95,0.3)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {completedToday} / {goalTarget} goals reached
            </p>
          </div>
        </div>

        {/* Footer Area */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest">
              <span className="material-symbols-outlined !text-[20px] transition-colors">
                {darkMode ? 'dark_mode' : 'light_mode'}
              </span>
              Mode
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-3 w-full text-slate-400 hover:text-red-500 transition-all font-black text-xs uppercase tracking-widest group"
          >
            <span className="material-symbols-outlined !text-[20px] group-hover:rotate-12 transition-transform">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;