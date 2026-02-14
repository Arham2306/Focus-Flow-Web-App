import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Task, Subtask } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface AddTaskBarProps {
  onAddTask: (title: string | Partial<Task>, dueDate?: string, hasNotification?: boolean) => void;
}

const AddTaskBar = forwardRef<HTMLInputElement, AddTaskBarProps>(({ onAddTask }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasNotification, setHasNotification] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showCalendar) {
      const timer = setTimeout(() => {
        setIsCustomDateOpen(false);
        setCalendarViewDate(new Date());
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showCalendar]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      let dateStr = undefined;
      if (selectedDate) {
        if (isToday(selectedDate)) dateStr = 'Due today';
        else if (isTomorrow(selectedDate)) dateStr = 'Due tomorrow';
        else dateStr = `Due ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      onAddTask(inputValue.trim(), dateStr, hasNotification);
      setInputValue('');
      setSelectedDate(null);
      setShowCalendar(false);
      setHasNotification(false);
    }
  };

  const handleAiTaskCreation = async () => {
    if (!inputValue.trim()) return;
    setIsThinking(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze: "${inputValue}". Today is ${new Date().toDateString()}. Respond JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                        category: { type: Type.STRING },
                        subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isImportant: { type: Type.BOOLEAN }
                    }
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        const formattedSubtasks = data.subtasks?.map((t: string) => ({ id: Date.now().toString() + Math.random(), title: t, isCompleted: false }));
        onAddTask({ ...data, subtasks: formattedSubtasks, title: data.title || inputValue });
        setInputValue(''); setSelectedDate(null); setHasNotification(false);
    } catch (e) {
        console.error(e); onAddTask(inputValue, undefined, hasNotification); setInputValue('');
    } finally { setIsThinking(false); }
  };

  const isToday = (date: Date) => { const today = new Date(); return date.toDateString() === today.toDateString(); };
  const isTomorrow = (date: Date) => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return date.toDateString() === tomorrow.toDateString(); };

  const handleDateSelect = (offsetDays: number) => {
    const date = new Date(); date.setDate(date.getDate() + offsetDays);
    setSelectedDate(date); setShowCalendar(false);
  };

  const getButtonLabel = () => {
    if (!selectedDate) return '';
    if (isToday(selectedDate)) return 'Today';
    if (isTomorrow(selectedDate)) return 'Tom.';
    return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderCustomCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    const weekDays = ['S','M','T','W','T','F','S'];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
        const isTodayDate = new Date().toDateString() === date.toDateString();
        days.push(<button key={d} onClick={(e) => { e.stopPropagation(); setSelectedDate(date); setShowCalendar(false); }} className={`aspect-square text-[10px] sm:text-xs rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} ${isTodayDate && !isSelected ? 'text-primary font-bold border border-primary/30' : ''}`}>{d}</button>);
    }
    return (
        <div className="p-1">
             <div className="flex items-center justify-between mb-2">
                <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(year, month - 1, 1)); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><span className="material-symbols-outlined !text-sm">chevron_left</span></button>
                <span className="text-[10px] font-bold">{calendarViewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(year, month + 1, 1)); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><span className="material-symbols-outlined !text-sm">chevron_right</span></button>
             </div>
             <div className="grid grid-cols-7 gap-0.5 text-center mb-1">{weekDays.map(d => <span key={d} className="text-[8px] text-slate-400 font-bold">{d}</span>)}</div>
             <div className="grid grid-cols-7 gap-0.5">{days}</div>
             <button onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(false); }} className="w-full mt-2 py-1 text-[10px] text-slate-500 hover:text-primary font-semibold flex items-center justify-center gap-1">Back</button>
        </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 relative z-20">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-2.5 sm:left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined !text-[20px] sm:!text-[24px] text-primary">add_circle</span>
          </div>
          <input 
            ref={ref} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={isThinking}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 sm:py-3 pl-9 sm:pl-12 pr-28 sm:pr-36 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 placeholder-slate-400 dark:text-white transition-all font-medium"
            placeholder="Add a task..."
          />
          <div className="absolute inset-y-0 right-1.5 sm:right-4 flex items-center gap-0.5 sm:gap-2">
            {selectedDate && (
               <div className="flex items-center gap-0.5 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] sm:text-xs font-bold whitespace-nowrap">
                 <span>{getButtonLabel()}</span>
                 <button onClick={() => setSelectedDate(null)} className="flex items-center"><span className="material-symbols-outlined !text-[12px]">close</span></button>
               </div>
            )}
            <div className="relative" ref={calendarRef}>
                <button onClick={() => setShowCalendar(!showCalendar)} className={`p-1 sm:p-1.5 rounded-lg ${showCalendar || selectedDate ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100'}`}>
                  <span className="material-symbols-outlined !text-[18px] sm:!text-[20px]">calendar_today</span>
                </button>
                {showCalendar && (
                  <div className={`absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1 transition-all ${isCustomDateOpen ? 'w-60' : 'w-48'} max-w-[85vw]`}>
                    {!isCustomDateOpen ? (
                      <div>
                        <button onClick={() => handleDateSelect(0)} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg w-full">
                          <span className="material-symbols-outlined !text-base text-green-500">today</span>
                          <span className="text-[10px] sm:text-xs font-semibold">Today</span>
                        </button>
                        <button onClick={() => handleDateSelect(1)} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg w-full">
                          <span className="material-symbols-outlined !text-base text-orange-400">wb_sunny</span>
                          <span className="text-[10px] sm:text-xs font-semibold">Tomorrow</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(true); }} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg w-full border-t border-slate-50 dark:border-slate-700 mt-1">
                          <span className="material-symbols-outlined !text-base text-slate-400">edit_calendar</span>
                          <span className="text-[10px] sm:text-xs font-semibold">Custom</span>
                        </button>
                      </div>
                    ) : renderCustomCalendar()}
                  </div>
                )}
            </div>
            <button onClick={() => setHasNotification(!hasNotification)} className={`p-1 sm:p-1.5 rounded-lg ${hasNotification ? 'bg-accent text-slate-900' : 'text-slate-400'}`}>
              <span className={`material-symbols-outlined !text-[18px] sm:!text-[20px] ${hasNotification ? 'filled' : ''}`}>notifications</span>
            </button>
            <button onClick={handleAiTaskCreation} disabled={isThinking || !inputValue.trim()} className={`p-1 sm:p-1.5 rounded-lg ${isThinking ? 'bg-purple-100 text-purple-600 animate-pulse' : 'text-purple-500'}`}>
                <span className={`material-symbols-outlined !text-[18px] sm:!text-[20px] ${isThinking ? 'animate-spin' : ''}`}>{isThinking ? 'refresh' : 'auto_awesome'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AddTaskBar;