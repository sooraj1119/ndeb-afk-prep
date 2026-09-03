import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, CheckCircle2, ShieldCheck, Zap, Brain, Loader2 } from 'lucide-react';
import { getOfferings, purchasePackage, restorePurchases } from './lib/revenuecat';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PaywallModal({ isOpen, onClose, feature = "this feature" }: Props) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOfferings();
    }
  }, [isOpen]);

  const loadOfferings = async () => {
    setLoading(true);
    const offerings = await getOfferings();
    if (offerings && offerings.current && offerings.current.availablePackages) {
      setPackages(offerings.current.availablePackages);
    }
    setLoading(false);
  };

  const handlePurchase = async (rcPackage: any) => {
    setPurchasing(rcPackage.identifier);
    const success = await purchasePackage(rcPackage);
    setPurchasing(null);
    if (success) {
      onClose();
      window.location.reload();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const success = await restorePurchases();
    setLoading(false);
    if (success) {
      onClose();
      window.location.reload();
    } else {
      alert("No previous purchases found to restore.");
    }
  };

  if (!isOpen) return null;

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
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
              background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
            padding: '2.5rem 2rem 1.5rem',
            color: 'white', textAlign: 'center'
          }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}
            >
              <Crown size={48} color="#fbbf24" strokeWidth={1.5} />
            </motion.div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: 800 }}>Unlock Pro</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.5 }}>
              You need a premium subscription to access {feature}.
            </p>
          </div>

          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: Brain, text: 'Unlimited access to all 7,500+ questions' },
                { icon: Zap, text: 'Spaced Repetition & Simulated Mock Exams' },
                { icon: ShieldCheck, text: 'Detailed AI explanations for every answer' }
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-color)',
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <benefit.icon size={18} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-color)' }}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Loader2 size={24} color="var(--accent-color)" />
                </motion.div>
              </div>
            ) : packages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {packages.map((pkg) => (
                  <button
                    key={pkg.identifier}
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing !== null}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'var(--accent-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      cursor: purchasing !== null ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, opacity 0.2s',
                      opacity: purchasing !== null && purchasing !== pkg.identifier ? 0.5 : 1
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, textAlign: 'left', paddingRight: '0.75rem' }}>
                      <span style={{ lineHeight: 1.2, marginBottom: '0.2rem' }}>{pkg.product.title}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.9, lineHeight: 1.2 }}>{pkg.product.description}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {pkg.product.priceString}
                      {purchasing === pkg.identifier ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={18} /></motion.div> : <Crown size={18} />}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Pricing packages are currently unavailable.
                </p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
               <button 
                 onClick={handleRestore}
                 disabled={loading || purchasing !== null}
                 style={{ 
                   background: 'none', border: 'none', color: 'var(--text-secondary)',
                   fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline'
                 }}
               >
                 Restore Purchases
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}