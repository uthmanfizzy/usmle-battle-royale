import './PvpDuelResults.css';

/**
 * The Match Results card — how a 1v1 duel ends.
 *
 * A duel finished into the shared multiplayer leaderboard until now, which is
 * a podium: it ranks a field. With exactly two players a podium says almost
 * nothing, and the numbers a duel actually generates — damage dealt, HP left,
 * who struck first — were not on it at all. This is the two-player version:
 * the verdict, then the two of you side by side.
 *
 * Read from the viewer's own perspective. "2nd place" is a fact about a table;
 * "Defeat" is what happened to you, and the server already says which of the
 * two usernames is the winner.
 *
 * Every number here comes from the server's duelResults — hp, damageDealt,
 * correctAnswers, xpEarned. Nothing is recomputed client-side, so the card
 * cannot disagree with the XP that was actually awarded.
 */

// Why the duel ended, in the words of the thing that ended it. 'forfeit' is
// the one worth naming outright: winning because someone left is a different
// feeling from winning, and a card that calls it a victory without saying so
// reads as a lie the first time it happens.
const REASON_TEXT = {
  forfeit: 'Your opponent left the duel.',
  knockout: 'Taken to zero.',
  pool_exhausted: 'Questions ran out — decided on damage dealt.',
  timeout: 'Time ran out.',
};

const STARTING_HP = 100;

export default function PvpDuelResults({ gameResult, username, onPlayAgain, onHome, isGuest, onSignIn }) {
  const results = Array.isArray(gameResult?.duelResults) ? gameResult.duelResults : [];
  const draw = !!gameResult?.draw;

  // Who is reading this. Falls back to the first row so a spectator — or a
  // username that somehow did not match — still gets a readable card rather
  // than an empty one.
  const me = results.find(r => r.username === username) || results[0] || null;
  const them = results.find(r => r !== me) || null;

  const iWon = !draw && !!gameResult?.winner && gameResult.winner.username === me?.username;
  const verdict = draw ? 'Draw' : iWon ? 'Victory' : 'Defeat';
  const tone = draw ? 'draw' : iWon ? 'win' : 'loss';
  const reason = REASON_TEXT[gameResult?.reason] || null;

  const hpPct = (hp) => Math.max(0, Math.min(100, Math.round(((hp ?? 0) / STARTING_HP) * 100)));

  const Side = ({ row, side }) => {
    if (!row) return <div className={`pdr-side pdr-side--${side} pdr-side--empty`} />;
    const isMe = row === me;
    return (
      <div className={`pdr-side pdr-side--${side}${isMe ? ' pdr-side--me' : ''}`}>
        <div className="pdr-who">
          <span className="pdr-avatar" aria-hidden="true">{(row.username || '?')[0]}</span>
          <span className="pdr-name">{row.username}{isMe && <em> (you)</em>}</span>
        </div>

        <div className="pdr-hp">
          <div className="pdr-hp-bar" aria-hidden="true">
            <div className={`pdr-hp-fill${(row.hp ?? 0) <= 0 ? ' is-down' : ''}`} style={{ width: `${hpPct(row.hp)}%` }} />
          </div>
          <span className="pdr-hp-text">
            {(row.hp ?? 0) <= 0 ? 'Down' : `${row.hp} HP left`}
          </span>
        </div>

        <dl className="pdr-stats">
          <div className="pdr-stat">
            <dt>Damage dealt</dt>
            <dd>{row.damageDealt ?? 0}</dd>
          </div>
          <div className="pdr-stat">
            <dt>Correct answers</dt>
            <dd>{row.correctAnswers ?? 0}</dd>
          </div>
          <div className="pdr-stat">
            <dt>XP earned</dt>
            <dd>+{row.xpEarned ?? 0}</dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <div className={`pdr pdr--${tone}`}>
      <div className="pdr-card">
        <header className="pdr-head">
          <p className="pdr-eyebrow">Match Results</p>
          <h1 className="pdr-verdict">{verdict}</h1>
          {reason && <p className="pdr-reason">{reason}</p>}
        </header>

        {results.length ? (
          <div className="pdr-sides">
            <Side row={me} side="me" />
            <span className="pdr-versus" aria-hidden="true">vs</span>
            <Side row={them} side="them" />
          </div>
        ) : (
          <p className="pdr-reason">The duel ended before any rounds were played.</p>
        )}

        {/* A guest's XP is counted for the match and then lost with the
            session. Said here, where it still means something, rather than
            discovered on the next sign-in. */}
        {isGuest && (
          <p className="pdr-guest">
            You played as a guest, so this XP will not be saved.{' '}
            <button type="button" className="pdr-signin" onClick={onSignIn}>Sign in</button>
            {' '}to keep it next time.
          </p>
        )}

        <div className="pdr-actions">
          <button type="button" className="pdr-btn pdr-btn--primary" onClick={onPlayAgain}>
            Duel again
          </button>
          <button type="button" className="pdr-btn" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
