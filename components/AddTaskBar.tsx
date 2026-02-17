
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      submitTask();
    }
  };

  const submitTask = () => {
    if (!inputValue.trim()) return;
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
  };

  const handleAiTaskCreation = async () => {
    if (!inputValue.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
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
      console.error(e);
      submitTask();
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
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate.toDateString() === tomorrow.toDateString()) return 'Tom.';
    return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderCustomCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
          <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(year, month - 1, 1)); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><span className="material-symbols-outlined !text-sm">chevron_left</span></button>
          <span className="text-[10px] font-bold dark:text-slate-300">{calendarViewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(year, month + 1, 1)); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><span className="material-symbols-outlined !text-sm">chevron_right</span></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">{weekDays.map(d => <span key={d} className="text-[8px] text-slate-400 font-bold">{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-0.5">{days}</div>
        <button onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(false); }} className="w-full mt-2 py-1 text-[10px] text-slate-500 hover:text-primary font-semibold flex items-center justify-center gap-1">Back</button>
      </div>
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex justify-center pointer-events-none z-[60]">
      <div className={`
        relative w-full max-w-3xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.5)] border border-white/40 dark:border-slate-800/50 p-2 sm:p-2.5 pointer-events-auto transition-all duration-500
        ${isThinking ? 'ring-2 ring-purple-500/30' : ''}
      `}>
        <div className="relative flex items-center gap-2">
          {/* Action Icon Left */}
          <div className="flex items-center justify-center pl-4 pr-1">
            <div className={`transition-all duration-300 ${inputValue.trim() ? 'scale-110' : 'scale-100'}`}>
              <span className={`material-symbols-outlined !text-[24px] sm:!text-[28px] ${inputValue.trim() ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                {isThinking ? 'slow_motion_video' : 'add_circle'}
              </span>
            </div>
          </div>

          {/* Input Area */}
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
            className="flex-1 bg-transparent border-none py-4 sm:py-5 text-sm sm:text-lg focus:ring-0 placeholder-slate-400 dark:text-white font-bold transition-all min-w-0"
            placeholder={isThinking ? "Magic in progress..." : "Anything on your mind?"}
          />

          {/* Actions Right */}
          <div className="flex items-center gap-1 sm:gap-2 pr-2">
            {selectedDate && (
              <div className="hidden xs:flex items-center gap-1 bg-primary/10 text-primary px-3 py-2 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest animate-in zoom-in duration-300">
                <span>{getButtonLabel()}</span>
                <button onClick={() => setSelectedDate(null)} className="flex items-center hover:bg-primary/20 rounded-full p-0.5 transition-colors"><span className="material-symbols-outlined !text-[14px]">close</span></button>
              </div>
            )}

            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`p-2.5 sm:p-3 rounded-full transition-all ${showCalendar || selectedDate ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Add due date"
              >
                <span className="material-symbols-outlined !text-[20px] sm:!text-[24px]">calendar_today</span>
              </button>

              {showCalendar && (
                <div className={`absolute bottom-full right-0 mb-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-1 transition-all animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 ${isCustomDateOpen ? 'w-72' : 'w-56'} max-w-[90vw]`}>
                  {!isCustomDateOpen ? (
                    <div className="space-y-1">
                      <button onClick={() => handleDateSelect(0)} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl w-full text-left transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                          <span className="material-symbols-outlined !text-[24px]">today</span>
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Today</span>
                      </button>
                      <button onClick={() => handleDateSelect(1)} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl w-full text-left transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-400">
                          <span className="material-symbols-outlined !text-[24px]">calendar_today</span>
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Tomorrow</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(true); }} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl w-full text-left transition-all border-t border-slate-50 dark:border-slate-700 mt-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined !text-[24px]">edit_calendar</span>
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Pick Date</span>
                      </button>
                    </div>
                  ) : renderCustomCalendar()}
                </div>
              )}
            </div>

            <button
              onClick={() => setHasNotification(!hasNotification)}
              className={`p-2.5 sm:p-3 rounded-full transition-all ${hasNotification ? 'bg-accent text-slate-900 shadow-xl shadow-accent/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Set notification"
            >
              <span className={`material-symbols-outlined !text-[20px] sm:!text-[24px] ${hasNotification ? 'filled' : ''}`}>notifications</span>
            </button>

            <button
              onClick={handleAiTaskCreation}
              disabled={isThinking || !inputValue.trim()}
              className={`p-2.5 sm:p-3 rounded-full transition-all ${isThinking ? 'bg-purple-600 text-white animate-pulse' : inputValue.trim() ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:scale-110' : 'text-slate-300 dark:text-slate-700'}`}
              title="AI Magic Breakdown"
            >
              <span className={`material-symbols-outlined !text-[20px] sm:!text-[24px] ${isThinking ? 'animate-spin' : ''}`}>
                {isThinking ? 'sync' : 'auto_awesome'}
              </span>
            </button>

            {inputValue.trim() && !isThinking && (
              <button
                onClick={submitTask}
                className="ml-1 sm:ml-2 bg-primary text-white w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-right-6 duration-500 flex-shrink-0"
              >
                <span className="material-symbols-outlined !text-[22px] sm:!text-[28px] font-black">arrow_upward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AddTaskBar;
