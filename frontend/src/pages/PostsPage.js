import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as Tabs from '@radix-ui/react-tabs';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

const POSTS_PER_PAGE = 9;

const PostsPage = () => {
  const { getRecentPosts, getPostsByCategory, POST_CATEGORIES } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Get posts based on active filter
  const getFilteredPosts = () => {
    let posts;
    if (activeTab === 'all') {
      posts = getRecentPosts(100); // Get more for filtering
    } else {
      posts = getPostsByCategory(activeTab);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(
        post =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    return posts;
  };

  const filteredPosts = getFilteredPosts();
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleTabChange = value => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleSearch = e => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        background:
          activeTab === POST_CATEGORIES.INTERNATIONAL_OUTREACH
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : 'linear-gradient(135deg, #FDF5E6 0%, #FAF0E6 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Vatican Background Image for International Outreach */}
      {activeTab === POST_CATEGORIES.INTERNATIONAL_OUTREACH && (
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
      )}

      <div className="max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#BA0021] mb-2">Posts</h1>
          <p className="text-gray-600">
            Stay updated with the latest news and events from our parish
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List className="flex flex-wrap justify-center gap-2 mb-8">
            <Tabs.Trigger
              value="all"
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Posts
            </Tabs.Trigger>
            <Tabs.Trigger
              value={POST_CATEGORIES.PARISH_NOTICE}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === POST_CATEGORIES.PARISH_NOTICE
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Parish Notice
            </Tabs.Trigger>
            <Tabs.Trigger
              value={POST_CATEGORIES.EVENT_REPORT}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === POST_CATEGORIES.EVENT_REPORT
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Event Report
            </Tabs.Trigger>
            <Tabs.Trigger
              value={POST_CATEGORIES.YOUTH_COMMITTEE}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === POST_CATEGORIES.YOUTH_COMMITTEE
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Youth Committee
            </Tabs.Trigger>
            <Tabs.Trigger
              value={POST_CATEGORIES.ADULT_COMMITTEE}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === POST_CATEGORIES.ADULT_COMMITTEE
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Adult Committee
            </Tabs.Trigger>
            <Tabs.Trigger
              value={POST_CATEGORIES.INTERNATIONAL_OUTREACH}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === POST_CATEGORIES.INTERNATIONAL_OUTREACH
                  ? 'bg-[#BA0021] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              International Outreach
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value={activeTab}>
            {/* Posts Grid - 3x3 */}
            {paginatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map(post => (
                  <Link
                    to={`/posts/${post.id}`}
                    key={post.id}
                    className={`rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                      activeTab === POST_CATEGORIES.INTERNATIONAL_OUTREACH
                        ? 'bg-white/90 backdrop-blur-sm border-2 border-[#BA0021]/30'
                        : 'bg-white'
                    }`}
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
                      {/* Category Badge */}
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded mb-2 ${
                          activeTab === POST_CATEGORIES.INTERNATIONAL_OUTREACH
                            ? 'bg-[#BA0021]'
                            : 'bg-[#1B3A6B]'
                        }`}
                      >
                        {post.category}
                      </span>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {post.excerpt || post.content.substring(0, 100) + '...'}
                      </p>

                      {/* Meta Info */}
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
                <p className="text-gray-500 text-lg">No posts found</p>
                {searchQuery && (
                  <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#1B3A6B] text-white hover:bg-[#0f2444]'
                  }`}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#1B3A6B] text-white hover:bg-[#0f2444]'
                  }`}
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default PostsPage;
