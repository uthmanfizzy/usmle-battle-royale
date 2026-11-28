import './ActivityPrivacyNote.css';

/**
 * Daily Activity privacy (users.activity_visibility, set in Settings → Privacy).
 * The server decides what a viewer may see; these only say so.
 *
 *   HiddenActivity     shown to someone who may not see a player's activity
 *   OwnVisibilityNote  reminds the owner who can see theirs, with a link to change it
 */
const COPY = {
  private: { icon: '🔒', text: 'keeps this private' },
  friends: { icon: '👥', text: 'shares this with friends only' },
};

export function HiddenActivity({ visibility, what = 'daily activity' }) {
  const c = COPY[visibility] || COPY.private;
  return (
    <div className="apn-hidden" role="note">
      <span className="apn-icon" aria-hidden="true">{c.icon}</span>
      <p className="apn-title">This player {c.text}.</p>
      <p className="apn-sub">
        {visibility === 'friends'
          ? `Their ${what} is visible once you are friends.`
          : `Their ${what} is not shared.`}
      </p>
    </div>
  );
}

const OWN = {
  everyone: '🌍 Everyone can see your daily activity.',
  friends: '👥 Only your friends can see your daily activity.',
  private: '🔒 Only you can see your daily activity.',
};

export function OwnVisibilityNote({ visibility }) {
  return (
    <p className="apn-own">
      {OWN[visibility] || OWN.private}{' '}
      <a href="/settings">Change</a>
    </p>
  );
}
