import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivacyPolicyModal, TermsOfUseModal } from './LegalModals';
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
            position: 'relative',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
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
            padding: '1.25rem 1rem 0.75rem',
            flexShrink: 0,
            color: 'white', textAlign: 'center'
          }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}
            >
              <Crown size={28} color="#fbbf24" strokeWidth={2} />
            </motion.div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>Unlock Pro</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem', lineHeight: 1.5 }}>
              Don't leave your exam to chance. Upgrade to Pro to unlock the hardest, high-yield sections and guarantee you are ready.
            </p>
          </div>

          <div style={{ padding: '1rem 1.25rem 0.5rem', flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: Brain, text: 'Unlimited access to all 10,134 specialized AFK questions' },
                { icon: Zap, text: 'Smart Spaced Repetition that guarantees retention' }
              ].map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-color)',
                    width: '32px', height: '32px', borderRadius: '50%',
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
    <>
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'rgba(234, 179, 8, 0.15)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Traditional Canadian prep courses cost $3,000+.<br/><span style={{color: '#eab308'}}>Get the curriculum in your pocket for a fraction of the cost.</span></p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {packages.map((pkg) => (
                  <button
                    key={pkg.identifier}
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing !== null}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
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
                      opacity: purchasing !== null && purchasing !== pkg.identifier ? 0.5 : 1,
                      ...(pkg.product.title.toLowerCase().includes('annual') ? {
                        boxShadow: '0 0 0 2px var(--accent-color), 0 0 15px rgba(59, 130, 246, 0.5)'
                      } : {})
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, textAlign: 'left', paddingRight: '0.75rem' }}>
                      <span style={{ lineHeight: 1.2, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {pkg.product.title}
                        {pkg.product.title.toLowerCase().includes('annual') && (
                          <span style={{ fontSize: '0.65rem', background: '#fbbf24', color: '#854d0e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Best Value</span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.9, lineHeight: 1.2 }}>{pkg.product.title.toLowerCase().includes('annual') ? "Save 30% with an annual plan." : pkg.product.description}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {pkg.product.title.toLowerCase().includes('monthly') ? (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.7, fontSize: '0.75rem', color: '#e2e8f0' }}>$16.99 CAD</span>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>$9.99 CAD</span>
                        </span>
                      ) : pkg.product.title.toLowerCase().includes('annual') ? (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.7, fontSize: '0.75rem', color: '#e2e8f0' }}>$203.88 CAD</span>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>$142.99 CAD</span>
                        </span>
                      ) : (
                        <span>{pkg.product.priceString}</span>
                      )}
                      {purchasing === pkg.identifier ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={18} /></motion.div> : <Crown size={18} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Pricing packages are currently unavailable.
                </p>
              </div>
            )}

            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
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

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.8, lineHeight: 1.3 }}>
               Payment will be charged to your Apple/Google account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Account will be charged for renewal within 24-hours prior to the end of the current period. You can manage and cancel your subscriptions in your account settings.
               <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                 <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Terms of Use</button>
                 <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Privacy Policy</button>
               </div>
            </div>
            
            <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfUseModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}