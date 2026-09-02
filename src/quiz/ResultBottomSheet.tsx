import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultBottomSheetProps {
  isAnswered: boolean;
  isCorrect: boolean;
  isSimulatedMode: boolean;
  explanation: string;
  correctAnswerText: string;
  isPlayingAudio: boolean;
  onToggleAudio: (elementId: string, fallbackText: string) => void;
  onNext: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  isLastQuestion: boolean;
}

export function ResultBottomSheet({
  isAnswered,
  isCorrect,
  isSimulatedMode,
  explanation,
  correctAnswerText,
  isPlayingAudio,
  onToggleAudio,
  onNext,
  onPrev,
  currentIndex = 0,
  isLastQuestion
}: ResultBottomSheetProps) {
  return (
    <AnimatePresence>
      {isAnswered && (
        <motion.div
          key="bottom-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--surface-color)',
            borderTop: `4px solid ${isCorrect ? 'var(--success-color)' : 'var(--error-color)'}`,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
            zIndex: 200,
            padding: '1.25rem 1.5rem',
            paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
            maxHeight: '55vh',
            overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: isCorrect ? 'var(--success-color)' : 'var(--error-color)', fontSize: '1.2rem' }}>
                {isCorrect ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {onPrev && (
                  <button
                    onClick={onPrev}
                    disabled={currentIndex === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0,
                      padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)',
                      fontWeight: 600, fontSize: '1rem',
                      background: currentIndex === 0 ? 'var(--surface-hover)' : 'var(--bg-color)',
                      color: currentIndex === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentIndex === 0 ? 0.5 : 1
                    }}
                  >
                    Prev
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="primary-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                >
                  {!isLastQuestion ? 'Next' : 'Finish'} <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {!isCorrect && !isSimulatedMode && (
              <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Sparkles size={16} /> Tutor Explanation
                  </div>
                  <button
                    onClick={() => onToggleAudio('current-explanation-text', explanation || `The correct answer is: ${correctAnswerText}`)}
                    title="Listen"
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {isPlayingAudio ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                </div>
                <div id="current-explanation-text" style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.97rem' }}>
                  {explanation || `The correct answer is: ${correctAnswerText}`}
                </div>
              </div>
            )}

            {!isLastQuestion && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: '0.73rem', color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '0.02em' }}>
                swipe left or press Enter for next
              </p>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
