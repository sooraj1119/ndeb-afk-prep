import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  confirmColor = 'var(--accent-color)',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 99998,
              backdropFilter: 'blur(2px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '1.75rem',
              width: '90%', maxWidth: '360px',
              zIndex: 99999,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            }}
          >
            <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              {title}
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px',
                  border: 'none',
                  background: confirmColor,
                  color: 'white',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
