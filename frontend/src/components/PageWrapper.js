import React from 'react';
import { useAuth } from '../context/AuthContext';
import ComingSoon from './ComingSoon';

export const PageWrapper = ({ pageSlug, children }) => {
  const { getPageBySlug } = useAuth();

  // Find page by slug
  const page = getPageBySlug(pageSlug);

  // If no page found, show the actual content
  if (!page) {
    return children;
  }

  // If page is not published yet (not visible), show Coming Soon
  // This combines both status check and visibility toggle
  // A page is considered "live" if: status = 'live' OR 'published' OR visible = true
  const isLive = page.status === 'live' || page.status === 'published' || page.visible === true;
  
  if (!isLive) {
    // Show Coming Soon for draft/pending/rejected pages that aren't visible
    return <ComingSoon title={page.title} />;
  }

  // Otherwise show the actual content
  return children;
};

export const PostWrapper = ({ postId, children }) => {
  const { getPostById } = useAuth();

  // Find post by ID
  const post = getPostById(postId);

  // If no post found, show the actual content
  if (!post) {
    return children;
  }

  // A post is considered "live" if: status = 'live' OR 'published' OR visible = true
  const isLive = post.status === 'live' || post.status === 'published' || post.visible === true;
  
  if (!isLive) {
    return <ComingSoon title={post.title} />;
  }

  // Otherwise show the actual content
  return children;
};

export default PageWrapper;
