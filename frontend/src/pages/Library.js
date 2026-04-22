import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlobalTheme from '../components/GlobalTheme';
import { getFullUrl } from '../services/api';

const isPdf = name => (name || '').toLowerCase().endsWith('.pdf');

const getFileTypeIcon = name => {
  const ext = (name || '').split('.').pop().toLowerCase();
  const types = {
    pdf:  { bg: '#F40F02', letter: 'PDF', size: 13 },
    doc:  { bg: '#2B579A', letter: 'W',   size: 28 },
    docx: { bg: '#2B579A', letter: 'W',   size: 28 },
    ppt:  { bg: '#C43E1C', letter: 'P',   size: 28 },
    pptx: { bg: '#C43E1C', letter: 'P',   size: 28 },
    xls:  { bg: '#217346', letter: 'X',   size: 28 },
    xlsx: { bg: '#217346', letter: 'X',   size: 28 },
    txt:  { bg: '#6b7280', letter: 'TXT', size: 13 },
  };
  const { bg = '#6b7280', letter = ext.toUpperCase() || 'FILE', size = 13 } = types[ext] || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 64, height: 76, background: bg, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 18, height: 18,
          background: 'rgba(255,255,255,0.22)', borderBottomLeftRadius: 6,
        }} />
        <span style={{ color: '#fff', fontSize: size, fontWeight: 700, letterSpacing: '0.03em', fontFamily: 'Inter, sans-serif' }}>
          {letter}
        </span>
      </div>
    </div>
  );
};

const PdfThumbnail = ({ url, name }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50">
      {getFileTypeIcon(name)}
    </div>
  );
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        style={{
          width: 794,
          height: 1123,
          transform: 'scale(0.22)',
          transformOrigin: 'top left',
          pointerEvents: 'none',
          border: 'none',
        }}
        title={name}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const Library = () => {
  const { getAllMedia, getMediaByCategory, getApprovedVideoLinks } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const allMedia = getAllMedia();
  const imageMedia = getMediaByCategory('images');
  const documentMedia = getMediaByCategory('documents');
  const videoMedia = getMediaByCategory('videos');
  const approvedVideoLinks = getApprovedVideoLinks();

  const getFilteredMedia = () => {
    let media =
      activeCategory === 'images'
        ? imageMedia
        : activeCategory === 'documents'
          ? documentMedia
          : activeCategory === 'videos'
            ? [...videoMedia, ...approvedVideoLinks.map(v => ({ ...v, id: `vl-${v.id}`, name: v.title, type: 'video-link', url: v.url, thumbnail: v.thumbnail }))]
            : allMedia;

    if (searchTerm) {
      media = media.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return media;
  };

  const media = getFilteredMedia();

  const getTypeIcon = type => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video':
      case 'video-link': return '🎬';
      default: return '📁';
    }
  };

  const content = (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A6B] mb-2">📚 Parish Library</h1>
        <p className="text-gray-600">
          Documents, images, and resources from Holy Name Catholic Church
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeCategory === 'all'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-white text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
          }`}
        >
          📁 All Files ({allMedia.length + approvedVideoLinks.length})
        </button>
        <button
          onClick={() => setActiveCategory('images')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeCategory === 'images'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-white text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
          }`}
        >
          🖼️ Images ({imageMedia.length})
        </button>
        <button
          onClick={() => setActiveCategory('documents')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeCategory === 'documents'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-white text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
          }`}
        >
          📄 Documents ({documentMedia.length})
        </button>
        <button
          onClick={() => setActiveCategory('videos')}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeCategory === 'videos'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-white text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
          }`}
        >
          🎬 Videos ({videoMedia.length + approvedVideoLinks.length})
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-6 py-3 border-2 border-[#1B3A6B]/20 rounded-full focus:outline-none focus:border-[#1B3A6B]"
        />
      </div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">📂 No files found</p>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="aspect-square relative bg-gray-100">
                {item.type === 'image' ? (
                  <img
                    src={getFullUrl(item.url)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                    }}
                  />
                ) : item.type === 'document' && item.cover_image ? (
                  <img
                    src={getFullUrl(item.cover_image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                    }}
                  />
                ) : item.type === 'document' && isPdf(item.name) ? (
                  <PdfThumbnail url={getFullUrl(item.url)} name={item.name} />
                ) : item.type === 'document' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                    {getFileTypeIcon(item.name)}
                    <p className="text-xs text-center text-gray-500 mt-3 truncate w-full px-2">{item.name}</p>
                  </div>
                ) : item.type === 'video-link' && item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                ) : item.type === 'video-link' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <span className="text-5xl mb-2">🎬</span>
                    <p className="text-xs text-center text-gray-500 truncate w-full">{item.name}</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <span className="text-5xl mb-2">{getTypeIcon(item.type)}</span>
                    <p className="text-xs text-center text-gray-500 truncate w-full">{item.name}</p>
                  </div>
                )}
                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 px-2 py-1 rounded text-xs font-semibold">
                    {item.type === 'video-link' ? 'Video' : item.type}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-gray-800 truncate" title={item.name}>
                  {item.name}
                </h3>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{item.type === 'video-link' ? 'Video Link' : item.size}</span>
                  <span>{item.uploadedAt}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <a
                    href={item.type === 'video-link' ? item.url : getFullUrl(item.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs bg-[#1B3A6B] text-white py-1 rounded hover:bg-[#0F2444]"
                  >
                    {item.type === 'video-link' ? 'Watch' : item.type === 'image' ? 'View' : 'Download'}
                  </a>
                  {item.type === 'image' && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = getFullUrl(item.url);
                        link.download = item.name;
                        link.click();
                      }}
                      className="flex-1 text-center text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"
                    >
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(item.type === 'video-link' ? item.url : getFullUrl(item.url))}
                    className="flex-1 text-center text-xs border border-[#1B3A6B] text-[#1B3A6B] py-1 rounded hover:bg-[#1B3A6B]/10"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Links Section */}
      {approvedVideoLinks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-4">🎬 Video Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedVideoLinks.map(video => (
              <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="aspect-video relative bg-gray-100">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1B3A6B]">
                        <span className="text-5xl">🎬</span>
                      </div>
                    )}
                    {/* Platform Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">
                        {video.platform === 'youtube' ? '▶️ YouTube' :
                         video.platform === 'tiktok' ? '🎵 TikTok' :
                         video.platform === 'instagram' ? '📷 Instagram' :
                         video.platform === 'google_drive' ? '📁 Drive' : '🔗 Video'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-800 truncate" title={video.title}>
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-gradient-to-r from-[#1B3A6B]/10 to-[#C9A84C]/10 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-[#1B3A6B] mb-2">📂 Upload Your Files</h2>
        <p className="text-gray-600 mb-4">
          Church members can submit documents, photos, and videos for the library.
        </p>
        <p className="text-sm text-gray-500">
          Contact the Social Committee (SocCom) to request upload access.
        </p>
      </div>
    </div>
  );

  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Library</h1>
              <p className="hn-section-sub">Resources and media from Holy Name Parish</p>
              {content}
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default Library;
