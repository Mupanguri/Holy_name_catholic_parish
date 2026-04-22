import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { api, getFullUrl, mediaAPI } from '../../services/api';
import toast from '../../constants/toast';

const MediaLibrary = () => {
  const { theme, colors } = useOutletContext() || {};
  const navigate = useNavigate();
  const {
    currentUser,
    getAllMedia,
    getMediaByCategory,
    deleteMedia,
    isSuperAdmin,
    getAllDocuments,
    getPendingDocuments,
    reviewDocument,
    refreshDocuments,
    refreshMedia,
    getPendingVideoLinks,
    getApprovedVideoLinks,
    getAllVideoLinks,
    reviewVideoLink,
    submitVideoLink,
    loadVideoLinks,
  } = useAuth();

  const [activeCategory, setActiveCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'image',
    url: '',
    category: 'images',
    notes: '',
  });

  const [videoLinkForm, setVideoLinkForm] = useState({
    url: '',
    title: '',
    description: '',
    thumbnail: '',
  });
  const [fetchingThumbnail, setFetchingThumbnail] = useState(false);
  const [submittingVideo, setSubmittingVideo] = useState(false);

  const allMedia = getAllMedia();
  const pendingMassCount = allMedia.filter(m => m.status === 'pending' && m.upload_type === 'mass').length;
  const imageMedia = getMediaByCategory('images');
  const documentMedia = getMediaByCategory('documents');
  const videoMedia = getMediaByCategory('videos');
  // Approved video links for display; non-super-admins also see their own pending ones
  const approvedVideoLinks = getApprovedVideoLinks();
  const allVideoLinksForUser = getAllVideoLinks
    ? getAllVideoLinks().filter(v => v.status === 'approved' || (!isSuperAdmin() && v.author_id === currentUser?.id))
    : approvedVideoLinks;
  const allDocuments = getAllDocuments ? getAllDocuments() : [];
  const pendingDocuments = isSuperAdmin() ? getPendingDocuments() : allDocuments.filter(d => d.status === 'pending');
  const pendingVideoLinks = isSuperAdmin() ? getPendingVideoLinks() : [];
  // All docs visible to current user (approved docs live in media table, pending in documents table)
  const myPendingDocs = allDocuments.filter(d => d.status === 'pending');
  const totalDocCount = documentMedia.length + myPendingDocs.length;
  const totalVideosCount = videoMedia.length + allVideoLinksForUser.length;
  const totalFilesCount = allMedia.length + myPendingDocs.length + allVideoLinksForUser.length;

  const getFilteredMedia = () => {
    let media =
      activeCategory === 'images'
        ? imageMedia
        : activeCategory === 'documents'
          ? documentMedia
          : activeCategory === 'videos'
            ? [
                ...videoMedia,
                ...allVideoLinksForUser.map(v => ({
                  ...v,
                  id: `vl-${v.id}`,
                  name: v.title,
                  type: 'video-link',
                  url: v.url,
                  thumbnail: v.thumbnail,
                  platform: v.platform,
                  status: v.status,
                })),
              ]
            : allMedia;

    if (searchTerm) {
      media = media.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return media;
  };

  const media = getFilteredMedia();

  const handleReview = doc => {
    setSelectedDoc(doc);
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    const result = await reviewDocument(selectedDoc.id, 'approve', reviewNotes);
    if (result && result.status === 'approved') {
      toast.success('Document approved!');
      setShowReviewModal(false);
      setSelectedDoc(null);
      setReviewNotes('');
    } else if (result && result.error) {
      toast.error('Error: ' + result.error);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    if (!reviewNotes) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    const result = await reviewDocument(selectedDoc.id, 'reject', reviewNotes);
    if (result && result.status === 'rejected') {
      toast.success('Document rejected');
      setShowReviewModal(false);
      setSelectedDoc(null);
      setReviewNotes('');
    } else if (result && result.error) {
      toast.error('Error: ' + result.error);
    }
  };

  const [showVideoReviewModal, setShowVideoReviewModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoReviewNotes, setVideoReviewNotes] = useState('');

  const [showMassUploadModal, setShowMassUploadModal] = useState(false);
  const [massFiles, setMassFiles] = useState([]);
  const [massUploading, setMassUploading] = useState(false);
  const [massProgress, setMassProgress] = useState({ done: 0, total: 0 });
  const [massApproving, setMassApproving] = useState(false);

  const handleVideoReview = video => {
    setSelectedVideo(video);
    setShowVideoReviewModal(true);
  };

  const handleVideoApprove = async () => {
    if (!selectedVideo) return;
    const result = await reviewVideoLink(selectedVideo.id, 'approve', videoReviewNotes);
    if (result && result.status === 'approved') {
      toast.success('Video link approved!');
      setShowVideoReviewModal(false);
      setSelectedVideo(null);
      setVideoReviewNotes('');
    } else if (result && result.error) {
      toast.error('Error: ' + result.error);
    }
  };

  const handleVideoReject = async () => {
    if (!selectedVideo) return;
    if (!videoReviewNotes) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    const result = await reviewVideoLink(selectedVideo.id, 'reject', videoReviewNotes);
    if (result && result.status === 'rejected') {
      toast.success('Video link rejected');
      setShowVideoReviewModal(false);
      setSelectedVideo(null);
      setVideoReviewNotes('');
    } else if (result && result.error) {
      toast.error('Error: ' + result.error);
    }
  };

  const handleUpload = async e => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!selectedFile) {
        toast.warning('Please select a file');
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadForm.name || selectedFile.name);
      formData.append('type', uploadForm.type);
      formData.append('category', uploadForm.category);
      formData.append('notes', uploadForm.notes);
      if (coverImageFile) formData.append('cover_image', coverImageFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${api.baseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        toast.success(
          `File uploaded successfully! It is pending review. (v${result.document.version})`
        );
        setUploadForm({ name: '', type: 'image', url: '', category: 'images', notes: '' });
        setSelectedFile(null);
        setCoverImageFile(null);
        setCoverImagePreview('');
        setShowUploadModal(false);
        try {
          await refreshDocuments();
        } catch (refreshError) {
          console.error('Error refreshing documents:', refreshError);
        }
      } else {
        toast.error('Error: ' + result.error);
      }
    } catch (error) {
      toast.error('Error uploading: ' + error.message);
    }
    setUploading(false);
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setUploadForm({ ...uploadForm, type: 'image', category: 'images' });
      } else {
        setUploadForm({ ...uploadForm, type: 'document', category: 'documents' });
      }
      if (!uploadForm.name) {
        setUploadForm({ ...uploadForm, name: file.name.replace(/\.[^/.]+$/, '') });
      }
    }
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteMedia(id);
    }
  };

  const handleMassUpload = async () => {
    if (!massFiles.length) return;
    setMassUploading(true);
    const BATCH = 20;
    let done = 0;
    setMassProgress({ done: 0, total: massFiles.length });
    try {
      for (let i = 0; i < massFiles.length; i += BATCH) {
        const batch = massFiles.slice(i, i + BATCH);
        const fd = new FormData();
        batch.forEach(f => fd.append('files', f));
        await mediaAPI.massUpload(fd);
        done += batch.length;
        setMassProgress({ done, total: massFiles.length });
      }
      await refreshMedia();
      setShowMassUploadModal(false);
      setMassFiles([]);
      toast.success(`${massFiles.length} image${massFiles.length > 1 ? 's' : ''} uploaded — pending super admin approval`);
    } catch (error) {
      toast.error('Error uploading: ' + error.message);
    }
    setMassUploading(false);
  };

  const handleMassApprove = async () => {
    setMassApproving(true);
    try {
      const result = await mediaAPI.massApprove();
      await refreshMedia();
      toast.success(`Approved ${result.approved} image${result.approved !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Error approving: ' + error.message);
    }
    setMassApproving(false);
  };

  const handleUrlChange = async e => {
    const url = e.target.value;
    setVideoLinkForm(prev => ({ ...prev, url }));
    if (url) {
      setFetchingThumbnail(true);
      try {
        let thumbnail = '';
        // YouTube — extract video ID and use public thumbnail API
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.match(
            /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
          );
          if (videoId) thumbnail = `https://img.youtube.com/vi/${videoId[1]}/mqdefault.jpg`;
        }
        // No public thumbnail API for TikTok/Facebook/Instagram without OAuth —
        // leave blank so the platform label placeholder renders instead
        if (thumbnail) {
          setVideoLinkForm(prev => ({ ...prev, thumbnail }));
        } else {
          setVideoLinkForm(prev => ({ ...prev, thumbnail: '' }));
        }
      } catch (err) {
        console.error('Error detecting video:', err);
      }
      setFetchingThumbnail(false);
    }
  };

  const handleVideoLinkSubmit = async e => {
    e.preventDefault();
    if (!videoLinkForm.url || !videoLinkForm.title) {
      toast.warning('Please provide a video URL and title');
      return;
    }
    setSubmittingVideo(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('You are not logged in. Please refresh the page and log in again.');
        setSubmittingVideo(false);
        return;
      }
      console.log('Submitting video link...', {
        url: videoLinkForm.url,
        title: videoLinkForm.title,
      });
      console.log('Token present:', !!token);
      console.log('User role:', currentUser?.role);

      const response = await fetch(`${api.baseUrl}/api/video-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: videoLinkForm.url,
          title: videoLinkForm.title,
          description: videoLinkForm.description,
          thumbnail: videoLinkForm.thumbnail,
        }),
      });
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      if (result.success) {
        toast.success('Video link submitted for approval!');
        setVideoLinkForm({ url: '', title: '', description: '', thumbnail: '' });
        setShowVideoLinkModal(false);
        try { await loadVideoLinks(); } catch {}
      } else {
        toast.error('Error: ' + (result.error || 'Failed to submit video link'));
      }
    } catch (error) {
      toast.error('Error submitting video link: ' + error.message);
    }
    setSubmittingVideo(false);
  };

  const getTypeIcon = type => {
    switch (type) {
      case 'image':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        );
      case 'document':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        );
      case 'video':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23,7 16,12 23,17 23,7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        );
      default:
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13,2 13,9 20,9" />
          </svg>
        );
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: totalFilesCount },
    { key: 'images', label: 'Images', count: imageMedia.length },
    { key: 'documents', label: 'Documents', count: totalDocCount },
    { key: 'videos', label: 'Videos', count: totalVideosCount },
  ];

  const statCards = [
    {
      label: 'Total Files',
      value: totalFilesCount,
      color: 'var(--theme-accent)',
      bg: 'rgba(42,96,153,0.15)',
    },
    { label: 'Images', value: imageMedia.length, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    {
      label: 'Documents',
      value: totalDocCount,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.15)',
    },
    { label: 'Videos', value: totalVideosCount, color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  ];

  const modalInput = `
    width: 100%; background: rgba(168,204,232,0.05);
    border: 1px solid rgba(168,204,232,0.12); border-radius: 8px;
    padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
    font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
  `;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .ml-root {
          padding: 28px;
          font-family: 'Inter', sans-serif;
          color: var(--theme-text);
          min-height: 100vh;
          background: var(--theme-bg);
        }

        .ml-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
        }
        .ml-title {
          font-family: 'Cinzel', serif;
          font-size: 20px; font-weight: 600;
          color: var(--theme-text); letter-spacing: 0.02em; margin-bottom: 4px;
        }
        .ml-sub { font-size: 13px; color: var(--theme-text-muted); }
        .ml-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        .ml-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 12.5px; font-weight: 500;
          cursor: pointer; border: none;
          font-family: 'Inter', sans-serif;
          transition: all 0.16s; text-decoration: none;
          white-space: nowrap;
        }
        .ml-btn-primary {
          background: rgba(27,58,107,0.7);
          color: #a8cce8;
          border: 1px solid rgba(42,96,153,0.3);
        }
        .ml-btn-primary:hover { background: rgba(42,96,153,0.5); }
        .ml-btn-green {
          background: rgba(22,163,74,0.12);
          color: #4ade80;
          border: 1px solid rgba(22,163,74,0.2);
        }
        .ml-btn-green:hover { background: rgba(22,163,74,0.2); }
        .ml-btn-purple {
          background: rgba(124,58,237,0.12);
          color: #c4b5fd;
          border: 1px solid rgba(124,58,237,0.2);
        }
        .ml-btn-purple:hover { background: rgba(124,58,237,0.2); }

        .ml-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 22px;
        }
        @media (max-width: 700px) { .ml-stats { grid-template-columns: repeat(2, 1fr); } }

        .ml-stat {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 10px; padding: 16px;
          display: flex; align-items: center; gap: 14px;
        }
        .ml-stat-icon {
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ml-stat-val {
          font-size: 22px; font-weight: 700; color: var(--theme-text);
          letter-spacing: -0.02em; line-height: 1;
        }
        .ml-stat-label { font-size: 11px; color: rgba(168,204,232,0.3); margin-top: 3px; }

        .ml-panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 12px; overflow: hidden;
          margin-bottom: 20px;
        }

        .ml-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--theme-border);
          flex-wrap: wrap; gap: 12px;
        }
        .ml-tabs { display: flex; gap: 6px; }
        .ml-tab {
          padding: 7px 14px; border-radius: 7px;
          font-size: 12.5px; font-weight: 500;
          border: 1px solid transparent; cursor: pointer;
          background: none; font-family: 'Inter', sans-serif;
          color: var(--theme-text-muted); transition: all 0.14s;
        }
        .ml-tab:hover { background: var(--theme-border); color: rgba(168,204,232,0.7); }
        .ml-tab.active { background: rgba(42,96,153,0.18); color: #a8cce8; border-color: rgba(42,96,153,0.25); }

        .ml-search {
          background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.1);
          border-radius: 8px; padding: 8px 14px;
          color: var(--theme-text); font-size: 13px;
          outline: none; width: 200px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.18s;
        }
        .ml-search::placeholder { color: rgba(168,204,232,0.2); }
        .ml-search:focus { border-color: rgba(42,96,153,0.4); }

        .ml-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px; padding: 16px;
        }
        @media (min-width: 640px) { .ml-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .ml-grid { grid-template-columns: repeat(6, 1fr); } }

        .ml-item {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--theme-border);
          border-radius: 10px; overflow: hidden;
          transition: all 0.16s;
        }
        .ml-item:hover {
          border-color: rgba(168,204,232,0.15);
          box-shadow: 0 6px 24px rgba(0,0,0,0.25);
          transform: translateY(-2px);
        }
        .ml-item-preview {
          aspect-ratio: 1;
          position: relative; overflow: hidden;
          background: rgba(168,204,232,0.04);
        }
        .ml-item-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ml-item-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(168,204,232,0.25);
        }
        .ml-item-info { padding: 10px; }
        .ml-item-name {
          font-size: 11.5px; font-weight: 500;
          color: rgba(168,204,232,0.7);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .ml-item-meta { font-size: 10.5px; color: rgba(168,204,232,0.3); margin-bottom: 8px; }
        .ml-item-actions {
          display: flex; justify-content: space-between; gap: 4px;
        }
        .ml-item-btn {
          font-size: 10.5px; font-weight: 500;
          background: none; border: none; cursor: pointer;
          padding: 4px 8px; border-radius: 5px;
          transition: background 0.14s, color 0.14s;
          font-family: 'Inter', sans-serif;
        }
        .ml-item-btn-view { color: rgba(74,222,128,0.7); }
        .ml-item-btn-view:hover { background: rgba(22,163,74,0.08); color: #4ade80; }
        .ml-item-btn-copy { color: rgba(96,165,250,0.7); }
        .ml-item-btn-copy:hover { background: rgba(59,130,246,0.08); color: #60a5fa; }
        .ml-item-btn-del { color: rgba(248,113,113,0.5); }
        .ml-item-btn-del:hover { background: rgba(220,38,38,0.08); color: #f87171; }

        .ml-empty {
          padding: 48px 24px; text-align: center;
          color: rgba(168,204,232,0.25); font-size: 13.5px;
        }

        /* Pending review section */
        .ml-review-section { margin-bottom: 20px; }
        .ml-review-title {
          font-family: 'Cinzel', serif;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(168,204,232,0.25);
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 10px;
        }
        .ml-review-title::after {
          content: ''; flex: 1; height: 1px;
          background: var(--theme-border);
        }
        .ml-review-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px;
          background: rgba(201,168,76,0.05);
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 9px; margin-bottom: 8px;
        }
        .ml-review-name { font-size: 13px; color: rgba(168,204,232,0.65); }
        .ml-review-meta { font-size: 11px; color: rgba(168,204,232,0.3); margin-top: 2px; }
        .ml-review-btn {
          padding: 6px 14px; border-radius: 7px;
          font-size: 12px; font-weight: 500;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2);
          color: rgba(201,168,76,0.85); cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .ml-review-btn:hover { background: rgba(201,168,76,0.18); }

        /* Modal */
        .ml-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; overflow-y: auto; padding: 24px;
          backdrop-filter: blur(4px);
        }
        .ml-modal {
          background: #12192a;
          border: 1px solid rgba(168,204,232,0.1);
          border-radius: 16px;
          width: 100%; max-width: 480px;
          padding: 28px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .ml-modal-lg { max-width: 540px; }
        .ml-modal-title {
          font-family: 'Cinzel', serif;
          font-size: 17px; font-weight: 600;
          color: var(--theme-text); margin-bottom: 20px;
          letter-spacing: 0.02em;
        }
        .ml-modal-sub { font-size: 13px; color: var(--theme-text-muted); margin-bottom: 20px; margin-top: -12px; }
        .ml-field { margin-bottom: 16px; }
        .ml-label {
          display: block; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--theme-text-muted); margin-bottom: 7px;
        }
        .ml-input {
          width: 100%; background: rgba(168,204,232,0.05);
          border: 1px solid rgba(168,204,232,0.12); border-radius: 8px;
          padding: 11px 14px; font-size: 13.5px; color: var(--theme-text); outline: none;
          font-family: 'Inter', sans-serif; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ml-input::placeholder { color: rgba(168,204,232,0.2); }
        .ml-input:focus { border-color: rgba(42,96,153,0.5); box-shadow: 0 0 0 3px rgba(42,96,153,0.12); }

        .ml-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;
        }
        .ml-modal-btn {
          padding: 10px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          cursor: pointer; border: none;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .ml-modal-btn-cancel {
          background: var(--theme-border);
          border: 1px solid rgba(168,204,232,0.1);
          color: var(--theme-text-muted);
        }
        .ml-modal-btn-cancel:hover { background: rgba(168,204,232,0.1); color: rgba(168,204,232,0.8); }
        .ml-modal-btn-primary {
          background: rgba(27,58,107,0.7);
          border: 1px solid rgba(42,96,153,0.3);
          color: #a8cce8;
        }
        .ml-modal-btn-primary:hover { background: rgba(42,96,153,0.5); }
        .ml-modal-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .ml-modal-btn-purple {
          background: rgba(124,58,237,0.2);
          border: 1px solid rgba(124,58,237,0.3);
          color: #c4b5fd;
        }
        .ml-modal-btn-purple:disabled { opacity: 0.4; cursor: not-allowed; }
        .ml-modal-btn-green {
          background: rgba(22,163,74,0.15);
          border: 1px solid rgba(22,163,74,0.25);
          color: #4ade80;
        }
        .ml-modal-btn-green:hover { background: rgba(22,163,74,0.25); }
        .ml-modal-btn-red {
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.2);
          color: #f87171;
        }
        .ml-modal-btn-red:hover { background: rgba(220,38,38,0.2); }

        .ml-file-info {
          margin-top: 8px; font-size: 12px;
          color: var(--theme-text-muted);
        }
        .ml-detect-hint { font-size: 11.5px; color: rgba(96,165,250,0.7); margin-top: 6px; }
        .ml-thumbnail-preview {
          width: 100%; height: 160px; object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--theme-border);
        }
        .ml-no-thumb { font-size: 12.5px; color: rgba(168,204,232,0.3); }

        .ml-doc-meta {
          background: rgba(168,204,232,0.04);
          border: 1px solid var(--theme-border);
          border-radius: 10px; padding: 16px; margin-bottom: 16px;
        }
        .ml-doc-grid {
          display: grid; grid-template-columns: 1fr 2fr;
          gap: 6px 12px; font-size: 12.5px;
        }
        .ml-doc-key { color: var(--theme-text-muted); font-weight: 500; }
        .ml-doc-val { color: rgba(168,204,232,0.7); }
        .ml-doc-link { color: rgba(96,165,250,0.8); text-decoration: none; font-size: 12.5px; margin-top: 10px; display: block; }
        .ml-doc-link:hover { color: #60a5fa; text-decoration: underline; }

        .ml-video-thumb {
          width: 100%; aspect-ratio: 16/9;
          border-radius: 10px; overflow: hidden;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          color: rgba(168,204,232,0.3);
        }
        .ml-video-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      `}</style>

      <div className="ml-root">
        {/* Header */}
        <div className="ml-header">
          <div>
            <div className="ml-title">Media Library</div>
            <div className="ml-sub">Manage images, documents, and videos</div>
          </div>
          <div className="ml-actions">
            {isSuperAdmin() && pendingMassCount > 0 && (
              <button
                onClick={handleMassApprove}
                disabled={massApproving}
                className="ml-btn ml-btn-green"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                {massApproving ? 'Approving...' : `Mass Approve (${pendingMassCount})`}
              </button>
            )}
            {!isSuperAdmin() && (
              <button
                onClick={() => setShowMassUploadModal(true)}
                className="ml-btn ml-btn-green"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Mass Upload
              </button>
            )}
            {!isSuperAdmin() && (
              <button onClick={() => setShowUploadModal(true)} className="ml-btn ml-btn-primary">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Upload Media
              </button>
            )}
            {!isSuperAdmin() && (
              <button onClick={() => setShowVideoLinkModal(true)} className="ml-btn ml-btn-purple">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23,7 16,12 23,17 23,7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Add Video Link
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="ml-stats">
          {statCards.map(s => (
            <div key={s.label} className="ml-stat">
              <div className="ml-stat-icon" style={{ background: s.bg, color: s.color }}>
                {getTypeIcon(
                  s.label === 'Images'
                    ? 'image'
                    : s.label === 'Documents'
                      ? 'document'
                      : s.label === 'Videos'
                        ? 'video'
                        : 'file'
                )}
              </div>
              <div>
                <div className="ml-stat-val">{s.value}</div>
                <div className="ml-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* My pending documents — soccom_admin view of own submitted docs */}
        {!isSuperAdmin() && myPendingDocs.length > 0 && (
          <div className="ml-review-section" style={{ borderColor: 'rgba(234,179,8,0.2)', background: 'rgba(234,179,8,0.04)' }}>
            <div className="ml-review-title" style={{ color: '#eab308' }}>My Pending Documents ({myPendingDocs.length})</div>
            {myPendingDocs.map(doc => (
              <div key={doc.id} className="ml-review-item">
                <div>
                  <div className="ml-review-name">{doc.name || doc.title || 'Untitled'}</div>
                  <div className="ml-review-meta" style={{ color: '#eab308' }}>Awaiting review — submitted {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308' }}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {/* Pending review — super admin */}
        {isSuperAdmin() && pendingDocuments.length > 0 && (
          <div className="ml-review-section">
            <div className="ml-review-title">Pending Document Review</div>
            {pendingDocuments.map(doc => (
              <div key={doc.id} className="ml-review-item">
                <div>
                  <div className="ml-review-name">
                    {doc.name}{' '}
                    <span style={{ color: 'rgba(168,204,232,0.3)', fontSize: 11 }}>
                      (v{doc.version})
                    </span>
                  </div>
                  <div className="ml-review-meta">by {doc.author_name}</div>
                </div>
                <button onClick={() => handleReview(doc)} className="ml-review-btn">
                  Review
                </button>
              </div>
            ))}
          </div>
        )}

        {isSuperAdmin() && pendingVideoLinks.length > 0 && (
          <div className="ml-review-section">
            <div className="ml-review-title">Pending Video Review</div>
            {pendingVideoLinks.map(video => (
              <div key={video.id} className="ml-review-item">
                <div>
                  <div className="ml-review-name">{video.title}</div>
                  <div className="ml-review-meta">by {video.author_name}</div>
                </div>
                <button onClick={() => handleVideoReview(video)} className="ml-review-btn">
                  Review
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Media panel */}
        <div className="ml-panel">
          <div className="ml-toolbar">
            <div className="ml-tabs">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveCategory(t.key)}
                  className={`ml-tab${activeCategory === t.key ? ' active' : ''}`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ml-search"
            />
          </div>

          <div className="ml-grid">
            {media.map(item => (
              <div key={item.id} className="ml-item">
                <div className="ml-item-preview">
                  {item.type === 'image' ? (
                    <img src={getFullUrl(item.url)} alt={item.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                  ) : item.type === 'video-link' ? (
                    item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          const src = e.target.src;
                          if (src.includes('mqdefault')) {
                            e.target.src = src.replace('mqdefault', 'hqdefault');
                          } else {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            const plat = item.platform || 'video';
                            const wrapper = document.createElement('div');
                            wrapper.className = 'ml-item-placeholder';
                            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;font-size:22px;color:rgba(168,204,232,0.4)';
                            wrapper.textContent = '▶';
                            const label = document.createElement('span');
                            label.style.cssText = 'font-size:10px;text-transform:capitalize;letter-spacing:0.05em';
                            label.textContent = plat;
                            wrapper.appendChild(label);
                            parent.appendChild(wrapper);
                          }
                        }}
                      />
                    ) : (
                      <div className="ml-item-placeholder" style={{ flexDirection: 'column', gap: 6, fontSize: 22 }}>
                        ▶
                        <span style={{ fontSize: 10, textTransform: 'capitalize', letterSpacing: '0.05em', color: 'rgba(168,204,232,0.4)' }}>
                          {item.platform || 'video'}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="ml-item-placeholder">{getTypeIcon(item.type)}</div>
                  )}
                  {(item.status === 'pending') && (
                    <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(234,179,8,0.9)', color: '#1a1a00', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                      PENDING
                    </div>
                  )}
                </div>
                <div className="ml-item-info">
                  <div className="ml-item-name">{item.name}</div>
                  <div className="ml-item-meta">
                    {item.type === 'video-link' ? 'Video Link' : item.size}
                  </div>
                  <div className="ml-item-actions">
                    <button
                      onClick={() =>
                        window.open(
                          item.type === 'video-link' ? item.url : getFullUrl(item.url),
                          '_blank'
                        )
                      }
                      className="ml-item-btn ml-item-btn-view"
                    >
                      {item.type === 'video-link' ? 'Watch' : 'View'}
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          item.type === 'video-link' ? item.url : getFullUrl(item.url)
                        )
                      }
                      className="ml-item-btn ml-item-btn-copy"
                    >
                      Copy
                    </button>
                    {item.type !== 'video-link' && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="ml-item-btn ml-item-btn-del"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {media.length === 0 && <div className="ml-empty">No media files found.</div>}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="ml-modal-overlay">
            <div className="ml-modal">
              <div className="ml-modal-title">Upload Media</div>
              <form onSubmit={handleUpload}>
                <div className="ml-field">
                  <label className="ml-label">Select File</label>
                  <input type="file" onChange={handleFileChange} className="ml-input" required />
                  {selectedFile && (
                    <div className="ml-file-info">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                <div className="ml-field">
                  <label className="ml-label">Display Name</label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="ml-input"
                    placeholder="Enter display name"
                    required
                  />
                </div>
                <div className="ml-field">
                  <label className="ml-label">Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={e =>
                      setUploadForm({
                        ...uploadForm,
                        type: e.target.value,
                        category: e.target.value === 'document' ? 'documents' : 'images',
                      })
                    }
                    className="ml-input"
                  >
                    <option value="image">Image</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div className="ml-field">
                  <label className="ml-label">Notes (optional)</label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    className="ml-input"
                    placeholder="Add any notes about this file"
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                {uploadForm.type === 'document' && (
                  <div className="ml-field">
                    <label className="ml-label">Cover Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="ml-input"
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) {
                          setCoverImageFile(f);
                          setCoverImagePreview(URL.createObjectURL(f));
                        } else {
                          setCoverImageFile(null);
                          setCoverImagePreview('');
                        }
                      }}
                    />
                    {coverImagePreview && (
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(168,204,232,0.12)' }}
                      />
                    )}
                    <div className="ml-file-info">
                      Add a cover image so the document is recognisable in the Library (e.g. a screenshot of the first page).
                    </div>
                  </div>
                )}
                <div className="ml-modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setCoverImageFile(null);
                      setCoverImagePreview('');
                    }}
                    className="ml-modal-btn ml-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="ml-modal-btn ml-modal-btn-primary"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mass Upload Modal */}
        {showMassUploadModal && (
          <div className="ml-modal-overlay">
            <div className="ml-modal">
              <div className="ml-modal-title">Mass Upload Images</div>
              <div className="ml-modal-sub">Select up to 300 images. They will be stored as pending until a super admin approves them.</div>
              <div className="ml-field">
                <label className="ml-label">Select Images (max 300)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="ml-input"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 300) {
                      toast.warning('Maximum 300 images allowed. Only the first 300 will be uploaded.');
                      setMassFiles(files.slice(0, 300));
                    } else {
                      setMassFiles(files);
                    }
                  }}
                />
                {massFiles.length > 0 && (
                  <div className="ml-file-info">
                    {massFiles.length} image{massFiles.length > 1 ? 's' : ''} selected
                    {' '}({(massFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB total)
                  </div>
                )}
              </div>
              {massUploading && (
                <div style={{ margin: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(168,204,232,0.5)', marginBottom: 6 }}>
                    <span>Uploading...</span>
                    <span>{massProgress.done} / {massProgress.total}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(168,204,232,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${massProgress.total ? (massProgress.done / massProgress.total * 100) : 0}%`,
                      background: 'rgba(42,96,153,0.8)',
                      borderRadius: 3,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              )}
              <div className="ml-modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowMassUploadModal(false); setMassFiles([]); }}
                  disabled={massUploading}
                  className="ml-modal-btn ml-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMassUpload}
                  disabled={massUploading || massFiles.length === 0}
                  className="ml-modal-btn ml-modal-btn-primary"
                >
                  {massUploading ? `Uploading (${massProgress.done}/${massProgress.total})...` : `Upload ${massFiles.length || ''} Image${massFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Link Modal */}
        {showVideoLinkModal && (
          <div className="ml-modal-overlay">
            <div className="ml-modal ml-modal-lg">
              <div className="ml-modal-title">Add Video Link</div>
              <div className="ml-modal-sub">
                Add video links from YouTube, TikTok, Facebook, Instagram, Vimeo, Google Drive, X/Twitter, Snapchat, and more.
              </div>
              <form onSubmit={handleVideoLinkSubmit}>
                <div className="ml-field">
                  <label className="ml-label">Video URL *</label>
                  <input
                    type="url"
                    value={videoLinkForm.url}
                    onChange={handleUrlChange}
                    className="ml-input"
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  {fetchingThumbnail && (
                    <div className="ml-detect-hint">Detecting video platform...</div>
                  )}
                </div>
                <div className="ml-field">
                  <label className="ml-label">Title *</label>
                  <input
                    type="text"
                    value={videoLinkForm.title}
                    onChange={e => setVideoLinkForm({ ...videoLinkForm, title: e.target.value })}
                    className="ml-input"
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div className="ml-field">
                  <label className="ml-label">Description</label>
                  <textarea
                    value={videoLinkForm.description}
                    onChange={e =>
                      setVideoLinkForm({ ...videoLinkForm, description: e.target.value })
                    }
                    className="ml-input"
                    placeholder="Enter video description"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                {videoLinkForm.thumbnail && (
                  <div className="ml-field">
                    <label className="ml-label">Preview</label>
                    <img
                      src={videoLinkForm.thumbnail}
                      alt="Video preview"
                      className="ml-thumbnail-preview"
                      onError={e => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {!videoLinkForm.thumbnail && videoLinkForm.url && !fetchingThumbnail && (
                  <div className="ml-no-thumb">
                    No preview available. Will use church logo as placeholder.
                  </div>
                )}
                <div className="ml-modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoLinkModal(false);
                      setVideoLinkForm({ url: '', title: '', description: '', thumbnail: '' });
                    }}
                    className="ml-modal-btn ml-modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingVideo || !videoLinkForm.url || !videoLinkForm.title}
                    className="ml-modal-btn ml-modal-btn-purple"
                  >
                    {submittingVideo ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Review Modal */}
        {showReviewModal && selectedDoc && (
          <div className="ml-modal-overlay">
            <div className="ml-modal ml-modal-lg">
              <div className="ml-modal-title">Review Document</div>
              <div className="ml-doc-meta">
                <div className="ml-doc-grid">
                  <span className="ml-doc-key">Name</span>
                  <span className="ml-doc-val">{selectedDoc.name}</span>
                  <span className="ml-doc-key">Version</span>
                  <span className="ml-doc-val">{selectedDoc.version}</span>
                  <span className="ml-doc-key">Type</span>
                  <span className="ml-doc-val">{selectedDoc.type}</span>
                  <span className="ml-doc-key">Submitted by</span>
                  <span className="ml-doc-val">{selectedDoc.author_name}</span>
                  <span className="ml-doc-key">Date</span>
                  <span className="ml-doc-val">
                    {new Date(selectedDoc.created_at).toLocaleDateString()}
                  </span>
                  {selectedDoc.notes && (
                    <>
                      <span className="ml-doc-key">Notes</span>
                      <span className="ml-doc-val">{selectedDoc.notes}</span>
                    </>
                  )}
                </div>
                {selectedDoc.url && (
                  <a
                    href={getFullUrl(selectedDoc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-doc-link"
                  >
                    View / Download File
                  </a>
                )}
              </div>
              <div className="ml-field">
                <label className="ml-label">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="ml-input"
                  placeholder="Add notes about your review decision..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="ml-modal-footer">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedDoc(null);
                    setReviewNotes('');
                  }}
                  className="ml-modal-btn ml-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={handleReject} className="ml-modal-btn ml-modal-btn-red">
                  Reject
                </button>
                <button onClick={handleApprove} className="ml-modal-btn ml-modal-btn-green">
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Review Modal */}
        {showVideoReviewModal && selectedVideo && (
          <div className="ml-modal-overlay">
            <div className="ml-modal ml-modal-lg">
              <div className="ml-modal-title">Review Video Link</div>
              <div className="ml-doc-meta">
                <div className="ml-video-thumb">
                  {selectedVideo.thumbnail ? (
                    <img
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="23,7 16,12 23,17 23,7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  )}
                </div>
                <div className="ml-doc-grid">
                  <span className="ml-doc-key">Title</span>
                  <span className="ml-doc-val">{selectedVideo.title}</span>
                  <span className="ml-doc-key">Platform</span>
                  <span className="ml-doc-val">{selectedVideo.platform}</span>
                  <span className="ml-doc-key">Submitted by</span>
                  <span className="ml-doc-val">{selectedVideo.author_name}</span>
                  <span className="ml-doc-key">URL</span>
                  <span className="ml-doc-val">
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-doc-link"
                      style={{ marginTop: 0 }}
                    >
                      Open Link
                    </a>
                  </span>
                  {selectedVideo.description && (
                    <>
                      <span className="ml-doc-key">Description</span>
                      <span className="ml-doc-val">{selectedVideo.description}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-field">
                <label className="ml-label">Review Notes</label>
                <textarea
                  value={videoReviewNotes}
                  onChange={e => setVideoReviewNotes(e.target.value)}
                  className="ml-input"
                  placeholder="Add notes about your review decision..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="ml-modal-footer">
                <button
                  onClick={() => {
                    setShowVideoReviewModal(false);
                    setSelectedVideo(null);
                    setVideoReviewNotes('');
                  }}
                  className="ml-modal-btn ml-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={handleVideoReject} className="ml-modal-btn ml-modal-btn-red">
                  Reject
                </button>
                <button onClick={handleVideoApprove} className="ml-modal-btn ml-modal-btn-green">
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MediaLibrary;
