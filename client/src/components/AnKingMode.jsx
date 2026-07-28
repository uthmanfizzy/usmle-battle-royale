import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { authFetch } from '../auth';
import './AnKingMode.css';

const SESSION_SIZE = 20;

// How the answer appears: the 3D flip, or the original fade-in below the
// question. Persisted per browser, following mr_solo_expl_layout's convention.
const REVEAL_STYLE_KEY = 'mr_anking_reveal_style';
const REVEAL_STYLES = [
  { id: 'flip',  label: 'Flip card', hint: 'Rotate to the answer' },
  { id: 'below', label: 'Show below', hint: 'Answer under the question' },
];
const readRevealStyle = () => {
  try {
    const v = localStorage.getItem(REVEAL_STYLE_KEY);
    return REVEAL_STYLES.some((s) => s.id === v) ? v : 'flip';
  } catch { return 'flip'; }
};

const RATINGS = [
  { id: 'again', label: 'Again', icon: '↺', hint: '<1 min' },
  { id: 'hard',  label: 'Hard',  icon: '◔', hint: 'harder' },
  { id: 'good',  label: 'Good',  icon: '✓', hint: 'on track' },
  { id: 'easy',  label: 'Easy',  icon: '★', hint: 'too easy' },
];

/**
 * Rewrite the original Anki media references the import preserved verbatim into
 * real Supabase Storage URLs.
 *
 * Two forms live in the stored HTML:
 *   <img src="paste-1.jpg">          -> src swapped for the public URL
 *   [sound:foo.mp3]                  -> replaced with an <audio controls> element
 *
 * `media` is the { filename -> { url, type } } map the due-cards endpoint
 * resolves per batch. A reference with no entry (11 corpus-wide never made it
 * into storage) is left alone for <img> — a broken image is better than a
 * mangled document — and stripped for [sound:] so no literal bracket text shows.
 */
function resolveMedia(html, media) {
  if (!html) return '';
  let out = html;

  if (media && Object.keys(media).length) {
    // Swap <img src="..."> — attribute order varies across the corpus, so match
    // the src attribute itself rather than assuming a position.
    out = out.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (full, pre, src, post) => {
      const hit = media[src] || media[decodeURIComponent(src)];
      return hit ? `${pre}${hit.url}${post}` : full;
    });
  }

  // [sound:filename] -> audio player (or nothing if unresolvable).
  out = out.replace(/\[sound:([^\]]+)\]/gi, (full, name) => {
    const hit = media && (media[name] || media[decodeURIComponent(name)]);
    if (!hit) return '';
    return `<audio class="anking-audio" controls preload="none" src="${hit.url}"></audio>`;
  });

  return out;
}

/**
 * For MCQ cards, question_html is the whole original Front field — stem AND the
 * "A) …/B) …" lines. The parsed options are rendered as real clickable rows
 * below, so leaving those lines in shows every choice twice. anking_cards has no
 * separate stem column (the importer parsed one but the table doesn't store it),
 * so the stem is recovered here by dropping the block-level nodes that are just
 * an option line.
 */
const OPTION_LINE = /^\(?[A-H]\s*[).:]\s*\S/;

function stripMcqOptionLines(html) {
  if (typeof window === 'undefined' || !html) return html;
  const host = document.createElement('div');
  host.innerHTML = html;

  // Top-level blocks first (the corpus wraps each option in its own <div>).
  for (const node of [...host.childNodes]) {
    const text = (node.textContent || '').replace(/ /g, ' ').trim();
    if (text && OPTION_LINE.test(text)) node.remove();
  }
  // Options can also arrive as bare text separated by <br> in one block.
  for (const el of [...host.querySelectorAll('div, p')]) {
    const text = (el.textContent || '').replace(/ /g, ' ').trim();
    if (text && OPTION_LINE.test(text) && !el.querySelector('img, audio')) el.remove();
  }
  return host.innerHTML;
}

