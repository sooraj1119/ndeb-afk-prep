/* eslint-disable no-empty */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { SplashScreen } from '@capacitor/splash-screen';
import splashImg from './assets/splash.jpg';

const TopicSelection = React.lazy(() => import('./TopicSelection').then(m => ({ default: m.TopicSelection })));




const Quiz = React.lazy(() => import('./Quiz').then(m => ({ default: m.Quiz })));

const Results = React.lazy(() => import('./Results').then(m => ({ default: m.Results })));

const Dashboard = React.lazy(() => import('./Dashboard').then(m => ({ default: m.Dashboard })));

const SearchComponent = React.lazy(() => import('./Search').then(m => ({ default: m.Search })));
const MistakesList = React.lazy(() => import('./MistakesList').then(m => ({ default: m.MistakesList })));

import { Stethoscope, LayoutDashboard, LibraryBig, Search, AlertTriangle, ShieldCheck, Moon, Sun, Flame } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';

import { hasAcceptedDisclaimer, acceptDisclaimer, logDailyVisit, usePremiumStatus } from './lib/storage';
import { PaywallModal } from './PaywallModal';
import { ConfirmModal } from './ConfirmModal';
import { Lock } from 'lucide-react';



const ToothStencil = ({ style, className = '' }: { style: React.CSSProperties, className?: string }) => (

  <svg 

    xmlns="http://www.w3.org/2000/svg" 

    viewBox="0 0 24 24" 

    fill="none" 

    stroke="var(--text-primary)" 

    strokeWidth="1.5" 

    strokeLinecap="round" 

    strokeLinejoin="round" 

    className={`stencil-icon ${className}`}

    style={{ ...style, position: 'fixed', pointerEvents: 'none', zIndex: 0, opacity: 0.04 }}

  >

    <path d="M7.4 3C5.5 3 4 4.8 4 7c0 4.1 2 6.6 2 10 0 1.9 1.1 4 2.5 4s2.5-1.9 2.5-3.8v-2.3c0-.6 1-.6 1 0v2.3c0 1.9 1.1 4 2.5 4s2.5-2.1 2.5-4c0-3.4 2-5.9 2-10 0-2.2-1.5-4-3.4-4-1.7 0-2.8 1.4-2.2 2 .6.6 0 2.2-2.2 2.2-2.3 0-2.8-1.7-2.2-2.3.6-.6-.5-2-2.2-2z"/>

  </svg>

);



import { loadAllQuestions } from './lib/questionsStore';



