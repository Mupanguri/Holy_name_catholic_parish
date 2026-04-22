import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as Tabs from '@radix-ui/react-tabs';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { POST_CATEGORIES } from '../constants/CMSConstants';

const POSTS_PER_PAGE = 9;

const TAB_BG = {
  all: {
    gradient: 'linear-gradient(135deg, #0e1620 0%, #1b2a38 100%)',
    image: '/Holy_Name_Parish_Photo.jpg',
    size: 'cover',
    opacity: 0.28,
  },
  [POST_CATEGORIES.PARISH_NOTICE]: {
    gradient: 'linear-gradient(135deg, #0d1c32 0%, #152540 100%)',
    image: '/parishposts.jpg',
    size: 'cover',
    opacity: 0.28,
  },
  [POST_CATEGORIES.EVENT_REPORT]: {
    gradient: 'linear-gradient(135deg, #0e1e10 0%, #162818 100%)',
    image: '/eventreport.jpg',
    size: 'cover',
    opacity: 0.28,
  },
  [POST_CATEGORIES.INTERNATIONAL_OUTREACH]: {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    image: '/VATICAN.png',
    size: 'contain',
    opacity: 0.25,
  },
};

const YOUTH_IMAGES = [1, 2, 3, 4].map(n => `/youth%20committee/${n}.jpg`);
const ADULT_IMAGES = [1, 2, 3, 4, 5, 6].map(n => `/adult%20committee/${n}.jpg`);

const SLIDESHOW_GRADIENT = {
  [POST_CATEGORIES.YOUTH_COMMITTEE]: 'linear-gradient(135deg, #0a1628 0%, #162040 100%)',
  [POST_CATEGORIES.ADULT_COMMITTEE]: 'linear-gradient(135deg, #1e0d08 0%, #2e1610 100%)',
};

const BADGE_COLORS = {
  all: '#1B3A6B',
  [POST_CATEGORIES.PARISH_NOTICE]: '#1B3A6B',
  [POST_CATEGORIES.EVENT_REPORT]: '#256329',
  [POST_CATEGORIES.YOUTH_COMMITTEE]: '#1B3A6B',
  [POST_CATEGORIES.ADULT_COMMITTEE]: '#7a3010',
  [POST_CATEGORIES.INTERNATIONAL_OUTREACH]: '#BA0021',
};

/* ── Glass style constants ── */
const glass = {
  base: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  inactive: {
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.78)',
  },
  hover: {
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
  },
};

