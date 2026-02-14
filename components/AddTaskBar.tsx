import React, { useState, useRef, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface AddTaskBarProps {
  onAddTask: (title: string | Partial<Task>, dueDate?: string, hasNotification?: boolean) => void;
}

const AddTaskBar: React.FC<AddTaskBarProps> = ({ onAddTask }) => {
  const [inputValue, setInputValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasNotification, setHasNotification] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Custom Calendar State
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

  // Reset custom calendar state when dropdown closes
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
      // Format the date as a readable string if it exists
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
            contents: `Analyze this task request and extract structured data.
            Request: "${inputValue}"
            Current Date: ${new Date().toDateString()}
            
            Extract:
            - Title
            - Description (if detailed info provided)
            - Due Date (as a natural string like 'Due tomorrow', 'Due next Friday', or formatted date. Default to 'Due today' if implies immediate)
            - Priority (LOW, MEDIUM, HIGH)
            - Category (Infer context: Work, Personal, Health, Finance, etc.)
            - Subtasks (List of steps if the task implies multiple actions)
            - isImportant (Boolean, true if user says "important", "urgent", "star", "priority")
            
            Respond in JSON.`,
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
        
        // Transform subtasks string[] to Subtask object[]
        const formattedSubtasks = data.subtasks?.map((t: string) => ({
            id: Date.now().toString() + Math.random(),
            title: t,
            isCompleted: false
        }));

        const taskData: Partial<Task> = {
            title: data.title || inputValue,
            description: data.description,
            dueDate: data.dueDate,
            priority: data.priority as any,
            category: data.category,
            subtasks: formattedSubtasks,
            isImportant: data.isImportant,
            hasNotification: hasNotification // Mix manual override
        };

        onAddTask(taskData);
        setInputValue('');
        setSelectedDate(null);
        setHasNotification(false);

    } catch (e) {
        console.error("AI Task Generation Failed", e);
        // Fallback
        onAddTask(inputValue, undefined, hasNotification);
        setInputValue('');
    } finally {
        setIsThinking(false);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  };

  const handleDateSelect = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const getButtonLabel = () => {
    if (!selectedDate) return '';
    if (isToday(selectedDate)) return 'Today';
    if (isTomorrow(selectedDate)) return 'Tomorrow';
    return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderCustomCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    
    // Day 0 is the last day of the previous month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days = [];
    const weekDays = ['S','M','T','W','T','F','S'];

    // Empty slots for start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        
        // Check matching date (ignoring time)
        const isSelected = selectedDate && 
                           date.toDateString() === selectedDate.toDateString();
        const isTodayDate = new Date().toDateString() === date.toDateString();

        days.push(
            <button 
                key={d} 
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(date);
                    setShowCalendar(false);
                }}
                className={`aspect-square text-xs rounded-full flex items-center justify-center transition-all
                    ${isSelected ? 'bg-primary text-white font-bold shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                    ${isTodayDate && !isSelected ? 'text-primary font-bold border border-primary/30' : ''}
                `}
            >
                {d}
            </button>
        );
    }

    const changeMonth = (offset: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCalendarViewDate(new Date(year, month + offset, 1));
    };

    return (
        <div className="p-1 animate-in slide-in-from-right-4 duration-200">
             <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={(e) => changeMonth(-1, e)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined !text-lg">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={(e) => changeMonth(1, e)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined !text-lg">chevron_right</span>
                </button>
             </div>
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map(d => (
                    <span key={d} className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{d}</span>
                ))}
             </div>
             <div className="grid grid-cols-7 gap-1 mb-2">
                {days}
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(false); }}
                className="w-full mt-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
             >
                <span className="material-symbols-outlined !text-sm">arrow_back</span>
                Back to presets
             </button>
        </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 relative z-20 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 lg:left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform">
              add_circle
            </span>
          </div>
          <input 
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 lg:pl-12 pr-32 lg:pr-36 text-sm focus:ring-2 focus:ring-primary/20 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white transition-all font-medium"
            placeholder="Add a task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
          />
          <div className="absolute inset-y-0 right-2 lg:right-4 flex items-center gap-1 lg:gap-2">
            {selectedDate && (
               <div className="hidden sm:flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold whitespace-nowrap animate-in fade-in zoom-in duration-200">
                 <span>{getButtonLabel()}</span>
                 <button onClick={() => setSelectedDate(null)} className="hover:text-red-600 flex items-center">
                    <span className="material-symbols-outlined !text-[14px]">close</span>
                 </button>
               </div>
            )}
            
            <div className="relative" ref={calendarRef}>
                <button 
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`p-1.5 rounded-lg transition-colors shadow-none hover:shadow-sm ${showCalendar || selectedDate ? 'bg-primary/10 text-primary' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'}`}
                >
                  <span className="material-symbols-outlined !text-[20px]">calendar_today</span>
                </button>

                {showCalendar && (
                  <div className={`absolute bottom-full right-0 mb-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 transition-all ${isCustomDateOpen ? 'w-72' : 'w-56'} max-w-[85vw]`}>
                    
                    {!isCustomDateOpen ? (
                      <div className="animate-in slide-in-from-left-4 duration-200">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">Due Date</div>
                        <button onClick={() => handleDateSelect(0)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left group w-full transition-colors">
                          <span className="material-symbols-outlined !text-lg text-green-500">today</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Today</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          </div>
                        </button>
                        <button onClick={() => handleDateSelect(1)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left group w-full transition-colors">
                          <span className="material-symbols-outlined !text-lg text-orange-400">wb_sunny</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tomorrow</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          </div>
                        </button>
                        <button onClick={() => handleDateSelect(7)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left group w-full transition-colors">
                          <span className="material-symbols-outlined !text-lg text-purple-500">next_week</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Next Week</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </button>
                        
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsCustomDateOpen(true); }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left group w-full transition-colors"
                        >
                          <span className="material-symbols-outlined !text-lg text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">edit_calendar</span>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Pick a Date</span>
                        </button>
                      </div>
                    ) : (
                      renderCustomCalendar()
                    )}

                  </div>
                )}
            </div>
            
            <button 
                onClick={() => setHasNotification(!hasNotification)}
                className={`p-1.5 rounded-lg transition-colors shadow-none hover:shadow-sm ${hasNotification ? 'bg-accent text-slate-900' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'}`}
                title={hasNotification ? "Reminders on" : "Reminders off"}
            >
              <span className={`material-symbols-outlined !text-[20px] ${hasNotification ? 'filled' : ''}`}>notifications</span>
            </button>
            
            {/* AI Magic Button */}
            <button 
                onClick={handleAiTaskCreation}
                disabled={isThinking || !inputValue.trim()}
                className={`p-1.5 rounded-lg transition-all shadow-none hover:shadow-sm flex items-center justify-center
                    ${isThinking 
                        ? 'bg-purple-100 text-purple-600 animate-pulse' 
                        : 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                    }
                    ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Magic AI Add"
            >
                <span className={`material-symbols-outlined !text-[20px] ${isThinking ? 'animate-spin' : ''}`}>
                    {isThinking ? 'refresh' : 'auto_awesome'}
                </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskBar;