import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignup, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Google sign-in failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await resetPassword(email);
      setSuccess('Reset link sent to your email!');
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="group mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to home
        </button>

        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Log in to your FocusFlow account</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
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
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined !text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {success && (
              <p className="text-green-500 text-xs font-bold text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">{success}</p>
            )}

            {error && (
              <p className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
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

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button onClick={handleGoogleLogin} type="button" className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <svg viewBox="0 0 384 512" className="w-4 h-4 fill-slate-900 dark:fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
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