import { useState, useEffect, useRef } from 'react';
import ExplanationText from './ExplanationText';
import { renderStem } from '../utils/renderStem';
import './PvpDuelGame.css';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const STARTING_HP = 100; // display default until the first server snapshot arrives

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Phase 4c: mockup PvP Match HUD treatment (minus the minimap). Visual pass
// only — HP bars are real (existing pvp_duel socket data); the mana bar and
// ability keys render per the mockup but are INERT (no mana/ability system
// exists yet). Sound + Forfeit are REAL: they reuse App's global mute and
// the return-home disconnect path (server-side forfeit proven in 4a).
export default function PvpDuelGame({
  question,
  round,
  timeLimit,
  myAnswer,
  hasAnswered,
  players,
  answerResult,
  roundResults,
  showingRoundResult,
  onAnswer,
  username,
  onTick,
  socketId,
  user = null,
  muted = false,
  onToggleMute,
  onForfeit,
}) {
  // ── Per-question countdown (drives BOTH the top-center clock and the
  //    modal header — one source, mockup shows the two readouts) ──
  const [left, setLeft] = useState(timeLimit || 0);
  const tickRef = useRef(null);
  const timerActive = !!question && !hasAnswered && !showingRoundResult;
  useEffect(() => {
    setLeft(timeLimit || 0);
    if (!question) return;
    tickRef.current = setInterval(() => setLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(tickRef.current);
  }, [timeLimit, question?.id]);
  useEffect(() => {
    if (timerActive && left <= 5 && left > 0 && onTick) onTick();
  }, [left, timerActive, onTick]);

  // ── Real HP (same derivation as 4a) ──
  const snapshotPlayers = roundResults?.players;
  const findHp = (isMe) => {
    const bySnapshot = snapshotPlayers?.find(p => (p.id === socketId) === isMe);
    if (bySnapshot && typeof bySnapshot.hp === 'number') return bySnapshot.hp;
    if (question?.duelHp) {
      const entry = Object.entries(question.duelHp).find(([id]) => (id === socketId) === isMe);
      if (entry) return entry[1];
    }
    return STARTING_HP;
  };
  const myHp  = findHp(true);
  const oppHp = findHp(false);
  const oppName = (snapshotPlayers || players || []).find(p => p.id !== socketId)?.username || 'Opponent';
  const myLevel = user?.level || 1;

  // ── Event feed: real strike messages from the existing mechanic ──
  const [feed, setFeed] = useState([]);
  const lastFeedRef = useRef(null);
  useEffect(() => {
    if (!roundResults || roundResults === lastFeedRef.current) return;
    lastFeedRef.current = roundResults;
    const msg = roundResults.striker
      ? (roundResults.striker === username
          ? { text: <>You struck <em>{oppName}</em> for 5 damage!</>, mine: true }
          : { text: <><em>{oppName}</em> struck you for 5 damage!</>, mine: false })
      : { text: <>No strike — nobody was first with the right answer.</>, mine: false };
    setFeed(prev => [msg, ...prev].slice(0, 2));
  }, [roundResults, username, oppName]);

  const handleForfeit = () => {
    // Same plain-confirm convention as the rest of the app; the actual quit
    // is App's return-home path: socket.disconnect() → server forfeit.
    if (window.confirm('Forfeit the match? Your opponent will claim victory.')) onForfeit?.();
  };

  const avatarLetter = (name) => (name || '?')[0].toUpperCase();
  const barPct = (hp) => `${Math.max(0, Math.min(100, (hp / STARTING_HP) * 100))}%`;

  return (
    <div className="pvd">
      {/* ── Top bar: self plate · timer · opponent plate ─────────────────── */}
      <div className="pvd-top">
        <div className="pvd-plate">
          <span className="pvd-avatar pvd-avatar--self">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
              : avatarLetter(username)}
          </span>
          <div className="pvd-plate-info">
            <div className="pvd-plate-name">{username} · Lvl. {myLevel}</div>
            <div className="pvd-bar pvd-bar--hp">
              <div className="pvd-bar-fill pvd-bar-fill--hp" style={{ width: barPct(myHp) }} />
            </div>
            {/* Mana bar: mockup styling, INERT — no mana system exists yet */}
            <div className="pvd-bar pvd-bar--mana" title="Mana — coming soon" aria-hidden="true">
              <div className="pvd-bar-fill pvd-bar-fill--mana" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Honest top-center readout: real per-question countdown over the
            real question number (no round/score concept exists in 4a) */}
        <div className="pvd-center">
          <div className="pvd-center-timer">{fmtClock(left)}</div>
          <div className="pvd-center-label">QUESTION {round || 1}</div>
        </div>

        {/* Opponent plate, mirrored. Level omitted — the server doesn't
            share opponent level, and we don't fabricate one. */}
        <div className="pvd-plate pvd-plate--opp">
          <div className="pvd-plate-info pvd-plate-info--right">
            <div className="pvd-plate-name">{oppName}</div>
            <div className="pvd-bar pvd-bar--hp">
              <div className="pvd-bar-fill pvd-bar-fill--hp pvd-bar-fill--right" style={{ width: barPct(oppHp) }} />
            </div>
            <div className="pvd-bar pvd-bar--mana" title="Mana — coming soon" aria-hidden="true">
              <div className="pvd-bar-fill pvd-bar-fill--mana pvd-bar-fill--right" style={{ width: '100%' }} />
            </div>
          </div>
          <span className="pvd-avatar pvd-avatar--opp">{avatarLetter(oppName)}</span>
        </div>
      </div>

      {/* ── Utility row: REAL sound toggle + REAL forfeit ─────────────────── */}
      <div className="pvd-utility">
        <button
          type="button"
          className="pvd-sound"
          onClick={onToggleMute}
          aria-pressed={!muted}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <span>Sound</span>
          <span className={`pvd-sound-track${muted ? ' pvd-sound-track--off' : ''}`}>
            <span className="pvd-sound-knob" />
          </span>
        </button>
        <button type="button" className="pvd-forfeit" onClick={handleForfeit}>
          Forfeit Match
        </button>
      </div>

      {/* ── Event feed: real strike messages (no fabricated ability lines) ── */}
      {feed.length > 0 && (
        <div className="pvd-feed">
          {feed.map((f, i) => (
            <div key={i} className={`pvd-feed-line${i === 0 ? ' pvd-feed-line--latest' : ''}`}>
              {f.text}
            </div>
          ))}
        </div>
      )}

      {/* ── Center: ANSWER TO STRIKE modal ────────────────────────────────── */}
      <div className="pvd-modal-wrap">
        {!question ? (
          <div className="pvd-modal pvd-modal--waiting">
            <div className="spinner" />
            <p className="pvd-waiting-text">Your opponent approaches…</p>
          </div>
        ) : (
          <div className="pvd-modal">
            <div className="pvd-modal-head">
              <span className="pvd-modal-title">ANSWER TO STRIKE</span>
              <span className="pvd-modal-clock">{fmtClock(left)}</span>
            </div>

            <div className="pvd-stem">{renderStem(question.question)}</div>
            {question.image_url && (
              <img
                src={question.image_url}
                alt="Medical scan"
                className="pvd-stem-image"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}

            <div className="pvd-options">
              {question.options.map((opt, i) => {
                const label   = LABELS[i];
                const isMine  = myAnswer === label;
                const isRight = showingRoundResult && roundResults?.correctAnswer === label;
                const isWrong = showingRoundResult && isMine && roundResults?.correctAnswer !== label;
                return (
                  <button
                    key={i}
                    type="button"
                    className={[
                      'pvd-option',
                      isMine  ? 'pvd-option--mine'  : '',
                      isRight ? 'pvd-option--right' : '',
                      isWrong ? 'pvd-option--wrong' : '',
                    ].join(' ')}
                    onClick={() => onAnswer(label)}
                    disabled={hasAnswered || showingRoundResult}
                  >
                    <span className="pvd-option-letter">{label}</span>
                    <span className="pvd-option-text">{opt}</span>
                  </button>
                );
              })}
            </div>

            {!showingRoundResult && (
              <div className="pvd-modal-foot">
                {hasAnswered
                  ? <>Waiting for {oppName}…</>
                  : <>Answer correctly before {oppName} to land a strike.</>}
              </div>
            )}

            {showingRoundResult && roundResults && (
              <div className={`pvd-result${answerResult?.correct ? ' pvd-result--correct' : ''}`}>
                <div className="pvd-result-line">
                  {answerResult && (
                    <span className={`pvd-result-verdict${answerResult.correct ? ' pvd-result-verdict--correct' : ''}`}>
                      {answerResult.correct ? '✓ CORRECT' : '✗ WRONG'}
                    </span>
                  )}
                  <span className="pvd-result-strike">
                    {roundResults.striker
                      ? (roundResults.striker === username
                          ? `⚔ You strike ${oppName} for 5 damage!`
                          : `🛡 ${oppName} strikes you for 5 damage!`)
                      : 'No strike this round.'}
                  </span>
                </div>
                <div className="pvd-result-expl">
                  <strong>
                    Correct answer: {roundResults.correctAnswer}
                    {question?.options?.[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]
                      ? `. ${question.options[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]}`
                      : ''}
                  </strong>
                  <ExplanationText text={roundResults.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar: self avatar (no status orbs — no buff system) +
             inert ability keys per the mockup. No minimap. ─────────────── */}
      <div className="pvd-bottom">
        <span className="pvd-avatar pvd-avatar--self pvd-avatar--corner">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
            : avatarLetter(username)}
        </span>

        <div className="pvd-abilities" aria-label="Abilities — coming soon">
          <button type="button" className="pvd-ability pvd-ability--teal" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">1</span>
            <span className="pvd-ability-name">Heal</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--teal" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">2</span>
            <span className="pvd-ability-name">Ward</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--cooldown" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">4s</span>
            <span className="pvd-ability-name">Lance</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--ult" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">R</span>
            <span className="pvd-ability-name">Ult</span>
          </button>
        </div>

        {/* right slot intentionally empty: the mockup's minimap is excluded */}
        <span className="pvd-bottom-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