const PostsPage = () => {
  const { getRecentPosts, getPostsByCategory } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [slideIdx, setSlideIdx] = useState(0);

  const isYouth = activeTab === POST_CATEGORIES.YOUTH_COMMITTEE;
  const isAdult = activeTab === POST_CATEGORIES.ADULT_COMMITTEE;
  const isSlideshow = isYouth || isAdult;
  const slideshowImages = isYouth ? YOUTH_IMAGES : isAdult ? ADULT_IMAGES : [];

  useEffect(() => {
    setSlideIdx(0);
    if (!slideshowImages.length) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slideshowImages.length), 4000);
    return () => clearInterval(t);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const getFilteredPosts = () => {
    let posts = activeTab === 'all' ? getRecentPosts(100) : getPostsByCategory(activeTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.content || '').toLowerCase().includes(q)
      );
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const handleTabChange = val => { setActiveTab(val); setCurrentPage(1); };
  const formatDate = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const baseBg = isSlideshow
    ? SLIDESHOW_GRADIENT[activeTab]
    : (TAB_BG[activeTab]?.gradient || 'linear-gradient(135deg,#0e1620 0%,#1b2a38 100%)');

  const badgeColor = BADGE_COLORS[activeTab] || '#1B3A6B';

  const TABS = [
    { value: 'all', label: 'All Posts', activeColor: 'rgba(27,58,107,0.8)' },
    { value: POST_CATEGORIES.PARISH_NOTICE, label: 'Parish Notice', activeColor: 'rgba(27,58,107,0.8)' },
    { value: POST_CATEGORIES.EVENT_REPORT, label: 'Event Report', activeColor: 'rgba(22,80,30,0.85)' },
    { value: POST_CATEGORIES.YOUTH_COMMITTEE, label: 'Youth Committee', activeColor: 'rgba(27,58,107,0.8)' },
    { value: POST_CATEGORIES.ADULT_COMMITTEE, label: 'Adult Committee', activeColor: 'rgba(100,40,10,0.85)' },
    { value: POST_CATEGORIES.INTERNATIONAL_OUTREACH, label: 'International Outreach', activeColor: 'rgba(186,0,33,0.8)' },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', background: baseBg, position: 'relative' }}>

      {/* ── Placeholder style ── */}
      <style>{`
        .posts-search::placeholder { color: rgba(255,255,255,0.4); }
        .posts-search:focus { outline: none; }
      `}</style>

      {/* Static photo overlay */}
      {!isSlideshow && TAB_BG[activeTab] && (
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}${TAB_BG[activeTab].image})`,
          backgroundSize: TAB_BG[activeTab].size,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: TAB_BG[activeTab].opacity,
          zIndex: 0,
        }} />
      )}

      {/* Slideshow layers */}
      {isSlideshow && slideshowImages.map((src, i) => (
        <div key={src} className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: i === slideIdx ? 0.22 : 0,
          zIndex: 0,
          transition: 'opacity 1s ease',
        }} />
      ))}

      <div style={{ maxWidth: 1152, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.5)', marginBottom: 8 }}>
            Posts
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
            Stay updated with the latest news and events from our parish
          </p>
        </div>

        {/* ── Glass Search Bar ── */}
        <div style={{ maxWidth: 440, margin: '0 auto 32px' }}>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlassIcon
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 18, height: 18, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none',
              }}
            />
            <input
              className="posts-search"
              type="text"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                paddingLeft: 48, paddingRight: 20, paddingTop: 13, paddingBottom: 13,
                borderRadius: 50,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff',
                fontSize: 14,
                letterSpacing: '0.01em',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.45)';
                e.target.style.boxShadow = '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.28), 0 0 0 3px rgba(255,255,255,0.07)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.22)';
                e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)';
              }}
            />
          </div>
        </div>

        {/* ── Glass Tab Buttons ── */}
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List
            style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32,
            }}
          >
            {TABS.map(({ value, label, activeColor }) => {
              const isActive = activeTab === value;
              return (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 50,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    letterSpacing: '0.015em',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    background: isActive ? activeColor : 'rgba(255,255,255,0.08)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.3)'
                      : '1px solid rgba(255,255,255,0.14)',
                    boxShadow: isActive
                      ? '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.15)'
                      : '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
                    }
                  }}
                >
                  {label}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <Tabs.Content value={activeTab}>
            <div key={activeTab} className="hn-tab-enter">
              {paginatedPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPosts.map(post => (
                    <Link
                      to={`/posts/${post.id}`}
                      key={post.id}
                      style={{
                        textDecoration: 'none', display: 'block', borderRadius: 14,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.6)',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.6)';
                      }}
                    >
                      {post.images && post.images.length > 0 && (
                        <div style={{ height: 192, overflow: 'hidden' }}>
                          <img
                            src={process.env.PUBLIC_URL + post.images[0]}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </div>
                      )}
                      <div style={{ padding: 18 }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                          fontSize: 11, fontWeight: 700, color: '#fff',
                          background: badgeColor, marginBottom: 10,
                        }}>
                          {post.category}
                        </span>
                        <h2 style={{
                          fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8, lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {post.title}
                        </h2>
                        <p style={{
                          fontSize: 13, color: '#4b5563', marginBottom: 14, lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {post.excerpt || (post.content || '').substring(0, 100) + '…'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                          <span>{post.author}</span>
                          <span>{formatDate(post.date)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>No posts found</p>
                  {searchQuery && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 14 }}>
                      Try adjusting your search or filter
                    </p>
                  )}
                </div>
              )}

              {/* ── Glass Pagination ── */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40 }}>
                  {[
                    { label: 'Previous', icon: <ChevronLeftIcon style={{ width: 16, height: 16 }} />, side: 'left', disabled: currentPage === 1, onClick: () => setCurrentPage(p => p - 1) },
                    { label: 'Next', icon: <ChevronRightIcon style={{ width: 16, height: 16 }} />, side: 'right', disabled: currentPage === totalPages, onClick: () => setCurrentPage(p => p + 1) },
                  ].map(({ label, icon, side, disabled, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      disabled={disabled}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 22px',
                        borderRadius: 50,
                        border: disabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.25)',
                        background: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                        color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontSize: 13, fontWeight: 600,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: disabled
                          ? 'none'
                          : '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        if (!disabled) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                          e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.28)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!disabled) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                        }
                      }}
                    >
                      {side === 'left' && icon}
                      {label}
                      {side === 'right' && icon}
                    </button>
                  ))}

                  {/* Page indicator — also glass */}
                  <span style={{
                    padding: '10px 20px',
                    borderRadius: 50,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 500,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}>
                    {currentPage} / {totalPages}
                  </span>
                </div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default PostsPage;
