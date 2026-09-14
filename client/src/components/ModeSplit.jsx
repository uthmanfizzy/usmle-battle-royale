import { useState, useEffect } from 'react';
import { cachedImageMap, rememberImageMap } from '../utils/cachedImages';
import './ModeSplit.css';
import './ChooseYourPath.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// "Choose Your Path" — shown after clicking Play. Three wide art cards (Story,
// Online, Training Grounds), each with a medallion, coloured title, call-to-
// action and a light that travels round its border. Card art is uploaded in
// admin → Pages → Home Page (path_*_art); each card has a painted fallback.
// Online stays locked while it is under development.
function useModeArt() {
  const [art, setArt] = useState(() => cachedImageMap('home'));
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/home-images`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.images) return;
        rememberImageMap('home', d.images);
        setArt(d.images);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return art;
}

function PathCard({ variant, icon, title, sub, art, onClick, locked, cta }) {
  const Tag = locked ? 'div' : 'button';
  return (
    <Tag
      {...(locked
        ? { 'aria-disabled': 'true', title: `${title} is under development` }
        : { type: 'button', onClick })}
      className={`cyp-card cyp-card--${variant}${locked ? ' is-locked' : ''}${art ? ' has-art' : ''}`}
    >
      {art && <img className="cyp-art" src={art} alt="" />}
      <span className="cyp-body">
        <span className="cyp-medal" aria-hidden="true"><span>{icon}</span></span>
        <span className="cyp-name">{title}</span>
        <span className="cyp-sub">{sub}</span>
        {locked ? (
          <span className="cyp-locked">
            <span className="cyp-lock-pill"><span aria-hidden="true">🔒</span> Locked</span>
            <span className="cyp-dev">Under development</span>
          </span>
        ) : (
          <span className="cyp-cta">{cta} <span aria-hidden="true">›</span></span>
        )}
      </span>
    </Tag>
  );
}

// eslint-disable-next-line no-unused-vars
export default function ModeSplit({ onStory, onOnline, onTraining, onBack }) {
  const art = useModeArt();
  return (
    <div className="ms-screen cyp-screen">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <header className="cyp-head">
        <h1 className="cyp-title">Choose Your Path</h1>
        <div className="cyp-ornament" aria-hidden="true"><span /><i>♛</i><span /></div>
        <p className="cyp-tagline">Different ways to learn. A higher purpose.</p>
      </header>

      <div className="cyp-list">
        <PathCard
          variant="story"
          icon="📖"
          title="Story Mode"
          sub="Solo campaigns — Journey, Flashcards & more"
          cta="Begin your journey"
          art={art.path_story_art}
          onClick={onStory}
        />
        {/* Online and Training Grounds are closed while under development.
            Re-enable by dropping `locked` and passing onClick (onOnline /
            onTraining, plus cta="Start training" for Training Grounds). */}
        <PathCard
          variant="online"
          icon="⚔️"
          title="Online"
          sub="Battle other doctors live"
          art={art.path_online_art}
          locked
        />
        <PathCard
          variant="training"
          icon="🎯"
          title="Training Grounds"
          sub="Study by topic · Watch videos"
          art={art.path_training_art}
          locked
        />
      </div>

      <footer className="cyp-foot">
        <div className="cyp-ornament" aria-hidden="true"><span /><i>♛</i><span /></div>
        <p>Knowledge builds greater tomorrows</p>
      </footer>
    </div>
  );
}

// Story menu: First Aid Journey emphasized per the mockup (wide campaign
// card). The Tower campaign was removed from this list — TowerMode.jsx and its
// App.jsx phase/route are untouched (unreachable, not deleted) in case it
// comes back.
export function StoryMenu({ onBack, onJourney, onAnKing, onUWorld, onSaudiMLE }) {
  // Whether the Flashcards deck list is expanded. Local — nothing outside this
  // menu cares which category is open.
  const [flashOpen, setFlashOpen] = useState(false);

  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <div className="ms-banner">
        <h1 className="ms-title">📖 STORY MODE</h1>
        <p className="ms-tagline">Choose your campaign.</p>
        <div className="ms-title-rule" />
      </div>

      {/* All four campaigns share the ms-journey-card layout so they read as
          siblings in one list: a row of tiles on desktop (art above, text
          below), the original wide rows stacked on a phone. Art areas carry
          each campaign's own colour rather than a real asset — no per-campaign
          art exists. The mockup's progress row + "Chapter X of Y" is
          intentionally OMITTED here; the Journey page has its own per-subject
          progress now, this list does not. */}
      <div className="ms-campaign-list">
        <button className="ms-journey-card" onClick={onJourney}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🚑</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">FIRST AID JOURNEY</span>
            <span className="ms-journey-sub">
              A field medic&apos;s first steps — march through First Aid, chapter by chapter.
            </span>
          </div>
        </button>

        {/* FLASHCARDS is a category, not a mode: it opens in place to reveal
            the decks underneath. An accordion rather than a new screen because
            there are two entries — a whole phase and a back button for that
            would be more chrome than content. */}
        <button
          className={`ms-journey-card ms-journey-card--orange${flashOpen ? ' ms-journey-card--open' : ''}`}
          onClick={() => setFlashOpen(o => !o)}
          aria-expanded={flashOpen}
        >
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🃏</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">FLASHCARDS</span>
            <span className="ms-journey-sub">Spaced-repetition decks — pick your source.</span>
          </div>
          <span className="ms-flash-caret" aria-hidden="true">{flashOpen ? '▾' : '▸'}</span>
        </button>

        {flashOpen && (
          <div className="ms-flash-decks">
            {/* Real: 27,319 imported cards with spaced repetition. */}
            <button className="ms-flash-deck" onClick={onAnKing}>
              <span className="ms-flash-deck-icon" aria-hidden="true">🃏</span>
              <span className="ms-flash-deck-body">
                <span className="ms-flash-deck-name">ANKING</span>
                <span className="ms-flash-deck-sub">Master the AnKing deck</span>
              </span>
            </button>

            {/* Real: its own hy_flashcards table + admin tab, a standalone
                route like UWorld Adventure rather than a phase. */}
            <button className="ms-flash-deck" onClick={() => { window.location.href = '/hy-flashcards'; }}>
              <span className="ms-flash-deck-icon" aria-hidden="true">⭐</span>
              <span className="ms-flash-deck-body">
                <span className="ms-flash-deck-name">HY FLASHCARDS</span>
                <span className="ms-flash-deck-sub">High-yield rapid review</span>
              </span>
            </button>
          </div>
        )}

        {/* Real and fully functional (pacing over the 708-question main bank),
            so it gets normal active styling — no disabled class, no
            ms-soon-chip. Unlike its siblings this is a standalone ROUTE, not a
            phase, so onUWorld navigates rather than setting phase; the card
            stays presentational either way. Last in the list — every entry
            here is a playable mode now. */}
        <button className="ms-journey-card ms-journey-card--blue" onClick={onUWorld}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">📊</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">UWORLD ADVENTURE</span>
            <span className="ms-journey-sub">
              A high-yield board-review expedition through the wards of Medvale.
            </span>
          </div>
        </button>

        {/* The same question-bank machine pointed at the Saudi MLE pool — its
            own route, pace and colours, sharing one component. */}
        <button className="ms-journey-card ms-journey-card--green" onClick={onSaudiMLE}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">📗</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">SAUDI MLE</span>
            <span className="ms-journey-sub">
              Work the Saudi Medical Licensing Exam bank down, at your own pace.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
