import React from 'react';
import { Trophy, RefreshCw, Star, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { topics } from './lib/data';
import { Crown } from 'lucide-react';
import { getIsPremium } from './lib/storage';
import { PaywallModal } from './PaywallModal';
import { useState, useEffect } from 'react';

interface Props {
  score: number;
  total: number;
  onRestart: () => void;
  breakdown?: Record<string, { correct: number; total: number }> | null;
}

export function Results({ score, total, onRestart, breakdown }: Props) {
  const isPremium = getIsPremium();
  const [showPaywall, setShowPaywall] = useState(false);
  useEffect(() => {
    if (!isPremium) {
      const t = setTimeout(() => setShowPaywall(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isPremium]);

  const percentage = Math.round((score / total) * 100);
  
  let message = "";
  if (percentage >= 90) message = "Exceptional work! You are more than ready.";
  else if (percentage >= 70) message = "Great job! Keep reviewing to lock it in.";
  else message = "Good effort! Review the explanations and try again.";

  const breakdownData = breakdown 
    ? Object.keys(breakdown).map(topicId => {
        const t = topics.find(t => t.id === topicId);
        const name = t ? t.name.replace(' & ', ' ') : topicId;
        const b = breakdown[topicId];
        return {
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          score: Math.round((b.correct / b.total) * 100)
        };
      }).sort((a, b) => b.score - a.score)
    : [];

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <motion.div 
        className="glass-panel" 
        style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', background: 'var(--surface-color)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--accent-color)' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
        >
          {percentage >= 70 ? <Trophy size={48} /> : <Star size={48} />}
        </motion.div>
        
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Quiz Complete!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{message}</p>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-0.05em' }}>
            {percentage}%
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
            {score} out of {total} correct
          </div>
        </div>

        {breakdownData.length > 0 && (
          <div style={{ width: '100%', marginTop: '1rem', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <BarChart2 size={20} color="var(--accent-color)" /> Topic Breakdown
            </h3>
            <div style={{ width: '100%', height: `${Math.max(300, breakdownData.length * 40)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Accuracy']}
                    contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="score" fill="var(--accent-color)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <motion.button 
          onClick={onRestart}
          className="primary-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '400px', justifyContent: 'center', fontSize: '1.2rem', padding: '1.2rem', marginTop: '1rem' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw size={20} /> Choose Another Topic
        </motion.button>

        {!isPremium && (
          <div
            onClick={() => setShowPaywall(true)}
            style={{
              marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px dashed var(--success-color)', cursor: 'pointer'
            }}
          >
            <Crown size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Want more questions?</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              You've completed the free preview. Unlock all 7,500+ questions and full simulated exams to maximize your score.
            </p>
            <button className="primary-btn" style={{ background: 'var(--success-color)' }}>
              Upgrade to Pro
            </button>
          </div>
        )}

        <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="all 7,500 questions" />
      </motion.div>
    </div>
  );
}
