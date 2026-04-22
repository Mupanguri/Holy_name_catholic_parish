import React from 'react';
import { Link } from 'react-router-dom';
import { faFacebook, faInstagram, faWhatsapp, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Footer = () => {
  return (
    <footer style={{
      width: '100%',
      background: 'linear-gradient(180deg, #0f1923 0%, #0a0e14 100%)',
      color: 'rgba(255,255,255,0.6)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 48,
          marginBottom: 48
        }}>
          {/* Church Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <img
                src={process.env.PUBLIC_URL + '/images/logo.jpg'}
                alt="Holy Name Church"
                style={{
                  width: 48, height: 48, borderRadius: 10,
                  objectFit: 'cover',
                  border: '2px solid rgba(201,168,76,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}
              />
              <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Holy Name Catholic Church</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Mabelreign, Harare</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <a
                href="https://maps.app.goo.gl/Ju4Y6aJ9WirjyEAw6"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ width: 14, color: '#C9A84C', marginTop: 2, flexShrink: 0 }} />
                17 Wessex Drive, Cotswold Hills, Mabelreign, Harare, Zimbabwe
              </a>
              <a
                href="tel:+263771234567"
                style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <FontAwesomeIcon icon={faPhone} style={{ width: 14, color: '#C9A84C' }} />
                +263 77 123 4567
              </a>
              <a
                href="mailto:holynameparishmabelreign@gmail.com"
                style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s', wordBreak: 'break-all' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <FontAwesomeIcon icon={faEnvelope} style={{ width: 14, color: '#C9A84C', flexShrink: 0 }} />
                holynameparishmabelreign@gmail.com
              </a>
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
                { label: 'Programs', to: '/programs' },
                { label: 'Library', to: '/library' },
                { label: 'Contact Us', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    style={{
                      color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
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
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { icon: faFacebook, href: 'https://www.facebook.com/holynamezw', label: 'Facebook', hoverBg: '#1877F2' },
                { icon: faInstagram, href: 'https://www.instagram.com/holy_name.parish', label: 'Instagram', hoverBg: '#E1306C' },
                { icon: faWhatsapp, href: 'https://www.whatsapp.com/channel/0029VbAYORVA89MeZ1ZmoJ20', label: 'WhatsApp', hoverBg: '#25D366' },
                { icon: faTiktok, href: 'https://www.tiktok.com/@holynameparish', label: 'TikTok', hoverBg: '#010101' },
                { icon: faYoutube, href: 'https://www.youtube.com/@HolyNameParishMabelreign', label: 'YouTube', hoverBg: '#FF0000' },
              ].map(({ icon, href, label, hoverBg }) => (
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
                  onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
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
            © 2026 Holy Name Catholic Church, Mabelreign. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
