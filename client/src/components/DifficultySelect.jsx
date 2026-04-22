export default function DifficultySelect({ username, onSelectDifficulty, onBack }) {
  return (
    <div className="screen difficulty-screen">
      <div className="difficulty-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Select Difficulty</h2>
        <p className="difficulty-sub">
          How tough do you want it, <strong>{username}</strong>?
        </p>

        <div className="difficulty-options">
          <button className="diff-option easy-diff" onClick={() => onSelectDifficulty('easy')}>
            <div className="diff-icon-wrap easy-icon-wrap">
              <span className="diff-icon">🎓</span>
            </div>
            <h3>Easy Mode</h3>
            <p>Recommended for students beginning their USMLE preparation. Questions test core concepts with straightforward clinical presentations.</p>
            <div className="diff-tag easy-tag">Beginner Friendly</div>
          </button>

          <button className="diff-option hard-diff" onClick={() => onSelectDifficulty('hard')}>
            <div className="diff-icon-wrap hard-icon-wrap">
              <span className="diff-icon">🔥</span>
            </div>
            <h3>Hard Mode</h3>
            <p>For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.</p>
            <div className="diff-tag hard-tag">Advanced Challenge</div>
          </button>
        </div>
      </div>
    </div>
  );
}
