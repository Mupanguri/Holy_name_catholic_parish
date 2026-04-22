import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getCorrectPath, getCorrectPagePath } from '../../utils/pathMapper';
import { BRANCHES } from '../../constants/CMSConstants';
import API_BASE_URL from '../../services/api';

const PagesManager = () => {
  const { theme, colors } = useOutletContext() || {};
  const {
    getAllPages,
    getLivePages,
    getDraftPages,
    togglePageVisibility,
    submitPageForApproval,
    deletePage,
    isSuperAdmin,
    currentUser,
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [isToggling, setIsToggling] = useState(null);
  const [statusModalPage, setStatusModalPage] = useState(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySearch, setCopySearch] = useState('');
  const [seedingPages, setSeedingPages] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  const handleDelete = async pageId => {
    if (
      window.confirm('Are you sure you want to delete this page? This action cannot be undone.')
    ) {
      try {
        await deletePage(pageId);
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  };

  useEffect(() => {
    // Everyone can access - content shown depends on role
  }, []);

  const allPages = getAllPages();
  const livePages = getLivePages();
  const draftPages = getDraftPages();
  const pendingPages = (allPages || []).filter(p => p.status === 'pending');
  const rejectedPages = (allPages || []).filter(p => p.status === 'rejected');

  const getFilteredPages = () => {
    let pages =
      activeTab === 'live'
        ? livePages
        : activeTab === 'draft'
          ? draftPages
          : activeTab === 'pending'
            ? pendingPages
            : activeTab === 'rejected'
              ? rejectedPages
              : allPages;

    if (searchTerm) {
      pages = pages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (branchFilter) {
      pages = pages.filter(p => String(p.branch) === String(branchFilter));
    }
    return pages;
  };

  const pages = getFilteredPages();

  const handleToggleVisibility = async pageId => {
    if (isToggling) return;
    setIsToggling(pageId);
    try {
      await togglePageVisibility(pageId);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility. Please try again.');
    } finally {
      setIsToggling(null);
    }
  };

  const handleSubmitForApproval = async pageId => {
    await submitPageForApproval(pageId);
    alert('Page submitted for approval!');
  };

  const handlePublishSystemPages = async () => {
    if (publishing) return;
    if (!window.confirm('Make all seeded system pages live and visible to the public?')) return;
    setPublishing(true);
    setPublishMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/bulk-publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setPublishMsg(`✓ ${data.message}`);
        setTimeout(() => window.location.reload(), 800);
      } else {
        setPublishMsg(`Error: ${data.error || 'Failed'}`);
      }
    } catch (e) {
      setPublishMsg('Network error');
    } finally {
      setPublishing(false);
    }
  };

  const handleSeedPages = async () => {
    if (seedingPages) return;
    if (!window.confirm('Seed all system (hardcoded) pages into the database? Existing pages will not be overwritten.')) return;
    setSeedingPages(true);
    setSeedMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/seed-pages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSeedMsg(`✓ ${data.message}`);
        // Reload page list
        if (typeof window !== 'undefined') window.location.reload();
      } else {
        setSeedMsg(`Error: ${data.error || 'Failed'}`);
      }
    } catch (e) {
      setSeedMsg('Network error');
    } finally {
      setSeedingPages(false);
    }
  };

  const getStatusBadge = page => {
    const statusClass = `pm-status-${page.status || 'live'}`;
    const label =
      { draft: 'Draft', pending: 'Pending', rejected: 'Rejected', live: 'Live', whitelisted: 'On Hold' }[page.status] ||
      'Live';
    const hasPulse = page.status === 'rejected' || page.status === 'pending';
    const isClickable = page.status === 'rejected' || page.rejection_notes || page.review_notes;
    return (
      <button
        className={`${statusClass}${hasPulse ? ' pm-status-pulse' : ''}`}
        onClick={() => isClickable && setStatusModalPage(page)}
        style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          border: '1px solid',
          cursor: isClickable ? 'pointer' : 'default',
          background: 'none',
        }}
        title={isClickable ? 'Click to see details' : undefined}
      >
        {label}
        {isClickable && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>▼</span>}
      </button>
    );
  };

  const getPageHealth = page => {
    const isLive = page.status === 'live';
    const isVisible = page.visible === true;
    const isAccessible = isLive || isVisible;

    if (isAccessible) {
      return (
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4ade80' }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#4ade80',
              display: 'inline-block',
            }}
          />
          OK
        </span>
      );
    }

    let reason = '';
    if (page.status === 'draft') reason = 'Draft';
    else if (page.status === 'pending') reason = 'Pending';
    else if (page.status === 'rejected') reason = 'Rejected';
    else if (!page.visible) reason = 'Hidden';

    return (
      <span
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#f87171' }}
        title={`Page is ${reason}. Toggle visibility to show on site.`}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#f87171',
            display: 'inline-block',
          }}
        />
        {reason}
      </span>
    );
  };

  const tabs = [
    {
      key: 'all',
      label: 'All',
      count: allPages.length,
      activeColor: '#2a6099',
      activeBg: 'rgba(42,96,153,0.18)',
    },
    {
      key: 'live',
      label: 'Live',
      count: livePages.length,
      activeColor: '#4ade80',
      activeBg: 'rgba(22,163,74,0.15)',
    },
    {
      key: 'draft',
      label: 'Draft',
      count: draftPages.length,
      activeColor: 'var(--theme-gold)',
      activeBg: 'rgba(201,168,76,0.15)',
    },
    {
      key: 'pending',
      label: 'Pending',
      count: pendingPages.length,
      activeColor: '#fb923c',
      activeBg: 'rgba(234,88,12,0.15)',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: rejectedPages.length,
      activeColor: '#f87171',
      activeBg: 'rgba(220,38,38,0.15)',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .pm-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .pm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .pm-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
        .pm-sub { font-size: 13px; color: var(--theme-text-muted); }

        .pm-new-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: rgba(27,58,107,0.7);
          border: 1px solid rgba(42,96,153,0.3);
          color: #a8cce8; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.16s;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }
        .pm-new-btn:hover { background: rgba(42,96,153,0.5); }

        .pm-panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 12px; overflow: hidden;
        }

        .pm-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--theme-border);
          flex-wrap: wrap; gap: 12px;
        }

        .pm-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .pm-tab {
          padding: 7px 14px; border-radius: 7px;
          font-size: 12.5px; font-weight: 500;
          border: 1px solid transparent; cursor: pointer;
          background: none; font-family: 'Inter', sans-serif;
          color: var(--theme-text-muted); transition: all 0.14s;
        }
        .pm-tab:hover { background: var(--theme-border); color: rgba(168,204,232,0.7); }

        .pm-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .pm-search {
          background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 8px 14px;
          color: var(--theme-text); font-size: 13px; outline: none;
          font-family: 'Inter', sans-serif; width: 180px;
          transition: border-color 0.18s;
        }
        .pm-search::placeholder { color: rgba(168,204,232,0.2); }
        .pm-search:focus { border-color: rgba(42,96,153,0.4); }
        .pm-select {
          background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 8px 14px;
          color: rgba(168,204,232,0.6); font-size: 13px; outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.18s; cursor: pointer;
        }
        .pm-select:focus { border-color: rgba(42,96,153,0.4); }

        .pm-table-wrap { overflow-x: auto; }
        table.pm-table { width: 100%; border-collapse: collapse; }
        .pm-table th {
          padding: 12px 14px;
          text-align: left;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(168,204,232,0.25);
          background: rgba(168,204,232,0.03);
          border-bottom: 1px solid rgba(168,204,232,0.05);
          font-family: 'Cinzel', serif;
          white-space: nowrap;
        }
        .pm-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(168,204,232,0.04);
          font-size: 13px;
          vertical-align: middle;
        }
        .pm-table tr:last-child td { border-bottom: none; }
        .pm-table tr:hover td { background: rgba(168,204,232,0.02); }

        .pm-page-link {
          font-weight: 500; color: #a8cce8;
          text-decoration: none; transition: color 0.15s;
        }
        .pm-page-link:hover { color: var(--theme-text); }

        .pm-branch-tag {
          display: inline-block;
          padding: 3px 8px; border-radius: 5px;
          font-size: 10.5px; font-weight: 500;
          background: var(--theme-border);
          border: 1px solid rgba(168,204,232,0.1);
          color: rgba(168,204,232,0.55);
        }
        .pm-path { font-size: 12px; color: rgba(168,204,232,0.3); font-family: monospace; }

        .pm-toggle {
          width: 40px; height: 22px; border-radius: 11px;
          border: none; cursor: pointer; position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .pm-toggle-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .pm-approved { font-size: 12px; color: #4ade80; display: flex; align-items: center; gap: 5px; }
        .pm-no-val { color: rgba(168,204,232,0.2); }
        .pm-author { font-size: 12.5px; color: rgba(168,204,232,0.45); }

        .pm-actions { display: flex; gap: 6px; align-items: center; }
        .pm-action-btn { font-size: 12px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; transition: all 0.14s; font-family: 'Inter', sans-serif; text-decoration: none; display: inline-flex; align-items: center; }
        .pm-action-edit { color: #22c55e !important; }
        .pm-action-edit:hover { background: rgba(34,197,94,0.15); color: #22c55e !important; }
        .pm-action-delete { color: #ef4444 !important; }
        .pm-action-delete:hover { background: rgba(239,68,68,0.15); color: #ef4444 !important; }
        .pm-action-approve { color: #a855f7 !important; }
        .pm-action-approve:hover { background: rgba(168,85,247,0.15); color: #a855f7 !important; }
        .pm-action-submit { color: #f59e0b !important; }
        .pm-action-submit:hover { background: rgba(245,158,11,0.15); color: #f59e0b !important; }
        .pm-action-view { color: var(--theme-gold) !important; }
        .pm-action-view:hover { background: rgba(201,168,76,0.15); color: var(--theme-gold) !important; }

        /* Status badges */
        .pm-status-live { background: rgba(34,197,94,0.15) !important; color: #22c55e !important; border-color: rgba(34,197,94,0.3) !important; }
        .pm-status-draft { background: rgba(201,168,76,0.15) !important; color: var(--theme-gold) !important; border-color: rgba(201,168,76,0.3) !important; }
        .pm-status-pending { background: rgba(234,88,12,0.15) !important; color: #f97316 !important; border-color: rgba(234,88,12,0.3) !important; }
        .pm-status-rejected { background: rgba(239,68,68,0.15) !important; color: #ef4444 !important; border-color: rgba(239,68,68,0.3) !important; }

        /* Toggle button with animation */
        .pm-toggle { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: all 0.3s ease; flex-shrink: 0; background: rgba(168,204,232,0.15); }
        .pm-toggle.on { background: #22c55e; box-shadow: 0 0 12px rgba(34,197,94,0.4); }
        .pm-toggle-thumb { position: absolute; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.3s cubic-bezier(0.68,-0.55,0.265,1.55); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .pm-toggle.on .pm-toggle-thumb { transform: translateX(20px); }

        /* Author colors */
        .pm-author-system { color: #a855f7 !important; font-weight: 500; }
        .pm-author-user { color: #22c55e !important; font-weight: 500; }

        .pm-approved { font-size: 12px; color: #22c55e; display: flex; align-items: center; gap: 5px; }
        .pm-no-val { color: var(--theme-text-muted); }
        .pm-author { font-size: 12.5px; }

        @keyframes pm-pulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          50% { box-shadow: 0 0 0 4px transparent; opacity: 0.8; }
        }
        .pm-status-pulse { animation: pm-pulse 2s ease-in-out infinite; }

        .pm-action-wysiwyg { color: #60a5fa !important; }
        .pm-action-wysiwyg:hover { background: rgba(59,130,246,0.15); color: #60a5fa !important; }
        .pm-action-copy { color: #a78bfa !important; }
        .pm-action-copy:hover { background: rgba(167,139,250,0.15); color: #a78bfa !important; }

        .pm-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 24px; backdrop-filter: blur(4px);
        }
        .pm-modal {
          background: var(--theme-bg, #12192a);
          border: 1px solid var(--theme-border, rgba(168,204,232,0.1));
          border-radius: 14px; width: 100%; max-width: 480px;
          padding: 28px; max-height: 85vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .pm-modal-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: var(--theme-text); margin-bottom: 20px; }
        .pm-modal-field { margin-bottom: 14px; }
        .pm-modal-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 5px; }
        .pm-modal-value { font-size: 13.5px; color: var(--theme-text); background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1); border-radius: 8px; padding: 10px 14px; }
        .pm-modal-close {
          margin-top: 20px; padding: 9px 18px; border-radius: 8px;
          background: rgba(168,204,232,0.1); border: 1px solid rgba(168,204,232,0.15);
          color: var(--theme-text); font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .pm-modal-close:hover { background: rgba(168,204,232,0.18); }

        .pm-copy-search {
          width: 100%; margin-bottom: 14px;
          background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 10px 14px; font-size: 13px;
          color: var(--theme-text); outline: none; font-family: 'Inter', sans-serif;
        }
        .pm-copy-search::placeholder { color: rgba(168,204,232,0.25); }
        .pm-copy-list { max-height: 280px; overflow-y: auto; }
        .pm-copy-item {
          padding: 12px 14px; border-radius: 8px; cursor: pointer;
          border: 1px solid transparent; margin-bottom: 6px;
          transition: all 0.14s;
        }
        .pm-copy-item:hover { background: rgba(168,204,232,0.07); border-color: rgba(168,204,232,0.12); }
        .pm-copy-item-title { font-size: 13.5px; font-weight: 500; color: var(--theme-text); }
        .pm-copy-item-meta { font-size: 11.5px; color: var(--theme-text-muted); margin-top: 3px; }
        .pm-empty { padding: 40px 24px; text-align: center; color: var(--theme-text-muted); font-size: 13.5px; }
      `}</style>

      <div className="pm-root">
        <div className="pm-header">
          <div>
            <div className="pm-title">Pages Management</div>
            <div className="pm-sub">Manage guilds, committees, and site pages</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {isSuperAdmin() && (
              <>
                <button
                  onClick={handleSeedPages}
                  disabled={seedingPages}
                  className="pm-new-btn"
                  style={{ background: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.3)', color: '#c084fc' }}
                  title="Insert all hardcoded site pages into the database so admins can manage them"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5z"/><path d="M6 21v-2a5 5 0 0110 0v2"/>
                  </svg>
                  {seedingPages ? 'Seeding…' : 'Seed System Pages'}
                </button>
                <button
                  onClick={handlePublishSystemPages}
                  disabled={publishing}
                  className="pm-new-btn"
                  style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80' }}
                  title="Make all seeded system pages live and visible"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7"/>
                  </svg>
                  {publishing ? 'Publishing…' : 'Publish System Pages'}
                </button>
                {(seedMsg || publishMsg) && (
                  <span style={{ fontSize: 12, color: (seedMsg || publishMsg).startsWith('✓') ? '#4ade80' : '#f87171' }}>
                    {seedMsg || publishMsg}
                  </span>
                )}
              </>
            )}
            {!isSuperAdmin() && (
              <button
                onClick={() => setShowCopyDialog(true)}
                className="pm-new-btn"
                style={{ background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Existing
              </button>
            )}
            {!isSuperAdmin() && (
              <Link to="/admin/pages/new" className="pm-new-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Page
              </Link>
            )}
          </div>
        </div>

        <div className="pm-panel">
          <div className="pm-toolbar">
            <div className="pm-tabs">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="pm-tab"
                  style={
                    activeTab === t.key
                      ? {
                          background: t.activeBg,
                          color: t.activeColor,
                          borderColor: `${t.activeColor}33`,
                        }
                      : {}
                  }
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <div className="pm-controls">
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pm-search"
              />
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="pm-select"
              >
                <option value="">All Branches</option>
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Branch</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>Visible</th>
                  <th>Health</th>
                  <th>Author</th>
                  <th>Approved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id}>
                    <td>
                      <Link to={`/admin/pages/edit/${page.id}`} className="pm-page-link">
                        {page.title}
                      </Link>
                    </td>
                    <td>
                      {page.branch ? (
                        <span className="pm-branch-tag">
                          {BRANCHES.find(b => b.id === page.branch)?.name || page.branch}
                        </span>
                      ) : (
                        <span className="pm-no-val">—</span>
                      )}
                    </td>
                    <td>
                      <span className="pm-path">{getCorrectPagePath(page.path)}</span>
                    </td>
                    <td>{getStatusBadge(page)}</td>
                    <td>
                      {isSuperAdmin() ? (
                        <button
                          onClick={() => handleToggleVisibility(page.id)}
                          disabled={isToggling === page.id}
                          className={`pm-toggle ${page.visible ? 'on' : ''}`}
                          title={page.visible ? 'Click to hide page' : 'Click to show page'}
                        >
                          <div className="pm-toggle-thumb" />
                        </button>
                      ) : (
                        <span className="pm-no-val">—</span>
                      )}
                    </td>
                    <td>{getPageHealth(page)}</td>
                    <td>
                      <span
                        className={`pm-author ${(page.author_name || page.authorName || '').toLowerCase() === 'system' ? 'pm-author-system' : 'pm-author-user'}`}
                      >
                        {page.author_name || page.authorName || '—'}
                      </span>
                    </td>
                    <td>
                      {page.approved_by || page.approvedBy ? (
                        <span className="pm-approved">
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
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                          {page.approved_by || page.approvedBy}
                        </span>
                      ) : (
                        <span className="pm-no-val">—</span>
                      )}
                    </td>
                    <td>
                      <div className="pm-actions">
                        <Link
                          to={`/admin/pages/edit/${page.id}`}
                          className="pm-action-btn pm-action-edit"
                        >
                          Edit
                        </Link>
                        {!isSuperAdmin() && (
                          <Link
                            to={`/admin/pages/wysiwyg/${page.id}`}
                            className="pm-action-btn pm-action-wysiwyg"
                          >
                            Visual
                          </Link>
                        )}
                        {page.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForApproval(page.id)}
                            className="pm-action-btn pm-action-submit"
                          >
                            Submit
                          </button>
                        )}
                        {isSuperAdmin() && (
                          <button
                            onClick={() => handleDelete(page.id)}
                            className="pm-action-btn pm-action-delete"
                          >
                            Delete
                          </button>
                        )}
                        <a
                          href={getCorrectPath(page.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pm-action-btn pm-action-view"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length === 0 && <div className="pm-empty">No pages found.</div>}
          </div>
        </div>
      </div>

      {/* Status Detail Modal */}
      {statusModalPage && (
        <div className="pm-modal-overlay" onClick={() => setStatusModalPage(null)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-title">{statusModalPage.title} — Status Details</div>
            <div className="pm-modal-field">
              <div className="pm-modal-label">Current Status</div>
              <div className="pm-modal-value">{statusModalPage.status}</div>
            </div>
            {statusModalPage.rejection_notes && (
              <div className="pm-modal-field">
                <div className="pm-modal-label">Rejection Notes</div>
                <div className="pm-modal-value" style={{ color: '#f87171' }}>{statusModalPage.rejection_notes}</div>
              </div>
            )}
            {statusModalPage.review_notes && (
              <div className="pm-modal-field">
                <div className="pm-modal-label">Reviewer Notes</div>
                <div className="pm-modal-value">{statusModalPage.review_notes}</div>
              </div>
            )}
            {statusModalPage.reviewed_by && (
              <div className="pm-modal-field">
                <div className="pm-modal-label">Reviewed By</div>
                <div className="pm-modal-value">{statusModalPage.reviewed_by}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="pm-modal-close" onClick={() => setStatusModalPage(null)}>Close</button>
              {statusModalPage.status === 'rejected' && !isSuperAdmin() && (
                <Link
                  to={`/admin/pages/edit/${statusModalPage.id}`}
                  className="pm-modal-close"
                  style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.25)', color: '#22c55e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => setStatusModalPage(null)}
                >
                  Edit & Resubmit
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Existing Page Dialog */}
      {showCopyDialog && (
        <div className="pm-modal-overlay" onClick={() => setShowCopyDialog(false)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-title">Copy Existing Page</div>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 16 }}>
              Select a page to use as a template. Its layout and content will be copied into a new draft.
            </p>
            <input
              className="pm-copy-search"
              type="text"
              placeholder="Search pages..."
              value={copySearch}
              onChange={e => setCopySearch(e.target.value)}
              autoFocus
            />
            <div className="pm-copy-list">
              {allPages
                .filter(p => p.title.toLowerCase().includes(copySearch.toLowerCase()))
                .map(p => (
                  <div
                    key={p.id}
                    className="pm-copy-item"
                    onClick={() => {
                      setShowCopyDialog(false);
                      navigate(`/admin/pages/wysiwyg/new?copyFrom=${p.id}`);
                    }}
                  >
                    <div className="pm-copy-item-title">{p.title}</div>
                    <div className="pm-copy-item-meta">{p.status} · {p.branch ? BRANCHES.find(b => b.id === p.branch)?.name || p.branch : 'No branch'}</div>
                  </div>
                ))}
              {allPages.filter(p => p.title.toLowerCase().includes(copySearch.toLowerCase())).length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: 13 }}>No pages found</div>
              )}
            </div>
            <button className="pm-modal-close" style={{ marginTop: 16 }} onClick={() => setShowCopyDialog(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PagesManager;
