import './LevelUpOverlay.css';

/**
 * Full-screen level-up celebration.
 *
 * `level` is the newly-reached level, `username` the player's name. `rewards`
 * is optional and only rendered when the caller genuinely has the numbers —
 * there is no level-reward endpoint today, so it is normally omitted rather
 * than filled with invented values.
 *
 * There is no title/epithet system on the user record, so the subtitle uses the
 * plain "has reached Level N" phrasing.
 */
export default function LevelUpOverlay({ level, username, rewards, onClose }) {
  return (
    <div className="lvlup-overlay" role="dialog" aria-modal="true" aria-label={`Level ${level} reached`}>
      <svg className="lvlup-rune" viewBox="0 0 400 400" fill="none" aria-hidden="true">
        <circle cx="200" cy="200" r="190" stroke="#e8b04b" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" stroke="#e8b04b" strokeWidth="0.5" strokeDasharray="6 10" />
        <circle cx="200" cy="200" r="104" stroke="#e8b04b" strokeWidth="1" />
        <path d="M200 40 L338 280 L62 280 Z" stroke="#e8b04b" strokeWidth="1" />
        <path d="M200 360 L62 120 L338 120 Z" stroke="#e8b04b" strokeWidth="1" />
      </svg>

      <div className="lvlup-card">
        <div className="lvlup-badge">
          <span className="lvlup-badge-num">{level}</span>
        </div>

        <div className="lvlup-label">LEVEL UP</div>
        <div className="lvlup-headline">{username || 'Player'} grows stronger</div>
        <div className="lvlup-sub">Has reached Level {level}.</div>

        {(rewards?.xp > 0 || rewards?.gems > 0) && (
          <div className="lvlup-rewards">
            {rewards.xp > 0 && (
              <span className="lvlup-chip">
                <span className="lvlup-chip-dot" />+{rewards.xp} XP
              </span>
            )}
            {rewards.gems > 0 && (
              <span className="lvlup-chip lvlup-chip--gem">
                <span className="lvlup-chip-dot" />+{rewards.gems} Gems
              </span>
            )}
          </div>
        )}

        <button type="button" className="lvlup-continue" onClick={onClose}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
