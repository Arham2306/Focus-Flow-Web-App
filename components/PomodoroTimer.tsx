
import React, { useState, useEffect, useRef } from 'react';

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  
  // Audio ref for notification sound (optional enhancement)
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Fix: Using ReturnType<typeof setInterval> instead of NodeJS.Timeout for portability
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      playNotificationSound();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const playNotificationSound = () => {
     // Simple beep using Web Audio API to avoid external assets
     if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
     }
     const ctx = audioContextRef.current;
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.connect(gain);
     gain.connect(ctx.destination);
     osc.type = 'sine';
     osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
     gain.gain.setValueAtTime(0.1, ctx.currentTime);
     osc.start();
     osc.stop(ctx.currentTime + 0.5);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-slate-900 dark:bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform group border-2 border-white/10"
        title="Open Focus Timer"
      >
        <span className="material-symbols-outlined !text-2xl group-hover:rotate-12 transition-transform">timer</span>
        {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-72 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">timer</span>
            Focus Timer
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl mb-6">
        <button 
            onClick={() => switchMode('focus')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'focus' ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
            Focus
        </button>
        <button 
             onClick={() => switchMode('break')}
             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'break' ? 'bg-white dark:bg-slate-600 shadow text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
        >
            Break
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="text-5xl font-black text-slate-800 dark:text-white font-mono tracking-wider tabular-nums">
            {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest">
            {isActive ? 'Running' : 'Paused'}
        </p>
      </div>

      <div className="flex gap-3">
        <button 
            onClick={toggleTimer}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}
            `}
        >
            <span className="material-symbols-outlined !text-lg">{isActive ? 'pause' : 'play_arrow'}</span>
            {isActive ? 'Pause' : 'Start'}
        </button>
        <button 
            onClick={resetTimer}
            className="w-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
            <span className="material-symbols-outlined !text-xl">restart_alt</span>
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
