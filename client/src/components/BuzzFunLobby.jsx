import { useMemo, useState } from 'react';
import './BuzzFunLobby.css';

/**
 * Buzz Fun's own match settings, in the hive theme — in place of the generic
 * "Match settings" sheet.
 *
 * First the bank — Vanilla (the original Buzz Fun decks) or UWorld (one card
 * per UWorld Adventure question, cut down to the concept it teaches) — then
 * three steps, top to bottom, the way a host thinks about it:
 *   1. Systems  — big tiles with card and topic counts.
 *   2. Cards    — Mixed (30 random) or Focus topics (pick and order them).
 *   3. Your run — the chosen topics as a queue: reorder, remove, totals.
 *
 * It writes the same match options as before (duelOptions.subjects and
 * duelOptions.topics, "subject::Topic" keys in play order), so the server
 * side is unchanged. Players who are not the host see the same layout,
 * read-only.
 */

const ICON = { biochemistry: '🧬', immunology: '🛡️', endocrinology: '🦋', pulmonology: '🫁', nephrology: '🫘', cardiology: '❤️', reproductive: '🤰' };
const SECONDS_PER_CARD = 28;            // 20 s to answer + time on the explanation
const MIXED_CARDS = 30;
const FOCUS_CARDS = 60;
// The card-count choices. null = the default (30 mixed, up to 60 in focus);
// 0 = every card available. The server clamps a custom number to 5–300.
const CARD_CHOICES = [10, 20, 30, 50, 100];

