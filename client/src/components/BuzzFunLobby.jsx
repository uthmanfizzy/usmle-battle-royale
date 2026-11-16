import { useMemo, useState } from 'react';
import './BuzzFunLobby.css';

/**
 * Buzz Fun's own match settings, in the hive theme — in place of the generic
 * "Match settings" sheet.
 *
 * Three steps, top to bottom, the way a host thinks about it:
 *   1. Systems  — big tiles with card and topic counts.
 *   2. Cards    — Mixed (30 random) or Focus topics (pick and order them).
 *   3. Your run — the chosen topics as a queue: reorder, remove, totals.
 *
 * It writes the same match options as before (duelOptions.subjects and
 * duelOptions.topics, "subject::Topic" keys in play order), so the server
 * side is unchanged. Players who are not the host see the same layout,
 * read-only.
 */

const ICON = { biochemistry: '🧬', immunology: '🛡️', endocrinology: '🦋' };
const SECONDS_PER_CARD = 23;            // 15 s to answer + time on the explanation
const MIXED_CARDS = 30;

export default function BuzzFunLobby({ isHost, options, onChange, subjects }) {
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
  const cards = focus && topics.length ? Math.min(60, runCards) : MIXED_CARDS;
  const minutes = Math.max(1, Math.round((cards * SECONDS_PER_CARD) / 60));
  const poolCards = inPlay.reduce((n, s) => n + (s.count || 0), 0);

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
              : `Mixed — ${MIXED_CARDS} random cards`}
            {' · '}
            {chosenSubjects.length ? inPlay.map(s => s.name).join(' + ') : 'every system'}
          </p>
        </div>
        <div className="bfl-stats">
          <span><b>{cards}</b> cards</span>
          <span>≈ <b>{minutes}</b> min</span>
        </div>
      </header>

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

      {/* ── 2. Which cards ────────────────────────────────────────────── */}
      <section className="bfl-step">
        <h4><span className="bfl-num">2</span> Cards</h4>
        <div className="bfl-modes">
          <button type="button" className={`bfl-mode${!focus ? ' is-on' : ''}`} onClick={() => isHost && goMixed()} disabled={!isHost}>
            <span className="bfl-mode-icon" aria-hidden="true">🎲</span>
            <span className="bfl-mode-name">Mixed</span>
            <span className="bfl-mode-sub">{MIXED_CARDS} random cards from {poolCards || '…'}</span>
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
          {runCards > 60 && <p className="bfl-note">That is {runCards} cards — the run is capped at 60, trimmed evenly across your topics.</p>}
        </section>
      )}
    </div>
  );
}
