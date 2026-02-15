import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggleStatus: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onClick: (task: Task) => void;
  viewMode: 'board' | 'table';
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onToggleStatus, onToggleImportant, onClick, viewMode }) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;

  const getPriorityBadge = (priority?: TaskPriority) => {
    if (!priority) return null;
    const colors = {
        [TaskPriority.HIGH]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        [TaskPriority.MEDIUM]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        [TaskPriority.LOW]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return (
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${colors[priority]}`}>
            {priority}
        </span>
    );
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          onClick={() => onClick(task)}
          className={
            viewMode === 'board'
            ? `bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 group hover:border-primary/30 dark:hover:border-primary/50 cursor-pointer
                ${isCompleted ? 'bg-white/60 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-600' : ''}
                ${snapshot.isDragging ? 'shadow-lg rotate-2 ring-2 ring-primary/20 z-50' : 'transition-colors'}`
            : `bg-white dark:bg-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group
               ${isCompleted ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''}
               ${snapshot.isDragging ? 'shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 z-50' : 'transition-colors'}`
          }
        >
          <div className={`flex ${viewMode === 'board' ? 'items-start gap-3' : 'items-center gap-4'}`}>
            <div className={`flex-shrink-0 ${viewMode === 'board' ? 'mt-0.5' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={isCompleted} 
                  onChange={() => onToggleStatus(task.id)} 
                  onClick={(e) => e.stopPropagation()} 
                  className={`task-checkbox h-5 w-5 rounded-full border-2 focus:ring-primary focus:ring-offset-0 bg-transparent cursor-pointer transition-all shrink-0 ${isCompleted ? 'border-primary text-primary' : 'border-slate-200 dark:border-slate-600 text-primary'}`} 
                />
            </div>
            <div className={`flex-1 min-w-0 ${viewMode === 'table' ? 'grid grid-cols-1 md:grid-cols-12 gap-2 items-center' : 'flex flex-col gap-1'}`}>
                <div className={viewMode === 'table' ? 'md:col-span-8' : ''}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold text-slate-800 dark:text-slate-200 truncate ${isCompleted ? 'line-through decoration-slate-400' : ''}`}>
                          {task.title}
                        </span>
                        {task.priority && getPriorityBadge(task.priority)}
                    </div>
                    {(viewMode === 'board' && task.description) && <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 ${isCompleted ? 'opacity-50' : ''}`}>{task.description}</p>}
                    {(viewMode === 'table' && task.description) && <p className="text-xs text-slate-400 dark:text-slate-500 truncate hidden sm:block">{task.description}</p>}
                </div>
                <div className={`flex items-center gap-3 flex-wrap ${viewMode === 'table' ? 'md:col-span-4 justify-end' : 'mt-1'}`}>
                    {task.category && task.category.toLowerCase() !== 'completed' && (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-1 font-black uppercase tracking-widest shrink-0">
                          {task.categoryIcon && <span className="material-symbols-outlined !text-[14px]">{task.categoryIcon}</span>}
                          {task.category}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider shrink-0">
                          <span className="material-symbols-outlined !text-[14px]">event</span>
                          {task.dueDate}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-green-500 dark:text-green-400 text-[10px] flex items-center gap-1 font-black uppercase tracking-widest shrink-0">
                          <span className="material-symbols-outlined !text-[14px]">done_all</span>
                          Completed
                      </span>
                    )}
                    {task.hasNotification && (
                      <span className="material-symbols-outlined !text-[14px] text-slate-400 dark:text-slate-500 filled">notifications</span>
                    )}
                </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleImportant(task.id); }} 
              className={`transition-colors shrink-0 ${task.isImportant ? 'text-primary' : 'text-slate-200 dark:text-slate-600 hover:text-primary'}`}
            >
              <span className={`material-symbols-outlined !text-xl ${task.isImportant ? 'filled' : ''}`}>star</span>
            </button>
          </div>
          {viewMode === 'board' && task.subtasks && task.subtasks.length > 0 && (
            <div className={`mt-3 space-y-2 pl-8 ${isCompleted ? 'opacity-50' : ''} w-full`}>
                {task.subtasks.slice(0, 2).map(st => (
                     <div key={st.id} className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-4 h-4 shrink-0 rounded-full ${st.isCompleted ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                          <span className="material-symbols-outlined !text-[16px]">{st.isCompleted ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </div>
                        <span className={`text-xs font-medium truncate ${st.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                          {st.title}
                        </span>
                     </div>
                ))}
                {task.subtasks.length > 2 && (
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-6">
                    + {task.subtasks.length - 2} more steps
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;