function App() {

  
  const isPremium = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  
  
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'practice' | 'dashboard' | 'search'>('practice');

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [quizFinished, setQuizFinished] = useState(false);

  const [score, setScore] = useState(0);

  const [totalQuestions, setTotalQuestions] = useState(0);

  const [quizBreakdown, setQuizBreakdown] = useState<Record<string, { correct: number; total: number }> | null>(null);

  

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('ndeb_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [streak, setStreak] = useState(0);
  const [confirmNav, setConfirmNav] = useState<(() => void) | null>(null);

  


  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      // 1. Close Modals first
      if (showPaywall) { setShowPaywall(false); return; }
      if (showDisclaimer) { return; }
      if (confirmNav) { setConfirmNav(null); return; }
      // 2. Handle active quiz state (just unmount it, Quiz.tsx handles saving on unmount)
      if (selectedTopic && !quizFinished) {
        setSelectedTopic(null);
        return;
      }
      // 3. Handle quiz results state
      if (quizFinished) {
        setQuizFinished(false);
        setSelectedTopic(null);
        return;
      }
      // 4. Handle tab navigation
      if (activeTab !== 'practice') {
        setActiveTab('practice');
        return;
      }
      // 5. If on practice tab and no topic selected, exit app
      CapacitorApp.exitApp();
    });
    return () => { listener.then(l => l.remove()); };
  }, [showPaywall, showDisclaimer, quizFinished, selectedTopic, activeTab, confirmNav]);



  const [isFrench, setIsFrench] = useState(() => document.cookie.includes('googtrans=/en/fr'));



  useEffect(() => {
    // If we just reloaded due to a language switch, re-fire premium status
    // so usePremiumStatus() re-reads localStorage and avoids a stale free-user state
      loadAllQuestions().then(() => { setQuestionsLoaded(true); if (Capacitor.isNativePlatform()) { SplashScreen.hide(); } }).catch(e => {

      console.error('Failed to load questions:', e);

      // fallback in case of error

      loadAllQuestions().then(() => { setQuestionsLoaded(true); if (Capacitor.isNativePlatform()) { SplashScreen.hide(); } }).catch(e => {

    });

  }, []);




  const isTogglingLang = useRef(false);
  const [langToastVisible, setLangToastVisible] = useState(false);

  const toggleLanguage = () => {
    if (isFrench) {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
    } else {
      document.cookie = 'googtrans=/en/fr; path=/';
    }
    sessionStorage.setItem('ndeb_lang_toggled', 'true');
    window.location.reload();
  };



  useEffect(() => {

    if (!hasAcceptedDisclaimer()) {

      setShowDisclaimer(true);

    } else {

      setStreak(logDailyVisit());

    }

  }, []);



  useEffect(() => {

    if (darkMode) {

      document.documentElement.classList.add('dark');

      localStorage.setItem('ndeb_theme', 'dark');

    } else {

      document.documentElement.classList.remove('dark');

      localStorage.setItem('ndeb_theme', 'light');

    }

  }, [darkMode]);



  const handleAcceptDisclaimer = () => {

    acceptDisclaimer();

    setShowDisclaimer(false);

    setStreak(logDailyVisit());

  };



  const handleTopicSelect = (topicId: string) => {

    setSelectedTopic(topicId);

    setQuizFinished(false);

    setActiveTab('practice');

  };



  const handleQuizFinish = (finalScore: number, total: number, breakdown?: Record<string, { correct: number; total: number }>) => {

    setScore(finalScore);

    setTotalQuestions(total);

    setQuizBreakdown(breakdown || null);

    setQuizFinished(true);

  };



  const confirmNavigation = (onConfirm: () => void) => {
    if (activeTab === 'practice' && selectedTopic && !quizFinished && selectedTopic !== 'mistakes_list') {
      setConfirmNav(() => onConfirm);
    } else {
      onConfirm();
    }
  };

  const resetState = () => {

    setSelectedTopic(null);

    setQuizFinished(false);

    setScore(0);

    setTotalQuestions(0);

  };



      if (!questionsLoaded) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: darkMode ? '#0f172a' : '#ffffff' }}>
          <img src={splashImg} alt="NDEB AFK PREP PRO" style={{ width: '100%', maxWidth: '400px', objectFit: 'contain', padding: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid rgba(2, 132, 199, 0.2)', borderTop: '3px solid #0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
            `}</style>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>LOADING...</p>
          </div>
        </div>
      );
    }



  return (

    <div className="min-h-screen" style={{ position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'fixed', bottom: '-200px', right: '-150px', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>

        <Stethoscope size={800} color="var(--text-primary)" strokeWidth={0.5} />

      </div>

      

      {/* Scattered Tooth Stencils */}

      <ToothStencil style={{ top: '10%', left: '5%', width: '120px' }} />

      <ToothStencil className="desktop-only" style={{ top: '40%', right: '8%', width: '80px', transform: 'rotate(15deg)' }} />

      <ToothStencil className="desktop-only" style={{ bottom: '15%', left: '12%', width: '150px', transform: 'rotate(-20deg)' }} />

      <ToothStencil style={{ top: '70%', right: '-5%', width: '90px', transform: 'rotate(-15deg)' }} />




      {/* Offline translation error toast */}
      {langToastVisible && (
        <div style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.92)', color: 'white',
          padding: '0.65rem 1.25rem', borderRadius: '999px',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          zIndex: 99999, whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          Translation unavailable — check your connection
        </div>
      )}

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="Pro Features" />
      <ConfirmModal
        isOpen={!!confirmNav}
        title="Quit Quiz?"
        message="Are you sure you want to quit the current quiz? Your progress will be lost."
        confirmLabel="Quit"
        confirmColor="#ef4444"
        onCancel={() => setConfirmNav(null)}
        onConfirm={() => {
          if (confirmNav) { confirmNav(); }
          setConfirmNav(null);
        }}
      />



      <AnimatePresence>

        {showDisclaimer && (

          <motion.div 

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            style={{

              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,

              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',

              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'

            }}

          >

            <motion.div 

              initial={{ scale: 0.9, y: 20 }}

              animate={{ scale: 1, y: 0 }}

              exit={{ scale: 0.9, y: 20 }}

              className="glass-panel"

              style={{ maxWidth: '600px', width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: '1.25rem', background: 'var(--surface-color)' }}

            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', marginBottom: '1rem' }}>

                <AlertTriangle size={24} style={{ flexShrink: 0 }} />

                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>Medical Disclaimer</h2>

              </div>

              

              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.8rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                <p>

                  <strong>For Educational Purposes Only.</strong> This application is strictly designed as a study aid for the Assessment of Fundamental Knowledge (AFK) examination.

                </p>

                <p>

                  The questions and explanations provided within this app are generated utilizing Artificial Intelligence (AI) and simulated data. While every effort is made to ensure medical accuracy, <strong>AI can occasionally make mistakes or hallucinate facts.</strong>

                </p>

                <p>

                  The information in this app <strong>does not constitute medical or clinical advice</strong>, diagnosis, or treatment. It must never be used as a substitute for professional clinical judgment, official dental guidelines, or peer-reviewed medical literature. Do not use this application for real-world patient care or clinical decision-making.

                </p>

                <p style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '0.75rem', margin: '0.5rem 0' }}>

                  <strong>Trademark Notice:</strong> NDEB&reg; and AFK&reg; are registered trademarks of the National Dental Examining Board of Canada. This application is an independent study tool and is <strong>not affiliated with, endorsed by, or sponsored by the NDEB.</strong>

                </p>

              </div>



              <button 

                onClick={handleAcceptDisclaimer}

                className="primary-btn"

                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', fontSize: '0.95rem' }}

              >

                <ShieldCheck size={18} /> I Understand and Agree

              </button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Navbar: two-row mobile layout ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ */}

      <nav style={{ 

        borderBottom: '1px solid var(--border-color)', 

        background: 'var(--surface-color)',

        backdropFilter: 'blur(16px)',

        WebkitBackdropFilter: 'blur(16px)',

        position: 'sticky',

        top: 0,

        zIndex: 100,

        boxShadow: 'var(--shadow-sm)',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 28px)',

      }}>

        {/* Top row: logo + util buttons */}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem' }}>

          {/* Logo */}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }} onClick={() => confirmNavigation(() => { setActiveTab('practice'); resetState(); })}>

            <img src="/icons/icon-192.webp" alt="NDEB AFK Prep Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }} />

            <h1 className="logo-text" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>NDEB AFK Prep Pro</h1>

          </div>



          {/* Util buttons */}

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isPremium && (
              <button 
                onClick={() => setShowPaywall(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none', borderRadius: 'var(--radius-md)', padding: '0.45rem 0.6rem', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', 
                  color: 'white', fontWeight: 700, fontSize: '0.82rem' 
                }}
              >
                <Lock size={14} /> PRO
              </button>
            )}

            {streak > 0 && (

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f97316', fontWeight: 700, background: 'rgba(249,115,22,0.1)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>

                <Flame size={17} /><span translate="no">{streak}</span>

              </div>

            )}

            
            

            

            <button

              aria-label="Toggle language between English and French"
              translate="no"

              onClick={() => toggleLanguage()}

              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '0.85rem' }}

            >

              {isFrench ? 'FR' : 'EN'}

            </button>

            <button data-testid="dark-mode-toggle"

              aria-label="Toggle dark mode"

              onClick={() => setDarkMode(!darkMode)}

              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.45rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}

            >

              {darkMode ? <Sun size={18} /> : <Moon size={18} />}

            </button>

          </div>

        </div>



        {/* Bottom row: tab pills (always full-width, no wrapping) */}

        <div style={{ display: 'flex', padding: '0 0.75rem 0.6rem', gap: '0.35rem' }}>

          {[

            { id: 'practice', label: 'Study Topics', Icon: LibraryBig },

            { id: 'search',   label: 'Search',       Icon: Search },
              

            { id: 'dashboard',label: 'Dashboard',    Icon: LayoutDashboard },

          ].map(({ id, label, Icon }) => (

            <button

              key={id}

              onClick={() => confirmNavigation(() => { setActiveTab(id as any); resetState(); })}

              style={{
                  flex: 1,
                  padding: '0.45rem 0.2rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeTab === id ? 'var(--accent-color)' : 'var(--surface-hover)',
                  color: activeTab === id ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 'clamp(0.6rem, 2.5vw, 0.8rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  lineHeight: 1.15,
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}

            >

              <Icon size={18} /><span>{label}</span>

            </button>

          ))}

        </div>

      </nav>



      <main style={{ padding: 'clamp(0.5rem, 3vw, 1rem)', maxWidth: '1200px', margin: '0 auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>}>
        <AnimatePresence mode="wait">

          {activeTab === 'dashboard' && (

            <motion.div

              key="dashboard"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -20 }}

              transition={{ duration: 0.3 }}

            >

              <Dashboard 

                onStartFlaggedQuiz={() => handleTopicSelect('flagged')} 

                onStartSRSQuiz={() => handleTopicSelect('srs_review')}

                onStartMistakesQuiz={() => handleTopicSelect('mistakes')}

              />

            </motion.div>

          )}

          

          {activeTab === 'search' && (

            <motion.div

              key="search"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -20 }}

              transition={{ duration: 0.3 }}

            >

              <SearchComponent />

            </motion.div>

          )}

          {activeTab === 'practice' && selectedTopic === 'mistakes_list' && (
            <motion.div key="mistakes-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MistakesList onStartMistakesQuiz={() => handleTopicSelect('mistakes')} onBack={() => setSelectedTopic(null)} />
            </motion.div>
          )}



          {activeTab === 'practice' && !selectedTopic && (

            <motion.div

              key="topics"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, x: -50 }}

              transition={{ duration: 0.3 }}

            >

              <TopicSelection onSelect={handleTopicSelect} />

            </motion.div>

          )}



          {activeTab === 'practice' && selectedTopic && selectedTopic !== 'mistakes_list' && !quizFinished && (

            <motion.div

              key="quiz"

              initial={{ opacity: 0, x: 50 }}

              animate={{ opacity: 1, x: 0 }}

              exit={{ opacity: 0, x: -50 }}

              transition={{ duration: 0.3 }}

            >

              <Quiz 

                topicId={selectedTopic} 

                onFinish={handleQuizFinish} 

                onBack={resetState} 

              />

            </motion.div>

          )}



          {activeTab === 'practice' && selectedTopic && selectedTopic !== 'mistakes_list' && quizFinished && (

            <motion.div

              key="results"

              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              transition={{ duration: 0.4, type: 'spring' }}

            >

              <Results 

                score={score} 

                total={totalQuestions} 

                onRestart={resetState} 

                breakdown={quizBreakdown}

              />

            </motion.div>

          )}

        </AnimatePresence>
        </Suspense>

      </main>



      <footer style={{ 

        padding: '2rem 1.5rem', 

        borderTop: '1px solid var(--border-color)', 

        background: 'var(--surface-color)',

        marginTop: 'auto',

        color: 'var(--text-secondary)',

        fontSize: '0.85rem',

        textAlign: 'center',

        lineHeight: 1.6

      }}>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>

            <ShieldCheck size={16} color="#eab308" /> NDEB AFK Prep Pro - Educational Tool

          </div>

          <p style={{ margin: 0 }}>

            <strong>Medical Disclaimer:</strong> This application is strictly for educational and exam preparation purposes. It does not constitute medical advice, diagnosis, or treatment. 

          </p>

          <p style={{ margin: 0 }}>

            Questions and explanations are simulated and AI-generated to mimic the style of the NDEB AFK exam. AI models may occasionally hallucinate or provide inaccurate information. Do not use this application for clinical decision-making or real-world patient care.

          </p>

          <p style={{ margin: 0, fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8 }}>

            <strong>Trademark Notice:</strong> NDEB&reg; and AFK&reg; are registered trademarks of the National Dental Examining Board of Canada. This application is an independent study tool and is not affiliated with, endorsed by, or sponsored by the NDEB.

          </p>

          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>

            &copy; {new Date().getFullYear()} NDEB AFK Prep Pro. All rights reserved.

          </div>

        </div>

      </footer>

          
    </div>
  );
}

export default App;









