import React from 'react';
import Slideshow from '../pages/slideshow';
import * as Separator from '@radix-ui/react-separator';
import { Link } from 'react-router-dom';
import Gallery from '../Gallery/Gallery';
import { useAuth } from '../context/AuthContext';
import GlobalTheme from '../components/GlobalTheme';
import { LoadingSpinner, ErrorBanner } from './shared';
import NoticesCard from './NoticesCard';

const Section = ({ title, subtitle, children }) => (
  <GlobalTheme>
    <div className="hn-parchment-page">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <div className="hn-parchment-container">
          <div className="hn-parchment-bar"></div>
          <div style={{ padding: '48px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 className="hn-section-heading">{title}</h2>
              {subtitle && <p className="hn-section-sub">{subtitle}</p>}
              <div className="hn-section-rule" style={{ marginBottom: 0 }}>
                <div className="hn-rule-line" />
                <span className="hn-rule-cross">+</span>
                <div className="hn-rule-line rev" />
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  </GlobalTheme>
);

const Home = () => {
  const { posts, loading: authLoading, error: authError } = useAuth();

  if (authLoading) return <LoadingSpinner message="Loading home page..." />;
  if (authError) return <ErrorBanner message={authError} onRetry={() => window.location.reload()} />;

  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 6);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div style={{ overflowX: 'hidden' }}>
      <Slideshow />

      {/* ── Stay Connected ── */}
      <section className="hn-connected">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h2 className="hn-section-heading">Stay Connected</h2>
          <p className="hn-section-sub">Join us in worship, fellowship and community</p>
          <div className="hn-section-rule">
            <div className="hn-rule-line" />
            <span className="hn-rule-cross">+</span>
            <div className="hn-rule-line rev" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Mass Times */}
            <div className="hn-card">
              <div className="hn-card-header hn-card-header-blue">
                <h3>Mass Times</h3>
              </div>
              <div style={{ padding: 28 }}>
                <p style={{ color: '#6b7280', textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
                  Join us for daily and weekend services
                </p>
                <div className="hn-mass-item">
                  <h4>Weekday Masses</h4>
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Tuesday to Friday at 6:30 AM</p>
                </div>
                <div className="hn-mass-item">
                  <h4>Saturday Schedule</h4>
                  <ul style={{ color: '#6b7280', fontSize: 14, listStyle: 'disc', listStylePosition: 'inside', marginTop: 4 }}>
                    <li>Adoration at 7:00 AM</li>
                    <li>Mass at 8:00 AM</li>
                  </ul>
                </div>
                <div className="hn-mass-item" style={{ marginBottom: 0 }}>
                  <h4>Sunday Masses</h4>
                  <ul style={{ color: '#6b7280', fontSize: 14, listStyle: 'disc', listStylePosition: 'inside', marginTop: 4 }}>
                    <li>English Mass at 7:30 AM</li>
                    <li>Shona Mass at 10:00 AM</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Get Involved */}
            <div className="hn-card">
              <div className="hn-card-header hn-card-header-gold">
                <h3>Get Involved</h3>
              </div>
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={process.env.PUBLIC_URL + '/images/logo.jpg'}
                  alt="Holy Name Church"
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    marginBottom: 28,
                    border: '3px solid #1B3A6B',
                    boxShadow: '0 8px 24px rgba(27,58,107,0.15)'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 260 }}>
                  <Link to="/programs" className="hn-btn-primary">View Events</Link>
                  <Link to="/contact" className="hn-btn-outline">Reach Out To Us</Link>
                </div>
              </div>
            </div>

            {/* Adoration & Reconciliation */}
            <div className="hn-card">
              <div className="hn-card-header hn-card-header-red">
                <h3>Adoration & Reconciliation</h3>
              </div>
              <div style={{ padding: 28 }}>
                <img
                  src={process.env.PUBLIC_URL + '/images/112.jpg'}
                  alt="Adoration"
                  style={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 12,
                    marginBottom: 20
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="hn-info-card">
                    <h4>Friday Adoration</h4>
                    <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
                      Every first Friday of the month - Adoration from 7:00 AM, Benediction at 5:30 PM, Mass at 6:00 PM.
                    </p>
                  </div>
                  <div className="hn-info-card">
                    <h4>Reconciliation</h4>
                    <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
                      Every second Saturday of the month after the 8:00 AM Mass.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator.Root style={{ background: 'rgba(27,58,107,0.08)', height: 1, width: '100%', margin: '48px 0' }} />

      {/* ── Recent Posts ── */}
      <Section title="Recent Posts" subtitle="Latest news and updates from Holy Name Parish">
        {recentPosts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {recentPosts.map(post => (
              <Link
                to={`/posts/${post.id}`}
                key={post.id}
                className="hn-post-card"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                {post.images && post.images.length > 0 && (
                  <div style={{ height: 160, overflow: 'hidden' }}>
                    <img
                      src={process.env.PUBLIC_URL + post.images[0]}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <span className="hn-post-pill">{post.category}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1B3A6B', marginBottom: 8, lineHeight: 1.4 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.excerpt || post.content.substring(0, 80) + '...'}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>{formatDate(post.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>No posts available yet.</p>
        )}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link to="/posts" className="hn-view-all">View All Posts</Link>
        </div>
      </Section>

      {/* ── Parish Notices & Events ── */}
      <Section title="Parish Notices & Events" subtitle="Bulletins, upcoming events and announcements">
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <NoticesCard />
        </div>
      </Section>

      <Gallery />

      <Separator.Root style={{ background: 'rgba(27,58,107,0.06)', height: 1, width: '100%', margin: '32px 0' }} />
    </div>
  );
};

export default Home;