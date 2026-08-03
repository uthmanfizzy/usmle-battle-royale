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
          <span className="ms-card-sub">Solo campaigns — Tower, AnKing &amp; more</span>
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
// card), Tower/AnKing keep their existing coming-soon treatment below.
export function StoryMenu({ onBack, onJourney, onTower, onAnKing, onUWorld }) {
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

        {/* Re-enabled: the mode is real now (27,319 imported cards + spaced
            repetition), so the COMING SOON gate no longer applies. Re-enabled
            exactly as the previous comment prescribed — disabled class and
            ms-soon-chip dropped, onClick={onAnKing} restored. Routing unchanged.
            Sits second, above the still-gated Tower. */}
        <button className="ms-journey-card" onClick={onAnKing}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🃏</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">ANKING</span>
            <span className="ms-journey-sub">Master AnKing flashcards</span>
          </div>
        </button>

        {/* Real and fully functional (pacing over the 708-question main bank),
            so it gets normal active styling — no disabled class, no
            ms-soon-chip. Unlike its siblings this is a standalone ROUTE, not a
            phase, so onUWorld navigates rather than setting phase; the card
            stays presentational either way. Sits above the still-gated Tower,
            keeping every playable mode before the coming-soon one. */}
        <button className="ms-journey-card" onClick={onUWorld}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">📊</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">UWORLD ADVENTURE</span>
            <span className="ms-journey-sub">Pace your board-review questions</span>
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
