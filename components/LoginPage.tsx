
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignup, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(); // Simulating successful login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="group mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to home
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400">Log in to your FocusFlow account</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
            >
              Sign In
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined !text-lg">apple</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Apple</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-bold">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToSignup}
            className="text-primary hover:underline"
          >
            Create one for free
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
