import { useState } from 'react';
import './ModeSplit.css';

// Animated Story/Online reveal shown after clicking Play.
// CSS-only animations — they fire on mount since each phase is a fresh mount.
export default function ModeSplit({ onStory, onOnline, onTraining, onBack }) {
  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <div className="ms-banner">
        <h1 className="ms-title">CHOOSE YOUR PATH</h1>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-cards">
        <button className="ms-card ms-card--story" onClick={onStory}>
          <span className="ms-card-icon">📖</span>
          <span className="ms-card-name">STORY MODE</span>
          <span className="ms-card-sub">Solo campaigns — Journey, Flashcards &amp; more</span>
        </button>
        <button className="ms-card ms-card--online" onClick={onOnline}>
          <span className="ms-card-icon">⚔️</span>
          <span className="ms-card-name">ONLINE</span>
          <span className="ms-card-sub">Battle other doctors live</span>
        </button>
      </div>

      {/* Own row below: wide short rectangle, centred midpoint-to-midpoint of the two cards */}
      <button className="ms-train" onClick={onTraining}>
        <span className="ms-train-icon">🎯</span>
        <span className="ms-train-text">
          <span className="ms-train-name">TRAINING GROUNDS</span>
          <span className="ms-train-sub">Study by topic · Watch videos</span>
        </span>
      </button>
    </div>
  );
}

// Story menu: First Aid Journey emphasized per the mockup (wide campaign
// card), Tower keeps its existing coming-soon treatment below.
export function StoryMenu({ onBack, onJourney, onTower, onAnKing, onUWorld }) {
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

      {/* All four campaigns share the wide ms-journey-card layout (art panel
          left, name/description right) so they read as siblings in one list.
          Art areas are INERT striped placeholders (no per-campaign art asset
          exists); the mockup's progress row + "Chapter X of Y" is intentionally
          OMITTED — no aggregate journey progress endpoint exists yet (ships
          with the Journey restructure). */}
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
          className={`ms-journey-card${flashOpen ? ' ms-journey-card--open' : ''}`}
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

            {/* COMING SOON — no HY deck exists yet. anking_cards is the only
                flashcard table and it has no HY source, so there is nothing to
                route to. To enable: give it its own source/deck filter, then
                drop the disabled class + chip and wire onClick. */}
            <button className="ms-flash-deck ms-flash-deck--disabled" disabled>
              <span className="ms-flash-deck-icon" aria-hidden="true">⭐</span>
              <span className="ms-flash-deck-body">
                <span className="ms-flash-deck-name">HY FLASHCARDS</span>
                <span className="ms-flash-deck-sub">High-yield rapid review</span>
              </span>
              <span className="ms-soon-chip">COMING SOON</span>
            </button>
          </div>
        )}

        {/* Real and fully functional (pacing over the 708-question main bank),
            so it gets normal active styling — no disabled class, no
            ms-soon-chip. Unlike its siblings this is a standalone ROUTE, not a
            phase, so onUWorld navigates rather than setting phase; the card
            stays presentational either way. Sits above the still-gated Tower,
            keeping every playable mode before the coming-soon one. */}
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

        {/* COMING SOON — temporarily disabled. To re-enable: drop the
            ms-journey-card--disabled class + ms-soon-chip span and restore
            onClick={onTower}. TowerMode and its App.jsx routing are untouched. */}
        <button className="ms-journey-card ms-journey-card--disabled" disabled>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🏰</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">THE TOWER <span className="ms-soon-chip">COMING SOON</span></span>
            <span className="ms-journey-sub">Climb 100 floors of knowledge</span>
          </div>
        </button>
      </div>
    </div>
  );
}
