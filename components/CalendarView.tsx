import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { formatDateKey, parseDueDateToKey } from '../utils/dateUtils';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick, onToggleStatus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];

    // Fill previous month days
    const firstDay = date.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Fill current month days
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Fill next month days
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      let key = task.dueDateKey;

      if (!key && task.dueDateISO) {
        const date = new Date(task.dueDateISO);
        if (!Number.isNaN(date.getTime())) {
          key = formatDateKey(date);
        }
      }

      if (!key && task.dueDate) {
        key = parseDueDateToKey(task.dueDate);
      }

      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-500">
      <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between sm:w-auto sm:justify-start gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
            </button>
            <button onClick={goToToday} className="px-3 text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-primary">Today</button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="min-w-[560px] sm:min-w-[700px] h-full flex flex-col pb-32 sm:pb-40">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {weekDays.map(day => (
              <div key={day} className="py-2 sm:py-3 text-center text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.14em] sm:tracking-[0.2em]">
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {daysInMonth.map((day: { date: Date; isCurrentMonth: boolean }, idx: number) => {
              const dateKey = formatDateKey(day.date);
              const dayTasks = tasksByDate[dateKey] || [];
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 border-r border-b border-slate-50 dark:border-slate-800/50 flex flex-col gap-1 transition-colors
                    ${!day.isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}
                  `}
                >
                  <div className="flex justify-end">
                    <span className={`text-[10px] sm:text-xs font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-primary text-white' : day.isCurrentMonth ? 'text-slate-600 dark:text-slate-400' : 'text-inherit'}
                    `}>
                      {day.date.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                    {dayTasks.map((task: Task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`group flex items-center gap-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent
                          ${task.status === 'COMPLETED' ? 'bg-slate-50 dark:bg-slate-800/50 opacity-60' : 'bg-white dark:bg-slate-800 shadow-sm hover:border-primary/30'}
                        `}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'COMPLETED' ? 'bg-slate-300' : task.isImportant ? 'bg-red-500' : 'bg-primary'}`}></div>
                        <span className={`text-[9px] sm:text-[10px] font-bold truncate flex-1 ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {task.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

