import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFullUrl } from '../../services/api';
import API_BASE_URL from '../../services/api';

/**
 * Page Editor
 * - Sections-based pages: visual double-click-to-edit fields
 * - Structured JSON pages (e.g. Contact): smart form editor — no JSON visible
 * - ?copyFrom=<id>: load existing page as a template for a new page
 */

// ─── Inline editable field (sections mode) ────────────────────────────────
const EditableField = ({ value, multiline, onCommit, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  const enter = () => { setEditing(true); setTimeout(() => ref.current && ref.current.focus(), 0); };
  const commit = () => { setEditing(false); if (draft !== value) onCommit(draft); };
  const handleKeyDown = e => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  };

  if (editing) {
    const shared = {
      ref, value: draft, onChange: e => setDraft(e.target.value),
      onBlur: commit, onKeyDown: handleKeyDown,
      style: {
        width: '100%', background: 'rgba(59,130,246,0.08)',
        border: '2px solid #3b82f6', borderRadius: 6, padding: '6px 10px',
        fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit',
        outline: 'none', resize: multiline ? 'vertical' : 'none',
        minHeight: multiline ? 80 : undefined,
      },
    };
    return multiline ? <textarea {...shared} rows={4} autoFocus /> : <input {...shared} type="text" autoFocus />;
  }

  return (
    <div
      onDoubleClick={enter}
      title="Double-click to edit"
      style={{
        cursor: 'text', minHeight: multiline ? 60 : 24,
        padding: '4px 6px', borderRadius: 6,
        border: '1.5px dashed transparent', transition: 'border-color 0.15s',
        wordBreak: 'break-word', whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        overflow: 'hidden', textOverflow: multiline ? undefined : 'ellipsis',
        color: draft ? 'inherit' : 'rgba(168,204,232,0.3)',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
    >
      {draft || <em style={{ opacity: 0.4, fontSize: '0.9em' }}>Double-click to edit…</em>}
    </div>
  );
};

// ─── Image field (sections mode) ──────────────────────────────────────────
const EditableImage = ({ value, onCommit }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const token = localStorage.getItem('adminToken');

  useEffect(() => { setDraft(value || ''); }, [value]);

  const enter = () => { setEditing(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); };
  const commit = () => { setEditing(false); if (draft !== value) onCommit(draft); };

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (data.url) { setDraft(data.url); onCommit(data.url); setEditing(false); }
    } catch {}
  };

  return (
    <div style={{ marginBottom: 8 }}>
      {draft ? (
        <div style={{ marginBottom: 8 }}>
          <img src={getFullUrl(draft)} alt="section" onDoubleClick={enter} title="Double-click to change"
            style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, cursor: 'pointer', border: '1.5px dashed transparent', objectFit: 'cover' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          />
        </div>
      ) : (
        <div onDoubleClick={enter}
          style={{ height: 100, border: '1.5px dashed rgba(168,204,232,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(168,204,232,0.35)', fontSize: 13 }}
          title="Double-click to add image"
        >Double-click to add image</div>
      )}
      {editing && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <input ref={inputRef} type="text" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            placeholder="Paste image URL..."
            style={{ flex: 1, background: 'rgba(59,130,246,0.08)', border: '2px solid #3b82f6', borderRadius: 6, padding: '6px 10px', color: 'inherit', fontSize: 13, outline: 'none' }}
          />
          <button type="button" onClick={() => fileRef.current && fileRef.current.click()}
            style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}
          >Upload</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      )}
    </div>
  );
};

// ─── Smart Structured Form Editor ─────────────────────────────────────────
// Recursively renders any JSON object/array as a friendly form.
// Strings → text inputs, Numbers → number inputs, Arrays → list with Add/Remove, Objects → card group.

const MULTILINE_KEYS = new Set(['body', 'content', 'description', 'text', 'about', 'summary', 'excerpt', 'message', 'notes']);
const IMAGE_KEYS = new Set(['image', 'photo', 'banner', 'thumbnail', 'icon', 'avatar', 'logo', 'cover', 'img']);

const isMultilineKey = k => MULTILINE_KEYS.has(k.toLowerCase()) || k.toLowerCase().includes('desc') || k.toLowerCase().includes('content') || k.toLowerCase().includes('text') || k.toLowerCase().includes('body');
const isImageKey = k => IMAGE_KEYS.has(k.toLowerCase()) || k.toLowerCase().includes('image') || k.toLowerCase().includes('photo') || k.toLowerCase().includes('banner') || k.toLowerCase().includes('thumbnail');

