import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFullUrl } from '../services/api';
import ComingSoon from './ComingSoon';

const DynamicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/pages/slug/${slug}`);

        if (!response.ok) {
          throw new Error('Page not found');
        }

        const data = await response.json();

        // Allow pages that are live OR visible
        // Pages with status 'draft', 'pending', or 'rejected' AND not visible should not be accessible
        if (data.status !== 'live' && data.status !== 'published' && data.visible !== true) {
          setError('Page is not available');
          setPage(null);
          setLoading(false);
          return;
        }

        setPage(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

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
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <ComingSoon
                title="Page Not Available"
                message={
                  error ||
                  'This page is currently not accessible. It may be in draft mode or pending approval.'
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if page is visible
  const isLive = page.status === 'live' || page.visible === true;
  if (!isLive) {
    return (
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <ComingSoon title={page.title} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parse content (sections format)
  let sections = [];
  try {
    if (page.content) {
      sections = JSON.parse(page.content);
    }
  } catch (e) {
    // If not JSON, content might be plain text
    sections = [];
  }

  // Filter out sections with empty data
  const hasContent = sections.some(s => {
    if (!s.data) return false;
    return Object.values(s.data).some(v => v && v.toString().trim());
  });

  // If no sections but there's content, display as plain content
  const hasPlainContent = !sections.length && page.content && page.content.trim();

  return (
    <div className="hn-parchment-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="hn-parchment-container">
          <div className="hn-parchment-bar"></div>
          <div className="relative p-6">
            <h1 className="text-3xl font-bold text-[#1B3A6B] mb-6">{page.title}</h1>

            {hasPlainContent && (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{page.content}</p>
              </div>
            )}

            {sections.length > 0 && hasContent && (
              <div className="space-y-6">
                {sections.map((section, index) => {
                  const sectionTitle = section.title || `Section ${index + 1}`;
                  const sectionData = section.data || {};

                  // Skip sections with empty data
                  const hasSectionContent = Object.values(sectionData).some(
                    v => v && v.toString().trim()
                  );
                  if (!hasSectionContent) return null;

                  return (
                    <div key={section.id || index} className="border-l-4 border-[#1B3A6B] pl-4">
                      <h2 className="text-xl font-semibold text-[#1B3A6B] mb-3">{sectionTitle}</h2>

                      {Object.entries(sectionData).map(([fieldId, value]) => {
                        if (!value || !value.toString().trim()) return null;

                        // Check if it's an image URL
                        const isImage =
                          typeof value === 'string' &&
                          (value.startsWith('http') ||
                            value.startsWith('/uploads/') ||
                            value.startsWith('/images/'));

                        if (isImage) {
                          return (
                            <div key={fieldId} className="mb-4">
                              <img
                                src={getFullUrl(value)}
                                alt={fieldId}
                                className="max-w-full h-auto rounded-lg shadow-md"
                                onError={e => (e.target.style.display = 'none')}
                              />
                            </div>
                          );
                        }

                        // Regular text content
                        return (
                          <div key={fieldId} className="mb-2">
                            <p className="whitespace-pre-wrap text-gray-700">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {!hasPlainContent && !hasContent && <ComingSoon title={page.title} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
