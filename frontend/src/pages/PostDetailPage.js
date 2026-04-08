import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { getFullUrl } from '../services/api';

const PostDetailPage = () => {
  const { id } = useParams();
  const { getPostById } = useAuth();

  const post = getPostById(id);

  // Get related posts from the same category
  const relatedPosts = post?.category ? [] : [];

  if (!post) {
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

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get guild channel name if applicable
  const getGuildChannelName = slug => {
    return slug || '';
  };

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
          {/* Category Badge */}
          <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-[#1B3A6B] rounded mb-4">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <span className="flex items-center">
              <span className="font-semibold">Author:</span> {post.author}
            </span>
            <span className="flex items-center">
              <span className="font-semibold">Date:</span> {formatDate(post.date)}
            </span>
            {post.guildChannel && (
              <span className="flex items-center">
                <span className="font-semibold">Posted in:</span>{' '}
                <Link
                  to={`/communities/${post.guildCategory || 'general'}/${post.guildChannel}`}
                  className="text-[#BA0021] hover:underline ml-1"
                >
                  {getGuildChannelName(post.guildChannel)}
                </Link>
              </span>
            )}
          </div>
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                  <img
                    src={getFullUrl(image)}
                    alt={`${post.title} - Photo ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Content</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            {post.content.split('\n').map((paragraph, index) => (
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

        {/* Gallery Integration - Images from this post */}
        {post && post.image && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gallery (From Posts)</h2>
            <p className="text-gray-600 mb-4 text-sm">
              These images are also available in the Gallery section
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(post.images || []).map(image => (
                <Link
                  to={`/gallery?post=${post.id}`}
                  key={image.id}
                  className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getFullUrl(image.src)}
                    alt={image.alt}
                    className="w-full h-32 object-cover"
                  />
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                to={`/gallery?post=${post.id}`}
                className="inline-block px-4 py-2 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#004b7c] transition-colors"
              >
                View in Gallery
              </Link>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map(relatedPost => (
                <Link
                  to={`/posts/${relatedPost.id}`}
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
