import React, { useState, useEffect } from 'react';
import { topics } from './lib/data';
import { PlayCircle, Clock, Trophy, Flame, ChevronRight, Activity, CalendarDays, LibraryBig } from 'lucide-react';
import { motion } from 'framer-motion';
import { getIsPremium } from './lib/storage';
import { PaywallModal } from './PaywallModal';
import { Lock, Crown } from 'lucide-react';
import { getTopicProgress, getDueSRSQuestions } from './lib/storage';
import { loadAllQuestions } from './lib/questionsStore';


interface Props {
  onSelect: (topicId: string) => void;
}

export function TopicSelection({ onSelect }: Props) {
  const [showPaywall, setShowPaywall] = useState(false);
  const isPremium = getIsPremium();
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);

  useEffect(() => {
    // Check how many questions are due for Spaced Repetition Review today
    const dueIds = getDueSRSQuestions();
    setDueReviewCount(dueIds.length);
  }, []);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'questions/manifest.json').then(r => r.json()).then((manifest: {id:string,count:number}[]) => {
      const counts: Record<string,number> = {};
      manifest.forEach((t: {id:string,count:number}) => { counts[t.id] = t.count; });
      setTopicCounts(counts);
    }).catch(() => {});
    loadAllQuestions().catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
        
        <div style={{ marginBottom: '3rem', textAlign: 'center', position: 'relative' }}>
          {!isPremium && (
            <button 
              onClick={() => setShowPaywall(true)}
              style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.4)', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Crown size={18} /> Upgrade to Pro
            </button>
          )}
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Select a Topic</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Master fundamental knowledge with AI-driven explanations.</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '3rem' }}>
        
        {/* Daily Review Banner */}
        <motion.div 
          onClick={() => dueReviewCount > 0 && onSelect('srs_review')}
          whileHover={dueReviewCount > 0 ? { y: -5, boxShadow: 'var(--shadow-md)' } : {}}
          style={{
            background: dueReviewCount > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--surface-hover)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            color: dueReviewCount > 0 ? 'white' : 'var(--text-secondary)',
            cursor: dueReviewCount > 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: dueReviewCount > 0 ? 'var(--shadow-sm)' : 'none',
            gridColumn: '1 / -1',
            opacity: dueReviewCount > 0 ? 1 : 0.6
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: dueReviewCount > 0 ? 'rgba(255,255,255,0.2)' : 'var(--border-color)', padding: '0.8rem', borderRadius: '50%', flexShrink: 0 }}>
              <CalendarDays size={32} color={dueReviewCount > 0 ? "white" : "var(--text-secondary)"} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Daily Review (Spaced Repetition)</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
                {dueReviewCount > 0 
                  ? `You have ${dueReviewCount} questions due for review today.` 
                  : "You're all caught up for today!"}
              </p>
            </div>
          </div>
          {dueReviewCount > 0 && <ChevronRight size={28} opacity={0.8} style={{ flexShrink: 0 }} />}
        </motion.div>

        {/* Simulation Mode Banner */}
        <motion.div 
          onClick={() => onSelect('simulated')}
          whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            gridColumn: '1 / -1'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '50%', flexShrink: 0 }}>
              <Activity size={32} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Simulated Mock Exam</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>100 random questions | 2.5 hour timer</p>
            </div>
          </div>
          <ChevronRight size={28} opacity={0.8} style={{ flexShrink: 0 }} />
        </motion.div>

        <motion.div 
          onClick={() => {
            if (!isPremium) setShowPaywall(true);
            else onSelect('mistakes_list');
          }}
          whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            gridColumn: '1 / -1'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '50%', flexShrink: 0 }}>
              {!isPremium ? <Lock size={32} color="white" /> : <Flame size={32} color="white" />}
            </div>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Review Mistakes</h3>
                {!isPremium && <span style={{ background: '#eab308', color: '#854d0e', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={12} /> PRO</span>}
              </div>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>Drill incorrectly answered questions to master your weak points</p>
            </div>
          </div>
          <ChevronRight size={28} opacity={0.8} style={{ flexShrink: 0 }} />
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
      >
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isHovered = hoveredId === topic.id;
          const progress = getTopicProgress(topic.id);
          
          const topicCount = topicCounts[topic.id] || 0;

          return (
            <motion.div 
              key={topic.id}
              variants={itemVariants}
              onClick={() => onSelect(topic.id)}
              onMouseEnter={() => setHoveredId(topic.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="glass-panel"
              style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: isHovered ? 'var(--accent-color)' : 'var(--surface-hover)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={28} color={isHovered ? 'white' : 'var(--accent-color)'} />
                </div>
                
                {progress?.isFinished && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Trophy size={14} /> Completed
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 700 }}>{topic.name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LibraryBig size={16} /> <span>{topicCount}</span> Questions
                </span>
                {progress && progress.currentIndex > 0 && !progress.isFinished && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308' }}>
                    <Clock size={16} /> In Progress
                  </span>
                )}
              </div>

              {progress && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Best Score</span>
                    <span style={{ color: 'var(--accent-color)' }}>{Math.round((progress.highestScore / progress.totalQuestions) * 100) || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'var(--accent-color)', 
                      width: `${(progress.highestScore / progress.totalQuestions) * 100}%`,
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}



