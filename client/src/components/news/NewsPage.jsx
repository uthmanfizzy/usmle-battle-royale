import { useCallback, useEffect, useMemo, useState } from 'react';
import { SERVER_URL } from '../../serverUrl';
import PageBackButton from '../PageBackButton';
import './NewsPage.css';

/**
 * The dashboard's News page (announcements).
 *
 * Announcements are admin-authored rows: title, message, category (Update /
 * News / Event / Maintenance), pinned, urgent, created_at. They carry no
 * image, so each category gets drawn art of its own instead of a placeholder.
 *
 * Layout: urgent notices as an alert strip, a featured story (the pinned one,
 * else the newest), then everything else on a timeline grouped by month, with
 * category filters and search over it. Posts the reader had not seen before
 * this visit wear a "New" badge; opening the page still marks everything read,
 * which is what clears the dashboard's unread dot.
 */

const READ_KEY = 'mrb_read_announcements'; // shared with Dashboard + NotificationsDropdown

const CATS = {
  Update:      { label: 'Updates',     one: 'Update',      icon: '✨', tone: 'teal' },
  News:        { label: 'News',        one: 'News',        icon: '📰', tone: 'gold' },
  Event:       { label: 'Events',      one: 'Event',       icon: '🎉', tone: 'red' },
  Maintenance: { label: 'Maintenance', one: 'Maintenance', icon: '🛠️', tone: 'slate' },
};
const CAT_ORDER = ['Update', 'News', 'Event', 'Maintenance'];
const catOf = (a) => CATS[a.category] || CATS.News;

function readIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveIds(ids) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids])); } catch { /* private mode */ }
}

