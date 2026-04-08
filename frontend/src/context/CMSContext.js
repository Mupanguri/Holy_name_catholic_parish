import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { POST_CATEGORIES, GUILD_CHANNELS } from '../constants/CMSConstants';

// Re-export for backward compatibility
export { POST_CATEGORIES, GUILD_CHANNELS };

const CMSContext = createContext();

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};

// Sample initial posts data
const initialPosts = [
  {
    id: uuidv4(),
    title: 'Jubilee Year of Hope 2025',
    content:
      'Pope Francis warmly invites everyone to join in the special Jubilee "Year of Hope," which begins in Rome on December 24, 2024. This is a time of spiritual renewal and celebration for the entire Catholic community.',
    excerpt:
      'Pope Francis warmly invites everyone to join in the special Jubilee "Year of Hope"...',
    author: 'Parish Office',
    date: '2024-12-24',
    category: POST_CATEGORIES.PARISH_NOTICE,
    images: ['/images/111.jpg'],
    guildChannel: null,
  },
  {
    id: uuidv4(),
    title: 'Christmas Giving Campaign Success',
    content:
      'Thank you to all our parishioners who generously contributed to our Christmas giving campaign. Your donations have brought joy to many families in our community.',
    excerpt: 'Thank you to all our parishioners who generously contributed...',
    author: 'Social Committee',
    date: '2024-12-20',
    category: POST_CATEGORIES.EVENT_REPORT,
    images: ['/images/112.jpg'],
    guildChannel: 'soccom',
  },
  {
    id: uuidv4(),
    title: 'Youth Fellowship Meeting',
    content:
      'The Youth Council held its monthly meeting last Sunday. We discussed upcoming events and plans for the new year. All youth are welcome to join us.',
    excerpt: 'The Youth Council held its monthly meeting last Sunday...',
    author: 'Youth Council',
    date: '2024-12-15',
    category: POST_CATEGORIES.YOUTH_COMMITTEE,
    images: [],
    guildChannel: 'youth-council',
  },
  {
    id: uuidv4(),
    title: 'Altar Servers Training',
    content:
      'A training session for all altar servers will be held next Saturday. Please ensure all servers attend.',
    excerpt: 'A training session for all altar servers will be held next Saturday...',
    author: 'Parish Priest',
    date: '2024-12-10',
    category: POST_CATEGORIES.ADULT_COMMITTEE,
    images: [],
    guildChannel: 'altar-servers',
  },
  {
    id: uuidv4(),
    title: 'Family Apostolate Gathering',
    content:
      'The Family Apostolate Committee invites all families to our upcoming gathering. This will be a time of fellowship and reflection.',
    excerpt: 'The Family Apostolate Committee invites all families to our upcoming gathering...',
    author: 'Family Apostolate',
    date: '2024-12-05',
    category: POST_CATEGORIES.ADULT_COMMITTEE,
    images: ['/images/113.jpg'],
    guildChannel: 'family-apostolate',
  },
  {
    id: uuidv4(),
    title: 'Retired Religious Donations',
    content:
      'The Retirement Fund for Religious collection will take place at all Masses on the weekend of January 11-12, 2024. Support those who have given a lifetime of service.',
    excerpt: 'The Retirement Fund for Religious collection will take place at all Masses...',
    author: 'Parish Office',
    date: '2024-01-05',
    category: POST_CATEGORIES.PARISH_NOTICE,
    images: [],
    guildChannel: null,
  },
];

