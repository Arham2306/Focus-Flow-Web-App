import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Task, PomodoroSession } from '../types';

interface AnalyticsViewProps {
    tasks: Task[];
    pomodoroSessions: PomodoroSession[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, pomodoroSessions }) => {
    // 1. Task Velocity Data (Last 7 Days)
    const taskVelocityData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const count = tasks.filter(t => {
                if (!t.completedDate) return false;
                const compDate = new Date(t.completedDate);
                return compDate.getDate() === d.getDate() &&
                    compDate.getMonth() === d.getMonth() &&
                    compDate.getFullYear() === d.getFullYear();
            }).length;

            data.push({ date: dateString, tasksCompleted: count });
        }
        return data;
    }, [tasks]);

    // 2. Productive Hours (Focus Sessions Over Time - Last 7 Days)
    const focusTimeData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const sessionMinutes = pomodoroSessions
                .filter(s => {
                    if (s.mode !== 'focus') return false;
                    const sessionDate = new Date(s.date);
                    return sessionDate.getDate() === d.getDate() &&
                        sessionDate.getMonth() === d.getMonth() &&
                        sessionDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, s) => sum + s.durationMinutes, 0);

            data.push({
                date: dateString,
                hours: Number((sessionMinutes / 60).toFixed(1)),
                minutes: sessionMinutes
            });
        }
        return data;
    }, [pomodoroSessions]);

    // 3. Tasks by Category (Pie Chart)
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        const completedTasks = tasks.filter(t => t.completedDate); // Only completed tasks, or all tasks if you prefer

        completedTasks.forEach(t => {
            const cat = t.category || 'Uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Tasks Completed</h3>
                        <p className="text-4xl font-black text-slate-800 dark:text-white">
                            {tasks.filter(t => t.completedDate).length}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Focus Time</h3>
                        <p className="text-4xl font-black text-primary">
                            {Number((pomodoroSessions.filter(s => s.mode === 'focus').reduce((a, b) => a + b.durationMinutes, 0) / 60).toFixed(1))}h
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Current Streak</h3>
                        <p className="text-4xl font-black text-amber-500 flex items-center gap-2">
                            <span className="material-symbols-outlined !text-4xl">local_fire_department</span>
                            --
                            <span className="text-sm font-bold text-slate-400 ml-1">Days</span>
                        </p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Task Velocity Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined !text-[18px]">trending_up</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Task Completion Velocity</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={taskVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="tasksCompleted" name="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Productive Hours Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                <span className="material-symbols-outlined !text-[18px]">timer</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Focus Time (Hours)</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={focusTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <span className="material-symbols-outlined !text-[18px]">pie_chart</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Completed Tasks by Category</h3>
                        </div>

                        {categoryData.length > 0 ? (
                            <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-center gap-8">
                                <div className="h-[250px] w-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Custom Legend */}
                                <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                    {categoryData.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{entry.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-400 font-bold text-sm uppercase tracking-widest">
                                No completed tasks yet
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
