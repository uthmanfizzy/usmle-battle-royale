import { useState, useEffect } from 'react';
import { cachedImageMap, rememberImageMap } from '../utils/cachedImages';
import { authFetch, getCachedUser, setCachedUser } from '../auth';
import './ModeSplit.css';
import './ChooseYourPath.css';

import { SERVER_URL } from '../serverUrl';

// "Choose Your Path" — shown after clicking Play. Three tall art cards (Story,
// Online, Training Grounds), each with a medallion, coloured title, call-to-
// action and a light that travels round its border. Card art is uploaded in
// admin → Pages → Home Page (path_*_art); each card has a painted fallback.
// Online stays locked while it is under development.
function useModeArt() {
  const [art, setArt] = useState(() => cachedImageMap('home'));
  useEffect(() => {
    let cancelled = false;
    fetch(`${SERVER_URL}/api/home-images`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.images) return;
        rememberImageMap('home', d.images);
        setArt(d.images);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return art;
}

function PathCard({ variant, icon, title, sub, art, onClick, locked, cta }) {
  const Tag = locked ? 'div' : 'button';
  return (
    <Tag
      {...(locked
        ? { 'aria-disabled': 'true', title: `${title} is under development` }
        : { type: 'button', onClick })}
      className={`cyp-card cyp-card--${variant}${locked ? ' is-locked' : ''}${art ? ' has-art' : ''}`}
    >
      {art && <img className="cyp-art" src={art} alt="" />}
      <span className="cyp-motes" aria-hidden="true" />
      <span className="cyp-body">
        <span className="cyp-medal" aria-hidden="true"><span>{icon}</span></span>
        <span className="cyp-name">{title}</span>
        <span className="cyp-sub">{sub}</span>
        {locked ? (
          <span className="cyp-locked">
            <span className="cyp-lock-pill"><span aria-hidden="true">🔒</span> Locked</span>
            <span className="cyp-dev">Under development</span>
          </span>
        ) : (
          <span className="cyp-cta">{cta} <span aria-hidden="true">›</span></span>
        )}
      </span>
    </Tag>
  );
}

// eslint-disable-next-line no-unused-vars
export default function ModeSplit({ onStory, onOnline, onTraining, onMinigames, onBack }) {
  const art = useModeArt();
  return (
    <div className="ms-screen ms-story cyp-screen">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <header className="cyp-head">
        <h1 className="cyp-title">Choose Your Path</h1>
        <div className="cyp-ornament" aria-hidden="true"><span /><i>♛</i><span /></div>
        <p className="cyp-tagline">Different ways to learn. A higher purpose.</p>
      </header>

      <div className="cyp-list">
        <PathCard
          variant="story"
          icon="📖"
          title="Story Mode"
          sub="Solo campaigns — Journey, Flashcards & more"
          cta="Begin your journey"
          art={art.path_story_art}
          onClick={onStory}
        />
        {/* Training Grounds is still closed; re-enable by dropping `locked`
            and passing onClick={onTraining} plus cta="Start training". */}
        <PathCard
          variant="online"
          icon="⚔️"
          title="Online"
          sub="Battle other doctors live"
          cta="Enter the arena"
          art={art.path_online_art}
          onClick={onOnline}
        />
        <PathCard
          variant="training"
          icon="🎯"
          title="Training Grounds"
          sub="Study by topic · Watch videos"
          art={art.path_training_art}
          locked
        />
        {/* Minigames — short games that drill one skill at a time. They used
            to sit inside Story Mode; they are a path of their own now. */}
        <PathCard
          variant="minigames"
          icon="🎮"
          title="Minigames"
          sub="Quick games that drill one skill at a time"
          cta="Play a minigame"
          art={art.path_minigames_art}
          onClick={onMinigames}
        />
      </div>

      <footer className="cyp-foot">
        <div className="cyp-ornament" aria-hidden="true"><span /><i>♛</i><span /></div>
        <p>Knowledge builds greater tomorrows</p>
      </footer>
    </div>
  );
}

// Story menu: First Aid Journey emphasized per the mockup (wide campaign
// card). The Tower campaign was removed from this list — TowerMode.jsx and its
// App.jsx phase/route are untouched (unreachable, not deleted) in case it
// comes back.
/**
 * A Story Mode campaign that is not open yet. A plain element, not a button:
 * it cannot be clicked or focused, and it says so — the lock chip and the
 * title attribute carry it, so it is never mistaken for a broken button.
 */
export function LockedCard({ variant, icon, name, sub, chip = 'LOCKED' }) {
  return (
    <div
      className={`ms-journey-card ms-journey-card--${variant} is-locked`}
      aria-disabled="true"
      title={chip === 'LOCKED' ? `${name} is locked for now` : `${name} is coming soon`}
    >
      <div className="ms-journey-art" aria-hidden="true">
        <span className="ms-journey-art-icon">{icon}</span>
      </div>
      <div className="ms-journey-body">
        <span className="ms-journey-name">
          {name}
          <span className="ms-soon-chip"><span aria-hidden="true">🔒</span> {chip}</span>
        </span>
        <span className="ms-journey-sub">{sub}</span>
      </div>
    </div>
  );
}

export function StoryMenu({ onBack, onJourney, onAnKing, onUWorld, onSaudiMLE, onMehlman, onMinigames, onOET, onClinical, course, initialSub }) {
  // Dentistry students get the ORE/LDS bank in place of the medical licensing
  // ones; everything else (First Aid, flashcards) is shared, so their menu is
  // the same list with the board-exam campaign swapped. Medicine — and anyone
  // who signed up before the question existed — sees exactly what it always
  // showed.
  // Switchable here as well as at signup: students do change course, and a
  // dentist who wants a look at the medical banks should not have to go
  // hunting through Settings for it. Starts from the account, falls back to
  // the cached user so the toggle is right on a cold load of this screen.
  const [chosen, setChosen] = useState(
    () => String(course || getCachedUser()?.course || 'medicine').toLowerCase(),
  );
  // A later /auth/me (App refreshes the user) is authoritative.
  useEffect(() => {
    if (course) setChosen(String(course).toLowerCase());
  }, [course]);

  const isDentistry = chosen === 'dentistry';

  function switchCourse(next) {
    if (next === chosen) return;
    setChosen(next);
    // Remembered on the account, so the choice holds on every other device and
    // on the next visit. Optimistic: the menu has already switched, and a
    // failed save only means it reverts on the next full refresh.
    const cached = getCachedUser();
    if (cached) setCachedUser({ ...cached, course: next });
    authFetch('/auth/course', { method: 'PUT', body: JSON.stringify({ course: next }) })
      .catch(() => {});
  }

  // First Aid Journey and Flashcards each open a page of their own with their
  // sub-modes on it. A step in the browser's history too, so the phone's back
  // gesture returns to the campaign list instead of leaving Play.
  // UWorld Adventure does the same: UW Original, UW Concise and UWSA.
  const [sub, setSub] = useState(initialSub || null); // null | 'fa' | 'flash' | 'uw'
  useEffect(() => {
    const onPop = () => setSub(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  function openSub(which) {
    window.history.pushState({ storySub: which }, '');
    setSub(which);
    window.scrollTo(0, 0);
  }
  function closeSub() {
    if (window.history.state?.storySub) window.history.back();
    else setSub(null);
  }

  if (sub === 'uw') {
    return (
      <div className="ms-screen ms-story">
        <button className="ms-back-btn" onClick={closeSub}>← Story Mode</button>

        <div className="ms-banner">
          <h1 className="ms-title"><span className="ms-title-icon" aria-hidden="true">📊</span> <span className="ms-title-text">UWORLD ADVENTURE</span></h1>
          <p className="ms-tagline">Choose your expedition.</p>
          <div className="ms-title-rule" />
        </div>

        <div className="ms-campaign-list ms-campaign-list--trio">
          {/* UW Original — the full bank, worked down at a daily pace. */}
          <button className="ms-journey-card ms-journey-card--blue" onClick={onUWorld}>
            <div className="ms-journey-art" aria-hidden="true">
              <span className="ms-journey-art-icon">🌍</span>
            </div>
            <div className="ms-journey-body">
              <span className="ms-journey-name">UW ORIGINAL</span>
              <span className="ms-journey-sub">
                The full UWorld bank, subject by subject, at your own daily pace.
              </span>
            </div>
          </button>

          <LockedCard variant="teal" icon="⚡" name="UW CONCISE" chip="SOON"
            sub="The bank's high-yield core, for a faster pass." />
          <LockedCard variant="violet" icon="📝" name="UWSA" chip="SOON"
            sub="UWorld self-assessments — timed blocks under exam conditions." />
        </div>
      </div>
    );
  }

  if (sub === 'fa' || sub === 'flash') {
    const isFa = sub === 'fa';
    return (
      <div className="ms-screen ms-story">
        <button className="ms-back-btn" onClick={closeSub}>← Story Mode</button>

        <div className="ms-banner">
          <h1 className="ms-title"><span className="ms-title-icon" aria-hidden="true">{isFa ? '🚑' : '🃏'}</span> <span className="ms-title-text">{isFa ? 'FIRST AID JOURNEY' : 'FLASHCARDS'}</span></h1>
          <p className="ms-tagline">{isFa ? 'Choose how you want to learn First Aid.' : 'Pick your deck.'}</p>
          <div className="ms-title-rule" />
        </div>

        <div className={`ms-campaign-list ${isFa ? 'ms-campaign-list--trio' : 'ms-campaign-list--pair'}`}>
          {isFa ? (
            <>
              {/* FA Qbank — the original chapter-by-chapter journey. The two
                  routes sit on the card; a transparent cover button takes the
                  plain tap (the player's last route). The card is a div with
                  a cover because nested buttons are invalid HTML. */}
              <div className="ms-journey-card ms-journey-card--routed">
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">📝</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">FA QBANK</span>
                  <span className="ms-journey-sub">
                    March through First Aid chapter by chapter, answering questions as you go.
                  </span>
                  <div className="ms-journey-routes">
                    <button
                      type="button"
                      className="ms-route-btn"
                      onClick={(e) => { e.stopPropagation(); onJourney('full'); }}
                    >📖 Thorough</button>
                    <button
                      type="button"
                      className="ms-route-btn ms-route-btn--rapid"
                      onClick={(e) => { e.stopPropagation(); onJourney('rapid'); }}
                    >⚡ Concise</button>
                  </div>
                </div>
                <button
                  type="button"
                  className="ms-journey-cover"
                  onClick={() => onJourney()}
                  aria-label="FA Qbank"
                />
              </div>

              {/* FA Images — the book's figures, named one at a time. Its own
                  route, like UWorld Adventure. */}
              <button className="ms-journey-card ms-journey-card--violet" onClick={() => { window.location.href = '/fa-images'; }}>
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">🖼️</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">FA IMAGES</span>
                  <span className="ms-journey-sub">
                    Name the photos, slides and scans — and recall the blurred labels on its diagrams.
                  </span>
                </div>
              </button>

              {/* FA HY Qs — high-yield vignettes built on the Qbank's facts. */}
              <button className="ms-journey-card ms-journey-card--teal" onClick={() => { window.location.href = '/fa-hy-qs'; }}>
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">🎯</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">FA HY QS</span>
                  <span className="ms-journey-sub">
                    High-yield clinical vignettes — the next step after each Qbank fact.
                  </span>
                </div>
              </button>

              {/* FA Trivia — the Journey's game show: quick-fire trivia, its own stage and sounds. */}
              <button className="ms-journey-card ms-journey-card--trivia" onClick={() => { window.location.href = '/fa-trivia'; }}>
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">🎪</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">FA TRIVIA</span>
                  <span className="ms-journey-sub">
                    The First Aid game show — spin the wheel, beat the clock, build a streak.
                  </span>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Real: 27,319 imported cards with spaced repetition. */}
              <button className="ms-journey-card ms-journey-card--orange" onClick={onAnKing}>
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">🃏</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">ANKING</span>
                  <span className="ms-journey-sub">Master the AnKing deck with spaced repetition.</span>
                </div>
              </button>

              {/* Its own hy_flashcards table + admin tab, a standalone route. */}
              <button className="ms-journey-card ms-journey-card--yellow" onClick={() => { window.location.href = '/hy-flashcards'; }}>
                <div className="ms-journey-art" aria-hidden="true">
                  <span className="ms-journey-art-icon">⭐</span>
                </div>
                <div className="ms-journey-body">
                  <span className="ms-journey-name">HY FLASHCARDS</span>
                  <span className="ms-journey-sub">High-yield rapid review.</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ms-screen ms-story">
      <button className="ms-back-btn" onClick={onBack}>← Back</button>

      <div className="ms-banner">
        <h1 className="ms-title"><span className="ms-title-icon" aria-hidden="true">📖</span> <span className="ms-title-text">STORY MODE</span></h1>
        <p className="ms-tagline">Choose your campaign.</p>
        <div className="ms-title-rule" />

        {/* Which set of board-exam campaigns this menu offers. */}
        <div className="ms-course" role="group" aria-label="Course">
          <button
            type="button"
            className={`ms-course-btn${!isDentistry ? ' is-on' : ''}`}
            aria-pressed={!isDentistry}
            onClick={() => switchCourse('medicine')}
          >
            <span aria-hidden="true">🩺</span> Medicine
          </button>
          <button
            type="button"
            className={`ms-course-btn${isDentistry ? ' is-on' : ''}`}
            aria-pressed={isDentistry}
            onClick={() => switchCourse('dentistry')}
          >
            <span aria-hidden="true">🦷</span> Dentistry
          </button>
        </div>
      </div>

      {/* Every campaign shares the ms-journey-card layout: a row of tiles on
          desktop, wide rows stacked on a phone. Playable campaigns first, the
          locked ones after them at the bottom. */}
      <div className="ms-campaign-list">
        {/* First Aid and the flashcard decks are medical content, so a
            dentistry student's menu is the ORE/LDS campaign alone. */}
        {!isDentistry && (
        <button className="ms-journey-card" onClick={() => openSub('fa')}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🚑</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">FIRST AID JOURNEY</span>
            <span className="ms-journey-sub">
              A field medic&apos;s first steps — FA Qbank and FA Images.
            </span>
          </div>
        </button>
        )}

        {!isDentistry && (
        <button className="ms-journey-card ms-journey-card--orange" onClick={() => openSub('flash')}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🃏</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">FLASHCARDS</span>
            <span className="ms-journey-sub">Spaced-repetition decks — AnKing and HY Flashcards.</span>
          </div>
        </button>
        )}

        {isDentistry && (
          <button className="ms-journey-card ms-journey-card--teal" onClick={() => { window.location.href = '/ore-lds'; }}>
            <div className="ms-journey-art" aria-hidden="true">
              <span className="ms-journey-art-icon">🦷</span>
            </div>
            <div className="ms-journey-body">
              <span className="ms-journey-name">ORE / LDS EXAM</span>
              <span className="ms-journey-sub">
                Work the ORE and LDS dental bank down, at your own pace.
              </span>
            </div>
          </button>
        )}

        {/* A standalone ROUTE, not a phase, so onUWorld navigates. */}
        {!isDentistry && (
        <button className="ms-journey-card ms-journey-card--blue" onClick={() => openSub('uw')}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">📊</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">UWORLD ADVENTURE</span>
            <span className="ms-journey-sub">
              UW Original, UW Concise and UWSA — board review through the wards of Medvale.
            </span>
          </div>
        </button>
        )}

        {/* Amboss Quest — a hub of its own sub-modes (Qbank, 200 Concepts,
            HY Ethics), so it opens /amboss-quest rather than a bank. */}
        {!isDentistry && (
        <button className="ms-journey-card ms-journey-card--amboss" onClick={() => { window.location.href = '/amboss-quest'; }}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🧭</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">AMBOSS QUEST</span>
            <span className="ms-journey-sub">
              Qbank, 200 Concepts and HY Ethics — AMBOSS, quest by quest.
            </span>
          </div>
        </button>
        )}

        {/* Kaplan — a hub of its own sub-modes (100 HY Ethics, Qbank), so it
            opens /kaplan rather than a game. */}
        {!isDentistry && (
        <button className="ms-journey-card ms-journey-card--kaplan" onClick={() => { window.location.href = '/kaplan'; }}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">🎓</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">KAPLAN</span>
            <span className="ms-journey-sub">
              100 HY Ethics — The Ethics Tribunal, case by case.
            </span>
          </div>
        </button>
        )}

        {/* Mehlman Rapid Fire — the same question-bank machine on its own
            tag and its own yellow. */}
        {!isDentistry && (
        <button className="ms-journey-card ms-journey-card--yellow" onClick={onMehlman}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">⚡</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">MEHLMAN RAPID FIRE</span>
            <span className="ms-journey-sub">
              Mehlman&apos;s high-yield facts, fired at you one after another.
            </span>
          </div>
        </button>
        )}

        {/* ── Locked campaigns, at the bottom ─────────────────────────
            Shown, not hidden: a player should be able to see what is
            coming. Each is a plain element rather than a button, so it can
            not be clicked or tabbed into. To open one, swap <LockedCard>
            back for its button. OET, UKMLA and Saudi MLE are medicine-only. */}
        {!isDentistry && (
          <LockedCard variant="magenta" icon="💬" name="OET"
            sub="The Occupational English Test, worked through at your own pace." />
        )}

        <LockedCard variant="clinical" icon="🩺" name="Clinical"
          sub="The procedures a doctor is expected to be able to do, one at a time." />

        {!isDentistry && (
          <LockedCard variant="ukmla" icon="🏥" name="UKMLA / PLAB"
            sub="The UK Medical Licensing Assessment and PLAB, campaign by campaign." />
        )}

        {!isDentistry && (
          <LockedCard variant="green" icon="📗" name="SAUDI MLE"
            sub="Work the Saudi Medical Licensing Exam bank down, at your own pace." />
        )}
      </div>
    </div>
  );
}
