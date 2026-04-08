import React from 'react';
import { useNavigate } from 'react-router-dom';
import ParishTree from '../components/ParishTree';

export default function CommunitiesPage() {
  const navigate = useNavigate();

  const handleNavigate = path => {
    navigate(path);
  };

  return (
    <div className="hn-parchment-page">
      <style>{`
        .hn-parchment-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f5f0e6 0%, #ebe4d4 50%, #e0d8c4 100%);
          padding: 20px 16px 40px;
        }
        .hn-parchment-container {
          background: linear-gradient(155deg, #fdfbf7 0%, #f8f4e8 50%, #f0ead6 100%);
          border-radius: 8px;
          box-shadow: 
            0 4px 24px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8);
          padding: 24px;
        }
        .hn-section-heading {
          font-family: 'Cinzel', Georgia, serif;
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 600;
          color: #2e1a06;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .hn-section-sub {
          font-family: 'IM Fell English', Georgia, serif;
          font-size: clamp(14px, 2vw, 18px);
          color: #6b4a1e;
          font-style: italic;
          margin-bottom: 12px;
        }
        .hn-section-rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .hn-rule-line {
          flex: 1;
          max-width: 120px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,105,20,0.4), transparent);
        }
        .hn-rule-line.rev {
          background: linear-gradient(90deg, transparent, rgba(139,105,20,0.4), transparent);
        }
        .hn-rule-cross {
          color: #8b6914;
          font-size: 14px;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="hn-parchment-container">
          <div className="relative p-2">
            <div style={{ textAlign: 'center', paddingTop: 8, paddingBottom: 16 }}>
              <div className="hn-section-heading">Our Parish Communities</div>
              <p className="hn-section-sub">Explore the branches of our parish family</p>
              <div className="hn-section-rule">
                <div className="hn-rule-line" />
                <span className="hn-rule-cross">✝</span>
                <div className="hn-rule-line rev" />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 13,
                  color: '#6b4a1e',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                Click any branch on the tree to explore community details, recent news, and page
                content.
              </p>
            </div>

            <ParishTree onNavigate={handleNavigate} />

            <div
              style={{
                textAlign: 'center',
                marginTop: 24,
                padding: '16px 24px',
                background: 'rgba(139,105,20,0.05)',
                borderRadius: 8,
                border: '1px solid rgba(139,105,20,0.12)',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#6b4a1e',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                Our Eyes Have Seen Your Salvation — Luke 2:30
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
