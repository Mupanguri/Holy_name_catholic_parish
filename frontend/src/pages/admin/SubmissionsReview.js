import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFullUrl } from '../../services/api';
import { getAllTemplates } from '../../config/pageTemplates';

const SubmissionsReview = () => {
  const { theme, colors } = useOutletContext() || {};
  const navigate = useNavigate();
  const {
    submissions,
    getPendingSubmissions,
    approveSubmission,
    rejectSubmission,
    addSubmissionComment,
    isSuperAdmin,
    currentUser,
    getPendingDocuments,
    getPendingVideoLinks,
    getAllDocuments,
    getAllVideoLinks,
    reviewDocument,
    reviewVideoLink,
  } = useAuth();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('pending');
  const [templates, setTemplates] = useState([]);

  const pendingSubmissions = getPendingSubmissions();
  const pendingDocuments = isSuperAdmin() ? getPendingDocuments() : [];
  const pendingVideoLinks = isSuperAdmin() ? getPendingVideoLinks() : [];

  const pendingItems = [
    ...pendingSubmissions.map(s => ({ ...s, itemType: 'submission', displayType: s.type })),
    ...pendingDocuments.map(d => ({ ...d, itemType: 'document', displayType: 'Document' })),
    ...pendingVideoLinks.map(v => ({ ...v, itemType: 'video_link', displayType: 'Video Link' })),
  ].sort(
    (a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)
  );

  const getFilteredItems = () => {
    if (filter === 'pending') return pendingItems;
    if (filter === 'approved') {
      const allSubmissions = submissions.filter(s => s.status === 'approved');
      const allDocs = getAllDocuments().filter(d => d.status === 'approved');
      const allVideos = getAllVideoLinks().filter(v => v.status === 'approved');
      return [
        ...allSubmissions.map(s => ({ ...s, itemType: 'submission', displayType: s.type })),
        ...allDocs.map(d => ({ ...d, itemType: 'document', displayType: 'Document' })),
        ...allVideos.map(v => ({ ...v, itemType: 'video_link', displayType: 'Video Link' })),
      ].sort(
        (a, b) => new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at)
      );
    }
    if (filter === 'rejected') {
      const allSubmissions = submissions.filter(s => s.status === 'rejected');
      const allDocs = getAllDocuments().filter(d => d.status === 'rejected');
      const allVideos = getAllVideoLinks().filter(v => v.status === 'rejected');
      return [
        ...allSubmissions.map(s => ({ ...s, itemType: 'submission', displayType: s.type })),
        ...allDocs.map(d => ({ ...d, itemType: 'document', displayType: 'Document' })),
        ...allVideos.map(v => ({ ...v, itemType: 'video_link', displayType: 'Video Link' })),
      ].sort(
        (a, b) => new Date(b.rejected_at || b.created_at) - new Date(a.rejected_at || a.created_at)
      );
    }
    return pendingItems;
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/templates`
        );
        const data = await response.json();
        const templateData = Array.isArray(data) ? data : data.data || [];
        setTemplates(templateData);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const renderContentPreview = (content, templateId) => {
    if (!content)
      return (
        <span style={{ color: 'rgba(168,204,232,0.3)', fontSize: 13 }}>
          No content preview available
        </span>
      );

    let sections = [];
    try {
      sections = JSON.parse(content);
    } catch {
      return (
        <p style={{ fontSize: 13, color: 'rgba(168,204,232,0.6)', whiteSpace: 'pre-wrap' }}>
          {content}
        </p>
      );
    }

    if (!Array.isArray(sections)) {
      return (
        <p style={{ fontSize: 13, color: 'rgba(168,204,232,0.6)', whiteSpace: 'pre-wrap' }}>
          {content}
        </p>
      );
    }

    const allTemplates = getAllTemplates();
    const template = templateId
      ? allTemplates.find(t => t.id === templateId || t.path === templateId)
      : null;

    return (
      <div className="page-root" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <style>{`
        /* ── theme propagation ── */
        .page-root, .page-root * {
          border-color: var(--theme-border) !important;
        }
        .page-root h1,.page-root h2,.page-root h3,
        .page-root h4,.page-root h5,.page-root h6,
        .page-root p,.page-root span,.page-root label,
        .page-root td,.page-root th,.page-root li,
        .page-root a, .page-root div, .page-root td, .page-root th {
          color: var(--theme-text) !important;
        }
        .page-root input,.page-root textarea,.page-root select {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }
        .page-root table { background: var(--theme-bg-secondary) !important; }
        .page-root tr { border-color: var(--theme-border) !important; }
        .page-root [class*="card"],[class*="panel"],[class*="box"],
        .page-root [class*="container"],[class*="section"],[class*="wrapper"],
        .page-root [class*="modal"],.page-root [class*="dialog"] {
          background: var(--theme-bg-secondary) !important;
          color: var(--theme-text) !important;
        }
      `}</style>
        {sections.map((section, index) => {
          const sectionTemplate = template?.sections?.find(s => s.id === section.id);
          const sectionTitle = sectionTemplate?.title || section.title || `Section ${index + 1}`;
          return (
            <div
              key={section.id || index}
              style={{
                background: 'rgba(168,204,232,0.04)',
                border: '1px solid rgba(168,204,232,0.08)',
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#a8cce8',
                  marginBottom: 10,
                  fontFamily: 'Cinzel, serif',
                  letterSpacing: '0.04em',
                }}
              >
                {sectionTitle}
              </div>
              {section.data &&
                Object.entries(section.data).map(([fieldId, value]) => {
                  const fieldDef = sectionTemplate?.fields?.find(f => f.id === fieldId);
                  const fieldLabel = fieldDef?.label || fieldId;
                  if (
                    typeof value === 'string' &&
                    (value.startsWith('http') || value.startsWith('/'))
                  ) {
                    return (
                      <div key={fieldId} style={{ marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            color: 'var(--theme-text-muted)',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          {fieldLabel}
                        </span>
                        <img
                          src={getFullUrl(value)}
                          alt={fieldLabel}
                          style={{
                            maxWidth: '100%',
                            maxHeight: 160,
                            borderRadius: 6,
                            display: 'block',
                          }}
                          onError={e => (e.target.style.display = 'none')}
                        />
                      </div>
                    );
                  }
                  if (value && typeof value === 'string') {
                    return (
                      <div key={fieldId} style={{ marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 500,
                            color: 'var(--theme-text-muted)',
                            display: 'block',
                            marginBottom: 3,
                          }}
                        >
                          {fieldLabel}
                        </span>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'rgba(168,204,232,0.65)',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
          );
        })}
      </div>
    );
  };

  const getMySubmissions = () => {
    if (!currentUser) return [];
    return submissions.filter(s => s.author_id === currentUser.id);
  };

  // Non-super-admin: My Submissions view
  if (!isSuperAdmin()) {
    const mySubmissions = getMySubmissions();
    const rejectedSubs = mySubmissions.filter(s => s.status === 'rejected');

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          .sr-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }
          .sr-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
          .sr-sub { font-size: 13px; color: var(--theme-text-muted); margin-bottom: 24px; }
          .sr-panel { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
          .sr-panel-head { padding: 14px 18px; border-bottom: 1px solid var(--theme-border); }
          .sr-panel-title { font-size: 14px; font-weight: 600; color: var(--theme-text); }
          .sr-empty { padding: 40px 24px; text-align: center; color: rgba(168,204,232,0.2); font-size: 13.5px; }
          .sr-table-wrap { overflow-x: auto; }
          table.sr-table { width: 100%; border-collapse: collapse; }
          .sr-table th { padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(168,204,232,0.25); background: rgba(168,204,232,0.03); border-bottom: 1px solid rgba(168,204,232,0.05); font-family: 'Cinzel', serif; white-space: nowrap; }
          .sr-table td { padding: 12px 14px; border-bottom: 1px solid rgba(168,204,232,0.04); font-size: 13px; vertical-align: middle; }
          .sr-table tr:last-child td { border-bottom: none; }
          .sr-table tr:hover td { background: rgba(168,204,232,0.02); }
          .sr-type-tag { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600; }
          .sr-view-btn { font-size: 12.5px; font-weight: 600; color: rgba(42,96,153,0.9); background: none; border: none; cursor: pointer; padding: 4px 10px; border-radius: 6px; transition: all 0.14s; font-family: 'Inter', sans-serif; }
          .sr-view-btn:hover { background: rgba(42,96,153,0.12); color: #a8cce8; }
          .sr-notes { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--theme-text-muted); font-size: 12.5px; }
          .sr-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; backdrop-filter: blur(4px); overflow-y: auto; }
          .sr-modal { background: #12192a; border: 1px solid rgba(168,204,232,0.1); border-radius: 16px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
          .sr-modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 0; margin-bottom: 14px; }
          .sr-modal-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: var(--theme-text); margin-top: 6px; }
          .sr-modal-meta { font-size: 12.5px; color: rgba(168,204,232,0.3); margin-bottom: 16px; padding: 0 24px; }
          .sr-close-btn { background: none; border: none; cursor: pointer; color: var(--theme-text-muted); padding: 4px; border-radius: 6px; display: flex; transition: color 0.14s; }
          .sr-close-btn:hover { color: rgba(168,204,232,0.9); }
          .sr-rejection-box { margin: 0 24px 16px; padding: 14px 16px; background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.18); border-radius: 10px; }
          .sr-rejection-head { font-size: 13px; font-weight: 600; color: #fca5a5; margin-bottom: 8px; }
          .sr-rejection-notes { font-size: 13px; color: rgba(248,113,113,0.8); white-space: pre-wrap; }
          .sr-content-preview { margin: 0 24px 16px; padding: 14px 16px; background: rgba(168,204,232,0.03); border: 1px solid var(--theme-border); border-radius: 10px; max-height: 240px; overflow-y: auto; }
          .sr-modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px 22px; border-top: 1px solid var(--theme-border); margin-top: 8px; }
          .sr-modal-btn { padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s; }
          .sr-modal-btn-cancel { background: var(--theme-border); border: 1px solid rgba(168,204,232,0.1); color: var(--theme-text-muted); }
          .sr-modal-btn-cancel:hover { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.8); }
          .sr-modal-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3); color: #a8cce8; text-decoration: none; display: inline-block; }
          .sr-modal-btn-primary:hover { background: rgba(42,96,153,0.5); }
        `}</style>
        <div className="sr-root">
          <div className="sr-title">My Submissions</div>
          <div className="sr-sub">Track your content submissions and review status</div>

          {/* Rejected items */}
          <div className="sr-panel">
            <div
              className="sr-panel-head"
              style={{
                background: 'rgba(220,38,38,0.05)',
                borderBottom: '1px solid rgba(220,38,38,0.1)',
              }}
            >
              <div className="sr-panel-title" style={{ color: '#fca5a5' }}>
                Items Rejected — Please Fix & Resubmit ({rejectedSubs.length})
              </div>
            </div>
            {rejectedSubs.length === 0 ? (
              <div className="sr-empty">No rejected submissions.</div>
            ) : (
              <div className="sr-table-wrap">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Rejected</th>
                      <th>Rejection Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedSubs.map(submission => (
                      <tr key={submission.id}>
                        <td>
                          <span
                            className="sr-type-tag"
                            style={
                              submission.type === 'page'
                                ? {
                                    background: 'rgba(59,130,246,0.1)',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    color: 'rgba(147,197,253,0.9)',
                                  }
                                : {
                                    background: 'rgba(139,92,246,0.1)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    color: 'rgba(196,181,253,0.9)',
                                  }
                            }
                          >
                            {submission.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--theme-text)' }}>
                          {submission.title}
                        </td>
                        <td style={{ fontSize: 12.5, color: 'rgba(168,204,232,0.3)' }}>
                          {submission.rejected_at
                            ? new Date(submission.rejected_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <div className="sr-notes" title={submission.rejection_notes}>
                            {submission.rejection_notes || 'No notes provided'}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowModal(true);
                            }}
                            className="sr-view-btn"
                          >
                            View & Fix
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All submissions */}
          <div className="sr-panel">
            <div className="sr-panel-head">
              <div className="sr-panel-title">All My Submissions</div>
            </div>
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Reviewed By</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.map(submission => {
                    const sColors = {
                      pending: {
                        bg: 'rgba(201,168,76,0.1)',
                        border: 'rgba(201,168,76,0.2)',
                        c: 'rgba(251,191,36,0.9)',
                      },
                      approved: {
                        bg: 'rgba(22,163,74,0.1)',
                        border: 'rgba(22,163,74,0.2)',
                        c: 'rgba(74,222,128,0.9)',
                      },
                      rejected: {
                        bg: 'rgba(220,38,38,0.1)',
                        border: 'rgba(220,38,38,0.2)',
                        c: 'rgba(248,113,113,0.9)',
                      },
                    };
                    const sc = sColors[submission.status] || sColors.pending;
                    return (
                      <tr key={submission.id}>
                        <td>
                          <span
                            className="sr-type-tag"
                            style={
                              submission.type === 'page'
                                ? {
                                    background: 'rgba(59,130,246,0.1)',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    color: 'rgba(147,197,253,0.9)',
                                  }
                                : {
                                    background: 'rgba(139,92,246,0.1)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    color: 'rgba(196,181,253,0.9)',
                                  }
                            }
                          >
                            {submission.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--theme-text)' }}>
                          {submission.title}
                        </td>
                        <td>
                          <span
                            className="sr-type-tag"
                            style={{
                              background: sc.bg,
                              border: `1px solid ${sc.border}`,
                              color: sc.c,
                            }}
                          >
                            {submission.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'rgba(168,204,232,0.3)' }}>
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--theme-text-muted)' }}>
                          {submission.approved_by || submission.rejected_by || '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {mySubmissions.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: '40px 14px',
                          textAlign: 'center',
                          color: 'rgba(168,204,232,0.2)',
                          fontSize: 13.5,
                        }}
                      >
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showModal && selectedSubmission && (
            <div className="sr-modal-overlay">
              <div className="sr-modal">
                <div className="sr-modal-head">
                  <div>
                    <span
                      className="sr-type-tag"
                      style={
                        selectedSubmission.type === 'page'
                          ? {
                              background: 'rgba(59,130,246,0.1)',
                              border: '1px solid rgba(59,130,246,0.2)',
                              color: 'rgba(147,197,253,0.9)',
                            }
                          : {
                              background: 'rgba(139,92,246,0.1)',
                              border: '1px solid rgba(139,92,246,0.2)',
                              color: 'rgba(196,181,253,0.9)',
                            }
                      }
                    >
                      {selectedSubmission.type}
                    </span>
                    <span
                      className="sr-type-tag"
                      style={{
                        marginLeft: 8,
                        background: 'rgba(220,38,38,0.1)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        color: 'rgba(248,113,113,0.9)',
                      }}
                    >
                      {selectedSubmission.status}
                    </span>
                  </div>
                  <button onClick={() => setShowModal(false)} className="sr-close-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="sr-modal-title" style={{ padding: '0 24px', marginBottom: 6 }}>
                  {selectedSubmission.title}
                </div>
                <div className="sr-modal-meta">
                  Submitted on{' '}
                  {selectedSubmission.submitted_at
                    ? new Date(selectedSubmission.submitted_at).toLocaleDateString()
                    : '—'}
                </div>
                <div className="sr-rejection-box">
                  <div className="sr-rejection-head">Rejection Notes:</div>
                  <div className="sr-rejection-notes">
                    {selectedSubmission.rejection_notes ||
                      'No notes were provided. Please contact the administrator.'}
                  </div>
                </div>
                <div
                  style={{
                    padding: '0 24px 4px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(168,204,232,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: 'Cinzel, serif',
                    marginBottom: 6,
                  }}
                >
                  Content Preview
                </div>
                <div className="sr-content-preview">
                  {renderContentPreview(selectedSubmission.content, selectedSubmission.template_id)}
                </div>
                <div className="sr-modal-footer">
                  <button
                    onClick={() => setShowModal(false)}
                    className="sr-modal-btn sr-modal-btn-cancel"
                  >
                    Close
                  </button>
                  <a
                    href={
                      selectedSubmission.type === 'page'
                        ? `/admin/pages/edit/${selectedSubmission.item_id}`
                        : `/admin/posts/edit/${selectedSubmission.item_id}`
                    }
                    className="sr-modal-btn sr-modal-btn-primary"
                  >
                    Edit & Resubmit
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Super-admin: full approvals view
  const handleApprove = async item => {
    if (item.itemType === 'submission') {
      setSelectedSubmission(item);
      setActionType('approve');
      setShowWarningDialog(true);
    } else if (item.itemType === 'document') {
      await reviewDocument(item.id, 'approve', '');
    } else if (item.itemType === 'video_link') {
      await reviewVideoLink(item.id, 'approve', '');
    }
  };

  const handleReject = async item => {
    if (item.itemType === 'submission') {
      setSelectedSubmission(item);
      setActionType('reject');
      setShowModal(true);
    } else if (item.itemType === 'document') {
      const n = prompt('Please provide a reason for rejection:');
      if (n) await reviewDocument(item.id, 'reject', n);
    } else if (item.itemType === 'video_link') {
      const n = prompt('Please provide a reason for rejection:');
      if (n) await reviewVideoLink(item.id, 'reject', n);
    }
  };

  const handleViewDetails = item => {
    setSelectedSubmission(item);
    setActionType('view');
    setShowModal(true);
  };
  const confirmApprove = async () => {
    await approveSubmission(selectedSubmission.id, notes);
    setShowWarningDialog(false);
    setShowModal(false);
    setNotes('');
    setSelectedSubmission(null);
  };
  const submitAction = async () => {
    if (actionType === 'approve') await approveSubmission(selectedSubmission.id, notes);
    else if (actionType === 'reject') await rejectSubmission(selectedSubmission.id, notes);
    setShowModal(false);
    setNotes('');
    setSelectedSubmission(null);
  };
  const handleAddComment = async () => {
    if (comment.trim() && selectedSubmission) {
      await addSubmissionComment(selectedSubmission.id, comment);
      setComment('');
      const updated = submissions.find(s => s.id === selectedSubmission.id);
      if (updated) setSelectedSubmission(updated);
    }
  };

  const getStatusStyle = status => {
    const map = {
      pending: {
        bg: 'rgba(201,168,76,0.1)',
        border: 'rgba(201,168,76,0.2)',
        c: 'rgba(251,191,36,0.9)',
      },
      approved: {
        bg: 'rgba(22,163,74,0.1)',
        border: 'rgba(22,163,74,0.2)',
        c: 'rgba(74,222,128,0.9)',
      },
      rejected: {
        bg: 'rgba(220,38,38,0.1)',
        border: 'rgba(220,38,38,0.2)',
        c: 'rgba(248,113,113,0.9)',
      },
    };
    return map[status] || map.pending;
  };
  const getTypeStyle = type => {
    const map = {
      page: {
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.2)',
        c: 'rgba(147,197,253,0.9)',
      },
      post: {
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.2)',
        c: 'rgba(196,181,253,0.9)',
      },
      document: {
        bg: 'rgba(234,88,12,0.1)',
        border: 'rgba(234,88,12,0.2)',
        c: 'rgba(251,146,60,0.9)',
      },
      'video link': {
        bg: 'rgba(220,38,38,0.1)',
        border: 'rgba(220,38,38,0.2)',
        c: 'rgba(248,113,113,0.9)',
      },
    };
    return (
      map[type?.toLowerCase()] || {
        bg: 'var(--theme-border)',
        border: 'rgba(168,204,232,0.12)',
        c: 'var(--theme-text-muted)',
      }
    );
  };
  const formatDate = d => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  };

  const filteredItems = getFilteredItems();

  const renderDocCard = doc => (
    <div
      key={doc.id}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(168,204,232,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 3 }}
          >
            {doc.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(168,204,232,0.3)' }}>
            v{doc.version} · {doc.author_name}
          </div>
        </div>
        <span
          style={{
            ...getStatusStyle(doc.status),
            display: 'inline-block',
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: getStatusStyle(doc.status).bg,
            border: `1px solid ${getStatusStyle(doc.status).border}`,
            color: getStatusStyle(doc.status).c,
          }}
        >
          {doc.status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {doc.url && (
          <button
            onClick={() => window.open(getFullUrl(doc.url), '_blank')}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 7,
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.2)',
              color: '#4ade80',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Download
          </button>
        )}
        {doc.status === 'pending' && (
          <>
            <button
              onClick={() => reviewDocument(doc.id, 'approve', '')}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 7,
                background: 'rgba(42,96,153,0.15)',
                border: '1px solid rgba(42,96,153,0.25)',
                color: '#93c5fd',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Approve
            </button>
            <button
              onClick={async () => {
                const n = prompt('Reason for rejection:');
                if (n) await reviewDocument(doc.id, 'reject', n);
              }}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 7,
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#f87171',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderVideoCard = video => (
    <div
      key={video.id}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(168,204,232,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          aspectRatio: '16/9',
          background: 'rgba(124,58,237,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(168,204,232,0.2)',
              fontSize: 32,
            }}
          >
            ▶
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--theme-text)',
                marginBottom: 3,
              }}
            >
              {video.title}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(168,204,232,0.3)' }}>
              {video.author_name}
            </div>
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: getStatusStyle(video.status).bg,
              border: `1px solid ${getStatusStyle(video.status).border}`,
              color: getStatusStyle(video.status).c,
            }}
          >
            {video.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.open(video.url, '_blank')}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 7,
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.2)',
              color: '#4ade80',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            View Link
          </button>
          {video.status === 'pending' && (
            <>
              <button
                onClick={() => reviewVideoLink(video.id, 'approve', '')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 7,
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  color: '#c4b5fd',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Approve
              </button>
              <button
                onClick={async () => {
                  const n = prompt('Reason for rejection:');
                  if (n) await reviewVideoLink(video.id, 'reject', n);
                }}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 7,
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  color: '#f87171',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const filterTabs = [
    {
      key: 'pending',
      label: `Pending (${pendingItems.length})`,
      c: '#a8cce8',
      bg: 'rgba(42,96,153,0.18)',
    },
    { key: 'approved', label: 'Approved', c: '#4ade80', bg: 'rgba(22,163,74,0.15)' },
    { key: 'rejected', label: 'Rejected', c: '#f87171', bg: 'rgba(220,38,38,0.15)' },
  ];

  const statCards = [
    {
      label: 'Page/Post Submissions',
      value: pendingSubmissions.length,
      accent: '#2a6099',
      bg: 'rgba(42,96,153,0.1)',
    },
    {
      label: 'Pending Documents',
      value: pendingDocuments.length,
      accent: '#fb923c',
      bg: 'rgba(234,88,12,0.1)',
    },
    {
      label: 'Pending Video Links',
      value: pendingVideoLinks.length,
      accent: '#f87171',
      bg: 'rgba(220,38,38,0.1)',
    },
    {
      label: 'Total Pending',
      value: pendingItems.length,
      accent: 'var(--theme-gold)',
      bg: 'rgba(201,168,76,0.1)',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .sra-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }
        .sra-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px; }
        .sra-sub { font-size: 13px; color: var(--theme-text-muted); margin-bottom: 24px; }

        .sra-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 800px) { .sra-stats { grid-template-columns: repeat(2, 1fr); } }
        .sra-stat {
          background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border);
          border-radius: 12px; padding: 16px 18px;
          border-left-width: 3px;
        }
        .sra-stat-val { font-size: 28px; font-weight: 700; color: var(--theme-text); letter-spacing: -0.02em; line-height: 1; margin-bottom: 5px; }
        .sra-stat-label { font-size: 12px; color: rgba(168,204,232,0.3); }

        .sra-section-title {
          font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(168,204,232,0.25);
          margin-bottom: 12px; display: flex; align-items: center; gap: 12px;
        }
        .sra-section-title::after { content: ''; flex: 1; height: 1px; background: var(--theme-border); }
        .sra-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 900px) { .sra-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .sra-cards-grid { grid-template-columns: 1fr; } }

        .sra-filter-tabs { display: flex; gap: 8px; margin-bottom: 18px; }
        .sra-tab { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid transparent; cursor: pointer; background: none; font-family: 'Inter', sans-serif; color: var(--theme-text-muted); transition: all 0.14s; }
        .sra-tab:hover { background: var(--theme-border); color: rgba(168,204,232,0.7); }

        .sra-panel { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border); border-radius: 12px; overflow: hidden; }
        .sra-panel-head { padding: 14px 18px; border-bottom: 1px solid var(--theme-border); }
        .sra-panel-title { font-size: 14px; font-weight: 600; color: var(--theme-text); }
        .sra-empty { padding: 48px 24px; text-align: center; color: rgba(168,204,232,0.2); font-size: 13.5px; }

        .sra-table-wrap { overflow-x: auto; }
        table.sra-table { width: 100%; border-collapse: collapse; }
        .sra-table th { padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(168,204,232,0.25); background: rgba(168,204,232,0.03); border-bottom: 1px solid rgba(168,204,232,0.05); font-family: 'Cinzel', serif; white-space: nowrap; }
        .sra-table td { padding: 12px 14px; border-bottom: 1px solid rgba(168,204,232,0.04); font-size: 13px; vertical-align: middle; }
        .sra-table tr:last-child td { border-bottom: none; }
        .sra-table tr:hover td { background: rgba(168,204,232,0.02); }

        .sra-tag { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .sra-author { font-size: 12.5px; color: var(--theme-text-muted); }
        .sra-date { font-size: 12.5px; color: rgba(168,204,232,0.25); white-space: nowrap; }

        .sra-actions { display: flex; gap: 6px; align-items: center; }
        .sra-action-btn { font-size: 12.5px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 5px 10px; border-radius: 6px; transition: all 0.14s; font-family: 'Inter', sans-serif; }
        .sra-view-btn { color: var(--theme-gold) !important; }
        .sra-view-btn:hover { background: rgba(201,168,76,0.15); color: var(--theme-gold) !important; }
        .sra-approve-btn { color: #a855f7 !important; font-weight: 600; }
        .sra-approve-btn:hover { background: rgba(168,85,247,0.15); color: #a855f7 !important; }
        .sra-reject-btn { color: #ef4444 !important; font-weight: 600; }
        .sra-reject-btn:hover { background: rgba(239,68,68,0.15); color: #ef4444 !important; }

        /* Modal */
        .sra-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; backdrop-filter: blur(4px); overflow-y: auto; }
        .sra-modal { background: #12192a; border: 1px solid rgba(168,204,232,0.1); border-radius: 16px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.55); }
        .sra-modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 12px; }
        .sra-close-btn { background: none; border: none; cursor: pointer; color: var(--theme-text-muted); padding: 4px; border-radius: 6px; display: flex; transition: color 0.14s; }
        .sra-close-btn:hover { color: rgba(168,204,232,0.9); }
        .sra-modal-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; padding: 0 24px; margin-bottom: 6px; }
        .sra-modal-meta { padding: 0 24px; font-size: 12.5px; color: rgba(168,204,232,0.3); margin-bottom: 16px; }
        .sra-modal-section { margin: 0 24px 14px; }
        .sra-modal-section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(168,204,232,0.3); margin-bottom: 8px; font-family: 'Cinzel', serif; }
        .sra-rejection-box { background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.18); border-radius: 10px; padding: 14px 16px; }
        .sra-rejection-text { font-size: 13px; color: rgba(248,113,113,0.8); white-space: pre-wrap; }
        .sra-content-box { background: rgba(168,204,232,0.03); border: 1px solid var(--theme-border); border-radius: 10px; padding: 14px 16px; max-height: 200px; overflow-y: auto; }
        .sra-comment-row { background: rgba(168,204,232,0.04); border-radius: 7px; padding: 9px 12px; font-size: 12.5px; color: rgba(168,204,232,0.55); margin-bottom: 6px; }
        .sra-comment-row strong { font-weight: 600; color: rgba(168,204,232,0.7); }
        .sra-comment-input { display: flex; gap: 8px; }
        .sra-input { background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.1); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; color: var(--theme-text); outline: none; font-family: 'Inter', sans-serif; transition: border-color 0.18s; width: 100%; }
        .sra-input::placeholder { color: rgba(168,204,232,0.2); }
        .sra-input:focus { border-color: rgba(42,96,153,0.5); }
        .sra-add-btn { padding: 10px 16px; border-radius: 8px; background: var(--theme-border); border: 1px solid rgba(168,204,232,0.1); color: rgba(168,204,232,0.6); font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; transition: all 0.15s; }
        .sra-add-btn:hover { background: rgba(168,204,232,0.12); color: rgba(168,204,232,0.9); }
        .sra-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px 22px; border-top: 1px solid var(--theme-border); margin-top: 8px; }
        .sra-modal-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .sra-modal-btn-cancel { background: var(--theme-border); border: 1px solid rgba(168,204,232,0.1); color: var(--theme-text-muted); }
        .sra-modal-btn-cancel:hover { background: rgba(168,204,232,0.1); }
        .sra-modal-btn-green { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.25); color: #4ade80; }
        .sra-modal-btn-green:hover { background: rgba(22,163,74,0.25); }
        .sra-modal-btn-red { background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.2); color: #f87171; }
        .sra-modal-btn-red:hover:not(:disabled) { background: rgba(220,38,38,0.2); }
        .sra-modal-btn-red:disabled { opacity: 0.35; cursor: not-allowed; }
        .sra-modal-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3); color: #a8cce8; }
        .sra-modal-btn-primary:hover { background: rgba(42,96,153,0.5); }

        /* Warning dialog */
        .sra-warn-panel { background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.15); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
        .sra-warn-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: var(--theme-text); margin-bottom: 12px; }
        .sra-warn-icon { width: 34px; height: 34px; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(201,168,76,0.9); }
      `}</style>

      <div className="sra-root">
        <div className="sra-title">Approvals</div>
        <div className="sra-sub">Review and approve pages, posts, documents, and video links</div>

        {/* Stats */}
        <div className="sra-stats">
          {statCards.map(s => (
            <div key={s.label} className="sra-stat" style={{ borderLeftColor: s.accent }}>
              <div className="sra-stat-val" style={{ color: s.accent }}>
                {s.value}
              </div>
              <div className="sra-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending documents */}
        {isSuperAdmin() && pendingDocuments.length > 0 && (
          <>
            <div className="sra-section-title">Documents Pending Review</div>
            <div className="sra-cards-grid">{pendingDocuments.map(renderDocCard)}</div>
          </>
        )}

        {/* Pending video links */}
        {isSuperAdmin() && pendingVideoLinks.length > 0 && (
          <>
            <div className="sra-section-title">Video Links Pending Review</div>
            <div className="sra-cards-grid">{pendingVideoLinks.map(renderVideoCard)}</div>
          </>
        )}

        {/* Filter tabs */}
        <div className="sra-filter-tabs">
          {filterTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="sra-tab"
              style={
                filter === t.key ? { background: t.bg, color: t.c, borderColor: `${t.c}33` } : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Items table */}
        <div className="sra-panel">
          <div className="sra-panel-head">
            <div className="sra-panel-title">
              {filter === 'pending'
                ? `Pending Review (${filteredItems.length})`
                : filter === 'approved'
                  ? 'Approved Items'
                  : 'Rejected Items'}
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="sra-empty">
              {filter === 'pending' ? 'No pending items. All caught up!' : 'No items found.'}
            </div>
          ) : (
            <div className="sra-table-wrap">
              <table className="sra-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>
                      {filter === 'pending'
                        ? 'Submitted'
                        : filter === 'approved'
                          ? 'Approved'
                          : 'Rejected'}
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const ts = getTypeStyle(item.displayType);
                    const ss = getStatusStyle(item.status);
                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className="sra-tag"
                            style={{
                              background: ts.bg,
                              border: `1px solid ${ts.border}`,
                              color: ts.c,
                            }}
                          >
                            {item.displayType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--theme-text)' }}>
                          {item.title || item.name}
                        </td>
                        <td>
                          <span className="sra-author">
                            {item.author_name || item.uploaded_by || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="sra-date">
                            {formatDate(item.submitted_at || item.created_at)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="sra-tag"
                            style={{
                              background: ss.bg,
                              border: `1px solid ${ss.border}`,
                              color: ss.c,
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="sra-actions">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="sra-action-btn sra-view-btn"
                            >
                              View
                            </button>
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(item)}
                                  className="sra-action-btn sra-approve-btn"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(item)}
                                  className="sra-action-btn sra-reject-btn"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warning dialog (confirm approve) */}
        {showWarningDialog && selectedSubmission && (
          <div className="sra-modal-overlay">
            <div className="sra-modal" style={{ maxWidth: 460 }}>
              <div style={{ padding: '22px 24px 0' }}>
                <div className="sra-warn-title">
                  <div className="sra-warn-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  Confirm Publication
                </div>
                <p style={{ fontSize: 13.5, color: 'rgba(168,204,232,0.45)', marginBottom: 14 }}>
                  You are about to <strong style={{ color: 'var(--theme-text)' }}>publish</strong>{' '}
                  the following content:
                </p>
                <div
                  style={{
                    background: 'rgba(168,204,232,0.04)',
                    border: '1px solid rgba(168,204,232,0.08)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--theme-text)', marginBottom: 3 }}>
                    {selectedSubmission.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--theme-text-muted)' }}>
                    Type: {selectedSubmission.type}
                  </div>
                </div>
                <div className="sra-warn-panel">
                  <p style={{ fontSize: 13, color: 'rgba(201,168,76,0.8)', margin: 0 }}>
                    <strong>Warning:</strong> This content will be immediately visible to all
                    visitors on the live site.
                  </p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--theme-text-muted)',
                      marginBottom: 7,
                    }}
                  >
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="sra-input"
                    placeholder="Add any notes about this approval..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="sra-modal-footer">
                <button
                  onClick={() => {
                    setShowWarningDialog(false);
                    setNotes('');
                  }}
                  className="sra-modal-btn sra-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={confirmApprove} className="sra-modal-btn sra-modal-btn-green">
                  Yes, Publish Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail / reject modal */}
        {showModal && selectedSubmission && actionType !== 'approve' && (
          <div className="sra-modal-overlay">
            <div className="sra-modal">
              <div className="sra-modal-head">
                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    className="sra-tag"
                    style={{
                      ...getTypeStyle(selectedSubmission.type),
                      background: getTypeStyle(selectedSubmission.type).bg,
                      border: `1px solid ${getTypeStyle(selectedSubmission.type).border}`,
                      color: getTypeStyle(selectedSubmission.type).c,
                    }}
                  >
                    {selectedSubmission.type}
                  </span>
                  <span
                    className="sra-tag"
                    style={{
                      background: getStatusStyle(selectedSubmission.status).bg,
                      border: `1px solid ${getStatusStyle(selectedSubmission.status).border}`,
                      color: getStatusStyle(selectedSubmission.status).c,
                    }}
                  >
                    {selectedSubmission.status}
                  </span>
                </div>
                <button onClick={() => setShowModal(false)} className="sra-close-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="sra-modal-title">{selectedSubmission.title}</div>
              <div className="sra-modal-meta">
                Submitted by {selectedSubmission.author_name} on{' '}
                {selectedSubmission.submitted_at
                  ? new Date(selectedSubmission.submitted_at).toLocaleDateString()
                  : '—'}
              </div>

              {selectedSubmission.status === 'rejected' && selectedSubmission.rejection_notes && (
                <div className="sra-modal-section">
                  <div className="sra-modal-section-title">Rejection Notes</div>
                  <div className="sra-rejection-box">
                    <div className="sra-rejection-text">{selectedSubmission.rejection_notes}</div>
                  </div>
                </div>
              )}

              <div className="sra-modal-section">
                <div className="sra-modal-section-title">Content Preview</div>
                <div className="sra-content-box">
                  {renderContentPreview(selectedSubmission.content, selectedSubmission.template_id)}
                </div>
              </div>

              {selectedSubmission.comments && selectedSubmission.comments.length > 0 && (
                <div className="sra-modal-section">
                  <div className="sra-modal-section-title">Comments</div>
                  {selectedSubmission.comments.map(c => (
                    <div key={c.id} className="sra-comment-row">
                      <strong>{c.userName}:</strong> {c.comment}
                    </div>
                  ))}
                </div>
              )}

              <div className="sra-modal-section">
                <div className="sra-modal-section-title">Add Comment</div>
                <div className="sra-comment-input">
                  <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="sra-input"
                    placeholder="Add a note or comment..."
                  />
                  <button onClick={handleAddComment} className="sra-add-btn">
                    Add
                  </button>
                </div>
              </div>

              {actionType !== 'view' && (
                <div className="sra-modal-section">
                  <div className="sra-modal-section-title">
                    {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason *'}
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="sra-input"
                    placeholder={
                      actionType === 'approve' ? 'Optional notes...' : 'Reason for rejection...'
                    }
                    required={actionType === 'reject'}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div className="sra-modal-footer">
                <button
                  onClick={() => setShowModal(false)}
                  className="sra-modal-btn sra-modal-btn-cancel"
                >
                  Cancel
                </button>
                {actionType === 'view' && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="sra-modal-btn sra-modal-btn-primary"
                  >
                    Close
                  </button>
                )}
                {actionType === 'approve' && (
                  <button onClick={submitAction} className="sra-modal-btn sra-modal-btn-green">
                    Approve & Publish
                  </button>
                )}
                {actionType === 'reject' && (
                  <button
                    onClick={submitAction}
                    disabled={!notes}
                    className="sra-modal-btn sra-modal-btn-red"
                  >
                    Reject & Return
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SubmissionsReview;