const humanLabel = key => {
  // camelCase / snake_case → Title Words
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
};

// Deep clone helper for creating new empty array items
const deepCloneEmpty = val => {
  if (typeof val === 'string') return '';
  if (typeof val === 'number') return 0;
  if (typeof val === 'boolean') return false;
  if (Array.isArray(val)) return val.map(deepCloneEmpty);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = deepCloneEmpty(val[k]);
    return out;
  }
  return '';
};

// Primitive field — extracted so hooks are always called at component top level
const PrimitiveField = ({ keyName, value, onChange }) => {
  const label = humanLabel(keyName);
  const isML = isMultilineKey(keyName);
  const isImg = isImageKey(keyName);
  const token = localStorage.getItem('adminToken');
  const fileRef = useRef(null);

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch {}
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(168,204,232,0.45)', marginBottom: 6 }}>
        {label}
      </label>
      {isImg && value && (
        <img src={getFullUrl(String(value))} alt="" style={{ display: 'block', maxHeight: 120, borderRadius: 6, marginBottom: 6, objectFit: 'cover', border: '1px solid rgba(168,204,232,0.1)' }} />
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {isML ? (
          <textarea
            value={String(value)}
            onChange={e => onChange(e.target.value)}
            rows={3}
            style={{ flex: 1, background: 'rgba(168,204,232,0.05)', border: '1px solid rgba(168,204,232,0.12)', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: 'var(--theme-text)', outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'vertical', lineHeight: 1.5 }}
            onFocus={e => (e.target.style.borderColor = 'rgba(42,96,153,0.5)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(168,204,232,0.12)')}
          />
        ) : (
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={String(value)}
            onChange={e => onChange(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
            style={{ flex: 1, background: 'rgba(168,204,232,0.05)', border: '1px solid rgba(168,204,232,0.12)', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: 'var(--theme-text)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(42,96,153,0.5)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(168,204,232,0.12)')}
          />
        )}
        {isImg && (
          <>
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()}
              style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >Upload</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  );
};

const StructuredField = ({ path, keyName, value, onChange, depth = 0 }) => {
  const label = humanLabel(keyName);
  const indent = depth * 16;

  // ── Primitive string/number ──
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <div style={{ marginLeft: indent }}>
        <PrimitiveField keyName={keyName} value={value} onChange={onChange} />
      </div>
    );
  }

  // ── Array ──
  if (Array.isArray(value)) {
    const addItem = () => {
      const template = value.length > 0 ? deepCloneEmpty(value[value.length - 1]) : (typeof value[0] === 'string' ? '' : {});
      onChange([...value, template]);
    };
    const removeItem = idx => onChange(value.filter((_, i) => i !== idx));
    const updateItem = (idx, newVal) => onChange(value.map((item, i) => (i === idx ? newVal : item)));

    // Flat array of strings — simpler compact view
    const isFlat = value.every(v => typeof v !== 'object' || v === null);

    return (
      <div style={{ marginLeft: indent, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(168,204,232,0.45)', marginBottom: 10 }}>
          {label} <span style={{ color: 'rgba(168,204,232,0.25)', fontWeight: 400 }}>({value.length})</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isFlat ? 6 : 12 }}>
          {value.map((item, idx) => (
            <div key={idx} style={{
              background: isFlat ? 'none' : 'rgba(168,204,232,0.03)',
              border: isFlat ? 'none' : '1px solid rgba(168,204,232,0.08)',
              borderRadius: isFlat ? 0 : 10,
              padding: isFlat ? 0 : '14px 14px 4px',
              position: 'relative',
            }}>
              {!isFlat && value.length > 1 && (
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(168,204,232,0.2)', fontWeight: 600 }}>#{idx + 1}</span>
                  <button
                    type="button" onClick={() => removeItem(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.4)', fontSize: 14, padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
                    title="Remove"
                  >✕</button>
                </div>
              )}
              {isFlat ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text" value={String(item)}
                    onChange={e => updateItem(idx, e.target.value)}
                    style={{ flex: 1, background: 'rgba(168,204,232,0.05)', border: '1px solid rgba(168,204,232,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--theme-text)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                  {value.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.4)', fontSize: 16, padding: '0 4px' }}
                    >✕</button>
                  )}
                </div>
              ) : (
                <StructuredField
                  path={`${path}.${idx}`}
                  keyName=""
                  value={item}
                  onChange={newVal => updateItem(idx, newVal)}
                  depth={0}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button" onClick={addItem}
          style={{ marginTop: 10, padding: '7px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.25)', color: 'rgba(96,165,250,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          + Add {label.endsWith('s') ? label.slice(0, -1) : label}
        </button>
      </div>
    );
  }

  // ── Object ──
  if (value && typeof value === 'object') {
    const updateKey = (k, newVal) => onChange({ ...value, [k]: newVal });
    const entries = Object.entries(value);

    // If keyName is empty, render fields flat (used inside arrays)
    if (!keyName) {
      return (
        <div>
          {entries.map(([k, v]) => (
            <StructuredField
              key={k}
              path={`${path}.${k}`}
              keyName={k}
              value={v}
              onChange={newVal => updateKey(k, newVal)}
              depth={0}
            />
          ))}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: indent, marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(168,204,232,0.55)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(168,204,232,0.06)' }}>
          {label}
        </div>
        {entries.map(([k, v]) => (
          <StructuredField
            key={k}
            path={`${path}.${k}`}
            keyName={k}
            value={v}
            onChange={newVal => updateKey(k, newVal)}
            depth={0}
          />
        ))}
      </div>
    );
  }

  return null;
};

// ─── Page Templates ───────────────────────────────────────────────────────
const PAGE_TEMPLATES = [
  {
    id: 'community-group',
    label: 'Community Group / Guild',
    description: 'For choirs, guilds, sections, youth groups',
    icon: '👥',
    sections: [
      { id: 'intro', title: 'Introduction', data: { heading: '', body: '' } },
      { id: 'history', title: 'History', data: { heading: 'History', body: '' } },
      { id: 'leadership', title: 'Leadership', data: { heading: 'Leadership', body: '' } },
      { id: 'meetings', title: 'Meetings & Activities', data: { heading: 'Meetings & Activities', body: '' } },
      { id: 'join', title: 'How to Join', data: { heading: 'How to Join', body: '' } },
    ],
  },
  {
    id: 'event',
    label: 'Event Page',
    description: 'For special events, festivals, celebrations',
    icon: '📅',
    sections: [
      { id: 'overview', title: 'Event Overview', data: { heading: '', date: '', location: '', body: '' } },
      { id: 'program', title: 'Programme', data: { heading: 'Programme', body: '' } },
      { id: 'contact', title: 'Contact & RSVP', data: { heading: 'Contact & RSVP', body: '', email: '', phone: '' } },
    ],
  },
  {
    id: 'info-page',
    label: 'Information Page',
    description: 'General information, announcements, programmes',
    icon: '📄',
    sections: [
      { id: 'main', title: 'Main Content', data: { heading: '', body: '' } },
      { id: 'details', title: 'Details', data: { heading: '', body: '' } },
    ],
  },
  {
    id: 'blank',
    label: 'Blank Page',
    description: 'Start from scratch',
    icon: '✏️',
    sections: [],
  },
];

// ─── Main Editor Component ─────────────────────────────────────────────────
const PageEditorWYSIWYG = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getPageById, createPage, updatePage, submitPageForApproval, isSuperAdmin, media, documents, videoLinks } = useAuth();

  const isNew = !id || id === 'new';
  const copyFromId = searchParams.get('copyFrom');

  const [pageData, setPageData] = useState(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Media attachments
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedDocuments, setAttachedDocuments] = useState([]);
  const [attachedVideos, setAttachedVideos] = useState([]);
  const [attachTab, setAttachTab] = useState('images'); // 'images' | 'documents' | 'videos'

  const approvedImages = (media || []).filter(m => m.url && m.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
  const approvedDocuments = (documents || []).filter(d => d.status === 'approved');
  const approvedVideos = (videoLinks || []).filter(v => v.status === 'approved');

  // Editor mode: 'sections' | 'structured' | 'text'
  const [editorMode, setEditorMode] = useState('sections');
  const [sections, setSections] = useState([]);            // for sections mode
  const [structuredData, setStructuredData] = useState({}); // for structured mode
  const [textContent, setTextContent] = useState('');       // for plain text mode

  const detectAndLoad = rawStr => {
    if (!rawStr) {
      setEditorMode('sections');
      setSections([]);
      return;
    }
    try {
      const parsed = JSON.parse(rawStr);
      if (Array.isArray(parsed)) {
        setSections(parsed);
        setEditorMode('sections');
      } else if (parsed && typeof parsed === 'object') {
        setStructuredData(parsed);
        setEditorMode('structured');
      } else {
        setTextContent(rawStr);
        setEditorMode('text');
      }
    } catch {
      setTextContent(rawStr);
      setEditorMode('text');
    }
  };

  const getContent = () => {
    if (editorMode === 'sections') return JSON.stringify(sections);
    if (editorMode === 'structured') return JSON.stringify(structuredData);
    return textContent;
  };

  useEffect(() => {
    if (!isNew) {
      const p = getPageById(parseInt(id));
      if (p) {
        setPageData(p);
        setTitle(p.title || '');
        detectAndLoad(p.content || '');
        setAttachedImages(Array.isArray(p.attached_images) ? p.attached_images : []);
        setAttachedDocuments(Array.isArray(p.attached_documents) ? p.attached_documents : []);
        setAttachedVideos(Array.isArray(p.attached_videos) ? p.attached_videos : []);
      }
    } else if (copyFromId) {
      const source = getPageById(parseInt(copyFromId));
      if (source) {
        setTitle('Copy of ' + source.title);
        detectAndLoad(source.content || '');
      }
    }
  }, [id, copyFromId, isNew, getPageById]);

  const updateFieldValue = useCallback((sectionIdx, fieldId, newValue) => {
    setSections(prev => prev.map((s, i) =>
      i !== sectionIdx ? s : { ...s, data: { ...s.data, [fieldId]: newValue } }
    ));
  }, []);

  const generateSlug = t =>
    (t || 'untitled-page')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-').replace(/^-|-$/g, '') || `page-${Date.now()}`;

  const mediaPayload = () => ({
    attached_documents: attachedDocuments,
    attached_videos: attachedVideos,
  });

  const buildSlug = resolvedTitle =>
    copyFromId
      ? `${generateSlug(resolvedTitle)}-${Date.now()}`
      : generateSlug(resolvedTitle);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const content = getContent();
      if (isNew) {
        const resolvedTitle = title || 'Untitled Page';
        const created = await createPage({ title: resolvedTitle, slug: buildSlug(resolvedTitle), content, status: 'draft', ...mediaPayload() });
        if (created?.id) navigate(`/admin/pages/wysiwyg/${created.id}`, { replace: true });
      } else {
        await updatePage(pageData.id, { title, content, ...mediaPayload() });
      }
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error saving';
      setSaveMsg(msg);
      setTimeout(() => setSaveMsg(''), 6000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const content = getContent();
      let targetId = pageData?.id;
      if (isNew) {
        const resolvedTitle = title || 'Untitled Page';
        const created = await createPage({ title: resolvedTitle, slug: buildSlug(resolvedTitle), content, status: 'draft', ...mediaPayload() });
        targetId = created?.id;
      } else {
        await updatePage(pageData.id, { title, content, ...mediaPayload() });
        targetId = pageData.id;
      }
      if (targetId) {
        await submitPageForApproval(targetId);
        navigate('/admin/pages');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error submitting';
      setSaveMsg(msg);
      setTimeout(() => setSaveMsg(''), 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const isImageField = (fieldId, value) => {
    if (!value) return false;
    const lower = fieldId.toLowerCase();
    if (lower.includes('image') || lower.includes('photo') || lower.includes('banner')) return true;
    if (typeof value === 'string' && (value.startsWith('/uploads/') || value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i))) return true;
    return false;
  };
  const isMultilineField = fieldId => {
    const lower = fieldId.toLowerCase();
    return lower.includes('desc') || lower.includes('content') || lower.includes('body') || lower.includes('text') || lower.includes('about') || lower.includes('summary');
  };

  const handleAddSection = () => {
    setSections(prev => [...prev, { id: `section-${Date.now()}`, title: 'New Section', data: { heading: '', body: '' } }]);
  };
  const handleDeleteSection = idx => setSections(prev => prev.filter((_, i) => i !== idx));
  const handleSectionTitleChange = (idx, val) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, title: val } : s));
  const handleAddField = idx => {
    setSections(prev => prev.map((s, i) => i !== idx ? s : { ...s, data: { ...s.data, [`field_${Date.now()}`]: '' } }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .wyg-root { min-height: 100vh; background: var(--theme-bg); font-family: 'Inter', sans-serif; }

        .wyg-toolbar {
          position: sticky; top: 0; z-index: 100;
          background: var(--theme-bg, #12192a);
          border-bottom: 1px solid var(--theme-border, rgba(168,204,232,0.1));
          padding: 12px 28px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          backdrop-filter: blur(8px);
        }
        .wyg-toolbar-title {
          font-family: 'Cinzel', serif; font-size: 14px; font-weight: 600;
          color: var(--theme-text); flex: 1; min-width: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .wyg-btn {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; font-family: 'Inter', sans-serif;
          transition: all 0.15s; white-space: nowrap;
        }
        .wyg-btn-secondary { background: rgba(168,204,232,0.08); border: 1px solid rgba(168,204,232,0.15); color: var(--theme-text); }
        .wyg-btn-secondary:hover { background: rgba(168,204,232,0.14); }
        .wyg-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.4); color: #a8cce8; }
        .wyg-btn-primary:hover { background: rgba(42,96,153,0.55); }
        .wyg-btn-green { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.3); color: #4ade80; }
        .wyg-btn-green:hover { background: rgba(22,163,74,0.25); }
        .wyg-btn:disabled { opacity: 0.5; cursor: default; }
        .wyg-save-msg { font-size: 12px; color: #4ade80; }

        .wyg-hint {
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);
          border-radius: 8px; padding: 10px 16px; margin: 16px 28px 0;
          font-size: 12.5px; color: rgba(147,197,253,0.9);
          display: flex; align-items: center; gap: 8px;
        }

        .wyg-page-title-wrap { padding: 28px 28px 0; }
        .wyg-page-title-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 6px; }
        .wyg-page-title-input {
          width: 100%; background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.12); border-radius: 8px;
          padding: 12px 16px; font-size: 22px; font-family: 'Cinzel', serif;
          font-weight: 600; color: var(--theme-text); outline: none; transition: border-color 0.18s;
        }
        .wyg-page-title-input:focus { border-color: rgba(42,96,153,0.4); }

        .wyg-body { padding: 28px; }

        /* Sections editor */
        .wyg-sections { display: flex; flex-direction: column; gap: 20px; }
        .wyg-section { background: rgba(255,255,255,0.025); border: 1px solid var(--theme-border, rgba(168,204,232,0.08)); border-radius: 12px; overflow: hidden; }
        .wyg-section-head { padding: 12px 16px; background: rgba(168,204,232,0.03); border-bottom: 1px solid var(--theme-border, rgba(168,204,232,0.06)); display: flex; align-items: center; justify-content: space-between; }
        .wyg-section-name-input { background: none; border: none; outline: none; font-size: 13px; font-weight: 600; color: var(--theme-text); font-family: 'Inter', sans-serif; width: 100%; cursor: text; padding: 0; }
        .wyg-section-name-input:focus { background: rgba(59,130,246,0.07); border-radius: 4px; padding: 2px 6px; }
        .wyg-section-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .wyg-field-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 5px; }
        .wyg-add-section-row { display: flex; gap: 10px; margin-top: 20px; }
        .wyg-section-del-btn { background: none; border: none; cursor: pointer; color: rgba(248,113,113,0.5); font-size: 12px; padding: 4px 8px; border-radius: 5px; font-family: 'Inter', sans-serif; transition: all 0.14s; }
        .wyg-section-del-btn:hover { background: rgba(220,38,38,0.08); color: #f87171; }
        .wyg-add-field-btn { font-size: 11px; color: rgba(96,165,250,0.6); background: none; border: 1px dashed rgba(96,165,250,0.2); border-radius: 5px; padding: 4px 10px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.14s; align-self: flex-start; }
        .wyg-add-field-btn:hover { background: rgba(59,130,246,0.07); color: #60a5fa; }

        /* Template picker */
        .wyg-tpl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
        @media (max-width: 600px) { .wyg-tpl-grid { grid-template-columns: 1fr; } }
        .wyg-tpl-card {
          background: rgba(255,255,255,0.025); border: 1.5px solid rgba(168,204,232,0.1);
          border-radius: 12px; padding: 20px; cursor: pointer;
          transition: all 0.16s; text-align: left;
        }
        .wyg-tpl-card:hover { border-color: rgba(42,96,153,0.5); background: rgba(42,96,153,0.08); transform: translateY(-2px); }
        .wyg-tpl-icon { font-size: 28px; margin-bottom: 10px; }
        .wyg-tpl-name { font-size: 14px; font-weight: 600; color: var(--theme-text); margin-bottom: 5px; }
        .wyg-tpl-desc { font-size: 12px; color: var(--theme-text-muted); }
        .wyg-tpl-sections { font-size: 11px; color: rgba(168,204,232,0.3); margin-top: 8px; }
        .wyg-tpl-heading { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 600; color: rgba(168,204,232,0.5); letter-spacing: 0.05em; margin-bottom: 16px; }

        /* Structured editor */
        .wyg-structured { background: rgba(255,255,255,0.025); border: 1px solid rgba(168,204,232,0.08); border-radius: 12px; padding: 24px; }
        .wyg-structured-header { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(168,204,232,0.35); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .wyg-structured-header::after { content: ''; flex: 1; height: 1px; background: rgba(168,204,232,0.07); }

        /* Text editor */
        .wyg-text-area { width: 100%; min-height: 400px; background: rgba(168,204,232,0.04); border: 1px solid rgba(168,204,232,0.12); border-radius: 8px; padding: 16px; color: var(--theme-text); font-size: 14px; font-family: 'Inter', sans-serif; outline: none; resize: vertical; line-height: 1.7; }
        .wyg-text-area:focus { border-color: rgba(42,96,153,0.5); }

        .wyg-empty { padding: 60px 28px; text-align: center; color: var(--theme-text-muted); font-size: 14px; }

        /* Attachment panel */
        .wyg-attach-panel { margin-top: 32px; border: 1px solid rgba(168,204,232,0.08); border-radius: 12px; overflow: hidden; }
        .wyg-attach-header { padding: 14px 20px; background: rgba(168,204,232,0.03); border-bottom: 1px solid rgba(168,204,232,0.07); display: flex; align-items: center; gap: 12px; }
        .wyg-attach-title { font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(168,204,232,0.5); flex: 1; }
        .wyg-attach-tabs { display: flex; gap: 4px; }
        .wyg-attach-tab { padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; font-family: 'Inter', sans-serif; transition: all 0.14s; color: var(--theme-text-muted); background: none; }
        .wyg-attach-tab.active { background: rgba(27,58,107,0.5); border-color: rgba(42,96,153,0.35); color: #a8cce8; }
        .wyg-attach-tab:hover:not(.active) { background: rgba(168,204,232,0.06); }
        .wyg-attach-body { padding: 16px 20px; }
        .wyg-attach-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }
        .wyg-attach-img-item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.14s; }
        .wyg-attach-img-item.selected { border-color: #3b82f6; }
        .wyg-attach-img-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .wyg-attach-check { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; }
        .wyg-attach-doc-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; border: 1px solid rgba(168,204,232,0.08); transition: all 0.14s; }
        .wyg-attach-doc-item.selected { border-color: #3b82f6; background: rgba(59,130,246,0.07); }
        .wyg-attach-doc-item:hover:not(.selected) { background: rgba(168,204,232,0.04); }
        .wyg-attach-doc-icon { font-size: 20px; }
        .wyg-attach-doc-name { font-size: 12.5px; color: var(--theme-text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wyg-attach-doc-check { color: #3b82f6; font-size: 14px; }
        .wyg-attach-empty { text-align: center; padding: 24px; font-size: 12.5px; color: var(--theme-text-muted); }
        .wyg-attach-selected-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .wyg-attach-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; background: rgba(27,58,107,0.4); border: 1px solid rgba(42,96,153,0.25); font-size: 11.5px; color: #a8cce8; }
        .wyg-attach-pill-remove { background: none; border: none; cursor: pointer; color: rgba(248,113,113,0.6); font-size: 13px; padding: 0; line-height: 1; }
        .wyg-attach-pill-remove:hover { color: #f87171; }
      `}</style>

      <div className="wyg-root">
        {/* Toolbar */}
        <div className="wyg-toolbar">
          <Link to="/admin/pages" className="wyg-btn wyg-btn-secondary" style={{ textDecoration: 'none' }}>← Back</Link>
          <span className="wyg-toolbar-title">
            {isNew ? (copyFromId ? 'New Page (from template)' : 'New Page') : `Editing: ${title}`}
          </span>
          {saveMsg && <span className="wyg-save-msg">{saveMsg}</span>}
          <button className="wyg-btn wyg-btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {!isSuperAdmin() && (
            <button className="wyg-btn wyg-btn-green" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
          )}
        </div>

        {/* Hint */}
        <div className="wyg-hint">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {editorMode === 'structured'
            ? 'Edit any field below and click Save Draft. Submit for Approval to push changes live.'
            : 'Double-click any text field to edit it. Click outside (or press Enter) to save the change in place.'}
        </div>

        {/* Page Title */}
        <div className="wyg-page-title-wrap">
          <div className="wyg-page-title-label">Page Title</div>
          <input
            className="wyg-page-title-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter page title…"
          />
        </div>

        <div className="wyg-body">

          {/* ── Structured JSON Form Editor ── */}
          {editorMode === 'structured' && (
            <div className="wyg-structured">
              <div className="wyg-structured-header">Page Content</div>
              {Object.entries(structuredData).map(([key, val]) => (
                <StructuredField
                  key={key}
                  path={key}
                  keyName={key}
                  value={val}
                  onChange={newVal => setStructuredData(prev => ({ ...prev, [key]: newVal }))}
                  depth={0}
                />
              ))}
            </div>
          )}

          {/* ── Sections Editor ── */}
          {editorMode === 'sections' && (
            <>
              <div className="wyg-sections">
                {sections.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(168,204,232,0.08)', borderRadius: 12, padding: '32px 28px' }}>
                    <div className="wyg-tpl-heading">Choose a starting template</div>
                    <div className="wyg-tpl-grid">
                      {PAGE_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          className="wyg-tpl-card"
                          onClick={() => {
                            const seeded = tpl.sections.map((s, i) => ({
                              ...s,
                              id: `${s.id}-${Date.now()}-${i}`,
                            }));
                            setSections(seeded);
                          }}
                        >
                          <div className="wyg-tpl-icon">{tpl.icon}</div>
                          <div className="wyg-tpl-name">{tpl.label}</div>
                          <div className="wyg-tpl-desc">{tpl.description}</div>
                          {tpl.sections.length > 0 && (
                            <div className="wyg-tpl-sections">
                              {tpl.sections.map(s => s.title).join(' · ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  sections.map((section, sIdx) => {
                    const fields = Object.entries(section.data || {});
                    return (
                      <div key={section.id || sIdx} className="wyg-section">
                        <div className="wyg-section-head">
                          <input
                            className="wyg-section-name-input"
                            value={section.title || `Section ${sIdx + 1}`}
                            onChange={e => handleSectionTitleChange(sIdx, e.target.value)}
                            title="Click to rename section"
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                            <button className="wyg-section-del-btn" onClick={() => handleDeleteSection(sIdx)}>✕</button>
                          </div>
                        </div>
                        <div className="wyg-section-body">
                          {fields.map(([fieldId, value]) => (
                            <div key={fieldId}>
                              <div className="wyg-field-label">{fieldId.replace(/_/g, ' ')}</div>
                              {isImageField(fieldId, value) ? (
                                <EditableImage value={value} onCommit={nv => updateFieldValue(sIdx, fieldId, nv)} />
                              ) : (
                                <EditableField
                                  value={value}
                                  multiline={isMultilineField(fieldId)}
                                  onCommit={nv => updateFieldValue(sIdx, fieldId, nv)}
                                  placeholder={`Enter ${fieldId.replace(/_/g, ' ')}…`}
                                />
                              )}
                            </div>
                          ))}
                          <button className="wyg-add-field-btn" onClick={() => handleAddField(sIdx)}>+ Add Field</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {sections.length > 0 && (
                <div className="wyg-add-section-row">
                  <button className="wyg-btn wyg-btn-secondary" onClick={handleAddSection} style={{ fontSize: 12 }}>+ Add Section</button>
                </div>
              )}
            </>
          )}

          {/* ── Plain Text Editor ── */}
          {editorMode === 'text' && (
            <div>
              <div className="wyg-page-title-label" style={{ marginBottom: 8 }}>Page Content</div>
              <textarea
                className="wyg-text-area"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Enter page content…"
              />
            </div>
          )}

          {/* ── Attachments Panel ── */}
          <div className="wyg-attach-panel">
            <div className="wyg-attach-header">
              <span className="wyg-attach-title">Attachments</span>
              <div className="wyg-attach-tabs">
                {['images', 'documents', 'videos'].map(tab => (
                  <button key={tab} type="button"
                    className={`wyg-attach-tab${attachTab === tab ? ' active' : ''}`}
                    onClick={() => setAttachTab(tab)}
                  >
                    {tab === 'images' ? `Images (${attachedImages.length})` : tab === 'documents' ? `Docs (${attachedDocuments.length})` : `Videos (${attachedVideos.length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="wyg-attach-body">

              {attachTab === 'images' && (
                <>
                  {approvedImages.length === 0 ? (
                    <div className="wyg-attach-empty">No images in media library yet.</div>
                  ) : (
                    <div className="wyg-attach-grid">
                      {approvedImages.map(img => {
                        const sel = attachedImages.includes(img.url);
                        return (
                          <div key={img.id || img.url}
                            className={`wyg-attach-img-item${sel ? ' selected' : ''}`}
                            onClick={() => setAttachedImages(prev => sel ? prev.filter(u => u !== img.url) : [...prev, img.url])}
                            title={img.name || img.url}
                          >
                            <img src={getFullUrl(img.url)} alt={img.name || ''} />
                            {sel && <div className="wyg-attach-check">✓</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {attachTab === 'documents' && (
                <>
                  {approvedDocuments.length === 0 ? (
                    <div className="wyg-attach-empty">No approved documents available.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {approvedDocuments.map(doc => {
                        const sel = attachedDocuments.some(d => d.id === doc.id);
                        return (
                          <div key={doc.id}
                            className={`wyg-attach-doc-item${sel ? ' selected' : ''}`}
                            onClick={() => setAttachedDocuments(prev => sel
                              ? prev.filter(d => d.id !== doc.id)
                              : [...prev, { id: doc.id, name: doc.name, url: doc.url, type: doc.type }]
                            )}
                          >
                            <span className="wyg-attach-doc-icon">📄</span>
                            <span className="wyg-attach-doc-name">{doc.name || doc.original_name}</span>
                            {sel && <span className="wyg-attach-doc-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {attachTab === 'videos' && (
                <>
                  {approvedVideos.length === 0 ? (
                    <div className="wyg-attach-empty">No approved video links available.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {approvedVideos.map(vid => {
                        const sel = attachedVideos.some(v => v.id === vid.id);
                        return (
                          <div key={vid.id}
                            className={`wyg-attach-doc-item${sel ? ' selected' : ''}`}
                            onClick={() => setAttachedVideos(prev => sel
                              ? prev.filter(v => v.id !== vid.id)
                              : [...prev, { id: vid.id, title: vid.title, url: vid.url, platform: vid.platform, thumbnail: vid.thumbnail }]
                            )}
                          >
                            <span className="wyg-attach-doc-icon">🎬</span>
                            <span className="wyg-attach-doc-name">{vid.title} <span style={{ fontSize: 10, opacity: 0.5 }}>({vid.platform})</span></span>
                            {sel && <span className="wyg-attach-doc-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Pills showing current selections */}
              {(attachedImages.length > 0 || attachedDocuments.length > 0 || attachedVideos.length > 0) && (
                <div className="wyg-attach-selected-pills" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(168,204,232,0.07)' }}>
                  <span style={{ fontSize: 11, color: 'rgba(168,204,232,0.35)', marginRight: 4 }}>ATTACHED:</span>
                  {attachedDocuments.map(d => (
                    <span key={d.id} className="wyg-attach-pill">📄 {d.name}
                      <button className="wyg-attach-pill-remove" onClick={() => setAttachedDocuments(prev => prev.filter(x => x.id !== d.id))}>×</button>
                    </span>
                  ))}
                  {attachedVideos.map(v => (
                    <span key={v.id} className="wyg-attach-pill">🎬 {v.title}
                      <button className="wyg-attach-pill-remove" onClick={() => setAttachedVideos(prev => prev.filter(x => x.id !== v.id))}>×</button>
                    </span>
                  ))}
                  {attachedImages.length > 0 && (
                    <span className="wyg-attach-pill">🖼 {attachedImages.length} image{attachedImages.length !== 1 ? 's' : ''}
                      <button className="wyg-attach-pill-remove" onClick={() => setAttachedImages([])}>×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PageEditorWYSIWYG;
