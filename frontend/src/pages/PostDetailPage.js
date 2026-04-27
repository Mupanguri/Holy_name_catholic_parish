import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { getFullUrl, postsAPI } from '../services/api';

const PostDetailPage = () => {
  const { slug } = useParams();
  const { getPostById, getPostBySlug } = useAuth();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const isNumeric = /^\d+$/.test(slug);
    const contextPost = isNumeric ? getPostById(slug) : getPostBySlug(slug);
    if (contextPost) {
      setPost(contextPost);
      return;
    }
    // Not in context yet — fetch from API directly
    const fetchPost = async () => {
      try {
        const data = isNumeric
          ? await fetch(`/api/posts/${slug}`).then(r => r.json())
          : await postsAPI.getBySlug(slug);
        if (data && data.id) {
          setPost(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    };
    fetchPost();
  }, [slug, getPostById, getPostBySlug]);

  if (notFound || (!post && slug)) {
    // Show not-found only once we know it truly isn't available
    if (notFound) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
            <Link to="/posts" className="text-[#1B3A6B] hover:underline">
              Back to Posts
            </Link>
          </div>
        </div>
      );
    }
    // Still loading
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!post) return null;

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const relatedPosts = [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link to="/posts" className="inline-flex items-center text-[#1B3A6B] hover:underline mb-6">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Posts
        </Link>

        {/* Post Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-[#1B3A6B] rounded mb-4">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <span className="flex items-center">
              <span className="font-semibold">Author:</span> {post.author_name || post.author}
            </span>
            <span className="flex items-center">
              <span className="font-semibold">Date:</span> {formatDate(post.date || post.created_at)}
            </span>
          </div>
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Images</h2>
            <div className="flex flex-col gap-6">
              {post.images.map((image, index) => {
                const rawLayouts = post.image_layouts || {};
                const layouts = typeof rawLayouts === 'string' ? (() => { try { return JSON.parse(rawLayouts); } catch { return {}; } })() : rawLayouts;
                const layout = layouts[image] || { position: 'center', size: 'medium' };

                const maxWidth = { small: '320px', medium: '600px', full: '100%' }[layout.size] || '600px';
                const margin = { left: '0 auto 0 0', center: '0 auto', right: '0 0 0 auto' }[layout.position] || '0 auto';

                return (
                  <div key={index} style={{ maxWidth, margin, width: '100%' }} className="rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                    <img
                      src={getFullUrl(image)}
                      alt={`${post.title} - Photo ${index + 1}`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Content</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            {(post.content || '').split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Download Attachment */}
        {post.pdf_url && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Attachments</h2>
            <a
              href={getFullUrl(post.pdf_url)}
              download
              className="inline-flex items-center px-4 py-2 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#004b7c] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </a>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map(relatedPost => (
                <Link
                  to={`/posts/${relatedPost.slug || relatedPost.id}`}
                  key={relatedPost.id}
                  className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  {relatedPost.images && relatedPost.images.length > 0 && (
                    <img
                      src={getFullUrl(relatedPost.images[0])}
                      alt={relatedPost.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-gray-800 line-clamp-2">{relatedPost.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(relatedPost.date)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
