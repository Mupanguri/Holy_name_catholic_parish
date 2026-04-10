// Centralized API configuration
// All API calls should import from this file
// For local dev, create .env.local with REACT_APP_API_URL=http://localhost:5000

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to ensure URL is complete (prefix with API_BASE_URL for relative paths)
export const getFullUrl = url => {
  if (!url) return '';
  // If already a full URL (http:// or https://), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a local public folder image (images folder), use PUBLIC_URL
  if (url.startsWith('/images/') || url.startsWith('/img/')) {
    return (process.env.PUBLIC_URL || '') + url;
  }
  // If it's an uploads path (stored via backend), prepend API_BASE_URL
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }
  // Otherwise, prepend API_BASE_URL
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/${url}`;
};

// ============ Auth API ============
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },
};

// ============ Pages API ============
export const pagesAPI = {
  getAll: async (page = 1, limit = 1000) => {
    const response = await fetch(`${API_BASE_URL}/api/pages?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json();
    // Handle pagination response - extract data array
    return Array.isArray(data) ? data : data.data || [];
  },
  getTree: async () => {
    const response = await fetch(`${API_BASE_URL}/api/pages/tree`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  getBySlug: async slug => {
    const response = await fetch(`${API_BASE_URL}/api/pages/${slug}`);
    return response.json();
  },
  create: async pageData => {
    const response = await fetch(`${API_BASE_URL}/api/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(pageData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create page' }));
      throw { response: { data: error } };
    }
    return response.json();
  },
  update: async (id, pageData) => {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(pageData),
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  submit: async (id, changeDescription = '') => {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ changeDescription }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit page' }));
      throw { response: { data: error } };
    }
    return response.json();
  },
  toggleVisibility: async id => {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },
};

// ============ Templates API ============
export const templatesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/templates`);
    return response.json();
  },
};

// ============ Posts API ============
export const postsAPI = {
  getAll: async (page = 1, limit = 1000) => {
    const response = await fetch(`${API_BASE_URL}/api/posts?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json();
    // Handle pagination response - extract data array
    return Array.isArray(data) ? data : data.data || [];
  },
  getAllWithSubmissionStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/posts/with-submission-status`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  getPublic: async () => {
    const response = await fetch(`${API_BASE_URL}/api/posts/public`);
    return response.json();
  },
  getByCategory: async category => {
    const response = await fetch(`${API_BASE_URL}/api/posts?category=${category}`);
    return response.json();
  },
  create: async postData => {
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create post' }));
      throw new Error(error.error || 'Failed to create post');
    }
    return response.json();
  },
  update: async (id, postData) => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(postData),
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  submit: async id => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}/submit`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  toggleVisibility: async id => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${id}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return response.json();
  },

  getBulletins: async () => {
    // Fetch all posts and filter for bulletins on client side
    const r = await fetch(`${API_BASE_URL}/api/posts?limit=100`);
    const data = await r.json();
    const posts = Array.isArray(data) ? data : data.data || [];
    // Filter for bulletins and live posts
    return posts.filter(
      p =>
        (p.status === 'live' || p.visible) && (p.is_bulletin === true || p.is_bulletin === 'true')
    );
  },

  uploadPdf: async formData => {
    const r = await fetch(`${API_BASE_URL}/api/posts/upload-pdf`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return r.json();
  },
};

// ============ Media API ============
export const mediaAPI = {
  getAll: async (page = 1, limit = 1000) => {
    const response = await fetch(`${API_BASE_URL}/api/media?page=${page}&limit=${limit}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json();
    // Handle pagination response - extract data array
    return Array.isArray(data) ? data : data.data || [];
  },
  upload: async formData => {
    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/media/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
};

// ============ Submissions API ============
export const submissionsAPI = {
  getById: async id => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  create: async data => {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  approve: async (id, notes = '') => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    return response.json();
  },
  reject: async (id, rejectionNotes = '') => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes: rejectionNotes }),
    });
    return response.json();
  },
  resubmit: async id => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/resubmit`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  addComment: async (id, comment) => {
    const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ comment }),
    });
    return response.json();
  },
};

// ============ Tasks API ============
export const tasksAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  create: async taskData => {
    console.log('Creating task with data:', taskData);
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(taskData),
    });
    console.log('Response status:', response.status);
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || 'Failed to create task');
      } catch {
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }
    return response.json();
  },
  update: async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
};

// ============ Users API ============
export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  create: async userData => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  update: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  delete: async id => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
};

// ============ Notifications API ============
export const notificationsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  markAsRead: async id => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return response.json();
  },
};

// Export api object for centralized config access
export const api = {
  baseUrl: API_BASE_URL,
  getAuthHeaders,

  // Helper for authenticated fetch
  async authenticatedFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(),
      },
    });
    return response;
  },
};

// Export default for backward compatibility
export default API_BASE_URL;
