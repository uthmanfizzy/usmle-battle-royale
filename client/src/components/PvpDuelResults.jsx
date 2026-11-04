import { useState } from 'react';
import ExplanationText from './ExplanationText';
import { renderStem } from '../utils/renderStem';
import './PvpDuelResults.css';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

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
  // 'forfeit' is handled separately — it needs to know WHICH of them gave up.
  hp_zero: 'Taken to zero.',
  knockout: 'Taken to zero.',
  rounds_complete: 'All questions played — decided on damage dealt.',
  pool_exhausted: 'Questions ran out — decided on damage dealt.',
  questions_exhausted: 'Questions ran out — decided on damage dealt.',
  timeout: 'Time ran out.',
};

const STARTING_HP = 100;

export default function PvpDuelResults({ gameResult, history = [], username, onPlayAgain, onHome, isGuest, onSignIn }) {
  // Which question's explanation is open. One at a time: the point is to read
  // one properly, not to scroll past twelve.
  const [openRound, setOpenRound] = useState(null);
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
  // Who gave up, said from the reader's own chair. The same event is "you
  // forfeited" to one of them and "your opponent forfeited" to the other, and
  // a screen that gets this backwards is worse than one that says nothing.
  const forfeitedBy = gameResult?.forfeitedBy || null;
  const iForfeited = forfeitedBy && me && forfeitedBy.username === me.username;
  const reason = gameResult?.reason === 'forfeit'
    ? (forfeitedBy
        ? (iForfeited
            ? 'You forfeited the match.'
            : `${forfeitedBy.username} forfeited the match.`)
        : 'Your opponent left the duel.')
    : (REASON_TEXT[gameResult?.reason] || null);

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

        {/* ── What the questions were ───────────────────────────────────
            A duel is over in a few minutes and the explanations go past at
            the speed of the match. This is the only chance to actually read
            them, which is why forfeiting lands here too rather than throwing
            the player back to the front page. */}
        {history.length > 0 && (
          <section className="pdr-review">
            <h2 className="pdr-review-head">
              The questions
              <span className="pdr-review-score">
                {history.filter(h => h.correct).length} of {history.length} right
              </span>
            </h2>

            <ol className="pdr-review-list">
              {history.map((h) => {
                const open = openRound === h.round;
                const correctIdx = (h.correctAnswer || 'A').charCodeAt(0) - 65;
                return (
                  <li key={h.round} className={`pdr-review-item${h.correct ? ' is-right' : ' is-wrong'}`}>
                    <button
                      type="button"
                      className="pdr-review-toggle"
                      aria-expanded={open}
                      onClick={() => setOpenRound(open ? null : h.round)}
                    >
                      <span className="pdr-review-n">{h.round}</span>
                      <span className={`pdr-review-mark${h.correct ? ' is-right' : ''}`}>
                        {h.correct ? '✓' : h.myAnswer == null ? '—' : '✗'}
                      </span>
                      <span className="pdr-review-q">{h.question}</span>
                      {h.struck && <span className="pdr-review-strike" title="You landed the strike">⚔</span>}
                      <span className="pdr-review-chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
                    </button>

                    {open && (
                      <div className="pdr-review-body">
                        <div className="pdr-review-stem">{renderStem(h.question)}</div>
                        {h.imageUrl && (
                          <img
                            className="pdr-review-img"
                            src={h.imageUrl}
                            alt=""
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}

                        <ul className="pdr-review-options">
                          {(h.options || []).map((opt, i) => {
                            const letter = LABELS[i];
                            const isRight = i === correctIdx;
                            const isMine = h.myAnswer === letter;
                            return (
                              <li
                                key={i}
                                className={[
                                  'pdr-review-opt',
                                  isRight ? 'is-right' : '',
                                  isMine && !isRight ? 'is-mine-wrong' : '',
                                  isMine && isRight ? 'is-mine-right' : '',
                                ].join(' ')}
                              >
                                <span className="pdr-review-opt-letter">{letter}</span>
                                <span className="pdr-review-opt-text">{opt}</span>
                                {/* Both facts, separately: which one was right
                                    and which one you picked. Marking only the
                                    right answer leaves you guessing what you
                                    actually did. */}
                                {isRight && <span className="pdr-review-tag">Correct</span>}
                                {isMine && !isRight && <span className="pdr-review-tag pdr-review-tag--mine">You</span>}
                              </li>
                            );
                          })}
                        </ul>

                        {h.myAnswer == null && (
                          <p className="pdr-review-note">You didn&apos;t answer this one in time.</p>
                        )}

                        {h.explanation
                          ? <div className="pdr-review-expl"><ExplanationText text={h.explanation} /></div>
                          : <p className="pdr-review-note">No explanation was written for this question.</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
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
