import React, { useState, useEffect } from 'react';
import { getFullUrl } from '../services/api';
import API_BASE_URL from '../services/api';
import ComingSoon from './ComingSoon';

// Accepts a `path` prop (full URL path, e.g. "communities/youth-guilds/agnes-alois/day-of-prayer")
// Falls back to slug-based lookup if path not provided
const DynamicPage = ({ slug, path }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lookup = path || slug;

  useEffect(() => {
    const fetchPage = async () => {
      try {
        // Use by-path endpoint for full-path lookups; falls back to slug endpoint
        const url = path
          ? `${API_BASE_URL}/api/pages/by-path?path=${encodeURIComponent(path)}`
          : `${API_BASE_URL}/api/pages/slug/${slug}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Page not found');
        }

        const data = await response.json();

        setPage(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [lookup]);

  if (loading) {
    return (
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <div className="text-center text-gray-500">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <ComingSoon
        title="Page Not Available"
        message={
          error ||
          'This page is currently not accessible. It may be in draft mode or pending approval.'
        }
      />
    );
  }

  // Page under construction: currently in review (pending)
  if (page.status === 'pending') {
    return (
      <ComingSoon
        title={page.title}
        message="This page is currently under review and will be available soon."
      />
    );
  }

  // Check if page is visible/live
  const isLive = page.status === 'live' || page.status === 'published' || page.visible === true;
  if (!isLive) {
    return <ComingSoon title={page.title} />;
  }

  // Parse content — handles sections array, plain object, or plain text
  let parsed = null;
  try {
    if (page.content) parsed = JSON.parse(page.content);
  } catch (e) {
    parsed = page.content; // plain text fallback
  }

  const isSectionsArray = Array.isArray(parsed) && parsed.length > 0;
  const isStructuredObject = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
  const isPlainText = typeof parsed === 'string' && parsed.trim();

  const renderFieldValue = (fieldId, value) => {
    if (!value && value !== 0) return null;
    const strVal = value.toString().trim();
    if (!strVal) return null;

    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/uploads/') || value.startsWith('/images/'))) {
      return (
        <div key={fieldId} className="mb-4">
          <img src={getFullUrl(value)} alt={fieldId} className="max-w-full h-auto rounded-lg shadow-md" onError={e => (e.target.style.display = 'none')} />
        </div>
      );
    }
    if (Array.isArray(value)) {
      return (
        <ul key={fieldId} className="list-disc pl-5 mb-3 text-gray-700">
          {value.map((item, i) => (
            <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object') {
      return (
        <div key={fieldId} className="mb-3 pl-4 border-l-2 border-gray-300">
          {Object.entries(value).map(([k, v]) => renderFieldValue(k, v))}
        </div>
      );
    }
    const tag = fieldId === 'heading' ? 'h2' : fieldId === 'subheading' ? 'h3' : 'p';
    const cls = fieldId === 'heading'
      ? 'text-xl font-semibold text-[#1B3A6B] mb-2'
      : fieldId === 'subheading'
      ? 'text-lg font-medium text-[#1B3A6B] mb-2'
      : 'whitespace-pre-wrap text-gray-700 mb-2';
    return React.createElement(tag, { key: fieldId, className: cls }, strVal);
  };

  const hasContent = isSectionsArray
    ? parsed.some(s => s.data && Object.values(s.data).some(v => v && v.toString().trim()))
    : isStructuredObject || isPlainText;

  if (!hasContent) {
    return <ComingSoon title={page.title} />;
  }

  return (
    <div className="hn-parchment-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="hn-parchment-container">
          <div className="hn-parchment-bar"></div>
          <div className="relative p-6">
            <h1 className="text-3xl font-bold text-[#1B3A6B] mb-6">{page.title}</h1>

            {isPlainText && (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{parsed}</p>
              </div>
            )}

            {isSectionsArray && (
              <div className="space-y-6">
                {parsed.map((section, index) => {
                  const sectionData = section.data || {};
                  const hasSectionContent = Object.values(sectionData).some(v => v && v.toString().trim());
                  if (!hasSectionContent) return null;
                  return (
                    <div key={section.id || index} className="border-l-4 border-[#1B3A6B] pl-4">
                      {section.title && <h2 className="text-xl font-semibold text-[#1B3A6B] mb-3">{section.title}</h2>}
                      {Object.entries(sectionData).map(([fieldId, value]) => renderFieldValue(fieldId, value))}
                    </div>
                  );
                })}
              </div>
            )}

            {isStructuredObject && (
              <div className="space-y-4">
                {Object.entries(parsed).map(([key, value]) => renderFieldValue(key, value))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
