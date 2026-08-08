import { useState, useEffect, useRef, useCallback } from 'react';
import { getToken, fetchMe, getCachedUser } from '../auth';
import './HYFlashcards.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Fisher-Yates — cards arrive in authored (sort_order) order; shuffle is opt-in.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * /hy-flashcards — subject/topic picker, then a straight-through card flipper.
 *
 * Deliberately NOT built on SoloGame (that's for timed MCQ with lives/scoring,
 * neither of which applies here) or on AnKingMode's spaced-repetition engine
 * (this content has no per-user review schedule — an admin authors a fixed
 * deck, a student browses it front-to-back). This is its own small component
 * for its own small interaction: flip, read, next.
 */
export default function HYFlashcards() {
  const [user, setUser] = useState(getCachedUser);
  const [menu, setMenu] = useState(null);           // null = loading, [] = loaded-but-empty never happens (always all active subjects)
  const [menuError, setMenuError] = useState(false);
  const [openSubject, setOpenSubject] = useState(null); // subject id whose bucket list is expanded

  const [deck, setDeck] = useState(null);           // { subject, subjectName, topicId, topicName, cards }
  const [order, setOrder] = useState('inorder');    // 'inorder' | 'random'

  // Same own-identity guard the other signed-in pages use.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/hy-flashcards/menu`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setMenu(d.subjects || []); })
      .catch(() => { if (!cancelled) { setMenu([]); setMenuError(true); } });
    return () => { cancelled = true; };
  }, []);

  function startDeck(subject, topicId, topicName, cards) {
    if (cards.length === 0) return;
    setDeck({
      subject: subject.id,
      subjectName: subject.name,
      topicId,
      topicName,
      cards: order === 'random' ? shuffle(cards) : cards,
    });
  }

  async function openBucket(subject, topicId, topicName) {
    const url = `${SERVER_URL}/api/hy-flashcards?subject=${encodeURIComponent(subject.id)}${topicId ? `&topic_id=${encodeURIComponent(topicId)}` : ''}`;
    const res = await fetch(url).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    startDeck(subject, topicId, topicName, data.cards || []);
  }

  if (deck) {
    return (
      <Player
        deck={deck}
        onExit={() => setDeck(null)}
      />
    );
  }

  return (
    <div className="hyf-page">
      <div className="hyf-topbar">
        <a className="hyf-wordmark" href="/dashboard">MEDVALE</a>
        <div className="hyf-avatar" title={user?.username || 'Player'}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
            : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
        </div>
      </div>

      <div className="hyf-headrow">
        <button type="button" className="hyf-back" onClick={() => { window.location.href = '/?story=1'; }}>
          ← Back to Story Mode
        </button>
        <h1 className="hyf-title">⭐ HY Flashcards</h1>
        <div />
      </div>

      <div className="hyf-col">
        <p className="hyf-intro">High-yield rapid review. Pick a subject, then a deck.</p>

        <div className="hyf-order-toggle" role="group" aria-label="Card order">
          <button
            type="button"
            className={`hyf-order-btn${order === 'inorder' ? ' is-on' : ''}`}
            onClick={() => setOrder('inorder')}
          >📖 In order</button>
          <button
            type="button"
            className={`hyf-order-btn${order === 'random' ? ' is-on' : ''}`}
            onClick={() => setOrder('random')}
          >🎲 Random</button>
        </div>

        {menu === null && <p className="hyf-empty">Loading subjects…</p>}
        {menuError && <p className="hyf-empty">Couldn&apos;t load subjects — check your connection.</p>}

        <div className="hyf-subjects">
          {(menu || []).map(s => {
            const isOpen = openSubject === s.id;
            const hasCards = s.total_count > 0;
            return (
              <div key={s.id} className={`hyf-subject${isOpen ? ' is-open' : ''}${hasCards ? '' : ' is-empty'}`}>
                <button
                  type="button"
                  className="hyf-subject-head"
                  disabled={!hasCards}
                  onClick={() => setOpenSubject(isOpen ? null : s.id)}
                >
                  <span className="hyf-subject-icon" aria-hidden="true">{s.icon}</span>
                  <span className="hyf-subject-name">{s.name}</span>
                  <span className="hyf-subject-count">
                    {hasCards ? `${s.total_count} card${s.total_count === 1 ? '' : 's'}` : 'No cards yet'}
                  </span>
                  {hasCards && <span className="hyf-subject-caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>}
                </button>

                {isOpen && hasCards && (
                  <div className="hyf-decks">
                    {/* "Study All" is the broad option — every card in the
                        subject regardless of topic, matching the same
                        GET /api/hy-flashcards?subject= (no topic_id) call
                        Training Grounds' "study whole folder" mirrors. */}
                    <button className="hyf-deck" onClick={() => openBucket(s, null, null)}>
                      <span className="hyf-deck-name">Study All — {s.name}</span>
                      <span className="hyf-deck-sub">
                        {s.total_count} card{s.total_count === 1 ? '' : 's'}
                        {s.topics.length > 0 ? ' across all topics' : ''}
                      </span>
                    </button>
                    {/* Per-topic decks — only topics an admin has actually put
                        cards under show up here, per the original ask: "if
                        there is a topic made then they can do the HY
                        Flashcards of that". */}
                    {s.topics.map(t => (
                      <button key={t.id} className="hyf-deck hyf-deck--topic" onClick={() => openBucket(s, t.id, t.name)}>
                        <span className="hyf-deck-name">{t.name}</span>
                        <span className="hyf-deck-sub">{t.count} card{t.count === 1 ? '' : 's'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The actual flip-through session. Its own tiny component so the flip/index
 * state resets cleanly every time a new deck is opened (mounted fresh). */
function Player({ deck, onExit }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seenCount, setSeenCount] = useState(0);   // cards actually flipped to their back
  const [done, setDone] = useState(false);

  const seenRef = useRef(new Set());
  const startRef = useRef(Date.now());
  const sentRef = useRef(false);

  const card = deck.cards[idx];
  const total = deck.cards.length;

  const postSession = useCallback((useKeepalive = false) => {
    if (sentRef.current) return;
    const reviewed = seenRef.current.size;
    if (reviewed === 0) return;
    sentRef.current = true;
    const token = getToken();
    if (!token) return;
    fetch(`${SERVER_URL}/api/hy-flashcards/session-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subject: deck.subject,
        topic_id: deck.topicId,
        cards_reviewed: reviewed,
        duration_seconds: Math.round((Date.now() - startRef.current) / 1000),
        date: new Date().toLocaleDateString('en-CA'),
      }),
      ...(useKeepalive ? { keepalive: true } : {}),
    }).catch(() => {});
  }, [deck]);

  // Same hard-exit safety net SoloGame/AnKing use: 'pagehide' catches a full
  // navigation (Home button sets window.location), unmount cleanup catches a
  // soft phase change.
  useEffect(() => {
    const onPageHide = () => postSession(true);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      postSession(true);
    };
  }, [postSession]);

  function flip() {
    if (!flipped) {
      setFlipped(true);
      if (!seenRef.current.has(idx)) {
        seenRef.current.add(idx);
        setSeenCount(seenRef.current.size);
      }
    }
  }

  function next() {
    if (idx + 1 >= total) { setDone(true); postSession(); return; }
    setIdx(i => i + 1);
    setFlipped(false);
  }
  function prev() {
    if (idx === 0) return;
    setIdx(i => i - 1);
    setFlipped(false);
  }

  if (done) {
    return (
      <div className="hyf-page hyf-page--center">
        <div className="hyf-done-card">
          <span className="hyf-done-icon" aria-hidden="true">🎉</span>
          <h2>Deck Complete!</h2>
          <p className="hyf-done-sub">{deck.topicName || deck.subjectName}</p>
          <p className="hyf-done-count">{seenCount} of {total} cards reviewed</p>
          <div className="hyf-done-actions">
            <button className="btn-start" onClick={() => { setIdx(0); setFlipped(false); setDone(false); seenRef.current = new Set(); setSeenCount(0); startRef.current = Date.now(); sentRef.current = false; }}>
              Study Again
            </button>
            <button className="btn-secondary" onClick={onExit}>Back to Subjects</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hyf-page hyf-page--player">
      <div className="hyf-player-head">
        <button type="button" className="hyf-back" onClick={onExit}>← Exit</button>
        <span className="hyf-player-title">{deck.topicName || `${deck.subjectName} — All`}</span>
        <span className="hyf-player-count">{idx + 1} / {total}</span>
      </div>

      <div className="hyf-card-wrap">
        <div className={`hyf-flip${flipped ? ' is-flipped' : ''}`} onClick={flip}>
          <div className="hyf-flip-inner">
            <div className="hyf-face hyf-face--front">
              <span className="hyf-face-label">QUESTION</span>
              <p className="hyf-face-text">{card.front}</p>
              <span className="hyf-face-hint">Tap to reveal</span>
            </div>
            <div className="hyf-face hyf-face--back">
              <span className="hyf-face-label">ANSWER</span>
              <p className="hyf-face-text">{card.back}</p>
              <span className="hyf-face-hint">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hyf-player-nav">
        <button type="button" className="btn-secondary" onClick={prev} disabled={idx === 0}>← Previous</button>
        <button type="button" className="btn-start" onClick={next}>{idx + 1 >= total ? 'Finish ✓' : 'Next →'}</button>
      </div>
    </div>
  );
}
