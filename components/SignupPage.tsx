
import React, { useState } from 'react';

interface SignupPageProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onSwitchToLogin, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(); // Simulating successful signup
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 animate-in slide-in-from-right-8 duration-500">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="group mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to home
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400">Join 10,000+ users finding their flow</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full px-5 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            
            <div className="flex items-start gap-3 py-2 ml-1">
              <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                I agree to the <button type="button" className="text-primary hover:underline">Terms of Service</button> and <button type="button" className="text-primary hover:underline">Privacy Policy</button>.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
            >
              Get Started — It's Free
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="px-4 bg-slate-50 dark:bg-slate-900 text-slate-400">Or sign up with</span>
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
          Already have an account?{' '}
          <button 
            onClick={onSwitchToLogin}
            className="text-primary hover:underline"
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