export default function BuzzFunLobby({ isHost, options, onChange, subjects: vanillaSubjects, uworldSubjects }) {
  const bank = options?.buzzBank === 'uworld' ? 'uworld' : 'vanilla';
  const subjects = bank === 'uworld' ? uworldSubjects : vanillaSubjects;
  const chosenSubjects = Array.isArray(options?.subjects) ? options.subjects : [];
  const topics = Array.isArray(options?.topics) ? options.topics : [];
  const [focusOpen, setFocusOpen] = useState(topics.length > 0);
  const [query, setQuery] = useState('');
  const focus = focusOpen || topics.length > 0;
  const list = subjects || [];

  const inPlay = list.filter(s => !chosenSubjects.length || chosenSubjects.includes(s.id));
  const topicInfo = useMemo(() => {
    const m = new Map();
    for (const s of list) for (const t of (s.topics || [])) m.set(t.key, { ...t, subject: s.id, subjectName: s.name });
    return m;
  }, [list]);

  const runCards = topics.reduce((n, k) => n + (topicInfo.get(k)?.count || 0), 0);
  const poolCards = inPlay.reduce((n, s) => n + (s.count || 0), 0);
  // How many cards the host asked for (null = default, 0 = all).
  const cardsOpt = options?.buzzCards == null ? null : Number(options.buzzCards);
  const focusing = focus && topics.length > 0;
  const available = focusing ? runCards : poolCards;
  const wanted = cardsOpt === 0 ? available : (cardsOpt || (focusing ? FOCUS_CARDS : MIXED_CARDS));
  const cards = available ? Math.min(wanted, available) : wanted;
  const minutes = Math.max(1, Math.round((cards * SECONDS_PER_CARD) / 60));
  const [customCards, setCustomCards] = useState('');
  const pickCards = (n) => { setCustomCards(''); set({ buzzCards: n }); };
  const applyCustom = (raw) => {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) set({ buzzCards: Math.max(5, Math.min(300, n)) });
  };

  const set = (patch) => onChange?.({ ...options, ...patch });

  const toggleSubject = (id) => {
    const next = chosenSubjects.includes(id) ? chosenSubjects.filter(x => x !== id) : [...chosenSubjects, id];
    // A topic from a system no longer in play would have nothing to deal.
    set({ subjects: next, topics: topics.filter(k => !next.length || next.includes(k.split('::')[0])) });
  };
  const toggleTopic = (key) => set({ topics: topics.includes(key) ? topics.filter(k => k !== key) : [...topics, key] });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= topics.length) return;
    const next = topics.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set({ topics: next });
  };
  const goMixed = () => { setFocusOpen(false); set({ topics: [] }); };
  // Switching bank starts the run over: the other bank has different systems.
  const pickBank = (next) => {
    if (next === bank) return;
    setFocusOpen(false);
    set({ buzzBank: next, subjects: [], topics: [] });
  };
  const uworldCount = (uworldSubjects || []).reduce((n, s) => n + (s.count || 0), 0);

  const q = query.trim().toLowerCase();

  return (
    <div className="lobby-duel-section bfl">
      {/* ── Summary ───────────────────────────────────────────────────── */}
      <header className="bfl-head">
        <span className="bfl-bee" aria-hidden="true">🐝</span>
        <div className="bfl-head-text">
          <h3>{isHost ? 'Build your run' : 'The host’s run'}</h3>
          <p>
            {focus && topics.length
              ? `${topics.length} topic${topics.length === 1 ? '' : 's'}, played in order`
              : `Mixed — ${cards} random cards`}
            {' · '}
            {chosenSubjects.length ? inPlay.map(s => s.name).join(' + ') : 'every system'}
            {bank === 'uworld' ? ' · UWorld cards' : ''}
          </p>
        </div>
        <div className="bfl-stats">
          <span><b>{cards}</b> cards</span>
          <span>≈ <b>{minutes}</b> min</span>
        </div>
      </header>

      {/* ── Which Buzz Fun ───────────────────────────────────────────── */}
      <section className="bfl-step">
        <h4>Which Buzz Fun?</h4>
        <div className="bfl-modes bfl-banks">
          <button type="button" className={`bfl-mode${bank === 'vanilla' ? ' is-on' : ''}`} aria-pressed={bank === 'vanilla'} onClick={() => isHost && pickBank('vanilla')} disabled={!isHost}>
            <span className="bfl-mode-icon" aria-hidden="true">🍯</span>
            <span className="bfl-mode-name">Vanilla</span>
            <span className="bfl-mode-sub">The original Buzz Fun decks — buzzwords, triads and mechanisms</span>
          </button>
          <button type="button" className={`bfl-mode${bank === 'uworld' ? ' is-on' : ''}`} aria-pressed={bank === 'uworld'} onClick={() => isHost && pickBank('uworld')} disabled={!isHost}>
            <span className="bfl-mode-icon" aria-hidden="true">📘</span>
            <span className="bfl-mode-name">UWorld</span>
            <span className="bfl-mode-sub">
              UWorld Adventure questions cut down to the one concept each teaches
              {uworldCount ? ` — ${uworldCount} cards` : ''}
            </span>
          </button>
        </div>
      </section>

      {/* ── 1. Systems ────────────────────────────────────────────────── */}
      <section className="bfl-step">
        <h4><span className="bfl-num">1</span> Systems</h4>
        <div className="bfl-systems">
          <button
            type="button"
            className={`bfl-sys${!chosenSubjects.length ? ' is-on' : ''}`}
            onClick={() => isHost && set({ subjects: [] })}
            disabled={!isHost}
          >
            <span className="bfl-sys-icon" aria-hidden="true">🍯</span>
            <span className="bfl-sys-name">Everything</span>
            <span className="bfl-sys-meta">{list.reduce((n, s) => n + (s.count || 0), 0)} cards</span>
          </button>
          {list.map(s => {
            const on = chosenSubjects.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={`bfl-sys${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => isHost && toggleSubject(s.id)}
                disabled={!isHost}
              >
                <span className="bfl-sys-icon" aria-hidden="true">{ICON[s.id] || '📚'}</span>
                <span className="bfl-sys-name">{s.name}</span>
                <span className="bfl-sys-meta">{s.count} cards · {(s.topics || []).length} topics</span>
                {on && <span className="bfl-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
          {!subjects && <span className="bfl-loading">Loading systems…</span>}
        </div>
      </section>

      {/* ── How many cards ─────────────────────────────────────────── */}
      <section className="bfl-step">
        <h4>How many cards?</h4>
        <div className="bfl-chips bfl-count" role="group" aria-label="Number of cards">
          <button
            type="button"
            className={`bfl-chip${cardsOpt == null ? ' is-on' : ''}`}
            aria-pressed={cardsOpt == null}
            onClick={() => isHost && pickCards(null)}
            disabled={!isHost}
          >
            Default <span className="bfl-chip-n">{focusing ? `up to ${FOCUS_CARDS}` : MIXED_CARDS}</span>
          </button>
          {CARD_CHOICES.map(n => (
            <button
              key={n}
              type="button"
              className={`bfl-chip${cardsOpt === n ? ' is-on' : ''}`}
              aria-pressed={cardsOpt === n}
              onClick={() => isHost && pickCards(n)}
              disabled={!isHost}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={`bfl-chip${cardsOpt === 0 ? ' is-on' : ''}`}
            aria-pressed={cardsOpt === 0}
            onClick={() => isHost && pickCards(0)}
            disabled={!isHost}
          >
            All <span className="bfl-chip-n">{available || '…'}</span>
          </button>
          {isHost && (
            <input
              className="bfl-count-input"
              type="number"
              min="5"
              max="300"
              inputMode="numeric"
              placeholder="Custom"
              aria-label="Custom number of cards"
              value={customCards || (cardsOpt && !CARD_CHOICES.includes(cardsOpt) ? String(cardsOpt) : '')}
              onChange={e => setCustomCards(e.target.value)}
              onBlur={e => applyCustom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyCustom(e.currentTarget.value); }}
            />
          )}
        </div>
        {available > 0 && wanted > available && (
          <p className="bfl-note">Only {available} cards match these settings, so the run will be {available}.</p>
        )}
      </section>

      {/* ── 2. Which cards ────────────────────────────────────────────── */}
      <section className="bfl-step">
        <h4><span className="bfl-num">2</span> Cards</h4>
        <div className="bfl-modes">
          <button type="button" className={`bfl-mode${!focus ? ' is-on' : ''}`} onClick={() => isHost && goMixed()} disabled={!isHost}>
            <span className="bfl-mode-icon" aria-hidden="true">🎲</span>
            <span className="bfl-mode-name">Mixed</span>
            <span className="bfl-mode-sub">{focusing ? 'Random' : cards} cards from {poolCards || '…'}</span>
          </button>
          <button type="button" className={`bfl-mode${focus ? ' is-on' : ''}`} onClick={() => isHost && setFocusOpen(true)} disabled={!isHost}>
            <span className="bfl-mode-icon" aria-hidden="true">🎯</span>
            <span className="bfl-mode-name">Focus topics</span>
            <span className="bfl-mode-sub">Pick topics, play them in order</span>
          </button>
        </div>

        {focus && isHost && (
          <div className="bfl-picker">
            <input
              className="bfl-search"
              type="search"
              placeholder="Search topics — e.g. vitamins, thyroid, HLA"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {inPlay.map(s => {
              const ts = (s.topics || []).filter(t => !q || t.topic.toLowerCase().includes(q));
              if (!ts.length) return null;
              return (
                <div key={s.id} className="bfl-group">
                  <div className="bfl-group-head">{ICON[s.id] || '📚'} {s.name}</div>
                  <div className="bfl-chips">
                    {ts.map(t => {
                      const pos = topics.indexOf(t.key);
                      return (
                        <button
                          key={t.key}
                          type="button"
                          className={`bfl-chip${pos >= 0 ? ' is-on' : ''}`}
                          aria-pressed={pos >= 0}
                          onClick={() => toggleTopic(t.key)}
                        >
                          {pos >= 0 ? <span className="bfl-chip-pos">{pos + 1}</span> : <span className="bfl-chip-add">+</span>}
                          {t.topic}
                          <span className="bfl-chip-n">{t.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. The run, in order ──────────────────────────────────────── */}
      {focus && (
        <section className="bfl-step bfl-run">
          <h4>
            <span className="bfl-num">3</span> Your run
            {isHost && topics.length > 0 && <button type="button" className="bfl-clear" onClick={() => set({ topics: [] })}>Clear</button>}
          </h4>
          {topics.length === 0 ? (
            <p className="bfl-empty">Tap topics above — they will be played in the order you pick them, with a heads-up before each one.</p>
          ) : (
            <ol className="bfl-queue">
              {topics.map((k, i) => {
                const t = topicInfo.get(k) || { topic: k.split('::')[1], count: 0, subjectName: '' };
                return (
                  <li key={k} className="bfl-q" style={{ '--i': i }}>
                    <span className="bfl-q-num">{i + 1}</span>
                    <span className="bfl-q-main">
                      <span className="bfl-q-topic">{t.topic}</span>
                      <span className="bfl-q-meta">{t.subjectName} · {t.count} cards</span>
                    </span>
                    {isHost && (
                      <span className="bfl-q-ctrls">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${t.topic} up`}>▲</button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === topics.length - 1} aria-label={`Move ${t.topic} down`}>▼</button>
                        <button type="button" className="bfl-q-x" onClick={() => toggleTopic(k)} aria-label={`Remove ${t.topic}`}>✕</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          {runCards > cards && <p className="bfl-note">That is {runCards} cards — the run is set to {cards}, trimmed evenly across your topics.</p>}
        </section>
      )}
    </div>
  );
}
