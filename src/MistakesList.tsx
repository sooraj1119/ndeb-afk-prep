import React, { useEffect, useState } from 'react';
import { getMistakes, removeMistake } from './lib/storage';
import { loadAllQuestions, getQuestions } from './lib/questionsStore';
import { RefreshCw, Play, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { ArrowLeft } from 'lucide-react';
interface Props {
  onBack?: () => void;
  onStartMistakesQuiz: () => void;
}

export function MistakesList({ onStartMistakesQuiz, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAllQuestions();
      const mistakeIds = getMistakes();
      const allQs = getQuestions();
      const mQs = allQs.filter(q => mistakeIds.includes(q.id));
      setMistakes(mQs);
      setLoading(false);
    };
    init();
  }, []);

  const handleRemove = (id: number) => {
    removeMistake(id);
    setMistakes(prev => prev.filter(q => q.id !== id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw size={40} className="spin" style={{ color: 'var(--accent-color)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your mistakes across all topics...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: 'column', background: 'linear-gradient(to right, var(--surface-color), rgba(239, 68, 68, 0.1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--text-primary)' }}>
              <ArrowLeft size={24} />
            </button>
          )}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '50%', flexShrink: 0, color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Review Mistakes</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You have <strong translate="no">{mistakes.length}</strong> incorrect answers to review.</p>
          </div>
        </div>
        <button 
          onClick={onStartMistakesQuiz}
          disabled={mistakes.length === 0}
          className="primary-btn"
          style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: mistakes.length === 0 ? 0.5 : 1, cursor: mistakes.length === 0 ? 'not-allowed' : 'pointer', background: mistakes.length === 0 ? 'var(--accent-color)' : '#ef4444' }}
        >
          <Play size={18} />
          Drill Mistakes
        </button>
      </div>

      {mistakes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)' }}>
          <CheckCircle2 size={64} style={{ color: '#10b981', margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You don't have any incorrect answers to review right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {mistakes.map((q, idx) => (
            <div key={q.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <span style={{ background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {q.topicId.toUpperCase().replace('-', ' ')}
                </span>
                <button onClick={() => handleRemove(q.id)} title="Remove from Mistakes" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: '1.5' }}>
                <span translate="no">{idx + 1}</span>. {q.question}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {q.options.map((opt: string, i: number) => (
                  <div key={i} style={{ 
                    padding: '0.8rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: i === q.correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-color)',
                    border: i === q.correctAnswer ? '1px solid #10b981' : '1px solid var(--border-color)',
                    color: i === q.correctAnswer ? '#10b981' : 'var(--text-primary)',
                    fontWeight: i === q.correctAnswer ? 600 : 400
                  }}>
                    {opt}
                  </div>
                ))}
              </div>
              
              {q.explanation && (
                <div style={{ padding: '1rem', background: 'rgba(2, 132, 199, 0.05)', borderLeft: '4px solid var(--accent-color)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                  <strong style={{ color: 'var(--accent-color)', display: 'block', marginBottom: '0.5rem' }}>Explanation:</strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}