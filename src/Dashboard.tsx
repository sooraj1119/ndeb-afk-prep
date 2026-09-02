import React, { useEffect, useState } from 'react';
import { getProgress, TopicProgress, getIsPremium, getFlaggedQuestions, getMistakes, getGamification, resetAllProgress, getHistory, QuizAttempt, awardBadge } from './lib/storage';
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
        const parsed = parseInt(ed);
        if (!isNaN(parsed)) {
          setExamDateState(parsed);
          try {
            setTempDate(new Date(parsed).toISOString().split('T')[0]);
          } catch (e) {
            // Ignore RangeError on corrupted dates
          }
        } else {
          localStorage.removeItem('ndeb_prep_exam_date');
        }
      }
    }
  }, []);

  const totalQuestionsAvailable = questions.length;
  
  let totalAnsweredCorrectly = 0;
  let totalAttemptedQuestions = 0;
  
  Object.values(progress).forEach(p => {
    // Only include real topics in the global stats
    if (!topics.find(t => t.id === p.topicId)) return;

    const attempted = p.isFinished ? p.totalQuestions : (p.questionsAnswered || 0);
    let correct = p.isFinished ? p.highestScore : (p.currentScore || 0);
    
    // Safety clamp to guarantee it never exceeds 100% mathematically
    correct = Math.min(correct, attempted);
    
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
    if (!tempDate) {
      setIsEditingDate(false);
      return;
    }
    // Safari iOS bug fix: explicitly parse YYYY-MM-DD instead of relying on new Date(string)
    const [year, month, day] = tempDate.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const ms = dateObj.getTime();
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('ndeb_prep_exam_date', ms.toString());
    }
    setExamDateState(ms);
    setIsEditingDate(false);
  };
  // ---------------------------

  // Prepare chart data: format timestamp to a short date string, and calculate percentage
  const topicHistories = history.reduce((acc, attempt) => {
    if (!acc[attempt.topicId]) acc[attempt.topicId] = [];
    acc[attempt.topicId].push(attempt);
    return acc;
  }, {} as Record<string, QuizAttempt[]>);

  const topicMilestones: Record<string, Record<number, number>> = {};
  let maxMilestone = 0;

  for (const [topicId, attempts] of Object.entries(topicHistories)) {
    let cumulativeTotal = 0;
    let cumulativeScore = 0;
    let nextTarget = 100;
    topicMilestones[topicId] = {};

    for (const attempt of attempts) {
      cumulativeTotal += attempt.total;
      cumulativeScore += attempt.score;

      while (cumulativeTotal >= nextTarget) {
        topicMilestones[topicId][nextTarget] = Math.round((cumulativeScore / cumulativeTotal) * 100);
        if (nextTarget > maxMilestone) maxMilestone = nextTarget;
        nextTarget += 100;
      }
    }
  }

  const chartData: any[] = [];
  for (let m = 100; m <= maxMilestone; m += 100) {
    const dataPoint: any = { name: `${m} Qs` };
    for (const topicId of Object.keys(topicHistories)) {
      if (topicMilestones[topicId][m] !== undefined) {
        const topicName = topics.find(t => t.id === topicId)?.name || topicId;
        dataPoint[topicName] = topicMilestones[topicId][m];
      }
    }
    chartData.push(dataPoint);
  }

  const CHART_COLORS = ['#0ea5e9', '#ef4444', '#f59e0b', '#84cc16', '#a855f7', '#6366f1', '#f97316', '#22c55e', '#ec4899'];
  const activeTopicNames = Object.keys(topicHistories).map(id => topics.find(t => t.id === id)?.name || id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}
    >
              <div style={{ marginBottom: 'clamp(1rem, 4vw, 1.5rem)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Your Progress Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 4vw, 1rem)' }}>Track your exam readiness and review your weak areas.</p>
          </div>
          {!isPremium && (
            <button 
              onClick={() => setShowPaywall(true)}
              className="primary-btn pulse-glow"
              style={{ padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}
            >
              <Lock size={20} /> Upgrade to Pro
            </button>
          )}
        </div>
        
        {/* Dynamic Study Pacing Engine */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginBottom: 'clamp(1rem, 4vw, 1.5rem)', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 'var(--radius-lg)', padding: 'clamp(0.85rem, 3vw, 1.25rem) clamp(0.75rem, 3vw, 1rem)', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.1)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(34,197,94,0.3)' }}>
                <CalendarDays size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', color: '#166534', fontWeight: 700 }}>Dynamic Study Pacer</h3>
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
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{dailyQuota}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Questions / Day</div>
              </div>
              <div style={{ height: '50px', width: '1px', background: '#e5e7eb', display: typeof window !== 'undefined' && window.innerWidth > 500 ? 'block' : 'none' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Days Left</div>
              </div>
              <div style={{ height: '50px', width: '1px', background: '#e5e7eb', display: typeof window !== 'undefined' && window.innerWidth > 500 ? 'block' : 'none' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{totalBankQuestions - answeredSoFar}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.3rem' }}>Remaining in Bank</div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginTop: '0.5rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Set your exam date to instantly generate a personalized daily study quota.</p>
            </div>
          )}
        </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: 'clamp(1rem, 4vw, 1.5rem)' }}>
        
        {/* Stat Card 1 */}
        <div className="glass-panel" style={{ padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '0.8rem', borderRadius: '50%', color: 'var(--success-color)' }}>
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{averageAccuracy}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Accuracy</div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-panel" style={{ padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.8rem', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <Target size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{completionPercentage}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Completed</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-panel" style={{ padding: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(217, 70, 239, 0.1)', padding: '0.8rem', borderRadius: '50%', color: '#d946ef' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{totalAttemptedQuestions} / {totalQuestionsAvailable}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions Attempted</div>
          </div>
        </div>
      </div>

      {/* Learning Curve Analytics Graph */}
        <div className="glass-panel" style={{ padding: 'clamp(0.85rem, 3vw, 1.25rem)', marginBottom: 'clamp(1rem, 4vw, 1.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.8rem', borderRadius: '50%', color: 'var(--accent-color)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', margin: 0, color: 'var(--text-primary)' }}>Progress Learning Curve</h3>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Milestone accuracy mapped per 100 questions completed</p>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  {activeTopicNames.map((name, idx) => (
                    <Line 
                      key={name}
                      type="monotone" 
                      dataKey={name} 
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                      strokeWidth={3}
                      connectNulls
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>Complete 100 questions in any topic to unlock your learning curve.</p>
            </div>
          )}
        </div>
  
        {/* Flagged Review Section */}
      <div className="glass-panel" style={{ padding: 'clamp(0.85rem, 3vw, 1.25rem)', marginBottom: 'clamp(0.75rem, 3vw, 1rem)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, var(--surface-color), rgba(251, 191, 36, 0.1))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '0.8rem', borderRadius: '50%', color: '#d97706' }}>
            <Bookmark size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', color: 'var(--text-primary)' }}>Review Flagged Questions</h3>
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
              <div className="glass-panel" style={{ padding: 'clamp(0.85rem, 3vw, 1.25rem)', marginBottom: 'clamp(1rem, 4vw, 1.5rem)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, var(--surface-color), rgba(239, 68, 68, 0.1))' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '50%', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.05rem, 4vw, 1.2rem)', color: 'var(--text-primary)' }}>Weakness Drilling</h3>
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
      <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
        <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Trophy size={24} color="var(--accent-color)" /> 
          Achievements & Badges
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {getGamification().badges.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
              No badges earned yet. Complete quizzes to unlock them!
            </div>
          ) : (
            getGamification().badges.map((badge, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>🏆</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{badge}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>Unlocked!</div>
              </div>
            ))
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Topic Breakdown</h3>
      <div className="topic-grid">
        {topics.map((topic, idx) => {
          const topicProg = progress[topic.id];
          const hasAttempted = !!topicProg;
          
          let completionProgress = 0;
          let accuracy = 0;
          let attemptedCount = 0;
          
          if (hasAttempted) {
             attemptedCount = topicProg.isFinished ? topicProg.totalQuestions : (topicProg.questionsAnswered || 0);
             completionProgress = Math.round((attemptedCount / topicProg.totalQuestions) * 100);
             if (attemptedCount > 0) {
                 let correctCount = topicProg.isFinished ? topicProg.highestScore : (topicProg.currentScore || 0);
                 correctCount = Math.min(correctCount, attemptedCount);
                 accuracy = Math.round((correctCount / attemptedCount) * 100);
             }
          }
          
          return (
            <div key={topic.id} className="glass-panel topic-card" style={{ 
              padding: '0.8rem', 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.75rem, 3.5vw, 0.9rem)', color: 'var(--text-primary)', lineHeight: 1.15, wordBreak: 'break-word', hyphens: 'auto', letterSpacing: '-0.02em' }}>
                  {topic.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                  <div style={{ fontWeight: 800, color: hasAttempted && attemptedCount > 0 ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {hasAttempted && attemptedCount > 0 ? `${accuracy}%` : '--'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    ACC
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div className="stats-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem', flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: 'clamp(0.65rem, 3vw, 0.75rem)', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hasAttempted ? `${attemptedCount} / ${topicProg.totalQuestions}` : '0'}
                  </span>
                  {hasAttempted && !topicProg.isFinished && topicProg.currentIndex > 0 && (
                    <span className="completed-badge" style={{ flexShrink: 0, fontSize: 'clamp(0.55rem, 2vw, 0.6rem)', background: 'var(--surface-hover)', color: 'var(--text-secondary)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>Active</span>
                  )}
                  {hasAttempted && topicProg.isFinished && (
                    <span className="completed-badge" style={{ flexShrink: 0, fontSize: 'clamp(0.55rem, 2vw, 0.6rem)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>Done</span>
                  )}
                  </div>
                  
                  <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionProgress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ 
                        height: '100%', 
                        background: completionProgress >= 100 ? '#10b981' : completionProgress > 0 ? 'var(--accent-color)' : 'transparent',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, fontSize: 'clamp(0.85rem, 4vw, 1rem)' }}>
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





