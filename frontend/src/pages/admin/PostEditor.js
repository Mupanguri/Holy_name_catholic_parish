import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getFullUrl } from '../../services/api';
import { POST_CATEGORIES } from '../../constants/CMSConstants';

const PostEditor = () => {
  const { theme, colors } = useOutletContext() || {};
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getPostById,
    createPost,
    updatePost,
    submitPostForApproval,
    media,
    currentUser,
    getPostRejectionNotes,
    refreshPostsWithSubmissionStatus,
  } = useAuth();
  const isNew = !id;

  useEffect(() => {
    if (!isNew) {
      refreshPostsWithSubmissionStatus();
    }
  }, [id, isNew, refreshPostsWithSubmissionStatus]);

  const rejectionInfo = !isNew ? getPostRejectionNotes(id) : null;

  useEffect(() => {
    if (currentUser && currentUser.role === ROLES.SUPER_ADMIN) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const imageFiles = (media || []).filter(
    m => m.url && (m.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || m.url.includes('/uploads/'))
  );
  const documentFiles = (media || []).filter(
    m => m.url && (m.url.match(/\.(pdf|doc|docx)$/i) || m.url.includes('/uploads/'))
  );

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Parish Notice',
    images: [],
    isBulletin: false,
    pdfUrl: '',
    eventDate: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const post = getPostById(id);
      if (post) {
        setFormData({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || 'Parish Notice',
          images: post.images || [],
          isBulletin: post.is_bulletin || post.isBulletin || false,
          pdfUrl: post.pdf_url || post.pdfUrl || '',
          eventDate: post.event_date || post.eventDate || '',
        });
      }
    }
  }, [id, isNew, getPostById]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageToggle = imageUrl => {
    setFormData(prev => {
      const images = prev.images.includes(imageUrl)
        ? prev.images.filter(img => img !== imageUrl)
        : [...prev.images, imageUrl];
      return { ...prev, images };
    });
  };

  const handleSave = async (submitToApproval = false) => {
    if (!formData.title || !formData.title.trim()) {
      alert('Please enter a title for your post.');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      alert('Please enter content for your post.');
      return;
    }

    setSaving(true);

    const finalData = {
      title: formData.title,
      excerpt: formData.excerpt || formData.content.substring(0, 100) + '...',
      content: formData.content,
      category: formData.category,
      images: formData.images,
      visible: false,
      status: 'draft',
      is_bulletin: formData.isBulletin,
      is_pinned: false,
      pdf_url: formData.pdfUrl || null,
      event_date: formData.eventDate || null,
    };

    try {
      if (isNew) {
        const newPost = await createPost(finalData);
        if (!newPost || !newPost.id) {
          alert('Failed to create post. Please try again.');
          setSaving(false);
          return;
        }
        if (submitToApproval) {
          await submitPostForApproval(newPost.id);
        }
      } else {
        await updatePost(id, finalData);
        if (submitToApproval) {
          await submitPostForApproval(id);
        }
      }
      setSaving(false);
      navigate('/admin/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      let message = 'Error saving post. Please try again.';
      if (error.message.includes('title')) message = 'Please enter a title for your post.';
      else if (error.message.includes('content')) message = 'Please enter content for your post.';
      else if (error.message.includes('Validation')) message = 'Please check your form inputs and try again.';
      else if (error.message) message = error.message;
      alert(message);
      setSaving(false);
    }
  };

  const post = !isNew ? getPostById(id) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .poe-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .poe-back { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--theme-text-muted); text-decoration: none; margin-bottom: 14px; transition: color 0.15s; }
        .poe-back:hover { color: rgba(168,204,232,0.8); }

        .poe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; gap: 16px; flex-wrap: wrap; }
        .poe-title { font-family: 'Cinzel', serif; font-size: 19px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; }

        .poe-header-btns { display: flex; gap: 10px; }
        .poe-btn {
          padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .poe-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .poe-btn-secondary { background: var(--theme-border); border: 1px solid rgba(168,204,232,0.12); color: rgba(168,204,232,0.6); }
        .poe-btn-secondary:hover:not(:disabled) { background: rgba(168,204,232,0.12); color: rgba(168,204,232,0.9); }
        .poe-btn-primary { background: rgba(27,58,107,0.75); border: 1px solid rgba(42,96,153,0.35); color: #a8cce8; }
        .poe-btn-primary:hover:not(:disabled) { background: rgba(42,96,153,0.55); }

        /* Rejection notice */
        .poe-rejection {
          display: flex; gap: 14px;
          padding: 18px 20px;
          background: rgba(220,38,38,0.07);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 12px; margin-bottom: 20px;
        }
        .poe-rejection-icon { flex-shrink: 0; color: #f87171; margin-top: 1px; }
        .poe-rejection-title { font-size: 13.5px; font-weight: 600; color: #fca5a5; margin-bottom: 8px; }
        .poe-rejection-reason {
          font-size: 12.5px; font-weight: 600; color: rgba(248,113,113,0.7); margin-bottom: 6px;
        }
        .poe-rejection-notes {
          font-size: 13px; color: rgba(248,113,113,0.8);
          padding: 10px 14px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.12);
          border-radius: 8px; white-space: pre-wrap; margin-bottom: 8px;
        }
        .poe-rejection-date { font-size: 11.5px; color: rgba(248,113,113,0.5); }
        .poe-rejection-hint { font-size: 12px; color: rgba(248,113,113,0.45); margin-top: 8px; }

        /* Post status bar */
        .poe-status-bar {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 8px; margin-bottom: 20px;
        }
        @media (max-width: 600px) { .poe-status-bar { grid-template-columns: repeat(2, 1fr); } }
        .poe-status-item {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 10px; padding: 12px 14px;
        }
        .poe-status-key { font-size: 10.5px; color: rgba(168,204,232,0.3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
        .poe-status-val { font-size: 14px; font-weight: 600; color: var(--theme-text); }

        /* Layout */
        .poe-grid { display: grid; grid-template-columns: 1fr 260px; gap: 20px; }
        @media (max-width: 900px) { .poe-grid { grid-template-columns: 1fr; } }

        .poe-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 12px; padding: 20px;
          margin-bottom: 14px;
        }

        .poe-field { margin-bottom: 16px; }
        .poe-label {
          display: block; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--theme-text-muted); margin-bottom: 7px;
        }
        .poe-input {
          width: 100%; background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1); border-radius: 8px;
          padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
          font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .poe-input::placeholder { color: rgba(168,204,232,0.2); }
        .poe-input:focus { border-color: rgba(42,96,153,0.5); box-shadow: 0 0 0 3px rgba(42,96,153,0.1); }

        /* Bulletin toggle */
        .poe-bulletin-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 18px;
          background: rgba(42,96,153,0.06);
          border: 1px solid rgba(42,96,153,0.15);
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .poe-bulletin-label { font-size: 13.5px; font-weight: 600; color: var(--theme-text); margin-bottom: 3px; }
        .poe-bulletin-sub { font-size: 12px; color: var(--theme-text-muted); }
        .poe-toggle {
          width: 40px; height: 22px; border-radius: 11px;
          border: none; cursor: pointer; position: relative;
          transition: background 0.2s;
        }
        .poe-toggle-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Bulletin extra fields */
        .poe-bulletin-fields {
          background: rgba(168,204,232,0.03);
          border: 1px solid var(--theme-border);
          border-radius: 10px; padding: 16px; margin-bottom: 14px;
        }
        .poe-bulletin-fields-title { font-size: 13px; font-weight: 600; color: var(--theme-text); margin-bottom: 14px; }

        .poe-doc-selected {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: rgba(22,163,74,0.06);
          border: 1px solid rgba(22,163,74,0.15);
          border-radius: 8px; margin-bottom: 10px;
        }
        .poe-doc-name { font-size: 12.5px; color: rgba(74,222,128,0.8); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .poe-doc-remove { font-size: 12px; color: #f87171; background: none; border: none; cursor: pointer; padding: 0; font-family: 'Inter', sans-serif; }
        .poe-doc-remove:hover { text-decoration: underline; }

        .poe-doc-list { border: 1px solid var(--theme-border); border-radius: 8px; overflow: hidden; max-height: 180px; overflow-y: auto; }
        .poe-doc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; cursor: pointer;
          border-bottom: 1px solid rgba(168,204,232,0.05);
          transition: background 0.14s;
        }
        .poe-doc-item:last-child { border-bottom: none; }
        .poe-doc-item:hover { background: rgba(168,204,232,0.04); }
        .poe-doc-item.selected { background: rgba(42,96,153,0.1); }
        .poe-doc-label { font-size: 12.5px; color: rgba(168,204,232,0.6); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .poe-doc-check { font-size: 11px; color: #4ade80; }
        .poe-doc-empty { font-size: 12.5px; color: rgba(168,204,232,0.25); padding: 14px; background: rgba(168,204,232,0.03); border-radius: 8px; }

        /* Sidebar */
        .poe-sidebar-title { font-size: 12px; font-weight: 600; color: var(--theme-text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; font-family: 'Cinzel', serif; }
        .poe-sidebar-sub { font-size: 12px; color: rgba(168,204,232,0.3); margin-bottom: 12px; }
        .poe-img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; max-height: 220px; overflow-y: auto; }
        .poe-img-item {
          border-radius: 6px; overflow: hidden;
          border: 2px solid transparent; cursor: pointer;
          transition: border-color 0.15s;
        }
        .poe-img-item.selected { border-color: #2a6099; }
        .poe-img-item:hover:not(.selected) { border-color: rgba(168,204,232,0.2); }
        .poe-img-item img { width: 100%; height: 54px; object-fit: cover; display: block; }
        .poe-img-count { font-size: 12px; color: var(--theme-text-muted); margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--theme-border); }

        .poe-info-row {
          display: flex; justify-content: space-between; padding: 8px 0;
          border-bottom: 1px solid rgba(168,204,232,0.05); font-size: 12.5px;
        }
        .poe-info-row:last-child { border-bottom: none; }
        .poe-info-key { color: rgba(168,204,232,0.3); }
        .poe-info-val { color: rgba(168,204,232,0.7); font-weight: 500; }
      `}</style>

      <div className="poe-root">
        <Link to="/admin/posts" className="poe-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back to Posts
        </Link>

        <div className="poe-header">
          <div className="poe-title">
            {isNew ? 'Create New Post' : `Edit: ${post?.title}`}
          </div>
          <div className="poe-header-btns">
            <button onClick={() => handleSave(false)} disabled={saving} className="poe-btn poe-btn-secondary">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="poe-btn poe-btn-primary">
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>

        {/* Rejection notice */}
        {rejectionInfo && rejectionInfo.notes && (
          <div className="poe-rejection">
            <div className="poe-rejection-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="poe-rejection-title">This post was rejected</div>
              <div className="poe-rejection-reason">Reason for rejection:</div>
              <div className="poe-rejection-notes">{rejectionInfo.notes}</div>
              {rejectionInfo.rejectedAt && (
                <div className="poe-rejection-date">
                  Rejected on {new Date(rejectionInfo.rejectedAt).toLocaleString()}
                  {rejectionInfo.rejectedBy && ` by ${rejectionInfo.rejectedBy}`}
                </div>
              )}
              <div className="poe-rejection-hint">Please edit your post to address the feedback above and resubmit.</div>
            </div>
          </div>
        )}

        {/* Post status bar */}
        {!isNew && post && (
          <div className="poe-status-bar">
            <div className="poe-status-item">
              <div className="poe-status-key">Status</div>
              <div className="poe-status-val" style={{ textTransform: 'capitalize' }}>{post.status}</div>
            </div>
            <div className="poe-status-item">
              <div className="poe-status-key">Visible</div>
              <div className="poe-status-val" style={{ color: post.visible ? '#4ade80' : 'var(--theme-text-muted)' }}>{post.visible ? 'Yes' : 'No'}</div>
            </div>
            <div className="poe-status-item">
              <div className="poe-status-key">Approved By</div>
              <div className="poe-status-val">{post.approvedBy || '—'}</div>
            </div>
            <div className="poe-status-item">
              <div className="poe-status-key">Published</div>
              <div className="poe-status-val">{post.date}</div>
            </div>
          </div>
        )}

        <div className="poe-grid">
          {/* Main */}
          <div>
            <div className="poe-card">
              <div className="poe-field">
                <label className="poe-label">Title <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="poe-input"
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div className="poe-field">
                <label className="poe-label">Excerpt</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={2}
                  className="poe-input"
                  placeholder="Short summary of the post..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="poe-field" style={{ marginBottom: 0 }}>
                <label className="poe-label">Category <span style={{ color: '#f87171' }}>*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} className="poe-input">
                  {Object.values(POST_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulletin toggle */}
            <div className="poe-bulletin-row">
              <div>
                <div className="poe-bulletin-label">Bulletin Post</div>
                <div className="poe-bulletin-sub">Mark as a bulletin for the bulletin board</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isBulletin: !prev.isBulletin }))}
                className="poe-toggle"
                style={{ background: formData.isBulletin ? 'var(--theme-accent)' : 'rgba(168,204,232,0.12)' }}
              >
                <div className="poe-toggle-thumb" style={{ transform: formData.isBulletin ? 'translateX(18px)' : 'translateX(3px)' }} />
              </button>
            </div>

            {/* Bulletin fields */}
            {formData.isBulletin && (
              <div className="poe-bulletin-fields">
                <div className="poe-bulletin-fields-title">Bulletin Details</div>
                <div className="poe-field">
                  <label className="poe-label">Attach Document</label>
                  {formData.pdfUrl ? (
                    <div className="poe-doc-selected">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                      <span className="poe-doc-name">{formData.pdfUrl.split('/').pop()}</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, pdfUrl: '' }))} className="poe-doc-remove">Remove</button>
                    </div>
                  ) : null}
                  {documentFiles.length > 0 ? (
                    <div className="poe-doc-list">
                      <div style={{ fontSize: 11, color: 'rgba(168,204,232,0.3)', padding: '8px 14px', background: 'rgba(168,204,232,0.03)', borderBottom: '1px solid rgba(168,204,232,0.06)' }}>
                        Select from storage:
                      </div>
                      {documentFiles.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => setFormData(prev => ({ ...prev, pdfUrl: doc.url }))}
                          className={`poe-doc-item${formData.pdfUrl === doc.url ? ' selected' : ''}`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke='var(--theme-text-muted)' strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                          <span className="poe-doc-label">{doc.name || doc.url.split('/').pop()}</span>
                          {formData.pdfUrl === doc.url && <span className="poe-doc-check">✓ Selected</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="poe-doc-empty">No documents uploaded yet. Upload documents in Media Library first.</div>
                  )}
                </div>
                <div className="poe-field" style={{ marginBottom: 0 }}>
                  <label className="poe-label">Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="poe-input"
                  />
                  <div style={{ fontSize: 11.5, color: 'rgba(168,204,232,0.25)', marginTop: 6 }}>Date of the bulletin/event</div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="poe-card">
              <div className="poe-field" style={{ marginBottom: 0 }}>
                <label className="poe-label">Content <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={16}
                  className="poe-input"
                  placeholder="Write your post content here..."
                  required
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="poe-card">
              <div className="poe-sidebar-title">Select Images</div>
              <div className="poe-sidebar-sub">Choose images from the media library</div>
              {imageFiles.length > 0 ? (
                <>
                  <div className="poe-img-grid">
                    {imageFiles.map(img => (
                      <div
                        key={img.id}
                        onClick={() => handleImageToggle(img.url)}
                        className={`poe-img-item${formData.images.includes(img.url) ? ' selected' : ''}`}
                      >
                        <img src={getFullUrl(img.url)} alt={img.name} />
                      </div>
                    ))}
                  </div>
                  {formData.images.length > 0 && (
                    <div className="poe-img-count">Selected: {formData.images.length} image(s)</div>
                  )}
                </>
              ) : (
                <div className="poe-doc-empty">No images in media library yet.</div>
              )}
            </div>

            <div className="poe-card">
              <div className="poe-sidebar-title">Post Info</div>
              <div className="poe-info-row">
                <span className="poe-info-key">Author</span>
                <span className="poe-info-val">{post?.authorName || 'You'}</span>
              </div>
              <div className="poe-info-row">
                <span className="poe-info-key">Date</span>
                <span className="poe-info-val">{post?.date || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostEditor;
