import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileText, Lock } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

const BaseModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, icon, content }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          style={{
            background: 'var(--surface-color)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '85vh',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-hover)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {icon}
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.65,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {content}
          </div>
          
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--surface-hover)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--accent-color, #0284c7)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const MedicalDisclaimerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Medical & Educational Disclaimer"
      icon={<ShieldAlert size={22} color="#eab308" />}
      content={
        <>
          <p><strong>Last Updated:</strong> October 2026</p>
          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '0.75rem', color: 'var(--text-primary)' }}>
            <strong>IMPORTANT NOTICE:</strong> This application is strictly an independent educational study aid designed to assist dental candidates in preparing for the Assessment of Fundamental Knowledge (AFK) examination.
          </div>
          
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. No Medical or Clinical Advice</h4>
          <p>
            The questions, answers, rationales, and explanations contained in this application are for examination review and simulated learning purposes only. Nothing contained within this app constitutes medical, dental, diagnostic, or therapeutic advice. It is not intended to be a substitute for professional clinical judgment, official dental clinical protocols, or consultation with qualified healthcare professionals.
          </p>
          <p>
            <strong>Do not use this software for patient care, clinical decision support, or real-world diagnostics.</strong>
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Artificial Intelligence (AI) Notice</h4>
          <p>
            Certain study materials, explanations, and question reviews within this app are synthesized and audited utilizing Artificial Intelligence. While rigorous verification procedures are conducted to maximize academic accuracy, generative AI models may occasionally produce factual inaccuracies, outdated guidelines, or hallucinations. Users are urged to cross-reference all clinical data with authoritative standard dental textbooks (e.g., Malamed, Little & Falace, Neville, Proffit) and official examination reference lists.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. Trademark & Non-Affiliation Notice</h4>
          <p>
            <strong>NDEB&reg;</strong> and <strong>AFK&reg;</strong> are registered trademarks owned exclusively by the National Dental Examining Board of Canada (NDEB).
          </p>
          <p>
            This application is an independent, non-official educational resource published by third-party educators. It is <strong>not affiliated with, associated with, authorized by, endorsed by, or in any way officially connected to the National Dental Examining Board of Canada (NDEB)</strong>, the Commission on Dental Accreditation of Canada (CDAC), or any of their subsidiaries or affiliates.
          </p>
        </>
      }
    />
  );
};

export const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      icon={<Lock size={22} color="var(--accent-color, #0284c7)" />}
      content={
        <>
          <p><strong>Last Updated:</strong> October 2026</p>
          <p>
            We respect your privacy and are committed to maintaining the highest standards of data protection. This Privacy Policy complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), the EU General Data Protection Regulation (GDPR), and the California Consumer Privacy Act (CCPA).
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Zero Personal Data Collection (No PII)</h4>
          <p>
            This application does not require user registration or account creation. We do not collect, store, transmit, or sell any Personally Identifiable Information (PII) such as your legal name, physical address, email address, phone number, contacts, or precise geolocation.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. On-Device Local Data Storage</h4>
          <p>
            All your educational progress data—including completed questions, quiz scores, flagged questions, spaced repetition intervals, and streak records—is stored exclusively on your device using local sandboxed storage (<code>localStorage</code>). Your study records never leave your device and are never transmitted to any central database.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. Right to Erasure / Data Deletion</h4>
          <p>
            In accordance with PIPEDA and GDPR rights, you maintain complete ownership and control of your data. You may permanently delete and wipe all stored progress and statistics at any time by tapping <strong>"Reset All Progress"</strong> in the Dashboard or by uninstalling the application.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. In-App Purchases & Payment Processing</h4>
          <p>
            All financial transactions and subscriptions are processed directly and securely through Apple (Apple App Store In-App Purchases) or Google (Google Play Billing). We never collect or store credit card numbers, billing addresses, or bank account details.
          </p>
          <p>
            We utilize RevenueCat as an anonymous subscription validation layer. RevenueCat generates an anonymized, pseudonymous App User ID solely to verify whether an active subscription entitlement exists.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. Contact & Privacy Inquiries</h4>
          <p>
            If you have questions or requests regarding your privacy or data protection practices, please contact our support team at: <strong style={{ color: 'var(--accent-color)' }}>support@ndebafkprep.com</strong>.
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
      icon={<FileText size={22} color="var(--accent-color, #0284c7)" />}
      content={
        <>
          <p><strong>Last Updated:</strong> October 2026</p>
          <p>
            By downloading, installing, or accessing this application, you agree to be bound by these Terms of Use and standard End User License Agreement (EULA).
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Standard Apple EULA Agreement</h4>
          <p>
            For iOS users downloading via the Apple App Store, these terms incorporate by reference the <strong>Apple Standard Licensed Application End User License Agreement (EULA)</strong>, available at <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>apple.com/legal/internet-services/itunes/dev/stdeula</a>. In the event of any conflict, Apple's standard terms govern.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Auto-Renewing Subscriptions & Billing</h4>
          <p>
            Access to premium question banks and advanced features requires an active auto-renewing subscription.
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>Payment is charged to your Apple ID or Google Play Account at confirmation of purchase.</li>
            <li>Subscriptions automatically renew unless auto-renew is canceled at least 24 hours prior to the end of the current billing cycle.</li>
            <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the specified plan rate.</li>
            <li>You may manage or cancel your subscription at any time:
              <br />&bull; <strong>iOS:</strong> Go to Settings &gt; [Your Apple ID] &gt; Subscriptions.
              <br />&bull; <strong>Android:</strong> Go to Google Play &gt; Profile Icon &gt; Payments &amp; Subscriptions.
            </li>
            <li>Any unused portion of a free trial, if offered, is forfeited upon purchasing a subscription.</li>
          </ul>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. Intellectual Property Rights</h4>
          <p>
            The software, user interface design, visual assets, software code, and educational content are the intellectual property of the developers. NDEB&reg; and AFK&reg; are registered trademarks of the National Dental Examining Board of Canada. This application is an independent examination prep tool and has no affiliation with the NDEB.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. Limitation of Liability</h4>
          <p>
            The application is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Under no circumstances shall the developer be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this study tool, or exam performance outcomes.
          </p>
        </>
      }
    />
  );
};
