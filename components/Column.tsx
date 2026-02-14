import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, SortOption, TaskPriority } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  colorClass: string;
  sortBy?: SortOption;
  onToggleStatus: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onSortChange?: (option: SortOption) => void;
  viewMode: 'board' | 'table';
}

const Column: React.FC<ColumnProps> = ({ 
  id,
  title, 
  tasks, 
  colorClass, 
  sortBy = SortOption.CREATION,
  onToggleStatus, 
  onToggleImportant,
  onTaskClick,
  onSortChange,
  viewMode
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    switch (sortBy) {
      case SortOption.PRIORITY:
        const priorityMap = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
        return sorted.sort((a, b) => (priorityMap[b.priority || TaskPriority.MEDIUM] || 0) - (priorityMap[a.priority || TaskPriority.MEDIUM] || 0));
      case SortOption.TITLE:
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case SortOption.DUE_DATE:
        const parseDate = (d?: string) => {
            if (!d) return 9999999999999;
            const s = d.toLowerCase();
            if (s.includes('today')) return Date.now();
            if (s.includes('tomorrow')) return Date.now() + 86400000;
            const date = new Date(d.replace('Due ', ''));
            return isNaN(date.getTime()) ? 9999999999999 : date.getTime();
        };
        return sorted.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
      case SortOption.CREATION:
      default:
        return sorted.sort((a, b) => a.id.localeCompare(b.id));
    }
  }, [tasks, sortBy]);

  return (
    <div className={viewMode === 'board' ? "board-column flex flex-col h-full bg-column-bg/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shrink-0 transition-colors duration-200 snap-center" : "w-full flex flex-col bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shrink-0 transition-colors duration-200"}>
      <div className={viewMode === 'board' ? "flex items-center justify-between mb-4 px-2" : "p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"}>
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
          {title}
        </h3>
        <div className="flex items-center gap-2 relative" ref={menuRef}>
            <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              {tasks.length}
            </span>
            <button onClick={() => setShowSortMenu(!showSortMenu)} className={`flex items-center justify-center p-1 rounded-lg transition-all ${showSortMenu ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary shadow-sm'}`}>
                <span className="material-symbols-outlined !text-[16px]">swap_vert</span>
            </button>
            {showSortMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 z-50 animate-in zoom-in-95 duration-150 origin-top-right backdrop-blur-md">
                    <p className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700 mb-1">Sort by</p>
                    {[
                        { label: 'Priority', icon: 'priority_high', option: SortOption.PRIORITY },
                        { label: 'Due Date', icon: 'event', option: SortOption.DUE_DATE },
                        { label: 'Title', icon: 'abc', option: SortOption.TITLE },
                        { label: 'Creation', icon: 'schedule', option: SortOption.CREATION },
                    ].map((item) => (
                        <button key={item.option} onClick={() => { onSortChange?.(item.option); setShowSortMenu(false); }} className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === item.option ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900'}`}>
                            <span className="material-symbols-outlined !text-[16px]">{item.icon}</span>{item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={viewMode === 'board' ? `flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/50' : ''}` : `transition-colors divide-y divide-slate-100 dark:divide-slate-800 ${snapshot.isDraggingOver ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
            {sortedTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onToggleStatus={onToggleStatus} onToggleImportant={onToggleImportant} onClick={onTaskClick} viewMode={viewMode} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className={`${viewMode === 'board' ? 'h-24 border-2 border-dashed' : 'h-16 border-dashed'} border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs font-medium uppercase tracking-wider m-2`}>No Tasks</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;