/** Content is sanitised server-side at import; see the note in the render path. */
const Html = ({ html, media, className, stripOptions }) => {
  const out = stripOptions ? stripMcqOptionLines(html) : html;
  return <div className={className} dangerouslySetInnerHTML={{ __html: resolveMedia(out, media) }} />;
};

export default function AnKingMode({ user, config, onBack, onComplete }) {
  // 'picker' is the entry point: choose a subject (or All Subjects) before the
  // first batch is fetched.
  const [phase, setPhase] = useState('picker'); // picker | loading | studying | summary | empty | error
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  // null = All Subjects (mixed) — the ?subject= param is then omitted entirely,
  // preserving the original unfiltered behaviour exactly.
  const [subject, setSubject] = useState(config?.subject || null);
  // 'due' is the normal SRS queue; 'hard' is the drill deck of cards whose
  // latest rating was Hard, which ignores scheduling entirely.
  const [sessionMode, setSessionMode] = useState('due');
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  // Two separate ideas: `revealed` latches once the answer has been seen (it is
  // what gates the rating buttons), while `facingBack` is merely which side is
  // pointing at the user right now — the card can be turned back to re-read the
  // question without un-revealing it.
  const [revealed, setRevealed] = useState(false);
  const [facingBack, setFacingBack] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [revealStyle, setRevealStyle] = useState(readRevealStyle);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [picked, setPicked] = useState(null);       // mcq: chosen option letter
  const [submitting, setSubmitting] = useState(false);
  const [remainingToday, setRemainingToday] = useState(0);
  const [batchTally, setBatchTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  // Session-wide totals (persist across "Continue" batches) for the
  // activity_sessions row. Refs, not state: the unmount flush must read the
  // latest values without re-subscribing the effect on every rating.
  const sessionStartRef = useRef(Date.now());
  const sessionTallyRef = useRef({ again: 0, hard: 0, good: 0, easy: 0 });
  const sessionSentRef = useRef(false);
  // The subject a session was studied under, captured when the session starts.
  // Read by the flush instead of `subject` state so that switching subjects
  // mid-flight can never mislabel the row that is being written.
  const sessionSubjectRef = useRef(subject);

  const current = cards[index];
  const currentSubjectMeta = subject ? subjects.find((s) => s.id === subject) : null;

  // ── Session logging ─────────────────────────────────────────────────────────
  const postSessionComplete = useCallback((useKeepalive = false) => {
    const t = sessionTallyRef.current;
    const reviewed = t.again + t.hard + t.good + t.easy;
    if (reviewed === 0) return;            // nothing studied, nothing to log
    if (sessionSentRef.current) return;    // exactly once per session
    sessionSentRef.current = true;

    authFetch('/api/anking/session-complete', {
      method: 'POST',
      body: JSON.stringify({
        cards_reviewed: reviewed,
        good_or_easy_count: t.good + t.easy,
        duration_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
        // The subject this session was actually studied under (null = mixed).
        subject: sessionSubjectRef.current,
      }),
      // keepalive lets the request survive a hard navigation. sendBeacon can't
      // set an Authorization header and this endpoint is Bearer-authenticated,
      // so we follow SoloGame's precedent and use fetch(keepalive) instead.
      ...(useKeepalive ? { keepalive: true } : {}),
    }).catch(() => {});
  }, []);

  const postSessionRef = useRef(postSessionComplete);
  postSessionRef.current = postSessionComplete;

  // Flush an abandoned session. Two triggers, both funnelled through the
  // once-only guard: unmount for soft exits (Back sets parent state, React
  // unmounts), and 'pagehide' for hard exits that never unmount React.
  useEffect(() => {
    const onPageHide = () => { postSessionRef.current(true); };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      postSessionRef.current(true);
    };
  }, []);

  // ── Subjects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch('/api/anking/subjects');
        const data = await res.json();
        if (alive) setSubjects(data.subjects || []);
      } catch (e) {
        // Non-fatal: the picker still offers All Subjects.
        console.error('[AnKing] failed to load subjects:', e);
      }
      if (alive) setSubjectsLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // ── Batch loading ───────────────────────────────────────────────────────────
  // `subj` is passed explicitly rather than read from state so a selection can
  // load immediately, without waiting for a state flush.
  const loadBatch = useCallback(async (subj = subject, mode = sessionMode) => {
    setPhase('loading');
    setErrorMsg('');
    try {
      // All Subjects sends no param at all — identical to the original request.
      const qs = subj ? `?subject=${encodeURIComponent(subj)}` : '';
      const path = mode === 'hard' ? 'hard-cards' : 'due-cards';
      const res = await authFetch(`/api/anking/${path}${qs}`);
      const data = await res.json();

      // Hard mode is one flat list. The normal queue puts due reviews first —
      // overdue material should be cleared before new material is introduced.
      const batch = (mode === 'hard'
        ? (data.cards || [])
        : [...(data.due_reviews || []).map((d) => d.card), ...(data.new_cards || [])]
      ).slice(0, SESSION_SIZE);

      setRemainingToday(data.new_cards_remaining_today ?? 0);
      setCards(batch);
      setIndex(0);
      setRevealed(false);
      setFacingBack(false);
      setPicked(null);
      setBatchTally({ again: 0, hard: 0, good: 0, easy: 0 });
      setPhase(batch.length ? 'studying' : 'empty');
    } catch (e) {
      console.error('[AnKing] failed to load cards:', e);
      setErrorMsg('Could not load cards. Check your connection and try again.');
      setPhase('error');
    }
  }, [subject, sessionMode]);

  /**
   * Start (or restart) a study session on a subject. null = All Subjects.
   * `mode` picks the queue: 'due' (normal SRS) or 'hard' (the drill deck).
   */
  const startSession = (subj, mode = 'due') => {
    setSubject(subj);
    setSessionMode(mode);
    sessionSubjectRef.current = subj;
    sessionStartRef.current = Date.now();
    sessionTallyRef.current = { again: 0, hard: 0, good: 0, easy: 0 };
    sessionSentRef.current = false;
    loadBatch(subj, mode);
  };

  /**
   * Return to the picker. Any work already done is flushed FIRST, so it is
   * logged against the subject it was actually studied under — then the session
   * counters reset, and picking a subject starts a genuinely new session.
   */
  const changeSubject = () => {
    postSessionComplete(false);
    sessionTallyRef.current = { again: 0, hard: 0, good: 0, easy: 0 };
    sessionSentRef.current = false;
    sessionStartRef.current = Date.now();
    setPhase('picker');
  };

  // ── Rating ──────────────────────────────────────────────────────────────────
  const rate = async (rating) => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/anking/review', {
        method: 'POST',
        body: JSON.stringify({ card_id: current.id, rating }),
      });
      if (!res.ok) console.error('[AnKing] review rejected:', res.status);
    } catch (e) {
      // The card still advances: losing one scheduling update is better than
      // trapping the user on a card they've already answered.
      console.error('[AnKing] review failed:', e);
    }

    setBatchTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
    sessionTallyRef.current[rating] += 1;

    if (index >= cards.length - 1) {
      setPhase('summary');
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setFacingBack(false);
      setPicked(null);
    }
    setSubmitting(false);
  };

  /** Reveal the answer. Idempotent — re-revealing an already-seen card is a no-op. */
  const reveal = () => { setRevealed(true); setFacingBack(true); setFlipping(true); };

  /** Turn the card over either way, latching `revealed` the first time. */
  const toggleFace = () => { setRevealed(true); setFacingBack((b) => !b); setFlipping(true); };

  // The card is clipped to the showing face at rest, so the turned-away face —
  // which is absolutely positioned and can be 2000px of answer images — stops
  // padding the page with dead scroll space. Clipping is lifted for the length
  // of the rotation so the 3D swing is never cut off mid-turn.
  useEffect(() => {
    if (!flipping) return;
    const t = setTimeout(() => setFlipping(false), 520);
    return () => clearTimeout(t);
  }, [flipping, facingBack]);

  const chooseRevealStyle = (id) => {
    setRevealStyle(id);
    try { localStorage.setItem(REVEAL_STYLE_KEY, id); } catch {}
    setMenuOpen(false);
  };

  // Close the options dropdown on an outside click, as SoloGame's study burger does.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const finish = () => {
    postSessionComplete(false);
    onComplete?.({ ...sessionTallyRef.current });
    onBack?.();
  };

  // Keyboard: space/enter reveals, 1-4 rate. Matches Anki's muscle memory.
  useEffect(() => {
    if (phase !== 'studying') return;
    const onKey = (e) => {
      if (e.target.matches?.('input, textarea, button')) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (current?.card_type === 'mcq') return;   // MCQ reveals by picking an option
        e.preventDefault();
        // Once revealed, Space keeps turning the card so the question stays
        // reachable without a mouse.
        if (!revealed) reveal();
        else if (revealStyle === 'flip') setFacingBack((b) => !b);
        return;
      }
      if (revealed && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        rate(RATINGS[Number(e.key) - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // no dep array: closes over the live card/revealed each render

  const batchReviewed = useMemo(
    () => batchTally.again + batchTally.hard + batchTally.good + batchTally.easy,
    [batchTally]
  );

  // ── Card flip ───────────────────────────────────────────────────────────────
  // backface-visibility needs the two faces stacked, so both are absolutely
  // positioned and the flip container has no natural height — it takes the
  // height of whichever face is showing. A ResizeObserver keeps that correct
  // when the imported <img>s finish loading and a face grows, which is the norm
  // on this deck rather than the exception.
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [faceH, setFaceH] = useState({ front: 0, back: 0 });
  const [flipReady, setFlipReady] = useState(false);

  useLayoutEffect(() => {
    setFlipReady(false);
    const measure = () => {
      const front = frontRef.current?.offsetHeight || 0;
      const back = backRef.current?.offsetHeight || 0;
      // Bail on no-op updates so the observer can't feed itself.
      setFaceH((h) => (h.front === front && h.back === back ? h : { front, back }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (frontRef.current) ro.observe(frontRef.current);
    if (backRef.current) ro.observe(backRef.current);
    return () => ro.disconnect();
    // revealStyle is a dependency because switching to "Show below" unmounts the
    // faces entirely; the observer has to re-attach when they come back.
  }, [current?.id, phase, revealStyle]);

  // Transitions stay off until the first measured paint, so a new card snaps to
  // its size instead of animating up from zero.
  useEffect(() => {
    if (flipReady || !faceH.front) return;
    const id = requestAnimationFrame(() => setFlipReady(true));
    return () => cancelAnimationFrame(id);
  }, [flipReady, faceH.front]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === 'picker') {
    const totalCards = subjects.reduce((n, s) => n + s.count, 0);
    return (
      <div className="anking-picker">
        <div className="anking-picker-head">
          <button className="anking-exit" onClick={onBack}>← Back</button>
          <h2 className="anking-picker-title">Choose your deck</h2>
          <p className="anking-picker-sub">
            {subjectsLoading ? 'Loading subjects…' : `${totalCards.toLocaleString()} cards across ${subjects.length} subjects`}
          </p>
        </div>

        {/* Each deck is a tile, not a single button: the Hard drill is a second
            action on the same deck, and a button cannot legally nest inside one. */}
        <div className="anking-subject-grid">
          <div className="anking-subject-tile">
            <button
              className="anking-subject-card anking-subject-card--all"
              onClick={() => startSession(null)}
            >
              <div className="anking-subject-icon">🃏</div>
              <div className="anking-subject-label">All Subjects</div>
              <div className="anking-subject-count">
                {subjectsLoading ? 'mixed review' : `${totalCards.toLocaleString()} cards · mixed`}
              </div>
            </button>
            <button className="anking-subject-hard" onClick={() => startSession(null, 'hard')}>
              🔥 Study Hard Flashcards
            </button>
          </div>

          {subjects.map((s) => (
            <div className="anking-subject-tile" key={s.id}>
              <button
                className="anking-subject-card"
                onClick={() => startSession(s.id)}
              >
                <div className="anking-subject-icon">{s.icon || '📘'}</div>
                <div className="anking-subject-label">{s.name}</div>
                <div className="anking-subject-count">{s.count.toLocaleString()} cards</div>
              </button>
              <button className="anking-subject-hard" onClick={() => startSession(s.id, 'hard')}>
                🔥 Study Hard Flashcards
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="anking-state">
        <div className="anking-spinner">🃏</div>
        <p>Shuffling your deck…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="anking-state">
        <span className="anking-state-icon">⚠️</span>
        <h3>Something went wrong</h3>
        <p>{errorMsg}</p>
        <div className="anking-state-actions">
          <button className="mv-btn-cut anking-btn-primary" onClick={() => loadBatch()}>Try Again</button>
          <button className="mv-btn-cut anking-btn-ghost" onClick={changeSubject}>Change Subject</button>
          <button className="mv-btn-cut anking-btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    const where = currentSubjectMeta ? currentSubjectMeta.name : 'any subject';
    return (
      <div className="anking-state">
        <span className="anking-state-icon">{sessionMode === 'hard' ? '💪' : '🎉'}</span>
        <h3>{sessionMode === 'hard' ? 'Nothing marked hard' : 'All caught up'}</h3>
        {sessionMode === 'hard' ? (
          <p>
            No hard cards in {where} right now — nice work! Cards land here when
            you rate them Hard, and leave again as soon as you rate them better.
          </p>
        ) : (
          <p>
            No cards are due{currentSubjectMeta ? ` in ${currentSubjectMeta.name}` : ''} right now
            {remainingToday === 0 ? ", and you've hit today's new-card limit." : '.'}
            {' '}{subject ? 'Try another subject, or come back later.' : 'Come back later for your next review.'}
          </p>
        )}
        <div className="anking-state-actions">
          {sessionMode === 'hard' && (
            <button className="mv-btn-cut anking-btn-primary" onClick={() => startSession(subject)}>
              Study {currentSubjectMeta ? currentSubjectMeta.name : 'All Subjects'} normally
            </button>
          )}
          <button
            className={`mv-btn-cut ${sessionMode === 'hard' ? 'anking-btn-ghost' : 'anking-btn-primary'}`}
            onClick={changeSubject}
          >
            Change Subject
          </button>
          <button className="mv-btn-cut anking-btn-ghost" onClick={onBack}>← Back to Play</button>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const accuracy = batchReviewed
      ? Math.round(((batchTally.good + batchTally.easy) / batchReviewed) * 100)
      : 0;
    const t = sessionTallyRef.current;
    const sessionTotal = t.again + t.hard + t.good + t.easy;
    return (
      <div className="anking-state anking-summary">
        <span className="anking-state-icon">🎯</span>
        <h3>Batch complete</h3>
        <p className="anking-summary-line">
          {batchReviewed} card{batchReviewed === 1 ? '' : 's'} reviewed · {accuracy}% recalled
        </p>
        <p className="anking-summary-sub">
          {currentSubjectMeta ? `${currentSubjectMeta.icon || ''} ${currentSubjectMeta.name}` : '🃏 All Subjects'}
        </p>
        {sessionTotal !== batchReviewed && (
          <p className="anking-summary-sub">{sessionTotal} this session</p>
        )}

        <div className="anking-summary-grid">
          {RATINGS.map((r) => (
            <div className={`anking-summary-cell anking-rate--${r.id}`} key={r.id}>
              <span className="anking-summary-num">{batchTally[r.id]}</span>
              <span className="anking-summary-label">{r.label}</span>
            </div>
          ))}
        </div>

        <div className="anking-state-actions">
          <button className="mv-btn-cut anking-btn-primary" onClick={() => loadBatch()}>
            {/* hard-cards has no new-card allowance to report. */}
            {sessionMode === 'hard' ? 'Continue drilling' : `Continue (${remainingToday} new left today)`}
          </button>
          <button className="mv-btn-cut anking-btn-ghost" onClick={changeSubject}>Change Subject</button>
          <button className="mv-btn-cut anking-btn-ghost" onClick={finish}>Finish</button>
        </div>
      </div>
    );
  }

  // ── Studying ────────────────────────────────────────────────────────────────
  const isMcq = current.card_type === 'mcq';
  const options = Array.isArray(current.mcq_options) ? current.mcq_options : [];
  const progress = (index / cards.length) * 100;

  // MCQ keeps its in-place reveal whatever the preference says. Its answer text
  // refers back to the lettered options ("Answer is: B"), and the graded
  // correct/wrong states live on those option rows — rotating them out of view
  // would destroy the feedback the click-to-select flow exists to give.
  const canFlip = !isMcq && revealStyle === 'flip';
  // Cloze answer_html is the whole sentence with the blank filled in, so it
  // stands alone. Basic answer_html is only the answer, so the back echoes the
  // question above it the way Anki's own {{FrontSide}} back template does.
  const echoQuestion = current.card_type === 'basic';
  // Whichever side is actually pointing at the user — not whether the answer has
  // been seen, so turning back to the question resizes the card back down.
  const flipH = facingBack ? faceH.back : faceH.front;

  // Clicking the card turns it, either way. Links, audio players and buttons
  // inside the imported HTML keep their own behaviour.
  const onFaceClick = (e) => {
    if (e.target.closest?.('a, audio, button, input')) return;
    toggleFace();
  };

  return (
    <div className="anking-mode">
      <div className="anking-topbar">
        {/* Exit returns to the deck picker, flushing whatever was studied first.
            Leaving AnKing altogether is the picker's own "← Back". */}
        <button className="anking-exit" onClick={changeSubject}>← Exit to Decks</button>
        <div className="anking-progress">
          <span className="anking-progress-text">Card {index + 1} of {cards.length}</span>
          <div className="anking-progress-track">
            <div className="anking-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {/* Reflects the card in view, so a mixed session still shows what this
            particular card belongs to. */}
        <span className="anking-badge">{current.subject?.replace(/_/g, ' ') || 'mixed'}</span>
        {sessionMode === 'hard' && <span className="anking-badge anking-badge--hard">🔥 hard drill</span>}

        {/* Study options, following SoloGame's study-burger convention: a ☰
            button with a dropdown panel that closes on an outside click. */}
        <div className="anking-menu" ref={menuRef}>
          <button
            className="anking-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Study options"
            title="Study options"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="anking-menu-panel">
              <div className="anking-menu-title">Reveal style</div>
              {REVEAL_STYLES.map((s) => (
                <button
                  key={s.id}
                  className={`anking-menu-opt${revealStyle === s.id ? ' is-active' : ''}`}
                  onClick={() => chooseRevealStyle(s.id)}
                >
                  <span className="anking-menu-opt-label">{s.label}</span>
                  <span className="anking-menu-opt-hint">{s.hint}</span>
                </button>
              ))}
              <p className="anking-menu-note">Multiple-choice cards always reveal in place.</p>
            </div>
          )}
        </div>
      </div>

      {/* Content was sanitised at import time by the cheerio pass in
          tools/anking-import (tag + attribute allow-list, all script/style
          subtrees dropped, every on* and style attribute stripped), so it is
          safe to inject. Escaping it here would show literal markup and break
          every image, cloze blank and formatting span. */}
      {canFlip ? (
        // Keyed on the card so a new one mounts fresh: the height is applied on
        // that first render, which never animates.
        <div
          key={current.id}
          className={`anking-flip-clip${flipReady ? ' is-animated' : ''}${flipping ? ' is-flipping' : ''}`}
          style={flipH ? { height: `${flipH}px` } : undefined}
        >
        <div className={`anking-flip${flipReady ? ' is-animated' : ''}${facingBack ? ' is-flipped' : ''}`}>
          <div className="anking-flip-inner">
            <div
              className="anking-card anking-face anking-face--front"
              ref={frontRef}
              aria-hidden={facingBack}
              onClick={onFaceClick}
            >
              <Html className="anking-question" html={current.question_html} media={current.media} />
              <span className="anking-flip-hint" aria-hidden="true">
                {revealed ? 'Click the card for the answer again' : 'Click the card to flip'}
              </span>
            </div>

            <div
              className="anking-card anking-face anking-face--back"
              ref={backRef}
              aria-hidden={!facingBack}
              onClick={onFaceClick}
            >
              {echoQuestion && (
                <>
                  <Html className="anking-question anking-question--echo" html={current.question_html} media={current.media} />
                  <div className="anking-divider"><span>Answer</span></div>
                </>
              )}
              <Html className="anking-answer" html={current.answer_html} media={current.media} />
              {current.extra_html && (
                <>
                  <div className="anking-divider"><span>Extra</span></div>
                  <Html className="anking-extra" html={current.extra_html} media={current.media} />
                </>
              )}
              <span className="anking-flip-hint" aria-hidden="true">Click the card to re-read the question</span>
            </div>
          </div>
        </div>
        </div>
      ) : !isMcq ? (
        // "Show below" — the original mechanism: answer fades in under the question.
        <div className="anking-card">
          <Html className="anking-question" html={current.question_html} media={current.media} />
          {revealed && (
            <div className="anking-reveal">
              <div className="anking-divider"><span>Answer</span></div>
              <Html className="anking-answer" html={current.answer_html} media={current.media} />
              {current.extra_html && (
                <>
                  <div className="anking-divider"><span>Extra</span></div>
                  <Html className="anking-extra" html={current.extra_html} media={current.media} />
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="anking-card">
          <Html className="anking-question" html={current.question_html} media={current.media} stripOptions />

          <div className="anking-options">
            {options.map((opt) => {
              const isCorrect = opt.letter === current.mcq_correct_letter;
              const state = !picked ? '' : isCorrect ? ' anking-option--correct'
                : opt.letter === picked ? ' anking-option--wrong' : ' anking-option--muted';
              return (
                <button
                  key={opt.letter}
                  className={`anking-option${state}`}
                  disabled={!!picked}
                  onClick={() => { setPicked(opt.letter); setRevealed(true); }}
                >
                  <span className="anking-option-letter">{opt.letter}</span>
                  <span className="anking-option-text">{opt.text}</span>
                  {picked && isCorrect && <span className="anking-option-mark">✓</span>}
                  {picked === opt.letter && !isCorrect && <span className="anking-option-mark">✕</span>}
                </button>
              );
            })}
          </div>

          {revealed && current.extra_html && (
            <div className="anking-reveal">
              <div className="anking-divider"><span>Extra</span></div>
              <Html className="anking-extra" html={current.extra_html} media={current.media} />
            </div>
          )}
        </div>
      )}

      {!revealed ? (
        <div className="anking-actions">
          <button className="mv-btn-cut anking-btn-primary anking-reveal-btn" onClick={reveal}>
            Show Answer
          </button>
          <p className="anking-kbd-hint">or press <kbd>Space</kbd></p>
        </div>
      ) : (
        <div className="anking-actions">
          <div className="anking-ratings">
            {RATINGS.map((r, i) => (
              <button
                key={r.id}
                className={`anking-rate anking-rate--${r.id}`}
                disabled={submitting}
                onClick={() => rate(r.id)}
              >
                <span className="anking-rate-icon">{r.icon}</span>
                <span className="anking-rate-label">{r.label}</span>
                <span className="anking-rate-hint">{r.hint}</span>
                <span className="anking-rate-key">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
