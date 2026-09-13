import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const BaseModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{
            background: 'var(--surface-color)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-hover)',
                border: 'none',
                color: 'var(--text-secondary)',
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {content}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      content={
        <>
          <p><strong>Last Updated:</strong> Today</p>
          <p>
            Welcome to our NDEB AFK Prep application. We respect your privacy and are committed to protecting it. 
            This Privacy Policy explains how we collect, use, and safeguard your information.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Data Collection</h4>
          <p>
            This application operates primarily offline using on-device storage. We do not require you to create an account, and we do not collect or transmit personal identifiable information (PII) such as your name, email, or address to our servers.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Study Data</h4>
          <p>
            Your study progress, flagged questions, and quiz statistics are stored strictly locally on your device (using LocalStorage). This data is never uploaded to external servers. If you uninstall the app or clear your browser data, this progress will be permanently lost.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. In-App Purchases</h4>
          <p>
            When you purchase a subscription, the transaction is processed securely by Apple (App Store) or Google (Play Store), and managed via RevenueCat. We do not have access to your credit card information or billing details. RevenueCat securely assigns an anonymous App User ID to verify your subscription status.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. Third-Party Services</h4>
          <p>
            We utilize RevenueCat for subscription management. Please refer to RevenueCat\'s Privacy Policy for information on how they handle subscription verification data.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. Contact Us</h4>
          <p>
            If you have any questions about this Privacy Policy, please contact the developer via the App Store or Google Play Store support channels.
          </p>
        </>
      }
    />
  );
};

export const TermsOfUseModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms of Use (EULA)"
      content={
        <>
          <p><strong>Last Updated:</strong> Today</p>
          <p>
            By downloading or using the app, these terms will automatically apply to you. You should make sure therefore that you read them carefully before using the app.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Educational Use Only</h4>
          <p>
            This app is strictly designed as a study aid for dental board examinations. It does not provide medical or clinical advice. Do not use this application for real-world patient care.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Subscriptions & Billing</h4>
          <p>
            Premium features require an active auto-renewing subscription. Payment will be charged to your Apple/Google account at confirmation of purchase. Your subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. Your account will be charged for renewal within 24-hours prior to the end of the current period.
          </p>
          <p>
            You can manage and cancel your subscriptions by going to your Account Settings on the App Store or Google Play Store after purchase. Any unused portion of a free trial period, if offered, will be forfeited when you purchase a subscription.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. Intellectual Property</h4>
          <p>
            The app itself, and all the trademarks, copyright, database rights, and other intellectual property rights related to it, belong to the developer. NDEB&reg; and AFK&reg; are registered trademarks of the National Dental Examining Board of Canada. This app is not affiliated with the NDEB.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. AI Content Disclaimer</h4>
          <p>
            Content within this application may be generated or verified using Artificial Intelligence. We cannot guarantee 100% accuracy of all medical explanations and accept no liability for factual errors or hallucinations.
          </p>
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. Termination</h4>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </>
      }
    />
  );
};
