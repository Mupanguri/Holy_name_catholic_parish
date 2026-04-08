import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { POST_CATEGORIES } from '../../constants/CMSConstants';

const PostsManager = () => {
  const { theme, colors } = useOutletContext() || {};
  const {
    getAllPosts,
    getLivePosts,
    getDraftPosts,
    togglePostVisibility,
    submitPostForApproval,
    deletePost,
    isSuperAdmin,
    currentUser,
    refreshPostsWithSubmissionStatus,
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isToggling, setIsToggling] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        await refreshPostsWithSubmissionStatus();
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, []);

  const allPosts = getAllPosts();
  const livePosts = getLivePosts();
  const draftPosts = getDraftPosts();
  const pendingPosts = (allPosts || []).filter(
    p => p.status === 'pending' || p.submission_status === 'pending'
  );
  const rejectedPosts = (allPosts || []).filter(p => p.submission_status === 'rejected');
  const bulletinPosts = (allPosts || []).filter(p => p.is_bulletin || p.isBulletin);

  const getFilteredPosts = () => {
    let posts =
      activeTab === 'live'
        ? livePosts
        : activeTab === 'draft'
          ? draftPosts
          : activeTab === 'pending'
            ? pendingPosts
            : activeTab === 'rejected'
              ? rejectedPosts
              : activeTab === 'bulletins'
                ? bulletinPosts
                : allPosts;

    if (searchTerm) {
      posts = posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter) {
      posts = posts.filter(p => p.category === categoryFilter);
    }
    return posts;
  };

  const posts = getFilteredPosts();

  const handleToggleVisibility = async postId => {
    if (isToggling) return;
    setIsToggling(postId);
    try {
      await togglePostVisibility(postId);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility. Please try again.');
    } finally {
      setIsToggling(null);
    }
  };

  const handleSubmitForApproval = async postId => {
    await submitPostForApproval(postId);
    alert('Post submitted for approval!');
  };

  const handleDelete = async postId => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
    }
  };

  const getStatusBadge = post => {
    let key = 'live';
    if (post.submission_status === 'rejected') key = 'rejected';
    else if (post.submission_status === 'pending' || post.status === 'pending') key = 'pending';
    else if (post.status === 'draft') key = 'draft';
    const label = { rejected: 'Rejected', pending: 'Pending Review', draft: 'Draft', live: 'Live' }[
      key
    ];
    return (
      <span
        className={`pom-status-${key}`}
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

  const getCategoryTag = category => {
    const colorMap = {
      'Parish Notice': {
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.2)',
        color: 'rgba(147,197,253,0.9)',
      },
      'Event Report': {
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.2)',
        color: 'rgba(196,181,253,0.9)',
      },
      'Youth Committee': {
        bg: 'rgba(22,163,74,0.1)',
        border: 'rgba(22,163,74,0.2)',
        color: 'rgba(74,222,128,0.9)',
      },
      'Adult Committee': {
        bg: 'rgba(220,38,38,0.1)',
        border: 'rgba(220,38,38,0.2)',
        color: 'rgba(248,113,113,0.9)',
      },
      Bulletin: {
        bg: 'rgba(201,168,76,0.1)',
        border: 'rgba(201,168,76,0.2)',
        color: 'rgba(251,191,36,0.9)',
      },
    };
    const c = colorMap[category] || {
      bg: 'var(--theme-border)',
      border: 'rgba(168,204,232,0.12)',
      color: 'var(--theme-text-muted)',
    };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 500,
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.color,
        }}
      >
        {category}
      </span>
    );
  };

  const tabs = [
    {
      key: 'all',
      label: 'All',
      count: allPosts.length,
      activeColor: '#a8cce8',
      activeBg: 'rgba(42,96,153,0.18)',
    },
    {
      key: 'live',
      label: 'Live',
      count: livePosts.length,
      activeColor: '#4ade80',
      activeBg: 'rgba(22,163,74,0.15)',
    },
    {
      key: 'draft',
      label: 'Draft',
      count: draftPosts.length,
      activeColor: 'var(--theme-gold)',
      activeBg: 'rgba(201,168,76,0.15)',
    },
    {
      key: 'pending',
      label: 'Pending',
      count: pendingPosts.length,
      activeColor: '#fb923c',
      activeBg: 'rgba(234,88,12,0.15)',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: rejectedPosts.length,
      activeColor: '#f87171',
      activeBg: 'rgba(220,38,38,0.15)',
    },
    {
      key: 'bulletins',
      label: 'Bulletins',
      count: bulletinPosts.length,
      activeColor: 'var(--theme-gold)',
      activeBg: 'rgba(201,168,76,0.15)',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .pom-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .pom-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .pom-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
        .pom-sub { font-size: 13px; color: var(--theme-text-muted); }

        .pom-new-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3);
          color: #a8cce8; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.16s; font-family: 'Inter', sans-serif;
        }
        .pom-new-btn:hover { background: rgba(42,96,153,0.5); }

        .pom-panel { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; overflow: hidden; }

        .pom-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; border-bottom: 1px solid var(--theme-border);
          flex-wrap: wrap; gap: 12px;
        }
        .pom-tabs { display: flex; gap: 5px; flex-wrap: wrap; }
        .pom-tab {
          padding: 6px 13px; border-radius: 7px; font-size: 12.5px; font-weight: 500;
          border: 1px solid transparent; cursor: pointer; background: none;
          font-family: 'Inter', sans-serif; color: var(--theme-text-muted); transition: all 0.14s;
        }
        .pom-tab:hover { background: var(--theme-border); color: rgba(168,204,232,0.7); }

        .pom-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .pom-select, .pom-search {
          background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 8px 14px; color: rgba(168,204,232,0.6);
          font-size: 13px; outline: none; font-family: 'Inter', sans-serif;
          transition: border-color 0.18s;
        }
        .pom-search { color: var(--theme-text); width: 180px; }
        .pom-search::placeholder { color: rgba(168,204,232,0.2); }
        .pom-select:focus, .pom-search:focus { border-color: rgba(42,96,153,0.4); }

        .pom-table-wrap { overflow-x: auto; }
        table.pom-table { width: 100%; border-collapse: collapse; }
        .pom-table th {
          padding: 12px 14px; text-align: left; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(168,204,232,0.25); background: rgba(168,204,232,0.03);
          border-bottom: 1px solid rgba(168,204,232,0.05); font-family: 'Cinzel', serif; white-space: nowrap;
        }
        .pom-table td { padding: 12px 14px; border-bottom: 1px solid rgba(168,204,232,0.04); font-size: 13px; vertical-align: middle; }
        .pom-table tr:last-child td { border-bottom: none; }
        .pom-table tr:hover td { background: rgba(168,204,232,0.02); }

        .pom-post-link { font-weight: 500; color: #a8cce8; text-decoration: none; transition: color 0.15s; }
        .pom-post-link:hover { color: var(--theme-text); }
        .pom-excerpt { font-size: 11.5px; color: rgba(168,204,232,0.25); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }

        .pom-bulletin-tag {
          display: inline-block; margin-left: 6px;
          padding: 2px 7px; border-radius: 5px; font-size: 10.5px;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); color: rgba(201,168,76,0.8);
        }

        .pom-toggle {
          width: 40px; height: 22px; border-radius: 11px; border: none;
          cursor: pointer; position: relative; transition: background 0.2s;
        }
        .pom-toggle-thumb {
          position: absolute; top: 3px; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .pom-not-live { font-size: 12px; color: rgba(168,204,232,0.2); }
        .pom-author { font-size: 12.5px; color: rgba(168,204,232,0.45); }
        .pom-date { font-size: 12.5px; color: rgba(168,204,232,0.3); white-space: nowrap; }

        .pom-actions { display: flex; gap: 6px; align-items: center; }
        .pom-action-btn { font-size: 12px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; transition: all 0.14s; font-family: 'Inter', sans-serif; text-decoration: none; }
        .pom-action-edit { color: #22c55e !important; }
        .pom-action-edit:hover { background: rgba(34,197,94,0.15); color: #22c55e !important; }
        .pom-action-del { color: #ef4444 !important; }
        .pom-action-del:hover { background: rgba(239,68,68,0.15); color: #ef4444 !important; }
        .pom-action-submit { color: #f59e0b !important; }
        .pom-action-submit:hover { background: rgba(245,158,11,0.15); color: #f59e0b !important; }
        .pom-action-view { color: var(--theme-gold) !important; }
        .pom-action-view:hover { background: rgba(201,168,76,0.15); color: var(--theme-gold) !important; }

        /* Status badges */
        .pom-status-live { background: rgba(34,197,94,0.15) !important; color: #22c55e !important; border-color: rgba(34,197,94,0.3) !important; }
        .pom-status-draft { background: rgba(201,168,76,0.15) !important; color: var(--theme-gold) !important; border-color: rgba(201,168,76,0.3) !important; }
        .pom-status-pending { background: rgba(234,88,12,0.15) !important; color: #f97316 !important; border-color: rgba(234,88,12,0.3) !important; }
        .pom-status-rejected { background: rgba(239,68,68,0.15) !important; color: #ef4444 !important; border-color: rgba(239,68,68,0.3) !important; }

        /* Toggle */
        .pom-toggle { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: all 0.3s ease; flex-shrink: 0; background: rgba(168,204,232,0.15); }
        .pom-toggle.on { background: #22c55e; box-shadow: 0 0 12px rgba(34,197,94,0.4); }
        .pom-toggle-thumb { position: absolute; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.3s cubic-bezier(0.68,-0.55,0.265,1.55); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .pom-toggle.on .pom-toggle-thumb { transform: translateX(20px); }

        /* Author */
        .pom-author-system { color: #a855f7 !important; font-weight: 500; }
        .pom-author-user { color: #22c55e !important; font-weight: 500; }

        .pom-not-live { font-size: 12px; color: var(--theme-text-muted); }
        .pom-author { font-size: 12.5px; }
        .pom-date { font-size: 12.5px; color: var(--theme-text-muted); white-space: nowrap; }

        .pom-empty { padding: 48px 24px; text-align: center; color: var(--theme-text-muted); font-size: 13.5px; }
      `}</style>

      <div className="pom-root">
        <div className="pom-header">
          <div>
            <div className="pom-title">Posts Management</div>
            <div className="pom-sub">Manage articles, notices, and event reports</div>
          </div>
          {!isSuperAdmin() && (
            <Link to="/admin/posts/new" className="pom-new-btn">
              <svg
                width="13"
                height="13"
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
              New Post
            </Link>
          )}
        </div>

        <div className="pom-panel">
          <div className="pom-toolbar">
            <div className="pom-tabs">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="pom-tab"
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
            <div className="pom-controls">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="pom-select"
              >
                <option value="">All Categories</option>
                {Object.values(POST_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pom-search"
              />
            </div>
          </div>

          <div className="pom-table-wrap">
            <table className="pom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Visible</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/admin/posts/edit/${post.id}`} className="pom-post-link">
                        {post.title}
                      </Link>
                      {post.excerpt && <div className="pom-excerpt">{post.excerpt}</div>}
                    </td>
                    <td>
                      {getCategoryTag(post.category)}
                      {(post.is_bulletin || post.isBulletin) && (
                        <span className="pom-bulletin-tag">Bulletin</span>
                      )}
                    </td>
                    <td>{getStatusBadge(post)}</td>
                    <td>
                      {post.status === 'live' ? (
                        isSuperAdmin() ? (
                          <button
                            onClick={() => handleToggleVisibility(post.id)}
                            disabled={isToggling === post.id}
                            className={`pom-toggle ${post.visible ? 'on' : ''}`}
                            title={post.visible ? 'Click to hide' : 'Click to show'}
                          >
                            <div className="pom-toggle-thumb" />
                          </button>
                        ) : (
                          <span className="pom-not-live">—</span>
                        )
                      ) : (
                        <span className="pom-not-live">Not live</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`pom-author ${(post.authorName || '').toLowerCase() === 'system' ? 'pom-author-system' : 'pom-author-user'}`}
                      >
                        {post.authorName}
                      </span>
                    </td>
                    <td>
                      <span className="pom-date">{post.date}</span>
                    </td>
                    <td>
                      <div className="pom-actions">
                        {!isSuperAdmin() ? (
                          <>
                            <Link
                              to={`/admin/posts/edit/${post.id}`}
                              className="pom-action-btn pom-action-edit"
                            >
                              Edit
                            </Link>
                            {post.status === 'draft' && (
                              <button
                                onClick={() => handleSubmitForApproval(post.id)}
                                className="pom-action-btn pom-action-submit"
                              >
                                Submit
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/admin/posts/edit/${post.id}`}
                              className="pom-action-btn pom-action-edit"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="pom-action-btn pom-action-del"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <a
                          href={`/HolyName/posts/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pom-action-btn pom-action-view"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 && <div className="pom-empty">No posts found.</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsManager;
