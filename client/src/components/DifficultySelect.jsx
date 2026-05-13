import { useGameSettings } from '../contexts/GameSettingsContext';

export default function DifficultySelect({ username, onSelectDifficulty, onBack }) {
  const { settings, loading } = useGameSettings();

  const hardModeEnabled = settings.hardModeEnabled || false;
  const hardModeLabel = settings.hardModeLabel || 'Hard Mode';
  const hardModeDescription = settings.hardModeDescription || 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.';

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
            <p>Standard presentation with full timer and explanations. All questions included.</p>
            <div className="diff-tag easy-tag">Available Now</div>
          </button>

          {hardModeEnabled ? (
            <button className="diff-option hard-diff" onClick={() => onSelectDifficulty('hard')}>
              <div className="diff-icon-wrap hard-icon-wrap">
                <span className="diff-icon">💀</span>
              </div>
              <h3>{hardModeLabel}</h3>
              <p>{hardModeDescription}</p>
              <div className="diff-tag hard-tag">Available Now</div>
            </button>
          ) : (
            <div className="diff-option hard-diff diff-coming-soon">
              <div className="coming-soon-badge">Coming Soon</div>
              <div className="diff-icon-wrap hard-icon-wrap">
                <span className="diff-icon">💀</span>
              </div>
              <h3>{hardModeLabel}</h3>
              <p>This mode is currently disabled by the administrator.</p>
              <div className="diff-tag hard-tag">Unavailable</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
