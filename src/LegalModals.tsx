import { createPortal } from 'react-dom';
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

  const modalNode = (
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

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
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
            <strong>CRITICAL LEGAL &amp; CLINICAL NOTICE:</strong> This application is strictly an independent educational study aid designed exclusively to assist dental candidates in preparing for the Assessment of Fundamental Knowledge (AFK) written examination.
          </div>
          
          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. No Medical, Dental, or Clinical Advice &amp; Prohibition on Patient Care</h4>
          <p>
            The questions, answers, rationales, explanations, diagnostic images, and clinical scenarios contained within this application are provided strictly for examination review and simulated academic learning purposes. <strong>Nothing contained in this app constitutes medical, dental, diagnostic, surgical, pharmacological, or therapeutic advice.</strong>
          </p>
          <p>
            No doctor-patient, dentist-patient, or educator-student fiduciary relationship is created by accessing or using this software. This application must <strong>NEVER be used in live clinical patient care, clinical decision-making, patient triage, surgical planning, or prescription determination.</strong> Always consult official dental board standards, accredited clinical guidelines, and peer-reviewed literature for real-world patient treatment.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Artificial Intelligence (AI) Synthesis &amp; Duty to Cross-Reference</h4>
          <p>
            Study questions, explanations, and clinical rationales within this application are synthesized, formulated, and audited utilizing Artificial Intelligence (AI) models and simulated case scenarios. While comprehensive auditing is performed against recognized academic standards, <strong>generative AI models can occasionally produce errors, hallucinations, outdated clinical guidelines, or typographic mistakes.</strong>
          </p>
          <p>
            The user agrees that they have an affirmative and sole responsibility to independently cross-reference and verify all clinical concepts, drug dosages, anatomical relationships, and treatment protocols with authoritative dental reference textbooks (including Malamed, Little &amp; Falace, Neville, Proffit, Carranza, and Cohen).
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. No Guarantee of Examination Success or Board Licensure</h4>
          <p>
            The application, developers, and contributors make <strong>no warranties or guarantees, express or implied, regarding whether any user will pass the NDEB AFK examination</strong>, achieve any specific passing score, or obtain dental certification or licensure in Canada or any other jurisdiction.
          </p>
          <p>
            Examination performance depends entirely upon the individual candidate&rsquo;s diligence, clinical training, education, and examination conditions. The developers disclaim all liability for any direct or indirect costs associated with examination failure, including re-examination registration fees, tutoring expenses, travel costs, or delayed career earnings.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. Right to Modify, Update, and Delete Content</h4>
          <p>
            The developers reserve the absolute, unilateral right, at their sole discretion, to add, modify, update, alter, replace, suspend, or permanently delete any questions, clinical rationales, study modes, categories, features, or functionalities within this application at any time without prior notice or liability. Materials are continuously audited, refined, and updated.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. Trademark &amp; Nominative Fair Use Notice</h4>
          <p>
            <strong>NDEB&reg;</strong> and <strong>AFK&reg;</strong> are registered trademarks owned exclusively by the National Dental Examining Board of Canada (NDEB).
          </p>
          <p>
            This application is an independent educational tool published by third-party dental educators. It is <strong>not affiliated with, associated with, authorized by, endorsed by, sponsored by, or in any way officially connected to the National Dental Examining Board of Canada (NDEB)</strong>, the Commission on Dental Accreditation of Canada (CDAC), or any of their affiliates. Practice questions are independent simulations and NOT actual confidential or proprietary NDEB exam items.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>6. Assumption of Risk &amp; Complete Release of Liability</h4>
          <p>
            By using this software, you expressly agree that your use of the application is at your sole risk. You fully release, indemnify, and hold harmless the application developers, owners, contributors, and agents from any and all claims, demands, damages, liabilities, or suits of any nature arising directly or indirectly from your access to or use of this software.
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
          <p><strong>Last Updated:</strong> October 2026 &bull; Published by Dental Prep Pro Publishing</p>
          <p>
            We respect your privacy and are committed to maintaining the highest standards of data protection. This Privacy Policy complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), the EU General Data Protection Regulation (GDPR), the UK Data Protection Act 2018 (UK GDPR), the California Consumer Privacy Act (CCPA), and the Australian Privacy Act 1988.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Zero Personal Data Collection (No PII)</h4>
          <p>
            This application does not require user registration or account creation. We do not collect, store, transmit, or sell any Personally Identifiable Information (PII) such as your legal name, physical address, email address, phone number, contacts, or precise geolocation.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. On-Device Local Data Storage</h4>
          <p>
            All your educational progress data—including completed questions, quiz scores, flagged questions, spaced repetition intervals, and streak records—is stored exclusively on your device using local sandboxed storage (<code>localStorage</code>). Your study records never leave your device and are never transmitted to any central database.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. No Collection of Patient Health Information (PHI / HIPAA / PHIPA)</h4>
          <p>
            This application is strictly an educational exam preparation tool. We do not collect, process, transmit, or store real-world Patient Health Information (PHI) under the US Health Insurance Portability and Accountability Act (HIPAA), Ontario's <em>Personal Health Information Protection Act</em> (PHIPA), or European health privacy regulations. Users must never input actual patient records, medical charts, radiographs, or personal health identifiers into this software.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. Subscriptions &amp; Cross-Border Processing</h4>
          <p>
            All financial transactions and subscriptions are processed directly and securely through Apple (Apple App Store In-App Purchases) or Google (Google Play Billing). We never collect or store credit card numbers, billing addresses, or bank account details.
          </p>
          <p>
            We utilize RevenueCat as an anonymous subscription validation layer. RevenueCat generates an anonymized, pseudonymous App User ID solely to verify whether an active subscription entitlement exists. Transaction validation tokens are processed on secure servers located in the <strong>United States</strong>.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. Right to Erasure / Data Deletion</h4>
          <p>
            In accordance with PIPEDA and GDPR rights, you maintain complete ownership and control of your data. You may permanently delete and wipe all stored progress and statistics at any time by tapping <strong>"Reset All Progress"</strong> in the Dashboard or by clearing the app cache.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>6. Child Privacy (COPPA &amp; Age Restriction)</h4>
          <p>
            The Application is strictly intended for adult dental graduates and healthcare candidates preparing for professional licensure. It is not directed to individuals under 18 years of age (or under 16 in the European Union).
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>7. Designated Privacy Officer &amp; Contact</h4>
          <p>
            In accordance with Canadian PIPEDA Principle 4.1.4, our designated Privacy Officer is accountable for data protection governance. For inquiries or data requests, contact: <strong style={{ color: 'var(--accent-color)' }}>ndebpreppro@gmail.com</strong>.
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
          <p><strong>Last Updated:</strong> October 2026 &bull; Published by Dental Prep Pro Publishing</p>
          <p>
            By downloading, installing, accessing, or using <strong>Dental Prep Pro: for NDEB AFK</strong> (the &ldquo;Application&rdquo;), you agree to be bound by these Terms of Use and standard End User License Agreement (EULA). If you do not agree to these terms, do not access or use this application.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>1. Standard Apple &amp; Google EULA Integration</h4>
          <p>
            For iOS users, these terms incorporate by reference the <strong>Apple Standard Licensed Application End User License Agreement (EULA)</strong>. Apple and its subsidiaries are third-party beneficiaries of this EULA with the right to enforce it against you. Apple has no maintenance, support, or warranty obligations. For Android users, these terms incorporate Google Play Store Terms of Service.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>2. Auto-Renewing Subscriptions &amp; Billing</h4>
          <p>
            Access to premium question domains and advanced study features requires an active auto-renewing subscription:
          </p>
          <ul style={{ margin: '0.25rem 0 0.5rem 1.25rem', padding: 0 }}>
            <li>Payment is charged to your Apple ID or Google Play account at confirmation of purchase.</li>
            <li>Subscriptions automatically renew unless cancelled at least 24 hours prior to the end of the current billing cycle.</li>
            <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the specified plan rate.</li>
            <li>
              You may manage or cancel subscriptions at any time in your store account settings (compliant with FTC Click-to-Cancel and California Automatic Renewal Law):
              <br />&bull; <strong>iOS:</strong> Go to Settings &gt; [Your Apple ID] &gt; Subscriptions or online at <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>Apple Subscriptions</a>.
              <br />&bull; <strong>Android:</strong> Go to Google Play &gt; Profile Icon &gt; Payments &amp; Subscriptions or online at <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>Google Play Subscriptions</a>.
            </li>
            <li>Any unused portion of a free trial, if offered, is forfeited upon purchasing a subscription.</li>
          </ul>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>3. Independent Educational Simulation &amp; No Exam Items</h4>
          <p>
            All questions, clinical scenarios, options, and rationales are synthetic educational simulations formulated independently from authoritative public dental literature. <strong>None of the content consists of actual, leaked, recalled, or confidential past or current examination items from the National Dental Examining Board of Canada (NDEB) or any licensing board.</strong> The Company strictly prohibits candidate recall harvesting.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>4. Intellectual Property Rights &amp; Restrictions</h4>
          <p>
            All software code, graphic user interfaces, question compilations, algorithms, and design assets are the exclusive intellectual property of the developer. You are granted a limited, personal, non-transferable, revocable license for personal, non-commercial educational use only. You may not decompile, reverse engineer, extract, scrape, redistribute, or reproduce any questions or content.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>5. DMCA &amp; Canadian Copyright Notice &amp; Takedown</h4>
          <p>
            The Company adheres to 17 U.S.C. &sect; 512 and Canadian Copyright Act Sections 41.25&ndash;41.27 safe harbor provisions. If you believe any content infringes your copyright, please notify our Designated Copyright Agent at: <strong style={{ color: 'var(--accent-color)' }}>ndebpreppro@gmail.com</strong>.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>6. Right to Modify, Update, and Terminate Services</h4>
          <p>
            The developers reserve the right to add, modify, update, replace, alter, suspend, or permanently terminate any portion of the service, question banks, study tools, topics, or software features at any time without prior notice or liability.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>7. DISCLAIMER OF WARRANTIES ("AS IS" &amp; "AS AVAILABLE")</h4>
          <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE APPLICATION AND ALL CONTENT ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>8. STRICT LIMITATION OF LIABILITY &amp; AGGREGATE DAMAGE CAP</h4>
          <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            UNDER NO CIRCUMSTANCES SHALL THE DEVELOPER, AUTHORS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, EXAM FAILURE, REGISTRATION FEES, OR MEDICAL MALPRACTICE CLAIMS ARISING FROM YOUR USE OF THE SERVICE.
          </p>
          <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY OF THE DEVELOPER ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO THE DEVELOPER FOR YOUR SUBSCRIPTION (IN THE APPLICABLE CURRENCY OF PURCHASE) IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) ZERO ($0.00 IN ANY CURRENCY) IF YOU HAVE ONLY ACCESSED THE FREE TIER.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>9. Statutory Consumer Rights Savings Clause (Worldwide)</h4>
          <p>
            Some jurisdictions (including the Province of Ontario, Quebec, the European Union, the United Kingdom, and Australia) do not permit the exclusion or limitation of certain statutory warranties or consumer guarantees. To the extent mandatory consumer legislation (including the UK Consumer Rights Act 2015, the EU Consumer Rights Directive, and the Australian Consumer Law) applies to you, nothing in these Terms limits or excludes non-waivable consumer rights.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>10. International Trade &amp; Sanctions Compliance</h4>
          <p>
            You represent and warrant that you are not located in an embargoed country or on any Canadian, United States (OFAC), European Union, or United Nations denied or restricted party list.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>11. INDEMNIFICATION</h4>
          <p>
            You agree to defend, indemnify, and hold harmless the developer, owners, contractors, and affiliates from and against any and all claims, damages, liabilities, losses, judgments, awards, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use or misuse of the application; (b) any breach by you of these Terms; (c) your violation of any third-party right; or (d) any clinical or patient care decisions made by you.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>12. Class Action Waiver &amp; Dispute Resolution</h4>
          <p>
            YOU AGREE THAT ALL CLAIMS OR DISPUTES ARISING OUT OF OR RELATING TO THESE TERMS OR THE APPLICATION MUST BE RESOLVED ON AN INDIVIDUAL BASIS AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>13. Governing Law &amp; Exclusive Jurisdiction</h4>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the <strong>Province of Ontario and the federal laws of Canada</strong> applicable therein. You irrevocably submit to the exclusive personal jurisdiction of the provincial and federal courts located in <strong>Toronto, Ontario, Canada</strong>.
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>14. Severability, Survival &amp; Quebec Language Election</h4>
          <p>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. <em>Les parties aux pr&eacute;sentes confirment leur volont&eacute; expresse que cette convention ainsi que tous les documents qui s'y rattachent soient r&eacute;dig&eacute;s en langue anglaise.</em>
          </p>

          <h4 style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>15. Contact Inquiries</h4>
          <p>
            For any inquiries regarding these terms or copyright claims, please contact: <strong style={{ color: 'var(--accent-color)' }}>ndebpreppro@gmail.com</strong>.
          </p>
        </>
      }
    />
  );
};
