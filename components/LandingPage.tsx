
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

type AuthView = 'hero' | 'login' | 'signup';

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, darkMode, onToggleDarkMode }) => {
  const [view, setView] = useState<AuthView>('hero');
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    if (view !== 'hero') return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });
        gsap.set(['.hero-badge', '.hero-title', '.hero-p', '.hero-btns', '.hero-preview'], { autoAlpha: 0, y: 40 });

        tl.to('.hero-badge', { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2 })
          .to('.hero-title', { autoAlpha: 1, y: 0, stagger: 0.1 }, '-=0.4')
          .to('.hero-p', { autoAlpha: 1, y: 0 }, '-=0.8')
          .to('.hero-btns', { autoAlpha: 1, y: 0 }, '-=0.8')
          .to('.hero-preview', { autoAlpha: 1, y: 0, scale: 1 }, '-=0.6');

        gsap.fromTo('.feature-card', 
          { autoAlpha: 0, y: 50, scale: 0.95 },
          { 
            autoAlpha: 1, y: 0, scale: 1,
            stagger: 0.1, duration: 1, 
            scrollTrigger: {
              trigger: '#features',
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );

        gsap.from('.adventure-visual', {
          scrollTrigger: { trigger: '#adventure', start: 'top 75%' },
          xPercent: -10, autoAlpha: 0, duration: 1.4, ease: 'power3.out'
        });
        
        gsap.from('.adventure-text', {
          scrollTrigger: { trigger: '#adventure', start: 'top 75%' },
          xPercent: 10, autoAlpha: 0, duration: 1.4, ease: 'power3.out'
        });
      });

      mm.add("(max-width: 767px)", () => {
        gsap.from('.hero-title, .hero-p, .hero-btns', {
          autoAlpha: 0, y: 20, stagger: 0.1, duration: 1
        });
      });

      // Floating blobs animation
      gsap.to('.hero-blob-1', { x: '+=50', y: '+=30', rotation: 45, duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.hero-blob-2', { x: '-=60', y: '-=40', rotation: -30, duration: 15, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, containerRef);

    return () => ctx.revert();
  }, [view]);

  if (view === 'login') return <LoginPage onLogin={onLogin} onSwitchToSignup={() => setView('signup')} onBack={() => setView('hero')} />;
  if (view === 'signup') return <SignupPage onSignup={onLogin} onSwitchToLogin={() => setView('login')} onBack={() => setView('hero')} />;

  const faqs = [
    { q: "How does the AI task parsing work?", a: "FocusFlow uses the latest Gemini AI models to understand natural language inputs. Just type tasks like 'Buy milk tomorrow at 5pm' and the system extracts dates, priorities, and categories automatically." },
    { q: "Is FocusFlow available on mobile?", a: "Yes! FocusFlow is built as a responsive web application that works flawlessly on iOS and Android devices, complete with mobile-optimized board and list views." },
    { q: "Does it support Pomodoro technique?", a: "Absolutely. We have a built-in focus timer that helps you cycle between deep work and short breaks to maintain peak cognitive performance." }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 selection:bg-primary/30 overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="hero-blob-1 absolute -top-24 -left-24 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="hero-blob-2 absolute top-1/2 -right-48 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[150px]"></div>
      </div>

      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl py-3 shadow-lg border-b border-slate-200/50 dark:border-slate-800/50' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-12 group-hover:rotate-0 transition-all duration-300">
              <span className="material-symbols-outlined !text-xl font-black">bolt</span>
            </div>
            <h1 className="text-primary text-xl font-black tracking-tighter">FocusFlow</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <button onClick={onToggleDarkMode} className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <span className="material-symbols-outlined !text-[22px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block"></div>
            <button onClick={() => setView('login')} className="hidden xs:block text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Log In</button>
            <button onClick={() => setView('signup')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      <header className="relative pt-32 pb-20 sm:pt-56 sm:pb-40 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="hero-badge inline-flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 mb-10 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Powered by Gemini AI
          </div>
          <h1 className="hero-title text-5xl sm:text-7xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-10">
            Flow state <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">unlocked.</span>
          </h1>
          <p className="hero-p text-lg sm:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The minimalist task manager that turns your to-do list into a productive journey. Designed for high-performance minds.
          </p>
          <div className="hero-btns flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button onClick={() => setView('signup')} className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all group">
              Start Free Today <span className="material-symbols-outlined !text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button onClick={() => setView('login')} className="w-full sm:w-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-[2rem] text-xl font-black hover:bg-white dark:hover:bg-slate-800 transition-all">Watch Demo</button>
          </div>

          <div className="hero-preview max-w-5xl mx-auto relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden aspect-video lg:aspect-[16/8]">
               {/* Mockup content */}
               <div className="absolute inset-0 flex">
                  <div className="w-1/4 h-full border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col gap-4">
                     <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                     <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                     <div className="w-full h-8 bg-primary/10 rounded-lg"></div>
                  </div>
                  <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                           <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-primary' : i === 2 ? 'bg-accent' : 'bg-green-400'}`}></div>
                           <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                         </div>
                         <div className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"></div>
                         <div className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"></div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none opacity-40"></div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4">Master your workflow.</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Everything you need, nothing you don't.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="feature-card md:col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20 hover:shadow-2xl shadow-primary/5 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-3xl font-black">dashboard</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Fluid Kanban Boards</h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">The core of productivity. Organize your tasks across dynamic columns with a layout that adapts to your brain's natural rhythm.</p>
          </div>
          <div className="feature-card bg-primary rounded-[2.5rem] p-8 sm:p-12 text-white flex flex-col justify-between shadow-2xl shadow-primary/20 group hover:-translate-y-2 transition-all">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:rotate-12 transition-transform"><span className="material-symbols-outlined !text-3xl font-black">auto_awesome</span></div>
            <div>
              <h3 className="text-3xl font-black mb-4">AI Magic</h3>
              <p className="text-primary-100 text-slate-100/80">Input tasks in plain English. Gemini AI handles dates, importance, and breakdown automatically.</p>
            </div>
          </div>
          <div className="feature-card bg-slate-900 dark:bg-white rounded-[2.5rem] p-8 sm:p-12 text-white dark:text-slate-900 flex flex-col justify-between group hover:-translate-y-2 transition-all">
            <div className="w-14 h-14 bg-white/10 dark:bg-slate-100 rounded-2xl flex items-center justify-center text-white dark:text-slate-900 mb-8 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined !text-3xl font-black">timer</span></div>
            <div>
              <h3 className="text-3xl font-black mb-4">Focus Tools</h3>
              <p className="opacity-70">Deep work is easy with our integrated Pomodoro timer. Stay in the zone longer without burning out.</p>
            </div>
          </div>
          <div className="feature-card md:col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 transition-all hover:border-accent/20 group">
             <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-8 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-3xl font-black">insights</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Progress Visualized</h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">Track your completion rates and daily goals with beautiful, minimalist widgets that keep you motivated throughout the day.</p>
          </div>
        </div>
      </section>

      <section id="adventure" className="py-24 sm:py-40 bg-slate-900 dark:bg-white transition-colors duration-500 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="adventure-text">
            <div className="inline-block bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Gamified Productivity</div>
            <h3 className="text-5xl sm:text-7xl font-black text-white dark:text-slate-900 tracking-tighter mb-8 leading-[1]">Your day is a <br /> <span className="text-accent">Quest.</span></h3>
            <p className="text-xl text-slate-400 dark:text-slate-500 mb-10 leading-relaxed max-w-lg">Adventure Mode turns your boring task list into an epic map. Each completion is a level cleared. Master your day, earn your trophy.</p>
            <button onClick={() => setView('signup')} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-10 py-5 rounded-2xl text-xl font-black hover:scale-105 transition-transform">Enter the Map</button>
          </div>
          
          <div className="adventure-visual relative h-[500px] w-full group">
             <div className="absolute inset-0 bg-primary/20 dark:bg-primary/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative h-full w-full bg-slate-800 dark:bg-slate-50 rounded-[3rem] border border-slate-700 dark:border-slate-200 shadow-2xl overflow-hidden p-10 flex flex-col items-center justify-between">
                <div className="w-full flex flex-col items-center gap-10">
                    <div className="w-20 h-20 bg-primary rounded-3xl rotate-12 flex items-center justify-center text-white shadow-xl animate-bounce"><span className="material-symbols-outlined !text-4xl">face</span></div>
                    <div className="w-px h-24 bg-dashed bg-gradient-to-b from-primary to-slate-600 dark:to-slate-300"></div>
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-700 dark:bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500"><span className="material-symbols-outlined">lock</span></div>
                        <div className="w-16 h-16 bg-slate-700 dark:bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500"><span className="material-symbols-outlined">lock</span></div>
                    </div>
                </div>
                <div className="w-full text-center">
                    <span className="material-symbols-outlined !text-6xl text-accent drop-shadow-lg">trophy</span>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs mt-4">Victory Road</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 sm:py-40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Questions?</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">We've got answers.</p>
          </div>
          <div className="grid gap-4">
            {faqs.map((f, i) => (
              <div key={i} className={`group border-2 rounded-[2rem] transition-all duration-300 ${activeFaq === i ? 'bg-slate-50 dark:bg-slate-900 border-primary/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full p-8 flex items-center justify-between text-left">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pr-6">{f.q}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeFaq === i ? 'bg-primary text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-8 pt-0 text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {f.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/40">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
           <div className="relative z-10">
              <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tighter mb-8">Ready to find your flow?</h2>
              <p className="text-white/80 text-lg sm:text-2xl max-w-xl mx-auto mb-12 font-medium">Join thousands of planners and achievers who upgraded their lives with FocusFlow.</p>
              <button onClick={() => setView('signup')} className="bg-white text-primary px-12 py-5 rounded-[2rem] text-2xl font-black shadow-xl hover:scale-105 transition-transform">Get Started Free</button>
           </div>
        </div>
      </section>

      <footer className="py-20 border-t border-slate-100 dark:border-slate-800 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">F</div>
              <span className="text-primary font-black text-2xl tracking-tighter">FocusFlow</span>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">Design with intention, work with flow.</p>
          </div>
          <div className="flex gap-10">
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">Terms</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors font-bold text-sm">Support</a>
          </div>
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">© 2024 FocusFlow Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
