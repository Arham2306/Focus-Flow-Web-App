
import React, { useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import gsap from 'gsap';

interface AdventureViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

const AdventureView: React.FC<AdventureViewProps> = ({ tasks, onTaskClick, onToggleStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Find the index of the first incomplete task (The "Current Level")
  const activeIndex = useMemo(() => {
    const idx = tasks.findIndex(t => t.status === TaskStatus.TODO);
    return idx === -1 ? tasks.length : idx;
  }, [tasks]);

  // Constants for layout
  const ITEM_HEIGHT = 180;
  const AMPLITUDE = 100;
  const TOTAL_HEIGHT = Math.max(1000, tasks.length * ITEM_HEIGHT + 400);

  // Auto-scroll to active level
  useEffect(() => {
    if (containerRef.current && activeIndex >= 0) {
      const y = (activeIndex * ITEM_HEIGHT) + 150;
      containerRef.current.scrollTo({ 
        top: y - window.innerHeight / 2 + 100, 
        behavior: 'smooth' 
      });
    }
  }, [activeIndex, tasks.length]);

  // Entry animations
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo('.quest-node', 
        { scale: 0, opacity: 0 }, 
        { scale: 1, opacity: 1, stagger: 0.1, duration: 0.8, ease: "back.out(1.7)" }
      );
    }
  }, [tasks.length]);

  const getPosition = (index: number) => {
    const y = (index * ITEM_HEIGHT) + 200;
    // Winding path logic
    const xOffset = Math.sin(index * 1.5) * AMPLITUDE;
    return { x: `calc(50% + ${xOffset}px)`, y, rawX: xOffset };
  };

  const getControlPoint = (i: number, current: {rawX: number, y: number}, next: {rawX: number, y: number}) => {
     const midY = (current.y + next.y) / 2;
     const cpX = (current.rawX + next.rawX) / 2 + (i % 2 === 0 ? 80 : -80); 
     return `Q calc(50% + ${cpX}px) ${midY}`;
  };

  // Biome Themes based on progress percentage
  const getBiome = (index: number) => {
    const progress = index / Math.max(1, tasks.length);
    if (progress < 0.33) return { name: 'Dawn Valley', color: 'text-emerald-500', bg: 'from-emerald-50/50', icon: 'forest' };
    if (progress < 0.66) return { name: 'Highlands', color: 'text-blue-500', bg: 'from-blue-50/50', icon: 'landscape' };
    return { name: 'Summit Path', color: 'text-purple-500', bg: 'from-purple-50/50', icon: 'filter_drama' };
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar scroll-smooth overflow-x-hidden"
    >
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#FF5F5F_0%,transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-[1000px] bg-[radial-gradient(circle_at_100%_100%,#FFD700_0%,transparent_50%)]"></div>
      </div>

      <div className="relative mx-auto min-h-full pb-64 pt-20" style={{ height: TOTAL_HEIGHT }}>
        
        {/* Progress HUD - Desktop Only */}
        <div className="fixed top-24 right-10 z-50 hidden lg:block animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined !text-3xl">map</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Your Quest</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{activeIndex} / {tasks.length} Completed</p>
                    </div>
                </div>
                <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${(activeIndex / Math.max(1, tasks.length)) * 100}%` }}
                    />
                </div>
            </div>
        </div>

        {/* Quest SVG Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <filter id="pathGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="100%">
                <stop offset="0%" stopColor="#FF5F5F" />
                <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          
          {/* Main Quest Line */}
          {tasks.map((_, i) => {
            if (i === tasks.length - 1) return null;
            const current = getPosition(i);
            const next = getPosition(i + 1);
            const isCompletedSegment = i < activeIndex;
            
            return (
              <path 
                key={`path-${i}`}
                d={`M ${current.x} ${current.y} ${getControlPoint(i, current, next)} ${next.x} ${next.y}`}
                fill="none"
                stroke={isCompletedSegment ? "url(#lineGrad)" : "#e2e8f0"}
                strokeWidth={isCompletedSegment ? "14" : "10"}
                strokeDasharray={isCompletedSegment ? "none" : "12 12"}
                strokeLinecap="round"
                className={`transition-all duration-700 ${isCompletedSegment ? 'opacity-100' : 'opacity-40 dark:opacity-20'}`}
                style={{ filter: isCompletedSegment ? 'url(#pathGlow)' : 'none' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {tasks.map((task, i) => {
          const pos = getPosition(i);
          const isCompleted = task.status === TaskStatus.COMPLETED;
          const isActive = i === activeIndex;
          const isLocked = i > activeIndex;
          const biome = getBiome(i);

          return (
            <div 
              key={task.id}
              className={`quest-node absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group`}
              style={{ left: pos.x, top: pos.y }}
            >
               {/* Current Player Indicator */}
               {isActive && (
                 <div className="absolute -top-20 z-20 flex flex-col items-center">
                    <div className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg mb-2 animate-bounce">
                        You are here
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-4 border-primary shadow-2xl flex items-center justify-center overflow-hidden animate-pulse">
                        <span className="material-symbols-outlined !text-3xl text-primary">person_pin_circle</span>
                    </div>
                 </div>
               )}

              {/* Node Visual */}
              <div 
                onClick={() => onTaskClick(task)}
                className={`
                   relative transition-all duration-500 cursor-pointer
                   ${isActive ? 'scale-125 z-20' : 'hover:scale-110'}
                   ${isLocked ? 'grayscale opacity-50' : ''}
                `}
              >
                  {/* Floating Biome Decoration */}
                  <div className={`absolute -left-12 -top-12 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <span className={`material-symbols-outlined !text-4xl ${biome.color} opacity-40`}>{biome.icon}</span>
                  </div>

                  {/* Main Platform */}
                  <div className={`
                    w-24 h-24 rounded-[2rem] rotate-45 shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center border-4 transition-all
                    ${isCompleted 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-300' 
                        : isActive 
                            ? 'bg-white dark:bg-slate-800 border-primary shadow-2xl shadow-primary/20' 
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }
                  `}>
                       {/* Icon (rotated back) */}
                       <div className="-rotate-45 flex items-center justify-center">
                            <span className={`material-symbols-outlined !text-4xl transition-all duration-500
                                ${isCompleted ? 'text-white' : isActive ? 'text-primary' : 'text-slate-400'}
                            `}>
                                {isCompleted ? 'check_circle' : isLocked ? 'lock' : (task.categoryIcon || 'stars')}
                            </span>
                       </div>
                  </div>

                  {/* Step Marker */}
                  <div className={`
                    absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-4 border-white dark:border-slate-900 z-10 shadow-lg
                    ${isCompleted ? 'bg-emerald-600 text-white' : isActive ? 'bg-primary text-white' : 'bg-slate-700 text-white'}
                  `}>
                      {i + 1}
                  </div>
              </div>

              {/* Task Detail Card - Optimized for Mobile */}
              <div 
                onClick={() => onTaskClick(task)}
                className={`
                    mt-10 px-6 py-4 rounded-[2rem] backdrop-blur-xl shadow-2xl border w-64 text-center transition-all cursor-pointer group-hover:translate-y-[-4px]
                    ${isActive 
                        ? 'bg-white/95 dark:bg-slate-900/95 border-primary/20 shadow-primary/10' 
                        : 'bg-white/70 dark:bg-slate-900/70 border-white/40 dark:border-slate-800 shadow-sm'
                    }
                `}
              >
                 <div className="flex flex-col gap-1">
                     <span className={`text-sm font-black tracking-tight leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                       {task.title}
                     </span>
                     {task.dueDate && !isCompleted && (
                         <div className="flex items-center justify-center gap-1.5 mt-2">
                             <span className="material-symbols-outlined !text-[14px] text-primary">schedule</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{task.dueDate}</span>
                         </div>
                     )}
                 </div>
              </div>

              {/* Quick Toggle Fab */}
              {!isLocked && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
                    className={`
                        absolute -right-16 top-0 w-12 h-12 rounded-2xl shadow-xl transition-all scale-0 group-hover:scale-100 flex items-center justify-center active:scale-90
                        ${isCompleted ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}
                    `}
                >
                    <span className="material-symbols-outlined !text-2xl">
                        {isCompleted ? 'history' : 'done_all'}
                    </span>
                </button>
              )}
            </div>
          );
        })}
        
        {/* Victory Celebration Area */}
        <div 
           className="absolute transform -translate-x-1/2 left-1/2 flex flex-col items-center"
           style={{ top: (tasks.length * ITEM_HEIGHT) + 250 }}
        >
            <div className="relative group">
                <div className="absolute inset-0 bg-accent rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-accent/20 shadow-2xl flex flex-col items-center">
                    <span className="material-symbols-outlined !text-8xl text-accent animate-pulse">trophy</span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-6 uppercase tracking-tighter">Day Complete</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">The summit reached</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdventureView;
