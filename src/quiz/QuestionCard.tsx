import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionCardProps {
  question: any;
  currentIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  onSelect: (index: number) => void;
  isPlayingAudio: boolean;
  onToggleAudio: (elementId: string, fallbackText: string) => void;
}

export function QuestionCard({
  question,
  currentIndex,
  selectedAnswer,
  isAnswered,
  onSelect,
  isPlayingAudio,
  onToggleAudio
}: QuestionCardProps) {
  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-panel"
          style={{ padding: '2.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 id="current-question-text" style={{ fontSize: '1.3rem', margin: 0, lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: 600 }}>{question.question}</h3>
              {question.imageUrl && (
                <img
                  src={question.imageUrl}
                  alt="Question reference"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}
                />
              )}
            </div>
            <button
              onClick={() => onToggleAudio('current-question-text', question.question)}
              title="Listen to question"
              style={{ flexShrink: 0, background: 'var(--surface-hover)', border: 'none', padding: '0.6rem', borderRadius: '50%', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {isPlayingAudio ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
            {question.options.map((option: string, idx: number) => {
              let bg = 'var(--surface-color)';
              let border = '1px solid var(--border-color)';
              let textColor = 'var(--text-primary)';

              if (isAnswered) {
                if (idx === question.correctAnswer) {
                  bg = 'rgba(16, 185, 129, 0.15)';
                  border = '1px solid var(--success-color)';
                  textColor = 'var(--success-color)';
                } else if (idx === selectedAnswer) {
                  bg = 'rgba(239, 68, 68, 0.15)';
                  border = '1px solid var(--error-color)';
                  textColor = 'var(--error-color)';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  disabled={isAnswered}
                  style={{
                    padding: '1.2rem',
                    borderRadius: 'var(--radius-md)',
                    background: bg,
                    border: border,
                    color: textColor,
                    textAlign: 'left',
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    opacity: isAnswered && idx !== selectedAnswer && idx !== question.correctAnswer ? 0.35 : 1,
                    cursor: isAnswered ? 'default' : 'pointer',
                    boxShadow: !isAnswered ? 'var(--shadow-sm)' : 'none',
                    transition: 'opacity 0.2s ease, background 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isAnswered && idx === question.correctAnswer ? 'var(--success-color)' : isAnswered && idx === selectedAnswer ? 'var(--error-color)' : '#f1f5f9',
                    color: isAnswered && (idx === question.correctAnswer || idx === selectedAnswer) ? 'white' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0,
                    fontSize: '0.95rem'
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span style={{ lineHeight: '1.4' }}>{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
