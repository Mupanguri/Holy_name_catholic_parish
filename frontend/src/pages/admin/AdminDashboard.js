import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationsPanel from '../../components/NotificationsPanel';

const AdminDashboard = () => {
  const {
    currentUser,
    logout,
    isSuperAdmin,
    getPendingSubmissions,
    getMyTasks,
    getPendingVideoLinks,
    getAllDocuments,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dim'); // 'light', 'dim', 'dark'

  const handleLogout = () => {
    logout();
    sessionStorage.setItem('logoutAnimation', 'true');
    navigate('/admin/login');
  };

  const pendingSubmissions = getPendingSubmissions();
  const pendingVideoLinks = getPendingVideoLinks();
  const allDocs = getAllDocuments();
  const pendingDocuments = allDocs.filter(d => d.status === 'pending');
  const taskCount = getMyTasks().length;

  const totalPending =
    pendingSubmissions.length + pendingDocuments.length + pendingVideoLinks.length;

  // Theme colors configuration
  const themeConfig = {
    light: {
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      text: '#000000',
      textMuted: '#333333',
      border: '#000000',
      sidebar: '#ffffff',
      sidebarBorder: '#000000',
      header: '#ffffff',
      accent: '#1B3A6B',
      gold: '#C9A84C',
    },
    dim: {
      bg: '#2d3748',
      bgSecondary: '#1a202c',
      text: '#ffffff',
      textMuted: '#cbd5e0',
      border: '#4a5568',
      sidebar: '#1a202c',
      sidebarBorder: '#4a5568',
      header: '#2d3748',
      accent: '#63b3ed',
      gold: '#f6e05e',
    },
    dark: {
      bg: '#000000',
      bgSecondary: '#0a0a0a',
      text: '#ffffff',
      textMuted: '#a0aec0',
      border: '#2d3748',
      sidebar: '#000000',
      sidebarBorder: '#1a202c',
      header: '#000000',
      accent: '#3182ce',
      gold: '#fbbf24',
    },
  };

  const colors = themeConfig[theme];

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!currentUser && !token) {
      navigate('/admin/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  let menuItems = [];

  if (isSuperAdmin()) {
    menuItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
      { path: '/admin/pages', label: 'Pages', icon: 'file', description: 'Toggle visibility' },
      { path: '/admin/posts', label: 'Posts', icon: 'edit', description: 'Toggle visibility' },
      { path: '/admin/media', label: 'Media Library', icon: 'image', description: 'Manage media' },
      {
        path: '/admin/tasks',
        label: `Tasks${taskCount > 0 ? ` (${taskCount})` : ''}`,
        icon: 'check',
      },
      {
        path: '/admin/submissions',
        label: `Approvals${totalPending > 0 ? ` (${totalPending})` : ''}`,
        icon: 'inbox',
        badge: totalPending > 0 ? totalPending : null,
      },
      { path: '/admin/notifications', label: 'Notifications', icon: 'bell' },
      { path: '/admin/users', label: 'Users', icon: 'users' },
    ];
  } else {
    menuItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
      { path: '/admin/pages', label: 'Pages', icon: 'file' },
      { path: '/admin/posts', label: 'Posts', icon: 'edit' },
      { path: '/admin/media', label: 'Media Library', icon: 'image' },
      {
        path: '/admin/tasks',
        label: `Tasks${taskCount > 0 ? ` (${taskCount})` : ''}`,
        icon: 'check',
      },
      { path: '/admin/notifications', label: 'Notifications', icon: 'bell' },
    ];
  }

  const isActive = path => location.pathname === path;

  const NavIcon = ({ name }) => {
    const icons = {
      grid: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      file: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      edit: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      image: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      ),
      check: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9,11 12,14 22,4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      inbox: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
      bell: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      users: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      link: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15,3 21,3 21,9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ),
      logout: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
    };
    return icons[name] || null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        /* Global theme propagation */
        .ad-root, .ad-root * {
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }
        .ad-root input, .ad-root textarea, .ad-root select {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }
        .ad-root table, .ad-root thead, .ad-root tbody, .ad-root tr, .ad-root th, .ad-root td {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }
        .ad-root a { color: var(--theme-accent) !important; }
        .ad-root button {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }

        .ad-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: var(--theme-bg, #0f1624);
          transition: background 0.3s ease;
        }

        /* ── Sidebar ── */
        .ad-sidebar {
          flex-shrink: 0;
          width: 248px;
          background: var(--theme-sidebar, #0a1019);
          border-right: 1px solid var(--theme-border, rgba(168,204,232,0.08));
          display: flex;
          flex-direction: column;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1), background 0.3s ease;
          overflow: hidden;
          position: relative;
        }
        .ad-sidebar::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 1px; height: 100%;
          background: linear-gradient(180deg, rgba(168,204,232,0.12) 0%, rgba(168,204,232,0.04) 50%, rgba(201,168,76,0.08) 100%);
        }
        .ad-sidebar.collapsed { width: 64px; }

        .ad-brand {
          padding: 20px 16px;
          border-bottom: 1px solid var(--theme-border, rgba(168,204,232,0.06));
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          gap: 12px;
        }
        .ad-brand-icon {
          flex-shrink: 0;
          width: 44px; height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 2px solid rgba(201,168,76,0.25);
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
          background: rgba(201,168,76,0.05);
        }
        .ad-brand-text { min-width: 0; overflow: hidden; }
        .ad-brand-name {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--theme-text, #e8edf4);
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ad-brand-sub {
          font-size: 10px;
          color: var(--theme-text-muted, rgba(168,204,232,0.35));
          letter-spacing: 0.08em;
          white-space: nowrap;
          margin-top: 2px;
        }
        .ad-toggle {
          flex-shrink: 0;
          width: 26px; height: 26px;
          background: rgba(168,204,232,0.06);
          border: 1px solid rgba(168,204,232,0.12);
          border-radius: 6px;
          color: rgba(168,204,232,0.45);
          font-size: 10px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .ad-toggle:hover { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.8); }

        .ad-user {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(168,204,232,0.05);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ad-avatar {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #1B3A6B, #2a6099);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cinzel', serif;
          font-size: 13px; font-weight: 600;
          color: #e8edf4;
          border: 1px solid rgba(168,204,232,0.2);
        }
        .ad-user-name {
          font-size: 13px; font-weight: 500;
          color: #e8edf4; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .ad-user-role {
          font-size: 10px;
          color: rgba(168,204,232,0.35);
          letter-spacing: 0.06em; white-space: nowrap;
          margin-top: 2px;
        }
        .ad-user-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.2);
          color: rgba(201,168,76,0.8);
          margin-top: 3px;
        }

        .ad-nav { flex: 1; padding: 10px 10px; overflow-y: auto; }
        .ad-nav::-webkit-scrollbar { width: 3px; }
        .ad-nav::-webkit-scrollbar-track { background: transparent; }
        .ad-nav::-webkit-scrollbar-thumb { background: rgba(168,204,232,0.12); border-radius: 3px; }

        .ad-nav-section {
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(168,204,232,0.2);
          padding: 14px 8px 6px;
          font-family: 'Cinzel', serif;
          white-space: nowrap; overflow: hidden;
        }
        .ad-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px; margin-bottom: 2px;
          text-decoration: none;
          color: rgba(168,204,232,0.4);
          font-size: 13px;
          font-weight: 450;
          transition: background 0.14s, color 0.14s;
          white-space: nowrap; position: relative;
          cursor: pointer;
        }
        .ad-nav-item:hover {
          background: rgba(168,204,232,0.06);
          color: rgba(168,204,232,0.85);
        }
        .ad-nav-item.active {
          background: rgba(42,96,153,0.15);
          color: #a8cce8;
        }
        .ad-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 2px;
          background: linear-gradient(180deg, #2a6099, #C9A84C);
          border-radius: 0 2px 2px 0;
        }
        .ad-nav-icon {
          flex-shrink: 0;
          width: 18px;
          display: flex; align-items: center; justify-content: center;
          opacity: 0.75;
        }
        .ad-nav-item.active .ad-nav-icon { opacity: 1; }
        .ad-nav-badge {
          margin-left: auto;
          background: #dc2626; color: #fff;
          font-size: 9.5px; font-weight: 700;
          padding: 2px 7px; border-radius: 20px; flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .ad-bottom {
          padding: 8px 10px 14px;
          border-top: 1px solid rgba(168,204,232,0.05);
        }
        .ad-bottom-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          text-decoration: none;
          color: rgba(168,204,232,0.35);
          font-size: 13px;
          background: none; border: none; cursor: pointer;
          width: 100%;
          transition: background 0.14s, color 0.14s;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          font-weight: 450;
        }
        .ad-bottom-btn:hover { background: rgba(168,204,232,0.06); color: rgba(168,204,232,0.75); }
        .ad-bottom-btn.danger:hover { background: rgba(220,38,38,0.08); color: #fca5a5; }

        /* ── Main ── */
        .ad-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: var(--theme-bg, #0f1624);
          min-width: 0;
          transition: background 0.3s ease;
        }

        .ad-main *, .ad-main *::before, .ad-main *::after {
          border-color: var(--theme-border) !important;
        }
        .ad-main, .ad-main * {
          color: var(--theme-text) !important;
        }
        .ad-main input, .ad-main textarea, .ad-main select {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }
        .ad-main table, .ad-main thead, .ad-main tbody, .ad-main tr, .ad-main th, .ad-main td {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }
        .ad-main a {
          color: var(--theme-accent) !important;
        }
        .ad-main button {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }

        .ad-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 14px 24px;
          background: var(--theme-header, rgba(10,16,25,0.8));
          border-bottom: 1px solid var(--theme-border, rgba(168,204,232,0.07));
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .ad-sidebar.collapsed .ad-brand-text,
        .ad-sidebar.collapsed .ad-user-name,
        .ad-sidebar.collapsed .ad-user-role,
        .ad-sidebar.collapsed .ad-user-badge,
        .ad-sidebar.collapsed .ad-nav-section,
        .ad-sidebar.collapsed .ad-nav-label,
        .ad-sidebar.collapsed .ad-nav-badge,
        .ad-sidebar.collapsed .ad-bottom-label,
        .ad-sidebar.collapsed .ad-brand-sub {
          display: none;
        }
        .ad-sidebar.collapsed .ad-brand { justify-content: center; }
        .ad-sidebar.collapsed .ad-user { justify-content: center; }
        .ad-sidebar.collapsed .ad-nav-item { justify-content: center; padding: 10px; }
        .ad-sidebar.collapsed .ad-bottom-btn { justify-content: center; padding: 10px; }
      `}</style>

      <div
        className="ad-root"
        style={{
          '--theme-bg': colors.bg,
          '--theme-bg-secondary': colors.bgSecondary,
          '--theme-text': colors.text,
          '--theme-text-muted': colors.textMuted,
          '--theme-border': colors.border,
          '--theme-sidebar': colors.sidebar,
          '--theme-header': colors.header,
          '--theme-accent': colors.accent,
          '--theme-gold': colors.gold,
        }}
      >
        <aside
          className={`ad-sidebar${sidebarOpen ? '' : ' collapsed'}`}
          style={{ background: colors.sidebar, borderColor: colors.border }}
        >
          <div className="ad-brand">
            <img
              src={process.env.PUBLIC_URL + '/images/logo.jpg'}
              alt="Holy Name Church"
              className="ad-brand-icon"
            />
            <div className="ad-brand-text">
              <div className="ad-brand-name">Admin Center</div>
              <div className="ad-brand-sub">Holy Name Parish</div>
            </div>
            <button className="ad-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              ) : (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              )}
            </button>
          </div>

          <div className="ad-user">
            <div className="ad-avatar">{currentUser.name.charAt(0)}</div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div className="ad-user-name">{currentUser.name}</div>
              <div className="ad-user-role">{isSuperAdmin() ? 'Super Admin' : 'SocCom Admin'}</div>
              <div className="ad-user-badge">{isSuperAdmin() ? 'Super' : 'Admin'}</div>
            </div>
          </div>

          <nav className="ad-nav">
            {sidebarOpen && <div className="ad-nav-section">Navigation</div>}
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`ad-nav-item${isActive(item.path) ? ' active' : ''}`}
              >
                <span className="ad-nav-icon">
                  <NavIcon name={item.icon} />
                </span>
                <span className="ad-nav-label">{item.label}</span>
                {item.badge && <span className="ad-nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="ad-bottom">
            <Link to="/" className="ad-bottom-btn">
              <span className="ad-nav-icon">
                <NavIcon name="link" />
              </span>
              <span className="ad-bottom-label">View Website</span>
            </Link>
            <button onClick={handleLogout} className="ad-bottom-btn danger">
              <span className="ad-nav-icon">
                <NavIcon name="logout" />
              </span>
              <span className="ad-bottom-label">Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="ad-main" style={{ background: colors.bg }}>
          <div
            className="ad-header"
            style={{ background: colors.header, borderColor: colors.border }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}
            >
              <button
                onClick={() =>
                  setTheme(theme === 'light' ? 'dim' : theme === 'dim' ? 'dark' : 'light')
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgSecondary,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {theme === 'light' && '☀️ Light'}
                {theme === 'dim' && '🌙 Dim'}
                {theme === 'dark' && '⚫ Dark'}
              </button>
            </div>
            <NotificationsPanel />
          </div>
          <Outlet context={{ theme, colors, setTheme }} />
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
