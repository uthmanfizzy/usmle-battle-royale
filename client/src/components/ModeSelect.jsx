const MODES = [
  {
    id:          'battle_royale',
    name:        'Battle Royale',
    icon:        '💀',
    tagline:     'Last doctor standing wins',
    description: 'Wrong answers cost lives. Outlast every other player to claim victory.',
    gradient:    'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    border:      '#e74c3c',
  },
  {
    id:          'speed_race',
    name:        'Speed Race',
    icon:        '🏁',
    tagline:     'First to 20 correct answers wins',
    description: 'Race to answer 20 questions correctly. No lives — wrong answers are forgiven.',
    gradient:    'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)',
    border:      '#3498db',
  },
];

export default function ModeSelect({ username, onSelect, onBack }) {
  return (
    <div className="screen mode-select-screen">
      <div className="mode-select-inner">
        <h2 className="mode-select-title">Choose Game Mode</h2>
        <p className="mode-select-sub">Playing as <strong>{username}</strong></p>

        <div className="mode-cards">
          {MODES.map(m => (
            <button
              key={m.id}
              className="mode-card"
              onClick={() => onSelect(m.id)}
              style={{ '--mode-grad': m.gradient, '--mode-border': m.border }}
            >
              <div className="mode-card-icon">{m.icon}</div>
              <h3 className="mode-card-name">{m.name}</h3>
              <div className="mode-card-tagline">{m.tagline}</div>
              <p className="mode-card-desc">{m.description}</p>
            </button>
          ))}
        </div>

        {onBack && <button className="back-btn" onClick={onBack}>← Back</button>}
      </div>
    </div>
  );
}