const DAY = 86400000;
function relDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}
function updatedLabel(iso) {
  const r = relDate(iso);
  return /^(Today|Yesterday)$|ago$/.test(r) ? r.toLowerCase() : `on ${r}`;
}
const fullDate =(iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const monthKey = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const readMins = (text) => Math.max(1, Math.round(String(text || '').split(/\s+/).length / 200));

// Links in an admin's message become real links; everything else stays text
// (React escapes it, so nothing in a message can inject markup).
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
function Rich({ text }) {
  const parts = String(text || '').split(URL_RE);
  return parts.map((part, i) => (i % 2 === 1
    ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\//, '')}</a>
    : part));
}

function CatArt({ cat, size = 'lg' }) {
  return (
    <div className={`nws-art nws-art--${size} nws-tone-${cat.tone}`} aria-hidden="true">
      <span className="nws-art-ring nws-art-ring--1" />
      <span className="nws-art-ring nws-art-ring--2" />
      <span className="nws-art-icon">{cat.icon}</span>
    </div>
  );
}

function Tag({ a }) {
  const cat = catOf(a);
  return <span className={`nws-tag nws-tone-${cat.tone}`}>{cat.one}</span>;
}

function Meta({ a, isNew }) {
  return (
    <div className="nws-meta">
      <Tag a={a} />
      {a.pinned && <span className="nws-pin">📌 Pinned</span>}
      {isNew && <span className="nws-new">New</span>}
      <time dateTime={a.created_at} title={fullDate(a.created_at)}>{relDate(a.created_at)}</time>
    </div>
  );
}

function Featured({ a, isNew }) {
  const cat = catOf(a);
  return (
    <article className={`nws-featured nws-tone-${cat.tone}`} id={`news-${a.id}`}>
      <CatArt cat={cat} />
      <div className="nws-featured-body">
        <span className="nws-kicker">{a.pinned ? 'Pinned story' : 'Latest'}</span>
        <Meta a={a} isNew={isNew} />
        <h2 className="nws-featured-title">{a.title}</h2>
        <p className="nws-featured-msg"><Rich text={a.message} /></p>
        <span className="nws-foot-meta">{fullDate(a.created_at)} · {readMins(a.message)} min read</span>
      </div>
    </article>
  );
}

function Story({ a, isNew, index }) {
  const cat = catOf(a);
  const msg = String(a.message || '');
  const long = msg.length > 260 || msg.split('\n').length > 4;
  const [open, setOpen] = useState(false);
  return (
    <article className={`nws-story${a.urgent ? ' nws-story--urgent' : ''}`} id={`news-${a.id}`} style={{ '--i': Math.min(index, 12) }}>
      <span className={`nws-dot nws-tone-${cat.tone}`} aria-hidden="true" />
      <CatArt cat={cat} size="sm" />
      <div className="nws-story-body">
        <Meta a={a} isNew={isNew} />
        <h3 className="nws-story-title">{a.title}</h3>
        <p className={`nws-story-msg${long && !open ? ' nws-clamp' : ''}`}><Rich text={msg} /></p>
        {long && (
          <button type="button" className="nws-more" onClick={() => setOpen(o => !o)} aria-expanded={open}>
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="nws-skel" aria-hidden="true">
      <div className="nws-skel-feature" />
      <div className="nws-skel-row" /><div className="nws-skel-row" /><div className="nws-skel-row" />
    </div>
  );
}

export default function NewsPage({ onBack }) {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [unseen, setUnseen] = useState(() => new Set());
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setFailed(false);
    fetch(`${SERVER_URL}/api/announcements`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        const list = (d.announcements || []).filter(a => a && a.id != null);
        const seen = readIds();
        setUnseen(new Set(list.filter(a => !seen.has(String(a.id))).map(a => String(a.id))));
        list.forEach(a => seen.add(String(a.id)));
        saveIds(seen);
        setItems(list);
      })
      .catch(() => { setFailed(true); setItems(prev => prev || []); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const all = items || [];
  const counts = useMemo(() => {
    const c = {};
    for (const a of all) c[a.category] = (c[a.category] || 0) + 1;
    return c;
  }, [all]);

  const q = query.trim().toLowerCase();
  const browsing = filter === 'all' && !q;
  const urgent = all.filter(a => a.urgent);
  const featured = browsing ? (all.find(a => a.pinned) || all[0]) : null;

  const shown = all.filter(a => a !== featured
    && (filter === 'all' || a.category === filter)
    && (!q || `${a.title} ${a.message}`.toLowerCase().includes(q)));

  const groups = useMemo(() => {
    const out = [];
    for (const a of [...shown].sort((x, y) => new Date(y.created_at) - new Date(x.created_at))) {
      const key = monthKey(a.created_at);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(a);
      else out.push({ key, items: [a] });
    }
    return out;
  }, [shown]);

  const newest = all.reduce((m, a) => (new Date(a.created_at) > m ? new Date(a.created_at) : m), new Date(0));
  const jumpTo = (id) => document.getElementById(`news-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let runIndex = 0;

  return (
    <div className="nws">
      <PageBackButton onBack={onBack} />

      <header className="nws-hero">
        <span className="nws-hero-kicker">Dispatches from Medvale</span>
        <h1 className="nws-title">News &amp; Updates</h1>
        <p className="nws-sub">
          {items === null ? ' ' : all.length === 0 ? 'Nothing posted yet.' : (
            <>
              {all.length} {all.length === 1 ? 'post' : 'posts'} · last updated {updatedLabel(newest.toISOString())}
              {unseen.size > 0 && <span className="nws-sub-new">{unseen.size} new since your last visit</span>}
            </>
          )}
        </p>
      </header>

      {urgent.length > 0 && (
        <div className="nws-alerts" role="region" aria-label="Important notices">
          {urgent.map(a => (
            <button type="button" key={a.id} className="nws-alert" onClick={() => jumpTo(a.id)}>
              <span className="nws-alert-icon" aria-hidden="true">⚠️</span>
              <span className="nws-alert-text">
                <strong>{a.title}</strong>
                <span>{String(a.message || '').slice(0, 140)}{String(a.message || '').length > 140 ? '…' : ''}</span>
              </span>
              <span className="nws-alert-go" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      )}

      {all.length > 0 && (
        <div className="nws-toolbar">
          <div className="nws-chips" role="group" aria-label="Filter by category">
            <button type="button" className={`nws-chip${filter === 'all' ? ' nws-chip--on' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              All <span>{all.length}</span>
            </button>
            {CAT_ORDER.filter(c => counts[c]).map(c => (
              <button
                key={c}
                type="button"
                className={`nws-chip nws-tone-${CATS[c].tone}${filter === c ? ' nws-chip--on' : ''}`}
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
              >
                <i aria-hidden="true">{CATS[c].icon}</i> {CATS[c].label} <span>{counts[c]}</span>
              </button>
            ))}
          </div>
          <label className="nws-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search news" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search news" />
          </label>
        </div>
      )}

      {items === null ? <Skeleton /> : failed && all.length === 0 ? (
        <div className="nws-empty">
          <span aria-hidden="true">📡</span>
          <p>The news could not be loaded.</p>
          <button type="button" className="nws-retry" onClick={load}>Try again</button>
        </div>
      ) : all.length === 0 ? (
        <div className="nws-empty">
          <span aria-hidden="true">📰</span>
          <p>No announcements yet. Check back soon!</p>
        </div>
      ) : (
        <>
          {featured && <Featured a={featured} isNew={unseen.has(String(featured.id))} />}

          {groups.length > 0 ? (
            <div className="nws-timeline">
              {groups.map(g => (
                <section key={g.key} className="nws-month">
                  <h3 className="nws-month-head"><span>{g.key}</span></h3>
                  {g.items.map(a => (
                    <Story key={a.id} a={a} isNew={unseen.has(String(a.id))} index={runIndex++} />
                  ))}
                </section>
              ))}
            </div>
          ) : !browsing ? (
            <div className="nws-empty nws-empty--slim">
              <p>Nothing matches{q ? ` “${query.trim()}”` : ''}{filter !== 'all' ? ` in ${CATS[filter]?.label || filter}` : ''}.</p>
              <button type="button" className="nws-retry" onClick={() => { setFilter('all'); setQuery(''); }}>Show everything</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
