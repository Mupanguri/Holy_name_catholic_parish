/**
 * ParishTree.jsx
 * Interactive parish community tree - pill buttons at edges
 *
 * Features:
 * - Waving leaves animation
 * - Pill buttons at far edges (3 per side)
 * - Preview mode showing branch pages/subpages
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper to extract preview text from page content
const getPagePreview = content => {
  if (!content) return '';

  // Try to parse as JSON first (new format)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Look for description or content field in the data
      for (const section of parsed) {
        if (section.data) {
          // Check for actual text content in any field
          const values = Object.values(section.data);
          for (const v of values) {
            // Only return if it's a non-empty, non-object string
            if (
              v &&
              typeof v === 'string' &&
              v.trim() &&
              !v.startsWith('[') &&
              !v.startsWith('{') &&
              v.trim().length > 0
            ) {
              return v.trim().substring(0, 100);
            }
          }
        }
      }
    }
  } catch (e) {
    // Not JSON, try as plain text/HTML
  }

  // Fallback: strip HTML tags and get first 100 chars
  const stripped = content.replace(/<[^>]+>/g, '').trim();
  // Only return if it's meaningful content (not empty brackets)
  if (stripped && stripped.length > 5 && !stripped.match(/^\[.*\]$/)) {
    return stripped.substring(0, 100);
  }
  return '';
};

// ─── Zone configuration ───────────────────────────────────────────────────────
const ZONES = {
  'zone-sections': {
    label: 'Sections',
    icon: '🌿',
    color: '#6b8e23',
    description: 'Parish sections and local area groups',
    pageSlug: 'sections',
  },
  'zone-choir': {
    label: 'Choir & Music',
    icon: '🎵',
    color: '#c9a84c',
    description: 'Choir, music ministry and liturgical music',
    pageSlug: 'choir',
  },
  'zone-committees': {
    label: 'Committees',
    icon: '📋',
    color: '#5a7a5a',
    description: 'Parish committees and working groups',
    pageSlug: 'committees',
  },
  'zone-adult-guilds': {
    label: 'Adult Guilds',
    icon: '✝️',
    color: '#8b4513',
    description: 'Adult faith guilds and sodalities',
    pageSlug: 'adult-guilds',
  },
  'zone-youth-guilds': {
    label: 'Youth Guilds',
    icon: '⭐',
    color: '#4a8c6a',
    description: 'Youth groups, scouts and young adults',
    pageSlug: 'youth-guilds',
  },
  'zone-support-teams': {
    label: 'Support Teams',
    icon: '🤝',
    color: '#8c5c2a',
    description: 'Pastoral care, outreach and support ministries',
    pageSlug: 'support-teams',
  },
};

// SVG path data for interactive zones
const ZONE_PATHS = {
  'zone-sections':
    'M180,580 L240,520 L320,490 L400,500 L460,520 L460,560 L400,570 L320,560 L240,580 L180,620 Z',
  'zone-choir':
    'M60,160 L140,120 L220,140 L300,200 L340,280 L320,360 L260,400 L180,400 L100,360 L60,280 Z',
  'zone-committees':
    'M340,80 L400,60 L460,80 L500,140 L510,220 L490,300 L450,340 L400,340 L360,300 L340,220 L330,140 Z',
  'zone-adult-guilds':
    'M640,60 L700,60 L760,100 L780,180 L770,260 L740,320 L690,340 L640,320 L610,260 L610,180 L630,100 Z',
  'zone-youth-guilds':
    'M820,120 L900,100 L980,130 L1040,200 L1060,280 L1030,360 L960,400 L880,400 L820,350 L800,270 L810,190 Z',
  'zone-support-teams':
    'M680,500 L750,490 L830,500 L900,530 L960,560 L960,600 L900,610 L820,590 L740,570 L680,550 Z',
};

// ─── Ambient Falling Leaves ───────────────────────────────────────────────────
const LEAF_COLORS = ['#c8a84b', '#8b6914', '#6b8e23', '#a0522d', '#d4a017', '#5a7a5a'];

function FallingLeaves() {
  const leaves = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${4 + ((i * 6) % 92)}%`,
    delay: `${(i * 0.7) % 9}s`,
    duration: `${8 + ((i * 1.3) % 7)}s`,
    size: `${11 + ((i * 3) % 14)}px`,
    color: LEAF_COLORS[i % LEAF_COLORS.length],
    drift: `${((i % 5) - 2) * 22}px`,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      <style>{`
        @keyframes ptLeafFall {
          0%   { transform: translateY(-30px) translateX(0) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.9; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(920px) translateX(var(--pt-drift)) rotate(600deg); opacity: 0; }
        }
        .pt-leaf {
          animation: ptLeafFall var(--duration) var(--delay) infinite linear;
          --pt-drift: var(--drift);
        }
      `}</style>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="pt-leaf"
          style={{
            position: 'absolute',
            top: 0,
            left: leaf.left,
            width: leaf.size,
            height: leaf.size,
            '--duration': leaf.duration,
            '--delay': leaf.delay,
            '--drift': leaf.drift,
          }}
        >
          <svg viewBox="0 0 20 20" width="100%" height="100%">
            <path
              d="M10 1 C15 1 19 5 19 10 C19 16 14 19 10 19 C6 19 1 15 1 10 C1 5 5 1 10 1 Z M10 1 C10 8 15 12 19 10"
              fill={leaf.color}
              opacity="0.82"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Swaying Vine Strands ───────────────────────────────────────────────────
function SwayingVines() {
  const VINE_POINTS = {
    'zone-sections': { x: 320, y: 560 },
    'zone-choir': { x: 200, y: 280 },
    'zone-committees': { x: 430, y: 200 },
    'zone-adult-guilds': { x: 680, y: 200 },
    'zone-youth-guilds': { x: 920, y: 280 },
    'zone-support-teams': { x: 820, y: 560 },
  };

  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 0.02), 50);
    return () => clearInterval(interval);
  }, []);

  const vines = Object.entries(VINE_POINTS).map(([zoneId, point], i) => {
    const zone = ZONES[zoneId];
    const length = 60 + (i % 3) * 20;
    const delay = i * 0.3;

    return (
      <g key={zoneId} style={{ pointerEvents: 'none' }}>
        {[0, 1, 2].map(strandIdx => {
          const offsetX = (strandIdx - 1) * 8;
          const strandLength = length + strandIdx * 10;

          return (
            <path
              key={strandIdx}
              d={`M ${point.x + offsetX},${point.y} Q ${point.x + offsetX + Math.sin(time + delay) * 15},${point.y + strandLength * 0.4} ${point.x + offsetX + Math.sin(time + delay + 0.5) * 20},${point.y + strandLength}`}
              fill="none"
              stroke={zone.color}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
          );
        })}
      </g>
    );
  });

  return (
    <svg
      viewBox="0 0 1152 896"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 7,
      }}
    >
      {vines}
    </svg>
  );
}

// ─── Pill Buttons at Edges ───────────────────────────────────────────────────
function EdgePills({ zones, activeZone, onZoneClick }) {
  const leftZones = zones.slice(0, 3);
  const rightZones = zones.slice(3, 6);

  return (
    <>
      {/* Left side pills - moved down away from leaves */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '55%',
          transform: 'translateY(0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 25,
          padding: '10px',
        }}
      >
        {leftZones.map(([id, cfg], i) => (
          <button
            key={id}
            onClick={() => onZoneClick(id)}
            style={{
              background: cfg.color,
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Cinzel, Georgia, serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow:
                activeZone === id ? `0 0 15px ${cfg.color}80` : '2px 3px 6px rgba(0,0,0,0.3)',
              transform: activeZone === id ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      {/* Right side pills - moved down away from leaves */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '55%',
          transform: 'translateY(0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 25,
          padding: '10px',
        }}
      >
        {rightZones.map(([id, cfg], i) => (
          <button
            key={id}
            onClick={() => onZoneClick(id)}
            style={{
              background: cfg.color,
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Cinzel, Georgia, serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow:
                activeZone === id ? `0 0 15px ${cfg.color}80` : '2px 3px 6px rgba(0,0,0,0.3)',
              transform: activeZone === id ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Parchment Modal ────────────────────────────────────────────────────────
function ParchmentModal({ zone, pages, posts, onClose, onNavigate }) {
  const cfg = ZONES[zone];

  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter pages: show only pages belonging to this branch (EXCLUDING the branch root itself)
  // Match by path structure
  const branchPages = pages.filter(p => {
    if (!cfg.pageSlug) return false;
    // EXCLUDE the branch root itself
    if (p.slug === cfg.pageSlug) return false;

    const path = p.path || '';

    // Check if path is under this branch - support both /communities/{branch}/ and /sections/{branch}/
    const isInBranch =
      path.startsWith('/communities/' + cfg.pageSlug + '/') ||
      path.startsWith('/sections/' + cfg.pageSlug + '/') ||
      (cfg.pageSlug === 'sections' && path.startsWith('/communities/sections/'));

    if (!isInBranch) return false;

    const isAccessible = p.status === 'live' || p.status === 'published' || p.visible === true;
    return isAccessible;
  });

  console.log(
    'Branch:',
    cfg.pageSlug,
    'Pages found:',
    branchPages.map(p => p.slug)
  );

  // Sub-pages: pages nested deeper than direct children - currently unused, for future nested pages
  const subPages = [];

  const relatedPosts = posts
    .filter(
      p =>
        p.category === 'Parish Notice' ||
        p.category === 'Adult Committee' ||
        p.category === 'Youth Committee'
    )
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 4);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15,8,2,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
        animation: 'ptFadeIn 0.22s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cinzel:wght@400;600&display=swap');
        @keyframes ptFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes ptSlideUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        .pt-post-row:hover, .pt-page-row:hover { background: rgba(139,105,20,0.10) !important; cursor: pointer; }
      `}</style>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          maxHeight: '88vh',
          background: 'linear-gradient(155deg, #f6e9cc 0%, #eee0b0 50%, #e8d898 100%)',
          borderRadius: 3,
          boxShadow: '0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.5)',
          overflow: 'hidden',
          animation: 'ptSlideUp 0.28s ease',
          fontFamily: '"IM Fell English", Georgia, serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 7,
            border: '1.5px solid rgba(139,105,20,0.32)',
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <div style={{ padding: '30px 30px 18px', borderBottom: '1px solid rgba(139,105,20,0.22)' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{cfg.icon}</div>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Cinzel", Georgia, serif',
              fontSize: 'clamp(17px,3.5vw,24px)',
              color: '#2e1a06',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            {cfg.label}
          </h2>
          <p
            style={{
              margin: '7px 0 0',
              fontSize: 13.5,
              color: '#6b4a1e',
              fontStyle: 'italic',
              lineHeight: 1.55,
            }}
          >
            {cfg.description}
          </p>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid rgba(139,105,20,0.38)',
              cursor: 'pointer',
              color: '#6b4a1e',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{ padding: '18px 30px 30px', overflowY: 'auto', maxHeight: 'calc(88vh - 155px)' }}
        >
          {branchPages.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontFamily: '"Cinzel", serif',
                  fontSize: 11,
                  letterSpacing: '0.13em',
                  color: '#8b6914',
                  textTransform: 'uppercase',
                }}
              >
                Pages
              </h3>
              {branchPages.map(page => (
                <div
                  key={page.id}
                  className="pt-page-row"
                  onClick={() => {
                    onClose();
                    onNavigate(page.path || `/${page.slug}`);
                  }}
                  style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid rgba(139,105,20,0.13)',
                    borderRadius: 2,
                    transition: 'background 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12 }}>🌿</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: '#2e1a06', lineHeight: 1.5 }}>
                      {page.title}
                    </div>
                    {page.content && getPagePreview(page.content) && (
                      <p
                        style={{
                          margin: '3px 0 0',
                          fontSize: 11,
                          color: '#6b4a1e',
                          fontStyle: 'italic',
                        }}
                      >
                        {getPagePreview(page.content)}…
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {subPages.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4
                    style={{
                      margin: '0 0 8px',
                      fontFamily: '"Cinzel", serif',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: '#6b4a1e',
                      textTransform: 'uppercase',
                    }}
                  >
                    Sub-pages
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {subPages.map(subPage => (
                      <span
                        key={subPage.id}
                        onClick={() => {
                          onClose();
                          onNavigate(subPage.path || `/${subPage.slug}`);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(139,105,20,0.08)',
                          border: '1px solid rgba(139,105,20,0.2)',
                          borderRadius: 12,
                          fontSize: 11,
                          color: '#5a3a10',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 10 }}>🍃</span>
                        {subPage.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {relatedPosts.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontFamily: '"Cinzel", serif',
                  fontSize: 11,
                  letterSpacing: '0.13em',
                  color: '#8b6914',
                  textTransform: 'uppercase',
                }}
              >
                Recent News
              </h3>
              {relatedPosts.map(post => (
                <div
                  key={post.id}
                  className="pt-post-row"
                  onClick={() => {
                    onClose();
                    onNavigate(`/news/${post.slug || post.id}`);
                  }}
                  style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid rgba(139,105,20,0.13)',
                    borderRadius: 2,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13.5, color: '#2e1a06', lineHeight: 1.5 }}>
                    {post.title}
                  </div>
                  <div
                    style={{ fontSize: 11, color: '#8b6914', marginTop: 2, fontStyle: 'italic' }}
                  >
                    {post.date
                      ? new Date(post.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : post.category || ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {branchPages.length === 0 && relatedPosts.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                fontStyle: 'italic',
                color: '#8b6914',
                fontSize: 13.5,
                padding: '14px 0',
              }}
            >
              No content available for this branch yet.
            </p>
          )}

          {cfg.pageSlug && (
            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  onClose();
                  // Find the branch root page and use its path
                  const branchRoot = pages.find(
                    p =>
                      p.slug === cfg.pageSlug && (p.level === 0 || p.path?.endsWith(cfg.pageSlug))
                  );
                  onNavigate(branchRoot?.path || `/${cfg.pageSlug}`);
                }}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '1.5px solid #5a3a10',
                  color: '#5a3a10',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontFamily: '"Cinzel", serif',
                  fontSize: 11.5,
                  letterSpacing: '0.07em',
                }}
              >
                Visit Main Page →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ParishTree Component ───────────────────────────────────────────────
export default function ParishTree({ adminMode = false, onNavigate }) {
  const { posts, pages, getLivePosts, getLivePages, isAdmin } = useAuth();

  const [activeZone, setActiveZone] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [modalZone, setModalZone] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const wrapperRef = useRef(null);
  const effectiveAdmin = adminMode || isAdmin();

  const livePosts = getLivePosts
    ? getLivePosts()
    : (posts || []).filter(p => p.status === 'live' || p.visible);
  const visiblePages = getLivePages
    ? getLivePages()
    : (pages || []).filter(
        p => p.status === 'live' || p.status === 'published' || p.visible === true
      );

  const handleZoneClick = zoneId => {
    Object.keys(ZONES).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.fill = 'transparent';
    });
    setActiveZone(zoneId);
    setModalZone(zoneId);
  };

  const handleClose = () => {
    setModalZone(null);
    setActiveZone(null);
    Object.keys(ZONES).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.fill = 'transparent';
    });
  };

  const activeZones = Object.entries(ZONES);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
      `}</style>

      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          margin: '0 auto',
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
          <FallingLeaves />

          <img
            src={`${process.env.PUBLIC_URL}/parish-tree.svg`}
            alt="Parish Community Tree"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onLoad={() => setImgLoaded(true)}
          />

          {imgLoaded && (
            <>
              <SwayingVines />
              <EdgePills
                zones={activeZones}
                activeZone={activeZone}
                onZoneClick={handleZoneClick}
              />

              <svg
                viewBox="0 0 1152 896"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 'auto',
                  zIndex: 10,
                }}
              >
                <style>{`
                  .pt-zone { fill: transparent; cursor: pointer; pointer-events: all; transition: fill 0.22s ease; }
                  .pt-zone:hover { fill: rgba(139,105,20,0.25); }
                `}</style>
                {Object.keys(ZONES).map(zoneId => (
                  <path
                    key={zoneId}
                    id={zoneId}
                    d={ZONE_PATHS[zoneId] || ''}
                    className="pt-zone"
                    onMouseEnter={e => {
                      const target = e.target;
                      setHoveredZone(zoneId);
                      target.style.fill = `${ZONES[zoneId].color}3a`;
                      if (wrapperRef.current) {
                        const rect = target.getBoundingClientRect();
                        const wRect = wrapperRef.current.getBoundingClientRect();
                        setTooltipPos({
                          x: rect.left - wRect.left + rect.width / 2,
                          y: rect.top - wRect.top,
                        });
                      }
                    }}
                    onMouseMove={e => {
                      if (wrapperRef.current) {
                        const wRect = wrapperRef.current.getBoundingClientRect();
                        setTooltipPos({ x: e.clientX - wRect.left, y: e.clientY - wRect.top });
                      }
                    }}
                    onMouseLeave={e => {
                      setHoveredZone(null);
                      if (activeZone !== zoneId) e.target.style.fill = 'transparent';
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      handleZoneClick(zoneId);
                    }}
                  />
                ))}
              </svg>
            </>
          )}

          {hoveredZone && (
            <div
              style={{
                position: 'absolute',
                left: tooltipPos.x,
                top: tooltipPos.y - 48,
                transform: 'translateX(-50%)',
                background: 'rgba(22,10,2,0.88)',
                color: '#f5e6c8',
                padding: '7px 14px',
                borderRadius: 3,
                fontFamily: '"Cinzel",Georgia,serif',
                fontSize: 12,
                letterSpacing: '0.06em',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
                border: '1px solid rgba(200,168,75,0.28)',
                zIndex: 20,
              }}
            >
              {ZONES[hoveredZone].icon} {ZONES[hoveredZone].label}
              <span style={{ opacity: 0.55, marginLeft: 8, fontSize: 10 }}>click to explore</span>
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(22,10,2,0.88)',
                  display: 'block',
                  width: 0,
                  height: 0,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {modalZone && (
        <ParchmentModal
          zone={modalZone}
          pages={visiblePages}
          posts={livePosts}
          onClose={handleClose}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}
