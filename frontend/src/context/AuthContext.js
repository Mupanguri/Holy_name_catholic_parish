import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authAPI,
  pagesAPI,
  postsAPI,
  mediaAPI,
  submissionsAPI,
  tasksAPI,
  usersAPI,
  notificationsAPI,
} from '../services/api';
import { api } from '../services/api';
import { POST_CATEGORIES } from '../constants/CMSConstants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SOCCOM_ADMIN: 'soccom_admin',
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [media, setMedia] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [videoLinks, setVideoLinks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('adminToken');
      const savedUser = localStorage.getItem('adminUser');

      // Always load public posts for homepage
      await loadPublicData();

      if (token && savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        await loadAllData();
      }
      setLoading(false);
    };
    init();
  }, []);

  // Load public data (posts, pages) - always runs for homepage
  // Only loads approved posts for public website
  const loadPublicData = async () => {
    try {
      const [pagesData, postsData] = await Promise.all([
        pagesAPI.getAll(1, 100),
        postsAPI.getPublic(), // Use public endpoint that returns only approved posts
      ]);
      const pages = Array.isArray(pagesData) ? pagesData : pagesData.data || [];
      const posts = Array.isArray(postsData) ? postsData : postsData.data || [];
      setPages(pages);
      setPosts(posts);
    } catch (error) {
      console.error('Error loading public data:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    // Preserve current user — never let data loading affect auth state
    const token = localStorage.getItem('adminToken');
    if (!token) return; // Don't load if not authenticated

    try {
      const [pagesData, postsData, mediaData] = await Promise.all([
        pagesAPI.getAll(1, 1000), // Get all pages with high limit
        postsAPI.getAll(1, 1000),
        mediaAPI.getAll(1, 1000),
      ]);
      // Handle pagination response - extract data array
      // Filter out branch-root rows (level 0) from the admin page list
      const pages = (Array.isArray(pagesData) ? pagesData : pagesData.data || []).filter(
        p => p.level !== 0
      );
      const posts = Array.isArray(postsData) ? postsData : postsData.data || [];
      const media = Array.isArray(mediaData) ? mediaData : mediaData.data || [];

      setPages(pages);
      setPosts(posts);
      setMedia(media);

      // Load submissions and tasks if admin
      const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (user.role === 'super_admin') {
        // Fetch each data type separately to handle individual failures
        try {
          const submissionsData = await submissionsAPI.getAll();
          setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        } catch (e) {
          console.error('Failed to load submissions:', e);
        }

        try {
          const tasksData = await tasksAPI.getAll();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        } catch (e) {
          console.error('Failed to load tasks:', e);
        }

        try {
          const docsRes = await fetch(`${api.baseUrl}/api/documents`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          });
          const documentsData = docsRes.ok ? await docsRes.json() : [];
          setDocuments(Array.isArray(documentsData) ? documentsData : []);
        } catch (e) {
          console.error('Failed to load documents:', e);
        }

        try {
          const notifRes = await fetch(`${api.baseUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          });
          const notificationsData = notifRes.ok ? await notifRes.json() : [];
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } catch (e) {
          console.error('Failed to load notifications:', e);
        }

        try {
          const videoRes = await fetch(`${api.baseUrl}/api/video-links`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          });
          const videoLinksData = videoRes.ok ? await videoRes.json() : [];
          setVideoLinks(Array.isArray(videoLinksData) ? videoLinksData : []);
        } catch (e) {
          console.error('Failed to load video links:', e);
        }

        // Load users for task assignment (super_admin only)
        try {
          const usersData = await usersAPI.getAll();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (e) {
          console.error('Failed to load users:', e);
        }
      } else if (user.role === 'soccom_admin') {
        // soccom_admin doesn't have access to users endpoint
        // Load tasks, submissions, and video links for viewing
        try {
          const tasksData = await tasksAPI.getAll();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        } catch (e) {
          console.error('Failed to load tasks:', e);
        }

        try {
          const submissionsData = await submissionsAPI.getAll();
          setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        } catch (e) {
          console.error('Failed to load submissions:', e);
        }

        try {
          const videoRes = await fetch(`${api.baseUrl}/api/video-links`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          });
          const videoLinksData = videoRes.ok ? await videoRes.json() : [];
          setVideoLinks(Array.isArray(videoLinksData) ? videoLinksData : []);
        } catch (e) {
          console.error('Failed to load video links:', e);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      const result = await authAPI.login(username, password);
      if (result.success) {
        setCurrentUser(result.user);
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminUser', JSON.stringify(result.user));
        await loadAllData();
        return { success: true, user: result.user };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setPages([]);
    setPosts([]);
    setMedia([]);
    setSubmissions([]);
    setTasks([]);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // Check roles
  const isAdmin = () =>
    currentUser &&
    (currentUser.role === ROLES.SOCCOM_ADMIN || currentUser.role === ROLES.SUPER_ADMIN);
  const isSuperAdmin = () => currentUser && currentUser.role === ROLES.SUPER_ADMIN;

  // ============ PAGES ============
  const getAllPages = () => pages || [];
  // Live pages: either approved (status='live') OR visible (toggled on)
  const getLivePages = () =>
    (pages || []).filter(
      p => p.status === 'live' || p.status === 'published' || p.visible === true
    );
  // Visible pages: pages that are actually shown on the website
  const getVisiblePages = () => (pages || []).filter(p => p.visible === true);
  // Hidden pages: pages that are not shown on the website
  const getHiddenPages = () => (pages || []).filter(p => p.visible === false);
  const getDraftPages = () => (pages || []).filter(p => p.status === 'draft');
  const getPageById = id => (pages || []).find(p => p.id === id);
  const getPageBySlug = slug => (pages || []).find(p => p.slug === slug);

  const getPageTree = async () => {
    try {
      return await pagesAPI.getTree();
    } catch (error) {
      console.error('Error fetching page tree:', error);
      return [];
    }
  };

  const createPage = async pageData => {
    const newPage = await pagesAPI.create(pageData);
    setPages(prev => [...prev, newPage]);
    return newPage;
  };

  const updatePage = async (id, pageData) => {
    const updated = await pagesAPI.update(id, pageData);
    setPages(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const togglePageVisibility = async id => {
    const updated = await pagesAPI.toggleVisibility(id);
    setPages(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePage = async id => {
    await pagesAPI.delete(id);
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const submitPageForApproval = async (id, changeDescription = '') => {
    const result = await pagesAPI.submit(id, changeDescription);
    setPages(prev => prev.map(p => (p.id === id ? { ...p, status: 'pending' } : p)));
    return result;
  };

  // ============ POSTS ============
  const getAllPosts = () => posts || [];
  // Live posts: either approved (status='live') OR visible (toggled on)
  const getLivePosts = () => (posts || []).filter(p => p.status === 'live' || p.visible === true);
  // Visible posts: posts that are actually shown on the website
  const getVisiblePosts = () => (posts || []).filter(p => p.visible === true);
  // Hidden posts: posts that are not shown on the website
  const getHiddenPosts = () => (posts || []).filter(p => p.visible === false);
  const getDraftPosts = () => (posts || []).filter(p => p.status === 'draft');
  const getPostById = id => (posts || []).find(p => p.id === id || p.id === parseInt(id));

  // Get recent posts sorted by date (for public display)
  const getRecentPosts = (count = 6) => {
    return [...posts]
      .filter(p => p.status === 'live' || p.visible === true)
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, count);
  };

  // Filter posts by category (for public display)
  const getPostsByCategory = category => {
    return posts.filter(
      p => (p.status === 'live' || p.visible === true) && p.category === category
    );
  };

  const createPost = async postData => {
    const newPost = await postsAPI.create(postData);
    if (newPost && newPost.id) {
      setPosts(prev => [...prev, newPost]);
      return newPost;
    }
    throw new Error(newPost?.error || 'Failed to create post');
  };

  const updatePost = async (id, postData) => {
    const updated = await postsAPI.update(id, postData);
    setPosts(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const togglePostVisibility = async id => {
    const updated = await postsAPI.toggleVisibility(id);
    setPosts(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePost = async id => {
    await postsAPI.delete(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const submitPostForApproval = async id => {
    const result = await postsAPI.submit(id);
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, status: 'pending' } : p)));
    return result;
  };

  // Fetch posts with submission status (includes rejected posts)
  const refreshPostsWithSubmissionStatus = async () => {
    try {
      const postsWithStatus = await postsAPI.getAllWithSubmissionStatus();
      // Ensure it's always an array
      const postsArray = Array.isArray(postsWithStatus)
        ? postsWithStatus
        : postsWithStatus.data || [];
      setPosts(postsArray);
      return postsArray;
    } catch (error) {
      console.error('Error fetching posts with submission status:', error);
      return [];
    }
  };

  // Get rejection notes for a specific post
  const getPostRejectionNotes = postId => {
    const post = posts.find(p => p.id === postId);
    if (post && post.submission_status === 'rejected') {
      return {
        notes: post.rejection_notes,
        rejectedAt: post.rejected_at,
        rejectedBy: post.rejected_by,
      };
    }
    return null;
  };

  // ============ MEDIA ============
  const getAllMedia = () => media || [];
  const getMediaByCategory = category => (media || []).filter(m => m.category === category);

  const addMedia = async mediaData => {
    const newMedia = await mediaAPI.add(mediaData);
    setMedia(prev => [...prev, newMedia]);
    return newMedia;
  };

  const deleteMedia = async id => {
    await mediaAPI.delete(id);
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  // Refresh media from server
  const refreshMedia = async () => {
    try {
      const allMedia = await mediaAPI.getAll();
      setMedia(allMedia);
    } catch (error) {
      console.error('Error refreshing media:', error);
    }
  };

  // ============ SUBMISSIONS ============
  const getPendingSubmissions = () => (submissions || []).filter(s => s.status === 'pending');

  const approveSubmission = async (submissionId, notes) => {
    const updated = await submissionsAPI.approve(submissionId, notes);
    setSubmissions(prev => prev.map(s => (s.id === submissionId ? updated : s)));
    await loadAllData(); // Reload to get updated pages/posts
    return updated;
  };

  const rejectSubmission = async (submissionId, rejectionNotes) => {
    const updated = await submissionsAPI.reject(submissionId, rejectionNotes);
    setSubmissions(prev => prev.map(s => (s.id === submissionId ? updated : s)));
    await loadAllData();
    return updated;
  };

  const resubmitSubmission = async submissionId => {
    const updated = await submissionsAPI.resubmit(submissionId);
    setSubmissions(prev =>
      prev.map(s => (s.id === submissionId ? { ...s, status: 'pending' } : s))
    );
    await loadAllData();
    return updated;
  };

  const addSubmissionComment = async (submissionId, comment) => {
    const newComment = await submissionsAPI.addComment(submissionId, comment);
    setSubmissions(prev =>
      prev.map(s => {
        if (s.id === submissionId) {
          return { ...s, comments: [...(s.comments || []), newComment] };
        }
        return s;
      })
    );
    return newComment;
  };

  // ============ TASKS ============
  const getMyTasks = () => tasks || [];

  const createTask = async taskData => {
    const newTask = await tasksAPI.create(taskData);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (taskId, taskData) => {
    const updated = await tasksAPI.update(taskId, taskData);
    setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
    return updated;
  };

  const deleteTask = async taskId => {
    await tasksAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // ============ USERS ============
  const getAllUsers = () => users || [];

  const loadUsers = async () => {
    try {
      const allUsers = await usersAPI.getAll();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // ============ DOCUMENTS ============
  const getAllDocuments = () => documents || [];
  const getPendingDocuments = () => (documents || []).filter(d => d.status === 'pending');
  const getApprovedDocuments = () => (documents || []).filter(d => d.status === 'approved');

  // Refresh documents from server
  const refreshDocuments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${api.baseUrl}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
    }
  };

  const reviewDocument = async (documentId, action, notes) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${api.baseUrl}/api/documents/${documentId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, notes }),
    });
    const result = await response.json();
    if (result.success) {
      setDocuments(prev =>
        prev.map(d =>
          d.id === documentId
            ? {
                ...d,
                status: result.status,
                reviewed_by: currentUser.username,
                review_notes: notes,
              }
            : d
        )
      );
    }
    return result;
  };

  // ============ VIDEO LINKS ============
  const getAllVideoLinks = () => videoLinks || [];
  const getPendingVideoLinks = () => (videoLinks || []).filter(v => v.status === 'pending');
  const getApprovedVideoLinks = () => (videoLinks || []).filter(v => v.status === 'approved');

  // Load video links from server
  const loadVideoLinks = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${api.baseUrl}/api/video-links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setVideoLinks(data);
      }
    } catch (error) {
      console.error('Error loading video links:', error);
    }
  };

  // Submit a video link for approval
  const submitVideoLink = async videoData => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${api.baseUrl}/api/video-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(videoData),
    });
    const result = await response.json();
    if (result.success) {
      setVideoLinks(prev => [...prev, result.videoLink]);
    }
    return result;
  };

  // Review a video link (Super Admin only)
  const reviewVideoLink = async (videoId, action, notes) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${api.baseUrl}/api/video-links/${videoId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, notes }),
    });
    const result = await response.json();
    if (result.success) {
      setVideoLinks(prev =>
        prev.map(v =>
          v.id === videoId
            ? {
                ...v,
                status: result.status,
                reviewed_by: currentUser?.username,
                review_notes: notes,
              }
            : v
        )
      );
    }
    return result;
  };

  // ============ NOTIFICATIONS ============
  const getAllNotifications = () => notifications || [];
  const getUnreadNotifications = () => (notifications || []).filter(n => !n.is_read);
  const getUnreadCount = async () => {
    try {
      const result = await notificationsAPI.getUnreadCount();
      return result.count || 0;
    } catch (error) {
      return 0;
    }
  };

  const markNotificationRead = async notificationId => {
    const token = localStorage.getItem('adminToken');
    await fetch(`${api.baseUrl}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async notificationId => {
    try {
      await notificationsAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value = {
    // Auth
    currentUser,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    loading,

    // Pages
    pages,
    getAllPages,
    getLivePages,
    getVisiblePages,
    getHiddenPages,
    getDraftPages,
    getPageById,
    getPageBySlug,
    getPageTree,
    createPage,
    updatePage,
    togglePageVisibility,
    submitPageForApproval,
    deletePage,

    // Posts
    posts,
    getAllPosts,
    getLivePosts,
    getVisiblePosts,
    getHiddenPosts,
    getDraftPosts,
    getPostById,
    getRecentPosts,
    getPostsByCategory,
    createPost,
    updatePost,
    togglePostVisibility,
    deletePost,
    submitPostForApproval,
    refreshPostsWithSubmissionStatus,
    getPostRejectionNotes,

    // Media
    media,
    getAllMedia,
    getMediaByCategory,
    addMedia,
    deleteMedia,
    refreshMedia,

    // Submissions
    submissions,
    getPendingSubmissions,
    approveSubmission,
    rejectSubmission,
    resubmitSubmission,
    addSubmissionComment,

    // Tasks
    tasks,
    getMyTasks,
    createTask,
    updateTask,
    deleteTask,

    // Users
    users,
    getAllUsers,
    loadUsers,

    // Documents
    documents,
    getAllDocuments,
    getPendingDocuments,
    getApprovedDocuments,
    refreshDocuments,
    reviewDocument,

    // Video Links
    videoLinks,
    getAllVideoLinks,
    getPendingVideoLinks,
    getApprovedVideoLinks,
    loadVideoLinks,
    submitVideoLink,
    reviewVideoLink,

    // Notifications
    notifications,
    getAllNotifications,
    getUnreadNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,

    // Utils
    loadAllData,

    // Constants
    ROLES,
    POST_CATEGORIES,

    // Bulletins
    getActiveBulletins: () =>
      (posts || []).filter(p => (p.status === 'live' || p.visible) && p.is_bulletin),
    getPinnedBulletins: () =>
      (posts || []).filter(p => (p.status === 'live' || p.visible) && p.is_pinned),
    getEventPosts: () =>
      (posts || []).filter(
        p =>
          (p.status === 'live' || p.visible) &&
          (p.category === 'Event Report' || p.category === 'Parish Notice') &&
          !p.is_bulletin
      ),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
