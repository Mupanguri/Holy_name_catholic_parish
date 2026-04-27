import React, { useState, useEffect, useRef, useCallback } from 'react';

const SUPER_ADMIN_STEPS = [
  {
    target: null,
    title: 'Welcome to Holy Name Admin! 🎉',
    description: 'This quick tour will show you everything you need to manage the Holy Name parish website. It only takes a minute.',
  },
  {
    target: 'tutorial-nav-dashboard',
    title: 'Dashboard',
    description: 'Your home base. See a snapshot of posts, pages, pending approvals, and recent activity at a glance.',
  },
  {
    target: 'tutorial-nav-pages',
    title: 'Pages Manager',
    description: 'Create and manage the public pages on the website. You can publish, hide, or edit any page here.',
  },
  {
    target: 'tutorial-nav-posts',
    title: 'Posts Manager',
    description: 'Write and publish news, announcements, and event reports. SocCom admins submit posts here for your approval.',
  },
  {
    target: 'tutorial-nav-media',
    title: 'Media Library',
    description: 'Upload images, documents, and files. Everything uploaded here becomes available on the public Library page.',
  },
  {
    target: 'tutorial-nav-submissions',
    title: 'Approvals',
    description: 'Review and approve content submitted by SocCom admins — pages, posts, documents, and video links all come here first.',
  },
  {
    target: 'tutorial-nav-tasks',
    title: 'Tasks',
    description: 'Assign tasks to admins and track their progress. Tasks can be submitted for review before being marked complete.',
  },
  {
    target: 'tutorial-nav-users',
    title: 'User Management',
    description: 'Add new admins, update passwords, and manage roles. Only Super Admins can access this section.',
  },
];

const SOCCOM_STEPS = [
  {
    target: null,
    title: 'Welcome to Holy Name Admin! 🎉',
    description: 'This quick tour will show you everything you need to contribute to the Holy Name parish website. It only takes a minute.',
  },
  {
    target: 'tutorial-nav-dashboard',
    title: 'Dashboard',
    description: 'Your home base. See a snapshot of your posts, tasks, and recent activity.',
  },
  {
    target: 'tutorial-nav-pages',
    title: 'Pages Manager',
    description: 'Create and edit pages for the website. Pages need Super Admin approval before going live.',
  },
  {
    target: 'tutorial-nav-posts',
    title: 'Posts Manager',
    description: 'Write news, announcements, and event reports. Submit them for Super Admin approval to publish.',
  },
  {
    target: 'tutorial-nav-media',
    title: 'Media Library',
    description: 'Upload images, PDFs, and documents. Mass uploads need Super Admin approval.',
  },
  {
    target: 'tutorial-nav-tasks',
    title: 'Tasks',
    description: 'View tasks assigned to you. Complete them and submit for review when done.',
  },
];

const STORAGE_KEY = id => `tutorial_seen_${id}`;

const AdminTutorial = ({ role, userId, onClose, colors }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);

  const steps = role === 'super_admin' ? SUPER_ADMIN_STEPS : SOCCOM_STEPS;
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const getTargetRect = useCallback((targetId) => {
    if (!targetId) return null;
    const el = document.getElementById(targetId);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }, []);

  useEffect(() => {
    setRect(getTargetRect(current.target));
  }, [step, current.target, getTargetRect]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY(userId), 'true');
    onClose();
  };

  const handleNext = () => {
    if (isLast) { handleClose(); return; }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const PAD = 10;
  const CARD_W = 320;

  const cardStyle = () => {
    if (!rect) {
      return {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: CARD_W,
        zIndex: 10000,
      };
    }
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    let top = rect.top + rect.height + PAD + 8;
    let left = rect.left;
    if (top + 180 > viewH) top = rect.top - 180 - PAD;
    if (left + CARD_W > viewW - 16) left = viewW - CARD_W - 16;
    if (left < 16) left = 16;
    return { position: 'fixed', top, left, width: CARD_W, zIndex: 10000 };
  };

  const c = colors || {};
  const bg = c.bg || '#12192a';
  const text = c.text || '#e8edf4';
  const textMuted = c.textMuted || '#a0aec0';
  const border = c.border || 'rgba(168,204,232,0.1)';
  const accent = c.accent || '#63b3ed';
  const gold = c.gold || '#f6e05e';

  return (
    <>
      <style>{`
        .at-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 9997;
          backdrop-filter: blur(2px);
          transition: opacity 0.2s;
        }
        .at-spotlight {
          position: fixed;
          border-radius: 10px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.65);
          z-index: 9998;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          outline: 2px solid rgba(99,179,237,0.6);
          outline-offset: 3px;
        }
        .at-card {
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          animation: at-fadein 0.2s ease;
        }
        @keyframes at-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .at-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-family: 'Inter', sans-serif;
          transition: opacity 0.15s;
        }
        .at-btn:hover { opacity: 0.85; }
        .at-dots { display: flex; gap: 5px; align-items: center; }
        .at-dot {
          width: 6px; height: 6px; border-radius: 50%;
          transition: all 0.2s;
        }
      `}</style>

      {/* Backdrop — only shown when no spotlight (welcome step) */}
      {!rect && <div className="at-backdrop" />}

      {/* Spotlight around target element */}
      {rect && (
        <div
          className="at-spotlight"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      {/* Step card */}
      <div className="at-card" style={{ ...cardStyle(), background: bg, border: `1px solid ${border}` }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: gold, textTransform: 'uppercase' }}>
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 18, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 8, fontFamily: 'Cinzel, serif' }}>
          {current.title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, marginBottom: 20 }}>
          {current.description}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Dots */}
          <div className="at-dots">
            {steps.map((_, i) => (
              <div
                key={i}
                className="at-dot"
                style={{
                  background: i === step ? accent : border,
                  width: i === step ? 18 : 6,
                  borderRadius: i === step ? 3 : '50%',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button
                className="at-btn"
                onClick={handleBack}
                style={{ background: 'transparent', border: `1px solid ${border}`, color: textMuted }}
              >
                ← Back
              </button>
            )}
            {isFirst && (
              <button
                className="at-btn"
                onClick={handleClose}
                style={{ background: 'transparent', border: `1px solid ${border}`, color: textMuted }}
              >
                Skip Tour
              </button>
            )}
            <button
              className="at-btn"
              onClick={handleNext}
              style={{ background: accent, color: '#fff' }}
            >
              {isLast ? 'Finish ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export { STORAGE_KEY };
export default AdminTutorial;
