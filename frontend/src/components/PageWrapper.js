import React from 'react';
import { useAuth } from '../context/AuthContext';
import ComingSoon from './ComingSoon';

const renderValue = (val, key) => {
  if (typeof val === 'string' && val.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return <img key={key} src={val} alt={key} style={{ maxWidth: '100%', borderRadius: 8, margin: '8px 0' }} />;
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const tag = key === 'heading' ? 'h2' : key === 'subheading' ? 'h3' : 'p';
    return React.createElement(tag, { key, className: `pw-field pw-field-${key}` }, String(val));
  }
  if (Array.isArray(val)) {
    return (
      <ul key={key} className="pw-list">
        {val.map((item, i) => (
          <li key={i}>{typeof item === 'object' ? <StructuredBlock data={item} /> : String(item)}</li>
        ))}
      </ul>
    );
  }
  if (val && typeof val === 'object') {
    return <StructuredBlock key={key} data={val} />;
  }
  return null;
};

const StructuredBlock = ({ data }) => (
  <div className="pw-struct-block">
    {Object.entries(data).map(([k, v]) => renderValue(v, k))}
  </div>
);

const SectionsRenderer = ({ sections }) => (
  <div className="pw-sections">
    {sections.map((section) => (
      <section key={section.id} className="pw-section">
        {section.title && <h2 className="pw-section-title">{section.title}</h2>}
        {section.data && typeof section.data === 'object' && (
          <div className="pw-section-body">
            {Object.entries(section.data).map(([k, v]) => renderValue(v, k))}
          </div>
        )}
      </section>
    ))}
  </div>
);

const ObjectRenderer = ({ data }) => (
  <div className="pw-structured">
    <StructuredBlock data={data} />
  </div>
);

const parseContent = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const PageWrapper = ({ pageSlug, children }) => {
  const { getPublicPageBySlug, publicPages } = useAuth();
  const page = getPublicPageBySlug(pageSlug);

  if (!page) {
    // Public pages list has hydrated — this page was filtered out → invisible or draft
    if (publicPages && publicPages.length > 0) return <ComingSoon title="Page Not Available" message="This page is temporarily unavailable." />;
    // Public pages haven't loaded yet — render children optimistically while loading
    return children;
  }

  const isLive = page.status === 'live' || page.status === 'published' || page.visible === true;
  if (!isLive) return <ComingSoon title={page.title} />;

  const parsed = parseContent(page.content);

  if (parsed) {
    if (Array.isArray(parsed) && parsed.length > 0) {
      return <SectionsRenderer sections={parsed} />;
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return <ObjectRenderer data={parsed} />;
    }
    if (typeof parsed === 'string' && parsed.trim()) {
      return <div className="pw-text"><p>{parsed}</p></div>;
    }
  }

  return children;
};

export const PostWrapper = ({ postId, children }) => {
  const { getPostById } = useAuth();
  const post = getPostById(postId);

  if (!post) return children;

  const isLive = post.status === 'live' || post.status === 'published' || post.visible === true;
  if (!isLive) return <ComingSoon title={post.title} />;

  return children;
};

export default PageWrapper;
