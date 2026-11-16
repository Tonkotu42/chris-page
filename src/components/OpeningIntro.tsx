import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { startupAudio } from '../utils/audio';
import { initialCassettes } from '../lib/musicCatalog';
import './OpeningIntro.css';

interface OpeningIntroProps {
  onComplete: () => void;
}

const BEAT_MS = 60_000 / 145;
const INTRO_STYLE: React.CSSProperties & { '--opening-beat': string } = {
  '--opening-beat': `${BEAT_MS}ms`,
};

export const OpeningIntro: React.FC<OpeningIntroProps> = ({ onComplete }) => {
  const [isMuted, setIsMuted] = useState(startupAudio.getMuted());
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const handleEnter = (x: number, y: number) => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startupAudio.playStartupSound();

    // if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    //   onComplete();
    //   return;
    // }

    overlayRef.current?.querySelectorAll<HTMLElement>('[data-intro-piece]').forEach((element, index) => {
      const bounds = element.getBoundingClientRect();
      const dx = window.innerWidth / 2 - (bounds.left + bounds.width / 2);
      const dy = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const outwardX = -dx / distance * 28;
      const outwardY = -dy / distance * 28;
      const angle = index % 2 ? 18 : -18;
      element.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) skew(0deg) scale(1)', filter: 'none', offset: 0, easing: 'steps(2, end)' },
          { transform: `translate(${outwardX}px, ${outwardY}px) rotate(${angle}deg) skew(0deg) scale(1.15)`, filter: 'drop-shadow(6px 6px 0 #00ff66)', offset: 0.2, easing: 'cubic-bezier(0.75, 0, 0.9, 0)' },
          { transform: `translate(${dx}px, ${dy}px) rotate(${-angle}deg) skew(${angle}deg) scale(0)`, filter: 'none', offset: 1 },
        ],
        { duration: BEAT_MS * 2.5, fill: 'forwards' },
      );
    });
    setOrigin({ x, y });
    timerRef.current = window.setTimeout(onComplete, BEAT_MS * 5);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    startupAudio.setMuted(nextMuted);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.isPrimary && event.button === 0) handleEnter(event.clientX, event.clientY);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) handleEnter(window.innerWidth / 2, window.innerHeight / 2);
  };

  return (
    <div
      ref={overlayRef}
      id="opening-intro-overlay"
      className={`opening-intro${origin ? ' opening-intro-running' : ''}`}
      style={INTRO_STYLE}
    >
      {['top', 'bottom'].map((part) => (
        <div className={`opening-panel opening-panel-${part}`} aria-hidden="true" key={part}>
          <div className="opening-panel-decoration">
            <div className="opening-title-wall">
              {Array.from({ length: 8 }, (_, row) => (
                <div className="opening-title-row" key={row}>
                  <div className="opening-title-track">
                    {[0, 1].map((copy) => (
                      <div className="opening-title-sequence" key={copy}>
                        {initialCassettes.map((_, index) => {
                          const cassette = initialCassettes[(index + row) % initialCassettes.length];
                          return <span key={cassette.id}>{cassette.title}</span>;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="opening-intro-trigger"
        aria-label="Enter CHRIS Official Site"
        aria-disabled={origin !== null}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />
      <div data-intro-piece className="opening-sound-control">
        <button
          type="button"
          onClick={toggleMute}
          disabled={origin !== null}
          className="opening-sound-button"
          title={isMuted ? '起動音をONにする' : '起動音をミュートする'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'Muted' : 'Sound ON'}</span>
        </button>
      </div>

      <div className="opening-content">
        <div className="opening-stage">
          <div data-intro-piece className="opening-kicker-piece">
            <div className="opening-kicker">OFFICIAL ARTIST SITE / 01</div>
          </div>
          <h1 className="opening-logo" aria-label="CHRIS">
            {'CHRIS'.split('').map((letter, index) => (
              <span data-intro-piece className={`opening-logo-piece opening-logo-piece-${index}`} aria-hidden="true" key={letter}>
                <span className="opening-logo-tile"><span>{letter}</span></span>
              </span>
            ))}
          </h1>
          <div data-intro-piece className="opening-start-piece">
            <button
              type="button"
              id="enter-site-button"
              className="opening-start"
              disabled={origin !== null}
              onPointerDown={handlePointerDown}
              onClick={handleClick}
            >
              <span>CLICK TO START</span><span className="opening-start-arrow" aria-hidden="true">-&gt;</span>
            </button>
          </div>
        </div>
      </div>

      {origin && (
        <div className="opening-effects" aria-hidden="true">
          <div className="opening-impact" />
          <div className="opening-strike-origin" style={{ left: origin.x, top: origin.y }}>
            <span className="opening-pixel-ring opening-pixel-ring-green" />
            <span className="opening-pixel-ring opening-pixel-ring-white" />
            {Array.from({ length: 12 }, (_, index) => (
              <span className={`opening-pixel-particle opening-pixel-particle-${index}`} key={index} />
            ))}
            <span className="opening-origin-slash opening-origin-slash-one" />
            <span className="opening-origin-slash opening-origin-slash-two" />
            <span className="opening-origin-slash opening-origin-slash-three" />
          </div>
          <span className="opening-core" />
          {['main', 'top', 'bottom'].map((part) => (
            <div className={`opening-welcome opening-welcome-${part}`} key={part}>
              {'WELCOME'.split('').map((letter, index) => (
                <span className={`opening-letter opening-letter-${index}`} key={index}>
                  <span>{letter}</span>
                </span>
              ))}
            </div>
          ))}
          <span className="opening-final-slash" />
          <div className="opening-mosaic">
            {Array.from({ length: 24 }, (_, index) => (
              <span
                key={index}
                style={{
                  left: `${(index % 6) * 17}%`,
                  top: `${Math.floor(index / 6) * 25}%`,
                  '--block-x': `${(index % 6 - 2.5) * 35}px`,
                  '--block-y': `${(Math.floor(index / 6) - 1.5) * 45}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
