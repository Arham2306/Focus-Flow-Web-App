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
        gsap.set(['.hero-badge', '.hero-title', '.hero-p', '.hero-btns'], { autoAlpha: 0, y: 40 });

        tl.to('.hero-badge', { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2 })
          .to('.hero-title', { autoAlpha: 1, y: 0, stagger: 0.1 }, '-=0.4')
          .to('.hero-p', { autoAlpha: 1, y: 0 }, '-=0.8')
          .to('.hero-btns', { autoAlpha: 1, y: 0 }, '-=0.8');

        gsap.fromTo('.feature-card', 
          { autoAlpha: 0, y: 50 },
          { 
            autoAlpha: 1, y: 0, 
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
          xPercent: -15, autoAlpha: 0, duration: 1.4, ease: 'power3.out'
        });
        
        gsap.from('.adventure-text', {
          scrollTrigger: { trigger: '#adventure', start: 'top 75%' },
          xPercent: 15, autoAlpha: 0, duration: 1.4, ease: 'power3.out'
        });
      });

      mm.add("(max-width: 767px)", () => {
        gsap.from('.hero-title, .hero-p, .hero-btns', {
          autoAlpha: 0, y: 20, stagger: 0.1, duration: 1
        });

        gsap.from('.feature-card, .step-card', {
          autoAlpha: 0, y: 30, stagger: 0.1,
          scrollTrigger: { trigger: '#features', start: 'top 95%' }
        });
      });

      gsap.to('.hero-blob-1', { x: '+=30', y: '+=20', duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.hero-blob-2', { x: '-=40', y: '-=30', duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, containerRef);

    return () => ctx.revert();
  }, [view]);

  if (view === 'login') return <LoginPage onLogin={onLogin} onSwitchToSignup={() => setView('signup')} onBack={() => setView('hero')} />;
  if (view === 'signup') return <SignupPage onSignup={onLogin} onSwitchToLogin={() => setView('login')} onBack={() => setView('hero')} />;

  const faqs = [
    { q: "How does the AI task parsing work?", a: "FocusFlow uses Gemini AI to understand natural language. Just type like you talk and we'll automatically set the date and priority." },
    { q: "Is FocusFlow free to use?", a: "Yes! Core features are completely free. We offer a Pro plan for advanced collaboration." },
    { q: "Can I sync my data?", a: "Currently, FocusFlow stores data locally. Cloud sync is coming soon." }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200 selection:bg-primary/30 overflow-x-hidden">
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 sm:py-3 shadow-sm border-b border-slate-100 dark:border-slate-800' : 'bg-transparent py-4 sm:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center text-white rotate-12 group-hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined !text-lg sm:!text-xl font-black">bolt</span>
            </div>
            <h1 className="text-primary text-lg sm:text-xl font-black tracking-tighter">FocusFlow</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onToggleDarkMode} className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined !text-[20px] sm:!text-[22px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button onClick={() => setView('login')} className="hidden xs:block text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">Log In</button>
            <button onClick={() => setView('signup')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 sm:px-5 py-2 rounded-xl text-[10px] sm:text-sm font-bold shadow-lg">Get Started</button>
          </div>
        </div>
      </nav>

      <header className="relative pt-24 pb-12 sm:pt-48 sm:pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="hero-badge inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 border border-slate-200 dark:border-slate-700">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
            AI-POWERED PRODUCTIVITY
          </div>
          <h1 className="hero-title text-4xl sm:text-6xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1] sm:leading-[0.85] mb-6 sm:mb-8">
            Productivity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">redesigned.</span>
          </h1>
          <p className="hero-p text-sm sm:text-lg lg:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 font-medium leading-relaxed px-4">
            Ditch the clutter. Master your day with minimalist design and AI agility.
          </p>
          <div className="hero-btns flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20">
            <button onClick={() => setView('signup')} className="w-full sm:w-auto bg-primary text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-lg sm:text-xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
              Start Planning <span className="material-symbols-outlined !text-xl sm:!text-2xl">arrow_forward</span>
            </button>
            <button onClick={() => setView('login')} className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl text-lg sm:text-xl font-black">View Demo</button>
          </div>
        </div>
      </header>

      <section id="features" className="py-16 sm:py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="feature-card md:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined !text-2xl font-black">view_column</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">Fluid Kanban</h3>
              <p className="text-sm sm:text-lg text-slate-500 dark:text-slate-400 max-w-md">Drag, drop, and prioritize with zero friction. Clarity at a glance.</p>
            </div>
          </div>
          <div className="feature-card bg-purple-600 rounded-[2rem] p-6 sm:p-10 text-white flex flex-col justify-between shadow-lg">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-6"><span className="material-symbols-outlined !text-2xl font-black">auto_awesome</span></div>
            <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white">Gemini AI</h3>
            <p className="text-xs sm:text-base text-purple-100">Natural language processing that understands how you speak.</p>
          </div>
        </div>
      </section>

      <section id="adventure" className="py-20 sm:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-10 sm:gap-20 items-center">
          <div className="adventure-text">
            <h3 className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">Turn tasks into <br /> <span className="text-accent">victory.</span></h3>
            <p className="text-base sm:text-xl text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Adventure Mode visualizes your list as a quest path. Reach your goals, clear your levels.</p>
          </div>
          <div className="adventure-visual relative h-[350px] sm:h-[600px] w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner">
             <div className="absolute inset-0 flex flex-col items-center justify-around py-10">
                <div className="w-12 h-12 bg-green-500 rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-white"><span className="material-symbols-outlined">check</span></div>
                <div className="w-16 h-16 bg-primary rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-white animate-bounce"><span className="material-symbols-outlined">person</span></div>
             </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 sm:py-32 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-10">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border rounded-2xl border-slate-100 dark:border-slate-800 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full p-5 flex items-center justify-between text-left">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{f.q}</span>
                  <span className={`material-symbols-outlined transition-transform ${activeFaq === i ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
                </button>
                {activeFaq === i && <div className="p-5 pt-0 text-xs sm:text-sm text-slate-500">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <span className="text-primary font-black tracking-tighter">FocusFlow</span>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">© 2024 FocusFlow Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;