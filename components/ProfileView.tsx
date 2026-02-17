import React from 'react';
import { User } from 'firebase/auth';
import { Task, TaskStatus } from '../types';
import { useAuth } from '../AuthContext';

interface ProfileViewProps {
  currentUser: User | null;
  tasks: Task[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, tasks, darkMode, onToggleDarkMode, onLogout, onEditProfile }) => {
  const { userMetadata } = useAuth();

  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  // Calculate completed today
  const todayStr = new Date().toDateString();
  const completedToday = tasks.filter(t => {
    if (t.status !== TaskStatus.COMPLETED) return false;
    if (!t.completedDate) return true; // Legacy tasks count as today for initial feedback
    return new Date(t.completedDate).toDateString() === todayStr;
  }).length;

  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const importantTasks = tasks.filter(t => t.isImportant).length;

  const stats = [
    { label: 'Daily Goal', value: `${completedToday} / ${userMetadata.dailyGoal || 5}`, icon: 'flag', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Tasks', value: totalTasks, icon: 'list_alt', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Success Rate', value: `${completionRate}%`, icon: 'insights', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Important', value: importantTasks, icon: 'star', color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-32 sm:pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Profile Section */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8 text-center md:text-left">
            <div className="relative group mx-auto md:mx-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl object-cover relative z-10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl relative z-10">
                  <span className="text-primary text-4xl font-black">
                    {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {currentUser?.displayName || 'User Explorer'}
                </h1>
                {userMetadata.role && (
                  <p className="text-primary font-bold text-sm tracking-wide">{userMetadata.role}</p>
                )}
              </div>

              {userMetadata.bio && (
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium italic max-w-lg mx-auto md:mx-0">
                  "{userMetadata.bio}"
                </p>
              )}

              <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[16px]">mail</span>
                  {currentUser?.email}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Pro Member</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Joined {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className={`material-symbols-outlined !text-[24px] ${stat.color}`}>{stat.icon}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Settings & Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Preferences</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Appearance</span>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">notifications</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Push Notifications</span>
                </div>
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Account Actions</h4>
            <div className="flex-1 space-y-4">
              <button
                onClick={onEditProfile}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">edit</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Edit Profile</span>
                </div>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 group-hover:rotate-12 transition-transform">logout</span>
                  <span className="text-sm font-bold text-red-500">Sign Out</span>
                </div>
                <span className="material-symbols-outlined text-red-200">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