// Gallery images with post association
const initialGallery = [
  { id: '1', src: '/images/1.jpg', alt: 'Church event 1', category: 'general', postId: null },
  { id: '2', src: '/images/2.jpg', alt: 'Church event 2', category: 'general', postId: null },
  { id: '3', src: '/images/3.jpg', alt: 'Church event 3', category: 'general', postId: null },
  { id: '4', src: '/images/4.jpg', alt: 'Church event 4', category: 'general', postId: null },
  { id: '5', src: '/images/5.jpg', alt: 'Church event 5', category: 'general', postId: null },
  { id: '6', src: '/images/6.jpg', alt: 'Church event 6', category: 'general', postId: null },
  { id: '7', src: '/images/7.jpg', alt: 'Church event 7', category: 'general', postId: null },
  { id: '8', src: '/images/8.jpg', alt: 'Church event 8', category: 'general', postId: null },
  { id: '9', src: '/images/9.jpg', alt: 'Church event 9', category: 'general', postId: null },
  { id: '10', src: '/images/10.jpg', alt: 'Church event 10', category: 'general', postId: null },
  { id: '11', src: '/images/11.jpg', alt: 'Church event 11', category: 'general', postId: null },
  {
    id: '12',
    src: '/images/12.jpg',
    alt: 'Parish Priest FR J.Ndhlalambi',
    category: 'general',
    postId: null,
  },
  { id: '13', src: '/images/13.jpg', alt: 'Church event 13', category: 'general', postId: null },
  { id: '14', src: '/images/14.jpg', alt: 'Church event 14', category: 'general', postId: null },
  { id: '15', src: '/images/15.jpg', alt: 'Church event 15', category: 'general', postId: null },
  { id: '16', src: '/images/16.jpg', alt: 'Bishop Visit', category: 'general', postId: null },
  { id: '17', src: '/images/17.jpg', alt: 'Church event 17', category: 'general', postId: null },
  { id: '18', src: '/images/18.jpg', alt: 'Church event 18', category: 'general', postId: null },
  { id: '19', src: '/images/19.jpg', alt: 'Church event 19', category: 'general', postId: null },
  { id: '20', src: '/images/20.jpg', alt: 'Church event 20', category: 'general', postId: null },
  { id: '21', src: '/images/21.jpg', alt: 'Church event 21', category: 'general', postId: null },
  { id: '22', src: '/images/22.jpg', alt: 'Church event 22', category: 'general', postId: null },
  { id: '23', src: '/images/23.jpg', alt: 'Church event 23', category: 'general', postId: null },
  { id: '24', src: '/images/24.jpg', alt: 'Church event 24', category: 'general', postId: null },
  { id: '25', src: '/images/25.jpg', alt: 'Church event 25', category: 'general', postId: null },
  { id: '26', src: '/images/26.jpg', alt: 'Church event 26', category: 'general', postId: null },
  { id: '27', src: '/images/27.jpg', alt: 'Church event 27', category: 'general', postId: null },
  { id: '28', src: '/images/28.jpg', alt: 'Church event 28', category: 'general', postId: null },
  { id: '29', src: '/images/29.jpg', alt: 'Church event 29', category: 'general', postId: null },
  { id: '30', src: '/images/30.jpg', alt: 'Church event 30', category: 'general', postId: null },
  {
    id: '111',
    src: '/images/111.jpg',
    alt: 'Jubilee Year',
    category: 'posts',
    postId: initialPosts[0].id,
  },
  {
    id: '112',
    src: '/images/112.jpg',
    alt: 'Christmas Giving',
    category: 'posts',
    postId: initialPosts[1].id,
  },
  {
    id: '113',
    src: '/images/113.jpg',
    alt: 'Family Gathering',
    category: 'posts',
    postId: initialPosts[4].id,
  },
];

export const CMSProvider = ({ children }) => {
  const [posts, setPosts] = useState(initialPosts);
  const [gallery, setGallery] = useState(initialGallery);
  const [writeups, setWriteups] = useState([]);

  // Get 6 most recent posts for landing page
  const getRecentPosts = (count = 6) => {
    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, count);
  };

  // Filter posts by category
  const getPostsByCategory = category => {
    return posts.filter(post => post.category === category);
  };

  // Get posts for a specific guild channel
  const getPostsByGuildChannel = guildSlug => {
    return posts.filter(post => post.guildChannel === guildSlug);
  };

  // Get a single post by ID
  const getPostById = id => {
    return posts.find(post => post.id === id || post.id === parseInt(id));
  };

  // Add a new post
  const addPost = postData => {
    const newPost = {
      id: uuidv4(),
      ...postData,
      date: new Date().toISOString().split('T')[0],
    };
    setPosts([newPost, ...posts]);

    // If post has images, add them to gallery under Posts category
    if (postData.images && postData.images.length > 0) {
      const newGalleryImages = postData.images.map((img, index) => ({
        id: `${newPost.id}-${index}`,
        src: img,
        alt: newPost.title,
        category: 'posts',
        postId: newPost.id,
      }));
      setGallery([...newGalleryImages, ...gallery]);
    }

    return newPost;
  };

  // Update a post
  const updatePost = (id, postData) => {
    setPosts(posts.map(post => (post.id === id ? { ...post, ...postData } : post)));
  };

  // Delete a post
  const deletePost = id => {
    setPosts(posts.filter(post => post.id !== id));
    // Also remove associated gallery images
    setGallery(gallery.filter(img => img.postId !== id));
  };

  // Get gallery images by category
  const getGalleryByCategory = category => {
    return gallery.filter(img => img.category === category);
  };

  // Get gallery images associated with a post
  const getGalleryByPostId = postId => {
    return gallery.filter(img => img.postId === postId);
  };

  // Add gallery image
  const addGalleryImage = imageData => {
    const newImage = {
      id: uuidv4(),
      ...imageData,
    };
    setGallery([...gallery, newImage]);
    return newImage;
  };

  // Delete gallery image
  const deleteGalleryImage = id => {
    setGallery(gallery.filter(img => img.id !== id));
  };

  const value = {
    // Posts
    posts,
    getRecentPosts,
    getPostsByCategory,
    getPostsByGuildChannel,
    getPostById,
    addPost,
    updatePost,
    deletePost,

    // Gallery
    gallery,
    getGalleryByCategory,
    getGalleryByPostId,
    addGalleryImage,
    deleteGalleryImage,

    // Writeups
    writeups,
    setWriteups,

    // Constants
    POST_CATEGORIES,
    GUILD_CHANNELS,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
};

export default CMSContext;
