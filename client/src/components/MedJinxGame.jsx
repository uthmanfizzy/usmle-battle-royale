import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import socket from '../socket';
import * as audio from '../audio';
import MedJinxScene from './MedJinxScene';
import './MedJinx.css';

/**
 * MedJinx — the whole match on one screen.
 *
 * The server owns the clock and the scoring (server/medjinx/game.js). This
 * component shows what it is told: the prompt, how long is left, whether
 * each answer you typed was accepted, and how many answers everyone else
 * has found — never what those answers were, until the round is over.
 *
 * It listens to the socket itself rather than through App: the first round
 * can be announced before a lazily-loaded component has mounted, so on
 * mount it asks the server where the match is (`medjinx_sync`) instead of
 * relying on having heard everything from the start.
 */

const TIER_NAMES = { 1: 'Common', 2: 'Recognised', 3: 'Specific', 4: 'Advanced', 5: 'Rare' };
const BASE_TIERS = [
  { tier: 5, name: 'Rare', points: 8000 },
  { tier: 4, name: 'Advanced', points: 6000 },
  { tier: 3, name: 'Specific', points: 4000 },
  { tier: 2, name: 'Recognised', points: 2000 },
  { tier: 1, name: 'Common', points: 1000 },
];

const CATEGORY_ORDER = ['diagnosis', 'clinical', 'cause', 'patho', 'histo', 'labs', 'genetics', 'immuno', 'pharm', 'comp', 'assoc'];
const CATEGORY_NAMES = {
  diagnosis: 'Diagnosis',
  clinical: 'Clinical manifestations',
  cause: 'Causes & risk factors',
  patho: 'Pathophysiology',
  histo: 'Histology',
  labs: 'Labs, biochemistry & imaging',
  genetics: 'Genetics',
  immuno: 'Immunology',
  pharm: 'Pharmacology',
  comp: 'Complications',
  assoc: 'Associations',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// ── Pixel art ────────────────────────────────────────────────────────────────

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const SKIN = ['#f6c9a0', '#e8a878', '#c98a5a', '#8d5a3b', '#f9d9b8', '#a86f48'];
const HAIR = ['#2b1b12', '#5a3a1e', '#c08a3e', '#15151c', '#7a2f1e', '#d9c27a'];
const SCRUB = ['#3aa7e0', '#35c4a0', '#7c5cff', '#e05a8a', '#f08a3c'];

/** A small pixel doctor, the same one every time for the same name. */
export function PixelDoc({ seed = '', size = 44 }) {
  const h = hash(seed || '?');
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const scrub = SCRUB[(h >> 6) % SCRUB.length];
  const cap = (h >> 9) % 5 < 2;
  const long = (h >> 11) % 3 === 0;
  const glasses = (h >> 13) % 4 === 0;
  const coat = (h >> 15) % 3 !== 0;
  const px = (x, y, w, hh, f, k) => <rect key={k} x={x} y={y} width={w} height={hh} fill={f} />;
  return (
    <svg className="mjx-doc" width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      {long && !cap && px(2, 2, 8, 6, hair, 'lh')}
      {px(3, 2, 6, 6, skin, 'head')}
      {px(2, 4, 1, 2, skin, 'el')}
      {px(9, 4, 1, 2, skin, 'er')}
      {cap
        ? [px(3, 0, 6, 3, scrub, 'cap'), px(3, 2, 6, 1, '#ffffff', 'band')]
        : [px(3, 1, 6, 2, hair, 'hair'), px(3, 3, 1, 1, hair, 'hl'), px(8, 3, 1, 1, hair, 'hr')]}
      {px(4, 4, 1, 1, '#1b1b2a', 'eye1')}
      {px(7, 4, 1, 1, '#1b1b2a', 'eye2')}
      {glasses && [px(3, 4, 1, 1, '#3b3f66', 'g1'), px(5, 4, 2, 1, '#3b3f66', 'g2'), px(8, 4, 1, 1, '#3b3f66', 'g3')]}
      {px(5, 6, 2, 1, '#a8443a', 'mouth')}
      {px(5, 8, 2, 1, skin, 'neck')}
      {px(1, 9, 10, 3, coat ? '#f2f5fa' : scrub, 'body')}
      {px(5, 9, 2, 2, scrub, 'v')}
      {coat && [px(3, 10, 1, 2, '#8d93b8', 's1'), px(8, 10, 1, 1, '#8d93b8', 's2')]}
    </svg>
  );
}

const FLASK_FILL = { 1: '#8f8477', 2: '#3d9cff', 3: '#7bdc3a', 4: '#a56bff', 5: '#ffcf3a' };

/** A specimen flask, coloured by tier. */
export function Flask({ tier = 1, size = 22 }) {
  const f = FLASK_FILL[tier] || FLASK_FILL[1];
  return (
    <svg className={`mjx-flask mjx-flask--${tier}`} width={size} height={size * 1.2} viewBox="0 0 10 12" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="0" width="4" height="1" fill="#e8f1ff" />
      <rect x="4" y="1" width="2" height="4" fill="#b9cdea" />
      <rect x="3" y="5" width="4" height="1" fill="#b9cdea" />
      <rect x="2" y="6" width="6" height="2" fill="#b9cdea" />
      <rect x="1" y="8" width="8" height="1" fill={f} />
      <rect x="0" y="9" width="10" height="3" fill={f} />
      <rect x="2" y="7" width="6" height="1" fill={f} />
      <rect x="1" y="9" width="1" height="2" fill="#ffffff" opacity="0.55" />
      <rect x="6" y="10" width="1" height="1" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

const LINE_COLOURS = ['#f5a623', '#35b8ff', '#f0c24b', '#46d38a', '#b37bff', '#ff6fae', '#35e0d0', '#ff7a59', '#e6e04a', '#8fa2ff'];

// ── The clock ────────────────────────────────────────────────────────────────

/** Milliseconds until `deadline` (a Date.now() value), ticking ten times a second. */
function useCountdown(deadline) {
  const [left, setLeft] = useState(() => Math.max(0, (deadline || 0) - Date.now()));
  useEffect(() => {
    if (!deadline) { setLeft(0); return undefined; }
    const tick = () => setLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline]);
  return left;
}

// ── The round: prompt, clock, input ──────────────────────────────────────────

function Prompt({ round }) {
  const clinical = round.variant === 'clinical';
  return (
    <div className={`mjx-prompt${clinical ? ' mjx-prompt--clinical' : ''}`}>
      {clinical ? (
        <>
          <p className="mjx-prompt-kind">Clinical case · {round.prompt.kind}</p>
          <p className="mjx-vignette">{round.prompt.vignette}</p>
          <p className="mjx-ask">Name everything you can associate with this case.</p>
        </>
      ) : (
        <>
          <h1 className="mjx-title">{round.prompt.title}</h1>
          <p className="mjx-desc">{round.prompt.description}</p>
        </>
      )}
    </div>
  );
}

function RoundPanel({ round, phase, deadline, onSubmit, acceptedCount, lastNote }) {
  const left = useCountdown(deadline);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const answering = phase === 'answering';
  const total = (round.seconds || 60) * 1000;
  const secs = Math.ceil(left / 1000);
  const pct = answering ? Math.max(0, Math.min(100, (left / total) * 100)) : 100;
  const urgent = answering && secs <= 10;

  // Keep the cursor in the box: this is a game of typing as fast as you think.
  useEffect(() => { if (answering) inputRef.current?.focus(); }, [answering, round.round]);

  // The last five seconds tick.
  const lastTick = useRef(0);
  useEffect(() => {
    if (answering && secs <= 5 && secs > 0 && lastTick.current !== secs) {
      lastTick.current = secs;
      audio.playTick();
    }
  }, [answering, secs]);

  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !answering) return;
    onSubmit(t);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <section className={`mjx-panel mjx-round${round.event ? ' has-event' : ''}`}>
      <header className="mjx-round-head">
        <span className="mjx-round-meta">
          Round {round.round} of {round.total} <i>•</i> {round.system}
        </span>
        <span className={`mjx-chip mjx-chip--${round.variant}`}>
          {round.variant === 'clinical' ? 'Clinical Jinx' : 'Open-Ended Jinx'}
        </span>
      </header>

      {round.event && (
        <div className={`mjx-event mjx-event--${round.event.id}`}>
          <strong>{round.event.name}</strong>
          <span>{round.event.blurb}</span>
        </div>
      )}

      <Prompt round={round} />

      <div className={`mjx-timer${urgent ? ' is-urgent' : ''}`} role="timer" aria-label={`${secs} seconds left`}>
        <div className="mjx-timer-track"><i style={{ width: `${pct}%` }} /></div>
        <span className="mjx-timer-num">{answering ? secs : round.seconds}</span>
      </div>

      <form className="mjx-entry" onSubmit={send}>
        <input
          ref={inputRef}
          className="mjx-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={answering ? 'Your answer' : `Get ready… ${Math.max(1, secs)}`}
          disabled={!answering}
          maxLength={80}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-label="Your answer"
        />
        <button type="submit" className="mjx-btn mjx-btn--go" disabled={!answering || !text.trim()}>Submit</button>
      </form>

      <p className="mjx-hint">
        {lastNote
          || (answering
            ? 'Type an answer and hit Enter — keep them coming. One idea per answer.'
            : 'Read the prompt. The clock starts in a moment.')}
        <b>{acceptedCount} accepted</b>
      </p>
    </section>
  );
}

// ── Players ──────────────────────────────────────────────────────────────────

function PlayerGrid({ players, counts, socketId }) {
  return (
    <section className="mjx-panel mjx-players" aria-label="Players">
      {players.map((p, i) => (
        <div
          className={`mjx-player${p.id === socketId ? ' is-me' : ''}`}
          key={p.id}
          style={{ '--line': LINE_COLOURS[i % LINE_COLOURS.length] }}
        >
          <span className="mjx-player-count" key={counts[p.id] || 0}>{counts[p.id] || 0}</span>
          <PixelDoc seed={p.username} size={52} />
          <span className="mjx-player-name">{p.id === socketId ? 'You' : p.username}</span>
        </div>
      ))}
    </section>
  );
}

// ── The feed: your answers, and proof the others are busy ────────────────────

function Feed({ feed, hidden, onToggle }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [feed.length]);
  return (
    <section className={`mjx-panel mjx-feed${hidden ? ' is-hidden' : ''}`}>
      <header className="mjx-feed-head">
        <span>Answers</span>
        <button type="button" className="mjx-btn mjx-btn--mini" onClick={onToggle}>{hidden ? 'Show' : 'Hide'}</button>
      </header>
      {!hidden && (
        <div className="mjx-feed-list" aria-live="polite">
          {feed.length === 0 && (
            <p className="mjx-feed-empty">Your answers appear here. Everyone else&apos;s stay hidden until the round ends.</p>
          )}
          {feed.map(line => (
            <p className={`mjx-line mjx-line--${line.status}`} key={line.key}>
              <b style={line.colour ? { color: line.colour } : undefined}>{line.who}:</b>{' '}
              {line.masked
                ? <span className="mjx-mask" aria-label="hidden answer">▒▒▒▒▒▒</span>
                : <span className="mjx-line-text">{line.text}</span>}
              {line.status === 'accepted' && <em>✓{line.label && line.label.toLowerCase() !== line.text.toLowerCase() ? ` ${line.label}` : ''}</em>}
              {line.status === 'rejected' && <em>✗</em>}
              {line.status === 'duplicate' && <em>already said</em>}
              {line.status === 'self' && <em>that&apos;s the topic</em>}
              {line.status === 'pending' && <em>…</em>}
            </p>
          ))}
          <span ref={endRef} />
        </div>
      )}
    </section>
  );
}

