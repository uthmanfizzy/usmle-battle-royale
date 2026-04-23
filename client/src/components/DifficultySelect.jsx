export default function DifficultySelect({ username, onSelectDifficulty, onBack }) {
  return (
    <div className="screen difficulty-screen">
      <div className="difficulty-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Select Difficulty</h2>
        <p className="difficulty-sub">
          Choose your mode, <strong>{username}</strong>.
        </p>

        <div className="difficulty-options">
          <button className="diff-option easy-diff" onClick={() => onSelectDifficulty('easy')}>
            <div className="diff-icon-wrap easy-icon-wrap">
              <span className="diff-icon">🎓</span>
            </div>
            <h3>Easy Mode</h3>
            <p>Recommended for students beginning their USMLE preparation. Questions test core concepts with clear clinical presentations.</p>
            <div className="diff-tag easy-tag">Available Now</div>
          </button>

          <div className="diff-option hard-diff diff-coming-soon">
            <div className="coming-soon-badge">Coming Soon</div>
            <div className="diff-icon-wrap hard-icon-wrap">
              <span className="diff-icon">🔥</span>
            </div>
            <h3>Hard Mode</h3>
            <p>Hard mode questions are currently being developed. Check back soon!</p>
            <div className="diff-tag hard-tag">In Development</div>
          </div>
        </div>
      </div>
    </div>
  );
}
