
import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

interface LandingPageProps {
  onLogin: () => void;
}

type AuthView = 'hero' | 'login' | 'signup';

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('hero');
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (view === 'login') {
    return (
      <LoginPage 
        onLogin={onLogin} 
        onSwitchToSignup={() => setView('signup')} 
        onBack={() => setView('hero')} 
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignupPage 
        onSignup={onLogin} 
        onSwitchToLogin={() => setView('login')} 
        onBack={() => setView('hero')} 
      />
    );
  }

  const faqs = [
    {
      q: "How does the AI task parsing work?",
      a: "FocusFlow uses Gemini AI to understand natural language. Just type like you talk ('Remind me to call Mom tomorrow at 5pm') and we'll automatically set the date, priority, and category for you."
    },
    {
      q: "Is FocusFlow free to use?",
      a: "Yes! Our core features including Kanban boards, Adventure Mode, and basic AI parsing are completely free. We offer a Pro plan for advanced team collaboration and custom themes."
    },
    {
      q: "Can I sync my data across devices?",
      a: "Currently, FocusFlow stores data locally in your browser for privacy and speed. We are rolling out cloud sync for account holders in the coming weeks."
    },
    {
      q: "What is Adventure Mode?",
      a: "Adventure Mode transforms your boring to-do list into a visual RPG-style map. Every task you complete moves your character forward on a quest path toward your daily trophy."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200 selection:bg-primary/30">
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 shadow-sm border-b border-slate-100 dark:border-slate-800' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white rotate-12 group-hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined !text-xl font-black">bolt</span>
            </div>
            <h1 className="text-primary text-xl font-black tracking-tighter">FocusFlow</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#adventure" className="hover:text-primary transition-colors">Adventure</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button 
              onClick={() => setView('login')}
              className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => setView('signup')}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-xl text-sm font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent rounded-full blur-[100px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-8 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
            AI-POWERED PRODUCTIVITY FOR MODERN MINDS
          </div>
          
          <h1 className="text-6xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
            Productivity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">redesigned.</span>
          </h1>
          
          <p className="text-lg lg:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-forwards">
            Ditch the clutter. FocusFlow blends minimalist design with AI-powered agility to help you master your day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 fill-mode-forwards">
            <button 
              onClick={() => setView('signup')}
              className="group w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Planning
              <span className="material-symbols-outlined !text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button 
              onClick={() => setView('login')}
              className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl text-xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
      </header>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Master your workflow</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Tools built to enhance your focus, not distract from it.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-primary/20 transition-all">
            <div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined !text-3xl font-black">view_column</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Fluid Kanban Boards</h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                Organize your day with intuitive columns. Drag, drop, and prioritize with zero friction. Today, Upcoming, and Completed - clarity at a glance.
              </p>
            </div>
            <div className="mt-12 flex gap-4 overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
               <div className="w-48 h-32 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 shrink-0 -rotate-3">
                  <div className="w-full h-2 bg-primary/20 rounded-full mb-3"></div>
                  <div className="w-2/3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
               </div>
               <div className="w-48 h-32 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 shrink-0 rotate-2 translate-y-4">
                  <div className="w-full h-2 bg-accent/30 rounded-full mb-3"></div>
                  <div className="w-1/2 h-2 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
               </div>
            </div>
          </div>

          {/* AI Card */}
          <div className="bg-purple-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-xl shadow-purple-500/20">
            <div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6">
                <span className="material-symbols-outlined !text-3xl font-black">auto_awesome</span>
              </div>
              <h3 className="text-3xl font-black mb-4">Gemini AI Engine</h3>
              <p className="text-purple-100 leading-relaxed">
                Natural language processing that understands you. Type tasks like you speak, and let AI handle the structure.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 text-sm font-bold flex items-center gap-2">
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-accent"></span>
              Gemini 3 Flash Integrated
            </div>
          </div>

          {/* Gamification Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between group hover:bg-slate-800 transition-colors">
            <div>
              <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center text-accent mb-6">
                <span className="material-symbols-outlined !text-3xl font-black">map</span>
              </div>
              <h3 className="text-3xl font-black mb-4">Adventure Mode</h3>
              <p className="text-slate-400 leading-relaxed">
                Turn your to-do list into an RPG quest. Every task is a level, every completion is a victory.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
               <span className="material-symbols-outlined !text-6xl text-slate-700 group-hover:text-accent transition-colors">trophy</span>
            </div>
          </div>

          {/* Focus Tools Card */}
          <div className="md:col-span-2 bg-accent/10 dark:bg-accent/5 rounded-[2.5rem] p-10 border border-accent/20 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center text-slate-900 dark:text-accent mb-6">
                <span className="material-symbols-outlined !text-3xl font-black">timer</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Deep Focus Tools</h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                Built-in Pomodoro timer for undisturbed focus. Seamlessly switch between work sessions and breaks to maximize output without burnout.
              </p>
            </div>
            <div className="w-full md:w-64 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-accent/20 text-center">
               <div className="text-4xl font-black text-slate-900 dark:text-white font-mono mb-2">25:00</div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3"></div>
               </div>
               <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Focus Session</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Spotlight */}
      <section id="adventure" className="py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative h-[600px] w-full bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-inner p-10 overflow-hidden">
             {/* Map Path Visualization */}
             <div className="absolute inset-0 flex flex-col items-center justify-around py-20 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-green-500 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white rotate-12 shadow-xl">
                  <span className="material-symbols-outlined !text-3xl">check</span>
                </div>
                <div className="w-20 h-20 rounded-3xl bg-primary border-4 border-white dark:border-slate-900 flex items-center justify-center text-white -rotate-6 shadow-2xl animate-bounce">
                  <span className="material-symbols-outlined !text-4xl">person</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-slate-400 rotate-45 shadow-lg">
                  <span className="material-symbols-outlined !text-3xl -rotate-45">lock</span>
                </div>
                <div className="absolute top-0 bottom-0 w-px border-l-4 border-dashed border-slate-200 dark:border-slate-800 -z-10"></div>
             </div>
          </div>
          <div className="order-1 lg:order-2">
            <h4 className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4">Adventure View</h4>
            <h3 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[0.9]">
              Turn tasks into <br /> <span className="text-accent">victory laps.</span>
            </h3>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
              Why should productivity be boring? Adventure Mode visualizes your daily to-do list as a level-based map. Every completed task moves your character forward on the quest to reclaim your time.
            </p>
            <div className="space-y-6">
              {[
                { icon: 'ads_click', title: 'Interactive Roadmap', desc: 'See your path from morning routine to evening rest.' },
                { icon: 'military_tech', title: 'Dopamine Hits', desc: 'Visual progression keeps you motivated to clear the board.' },
                { icon: 'auto_fix_high', title: 'Auto-Scaling', desc: 'The map expands and shrinks based on your workload.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined !text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-white mb-1">{item.title}</h5>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works - Timeline */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">How it works</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Simple. Powerful. Efficient.</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-12 relative">
            {/* Timeline Line (Desktop Only) */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 dark:bg-slate-800 hidden lg:block -z-10"></div>
            
            {[
              { num: '01', title: 'Capture', desc: 'Type your task using natural language. No date pickers required.' },
              { num: '02', title: 'AI Organize', desc: 'Gemini instantly extracts dates, subtasks, and priorities.' },
              { num: '03', title: 'Execute', desc: 'Use the Kanban board or Map to power through your goals.' },
              { num: '04', title: 'Analyze', desc: 'Watch your daily completion rates soar with visual feedback.' }
            ].map((step, i) => (
              <div key={i} className="relative bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 lg:hover:-translate-y-4 transition-transform shadow-sm">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-black text-lg mb-6 shadow-lg shadow-primary/20">
                  {step.num}
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3">{step.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-900 py-32 overflow-hidden text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Loved by high-achievers.</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Chen", role: "Product Designer", text: "Finally, a task manager that doesn't feel like a spreadsheet. The AI parsing is scarily good.", avatar: "SC" },
              { name: "Marc Aubert", role: "Indie Hacker", text: "Adventure mode is the only thing that keeps me motivated during long coding sessions. It's genius.", avatar: "MA" },
              { name: "Elena Rossi", role: "Creative Director", text: "Clean, fast, and stays out of the way. FocusFlow is the productivity tool I've been waiting for.", avatar: "ER" }
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-colors">
                <p className="text-xl mb-8 italic text-slate-300">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-white/40 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div 
                key={i} 
                className={`border rounded-[1.5rem] overflow-hidden transition-all duration-300 ${activeFaq === i ? 'bg-slate-50 dark:bg-slate-900 border-primary/30' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{f.q}</span>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${activeFaq === i ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
                    expand_more
                  </span>
                </button>
                <div className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    {f.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-primary to-accent rounded-[3.5rem] p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 relative z-10 leading-[0.9]">
            Find your flow <br /> state today.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => setView('signup')}
              className="bg-white text-primary px-10 py-5 rounded-2xl text-xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Start For Free
            </button>
            <button className="px-10 py-5 text-white font-black text-xl hover:bg-white/10 rounded-2xl transition-all">
              Book a Demo
            </button>
          </div>
          <p className="mt-8 text-white/60 font-bold text-xs relative z-10 uppercase tracking-widest">Instant access • No credit card required</p>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="max-w-7xl mx-auto px-6 lg:px-12 py-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white">
              <span className="material-symbols-outlined !text-sm">bolt</span>
            </div>
            <span className="text-slate-900 dark:text-white font-black tracking-tighter">FocusFlow</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
            © {new Date().getFullYear()} FocusFlow Inc.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
