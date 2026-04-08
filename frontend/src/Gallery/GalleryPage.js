import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useCMS } from '../context/CMSContext';
import {
  Cross2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
} from '@radix-ui/react-icons';

const PARCHMENT_BG = `linear-gradient(135deg, #FDF5E6 0%, #FAF0E6 100%)`;

const GalleryPage = () => {
  const { gallery, getGalleryByCategory, getGalleryByPostId } = useCMS();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('post');

  const [isOpen, setIsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // Filter images based on category
  const getFilteredImages = () => {
    if (postId) {
      return getGalleryByPostId(postId);
    }
    if (activeTab === 'all') {
      return gallery;
    }
    return getGalleryByCategory(activeTab);
  };

  const filteredImages = getFilteredImages();

  // Reset state when postId changes
  useEffect(() => {
    if (postId) {
      setActiveTab('posts');
    }
  }, [postId]);

  const openModal = index => {
    setSelectedImageIndex(index);
    setZoom(1);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setZoom(1);
  };

  const goToPrevious = useCallback(() => {
    setSelectedImageIndex(prev => (prev === 0 ? filteredImages.length - 1 : prev - 1));
    setZoom(1);
  }, [filteredImages.length]);

  const goToNext = useCallback(() => {
    setSelectedImageIndex(prev => (prev === filteredImages.length - 1 ? 0 : prev + 1));
    setZoom(1);
  }, [filteredImages.length]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const image = filteredImages[selectedImageIndex];
    if (image) {
      const link = document.createElement('a');
      link.href = process.env.PUBLIC_URL + image.src;
      link.download = image.alt || 'gallery-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') closeModal();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredImages.length, goToNext, goToPrevious]);

  const currentImage = filteredImages[selectedImageIndex];

  return (
    <div className="min-h-screen py-10 px-5" style={{ background: PARCHMENT_BG }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B3A6B] mb-2">Church Gallery</h1>
          {postId ? (
            <Link to="/posts" className="text-[#1B3A6B] hover:underline">
              ← Back to Posts
            </Link>
          ) : (
            <p className="text-gray-600">Browse through our collection of photos and memories</p>
          )}
        </div>

        {/* Category Tabs (only show if no post filter) */}
        {!postId && (
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="flex flex-wrap justify-center gap-2 mb-8">
              <Tabs.Trigger
                value="all"
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-white text-[#1B3A6B] hover:bg-gray-100'
                }`}
              >
                All Photos
              </Tabs.Trigger>
              <Tabs.Trigger
                value="posts"
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-white text-[#1B3A6B] hover:bg-gray-100'
                }`}
              >
                From Posts
              </Tabs.Trigger>
              <Tabs.Trigger
                value="general"
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === 'general'
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-white text-[#1B3A6B] hover:bg-gray-100'
                }`}
              >
                General
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value={activeTab}>
              <GalleryGrid images={filteredImages} onImageClick={openModal} />
            </Tabs.Content>
          </Tabs.Root>
        )}

        {/* Show gallery when filtered by post */}
        {postId && <GalleryGrid images={filteredImages} onImageClick={openModal} />}

        {/* Radix UI Dialog Lightbox */}
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50 animate-fadeIn" />
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
              {/* Close button */}
              <Dialog.Close asChild>
                <button
                  className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2"
                  aria-label="Close"
                >
                  <Cross2Icon className="w-6 h-6" />
                </button>
              </Dialog.Close>

              {/* Image container */}
              <div
                className="relative max-w-[90vw] max-h-[90vh] overflow-auto"
                style={{
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s ease-out',
                }}
              >
                {currentImage && (
                  <img
                    src={process.env.PUBLIC_URL + currentImage.src}
                    alt={currentImage.alt}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>

              {/* Navigation arrows */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Controls bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
                {/* Zoom controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
                    aria-label="Zoom out"
                  >
                    <ZoomOutIcon className="w-5 h-5" />
                  </button>
                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
                    aria-label="Zoom in"
                  >
                    <ZoomInIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/30" />

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1 flex items-center gap-1"
                  aria-label="Download image"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span className="text-sm">Download</span>
                </button>
              </div>

              {/* Image counter */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                {selectedImageIndex + 1} / {filteredImages.length}
              </div>

              {/* Link to post if applicable */}
              {currentImage?.postId && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <Link
                    to={`/posts/${currentImage.postId}`}
                    className="bg-[#1B3A6B] text-white px-4 py-2 rounded-full text-sm hover:bg-[#004b7c] transition-colors"
                  >
                    View Related Post
                  </Link>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};

// Gallery Grid Component
const GalleryGrid = ({ images, onImageClick }) => {
  if (images.length === 0) {
    return (
      <div className="text-center text-gray-600 py-12">
        <p className="text-xl">No images found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id || index}
          className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer"
          onClick={() => onImageClick(index)}
        >
          <img
            src={process.env.PUBLIC_URL + image.src}
            alt={image.alt || `Gallery ${index + 1}`}
            className="w-full h-48 sm:h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomInIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          {/* Post indicator */}
          {image.postId && (
            <div className="absolute top-2 right-2 bg-[#1B3A6B] text-white text-xs px-2 py-1 rounded-full">
              From Post
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GalleryPage;
