import { useState } from 'react';

const POWERUP_META = {
  '50_50':     { icon: '🎯', label: '50/50',   color: '#f39c12', desc: 'Eliminate 2 wrong answers' },
  extra_time:  { icon: '⏰', label: '+10s',     color: '#27ae60', desc: 'Add 10 seconds to the timer' },
  skip:        { icon: '⏭️', label: 'Skip',     color: '#2980b9', desc: 'Skip this question — no penalty' },
  freeze:      { icon: '❄️', label: 'Freeze',   color: '#74b9ff', desc: 'Freeze an opponent for 5s (BR only)' },
  double_xp:   { icon: '⭐', label: '2× XP',    color: '#f9ca24', desc: 'Double XP on your next correct answer' },
};

export default function PowerupBar({
  powerups,
  usedPowerupThisQ,
  onUse,
  gameMode,
  players,
  mySocketId,
  isFrozen,
  hasAnswered,
}) {
  const [selectingFreeze, setSelectingFreeze] = useState(false);

  if (!powerups || powerups.length === 0) return null;

  const canUse = !usedPowerupThisQ && !hasAnswered && !isFrozen;

  function handleClick(type) {
    if (!canUse) return;
    if (type === 'freeze') {
      if (gameMode !== 'battle_royale') return;
      setSelectingFreeze(true);
      return;
    }
    onUse(type, null);
  }

  function handleFreezeTarget(targetId) {
    setSelectingFreeze(false);
    onUse('freeze', targetId);
  }

  return (
    <div className="powerup-bar">
      {isFrozen && <div className="powerup-frozen-notice">❄️ You are frozen — can't answer!</div>}

      <div className="powerup-label">Your Power-Ups</div>

      <div className="powerup-btns">
        {powerups.map((type) => {
          const meta = POWERUP_META[type] || { icon: '❓', label: type, color: '#999', desc: '' };
          const disabled = !canUse || (type === 'freeze' && gameMode !== 'battle_royale');
          return (
            <button
              key={type}
              className={`powerup-btn${disabled ? ' powerup-disabled' : ''}`}
              style={{ '--pu-color': meta.color }}
              onClick={() => handleClick(type)}
              disabled={disabled}
              title={meta.desc}
            >
              <span className="pu-icon">{meta.icon}</span>
              <span className="pu-label">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {selectingFreeze && (
        <div className="freeze-picker-overlay">
          <div className="freeze-picker">
            <p className="freeze-picker-title">❄️ Freeze who?</p>
            {(players || [])
              .filter(p => p.id !== mySocketId && p.alive !== false)
              .map(p => (
                <button
                  key={p.id}
                  className="freeze-target-btn"
                  onClick={() => handleFreezeTarget(p.id)}
                >
                  {p.username}
                </button>
              ))}
            <button className="freeze-cancel-btn" onClick={() => setSelectingFreeze(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
