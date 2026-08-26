import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2, ShieldCheck, Zap, Brain } from 'lucide-react';
import { setIsPremium } from './lib/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PaywallModal({ isOpen, onClose, feature = "this feature" }: Props) {
  if (!isOpen) return null;

  const handleTestUpgrade = () => {
    // For testing purposes before RevenueCat integration
    setIsPremium(true);
    onClose();
    alert("Successfully upgraded to PRO! (Test Mode)");
    window.location.reload();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'var(--surface-color)',
            width: '100%',
            maxWidth: '450px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              color: 'var(--text-primary)'
            }}
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '2.5rem 2rem 2rem',
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Crown size={32} color="#fff" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800 }}>Unlock AFK Pro</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
              You've hit the limit for free accounts. Upgrade to unlock {feature} and guarantee your success.
            </p>
          </div>

          {/* Features */}
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { icon: Brain, text: 'Access to all 7,500+ Questions' },
                { icon: Zap, text: 'Unlimited Weakness Drilling' },
                { icon: ShieldCheck, text: 'Full Spaced Repetition (SRS) System' },
                { icon: CheckCircle2, text: 'Unlimited Simulated Mock Exams' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ color: '#f59e0b' }}><item.icon size={20} /></div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.2rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>$</span>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>6.99</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Cancel anytime. Auto-renews monthly.</p>
            </div>

            {/* CTA */}
            <button 
              onClick={handleTestUpgrade}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: '#f59e0b',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.2s'
              }}
            >
              Start Subscription
            </button>
            <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              (Test mode: click to instantly bypass for now)
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}