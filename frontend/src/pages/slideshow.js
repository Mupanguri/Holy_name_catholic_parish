import React, { useState, useEffect, useRef, useCallback } from 'react';

const IMAGES = [
  process.env.PUBLIC_URL + '/images/111.jpg',
  process.env.PUBLIC_URL + '/images/16.jpg',
  process.env.PUBLIC_URL + '/images/15.jpg',
];


const SLIDE_DURATION = 4000; // ms each slide is fully visible
const FADE_DURATION = 800; // ms crossfade

const Slideshow = () => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(nextIdx => {
    if (fading) return;
    setPrev(current);
    setFading(true);
    setCurrent(nextIdx);
    setTimeout(() => {
      setPrev(null);
      setFading(false);
    }, FADE_DURATION);
  }, [fading, current]);

  // Restart timer whenever current changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % IMAGES.length);
    }, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [current, fading, goTo]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap');

        .slide-wrap {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
          background: #0f1923;
        }
        @media (min-width: 1024px) { .slide-wrap { height: 700px; } }

        .slide-layer {
          position: absolute;
          inset: 0;
        }
        .slide-layer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
        }
        .slide-layer-prev    { z-index: 1; }
        .slide-layer-current { z-index: 2; animation: sFadeIn ${FADE_DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards; }

        @keyframes sFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .slide-ov-top {
          position: absolute; top: 0; left: 0; right: 0; height: 38%;
          background: linear-gradient(to bottom, rgba(10,18,28,0.6) 0%, transparent 100%);
          pointer-events: none; z-index: 4;
        }
        .slide-ov-bot {
          position: absolute; bottom: 0; left: 0; right: 0; height: 60%;
          background: linear-gradient(to top, rgba(8,15,24,0.88) 0%, rgba(8,15,24,0.4) 60%, transparent 100%);
          pointer-events: none; z-index: 4;
        }

        .slide-rule {
          position: absolute; bottom: 102px; left: 50%;
          transform: translateX(-50%); z-index: 5;
          width: min(540px, 78%); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,200,66,0.65) 35%, rgba(245,200,66,0.65) 65%, transparent);
          pointer-events: none;
        }

        .slide-motto {
          position: absolute; bottom: 48px; left: 0; right: 0;
          z-index: 5; display: flex; align-items: center;
          justify-content: center; pointer-events: none;
        }
        .slide-word {
          font-family: 'Cinzel', serif;
          font-size: clamp(20px, 3.2vw, 44px);
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 0 clamp(14px, 2.2vw, 34px);
          white-space: nowrap;
        }
        .slide-word-gold  { color: #F5C842; text-shadow: 0 0 16px rgba(245,200,66,0.6), 0 2px 4px rgba(0,0,0,0.9); }
        .slide-word-blue  { color: #4A9EE8; text-shadow: 0 0 16px rgba(74,158,232,0.55), 0 2px 4px rgba(0,0,0,0.9); }
        .slide-word-white { color: #FFFFFF; text-shadow: 0 0 12px rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.9); }
        .slide-sep { color: rgba(245,200,66,0.65); font-size: clamp(10px, 1.2vw, 16px); flex-shrink: 0; }

        .slide-dots {
          position: absolute; bottom: 18px; left: 50%;
          transform: translateX(-50%); z-index: 5; display: flex; gap: 8px;
        }
        .slide-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(255,255,255,0.3); border: none;
          padding: 0; cursor: pointer;
          transition: background 0.3s, transform 0.3s;
        }
        .slide-dot.active { background: #F5C842; transform: scale(1.4); box-shadow: 0 0 8px rgba(245,200,66,0.6); }
      `}</style>

      <div className="slide-wrap">
        {prev !== null && (
          <div className="slide-layer slide-layer-prev" key={`p-${prev}`}>
            <img src={IMAGES[prev]} alt="" aria-hidden />
          </div>
        )}
        <div className="slide-layer slide-layer-current" key={`c-${current}`}>
          <img src={IMAGES[current]} alt={`Slide ${current + 1}`} />
        </div>

        <div className="slide-ov-top" />
        <div className="slide-ov-bot" />
        <div className="slide-rule" />

        <div className="slide-motto">
          <span className="slide-word slide-word-gold">Grateful</span>
          <span className="slide-sep">✦</span>
          <span className="slide-word slide-word-blue">Joyful</span>
          <span className="slide-sep">✦</span>
          <span className="slide-word slide-word-white">Hopeful</span>
        </div>

        <div className="slide-dots">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              className={`slide-dot${i === current ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Slideshow;
