import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getCorrectPath, getCorrectPagePath } from '../../utils/pathMapper';
import { BRANCHES } from '../../constants/CMSConstants';

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
      pages = pages.filter(p => p.branch === branchFilter || p.branch === parseInt(branchFilter));
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

  const getStatusBadge = page => {
    const statusClass = `pm-status-${page.status || 'live'}`;
    const label =
      { draft: 'Draft', pending: 'Pending', rejected: 'Rejected', live: 'Live' }[page.status] ||
      'Live';
    return (
      <span
        className={statusClass}
        style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          border: '1px solid',
        }}
      >
        {label}
      </span>
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
      `}</style>

      <div className="pm-root">
        <div className="pm-header">
          <div>
            <div className="pm-title">Pages Management</div>
            <div className="pm-sub">Manage guilds, committees, and site pages</div>
          </div>
          {!isSuperAdmin() && (
            <Link to="/admin/pages/new" className="pm-new-btn">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Page
            </Link>
          )}
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
    </>
  );
};

export default PagesManager;
