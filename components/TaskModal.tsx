
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Task, ColumnData, TaskStatus, Subtask, TaskPriority, ColumnId } from '../types';

interface TaskModalProps {
  task: Task;
  columns: ColumnData[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, columns, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [columnId, setColumnId] = useState(task.columnId);
  const [isImportant, setIsImportant] = useState(task.isImportant);
  const [hasNotification, setHasNotification] = useState(task.hasNotification || false);
  const [status, setStatus] = useState(task.status);
  
  const [category, setCategory] = useState(task.category || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(task.priority || TaskPriority.MEDIUM);

  const [isThinkingDesc, setIsThinkingDesc] = useState(false);
  const [isThinkingSubtasks, setIsThinkingSubtasks] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setColumnId(task.columnId);
    setIsImportant(task.isImportant);
    setHasNotification(task.hasNotification || false);
    setStatus(task.status);
    setCategory(task.category || '');
    setSubtasks(task.subtasks || []);
    setPriority(task.priority || TaskPriority.MEDIUM);
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handleSave = () => {
    let finalColumnId = columnId;
    if (status !== TaskStatus.COMPLETED && dueDate !== task.dueDate) {
      const lowerDate = (dueDate || '').toLowerCase();
      const isFuture = lowerDate.includes('tomorrow') || 
                       lowerDate.includes('next week') || 
                       (lowerDate.startsWith('due ') && !lowerDate.includes('today'));
      const isTodayDate = lowerDate.includes('today');
      if (isFuture) finalColumnId = ColumnId.UPCOMING;
      else if (isTodayDate) finalColumnId = ColumnId.TODAY;
    }
    onUpdate({
      ...task, title, description, dueDate, columnId: finalColumnId,
      isImportant, hasNotification, status, category, subtasks, priority
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };
  
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = { id: Date.now().toString(), title: newSubtaskTitle.trim(), isCompleted: false };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, isCompleted: !st.isCompleted } : st));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleAiDescription = async () => {
    setIsThinkingDesc(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a helpful, concise description (max 2-3 sentences) for a task titled "${title}". Context: Category is ${category || 'General'}, Priority is ${priority}. Do not use markdown formatting.`,
        });
        if (response.text) setDescription(response.text.trim());
    } catch (e) { console.error(e); } finally { setIsThinkingDesc(false); }
  };

  const handleAiSubtasks = async () => {
    setIsThinkingSubtasks(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Break down the task "${title}" into 3-5 simple, actionable subtasks. Priority is ${priority}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const items = JSON.parse(response.text || '[]');
        if (Array.isArray(items)) {
            const newSubtasks = items.map((t: string) => ({ id: Date.now().toString() + Math.random(), title: t, isCompleted: false }));
            setSubtasks(prev => [...prev, ...newSubtasks]);
        }
    } catch (e) { console.error(e); } finally { setIsThinkingSubtasks(false); }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth() && date.getFullYear() === tomorrow.getFullYear();
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Due today';
    if (isTomorrow(date)) return 'Due tomorrow';
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleDateSelect = (date: Date) => {
    setDueDate(formatDueDate(date));
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    const weekDays = ['S','M','T','W','T','F','S'];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const isTodayDate = new Date().toDateString() === date.toDateString();
        days.push(<button key={d} onClick={() => handleDateSelect(date)} className={`aspect-square text-xs rounded-full flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 ${isTodayDate ? 'text-primary font-bold border border-primary/30' : ''}`}>{d}</button>);
    }

    return (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 z-50 w-64 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                 <button onClick={() => handleDateSelect(new Date())} className="text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm text-green-500">today</span> Today
                 </button>
                 <button onClick={() => { const d = new Date(); d.setDate(d.getDate()+1); handleDateSelect(d); }} className="text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm text-orange-400">calendar_today</span> Tomorrow
                 </button>
            </div>
            <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={() => setCalendarViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><span className="material-symbols-outlined !text-lg">chevron_left</span></button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setCalendarViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><span className="material-symbols-outlined !text-lg">chevron_right</span></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">{weekDays.map(d => <span key={d} className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">{days}</div>
            {dueDate && <button onClick={() => { setDueDate(''); setShowCalendar(false); }} className="w-full mt-3 py-1 text-[10px] uppercase font-bold text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">Clear Date</button>}
        </div>
    );
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.LOW: return 'bg-blue-500 hover:bg-blue-600';
        case TaskPriority.MEDIUM: return 'bg-orange-500 hover:bg-orange-600';
        case TaskPriority.HIGH: return 'bg-red-500 hover:bg-red-600';
        default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col transition-colors duration-200">
        <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-start gap-4">
            <button onClick={() => setStatus(status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED)} className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${status === TaskStatus.COMPLETED ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-primary'}`}><span className="material-symbols-outlined !text-sm font-bold">check</span></button>
            <div className="flex-1">
                 <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-lg sm:text-xl font-bold text-slate-800 dark:text-white border-none p-0 focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent" placeholder="Task title" autoFocus />
            </div>
            <button onClick={() => setIsImportant(!isImportant)} className={`transition-colors ${isImportant ? 'text-primary' : 'text-slate-300 dark:text-slate-600 hover:text-primary'}`}><span className={`material-symbols-outlined !text-2xl ${isImportant ? 'filled' : ''}`}>star</span></button>
          </div>

          <div className="space-y-4">
             <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
                    <button onClick={handleAiDescription} disabled={isThinkingDesc} className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"><span className={`material-symbols-outlined !text-[12px] ${isThinkingDesc ? 'animate-spin' : ''}`}>{isThinkingDesc ? 'refresh' : 'auto_awesome'}</span>{isThinkingDesc ? 'Writing...' : 'Auto-Write'}</button>
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500" placeholder="Add a description..." rows={2} />
             </div>
             
             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">List</label>
                <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary/20 focus:border-primary transition-all">{columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}</select>
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Priority</label>
                <div className="flex gap-1.5">
                    {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map(p => (
                        <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${priority === p ? getPriorityColor(p) + ' text-white border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{p}</button>
                    ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="flex flex-col gap-1" ref={calendarRef}>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Date</label>
                    <div className="relative">
                        <span className="absolute left-2.5 top-2.5 material-symbols-outlined !text-[18px] text-slate-400 dark:text-slate-500">calendar_today</span>
                        <input type="text" value={dueDate} readOnly onClick={() => setShowCalendar(!showCalendar)} className="w-full pl-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary/20 cursor-pointer" placeholder="Add date" />
                        {showCalendar && renderCalendar()}
                    </div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                    <div className="relative">
                        <span className="absolute left-2.5 top-2.5 material-symbols-outlined !text-[18px] text-slate-400 dark:text-slate-500">tag</span>
                        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full pl-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary/20" placeholder="Category" />
                    </div>
                 </div>
             </div>
             
             <div className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`p-1.5 rounded-lg ${hasNotification ? 'bg-accent/20 text-slate-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'} transition-colors`}><span className={`material-symbols-outlined !text-[18px] ${hasNotification ? 'filled' : ''}`}>notifications</span></span>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Remind me</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={hasNotification} onChange={(e) => setHasNotification(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>

             <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subtasks</label>
                    <button onClick={handleAiSubtasks} disabled={isThinkingSubtasks} className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"><span className={`material-symbols-outlined !text-[12px] ${isThinkingSubtasks ? 'animate-spin' : ''}`}>{isThinkingSubtasks ? 'refresh' : 'auto_awesome'}</span>{isThinkingSubtasks ? 'Thinking...' : 'Suggest Steps'}</button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {subtasks.length > 0 && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {subtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-2 p-2.5 group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                    <input type="checkbox" checked={st.isCompleted} onChange={() => toggleSubtask(st.id)} className="h-3.5 w-3.5 rounded-full border-slate-300 text-primary focus:ring-primary cursor-pointer" />
                                    <span className={`flex-1 text-xs font-medium ${st.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{st.title}</span>
                                    <button onClick={() => deleteSubtask(st.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><span className="material-symbols-outlined !text-[16px]">close</span></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                        <span className="material-symbols-outlined !text-[18px] text-slate-400 dark:text-slate-500">add</span>
                        <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="Add a step" className="flex-1 border-none p-0 text-xs focus:ring-0 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent text-slate-700 dark:text-white" />
                        {newSubtaskTitle && <button onClick={handleAddSubtask} className="text-primary font-bold text-[10px] uppercase hover:bg-primary/10 px-2 py-1 rounded">Add</button>}
                    </div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 shrink-0 gap-2">
            <button 
                onClick={handleDelete}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 sm:px-3 sm:py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 sm:gap-2 group shrink-0"
                title="Delete Task"
            >
                <span className="material-symbols-outlined !text-[18px]">delete</span>
                <span className="hidden sm:inline">Delete</span>
            </button>
            <div className="flex gap-2 items-center flex-1 justify-end flex-nowrap min-w-0">
                <button 
                    onClick={onClose}
                    className="px-3 sm:px-4 py-2 text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 sm:px-6 py-2 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md hover:bg-primary/90 transition-all whitespace-nowrap flex-shrink-0"
                >
                    Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
