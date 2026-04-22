import React, { useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardHome = () => {
  const { theme, colors } = useOutletContext() || {};
  const {
    currentUser,
    isSuperAdmin,
    getLivePages,
    getDraftPages,
    getAllPages,
    getLivePosts,
    getDraftPosts,
    getAllPosts,
    getAllMedia,
    getPendingSubmissions,
    getMyTasks,
    getPendingDocuments,
    getUnreadNotifications,
    getAllVideoLinks,
    users,
    loadAllData,
  } = useAuth();

  // Refresh data on mount so stats are always current
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const livePages = getLivePages();
  const draftPages = getDraftPages();
  const allPages = getAllPages ? getAllPages() : [];
  const livePosts = getLivePosts();
  const draftPosts = getDraftPosts();
  const allPosts = getAllPosts ? getAllPosts() : [];
  const media = getAllMedia();
  const pendingSubmissions = getPendingSubmissions();
  const myTasks = getMyTasks();
  const pendingDocuments = getPendingDocuments();
  const unreadNotifications = getUnreadNotifications();
  const videoLinks = getAllVideoLinks();

  const totalMediaWithVideos = media.length + videoLinks.length;

  const stats = isSuperAdmin()
    ? [
      {
        label: 'Pending Approvals',
        value: pendingSubmissions.length,
        accent: 'var(--theme-gold)',
        accentBg: 'rgba(201,168,76,0.08)',
        link: '/admin/submissions',
        icon: '◈',
      },
      {
        label: 'Live Pages',
        value: livePages.length,
        accent: '#16a34a',
        accentBg: 'rgba(22,163,74,0.08)',
        link: '/admin/pages',
        icon: '◫',
      },
      {
        label: 'Live Posts',
        value: livePosts.length,
        accent: '#2a6099',
        accentBg: 'rgba(42,96,153,0.08)',
        link: '/admin/posts',
        icon: '≡',
      },
      {
        label: 'Total Pages',
        value: allPages.length,
        accent: '#0891b2',
        accentBg: 'rgba(8,145,178,0.08)',
        link: '/admin/pages',
        icon: '◫',
      },
      {
        label: 'My Tasks',
        value: myTasks.length,
        accent: '#ea580c',
        accentBg: 'rgba(234,88,12,0.08)',
        link: '/admin/tasks',
        icon: '◎',
      },
      {
        label: 'Total Users',
        value: users?.length || 0,
        accent: '#7c3aed',
        accentBg: 'rgba(124,58,237,0.08)',
        link: '/admin/users',
        icon: '◉',
      },
    ]
    : [
      { label: 'Live Pages', value: livePages.length, accent: '#16a34a', accentBg: 'rgba(22,163,74,0.08)', link: '/admin/pages', icon: '◫' },
      { label: 'Draft Pages', value: draftPages.length, accent: 'var(--theme-gold)', accentBg: 'rgba(201,168,76,0.08)', link: '/admin/pages', icon: '◫' },
      { label: 'Live Posts', value: livePosts.length, accent: '#2a6099', accentBg: 'rgba(42,96,153,0.08)', link: '/admin/posts', icon: '≡' },
      { label: 'Draft Posts', value: draftPosts.length, accent: '#ea580c', accentBg: 'rgba(234,88,12,0.08)', link: '/admin/posts', icon: '≡' },
      { label: 'Media Files', value: totalMediaWithVideos, accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.08)', link: '/admin/media', icon: '⊡' },
      { label: 'My Tasks', value: myTasks.length, accent: 'var(--theme-gold)', accentBg: 'rgba(201,168,76,0.08)', link: '/admin/tasks', icon: '◎' },
    ];

  const quickActions = isSuperAdmin()
    ? [
      { label: 'Submitted Pages', desc: 'Review pending page submissions', icon: 'page', to: '/admin/submissions?type=page', accent: 'var(--theme-accent)' },
      { label: 'Submitted Posts', desc: 'Review pending post submissions', icon: 'post', to: '/admin/submissions?type=post', accent: '#2a6099' },
      { label: 'Submitted Media', desc: 'Review pending media uploads', icon: 'media', to: '/admin/submissions?type=media', accent: '#16a34a' },
    ]
    : [
      { label: 'New Page', desc: 'Guild or committee page', icon: 'new-page', to: '/admin/pages/new', accent: 'var(--theme-accent)' },
      { label: 'New Post', desc: 'Article or event report', icon: 'new-post', to: '/admin/posts/new', accent: '#2a6099' },
      { label: 'Upload Media', desc: 'Images, documents, videos', icon: 'upload', to: '/admin/media', accent: '#16a34a' },
    ];

  const ActionIcon = ({ name }) => {
    const map = {
      page: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      post: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      media: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
        </svg>
      ),
      'new-page': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      'new-post': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      upload: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      ),
    };
    return map[name] || null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .dh-root {
          padding: 28px 28px 40px;
          font-family: 'Inter', sans-serif;
          color: var(--theme-text);
          min-height: 100vh;
          background: var(--theme-bg);
        }

        /* Welcome banner */
        .dh-welcome {
          border-radius: 16px;
          padding: 28px 32px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(120deg, #0a1324 0%, var(--theme-accent) 45%, #2a6099 70%, #1a3a60 100%);
          border: 1px solid rgba(168,204,232,0.12);
          box-shadow: 0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(168,204,232,0.1);
        }
        .dh-welcome::after {
          content: '';
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            -45deg, transparent, transparent 30px,
            rgba(168,204,232,0.02) 30px, rgba(168,204,232,0.02) 31px
          );
          pointer-events: none;
        }
        .dh-welcome-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.7);
          margin-bottom: 10px;
          font-family: 'Cinzel', serif;
          position: relative; z-index: 1;
        }
        .dh-welcome-name {
          font-family: 'Cinzel', serif;
          font-size: 22px; font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em; margin-bottom: 6px;
          position: relative; z-index: 1;
        }
        .dh-welcome-role {
          font-size: 12.5px;
          color: rgba(168,204,232,0.55);
          letter-spacing: 0.06em;
          position: relative; z-index: 1;
        }
        .dh-welcome-divider {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, rgba(201,168,76,0.5), transparent);
          margin: 14px 0 16px;
          position: relative; z-index: 1;
        }

        /* Section header */
        .dh-section {
          font-family: 'Cinzel', serif;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(168,204,232,0.25);
          margin-bottom: 12px; margin-top: 30px;
          display: flex; align-items: center; gap: 12px;
        }
        .dh-section::after {
          content: '';
          flex: 1; height: 1px;
          background: var(--theme-border);
        }

        /* Quick actions */
        .dh-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 768px) { .dh-actions { grid-template-columns: 1fr; } }

        .dh-action-card {
          display: flex; align-items: center; gap: 16px;
          padding: 18px 20px;
          text-decoration: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--theme-border);
          transition: all 0.18s ease;
        }
        .dh-action-card:hover {
          background: var(--theme-border);
          border-color: rgba(168,204,232,0.16);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .dh-action-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #fff; font-weight: 700;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .dh-action-label {
          font-size: 13.5px; font-weight: 600;
          color: var(--theme-text); margin-bottom: 3px;
        }
        .dh-action-desc {
          font-size: 11.5px;
          color: var(--theme-text-muted);
        }

        /* Stats */
        .dh-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }
        @media (max-width: 1100px) { .dh-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .dh-stats { grid-template-columns: repeat(2, 1fr); } }

        .dh-stat-card {
          padding: 18px 16px;
          text-decoration: none;
          display: block;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--theme-border);
          transition: all 0.18s ease;
        }
        .dh-stat-card:hover {
          background: var(--theme-border);
          border-color: rgba(168,204,232,0.14);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.2);
        }
        .dh-stat-dot {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .dh-stat-val {
          font-family: 'Inter', sans-serif;
          font-size: 28px; font-weight: 700;
          color: var(--theme-text); line-height: 1; margin-bottom: 5px;
          letter-spacing: -0.02em;
        }
        .dh-stat-label {
          font-size: 11px;
          color: var(--theme-text-muted);
          font-weight: 450;
        }

        /* Panel */
        .dh-panel {
          margin-bottom: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--theme-border);
          overflow: hidden;
        }
        .dh-panel-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--theme-border);
        }
        .dh-panel-title {
          font-size: 13px; font-weight: 600;
          color: var(--theme-text);
        }
        .dh-panel-link {
          font-size: 12px;
          color: rgba(42,96,153,0.8);
          text-decoration: none; transition: color 0.2s;
        }
        .dh-panel-link:hover { color: #a8cce8; }
        .dh-panel-body { padding: 16px 18px; }

        .dh-alert {
          border-radius: 10px; padding: 16px 18px; font-size: 13px;
        }
        .dh-alert-yellow {
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15);
          color: rgba(201,168,76,0.85);
        }
        .dh-alert-blue {
          background: rgba(42,96,153,0.06);
          border: 1px solid rgba(42,96,153,0.2);
          color: rgba(168,204,232,0.7);
        }
        .dh-alert strong { font-weight: 600; color: inherit; }
        .dh-alert-btn {
          display: inline-block; margin-top: 12px;
          padding: 7px 16px; border-radius: 7px;
          font-size: 12px; font-weight: 600;
          text-decoration: none; transition: all 0.18s;
          cursor: pointer;
        }
        .dh-alert-btn:hover { opacity: 0.82; transform: translateY(-1px); }
        .dh-alert-btn-yellow {
          background: rgba(201,168,76,0.12);
          color: rgba(201,168,76,0.9);
          border: 1px solid rgba(201,168,76,0.2);
        }
        .dh-alert-btn-blue {
          background: rgba(42,96,153,0.12);
          color: rgba(168,204,232,0.8);
          border: 1px solid rgba(42,96,153,0.25);
        }

        .dh-doc-row {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(168,204,232,0.04);
          border: 1px solid var(--theme-border);
          border-radius: 7px;
          padding: 8px 12px;
          margin-top: 8px;
        }
        .dh-doc-name { font-size: 12px; color: rgba(168,204,232,0.65); }
        .dh-doc-by { font-size: 11px; color: rgba(168,204,232,0.3); }

        .dh-notif-badge {
          background: #dc2626; color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 20px;
        }
        .dh-notif-item {
          padding: 11px 0;
          border-bottom: 1px solid rgba(168,204,232,0.05);
        }
        .dh-notif-item:last-child { border-bottom: none; }
        .dh-notif-title { font-size: 13px; font-weight: 500; color: var(--theme-text); margin-bottom: 3px; }
        .dh-notif-msg { font-size: 12px; color: var(--theme-text-muted); }

        /* Overview */
        .dh-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) { .dh-overview { grid-template-columns: 1fr; } }

        .dh-ov-card {
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--theme-border);
          padding: 18px 20px;
        }
        .dh-ov-title {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(168,204,232,0.3); margin-bottom: 14px;
          font-family: 'Cinzel', serif;
        }
        .dh-ov-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(168,204,232,0.05);
          font-size: 13px;
        }
        .dh-ov-row:last-child { border-bottom: none; }
        .dh-ov-key { color: var(--theme-text-muted); font-weight: 400; }
        .dh-ov-val { font-weight: 600; font-size: 14px; }
        .c-green  { color: #4ade80; }
        .c-yellow { color: var(--theme-gold); }
        .c-orange { color: #fb923c; }
        .c-muted  { color: rgba(168,204,232,0.2); }
      `}</style>

      <div className="dh-root">
        {/* Welcome */}
        <div className="dh-welcome">
          <div className="dh-welcome-eyebrow">Holy Name Catholic Church</div>
          <div className="dh-welcome-name">Welcome back, {currentUser?.name}</div>
          <div className="dh-welcome-divider" />
          <div className="dh-welcome-role">
            {isSuperAdmin() ? 'Super Administrator' : 'SocCom Administrator'}
          </div>
        </div>

        {/* Quick actions */}
        <div className="dh-section">Quick Actions</div>
        <div className="dh-actions">
          {quickActions.map(({ label, desc, icon, to, accent }) => (
            <Link key={label} to={to} className="dh-action-card">
              <div className="dh-action-icon" style={{ background: accent }}>
                <ActionIcon name={icon} />
              </div>
              <div>
                <div className="dh-action-label">{label}</div>
                <div className="dh-action-desc">{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="dh-section">At a Glance</div>
        <div className="dh-stats">
          {stats.map(({ label, value, accent, accentBg, link, icon }) => (
            <Link key={label} to={link} className="dh-stat-card">
              <div className="dh-stat-dot" style={{ background: accentBg, color: accent }}>
                {icon}
              </div>
              <div className="dh-stat-val">{value}</div>
              <div className="dh-stat-label">{label}</div>
            </Link>
          ))}
        </div>

        {/* Super-admin alerts */}
        {isSuperAdmin() && pendingSubmissions.length > 0 && (
          <>
            <div className="dh-section">Requires Attention</div>
            <div className="dh-panel">
              <div className="dh-panel-head">
                <span className="dh-panel-title">Pending Approvals</span>
                <Link to="/admin/submissions" className="dh-panel-link">View All →</Link>
              </div>
              <div className="dh-panel-body">
                <div className="dh-alert dh-alert-yellow">
                  <strong>{pendingSubmissions.length}</strong> submission(s) awaiting review
                  <br />
                  <Link to="/admin/submissions" className="dh-alert-btn dh-alert-btn-yellow">
                    Review Now
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {isSuperAdmin() && pendingDocuments.length > 0 && (
          <div className="dh-panel">
            <div className="dh-panel-head">
              <span className="dh-panel-title">Document Review</span>
              <Link to="/admin/media" className="dh-panel-link">View All →</Link>
            </div>
            <div className="dh-panel-body">
              <div className="dh-alert dh-alert-blue">
                <strong>{pendingDocuments.length}</strong> document(s) awaiting review
                <div>
                  {pendingDocuments.slice(0, 3).map(doc => (
                    <div key={doc.id} className="dh-doc-row">
                      <span className="dh-doc-name">{doc.name} (v{doc.version})</span>
                      <span className="dh-doc-by">by {doc.author_name}</span>
                    </div>
                  ))}
                </div>
                <Link to="/admin/media" className="dh-alert-btn dh-alert-btn-blue">
                  Review Documents
                </Link>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin() && unreadNotifications.length > 0 && (
          <div className="dh-panel">
            <div className="dh-panel-head">
              <span className="dh-panel-title">Notifications</span>
              <span className="dh-notif-badge">{unreadNotifications.length} new</span>
            </div>
            <div className="dh-panel-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {unreadNotifications.slice(0, 5).map(n => (
                <div key={n.id} className="dh-notif-item">
                  <div className="dh-notif-title">{n.title}</div>
                  <div className="dh-notif-msg">{n.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview */}
        <div className="dh-section">Status Overview</div>
        <div className="dh-overview">
          <div className="dh-ov-card">
            <div className="dh-ov-title">Pages</div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Live & Visible</span>
              <span className="dh-ov-val c-green">{livePages.filter(p => p.visible).length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Live & Hidden</span>
              <span className="dh-ov-val c-muted">{livePages.filter(p => !p.visible).length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Draft</span>
              <span className="dh-ov-val c-yellow">{draftPages.length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Pending Review</span>
              <span className="dh-ov-val c-orange">{pendingSubmissions.filter(s => s.type === 'page').length}</span>
            </div>
          </div>
          <div className="dh-ov-card">
            <div className="dh-ov-title">Posts</div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Live & Visible</span>
              <span className="dh-ov-val c-green">{livePosts.filter(p => p.visible).length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Live & Hidden</span>
              <span className="dh-ov-val c-muted">{livePosts.filter(p => !p.visible).length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Draft</span>
              <span className="dh-ov-val c-yellow">{draftPosts.length}</span>
            </div>
            <div className="dh-ov-row">
              <span className="dh-ov-key">Pending Review</span>
              <span className="dh-ov-val c-orange">{pendingSubmissions.filter(s => s.type === 'post').length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;