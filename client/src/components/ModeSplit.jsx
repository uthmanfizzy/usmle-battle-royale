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

// Story menu: First Aid Journey / The Tower / AnKing
export function StoryMenu({ onBack, onJourney, onTower, onAnKing }) {
  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <div className="ms-banner">
        <h1 className="ms-title">📖 STORY MODE</h1>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-cards ms-cards--story">
        <button className="ms-card ms-card--story" onClick={onJourney}>
          <span className="ms-card-icon">🚑</span>
          <span className="ms-card-name">FIRST AID JOURNEY</span>
          <span className="ms-card-sub">March through First Aid, chapter by chapter</span>
        </button>

        {/* COMING SOON — temporarily disabled. To re-enable: drop the
            ms-card--disabled class + ms-ribbon span and restore onClick={onTower}.
            TowerMode and its App.jsx routing are untouched. */}
        <button className="ms-card ms-card--story ms-card--disabled" disabled>
          <span className="ms-ribbon">COMING SOON</span>
          <span className="ms-card-icon">🏰</span>
          <span className="ms-card-name">THE TOWER</span>
          <span className="ms-card-sub">Climb 100 floors of knowledge</span>
        </button>

        {/* COMING SOON — temporarily disabled. To re-enable: drop the
            ms-card--disabled class + ms-ribbon span and restore onClick={onAnKing}.
            AnKing and its App.jsx routing are untouched. */}
        <button className="ms-card ms-card--story ms-card--disabled" disabled>
          <span className="ms-ribbon">COMING SOON</span>
          <span className="ms-card-icon">🃏</span>
          <span className="ms-card-name">ANKING</span>
          <span className="ms-card-sub">Master AnKing flashcards</span>
        </button>
      </div>
    </div>
  );
}
