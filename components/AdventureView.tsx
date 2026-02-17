
import React, { useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import gsap from 'gsap';

interface AdventureViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

const AdventureView: React.FC<AdventureViewProps> = ({ tasks, onTaskClick, onToggleStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    const idx = tasks.findIndex(t => t.status === TaskStatus.TODO);
    return idx === -1 ? tasks.length : idx;
  }, [tasks]);

  const completedCount = useMemo(() => tasks.filter(t => t.status === TaskStatus.COMPLETED).length, [tasks]);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Auto-scroll to active node
  useEffect(() => {
    if (containerRef.current && activeIndex < tasks.length) {
      const activeNode = containerRef.current.querySelector(`[data-node-index="${activeIndex}"]`);
      if (activeNode) {
        setTimeout(() => {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    }
  }, [activeIndex, tasks.length]);

  // Entry animations
  useEffect(() => {
    if (nodesRef.current) {
      gsap.fromTo('.quest-node',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [tasks.length]);

  const getPriorityBadge = (priority?: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return { label: 'Hard', color: 'bg-red-500/10 text-red-500', dot: 'bg-red-500' };
      case TaskPriority.MEDIUM: return { label: 'Medium', color: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' };
      case TaskPriority.LOW: return { label: 'Easy', color: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' };
      default: return { label: 'Medium', color: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' };
    }
  };

  const getNodeTheme = (index: number) => {
    const progress = index / Math.max(1, tasks.length);
    if (progress < 0.25) return { gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/20', icon: 'park', zone: 'Starter Grove' };
    if (progress < 0.5) return { gradient: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-500/20', icon: 'landscape', zone: 'Crystal Peaks' };
    if (progress < 0.75) return { gradient: 'from-violet-400 to-purple-500', glow: 'shadow-purple-500/20', icon: 'auto_awesome', zone: 'Mystic Realm' };
    return { gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/20', icon: 'local_fire_department', zone: 'Dragon Summit' };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-40 sm:pb-48" ref={nodesRef}>

        {/* Quest Header */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <span className="material-symbols-outlined !text-3xl sm:!text-4xl text-white">map</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quest Map</h2>
                <p className="text-xs sm:text-sm text-slate-400 font-bold mt-0.5">Complete tasks to advance through the realms</p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-primary">{completedCount}</p>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Done</p>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-slate-300 dark:text-slate-600">{tasks.length - completedCount}</p>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Left</p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Journey Progress</span>
                <span className="text-xs sm:text-sm font-black text-primary">{progressPercent}%</span>
              </div>
              <div className="h-2.5 sm:h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(255,95,95,0.3)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quest Nodes Timeline */}
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            <div
              className="w-full bg-gradient-to-b from-primary to-accent rounded-full transition-all duration-1000"
              style={{ height: `${tasks.length > 0 ? (activeIndex / tasks.length) * 100 : 0}%` }}
            />
          </div>

          {/* Task Nodes */}
          {tasks.map((task, i) => {
            const isCompleted = task.status === TaskStatus.COMPLETED;
            const isActive = i === activeIndex;
            const isLocked = i > activeIndex;
            const theme = getNodeTheme(i);
            const priority = getPriorityBadge(task.priority);

            return (
              <div
                key={task.id}
                data-node-index={i}
                className={`quest-node relative flex items-start gap-4 sm:gap-6 mb-3 sm:mb-4 ${isLocked ? 'opacity-40' : ''}`}
              >
                {/* Node Circle */}
                <div className="relative z-10 shrink-0">
                  <div className={`
                    w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2
                    ${isCompleted
                      ? `bg-gradient-to-br ${theme.gradient} border-transparent shadow-lg ${theme.glow}`
                      : isActive
                        ? 'bg-white dark:bg-slate-800 border-primary shadow-xl shadow-primary/20'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }
                    ${isActive ? 'ring-4 ring-primary/10' : ''}
                  `}>
                    <span className={`material-symbols-outlined !text-xl sm:!text-2xl transition-all
                      ${isCompleted ? 'text-white' : isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}
                    `}>
                      {isCompleted ? 'check_circle' : isLocked ? 'lock' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  {/* Step Number */}
                  <div className={`
                    absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-black border-2 border-white dark:border-slate-950
                    ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-700 text-white'}
                  `}>
                    {i + 1}
                  </div>
                </div>

                {/* Task Card */}
                <div
                  onClick={() => onTaskClick(task)}
                  className={`
                    flex-1 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer group border min-w-0
                    ${isActive
                      ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-xl shadow-primary/5 hover:shadow-2xl'
                      : isCompleted
                        ? 'bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800'
                    }
                    hover:translate-y-[-2px]
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Active indicator */}
                      {isActive && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Current Quest</span>
                        </div>
                      )}
                      <h3 className={`text-sm sm:text-base font-bold leading-snug tracking-tight truncate
                        ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}
                      `}>
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[12px] sm:!text-[14px] text-slate-400">schedule</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">{task.dueDate}</span>
                          </div>
                        )}
                        {task.priority && (
                          <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        )}
                        {task.category && (
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {task.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    {!isLocked && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
                        className={`
                          shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all
                          ${isCompleted
                            ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          }
                          active:scale-90
                        `}
                      >
                        <span className="material-symbols-outlined !text-lg sm:!text-xl">
                          {isCompleted ? 'undo' : 'done'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Subtasks progress bar (if any) */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">{task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length} steps</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Victory Node */}
          {tasks.length > 0 && (
            <div className="quest-node relative flex items-start gap-4 sm:gap-6 mt-4">
              <div className="relative z-10 shrink-0">
                <div className={`
                  w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                  ${progressPercent === 100
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-transparent shadow-xl shadow-amber-500/30 animate-pulse'
                    : 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700'
                  }
                `}>
                  <span className={`material-symbols-outlined !text-xl sm:!text-2xl ${progressPercent === 100 ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                    trophy
                  </span>
                </div>
              </div>
              <div className={`
                flex-1 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all
                ${progressPercent === 100
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50 shadow-lg'
                  : 'bg-slate-50/30 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800'
                }
              `}>
                <h3 className={`text-sm sm:text-base font-black tracking-tight ${progressPercent === 100 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>
                  {progressPercent === 100 ? '🏆 Quest Complete!' : 'Victory Awaits...'}
                </h3>
                <p className={`text-[10px] sm:text-xs font-bold mt-1 ${progressPercent === 100 ? 'text-amber-500/70' : 'text-slate-300 dark:text-slate-600'}`}>
                  {progressPercent === 100 ? 'All tasks conquered. You are legendary!' : `${tasks.length - completedCount} more quests to go`}
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined !text-4xl text-slate-300 dark:text-slate-600">explore</span>
              </div>
              <h3 className="text-lg font-black text-slate-400 dark:text-slate-500">No Quests Yet</h3>
              <p className="text-sm text-slate-300 dark:text-slate-600 font-bold mt-1">Add some tasks to begin your adventure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdventureView;
