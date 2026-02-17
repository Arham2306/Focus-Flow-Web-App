import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const SetPasswordView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { linkPassword, logout, currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await linkPassword(password);
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to set password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined !text-4xl text-primary">lock_reset</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Secure Your Account</h1>
          <p className="text-slate-500 dark:text-slate-400">Please set a password to continue to your dashboard</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[20px] text-slate-400">mail</span>
                <input
                  type="email"
                  readOnly
                  value={currentUser?.email || ''}
                  className="w-full pl-12 pr-5 py-4 bg-slate-100 dark:bg-slate-800/80 border-none rounded-2xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[20px] text-slate-400">lock</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[20px] text-slate-400">lock_clock</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Setting Password...</span>
                </>
              ) : (
                'Set Password & Continue'
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-xs uppercase tracking-widest"
            >
              Cancel & Sign Out
            </button>
          </form>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
            <span className="font-black uppercase tracking-wider block mb-1">Why do I need a password?</span>
            Setting a password adds an extra layer of security and allows you to access your account even if you lose access to your Google account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordView;
