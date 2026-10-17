import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InfoTooltipProps {
  title: string;
  subtitle?: string;
  description: string;
  tags?: string[];
  ariaLabel?: string;
  testId?: string;
  variant?: 'light' | 'default';
  iconColor?: string;
}

export function InfoTooltip({
  title,
  subtitle,
  description,
  tags,
  ariaLabel,
  testId,
  variant = 'default',
  iconColor
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 300,
    placeAbove: false
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(320, window.innerWidth - 24);
    
    // Horizontal alignment centered on button, clamped within viewport bounds
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));

    // Vertical placement: default below, place above if bottom overflow
    const estimatedHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    const top = placeAbove ? Math.max(12, rect.top - estimatedHeight - 8) : rect.bottom + 8;

    setCoords({
      top,
      left,
      width: tooltipWidth,
      placeAbove
    });
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const defaultIconColor = iconColor || (variant === 'light' ? '#ffffff' : 'var(--accent-color, #0284c7)');
  const buttonBg = variant === 'light' 
    ? 'rgba(255, 255, 255, 0.22)' 
    : 'rgba(2, 132, 199, 0.12)';
  const buttonBorder = variant === 'light'
    ? 'rgba(255, 255, 255, 0.35)'
    : 'rgba(2, 132, 199, 0.25)';

  const portalContent = typeof document !== 'undefined' && isOpen ? (
    createPortal(
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, pointerEvents: 'auto' }}>
            {/* Transparent backdrop for touch & click-outside dismissal */}
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(2px)' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Popover Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              data-testid={testId ? `${testId}-popover` : 'info-tooltip-popover'}
              initial={{ opacity: 0, scale: 0.95, y: coords.placeAbove ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                maxWidth: 'calc(100vw - 24px)',
                zIndex: 99999,
                background: 'var(--surface-color, #1e293b)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                borderRadius: 'var(--radius-md, 14px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                color: 'var(--text-primary, #0f172a)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                pointerEvents: 'auto'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div style={{ background: 'rgba(2, 132, 199, 0.15)', padding: '0.3rem', borderRadius: '50%', display: 'flex', color: 'var(--accent-color, #0284c7)' }}>
                    <Info size={14} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  aria-label="Close info"
                  data-testid="info-tooltip-close"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary, #94a3b8)',
                    cursor: 'pointer',
                    padding: '0.3rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Subtitle */}
              {subtitle && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-color, #0284c7)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {subtitle}
                </div>
              )}

              {/* Body Description */}
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.86rem', lineHeight: 1.48, color: 'var(--text-secondary)' }}>
                {description}
              </p>

              {/* Key Feature Tags */}
              {tags && tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: 'var(--surface-hover, rgba(255, 255, 255, 0.08))',
                        color: 'var(--text-primary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label={ariaLabel || `Information about ${title}`}
        aria-expanded={isOpen}
        data-testid={testId || 'info-tooltip-button'}
        style={{
          background: buttonBg,
          border: `1px solid ${buttonBorder}`,
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          minWidth: '24px',
          minHeight: '24px',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: defaultIconColor,
          flexShrink: 0,
          transition: 'transform 0.15s ease, background-color 0.15s ease',
          verticalAlign: 'middle'
        }}
      >
        <Info size={13} strokeWidth={2.5} />
      </button>
      {portalContent}
    </>
  );
}
