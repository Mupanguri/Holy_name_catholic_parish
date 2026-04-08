import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InternationalOutreach = () => {
  const { getPostsByCategory, POST_CATEGORIES } = useAuth();

  const posts = getPostsByCategory(POST_CATEGORIES.INTERNATIONAL_OUTREACH);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}
    >
      {/* Vatican Background - Fixed, centered, semi-transparent */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/VATICAN.png)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.25,
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              fontFamily: "'Cinzel', serif",
              color: '#C9A84C',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            International Outreach
          </h1>
          <p className="text-xl mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
            To Vatican With Love Pilgrimage
          </p>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            A special journey of faith. Special committee formulated to organize the upcoming
            pilgrimage. It comprises members from the Ministry of Matrimony and Fellow Parishioners.
          </p>
        </div>

        {/* Stay Tuned Banner */}
        <div className="text-center mb-12">
          <div
            className="inline-block px-8 py-3 rounded-full text-lg font-semibold"
            style={{
              background: 'linear-gradient(90deg, #1B3A6B 0%, #BA0021 100%)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(186,0,33,0.3)',
            }}
          >
            Stay Tuned - More Information Coming Soon!
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-8">
          <h2
            className="text-2xl font-bold mb-6 text-center"
            style={{
              fontFamily: "'Cinzel', serif",
              color: '#C9A84C',
            }}
          >
            Latest Updates & Posts
          </h2>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                to={`/posts/${post.id}`}
                key={post.id}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-[#BA0021]/30 hover:border-[#BA0021]"
                style={{ borderColor: 'rgba(186, 0, 33, 0.3)' }}
              >
                {/* Post Image */}
                {post.images && post.images.length > 0 && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={process.env.PUBLIC_URL + post.images[0]}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-[#BA0021] rounded mb-2">
                    {post.category}
                  </span>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {post.excerpt || post.content.substring(0, 100) + '...'}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{post.author}</span>
                    <span>{formatDate(post.date)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No posts yet in International Outreach
            </p>
            <p className="mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Check back soon for updates on our Vatican pilgrimage
            </p>
          </div>
        )}

        {/* View All Posts Link */}
        <div className="text-center mt-8">
          <Link
            to="/posts"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg, #1B3A6B, #BA0021)',
              color: 'white',
            }}
          >
            View All Posts →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InternationalOutreach;
