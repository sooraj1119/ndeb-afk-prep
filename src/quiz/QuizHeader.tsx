import React from 'react';
import { Clock, Shuffle, RefreshCw, Bookmark, BookmarkCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizHeaderProps {
  topicName: string;
  isSimulatedMode: boolean;
  isSRSMode: boolean;
  isFlaggedMode: boolean;
  timeLeft: number;
  isShuffled: boolean;
  onToggleShuffle: () => void;
  onRestartMockExam: () => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  
  currentIndex: number;
  totalQuestions: number;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
}

export function QuizHeader({
  topicName,
  isSimulatedMode,
  isSRSMode,
  isFlaggedMode,
  timeLeft,
  isShuffled,
  onToggleShuffle,
  onRestartMockExam,
  isFlagged,
  onToggleFlag,
  
  currentIndex,
  totalQuestions,
  progressPercentage,
  formatTime
}: QuizHeaderProps) {
  return (
    <>
      <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ height: '100%', background: isSimulatedMode ? '#3b82f6' : isSRSMode ? '#f59e0b' : 'var(--accent-color)', borderRadius: '3px' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{topicName}</h2>
          {isSimulatedMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
              <Clock size={16} /> {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          {!isSimulatedMode && !isFlaggedMode && !isSRSMode && (
            <button
              onClick={onToggleShuffle}
              title={isShuffled ? 'Shuffled - click to restore order' : 'Shuffle questions'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: isShuffled ? 'var(--accent-color)' : 'var(--text-secondary)',
                background: isShuffled ? 'rgba(2,132,199,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)', transition: 'all 0.2s', fontWeight: 600
              }}
            >
              <Shuffle size={16} />
              <span style={{ fontSize: '0.85rem' }}>{isShuffled ? 'On' : 'Shuffle'}</span>
            </button>
          )}
          {isSimulatedMode && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to restart this mock exam? Your current progress will be lost.')) {
                  onRestartMockExam();
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--error-color)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <RefreshCw size={16} /> <span className="desktop-only">Restart</span>
            </button>
          )}
                    
          
          <button
            onClick={onToggleFlag}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isFlagged ? '#eab308' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', margin: '0 -0.4rem' }}
          >
            {isFlagged ? <BookmarkCheck fill="#eab308" size={20} /> : <Bookmark size={20} />}
            <span className="desktop-only" style={{ fontWeight: 600 }}>{isFlagged ? 'Flagged' : 'Flag'}</span>
          </button>
          <span style={{ background: 'var(--surface-hover)', color: 'var(--accent-color)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>
    </>
  );
}



