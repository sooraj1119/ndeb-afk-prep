import React, { useEffect, useState } from 'react';
import { getProgress, TopicProgress, getIsPremium, getFlaggedQuestions, getMistakes, getGamification, resetAllProgress, getHistory, QuizAttempt } from './lib/storage';
import { topics } from './lib/data';
import { getQuestions } from './lib/questionsStore';
import { motion } from 'framer-motion';
import { PaywallModal } from './PaywallModal';
import { Lock } from 'lucide-react';
import { Trophy, Target, BookOpen, Bookmark, Play, AlertOctagon, TrendingUp, XCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface Props {
  onStartFlaggedQuiz: () => void;
  onStartSRSQuiz?: () => void;
  onStartMistakesQuiz: () => void;
}

export function Dashboard({ onStartFlaggedQuiz, onStartMistakesQuiz }: Props) {
  const questions = getQuestions();
    const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
    const [showPaywall, setShowPaywall] = useState(false);
    const isPremium = getIsPremium();

  useEffect(() => {
    setProgress(getProgress());
    setFlaggedCount(getFlaggedQuestions().length);
    setMistakesCount(getMistakes().length);
    setHistory(getHistory());
  }, []);

  const totalQuestionsAvailable = questions.length;
  
  let totalAnsweredCorrectly = 0;
  let totalAttemptedQuestions = 0;
  
  Object.values(progress).forEach(p => {
    let correct = p.highestScore;
    let attempted = p.totalQuestions;
    
    if (!p.isFinished && p.highestScore === 0) {
      correct = p.currentScore || 0;
      attempted = p.questionsAnswered || 0;
    }
    
    totalAnsweredCorrectly += correct;
    totalAttemptedQuestions += attempted;
  });

  const completionPercentage = totalQuestionsAvailable > 0 
    ? Math.round((totalAttemptedQuestions / totalQuestionsAvailable) * 100) 
    : 0;

  const averageAccuracy = totalAttemptedQuestions > 0 
    ? Math.round((totalAnsweredCorrectly / totalAttemptedQuestions) * 100) 
    : 0;

  // Prepare chart data: format timestamp to a short date string, and calculate percentage
  const chartData = history.map((attempt, index) => {
    const date = new Date(attempt.timestamp);
    const shortDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    return {
      name: shortDate,
      score: Math.round((attempt.score / attempt.total) * 100),
      topic: topics.find(t => t.id === attempt.topicId)?.name || attempt.topicId
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}
    >
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Your Progress Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Track your exam readiness and review your weak points.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Stat Card 1 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '1.2rem', borderRadius: '50%', color: 'var(--success-color)' }}>
            <Trophy size={32} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{averageAccuracy}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Accuracy</div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.2rem', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <Target size={32} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{completionPercentage}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Completed</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(217, 70, 239, 0.1)', padding: '1.2rem', borderRadius: '50%', color: '#d946ef' }}>
            <BookOpen size={32} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{totalAttemptedQuestions} / {totalQuestionsAvailable}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions Attempted</div>
          </div>
        </div>
      </div>

      {/* Learning Curve Analytics Graph */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.8rem', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <TrendingUp size={24} />
          </div>
          <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)' }}>Progress Learning Curve</h3>
        </div>
        
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickMargin={10} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
                  formatter={(value: number, name: string, props: any) => [`${value}%`, props.payload.topic]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--accent-color)" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: 'var(--accent-color)', stroke: 'var(--surface-color)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0 }}>Complete a quiz to see your learning curve.</p>
          </div>
        )}
      </div>

      {/* Flagged Review Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, var(--surface-color), rgba(251, 191, 36, 0.1))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '1.2rem', borderRadius: '50%', color: '#d97706' }}>
            <Bookmark size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Review Flagged Questions</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You have <strong>{flaggedCount}</strong> questions saved for review.</p>
          </div>
        </div>
        <button 
          onClick={onStartFlaggedQuiz}
          disabled={flaggedCount === 0}
          className="primary-btn"
          style={{ padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: flaggedCount === 0 ? 0.5 : 1, cursor: flaggedCount === 0 ? 'not-allowed' : 'pointer' }}
        >
          <Play size={18} />
          Start Review
        </button>
      </div>

      {/* Mistakes Review Section */}
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, var(--surface-color), rgba(239, 68, 68, 0.1))' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.2rem', borderRadius: '50%', color: '#ef4444' }}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Weakness Drilling</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You have <strong>{mistakesCount}</strong> past mistakes to conquer.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (!isPremium) setShowPaywall(true);
              else onStartMistakesQuiz();
            }}
            disabled={mistakesCount === 0 && isPremium}
            className="primary-btn"
            style={{ padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (mistakesCount === 0 && isPremium) ? 0.5 : 1, cursor: (mistakesCount === 0 && isPremium) ? 'not-allowed' : 'pointer', background: (mistakesCount === 0 && isPremium) ? 'var(--accent-color)' : '#ef4444' }}
          >
            {!isPremium ? <Lock size={18} /> : <Play size={18} />}
            {!isPremium ? 'Unlock Pro' : 'Drill Mistakes'}
          </button>
        </div>

      {/* Gamification / Badges Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Trophy size={24} color="var(--accent-color)" /> 
          Achievements & Badges
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {getGamification().badges.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
              No badges earned yet. Complete quizzes to unlock them!
            </div>
          ) : (
            getGamification().badges.map((badge, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '2.5rem' }}>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{badge}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>Unlocked!</div>
              </div>
            ))
          )}
        </div>
      </div>

      <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Topic Breakdown</h3>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {topics.map((topic, idx) => {
          const topicProg = progress[topic.id];
          const hasAttempted = !!topicProg;
          
          let completionProgress = 0;
          let accuracy = 0;
          let attemptedCount = 0;
          
          if (hasAttempted) {
             // For completion, we just look at how many questions they answered
             attemptedCount = topicProg.isFinished ? topicProg.totalQuestions : (topicProg.questionsAnswered || 0);
             completionProgress = Math.round((attemptedCount / topicProg.totalQuestions) * 100);
             
             // For accuracy, we calculate based on what they got right vs what they answered
             if (attemptedCount > 0) {
                 const correctCount = topicProg.isFinished ? topicProg.highestScore : (topicProg.currentScore || 0);
                 accuracy = Math.round((correctCount / attemptedCount) * 100);
             }
          }
          
          return (
            <div key={topic.id} style={{ 
              padding: '1.5rem', 
              borderBottom: idx !== topics.length - 1 ? '1px solid var(--border-color)' : 'none',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>{topic.name}</span>
                    {hasAttempted && !topicProg.isFinished && topicProg.currentIndex > 0 && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--surface-hover)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>In Progress</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {hasAttempted ? `${attemptedCount} / ${topicProg.totalQuestions} Completed` : '0 Completed'}
                  </div>
                </div>
                
                {/* Completion Progress Bar Background */}
                <div style={{ width: '100%', height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ 
                      height: '100%', 
                      background: completionProgress >= 100 ? 'var(--success-color)' : completionProgress > 0 ? 'var(--accent-color)' : 'transparent',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: hasAttempted && attemptedCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '1.2rem' }}>
                  {hasAttempted && attemptedCount > 0 ? `${accuracy}%` : '--'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Accuracy
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, fontSize: '1.2rem' }}>
          <AlertOctagon size={24} /> Danger Zone
        </div>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, maxWidth: '500px', fontSize: '0.95rem' }}>
          This will permanently delete all your flagged questions, score history, and topic progress. This action cannot be undone.
        </p>
        <button 
          onClick={() => {
            if (window.confirm('Are you absolutely sure you want to reset all progress? This cannot be undone.')) {
              resetAllProgress();
            }
          }}
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
        >
          Reset All Progress
        </button>
      </div>
    <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="Pro Features" />
    </motion.div>
  );
}





