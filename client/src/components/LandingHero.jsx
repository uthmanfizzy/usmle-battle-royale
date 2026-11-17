import { useCallback, useEffect, useRef, useState } from 'react';
import { startHeroFx, createHeroAudio } from './landingHeroFx';
import './LandingHero.css';

/**
 * The landing page's hero, built from the "Medvale hero" design mockup:
 * the cloaked medic and their burning staff on the right, embers, fog and a
 * flame drawn live on a canvas, an ambient drone, and UI sounds on hover and
 * click.
 *
 * Browsers block audio until the visitor interacts, so the first pointerdown
 * anywhere on the hero starts the sound (the pill bottom-right says so until
 * then). Muting is remembered in localStorage.
 */

const MUTE_KEY = 'mv_landing_muted';

function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

function Play({ className, style }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 14" className={className} style={style}>
      <path d="M0 0l12 7-12 7z" />
    </svg>
  );
}

export default function LandingHero({ onEnter, onTrailer, onNav }) {
  const [muted, setMuted] = useState(readMuted);
  const [started, setStarted] = useState(false);
  const canvasRef = useRef(null);
  const artRef = useRef(null);
  const burst = useRef(false);
  const mutedRef = useRef(muted);
  const audio = useRef(null);

  useEffect(() => {
    mutedRef.current = muted;
    audio.current?.applyVolume();
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* storage blocked */ }
  }, [muted]);

  useEffect(() => {
    const a = createHeroAudio({ isMuted: () => mutedRef.current });
    audio.current = a;
    return () => { a.close(); audio.current = null; };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return startHeroFx(canvasRef.current, () => artRef.current, {
      consumeBurst: () => { const b = burst.current; burst.current = false; return b; },
    });
  }, []);

  const unlock = useCallback(() => {
    if (audio.current?.unlock()) setStarted(true);
  }, []);
  const sfx = (name) => audio.current?.sfx(name);

  const enter = () => {
    burst.current = true;
    sfx('enter');
    // Let the burst and the boom land before the page changes.
    setTimeout(onEnter, 380);
  };
  const nav = (e, target) => {
    e.preventDefault();
    sfx('click');
    onNav(target);
  };
  const trailer = () => { sfx('trailer'); onTrailer(); };
  const toggleSound = (e) => {
    e.stopPropagation();
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    setStarted(true);
    audio.current?.unlock();
    if (!next) sfx('unmute');
  };

  return (
    <section className="lh" onPointerDown={unlock}>
      <div className="lh-aura" aria-hidden="true" />
      <div className="lh-fog lh-fog-a" aria-hidden="true" />
      <div className="lh-fog lh-fog-b" aria-hidden="true" />
      <div className="lh-art" ref={artRef}>
        <img
          src="/assets/medvale-hero-medic.webp"
          alt="A Medvale medic seen from behind in a tattered black cloak, holding a thorned staff crowned with a burning green crystal"
        />
        <div className="lh-glow" aria-hidden="true" />
      </div>
      <div className="lh-fog lh-fog-c" aria-hidden="true" />
      <div className="lh-scrim" aria-hidden="true" />
      <canvas ref={canvasRef} className="lh-canvas" aria-hidden="true" />

      <header className="lh-header">
        <a className="lh-link lh-logo" href="#top" onClick={(e) => nav(e, 'top')} onMouseEnter={() => sfx('hover')}>
          <img src="/assets/medvale-logo.webp" alt="Medvale" />
        </a>
        <nav className="lh-nav" aria-label="Primary">
          <a className="lh-link lh-nav-link" href="#lore" onClick={(e) => nav(e, 'lore')} onMouseEnter={() => sfx('hover')}>Story</a>
          <a className="lh-link lh-nav-link" href="#features" onClick={(e) => nav(e, 'features')} onMouseEnter={() => sfx('hover')}>Battle Royale</a>
          {/* No community/Discord destination exists in the app yet */}
          <a className="lh-link lh-nav-link" href="#community" onClick={(e) => { e.preventDefault(); sfx('click'); }} onMouseEnter={() => sfx('hover')}>Community</a>
        </nav>
        <button type="button" className="lh-btn lh-cut lh-enter-now" onClick={enter} onMouseEnter={() => sfx('hoverCta')}>
          <Play className="lh-ico" />
          <span>Enter Now</span>
        </button>
      </header>

      <main className="lh-main">
        <p className="lh-eyebrow">
          <span className="lh-eyebrow-rule" aria-hidden="true" />
          <span>DARK FANTASY MEDIC RPG · EARLY ACCESS</span>
        </p>
        <h1 className="lh-headline">
          <span>MEND THE WOUNDED.</span>
          <span className="lh-headline-red">SURVIVE THE WAR.</span>
        </h1>
        <p className="lh-sub">
          A medic's saga across Battle Royale, PvP Arenas, and a story-driven
          campaign in the war-torn realm of Medvale.
        </p>
        <div className="lh-ctas">
          <button type="button" className="lh-btn lh-cut lh-cta" onClick={enter} onMouseEnter={() => sfx('hoverCta')}>
            <Play className="lh-ico" />
            <span>Enter Medvale</span>
          </button>
          <button type="button" className="lh-ghost" onClick={trailer} onMouseEnter={() => sfx('hover')}>
            <span className="lh-ring" aria-hidden="true"><Play className="lh-ring-ico" /></span>
            <span>Watch the Trailer</span>
          </button>
        </div>
      </main>

      <button
        type="button"
        className="lh-snd"
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        aria-pressed={!muted}
        onClick={toggleSound}
      >
        {muted ? (
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M16 9l5 6" /><path d="M21 9l-5 6" /></svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
        )}
        {!muted && !started && <span>Click anywhere for sound</span>}
      </button>
    </section>
  );
}
