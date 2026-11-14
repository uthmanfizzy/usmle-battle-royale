import { useEffect, useMemo, useState } from 'react';
import './MedJinxAdmin.css';

import { SERVER_URL } from '../../serverUrl';
const AUTH_KEY = 'usmle_admin_session';

function apiCall(path, options = {}) {
  return fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': localStorage.getItem(AUTH_KEY) || '',
      ...(options.headers || {}),
    },
  });
}

const TIER_NAMES = { 1: 'Common', 2: 'Recognised', 3: 'Specific', 4: 'Advanced', 5: 'Rare' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const ago = (ms) => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

/**
 * Admin → MedJinx. A read-only window on the MedJinx bank (which lives in
 * code, server/medjinx/bank): every topic that can come up, what answers it
 * accepts and how they are worded, its traps, its vignette, plus a tester
 * that marks a typed answer exactly as a match would, the answers players
 * typed that nothing matched, and the rooms running now.
 */
export default function MedJinxAdmin() {
  const [view, setView] = useState('topics');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    apiCall('/admin/medjinx/bank')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch(e => setError(`Could not load the MedJinx bank (${e.message}).`));
  }
  useEffect(load, []);

  return (
    <div className="mja">
      <div className="mja-head">
        <h2>🧪 MedJinx</h2>
        <nav className="mja-tabs" role="tablist">
          {[
            ['overview', 'Overview'],
            ['topics', `Topics${data ? ` (${data.topics.length})` : ''}`],
            ['unmatched', 'Unmatched answers'],
            ['rooms', `Live rooms${data ? ` (${data.rooms.length})` : ''}`],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={`mja-tab${view === id ? ' is-on' : ''}`}
              onClick={() => setView(id)}
            >{label}</button>
          ))}
        </nav>
        <button type="button" className="ap-btn-sec ap-btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {error && <p className="mja-error">{error}</p>}
      {!data && !error && <p className="mja-dim">Loading…</p>}

      {data && view === 'overview' && <Overview data={data} />}
      {data && view === 'topics' && <Topics data={data} />}
      {view === 'unmatched' && <Unmatched topics={data?.topics || []} />}
      {data && view === 'rooms' && <Rooms rooms={data.rooms} />}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function Overview({ data }) {
  const { topics, catalog, problems, topScores } = data;
  const answers = topics.reduce((n, t) => n + t.answers.length, 0);
  const synonyms = topics.reduce((n, t) => n + t.answers.reduce((m, a) => m + a.syn.length, 0), 0);
  const traps = topics.reduce((n, t) => n + (t.traps || []).length, 0);
  const byTier = [1, 2, 3, 4, 5].map(tier => topics.reduce((n, t) => n + t.answers.filter(a => a.tier === tier).length, 0));
  const ch = catalog.choices || {};

  return (
    <div className="mja-overview">
      <div className="mja-stats">
        <Stat n={topics.length} label="topics" />
        <Stat n={answers} label="accepted answers" />
        <Stat n={synonyms} label="extra wordings" />
        <Stat n={traps} label="trap groups" />
        <Stat n={problems.length} label={problems.length === 1 ? 'bank problem' : 'bank problems'} bad={problems.length > 0} />
      </div>

      <div className="mja-grid">
        <section className="ap-card mja-card">
          <h3>Topics by system</h3>
          <table className="ap-table">
            <tbody>
              {catalog.systems.map(s => <tr key={s.name}><td>{s.name}</td><td className="mja-num">{s.count}</td></tr>)}
            </tbody>
          </table>
          <h3>By difficulty</h3>
          <table className="ap-table">
            <tbody>
              {Object.entries(catalog.difficulties).map(([d, n]) => <tr key={d}><td className="mja-cap">{d}</td><td className="mja-num">{n}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section className="ap-card mja-card">
          <h3>Rarity tiers</h3>
          <table className="ap-table">
            <thead><tr><th>Tier</th><th>Points</th><th>Answers</th></tr></thead>
            <tbody>
              {catalog.tiers.map(t => (
                <tr key={t.tier}>
                  <td><span className={`mja-tier mja-tier--${t.tier}`}>{t.name}</span></td>
                  <td className="mja-num">{fmt(t.points)}</td>
                  <td className="mja-num">{byTier[t.tier - 1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mja-dim">An answer&apos;s points are split between everyone who gave it.</p>
        </section>

        <section className="ap-card mja-card">
          <h3>Match settings</h3>
          <dl className="mja-dl">
            <dt>Round clock</dt><dd>{(ch.seconds || []).join(', ')} seconds (Rapid Recall: 15)</dd>
            <dt>Rounds per match</dt><dd>{(ch.rounds || []).join(' / ')}</dd>
            <dt>Round types</dt><dd>{(ch.variants || []).join(' / ')}</dd>
            <dt>Difficulty</dt><dd>{(ch.difficulties || []).join(' / ')}</dd>
          </dl>
          <h3>Special rounds</h3>
          <ul className="mja-events">
            {catalog.events.map(e => <li key={e.id}><b>{e.name}</b> — {e.blurb}</li>)}
          </ul>
        </section>

        <section className="ap-card mja-card">
          <h3>Top scores since restart</h3>
          {topScores.length ? (
            <ol className="mja-scores">
              {topScores.map((s, i) => <li key={i}><span>{s.username}</span><b>{fmt(s.score)}</b></li>)}
            </ol>
          ) : <p className="mja-dim">No matches finished since the server last started.</p>}
        </section>
      </div>

      <section className="ap-card mja-card">
        <h3>Bank check</h3>
        {problems.length ? (
          <ul className="mja-problems">{problems.map(p => <li key={p}>{p}</li>)}</ul>
        ) : <p className="mja-ok">✓ No collisions: every wording points at exactly one answer or trap.</p>}
        <p className="mja-dim">
          The bank is code (server/medjinx/bank). To add or change a topic, edit it there and
          run <code>node server/medjinx/check.js</code>.
        </p>
      </section>
    </div>
  );
}

function Stat({ n, label, bad }) {
  return (
    <div className={`ap-card mja-stat${bad ? ' is-bad' : ''}`}>
      <b>{fmt(n)}</b>
      <span>{label}</span>
    </div>
  );
}

// ── Topics ───────────────────────────────────────────────────────────────────

function Topics({ data }) {
  const { topics, catalog, categories } = data;
  const [q, setQ] = useState('');
  const [system, setSystem] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selected, setSelected] = useState(topics[0]?.id || null);

  // The search looks inside answers, synonyms and traps too, so "which topic
  // accepts X?" is one search.
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return topics.filter((t) => {
      if (system && t.system !== system) return false;
      if (difficulty && t.difficulty !== difficulty) return false;
      if (!needle) return true;
      const hay = [
        t.title, t.id, ...(t.dx || []),
        ...t.answers.flatMap(a => [a.label, ...a.syn]),
        ...(t.traps || []).flatMap(tr => tr.terms),
      ].join('\n').toLowerCase();
      return hay.includes(needle);
    });
  }, [topics, q, system, difficulty]);

  const topic = topics.find(t => t.id === selected) || list[0] || null;

  return (
    <div className="mja-topics">
      <aside className="mja-side">
        <input
          className="ap-input-plain"
          placeholder="Search topics, answers, synonyms, traps…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="mja-filters">
          <select className="ap-input-plain" value={system} onChange={e => setSystem(e.target.value)}>
            <option value="">All systems</option>
            {catalog.systems.map(s => <option key={s.name} value={s.name}>{s.name} ({s.count})</option>)}
          </select>
          <select className="ap-input-plain" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">All difficulties</option>
            {Object.keys(catalog.difficulties).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <p className="mja-dim">{list.length} of {topics.length} topics</p>
        <ul className="mja-list">
          {list.map(t => (
            <li key={t.id}>
              <button
                type="button"
                className={`mja-item${topic?.id === t.id ? ' is-on' : ''}`}
                onClick={() => setSelected(t.id)}
              >
                <b>{t.title}</b>
                <small>{t.system} · <span className="mja-cap">{t.difficulty}</span> · {t.answers.length} answers</small>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="mja-detail">
        {topic ? <TopicDetail key={topic.id} topic={topic} categories={categories} search={q} /> : <p className="mja-dim">No topic matches.</p>}
      </section>
    </div>
  );
}

function TopicDetail({ topic, categories, search }) {
  const [cat, setCat] = useState('');
  const needle = search.trim().toLowerCase();
  const hit = (s) => needle && s.toLowerCase().includes(needle);
  const usedCats = [...new Set(topic.answers.map(a => a.category))];
  const answers = topic.answers.filter(a => !cat || a.category === cat);
  const synCount = topic.answers.reduce((n, a) => n + a.syn.length, 0);

  return (
    <div className="mja-topic">
      <header className="ap-card mja-card">
        <div className="mja-title-row">
          <h3 className="mja-title">{topic.title}</h3>
          <code className="mja-id">{topic.id}</code>
        </div>
        <p className="mja-meta">
          {topic.system} · {topic.subject} · <span className="mja-cap">{topic.difficulty}</span>
          {' · '}{topic.answers.length} answers ({synCount} extra wordings) · {(topic.traps || []).length} trap groups
        </p>
        <p>{topic.description}</p>
        <div className="mja-shows">
          <div>
            <h4>Open round</h4>
            <p className="mja-dim">The players see the name <b>{topic.title}</b> and list what goes with it. Typing the topic&apos;s own name is turned down.</p>
          </div>
          <div>
            <h4>Clinical round {topic.vignetteType && <small>· {topic.vignetteType}</small>}</h4>
            <blockquote className="mja-vignette">{topic.vignette}</blockquote>
            <p className="mja-dim">
              Naming the diagnosis scores as <span className={`mja-tier mja-tier--${topic.dxTier || 2}`}>{TIER_NAMES[topic.dxTier || 2]}</span>.
              Accepted names: {[topic.title, ...(topic.dx || [])].map(d => <span key={d} className="mja-chip">{d}</span>)}
            </p>
          </div>
        </div>
      </header>

      <Tester topicId={topic.id} />

      <section className="ap-card mja-card">
        <div className="mja-sec-head">
          <h3>Accepted answers</h3>
          <select className="ap-input-plain mja-cat" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Every category</option>
            {usedCats.map(c => <option key={c} value={c}>{categories[c] || c}</option>)}
          </select>
        </div>
        {[5, 4, 3, 2, 1].map((tier) => {
          const rows = answers.filter(a => a.tier === tier);
          if (!rows.length) return null;
          return (
            <div key={tier} className="mja-tier-group">
              <h4><span className={`mja-tier mja-tier--${tier}`}>{TIER_NAMES[tier]}</span> <small>{rows.length}</small></h4>
              <table className="ap-table mja-answers">
                <thead><tr><th>Answer</th><th>Also accepted as</th><th>Category</th><th>Why</th></tr></thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a.label} className={hit(a.label) || a.syn.some(hit) ? 'is-hit' : ''}>
                      <td><b>{a.label}</b></td>
                      <td>{a.syn.length ? a.syn.map(s => <span key={s} className={`mja-chip${hit(s) ? ' is-hit' : ''}`}>{s}</span>) : <span className="mja-dim">—</span>}</td>
                      <td className="mja-nowrap">{categories[a.category] || a.category}</td>
                      <td className="mja-why">{a.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <p className="mja-dim">
          Besides these wordings the matcher folds case, hyphens, plurals, British spellings,
          raised/elevated/high, reduced/decreased/low and &ldquo;anti-X&rdquo; forms, and forgives small typos.
          Use the tester above to check a particular wording.
        </p>
      </section>

      <section className="ap-card mja-card">
        <h3>Traps <small className="mja-dim">— known-wrong answers, explained at the reveal, worth 0</small></h3>
        {(topic.traps || []).length ? (
          <table className="ap-table">
            <thead><tr><th>Typed as</th><th>Why it is wrong</th></tr></thead>
            <tbody>
              {topic.traps.map((tr, i) => (
                <tr key={i}>
                  <td>{tr.terms.map(t => <span key={t} className={`mja-chip mja-chip--trap${hit(t) ? ' is-hit' : ''}`}>{t}</span>)}</td>
                  <td className="mja-why">{tr.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="mja-dim">No traps on this topic.</p>}
      </section>

      <section className="ap-card mja-card">
        <h3>Teaching points</h3>
        <ul className="mja-takeaways">{(topic.takeaways || []).map(t => <li key={t}>{t}</li>)}</ul>
        {topic.source && <p className="mja-dim">Source: {topic.source}</p>}
      </section>
    </div>
  );
}

function Tester({ topicId }) {
  const [text, setText] = useState('');
  const [variant, setVariant] = useState('open');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function run(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    apiCall('/admin/medjinx/test', { method: 'POST', body: JSON.stringify({ topicId, variant, text }) })
      .then(r => r.json())
      .then(r => setResult({ ...r, text }))
      .catch(() => setResult({ status: 'error', text }))
      .finally(() => setBusy(false));
  }

  return (
    <section className="ap-card mja-card mja-tester">
      <h3>Try an answer</h3>
      <form onSubmit={run} className="mja-tester-row">
        <input
          className="ap-input-plain"
          placeholder="Type an answer the way a player would"
          value={text}
          maxLength={80}
          onChange={e => setText(e.target.value)}
        />
        <select className="ap-input-plain" value={variant} onChange={e => setVariant(e.target.value)}>
          <option value="open">Open round</option>
          <option value="clinical">Clinical round</option>
        </select>
        <button type="submit" className="ap-btn-pri" disabled={busy || !text.trim()}>Check</button>
      </form>
      {result && (
        <div className={`mja-result mja-result--${result.status}`}>
          {result.status === 'accepted' && (
            <>✓ <b>&ldquo;{result.text}&rdquo;</b> is accepted as <b>{result.answer.label}</b>{' '}
              <span className={`mja-tier mja-tier--${result.answer.tier}`}>{TIER_NAMES[result.answer.tier]}</span></>
          )}
          {result.status === 'trap' && (
            <>✗ <b>&ldquo;{result.text}&rdquo;</b> is a {result.self ? 'self-trap (the topic itself)' : 'trap'}: {result.why}</>
          )}
          {result.status === 'unknown' && <>? <b>&ldquo;{result.text}&rdquo;</b> matches nothing. A player would score 0 and it would land in Unmatched answers.</>}
          {result.status === 'empty' && <>That reduces to nothing once filler words are removed.</>}
          {result.status === 'error' && <>Could not check that.</>}
          {result.normalised && <small> Read as: <code>{result.normalised}</code></small>}
        </div>
      )}
    </section>
  );
}

// ── Unmatched answers ────────────────────────────────────────────────────────

function Unmatched({ topics }) {
  const [items, setItems] = useState(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  function load() {
    setError('');
    apiCall('/admin/medjinx/review')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => setItems(d.items || []))
      .catch(e => setError(`Could not load unmatched answers (${e.message}).`));
  }
  useEffect(load, []);

  const rows = (items || []).filter(i => !topic || i.topicId === topic);
  const seen = [...new Set((items || []).map(i => i.topicId))];

  return (
    <section className="ap-card mja-card">
      <div className="mja-sec-head">
        <h3>Answers nothing matched</h3>
        <select className="ap-input-plain mja-cat" value={topic} onChange={e => setTopic(e.target.value)}>
          <option value="">Every topic</option>
          {seen.map(id => <option key={id} value={id}>{topics.find(t => t.id === id)?.title || id}</option>)}
        </select>
        <button type="button" className="ap-btn-sec ap-btn-sm" onClick={load}>↻</button>
      </div>
      <p className="mja-dim">
        Each one is either a right answer the bank is missing (add it as an answer or synonym) or a
        wrong one worth adding as a trap. Kept in memory since the server last restarted.
      </p>
      {error && <p className="mja-error">{error}</p>}
      {items && !rows.length && <p className="mja-dim">Nothing yet.</p>}
      {rows.length > 0 && (
        <table className="ap-table">
          <thead><tr><th>Typed</th><th>Topic</th><th className="mja-num">Times</th><th>Last</th></tr></thead>
          <tbody>
            {rows.map(i => (
              <tr key={`${i.topicId}|${i.norm}`}>
                <td><b>{i.text}</b></td>
                <td>{i.topic}</td>
                <td className="mja-num">{i.count}</td>
                <td className="mja-nowrap">{ago(i.last)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ── Live rooms ───────────────────────────────────────────────────────────────

function Rooms({ rooms }) {
  if (!rooms.length) return <section className="ap-card mja-card"><p className="mja-dim">No MedJinx rooms are open right now.</p></section>;
  return (
    <div className="mja-rooms">
      {rooms.map(r => (
        <section key={r.id} className="ap-card mja-card">
          <h3>Room <code>{r.id}</code> <small className="mja-dim">{r.status === 'medjinx' ? `round ${r.round} of ${r.total} · ${r.phase}` : r.status}</small></h3>
          {r.topic && <p>Current topic: <b>{r.topic}</b></p>}
          <ul className="mja-scores">
            {[...r.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <li key={i}><span>{p.username}{p.isBot ? ' 🤖' : ''}</span><b>{fmt(p.score)}</b></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
