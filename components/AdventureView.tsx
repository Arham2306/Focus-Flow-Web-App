import React, { useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus } from '../types';

interface AdventureViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

const AdventureView: React.FC<AdventureViewProps> = ({ tasks, onTaskClick, onToggleStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the index of the first incomplete task (The "Current Level")
  const activeIndex = useMemo(() => {
    const idx = tasks.findIndex(t => t.status === TaskStatus.TODO);
    return idx === -1 ? tasks.length : idx; // If all done, player is at the end
  }, [tasks]);

  // Auto-scroll to active level on mount
  useEffect(() => {
    if (containerRef.current && activeIndex > 0 && activeIndex < tasks.length) {
      const y = (activeIndex * 160) + 100;
      containerRef.current.scrollTo({ top: y - window.innerHeight / 2 + 100, behavior: 'smooth' });
    }
  }, [activeIndex, tasks.length]);

  const ITEM_HEIGHT = 160; 
  const AMPLITUDE = 80; 
  const TOTAL_HEIGHT = Math.max(800, tasks.length * ITEM_HEIGHT + 300);

  const getPosition = (index: number) => {
    const y = (index * ITEM_HEIGHT) + 150;
    // Use a slightly more complex curve for variety
    const xOffset = Math.sin(index * 1.2) * AMPLITUDE;
    return { x: `calc(50% + ${xOffset}px)`, y, rawX: xOffset };
  };

  const getControlPoint = (i: number, current: {rawX: number, y: number}, next: {rawX: number, y: number}) => {
     // Calculate bezier control point for smooth curve
     const midY = (current.y + next.y) / 2;
     // Exaggerate the curve slightly
     const cpX = (current.rawX + next.rawX) / 2 + (i % 2 === 0 ? 60 : -60); 
     return `Q calc(50% + ${cpX}px) ${midY}`;
  };

  // Generate Decoration positions based on seed (index)
  const getDecorations = (index: number) => {
    const y = (index * ITEM_HEIGHT) + 150;
    const isLeft = Math.sin(index * 1.2) > 0; // If path is right, put deco left
    const decoX = isLeft ? '15%' : '85%';
    const icons = ['forest', 'landscape', 'filter_drama', 'grass', 'nature', 'wb_sunny'];
    const icon = icons[(index * 7) % icons.length];
    const size = 20 + (index * 3) % 20;
    
    // Randomize slightly
    const randomY = y + ((index * 13) % 60) - 30;
    
    return { icon, top: randomY, left: decoX, size };
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-950 custom-scrollbar scroll-smooth"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {tasks.map((_, i) => {
              const deco = getDecorations(i);
              return (
                  <div 
                    key={`deco-${i}`} 
                    className="absolute text-slate-300 dark:text-slate-800 transition-all duration-1000"
                    style={{ top: deco.top, left: deco.left, transform: 'translateX(-50%)' }}
                  >
                      <span className="material-symbols-outlined" style={{ fontSize: deco.size * 2 }}>{deco.icon}</span>
                  </div>
              );
          })}
      </div>

      <div className="relative max-w-lg mx-auto min-h-full pb-48" style={{ height: TOTAL_HEIGHT }}>
        
        {/* Start Flag (Top) */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
             <div className="w-1 h-12 bg-slate-300 dark:bg-slate-700"></div>
             <div className="absolute top-0 left-1/2 w-8 h-6 bg-primary rounded-r-md skew-y-6 origin-left shadow-sm"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Start</span>
        </div>

        {/* SVG Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>
          
          {/* Main Path Line */}
          {tasks.map((_, i) => {
            if (i === tasks.length - 1) return null;
            const current = getPosition(i);
            const next = getPosition(i + 1);
            
            // Determine segment color based on completion
            const isCompletedSegment = i < activeIndex;
            
            return (
              <path 
                key={`path-${i}`}
                d={`M ${current.x} ${current.y} ${getControlPoint(i, current, next)} ${next.x} ${next.y}`}
                fill="none"
                stroke={isCompletedSegment ? "#4ade80" : "#cbd5e1"}
                strokeWidth={isCompletedSegment ? "12" : "10"}
                strokeDasharray={isCompletedSegment ? "none" : "15 15"}
                strokeLinecap="round"
                className={`transition-colors duration-500 ${isCompletedSegment ? 'dark:stroke-green-500/50' : 'dark:stroke-slate-700'}`}
              />
            );
          })}
        </svg>

        {/* Levels */}
        {tasks.map((task, i) => {
          const pos = getPosition(i);
          const isCompleted = task.status === TaskStatus.COMPLETED;
          const isActive = i === activeIndex;
          const isLocked = i > activeIndex;

          return (
            <div 
              key={task.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group transition-all duration-500`}
              style={{ left: pos.x, top: pos.y }}
            >
               {/* Avatar for Active Level */}
               {isActive && (
                 <div className="absolute -top-16 z-20 animate-bounce">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-4 border-primary shadow-xl flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined !text-3xl text-primary">face</span>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary"></div>
                    </div>
                 </div>
               )}

              {/* The Node Platform */}
              <div 
                onClick={() => onTaskClick(task)}
                className={`
                   relative transition-all duration-300 cursor-pointer
                   ${isActive ? 'scale-110' : 'hover:scale-105'}
                   ${isLocked ? 'grayscale opacity-80' : ''}
                `}
              >
                  {/* Outer Ring/Shadow */}
                  <div className={`
                    w-20 h-20 rounded-2xl rotate-45 shadow-[0_10px_20px_rgba(0,0,0,0.15)] flex items-center justify-center border-[6px] transition-colors
                    ${isCompleted 
                        ? 'bg-green-400 border-green-500 shadow-green-200 dark:shadow-green-900/20' 
                        : isActive 
                            ? 'bg-white dark:bg-slate-800 border-primary shadow-primary/30' 
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                    }
                  `}>
                       {/* Inner Icon Container (Counter-rotated to be upright) */}
                       <div className="-rotate-45 flex items-center justify-center">
                            <span className={`material-symbols-outlined !text-4xl transition-all duration-500
                                ${isCompleted ? 'text-white scale-110' : isActive ? 'text-primary animate-pulse' : 'text-slate-400'}
                            `}>
                                {isCompleted ? 'flag' : isLocked ? 'lock' : (task.categoryIcon || 'star')}
                            </span>
                       </div>
                  </div>

                  {/* Level Badge */}
                  <div className={`
                    absolute -bottom-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-4 border-white dark:border-slate-900 z-10
                    ${isCompleted ? 'bg-green-600 text-white' : 'bg-slate-700 text-white'}
                  `}>
                      {i + 1}
                  </div>
              </div>

              {/* Title Card */}
              <div 
                onClick={() => onTaskClick(task)}
                className={`
                    mt-6 px-4 py-2 rounded-xl backdrop-blur-md shadow-sm border max-w-[200px] text-center transition-all cursor-pointer
                    ${isActive 
                        ? 'bg-white/90 dark:bg-slate-800/90 border-primary/30 scale-105 shadow-primary/10' 
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white hover:scale-105'
                    }
                `}
              >
                 <span className={`text-xs font-bold line-clamp-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                   {task.title}
                 </span>
                 {task.dueDate && !isCompleted && (
                     <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{task.dueDate}</span>
                 )}
              </div>
              
              {/* Floating Action Button (Completion) */}
              {!isLocked && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
                    className={`
                        absolute -right-12 top-0 p-2 rounded-full shadow-lg transition-all scale-0 group-hover:scale-100 origin-left
                        ${isCompleted ? 'bg-orange-400 text-white hover:bg-orange-500' : 'bg-green-500 text-white hover:bg-green-600'}
                    `}
                    title={isCompleted ? "Replay Level" : "Complete Level"}
                >
                    <span className="material-symbols-outlined !text-xl">
                        {isCompleted ? 'replay' : 'check'}
                    </span>
                </button>
              )}

            </div>
          );
        })}
        
        {/* End of Road Graphic */}
        <div 
           className="absolute transform -translate-x-1/2 left-1/2 flex flex-col items-center opacity-60"
           style={{ top: (tasks.length * ITEM_HEIGHT) + 200 }}
        >
            <div className="w-24 h-24 bg-yellow-400/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <span className="material-symbols-outlined !text-7xl text-yellow-500 drop-shadow-lg">trophy</span>
            <span className="text-sm font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mt-2">Victory!</span>
        </div>

      </div>
    </div>
  );
};

export default AdventureView;