// ── The legend ───────────────────────────────────────────────────────────────

function Rarity({ tiers }) {
  const rows = [...(tiers || BASE_TIERS)].sort((a, b) => b.tier - a.tier);
  return (
    <section className="mjx-scroll" aria-label="What each tier is worth">
      <h2>Rarity</h2>
      <ul>
        {rows.map(t => (
          <li key={t.tier} className={t.points ? '' : 'is-off'}>
            <Flask tier={t.tier} />
            <span>{t.name}</span>
            <b>{t.points ? fmt(t.points) : '—'}</b>
          </li>
        ))}
      </ul>
      <p>Shared answers split their points. The ones nobody else thinks of are yours alone.</p>
    </section>
  );
}

// ── The breakdown ────────────────────────────────────────────────────────────

function Breakdown({ reveal, players, socketId, isHost, ready, replay, onReady, onReplay, deadline }) {
  const left = useCountdown(deadline);
  const [filter, setFilter] = useState('all');
  const [iAmReady, setIAmReady] = useState(false);
  const name = useCallback((id) => {
    if (id === socketId) return 'You';
    return players.find(p => p.id === id)?.username
      || reveal.standings.find(s => s.id === id)?.username || 'Player';
  }, [players, reveal.standings, socketId]);

  const me = reveal.standings.find(s => s.id === socketId);
  const mine = reveal.mine;
  const found = reveal.answers.filter(a => a.finders.length);
  const missed = reveal.answers.filter(a => !a.finders.length);
  const topMissed = [...missed].sort((a, b) => b.tier - a.tier).slice(0, 4);
  const rarest = [...found].sort((a, b) => b.tier - a.tier || a.finders.length - b.finders.length).slice(0, 5);
  const myMisses = (mine?.log || []).filter(l => l.status === 'trap' || l.status === 'unknown');

  const shown = useMemo(() => {
    if (filter === 'mine') return reveal.answers.filter(a => a.finders.includes(socketId));
    if (filter === 'missed') return missed;
    if (filter === 'found') return found;
    return reveal.answers;
  }, [filter, reveal.answers, socketId]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = CATEGORY_ORDER
    .map(cat => ({ cat, items: shown.filter(a => a.category === cat).sort((a, b) => b.tier - a.tier) }))
    .filter(g => g.items.length);

  const maxTotal = Math.max(1, ...reveal.standings.map(s => s.total));

  return (
    <div className="mjx-board">
      <header className="mjx-panel mjx-board-head">
        <span className="mjx-round-meta">
          Round {reveal.round} of {reveal.total} <i>•</i> {reveal.system} <i>•</i> Breakdown
        </span>
        <h1 className="mjx-title">{reveal.topic.title}</h1>
        <p className="mjx-desc">{reveal.topic.description}</p>
        {reveal.topic.vignette && (
          <details className="mjx-case">
            <summary>The case</summary>
            <p>{reveal.topic.vignette}</p>
          </details>
        )}
        {reveal.event && (
          <div className={`mjx-event mjx-event--${reveal.event.id}`}>
            <strong>{reveal.event.name}</strong><span>{reveal.event.blurb}</span>
          </div>
        )}
      </header>

      <div className="mjx-board-body">
        <aside className="mjx-board-side">
          <section className="mjx-panel mjx-standings">
            <h2 className="mjx-h">Leaderboard</h2>
            {reveal.standings.map((s, i) => (
              <div className={`mjx-stand${s.id === socketId ? ' is-me' : ''}`} key={s.id}>
                <span className="mjx-stand-rank">{i + 1}</span>
                <PixelDoc seed={s.username} size={30} />
                <span className="mjx-stand-name">
                  {s.id === socketId ? 'You' : s.username}
                  <i className="mjx-stand-bar"><b style={{ width: `${(s.total / maxTotal) * 100}%` }} /></i>
                </span>
                <span className="mjx-stand-pts">
                  <b>{fmt(s.total)}</b>
                  <small>+{fmt(s.roundPoints)}{s.multiplier > 1 ? ` ×${s.multiplier}` : ''}</small>
                </span>
              </div>
            ))}
          </section>

          {me && (
            <section className="mjx-panel mjx-you">
              <h2 className="mjx-h">Your round</h2>
              <dl>
                <div><dt>Points</dt><dd>{fmt(me.roundPoints)}</dd></div>
                <div><dt>Accepted</dt><dd>{me.accepted}</dd></div>
                <div><dt>Unique</dt><dd>{me.unique}</dd></div>
                <div><dt>Accuracy</dt><dd>{mine?.accuracy == null ? '—' : `${mine.accuracy}%`}</dd></div>
                <div><dt>Best tier</dt><dd>{me.bestTier ? TIER_NAMES[me.bestTier] : '—'}</dd></div>
                <div><dt>Missed</dt><dd>{reveal.answers.length - me.accepted} of {reveal.answers.length}</dd></div>
              </dl>
              {me.rarest && <p className="mjx-you-best"><Flask tier={me.bestTier} size={16} /><span>Rarest find: <b>{me.rarest}</b></span></p>}
            </section>
          )}

          <section className="mjx-scroll mjx-takeaways">
            <h2>High-yield</h2>
            <ol>{reveal.topic.takeaways.map(t => <li key={t}>{t}</li>)}</ol>
            <p className="mjx-source">Source: {reveal.topic.source}</p>
          </section>
        </aside>

        <main className="mjx-panel mjx-answers">
          {rarest.length > 0 && (
            <section className="mjx-block">
              <h2 className="mjx-h">Rarest finds</h2>
              <ul className="mjx-finds">
                {rarest.map(a => (
                  <li key={a.id}>
                    <Flask tier={a.tier} size={18} />
                    <span><b>{a.label}</b> — {a.finders.map(name).join(', ')}</span>
                    <em>{fmt(a.each)}{a.finders.length > 1 ? ' each' : ''}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topMissed.length > 0 && (
            <section className="mjx-block mjx-block--missed">
              <h2 className="mjx-h">Missed opportunities</h2>
              <ul className="mjx-finds">
                {topMissed.map(a => (
                  <li key={a.id}>
                    <Flask tier={a.tier} size={18} />
                    <span>Nobody found <b>{a.label}</b>. {a.why}</span>
                    <em>{fmt(a.value)}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(myMisses.length > 0 || reveal.traps.length > 0) && (
            <section className="mjx-block mjx-block--wrong">
              <h2 className="mjx-h">Not accepted</h2>
              <ul className="mjx-wrong">
                {reveal.traps.map(t => (
                  <li key={t.why} className="is-trap">
                    <b>{t.texts.join(', ')}</b> <small>({t.by.join(', ')})</small>
                    <span>{t.why}</span>
                  </li>
                ))}
                {myMisses.filter(l => l.status === 'unknown').map(l => (
                  <li key={l.text}>
                    <b>{l.text}</b>
                    <span>Not in this topic&apos;s answer bank, so it scored nothing. It has been logged for review.</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mjx-block">
            <div className="mjx-filter" role="tablist">
              {[
                ['all', `All answers (${reveal.answers.length})`],
                ['mine', `Yours (${reveal.answers.filter(a => a.finders.includes(socketId)).length})`],
                ['found', `Found (${found.length})`],
                ['missed', `Missed by all (${missed.length})`],
              ].map(([id, label]) => (
                <button
                  key={id} type="button" role="tab" aria-selected={filter === id}
                  className={`mjx-tab${filter === id ? ' is-on' : ''}`}
                  onClick={() => setFilter(id)}
                >{label}</button>
              ))}
            </div>

            {groups.length === 0 && <p className="mjx-feed-empty">Nothing in this list.</p>}
            {groups.map(g => (
              <div className="mjx-cat" key={g.cat}>
                <h3>{CATEGORY_NAMES[g.cat]}</h3>
                {g.items.map(a => {
                  const mineToo = a.finders.includes(socketId);
                  return (
                    <article className={`mjx-ans mjx-ans--t${a.tier}${mineToo ? ' is-mine' : ''}${a.finders.length ? '' : ' is-missed'}`} key={a.id}>
                      <Flask tier={a.tier} size={20} />
                      <div className="mjx-ans-body">
                        <p className="mjx-ans-label">
                          {a.label}
                          <small>{TIER_NAMES[a.tier]}</small>
                        </p>
                        <p className="mjx-ans-why">{a.why}</p>
                        <p className="mjx-ans-who">
                          {a.finders.length
                            ? <>Found by {a.finders.map(name).join(', ')}</>
                            : <>Nobody found this</>}
                        </p>
                      </div>
                      <div className="mjx-ans-pts">
                        <b>{a.finders.length ? fmt(a.each) : fmt(a.value)}</b>
                        <small>
                          {a.finders.length > 1 ? `${fmt(a.value)} ÷ ${a.finders.length}` : a.finders.length ? 'unshared' : 'unclaimed'}
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </section>
        </main>
      </div>

      <footer className="mjx-panel mjx-board-foot">
        <span className="mjx-foot-status">
          {ready.need > 0 ? `${ready.ready} of ${ready.need} ready` : ''}
          <small>moves on in {Math.ceil(left / 1000)}s</small>
        </span>
        {isHost && (
          <button
            type="button"
            className={`mjx-btn mjx-btn--ghost${replay ? ' is-on' : ''}`}
            onClick={() => onReplay(!replay)}
            aria-pressed={replay}
          >
            {replay ? '↻ Replaying this topic next' : '↻ Replay this topic'}
          </button>
        )}
        {!isHost && replay && <span className="mjx-foot-note">The host is replaying this topic next.</span>}
        <button
          type="button"
          className="mjx-btn mjx-btn--go"
          disabled={iAmReady}
          onClick={() => { setIAmReady(true); onReady(); }}
        >
          {iAmReady ? 'Waiting for the others…' : reveal.isLast && !replay ? 'Final results ▶' : 'Next round ▶'}
        </button>
      </footer>
    </div>
  );
}

// ── The end ──────────────────────────────────────────────────────────────────

function Final({ result, socketId, username, onPlayAgain, onLeave }) {
  const players = result.players || [];
  const me = players.find(p => p.id === socketId) || players.find(p => p.username === username);
  const podium = players.slice(0, 3);
  return (
    <div className="mjx-board mjx-final">
      <header className="mjx-panel mjx-board-head">
        <span className="mjx-round-meta">MedJinx <i>•</i> Final results</span>
        <h1 className="mjx-title">
          {me?.place === 1 ? 'You out-knew the room' : `${result.winner || 'Nobody'} wins`}
        </h1>
        <p className="mjx-desc">
          {result.reason === 'forfeit'
            ? 'The room emptied before the last round.'
            : 'The more you know, the more you score.'}
        </p>
      </header>

      <div className="mjx-board-body">
        <aside className="mjx-board-side">
          <section className="mjx-panel mjx-podium">
            {podium.map(p => (
              <div className={`mjx-pod mjx-pod--${p.place}`} key={p.id}>
                <PixelDoc seed={p.username} size={p.place === 1 ? 64 : 48} />
                <b>{p.id === socketId ? 'You' : p.username}</b>
                <span>{fmt(p.score)}</span>
                <i>{p.place}</i>
              </div>
            ))}
          </section>
          {me && (
            <section className="mjx-panel mjx-you">
              <h2 className="mjx-h">Your match</h2>
              <dl>
                <div><dt>Place</dt><dd>{me.place} of {players.length}</dd></div>
                <div><dt>Points</dt><dd>{fmt(me.score)}</dd></div>
                <div><dt>Accepted</dt><dd>{me.accepted}</dd></div>
                <div><dt>Unique</dt><dd>{me.unique}</dd></div>
                <div><dt>Accuracy</dt><dd>{me.accuracy == null ? '—' : `${me.accuracy}%`}</dd></div>
                <div><dt>Best tier</dt><dd>{me.bestTier ? TIER_NAMES[me.bestTier] : '—'}</dd></div>
              </dl>
              {me.rarest && <p className="mjx-you-best"><Flask tier={me.bestTier} size={16} /><span>Rarest find: <b>{me.rarest}</b></span></p>}
            </section>
          )}
        </aside>

        <main className="mjx-panel mjx-answers">
          <section className="mjx-block">
            <h2 className="mjx-h">Standings</h2>
            <div className="mjx-table" role="table">
              <div className="mjx-tr mjx-tr--head" role="row">
                <span>#</span><span>Player</span><span>Points</span><span>Accepted</span><span>Unique</span><span>Accuracy</span>
              </div>
              {players.map(p => (
                <div className={`mjx-tr${p.id === socketId ? ' is-me' : ''}`} role="row" key={p.id}>
                  <span>{p.place}</span>
                  <span className="mjx-td-name"><PixelDoc seed={p.username} size={22} />{p.id === socketId ? 'You' : p.username}</span>
                  <span>{fmt(p.score)}</span>
                  <span>{p.accepted}</span>
                  <span>{p.unique}</span>
                  <span>{p.accuracy == null ? '—' : `${p.accuracy}%`}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mjx-block">
            <h2 className="mjx-h">The rounds</h2>
            <ul className="mjx-finds">
              {(result.rounds || []).map(r => (
                <li key={r.round}>
                  <Flask tier={r.best?.tier || 1} size={18} />
                  <span>
                    <b>{r.round}. {r.title}</b> — {r.found} of {r.bank} answers found.
                    {r.best ? <> Best find: {r.best.label} ({r.best.by.join(', ')}).</> : ' Nothing was found.'}
                  </span>
                  <em>{r.variant === 'clinical' ? 'Clinical' : 'Open'}</em>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <footer className="mjx-panel mjx-board-foot">
        <span className="mjx-foot-status">Same room, same players, new topics.</span>
        <button type="button" className="mjx-btn mjx-btn--ghost" onClick={onLeave}>Leave</button>
        <button type="button" className="mjx-btn mjx-btn--go" onClick={onPlayAgain}>Play again ▶</button>
      </footer>
    </div>
  );
}

// ── The screen ───────────────────────────────────────────────────────────────

export default function MedJinxGame({
  players = [], username, socketId, isHost, gameResult,
  muted, onToggleMute, onLeave, onPlayAgain,
}) {
  const [round, setRound] = useState(null);       // the latest prompt
  const [phase, setPhase] = useState('waiting');  // waiting | intro | answering | reveal
  const [deadline, setDeadline] = useState(0);
  const [counts, setCounts] = useState({});
  const [feed, setFeed] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [ready, setReady] = useState({ ready: 0, need: 0 });
  const [replay, setReplay] = useState(false);
  const [feedHidden, setFeedHidden] = useState(false);
  const [note, setNote] = useState('');

  const playersRef = useRef(players);
  playersRef.current = players;
  const countsRef = useRef({});
  const seq = useRef(0);
  const noteTimer = useRef(null);

  const flash = useCallback((msg) => {
    setNote(msg);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(''), 2600);
  }, []);

  useEffect(() => {
    const onRound = (r) => {
      setRound(r);
      setPhase(r.phase);
      setDeadline(Date.now() + (r.msLeft || 0));
      setReveal(null);
      setReplay(false);
      setCounts(r.counts || {});
      countsRef.current = r.counts || {};
      // A fresh round clears the feed; the same round arriving again (the
      // clock starting, or a resync) keeps it.
      setFeed((prev) => {
        if (r.phase === 'intro') return [];
        if (Array.isArray(r.log) && prev.length === 0) {
          return r.log.map(l => ({ key: `s${seq.current++}`, who: 'You', text: l.text, status: l.status }));
        }
        return prev;
      });
    };

    const onProgress = ({ counts: next = {} }) => {
      const prev = countsRef.current;
      const lines = [];
      for (const [id, n] of Object.entries(next)) {
        if (id === socket.id) continue;
        const gained = n - (prev[id] || 0);
        const idx = playersRef.current.findIndex(p => p.id === id);
        const who = playersRef.current[idx]?.username;
        for (let i = 0; i < Math.min(gained, 3) && who; i++) {
          lines.push({
            key: `m${seq.current++}`, who, masked: true, status: 'other',
            colour: LINE_COLOURS[Math.max(0, idx) % LINE_COLOURS.length],
          });
        }
      }
      countsRef.current = next;
      setCounts(next);
      if (lines.length) setFeed(f => [...f, ...lines].slice(-160));
    };

    const onReveal = (rv) => {
      setReveal(rv);
      setPhase('reveal');
      setDeadline(Date.now() + (rv.msLeft || 0));
      setReady({ ready: rv.ready || 0, need: rv.need || 0 });
      setReplay(Boolean(rv.replay));
    };

    socket.on('medjinx_round', onRound);
    socket.on('medjinx_progress', onProgress);
    socket.on('medjinx_reveal', onReveal);
    socket.on('medjinx_ready', setReady);
    socket.on('medjinx_replay', ({ on }) => setReplay(Boolean(on)));
    // Whatever was announced before this mounted, ask for it again.
    socket.emit('medjinx_sync');
    const resync = () => socket.emit('medjinx_sync');
    socket.on('connect', resync);

    return () => {
      socket.off('medjinx_round', onRound);
      socket.off('medjinx_progress', onProgress);
      socket.off('medjinx_reveal', onReveal);
      socket.off('medjinx_ready', setReady);
      socket.off('medjinx_replay');
      socket.off('connect', resync);
      clearTimeout(noteTimer.current);
    };
  }, []);

  const submit = useCallback((text) => {
    const key = `a${seq.current++}`;
    setFeed(f => [...f, { key, who: 'You', text, status: 'pending' }].slice(-160));
    const settle = (patch) => setFeed(f => f.map(l => (l.key === key ? { ...l, ...patch } : l)));
    socket.timeout(4000).emit('medjinx_submit', { text }, (err, res) => {
      if (err || !res) { settle({ status: 'rejected' }); flash('No answer from the server — try that one again.'); return; }
      switch (res.status) {
        case 'accepted':
          settle({ status: 'accepted', label: res.label });
          audio.playCorrect();
          break;
        case 'duplicate':
          settle({ status: 'duplicate' });
          flash(res.label ? `You already have ${res.label}.` : 'You already tried that.');
          break;
        case 'self':
          settle({ status: 'self' });
          flash(res.note || 'That is the topic itself.');
          break;
        case 'limit':
          setFeed(f => f.filter(l => l.key !== key));
          flash('That is the most answers one round allows.');
          break;
        case 'closed':
          setFeed(f => f.filter(l => l.key !== key));
          flash('Time is up for this round.');
          break;
        default:
          settle({ status: 'rejected' });
      }
    });
  }, [flash]);

  const myAccepted = counts[socketId] || 0;
  const over = Boolean(gameResult && gameResult.gameMode === 'medjinx');

  return (
    <div className={`mjx mjx--${over ? 'final' : phase}`}>
      <MedJinxScene />
      <div className="mjx-shade" aria-hidden="true" />

      <div className="mjx-top">
        <span className="mjx-logo">Med<b>Jinx</b></span>
        <span className="mjx-top-actions">
          <button type="button" className="mjx-btn mjx-btn--mini" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            className="mjx-btn mjx-btn--mini"
            onClick={() => { if (over || window.confirm('Leave this match?')) onLeave(); }}
          >Leave</button>
        </span>
      </div>

      {over ? (
        <Final result={gameResult} socketId={socketId} username={username} onPlayAgain={onPlayAgain} onLeave={onLeave} />
      ) : phase === 'reveal' && reveal ? (
        <Breakdown
          key={`${reveal.round}-${reveal.topic.id}`}
          reveal={reveal} players={players} socketId={socketId} isHost={isHost}
          ready={ready} replay={replay} deadline={deadline}
          onReady={() => socket.emit('medjinx_ready')}
          onReplay={(on) => socket.emit('medjinx_replay', { on })}
        />
      ) : round ? (
        <div className="mjx-stage">
          <Feed feed={feed} hidden={feedHidden} onToggle={() => setFeedHidden(h => !h)} />
          <div className="mjx-centre">
            <RoundPanel
              round={round} phase={phase} deadline={deadline}
              onSubmit={submit} acceptedCount={myAccepted} lastNote={note}
            />
            <PlayerGrid players={players} counts={counts} socketId={socketId} />
          </div>
          <Rarity tiers={round.tiers} />
        </div>
      ) : (
        <div className="mjx-stage mjx-stage--wait">
          <section className="mjx-panel mjx-waiting">
            <h1 className="mjx-title">Setting up the round…</h1>
          </section>
        </div>
      )}
    </div>
  );
}
