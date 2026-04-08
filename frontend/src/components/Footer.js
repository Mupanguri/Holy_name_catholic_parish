import React from 'react';
import { Link } from 'react-router-dom';
import { faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faChurch, faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Footer = () => {
  return (
    <footer style={{
      width: '100%',
      background: 'linear-gradient(180deg, #0f1923 0%, #0a0e14 100%)',
      color: 'rgba(255,255,255,0.6)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px' }}>
        {/* Main content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 48,
          marginBottom: 48
        }}>
          {/* Church Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(27,58,107,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faChurch} style={{ width: 22, height: 22, color: '#C9A84C' }} />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Holy Name Catholic Church</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Mabelreign, Harare</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ width: 14, color: '#C9A84C' }} />
                100 Enterprise Road, Mabelreign
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FontAwesomeIcon icon={faPhone} style={{ width: 14, color: '#C9A84C' }} />
                +263 77 123 4567
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FontAwesomeIcon icon={faEnvelope} style={{ width: 14, color: '#C9A84C' }} />
                holyname@church.zw
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{
              color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 20, paddingBottom: 12,
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Home', to: '/' },
                { label: 'Posts & Announcements', to: '/posts' },
                { label: 'Events Calendar', to: '/events' },
                { label: 'Photo Gallery', to: '/gallery' },
                { label: 'Contact Us', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} style={{
                    color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C' }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 style={{
              color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 20, paddingBottom: 12,
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              Connect With Us
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
              Follow us on social media for updates and inspirational content.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: faFacebook, href: 'https://www.facebook.com/holynamezw', label: 'Facebook' },
                { icon: faInstagram, href: 'https://www.instagram.com/holy_name.parish', label: 'Instagram' },
                { icon: faWhatsapp, href: 'https://wa.me/263771234567', label: 'WhatsApp' },
              ].map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(27,58,107,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,58,107,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <FontAwesomeIcon icon={icon} style={{ width: 18, height: 18 }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            2026 Holy Name Catholic Church, Mabelreign. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;