import { getTotalQuestionCount } from './lib/questionsStore';
import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Star, BarChart2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { topics } from './lib/data';
import { usePremiumStatus } from './lib/storage';
import { PaywallModal } from './PaywallModal';

interface Props {
  score: number;
  total: number;
  onRestart: () => void;
  breakdown?: Record<string, { correct: number; total: number }> | null;
}

export function Results({ score, total, onRestart, breakdown }: Props) {
  const isPremium = usePremiumStatus();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      const t = setTimeout(() => setShowPaywall(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isPremium]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  let message = "";
  if (percentage >= 90) message = "Exceptional work! You are more than ready.";
  else if (percentage >= 70) message = "Great job! Keep reviewing to lock it in.";
  else message = "Good effort! Review the explanations and try again.";

  const breakdownData = breakdown 
    ? Object.keys(breakdown).map(topicId => {
        const t = topics.find(t => t.id === topicId);
        const name = t ? t.name : topicId;
        const b = breakdown[topicId];
        return {
          id: topicId,
          name,
          correct: b.correct,
          total: b.total,
          score: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0
        };
      }).sort((a, b) => b.score - a.score)
    : [];

  return (
    <div style={{ maxWidth: '800px', margin: '1rem auto 2rem', textAlign: 'center', padding: '0 0.75rem' }}>
      <motion.div 
        className="glass-panel" 
        style={{ 
          padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 1.75rem)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1.5rem', 
          background: 'var(--surface-color)' 
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.25rem', borderRadius: '50%', color: 'var(--accent-color)' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
        >
          {percentage >= 70 ? <Trophy size={44} /> : <Star size={44} />}
        </motion.div>
        
        <div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Quiz Complete!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>{message}</p>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '1.5rem 1rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '380px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 'clamp(2.75rem, 8vw, 3.5rem)', fontWeight: '800', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-0.05em' }}>
            <span translate="no">{percentage}</span>%
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>
            <span translate="no">{score}</span> out of <span translate="no">{total}</span> correct
          </div>
        </div>

        {breakdownData.length > 0 && (
          <div style={{ 
            width: '100%', 
            marginTop: '0.5rem', 
            background: 'var(--surface-color)', 
            padding: 'clamp(1rem, 3vw, 1.5rem)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-color)',
            textAlign: 'left'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              <BarChart2 size={20} color="var(--accent-color)" /> Topic Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%' }}>
              {breakdownData.map((item) => {
                const isHigh = item.score >= 75;
                const isMid = item.score >= 50;
                const badgeColor = isHigh ? '#10b981' : isMid ? 'var(--accent-color)' : '#ef4444';
                const badgeBg = isHigh ? 'rgba(16, 185, 129, 0.1)' : isMid ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                const barGradient = isHigh 
                  ? 'linear-gradient(90deg, #10b981, #059669)' 
                  : isMid 
                  ? 'linear-gradient(90deg, var(--accent-color), #0284c7)' 
                  : 'linear-gradient(90deg, #f87171, #ef4444)';

                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'clamp(0.82rem, 2.8vw, 0.92rem)' }}>
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span translate="no">{item.correct}</span>/<span translate="no">{item.total}</span>
                        </span>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          color: badgeColor, 
                          background: badgeBg, 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '4px' 
                        }}>
                          <span translate="no">{item.score}</span>%
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ 
                          height: '100%', 
                          background: barGradient,
                          borderRadius: '999px'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <motion.button 
          onClick={onRestart}
          className="primary-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '380px', justifyContent: 'center', fontSize: '1.1rem', padding: '1rem', marginTop: '0.5rem' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw size={20} /> Choose Another Topic
        </motion.button>

        {!isPremium && (
          <div
            onClick={() => setShowPaywall(true)}
            style={{
              marginTop: '1.5rem', padding: '1.5rem 1rem', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px dashed var(--success-color)', cursor: 'pointer', width: '100%', maxWidth: '380px'
            }}
          >
            <Crown size={30} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Want more questions?</h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              You have completed the free preview. Unlock all {getTotalQuestionCount().toLocaleString()} questions and full simulated exams to maximize your score.
            </p>
            <button className="primary-btn" style={{ background: 'var(--success-color)', width: '100%' }}>
              Upgrade to Pro
            </button>
          </div>
        )}

        <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature={`all ${getTotalQuestionCount().toLocaleString()} questions`} />
      </motion.div>
    </div>
  );
}