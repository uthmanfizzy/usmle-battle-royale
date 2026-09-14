import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { SwordsGlyph, TrophyGlyph, GroupGlyph, PlayGlyph, ScrollGlyph, WrenchGlyph } from './HomeGlyphs';
import './NotificationsDropdown.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
// Same read-state store the News tab uses (Dashboard.jsx ANN_READ_KEY), so
// reading an item in either place clears it in both.
const READ_KEY = 'mrb_read_announcements';
const SHOWN = 5;

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveReadIds(ids) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids])); } catch { /* private mode */ }
}

function timeAgo(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Icon + tint from the announcement's category, falling back to words in its
// title — announcements only carry Update / News / Event / Maintenance, so a
// "Clan …" or "Reel …" headline is recognised from the text.
function kindOf(a) {
  const text = `${a.category || ''} ${a.title || ''}`.toLowerCase();
  if (/event|tournament|season/.test(text)) return 'event';
  if (/leaderboard|rank|top warrior/.test(text)) return 'leaderboard';
  if (/clan|guild|invite/.test(text)) return 'clan';
  if (/reel|clip|video|short/.test(text)) return 'reel';
  if (/maintenance|downtime|outage/.test(text)) return 'maintenance';
  return 'notes';
}
const KIND_GLYPH = {
  event: <SwordsGlyph className="nd-glyph" />,
  leaderboard: <TrophyGlyph className="nd-glyph" />,
  clan: <GroupGlyph className="nd-glyph" color="#7fb2ff" />,
  reel: <PlayGlyph className="nd-glyph" />,
  maintenance: <WrenchGlyph className="nd-glyph" />,
  notes: <ScrollGlyph className="nd-glyph" />,
};

/**
 * Notifications panel under the header bell. Items are the site
 * announcements; unread = not yet in the shared read-id store.
 *
 * Positioning: the wrapper (.notif-dropdown) is anchored to the icon row, so
 * the panel lines up with the row's right edge; the caret is placed under the
 * bell by measuring it once mounted.
 */
export default function NotificationsDropdown({ onClose, onViewAll, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(getReadIds);
  const panelRef = useRef(null);
  const [caretX, setCaretX] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/announcements`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setItems(d.announcements || []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const bell = panel?.closest('.notif-wrapper, .dn-drop-wrap')?.querySelector('button');
    if (!panel || !bell) return;
    const place = () => {
      const b = bell.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      setCaretX(Math.max(18, Math.min(p.width - 18, b.left + b.width / 2 - p.left)));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  const unread = items.filter(a => !readIds.has(String(a.id)));
  useEffect(() => { if (!loading) onUnreadChange?.(unread.length); }, [loading, unread.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = (ids) => {
    const next = new Set(readIds);
    ids.forEach(id => next.add(String(id)));
    saveReadIds(next);
    setReadIds(next);
  };

  const openAll = () => {
    onClose?.();
    onViewAll?.();
  };

  return (
    <div className="nd-panel mv-plain" ref={panelRef} role="dialog" aria-label="Notifications">
      <span className="nd-caret" style={caretX != null ? { left: caretX } : undefined} aria-hidden="true" />

      <div className="nd-head">
        <h3 className="nd-title">Notifications</h3>
        {unread.length > 0 && (
          <button type="button" className="nd-markall" onClick={() => markRead(items.map(a => a.id))}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="nd-list">
        {loading ? (
          <div className="nd-empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="nd-empty">No notifications yet</div>
        ) : (
          items.slice(0, SHOWN).map(a => {
            const kind = kindOf(a);
            const isUnread = !readIds.has(String(a.id));
            return (
              <button
                type="button"
                key={a.id}
                className={`nd-item${isUnread ? ' is-unread' : ''}`}
                onClick={() => { markRead([a.id]); openAll(); }}
              >
                <span className={`nd-icon nd-icon--${kind}`}>{KIND_GLYPH[kind]}</span>
                <span className="nd-body">
                  <span className="nd-item-title">{a.title}</span>
                  <span className="nd-item-msg">{a.message}</span>
                  <span className="nd-item-time">{timeAgo(a.created_at)}</span>
                </span>
                {isUnread && <span className="nd-dot" aria-label="unread" />}
              </button>
            );
          })
        )}
      </div>

      <div className="nd-foot">
        <button type="button" className="nd-viewall" onClick={openAll}>
          View all notifications <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
