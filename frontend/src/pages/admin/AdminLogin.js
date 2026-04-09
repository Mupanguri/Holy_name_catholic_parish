import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const { theme, colors } = useOutletContext() || {};
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 48 });
  const [phase, setPhase] = useState('idle'); // idle | cracking | opening | blazing | closing | reforming
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('logoutAnimation') === 'true') {
      sessionStorage.removeItem('logoutAnimation');
      triggerLogout();
    }
  }, []);

  const handleMouseMove = e => {
    if (phase !== 'idle') return;
    setMousePos({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100,
    });
  };

  const triggerCrucifix = () => {
    setPhase('cracking');
    setTimeout(() => setPhase('opening'), 600);
    setTimeout(() => setPhase('blazing'), 1500);
    setTimeout(() => navigate('/admin/dashboard'), 2400);
  };

  const triggerLogout = () => {
    setPhase('closing');
    setTimeout(() => setPhase('reforming'), 2500);
    setTimeout(() => setPhase('idle'), 5800);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      // Direct navigation - no animation
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const animating = phase !== 'idle' && phase !== 'closing' && phase !== 'reforming';
  const isLoggingOut = phase === 'closing' || phase === 'reforming';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .al-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          background: #06080f;
          position: relative; overflow: hidden;
          transition: background 1s ease;
        }
        .al-root.phase-blazing { background: #d6eaff; }

        .al-root::after {
          content: ''; position: fixed; inset: 0;
          background: radial-gradient(ellipse 80% 90% at 50% 50%, rgba(30,70,140,0.08) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .al-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(168,204,232,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,204,232,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none; z-index: 0;
          transition: opacity 0.6s ease;
        }
        .al-grid.phase-blazing { opacity: 0; }

        .al-torch {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          transition: opacity 0.5s ease;
        }
        .al-torch.phase-cracking,
        .al-torch.phase-opening,
        .al-torch.phase-blazing { opacity: 0; }

        /* Smoldering embers on the dark backdrop as the card opens */
        .al-smolder {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 2; opacity: 0;
        }
        .al-smolder.phase-opening { animation: smolderAnim 1.4s ease forwards; }
        .al-smolder.phase-blazing { opacity: 0; }

        @keyframes smolderAnim {
          0%   { opacity: 0; background: transparent; }
          25%  {
            opacity: 1;
            background:
              radial-gradient(ellipse 18% 10% at 8%  88%, rgba(255,110,10,0.22) 0%, transparent 100%),
              radial-gradient(ellipse 10% 14% at 92% 78%, rgba(255,70,5,0.18)   0%, transparent 100%),
              radial-gradient(ellipse 14% 8%  at 55% 95%, rgba(255,140,20,0.16) 0%, transparent 100%);
          }
          55%  {
            opacity: 1;
            background:
              radial-gradient(ellipse 28% 18% at 5%  90%, rgba(255,150,30,0.28) 0%, transparent 100%),
              radial-gradient(ellipse 18% 22% at 95% 80%, rgba(255,90,10,0.22)  0%, transparent 100%),
              radial-gradient(ellipse 22% 12% at 48% 97%, rgba(255,170,40,0.20) 0%, transparent 100%),
              radial-gradient(ellipse 12% 18% at 3%  42%, rgba(200,70,5,0.14)   0%, transparent 100%),
              radial-gradient(ellipse 8%  12% at 97% 30%, rgba(220,100,15,0.12) 0%, transparent 100%);
          }
          85%  { opacity: 0.4; background: transparent; }
          100% { opacity: 0;   background: transparent; }
        }

        /* Final white-blue blaze that sweeps the whole screen */
        .al-blaze {
          position: fixed; inset: 0; z-index: 60;
          pointer-events: none; opacity: 0;
          background: radial-gradient(ellipse 55% 55% at 50% 50%,
            rgba(255,255,255,1)    0%,
            rgba(210,235,255,0.95) 18%,
            rgba(150,210,255,0.80) 35%,
            rgba(90,165,235,0.50)  55%,
            transparent            75%
          );
        }
        .al-blaze.phase-blazing { animation: blazeExpand 0.9s cubic-bezier(0.2,0,0.4,1) forwards; }

        @keyframes blazeExpand {
          0%   { opacity: 0; transform: scale(0.3); }
          35%  { opacity: 1; }
          100% { opacity: 1; transform: scale(3); }
        }

        /* ── Logout: Blur corners to center ── */
        .al-closer {
          position: fixed; inset: 0; z-index: 50;
          pointer-events: none; opacity: 0;
        }
        .al-closer.phase-closing { animation: cornerBlur 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .al-closer.phase-reforming { animation: cornerUnblur 3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes cornerBlur {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          100% { opacity: 1; background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(6,8,15,0.85) 30%, rgba(6,8,15,1) 60%); }
        }

        @keyframes cornerUnblur {
          0%   { opacity: 1; background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(6,8,15,0.85) 30%, rgba(6,8,15,1) 60%); }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Reform panels from center ── */
        .al-panel.phase-reforming {
          opacity: 0;
          transition: opacity 0.6s ease;
          animation: reformPanel 2.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.4s;
        }
        .al-panel.phase-reforming { opacity: 1; }

        @keyframes reformTL {
          0%   { transform: translate(-240%,-220%) rotate(-18deg); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(0,0) rotate(0deg); opacity: 1; }
        }
        @keyframes reformTR {
          0%   { transform: translate(240%,-220%) rotate(18deg); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(0,0) rotate(0deg); opacity: 1; }
        }
        @keyframes reformBL {
          0%   { transform: translate(-240%,220%) rotate(18deg); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(0,0) rotate(0deg); opacity: 1; }
        }
        @keyframes reformBR {
          0%   { transform: translate(240%,220%) rotate(-18deg); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translate(0,0) rotate(0deg); opacity: 1; }
        }

        .al-card.phase-closing { opacity: 0; pointer-events: none; transition: opacity 1s ease; }
        .al-card.phase-reforming { opacity: 1; pointer-events: auto; animation: cardReform 1.8s ease forwards; animation-delay: 1.5s; }

        @keyframes cardReform {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Cross light for reform */
        .al-cross-light.phase-reforming { animation: crossReform 2.2s ease forwards; animation-delay: 0.4s; }

        @keyframes crossReform {
          0%   { opacity: 1; transform: scale(2.2); }
          60%  { opacity: 1; }
          100% { opacity: 0; transform: scale(0.2); }
        }

        /* Card wrapper — panels sit absolute inside this */
        .al-card-wrapper {
          position: relative; z-index: 5;
          width: 100%; max-width: 400px;
        }

        .al-card {
          position: relative; width: 100%;
          background: rgba(18, 32, 60, 0.96);
          border: 1px solid rgba(168,204,232,0.16);
          border-radius: 20px; overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(140,200,255,0.08),
            0 0 18px 6px   rgba(160,210,255,0.55),
            0 0 50px 18px  rgba(100,170,240,0.30),
            0 0 100px 40px rgba(70,140,220,0.15),
            0 32px 80px    rgba(0,0,0,0.7);
          transition: opacity 0.15s ease, box-shadow 0.4s ease;
        }

        /* Warm gold halo when the crack is forming */
        .al-card.phase-cracking {
          box-shadow:
            0 0 0 1px  rgba(255,220,100,0.35),
            0 0 22px 8px   rgba(255,200,80,0.60),
            0 0 65px 22px  rgba(200,160,60,0.40),
            0 0 130px 55px rgba(150,120,40,0.22),
            0 32px 80px rgba(0,0,0,0.7);
        }
        .al-card.phase-opening,
        .al-card.phase-blazing { opacity: 0; pointer-events: none; }

        /* Gold cross seam — appears as the card begins to crack */
        .al-crack {
          position: absolute; inset: 0; z-index: 10;
          pointer-events: none; opacity: 0;
          background:
            linear-gradient(180deg,
              transparent            calc(50% - 1.5px),
              rgba(255,240,160,0.95) calc(50% - 1.5px),
              rgba(255,255,220,1.00) 50%,
              rgba(255,240,160,0.95) calc(50% + 1.5px),
              transparent            calc(50% + 1.5px)
            ),
            linear-gradient(90deg,
              transparent            calc(50% - 1.5px),
              rgba(255,240,160,0.95) calc(50% - 1.5px),
              rgba(255,255,220,1.00) 50%,
              rgba(255,240,160,0.95) calc(50% + 1.5px),
              transparent            calc(50% + 1.5px)
            );
        }
        .al-crack.phase-cracking { animation: crackAppear 0.45s ease forwards; }

        @keyframes crackAppear {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        /* ── The 4 crucifix panels ── */
        .al-panel {
          position: absolute;
          width: 50%; height: 50%;
          background: rgba(18,32,60,0.97);
          z-index: 20; pointer-events: none; opacity: 0;
        }
        .al-panel.phase-opening { opacity: 1; }
        .al-panel.phase-blazing { opacity: 0; transition: opacity 0.3s ease; }
        .al-panel.phase-reforming { opacity: 1; animation: none; }

        .al-panel-tl {
          top: 0; left: 0; border-radius: 20px 0 0 0;
          border-top: 1px solid rgba(168,204,232,0.16);
          border-left: 1px solid rgba(168,204,232,0.16);
          transform-origin: right bottom;
        }
        .al-panel-tr {
          top: 0; right: 0; border-radius: 0 20px 0 0;
          border-top: 1px solid rgba(168,204,232,0.16);
          border-right: 1px solid rgba(168,204,232,0.16);
          transform-origin: left bottom;
        }
        .al-panel-bl {
          bottom: 0; left: 0; border-radius: 0 0 0 20px;
          border-bottom: 1px solid rgba(168,204,232,0.16);
          border-left: 1px solid rgba(168,204,232,0.16);
          transform-origin: right top;
        }
        .al-panel-br {
          bottom: 0; right: 0; border-radius: 0 0 20px 0;
          border-bottom: 1px solid rgba(168,204,232,0.16);
          border-right: 1px solid rgba(168,204,232,0.16);
          transform-origin: left top;
        }

        .al-panel-tl.phase-opening { animation: flyTL 1s cubic-bezier(0.22,1,0.36,1) forwards; }
        .al-panel-tr.phase-opening { animation: flyTR 1s cubic-bezier(0.22,1,0.36,1) forwards; }
        .al-panel-bl.phase-opening { animation: flyBL 1s cubic-bezier(0.22,1,0.36,1) forwards; }
        .al-panel-br.phase-opening { animation: flyBR 1s cubic-bezier(0.22,1,0.36,1) forwards; }

        /* Reform animations for logout */
        .al-panel-tl.phase-reforming { animation: reformTL 2.8s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay: 0.4s; }
        .al-panel-tr.phase-reforming { animation: reformTR 2.8s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay: 0.4s; }
        .al-panel-bl.phase-reforming { animation: reformBL 2.8s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay: 0.4s; }
        .al-panel-br.phase-reforming { animation: reformBR 2.8s cubic-bezier(0.22,1,0.36,1) forwards; animation-delay: 0.4s; }

        @keyframes flyTL {
          0%   { transform: translate(0,0)         rotate(0deg);  opacity: 1; }
          15%  { opacity: 1; }
          100% { transform: translate(-240%,-220%) rotate(-18deg); opacity: 0; }
        }
        @keyframes flyTR {
          0%   { transform: translate(0,0)        rotate(0deg);  opacity: 1; }
          15%  { opacity: 1; }
          100% { transform: translate(240%,-220%) rotate(18deg);  opacity: 0; }
        }
        @keyframes flyBL {
          0%   { transform: translate(0,0)        rotate(0deg);  opacity: 1; }
          15%  { opacity: 1; }
          100% { transform: translate(-240%,220%) rotate(18deg);  opacity: 0; }
        }
        @keyframes flyBR {
          0%   { transform: translate(0,0)       rotate(0deg);  opacity: 1; }
          15%  { opacity: 1; }
          100% { transform: translate(240%,220%) rotate(-18deg); opacity: 0; }
        }

        /* Radial light that blazes through the cross gap as panels fly open */
        .al-cross-light {
          position: absolute; inset: 0; z-index: 15;
          pointer-events: none; opacity: 0;
          background: radial-gradient(ellipse 55% 55% at 50% 50%,
            rgba(255,255,255,0.98) 0%,
            rgba(210,235,255,0.88) 14%,
            rgba(145,205,255,0.60) 28%,
            rgba(80,160,230,0.28)  48%,
            transparent            68%
          );
        }
        .al-cross-light.phase-opening { animation: crossBlaze 1s ease forwards; }

        @keyframes crossBlaze {
          0%   { opacity: 0; transform: scale(0.2); }
          25%  { opacity: 1; }
          100% { opacity: 1; transform: scale(2.2); }
        }

        /* ── Card interior ── */
        .al-card-accent {
          height: 2px;
          background: linear-gradient(90deg, #1B3A6B 0%, #2a6099 40%, #C9A84C 75%, transparent 100%);
        }
        .al-header { padding: 36px 36px 28px; text-align: center; border-bottom: 1px solid rgba(168,204,232,0.08); }
        .al-emblem {
          width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 14px;
          object-fit: cover;
          border: 2px solid rgba(201,168,76,0.3);
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          background: rgba(201,168,76,0.05);
        }
        .al-title {
          font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600;
          color: #e8edf4; letter-spacing: 0.04em; margin-bottom: 5px; line-height: 1.4;
        }
        .al-sub { font-size: 11px; color: rgba(168,204,232,0.45); letter-spacing: 0.14em; text-transform: uppercase; }
        .al-body { padding: 28px 36px 32px; }
        .al-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .al-divider-line { flex: 1; height: 1px; background: rgba(168,204,232,0.1); }
        .al-divider-cross { color: rgba(201,168,76,0.5); font-size: 13px; font-family: 'Cinzel', serif; font-weight: 500; }
        .al-error {
          background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); color: #fca5a5;
          padding: 11px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .al-field { margin-bottom: 18px; }
        .al-label {
          display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #000000; margin-bottom: 8px;
        }
        .al-input {
          width: 100%; background: rgba(168,204,232,0.05); border: 1px solid rgba(168,204,232,0.12);
          border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #e8edf4; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; font-family: 'Inter', sans-serif;
        }
        .al-input::placeholder { color: rgba(168,204,232,0.2); }
        .al-input:focus {
          border-color: rgba(42,96,153,0.6); background: rgba(168,204,232,0.08);
          box-shadow: 0 0 0 3px rgba(42,96,153,0.15);
        }
        .al-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #1B3A6B 0%, #2a6099 60%, #1e4d7a 100%);
          color: #e8edf4; font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 600;
          letter-spacing: 0.12em; border: 1px solid rgba(168,204,232,0.15); border-radius: 10px;
          cursor: pointer; transition: all 0.2s; margin-top: 8px;
          box-shadow: 0 4px 20px rgba(27,58,107,0.35), inset 0 1px 0 rgba(168,204,232,0.1);
          position: relative; overflow: hidden;
        }
        .al-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
          pointer-events: none;
        }
        .al-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #234d8a 0%, #336aaa 60%, #2a609e 100%);
          box-shadow: 0 6px 28px rgba(27,58,107,0.45); transform: translateY(-1px);
        }
        .al-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .al-back {
          display: block; text-align: center; margin-top: 22px; font-size: 12px;
          color: rgba(168,204,232,0.3); text-decoration: none;
          letter-spacing: 0.04em; transition: color 0.2s; font-family: 'Inter', sans-serif;
        }
        .al-back:hover { color: rgba(168,204,232,0.7); }
        .al-footer { padding: 14px 36px 20px; text-align: center; border-top: 1px solid rgba(168,204,232,0.06); }
        .al-footer-text { font-size: 10.5px; color: #000000; font-weight: 600; letter-spacing: 0.06em; font-family: 'Cinzel', serif; }
      `}</style>

      <div className={`al-root phase-${phase}`} onMouseMove={handleMouseMove}>
        {/* Mouse-following torch beam */}
        <div
          className={`al-torch phase-${phase}`}
          style={{
            background:
              phase === 'idle'
                ? `
              radial-gradient(ellipse 32% 44% at ${mousePos.x}% ${mousePos.y}%,
                rgba(210,235,255,0.95) 0%, rgba(165,215,255,0.75) 7%,
                rgba(105,178,242,0.48) 18%, rgba(62,132,212,0.24) 32%,
                rgba(32,82,162,0.10) 48%, transparent 64%
              ),
              radial-gradient(ellipse 65% 75% at ${mousePos.x}% ${mousePos.y}%,
                rgba(80,148,220,0.09) 0%, transparent 60%
              )`
                : 'none',
          }}
        />

        <div className={`al-grid phase-${phase}`} />
        <div className={`al-smolder phase-${phase}`} />
        <div className={`al-blaze phase-${phase}`} />
        <div className={`al-closer phase-${phase}`} />

        <div className="al-card-wrapper">
          <div className={`al-card phase-${phase}`}>
            <div className={`al-crack phase-${phase}`} />
            <div className="al-card-accent" />

            <div className="al-header">
              <img
                src={process.env.PUBLIC_URL + '/images/logo.jpg'}
                alt="Holy Name Church"
                className="al-emblem"
              />
              <div className="al-title">Holy Name Catholic Church</div>
              <div className="al-sub">Administration Portal</div>
            </div>

            <div className="al-body">
              <div className="al-divider">
                <div className="al-divider-line" />
                <span className="al-divider-cross">✝</span>
                <div className="al-divider-line" />
              </div>

              {error && (
                <div className="al-error">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="al-field">
                  <label className="al-label">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="al-input"
                    placeholder="Enter your username"
                    required
                    disabled={animating}
                  />
                </div>
                <div className="al-field">
                  <label className="al-label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="al-input"
                    placeholder="Enter your password"
                    required
                    disabled={animating}
                  />
                </div>
                <button type="submit" disabled={loading || animating} className="al-btn">
                  {loading ? 'Verifying...' : animating ? '✝' : 'Sign In'}
                </button>
              </form>

              {!animating && (
                <a href="http://localhost:3000/HolyName" className="al-back">
                  ← Back to Website
                </a>
              )}
            </div>

            <div className="al-footer">
              <div className="al-footer-text">Secure Admin Access · Holy Name Parish</div>
            </div>
          </div>

          {/* 4 crucifix panels + cross light — only mounted during animation */}
          {animating && (
            <>
              <div className={`al-cross-light phase-${phase}`} />
              <div className={`al-panel al-panel-tl phase-${phase}`} />
              <div className={`al-panel al-panel-tr phase-${phase}`} />
              <div className={`al-panel al-panel-bl phase-${phase}`} />
              <div className={`al-panel al-panel-br phase-${phase}`} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
