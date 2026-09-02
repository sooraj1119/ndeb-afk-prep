import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | number;
}

export function ReportModal({ isOpen, onClose, questionId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    // In a real app with a backend, we would POST to an API here.
    // For now, we simulate success for the serverless MVP.
    // E.g. fetch('https://formspree.io/f/YOUR_FORM_ID', { method: 'POST', body: JSON.stringify({ questionId, reason }) })
    
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason('');
        onClose();
      }, 2000);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)', zIndex: 99999, backdropFilter: 'blur(2px)'
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'var(--bg-main)', padding: '2rem', borderRadius: '24px',
              width: '90%', maxWidth: '400px', zIndex: 100000, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--surface-hover)',
                border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                </motion.div>
                <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Report Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Thank you! Our dental review board will verify this question within 24 hours.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '50%', color: 'var(--error-color)' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>Report Error</h3>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.25rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Found a typo, outdated guideline, or medically inaccurate explanation? Let us know!
                </p>

                <form onSubmit={handleSubmit}>
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe what's wrong with this question..."
                    style={{
                      width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '12px',
                      border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                      color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical',
                      fontFamily: 'inherit', marginBottom: '1rem'
                    }}
                    required
                  />
                  
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={!reason.trim()}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      gap: '0.5rem', padding: '0.8rem', opacity: !reason.trim() ? 0.5 : 1
                    }}
                  >
                    <Send size={18} /> Submit Report
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}