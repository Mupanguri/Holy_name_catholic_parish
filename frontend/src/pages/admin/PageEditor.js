import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  PAGE_TEMPLATES,
  PAGE_PATHS,
  getAllTemplates,
  getTemplateAllowedPaths,
} from '../../config/pageTemplates';
import { BRANCHES } from '../../constants/CMSConstants';
import { getFullUrl } from '../../services/api';

// Hierarchical Select Component for Page Paths
const HierarchicalSelect = ({ options, value, onChange, label }) => {
  const renderOptions = (opts, level = 0) => {
    return opts.map((option, idx) => (
      <React.Fragment key={`${option.value}-${idx}`}>
        <option value={option.value} style={{ paddingLeft: `${level * 20}px` }}>
          {'—'.repeat(level)} {option.label}
        </option>
        {option.children && option.children.length > 0 && renderOptions(option.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="page-root">
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
      <label className="pe-label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="pe-input">
        <option value="">Select where page should appear...</option>
        {renderOptions(options)}
      </select>
    </div>
  );
};

const renderPageTreeOptions = (pages, level = 0) => {
  return pages.map(page => (
    <React.Fragment key={page.id}>
      <option value={page.id} style={{ paddingLeft: `${level * 20}px` }}>
        {'—'.repeat(level)} {page.title}
      </option>
      {page.children && page.children.length > 0 && renderPageTreeOptions(page.children, level + 1)}
    </React.Fragment>
  ));
};

const TemplateCard = ({ template, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '16px 18px',
      border: `1px solid ${isSelected ? 'rgba(42,96,153,0.5)' : 'var(--theme-border)'}`,
      borderRadius: 10,
      cursor: 'pointer',
      background: isSelected ? 'rgba(42,96,153,0.12)' : 'rgba(255,255,255,0.025)',
      transition: 'all 0.16s',
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(42,96,153,0.3)'; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--theme-border)'; }}
  >
    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 5 }}>{template.name}</div>
    <div style={{ fontSize: 12.5, color: 'var(--theme-text-muted)', lineHeight: 1.5 }}>{template.description}</div>
    <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(168,204,232,0.25)', fontFamily: 'monospace' }}>{template.path}</div>
  </div>
);

const SectionEditor = ({
  section,
  data,
  onChange,
  onRemove,
  index,
  totalSections,
  imageFiles = [],
  getFullUrl,
}) => {
  const handleFieldChange = (fieldId, value) => {
    onChange(section.id, fieldId, value);
  };

const handleAddField = () => {
    const newFieldId = `custom_${Date.now()}`;
    onChange(section.id, 'addField', { id: newFieldId, type: 'text', label: 'New Field' });
  };

  return (
    <div className="pe-section-card">
      <div className="pe-section-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pe-section-num">{index + 1}</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--theme-text)' }}>{section.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {index > 0 && (
            <button type="button" className="pe-section-ctrl" title="Move Up">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18,15 12,9 6,15" /></svg>
            </button>
          )}
          {index < totalSections - 1 && (
            <button type="button" className="pe-section-ctrl" title="Move Down">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6,9 12,15 18,9" /></svg>
            </button>
          )}
          <button type="button" onClick={() => onRemove(section.id)} className="pe-section-ctrl pe-section-ctrl-del" title="Remove Section">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {section.fields &&
        section.fields.map(field => {
          const fieldValue = data?.[field.id] || '';

          if (field.type === 'text') {
            return (
              <div key={field.id} className="pe-field">
                <label className="pe-label">{field.label} {field.required && <span style={{ color: '#f87171' }}>*</span>}</label>
                <input
                  type="text"
                  value={fieldValue}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className="pe-input"
                  required={field.required}
                />
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.id} className="pe-field">
                <label className="pe-label">{field.label} {field.required && <span style={{ color: '#f87171' }}>*</span>}</label>
                <textarea
                  value={fieldValue}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  rows={4}
                  className="pe-input"
                  required={field.required}
                  style={{ resize: 'vertical' }}
                />
              </div>
            );
          }

          if (field.type === 'image') {
            return (
              <div key={field.id} className="pe-field">
                <label className="pe-label">{field.label}</label>
                <div className="pe-img-zone">
                  {fieldValue ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={getFullUrl ? getFullUrl(fieldValue) : fieldValue} alt="Uploaded" style={{ maxHeight: 120, borderRadius: 8, display: 'block' }} />
                      <button
                        type="button"
                        onClick={() => handleFieldChange(field.id, '')}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#dc2626', border: 'none', color: '#fff',
                          cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {imageFiles.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 11.5, color: 'var(--theme-text-muted)', marginBottom: 8 }}>Select from library:</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                            {imageFiles.slice(0, 8).map(img => (
                              <div
                                key={img.id}
                                onClick={() => handleFieldChange(field.id, img.url)}
                                style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(168,204,232,0.1)' }}
                              >
                                <img src={getFullUrl ? getFullUrl(img.url) : img.url} alt={img.name} style={{ width: '100%', height: 48, objectFit: 'cover', display: 'block' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button type="button" style={{ fontSize: 12.5, color: 'rgba(96,165,250,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Click to upload image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}

      <button type="button" onClick={handleAddField} className="pe-add-field-btn">
        + Add Field
      </button>
    </div>
  );
};

const DuplicateCheckModal = ({ isOpen, pageName, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#12192a', border: '1px solid rgba(168,204,232,0.1)',
        borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', margin: '0 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 10, fontFamily: 'Cinzel, serif' }}>Page Already Exists</h3>
        <p style={{ fontSize: 13.5, color: 'var(--theme-text-muted)', marginBottom: 22, lineHeight: 1.6 }}>
          A page named "<strong style={{ color: 'var(--theme-text)' }}>{pageName}</strong>" already exists. Would you like to edit the existing page?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--theme-border)', border: '1px solid rgba(168,204,232,0.1)', color: 'rgba(168,204,232,0.55)', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            No, Change Name
          </button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(27,58,107,0.7)', border: '1px solid rgba(42,96,153,0.3)', color: '#a8cce8', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            Yes, Edit Existing
          </button>
        </div>
      </div>
    </div>
  );
};

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getPageById,
    createPage,
    updatePage,
    submitPageForApproval,
    currentUser,
    getAllPages,
    getPageTree,
    media,
  } = useAuth();
  const isNew = !id;

  const imageFiles = (media || []).filter(
    m => m.url && (m.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || m.url.includes('/uploads/'))
  );
  const documentFiles = (media || []).filter(
    m => m.url && (m.url.match(/\.(pdf|doc|docx)$/i) || m.url.includes('/uploads/'))
  );

  useEffect(() => {
    if (currentUser && currentUser.role === ROLES.SUPER_ADMIN) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    path: '',
    content: '',
    sections: [],
    changeDescription: '',
    parentId: null,
    branch: '',
  });

  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingPageId, setExistingPageId] = useState(null);
  const [nameError, setNameError] = useState('');
  const [pageTree, setPageTree] = useState([]);

  useEffect(() => {
    const loadPageTree = async () => {
      if (isNew) {
        const tree = await getPageTree();
        setPageTree(tree || []);
      }
    };
    loadPageTree();
  }, [isNew, getPageTree]);

  useEffect(() => {
    if (!isNew) {
      const page = getPageById(id);
      if (page) {
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          path: page.path || '',
          content: page.content || '',
          sections: page.sections || [],
          changeDescription: '',
          branch: page.branch || '',
        });
        const template = getAllTemplates().find(t => t.path === page.path);
        if (template) setSelectedTemplate(template);
      }
    }
  }, [id, isNew, getPageById]);

  const handleTemplateSelect = template => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      path: template.path,
      sections: template.sections.map(section => ({
        id: section.id,
        label: section.label,
        data: {},
        fields: [],
      })),
    }));
  };

  const handleTitleChange = value => {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, title: value, slug }));

    if (value.trim()) {
      const allPages = getAllPages();
      const existing = allPages.find(
        p => p.title?.toLowerCase() === value.toLowerCase() || p.slug === slug
      );
      if (existing) {
        setExistingPageId(existing.id);
        setShowDuplicateModal(true);
        setNameError('Page name already exists');
      } else {
        setNameError('');
        setExistingPageId(null);
      }
    }
  };

  const getPreviewUrl = () => {
    if (formData.parentId && pageTree.length > 0) {
      const findParent = (pages, parentId) => {
        for (const page of pages) {
          if (page.id === parentId) return page;
          if (page.children) {
            const found = findParent(page.children, parentId);
            if (found) return found;
          }
        }
        return null;
      };
      const parent = findParent(pageTree, formData.parentId);
      if (parent) return `/${parent.slug}/${formData.slug}`;
    }
    return formData.slug ? `/${formData.slug}` : '';
  };

  const handleSectionChange = (sectionId, fieldId, value) => {
    setFormData(prev => {
      const newSections = prev.sections.map(section => {
        if (section.id === sectionId) {
          if (fieldId === 'addField') {
            const newField = value;
            const currentSection = selectedTemplate?.sections.find(s => s.id === sectionId) || section;
            const existingFields = currentSection.fields || [];
            const fieldExists = existingFields.some(f => f.id === newField.id);
            if (fieldExists) return section;
            return {
              ...section,
              data: { ...section.data },
              fields: [...existingFields, { id: newField.id, label: newField.label || 'New Field', type: newField.type || 'text' }],
            };
          }
          return { ...section, data: { ...section.data, [fieldId]: value } };
        }
        return section;
      });
      return { ...prev, sections: newSections };
    });
  };

  const handleSectionRemove = sectionId => {
    setFormData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
  };

  const handleAddSection = () => {
    if (!selectedTemplate) return;
    const newSectionId = `custom_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: newSectionId, label: 'New Section', data: {}, fields: [{ id: 'content', label: 'Content', type: 'textarea' }] },
      ],
    }));
  };

  const handleSave = async (submitToApproval = false) => {
    if (!formData.title.trim()) { setNameError('Page title is required'); return; }
    if (!selectedTemplate) { alert('Please select a template'); return; }
    if (!formData.path) { alert('Please select a page path'); return; }

    const templateAllowedPaths = getTemplateAllowedPaths(selectedTemplate);
    const isPathValid = templateAllowedPaths.some(allowedPath => formData.path.startsWith(allowedPath));
    if (!isPathValid) { alert(`This template only allows paths under: ${selectedTemplate.path}`); return; }
    if (!isNew && !formData.changeDescription.trim()) { alert('Please provide a description of changes'); return; }

    setSaving(true);
    const pageData = { ...formData, content: JSON.stringify(formData.sections), templateId: selectedTemplate?.id };

    try {
      if (isNew) {
        const newPage = await createPage(pageData);
        if (!newPage || !newPage.id) { setSaving(false); return; }
        if (submitToApproval && newPage) await submitPageForApproval(newPage.id, formData.changeDescription || '');
      } else {
        await updatePage(id, pageData);
        if (submitToApproval) await submitPageForApproval(id, formData.changeDescription || '');
      }
      navigate('/admin/pages');
    } catch (error) {
      console.error('Error saving page:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error saving page. Please try again.';
      alert(errorMessage);
    }
    setSaving(false);
  };

  const page = !isNew ? getPageById(id) : null;

  // Template selection screen
  if (isNew && !selectedTemplate) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          .pe-tmpl-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }
          .pe-back { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--theme-text-muted); text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
          .pe-back:hover { color: rgba(168,204,232,0.8); }
          .pe-page-title { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 5px; }
          .pe-page-sub { font-size: 13px; color: var(--theme-text-muted); margin-bottom: 30px; }
          .pe-cat-title { font-family: 'Cinzel', serif; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(168,204,232,0.25); margin-bottom: 12px; display: flex; align-items: center; gap: 12px; }
          .pe-cat-title::after { content: ''; flex: 1; height: 1px; background: var(--theme-border); }
          .pe-cat-section { margin-bottom: 32px; }
          .pe-tmpl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          @media (max-width: 900px) { .pe-tmpl-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 600px) { .pe-tmpl-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="pe-tmpl-root">
          <Link to="/admin/pages" className="pe-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
            Back to Pages
          </Link>
          <div className="pe-page-title">Create New Page</div>
          <div className="pe-page-sub">Select a template to get started</div>
          {Object.entries(PAGE_TEMPLATES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="pe-cat-section">
              <div className="pe-cat-title">{category.label}</div>
              <div className="pe-tmpl-grid">
                {category.templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onClick={() => handleTemplateSelect(template)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Main editor
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .pe-root { padding: 28px; font-family: 'Inter', sans-serif; color: var(--theme-text); min-height: 100vh; background: var(--theme-bg); }

        .pe-back { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--theme-text-muted); text-decoration: none; margin-bottom: 16px; transition: color 0.15s; }
        .pe-back:hover { color: rgba(168,204,232,0.8); }

        .pe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .pe-page-title { font-family: 'Cinzel', serif; font-size: 19px; font-weight: 600; color: var(--theme-text); letter-spacing: 0.02em; }

        .pe-header-actions { display: flex; gap: 10px; }
        .pe-btn {
          padding: 10px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          cursor: pointer; border: none;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .pe-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pe-btn-secondary { background: var(--theme-border); border: 1px solid rgba(168,204,232,0.1); color: rgba(168,204,232,0.6); }
        .pe-btn-secondary:hover:not(:disabled) { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.9); }
        .pe-btn-primary { background: rgba(27,58,107,0.7); border: 1px solid rgba(42,96,153,0.3); color: #a8cce8; }
        .pe-btn-primary:hover:not(:disabled) { background: rgba(42,96,153,0.5); }

        .pe-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        @media (max-width: 900px) { .pe-grid { grid-template-columns: 1fr; } }

        .pe-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 12px; padding: 18px 20px;
          margin-bottom: 14px;
        }

        .pe-field { margin-bottom: 14px; }
        .pe-label {
          display: block; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--theme-text-muted); margin-bottom: 7px;
        }
        .pe-input {
          width: 100%; background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1); border-radius: 8px;
          padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
          font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .pe-input::placeholder { color: rgba(168,204,232,0.2); }
        .pe-input:focus { border-color: rgba(42,96,153,0.5); box-shadow: 0 0 0 3px rgba(42,96,153,0.1); }
        .pe-input.error { border-color: rgba(220,38,38,0.4); background: rgba(220,38,38,0.04); }

        .pe-slug-hint {
          margin-top: 8px; font-size: 12px; color: rgba(168,204,232,0.3);
        }
        .pe-slug-code {
          font-family: monospace; font-size: 12px;
          background: var(--theme-border); border-radius: 4px;
          padding: 2px 7px; color: rgba(168,204,232,0.55);
        }
        .pe-error-msg { font-size: 12px; color: #f87171; margin-top: 6px; }

        .pe-content-title {
          font-size: 14px; font-weight: 600; color: var(--theme-text);
          margin-bottom: 14px; margin-top: 4px;
        }

        .pe-section-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 10px; padding: 16px; margin-bottom: 10px;
        }
        .pe-section-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px;
        }
        .pe-section-num {
          width: 22px; height: 22px; border-radius: 6px;
          background: rgba(42,96,153,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #a8cce8;
          flex-shrink: 0;
        }
        .pe-section-ctrl {
          width: 26px; height: 26px; border-radius: 6px;
          background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1);
          color: var(--theme-text-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.14s;
        }
        .pe-section-ctrl:hover { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.8); }
        .pe-section-ctrl-del:hover { background: rgba(220,38,38,0.1) !important; color: #f87171 !important; border-color: rgba(220,38,38,0.2) !important; }

        .pe-add-field-btn {
          margin-top: 10px; font-size: 12.5px;
          color: rgba(96,165,250,0.6); background: none; border: none;
          cursor: pointer; padding: 0; font-family: 'Inter', sans-serif;
          transition: color 0.15s;
        }
        .pe-add-field-btn:hover { color: #60a5fa; }

        .pe-add-section-btn {
          width: 100%; padding: 14px;
          border: 1.5px dashed rgba(168,204,232,0.12);
          border-radius: 10px;
          background: none; cursor: pointer;
          color: rgba(168,204,232,0.3);
          font-size: 13px; font-family: 'Inter', sans-serif;
          transition: all 0.16s;
        }
        .pe-add-section-btn:hover {
          border-color: rgba(42,96,153,0.4);
          color: rgba(168,204,232,0.7);
          background: rgba(42,96,153,0.05);
        }

        .pe-no-sections {
          padding: 32px; text-align: center;
          border: 1px dashed var(--theme-border); border-radius: 10px;
          color: rgba(168,204,232,0.25); font-size: 13px; margin-bottom: 12px;
        }

        .pe-img-zone {
          border: 1.5px dashed rgba(168,204,232,0.12);
          border-radius: 9px; padding: 16px;
          background: rgba(168,204,232,0.02);
        }

        .pe-tips {
          background: rgba(42,96,153,0.06);
          border: 1px solid rgba(42,96,153,0.15);
          border-radius: 10px; padding: 16px;
        }
        .pe-tips-title { font-size: 12px; font-weight: 600; color: rgba(168,204,232,0.6); margin-bottom: 10px; }
        .pe-tips-list { list-style: none; padding: 0; margin: 0; }
        .pe-tips-list li { font-size: 12px; color: var(--theme-text-muted); padding: 3px 0; }

        .pe-tmpl-name { font-size: 13.5px; font-weight: 600; color: #a8cce8; margin-bottom: 5px; }
        .pe-tmpl-desc { font-size: 12px; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px; }
        .pe-tmpl-change { font-size: 12px; color: #f87171; background: none; border: none; cursor: pointer; padding: 0; font-family: 'Inter', sans-serif; }
        .pe-tmpl-change:hover { text-decoration: underline; }
        .pe-empty-tmpl { font-size: 12.5px; color: rgba(168,204,232,0.25); }
      `}</style>

      <div className="pe-root">
        <Link to="/admin/pages" className="pe-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          Back to Pages
        </Link>

        <div className="pe-header">
          <div className="pe-page-title">
            {isNew ? `Create: ${selectedTemplate?.name}` : `Edit: ${page?.title}`}
          </div>
          <div className="pe-header-actions">
            <button onClick={() => handleSave(false)} disabled={saving} className="pe-btn pe-btn-secondary">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="pe-btn pe-btn-primary">
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>

        <div className="pe-grid">
          {/* Main */}
          <div>
            <div className="pe-card">
              <div className="pe-field">
                <label className="pe-label">Page Title <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className={`pe-input${nameError ? ' error' : ''}`}
                  placeholder="Enter page title"
                />
                {nameError && <div className="pe-error-msg">{nameError}</div>}
                <div className="pe-slug-hint">
                  URL: <span className="pe-slug-code">{getPreviewUrl()}</span>
                </div>
              </div>
            </div>

            <div className="pe-card">
              <HierarchicalSelect
                options={PAGE_PATHS}
                value={formData.path}
                onChange={value => setFormData(prev => ({ ...prev, path: value }))}
                label="Page Location (Path)"
              />
            </div>

            {!isNew && (
              <div className="pe-card">
                <div className="pe-field">
                  <label className="pe-label">Community Branch</label>
                  <p style={{ fontSize: 12, color: 'rgba(168,204,232,0.3)', marginBottom: 8, marginTop: -4 }}>
                    The branch this page belongs to (for community pages)
                  </p>
                  <select
                    value={formData.branch || ''}
                    onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                    className="pe-input"
                  >
                    <option value="">-- No Branch --</option>
                    {BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isNew && pageTree.length > 0 && (
              <div className="pe-card">
                <div className="pe-field">
                  <label className="pe-label">Create under existing page (optional)</label>
                  <p style={{ fontSize: 12, color: 'rgba(168,204,232,0.3)', marginBottom: 8, marginTop: -4 }}>
                    Select a parent page to nest this page under it. The URL will automatically extend from the parent.
                  </p>
                  <select
                    value={formData.parentId || ''}
                    onChange={e => {
                      const parentId = e.target.value ? parseInt(e.target.value) : null;
                      setFormData(prev => ({ ...prev, parentId }));
                    }}
                    className="pe-input"
                  >
                    <option value="">-- Create as root page (no parent) --</option>
                    {renderPageTreeOptions(pageTree)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <div className="pe-content-title">Page Content</div>
              {formData.sections.length === 0 ? (
                <div className="pe-no-sections">No sections yet. Select a template to load sections.</div>
              ) : (
                formData.sections.map((section, index) => {
                  const templateSection = selectedTemplate?.sections.find(s => s.id === section.id);
                  const customFields = section.fields || [];
                  const mergedSection = {
                    ...(templateSection || section),
                    id: section.id,
                    label: section.label,
                    fields: [...(templateSection?.fields || []), ...customFields],
                  };
                  return (
                    <SectionEditor
                      key={section.id}
                      section={mergedSection}
                      data={section.data}
                      onChange={handleSectionChange}
                      onRemove={handleSectionRemove}
                      index={index}
                      totalSections={formData.sections.length}
                      imageFiles={imageFiles}
                      getFullUrl={getFullUrl}
                    />
                  );
                })
              )}
              <button onClick={handleAddSection} className="pe-add-section-btn">
                + Add New Section
              </button>
            </div>

            {!isNew && (
              <div className="pe-card" style={{ marginTop: 14 }}>
                <div className="pe-field">
                  <label className="pe-label">Description of Changes <span style={{ color: '#f87171' }}>*</span></label>
                  <textarea
                    value={formData.changeDescription}
                    onChange={e => setFormData(prev => ({ ...prev, changeDescription: e.target.value }))}
                    rows={3}
                    className="pe-input"
                    placeholder="Describe what changes were made..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="pe-card">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'Cinzel, serif' }}>Template</div>
              {selectedTemplate ? (
                <div>
                  <div className="pe-tmpl-name">{selectedTemplate.name}</div>
                  <div className="pe-tmpl-desc">{selectedTemplate.description}</div>
                  <button onClick={() => setSelectedTemplate(null)} className="pe-tmpl-change">Change Template</button>
                </div>
              ) : (
                <div className="pe-empty-tmpl">No template selected</div>
              )}
            </div>

            <div className="pe-tips">
              <div className="pe-tips-title">Tips</div>
              <ul className="pe-tips-list">
                <li>Fill in each section like a form</li>
                <li>Use + Add Field to add more fields</li>
                <li>Use arrows to reorder sections</li>
                <li>Use X to remove a section</li>
              </ul>
            </div>
          </div>
        </div>

        <DuplicateCheckModal
          isOpen={showDuplicateModal}
          pageName={formData.title}
          onConfirm={() => {
            setShowDuplicateModal(false);
            if (existingPageId) navigate(`/admin/pages/edit/${existingPageId}`);
          }}
          onCancel={() => {
            setShowDuplicateModal(false);
            setNameError('Please change the page name');
          }}
        />
      </div>
    </>
  );
};

export default PageEditor;
