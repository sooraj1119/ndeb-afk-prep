import React, { useEffect, useState } from 'react';
import { getProgress, TopicProgress, getIsPremium, getFlaggedQuestions, getMistakes, getGamification, resetAllProgress, getHistory, QuizAttempt } from './lib/storage';
import { topics } from './lib/data';
import { getQuestions } from './lib/questionsStore';
import { motion } from 'framer-motion';
import { PaywallModal } from './PaywallModal';
import { Lock } from 'lucide-react';
import { Trophy, Target, BookOpen, Bookmark, Play, AlertOctagon, TrendingUp, XCircle, AlertCircle, CalendarDays, Edit2, Check } from 'lucide-react';
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
  
  const [examDate, setExamDateState] = useState<number | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState("");

  useEffect(() => {
    setProgress(getProgress());
    setFlaggedCount(getFlaggedQuestions().length);
    setMistakesCount(getMistakes().length);
    setHistory(getHistory());
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const ed = localStorage.getItem('ndeb_prep_exam_date');
      if (ed) {
        setExamDateState(parseInt(ed));
        setTempDate(new Date(parseInt(ed)).toISOString().split('T')[0]);
      }
    }
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

  // --- Pacing Engine Logic ---
  const totalBankQuestions = 7500; 
  let answeredSoFar = 0;
  Object.values(progress).forEach(p => {
    answeredSoFar += p.questionsAnswered || 0;
  });
  
  let daysLeft = 0;
  let dailyQuota = 0;
  if (examDate) {
    const msLeft = examDate - Date.now();
    daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    const remainingQuestions = Math.max(0, totalBankQuestions - answeredSoFar);
    dailyQuota = Math.ceil(remainingQuestions / daysLeft);
  }

  const handleSaveDate = () => {
    if (!tempDate) return;
    const ms = new Date(tempDate).getTime();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('ndeb_prep_exam_date', ms.toString());
    }
    setExamDateState(ms);
    setIsEditingDate(false);
  };
  // ---------------------------

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
        
        {/* Dynamic Study Pacing Engine */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.1)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(34,197,94,0.3)' }}>
                <CalendarDays size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#166534', fontWeight: 700 }}>Dynamic Study Pacer</h3>
                <p style={{ margin: '0.2rem 0 0', color: '#15803d', fontSize: '0.95rem' }}>Automated planning for your exam date</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isEditingDate ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    value={tempDate} 
                    onChange={(e) => setTempDate(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #86efac', outline: 'none' }}
                  />
                  <button onClick={handleSaveDate} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18} /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingDate(true)}
                  style={{ background: 'white', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                >
                  <Edit2 size={14} /> {examDate ? new Date(examDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'}) : "Set Exam Date"}
                </button>
              )}
            </div>
          </div>
          
          {examDate ? (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{dailyQuota}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Questions / Day</div>
              </div>
              <div style={{ height: '50px', width: '1px', background: '#e5e7eb', display: typeof window !== 'undefined' && window.innerWidth > 500 ? 'block' : 'none' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Days Left</div>
              </div>
              <div style={{ height: '50px', width: '1px', background: '#e5e7eb', display: typeof window !== 'undefined' && window.innerWidth > 500 ? 'block' : 'none' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{totalBankQuestions - answeredSoFar}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Remaining in Bank</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginTop: '0.5rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Set your exam date to instantly generate a personalized daily study quota.</p>
            </div>
          )}
        </motion.div>

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





