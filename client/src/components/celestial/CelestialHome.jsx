import { useTodayGoals, fmtMinutes } from '../../planner/plan';
import { ART, CelestialTopbar, NavIcon, PanelHead } from './CelestialShell';
import './CelestialHome.css';

/**
 * The Celestial theme's home tab — the Homepage design, on real data:
 *  - the hero greets the signed-in player and PLAY goes to the play flow;
 *  - the four cards go to Profile, Leaderboards, Clans and News (the design's
 *    "Events" — there is no events feature, so it became News);
 *  - "Latest news" (the design's "Upcoming event") shows the newest
 *    announcement; "Today's goals" is today's share of the Week Planner
 *    (/planner) goals plus today's tasks.
 */

const CARDS = [
  { key: 'profile', title: 'Profile', sub: 'View your stats', art: 'card-profile.jpg', tone: 'blue', href: '/progress' },
  { key: 'leaderboard', title: 'Leaderboards', sub: "See who's on top", art: 'card-leaderboards.jpg', tone: 'violet', tab: 'leaderboard' },
  { key: 'clans', title: 'Clans', sub: 'Join or create a clan', art: 'card-clans.jpg', tone: 'sky', tab: 'clans' },
  { key: 'news', title: 'News', sub: 'Latest updates', art: 'card-events.jpg', tone: 'indigo', tab: 'announcements' },
];


function SmallCaps({ text }) {
  // The design's title treatment: a full-size first letter, the rest at .8em.
  return text.split(' ').map((w, i) => (
    <span key={i}>{i > 0 && ' '}<span>{w[0]}</span><span className="ch-sc">{w.slice(1)}</span></span>
  ));
}

function fmtDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CelestialHome({ user, announcements = [], onTab, onPlay, unread = 0, reward }) {
  const today = useTodayGoals();

  const news = announcements.find(a => a.pinned) || announcements[0] || null;
  const name = (user?.username || 'Player').toUpperCase();
  // The design sizes the name for about eight letters; longer names scale down
  // so they still fit beside the art.
  const nameSize = name.length > 8 ? { '--name-scale': (8 / name.length).toFixed(3) } : undefined;

  const open = (e, c) => {
    if (c.tab) { e.preventDefault(); onTab?.(c.tab); }
  };

  return (
    <div className="ch">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="ch-hero" aria-label="Welcome">
        <div className="ch-art" aria-hidden="true">
          <img className="ch-art-img" src={`${ART}/hero.jpg`} alt="" />
          <div className="ch-moon" />
          <div className="ch-city" />
          <div className="ch-mist ch-mist--1"><div /></div>
          <div className="ch-mist ch-mist--2"><div /></div>
          <div className="ch-mist ch-mist--3"><div /></div>
          <svg className="ch-ring" viewBox="0 0 1463 478">
            <path className="ch-ring-glow" d="M779.0 258.4 A147 43 -3.1 0 1 924.7 186.4" />
            <path className="ch-ring-glow" d="M981.9 189.5 A147 43 -3.1 0 1 1039.0 240.9" />
            <path className="ch-ring-a" d="M779.0 258.4 A147 43 -3.1 0 1 924.7 186.4" />
            <path className="ch-ring-b" d="M981.9 189.5 A147 43 -3.1 0 1 1039.0 240.9" />
            <path className="ch-ring-a ch-ring--late" d="M779.0 258.4 A147 43 -3.1 0 1 924.7 186.4" />
            <path className="ch-ring-b ch-ring--late" d="M981.9 189.5 A147 43 -3.1 0 1 1039.0 240.9" />
          </svg>
          <div className="ch-sword" />
          <div className="ch-sword-glow" />
          <div className="ch-gate-glow" />
          <div className="ch-motes">
            <div className="ch-sway">
              <div className="ch-twinkle ch-twinkle--a"><div className="ch-dots ch-dots--a" /></div>
              <div className="ch-dots ch-dots--b" />
              <div className="ch-twinkle ch-twinkle--c"><div className="ch-dots ch-dots--c" /></div>
            </div>
          </div>
          <div className="ch-shoot" />
          <div className="ch-isle"><img src={`${ART}/isle.png`} alt="" /></div>
          <div className="ch-dragon"><img src={`${ART}/dragon.png`} alt="" /></div>
        </div>
        <div className="ch-hero-shade" aria-hidden="true" />
        <div className="ch-hero-fade" aria-hidden="true" />

        <div className="ch-welcome">
          <p className="ch-kicker">WELCOME BACK,</p>
          <h1 className="ch-name" title={user?.username} style={nameSize}><SmallCaps text={name} /></h1>
          <div className="ch-tag">
            <span className="ch-rule ch-rule--l" aria-hidden="true" />
            <p>Explore. Compete. Belong.</p>
            <span className="ch-rule ch-rule--r" aria-hidden="true" />
          </div>
          <div className="ch-spark" aria-hidden="true">
            <span /><svg viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" /></svg><span />
          </div>
          <div className="ch-play-wrap">
            <span className="ch-streak ch-streak--l1" aria-hidden="true" />
            <span className="ch-streak ch-streak--l2" aria-hidden="true" />
            <span className="ch-streak ch-streak--l3" aria-hidden="true" />
            <span className="ch-streak ch-streak--r1" aria-hidden="true" />
            <span className="ch-streak ch-streak--r2" aria-hidden="true" />
            <span className="ch-streak ch-streak--r3" aria-hidden="true" />
            <button type="button" className="ch-play" onClick={onPlay}>
              <span className="ch-play-fill" aria-hidden="true" />
              <span className="ch-play-sweep" aria-hidden="true" />
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 1.5v21L22.5 12z" /></svg>
              <span className="ch-play-label">PLAY</span>
            </button>
          </div>
        </div>

        <CelestialTopbar user={user} reward={reward} onNews={() => onTab?.('announcements')} />
      </section>

      <div className="ch-body">
        {/* ── Four cards ────────────────────────────────────────────── */}
        <div className="ch-cards">
          {CARDS.map(c => (
            <div key={c.key} className={`ch-card ch-card--${c.tone}`}>
              <a href={c.href || `/dashboard?tab=${c.tab}`} className="ch-card-edge" onClick={(e) => open(e, c)}>
                <span className="ch-card-in">
                  <img className="ch-card-art" src={`${ART}/${c.art}`} alt="" />
                  <NavIcon name={c.key} className="ch-card-ic" />
                  <span className="ch-card-title">
                    {c.title.toUpperCase()}
                    {c.key === 'news' && unread > 0 && <span className="ch-dot" aria-label={`${unread} unread`} />}
                  </span>
                  <span className="ch-card-sub">{c.sub}</span>
                  <svg className="ch-card-chev" viewBox="0 0 10 17" aria-hidden="true"><path d="M1.5 1.5 8.5 8.5l-7 7" /></svg>
                </span>
              </a>
            </div>
          ))}
        </div>

        <div className="ch-row">
          {/* ── Latest news (the design's "Upcoming event") ─────────── */}
          <section aria-labelledby="ch-news" className="cs-panel ch-news">
            <div className="cs-panel-in">
              <PanelHead id="ch-news" title="Latest news" onLink={() => onTab?.('announcements')} />
              <div className="ch-news-art">
                <img src={`${ART}/event.jpg`} alt="" />
                <div className="ch-news-body">
                  {news ? (
                    <>
                      <h3 className="ch-news-title">{news.title}</h3>
                      <p className="ch-news-date">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 5h14.8a1.6 1.6 0 0 1 1.6 1.6v12.8a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 19.4V6.6A1.6 1.6 0 0 1 4.6 5z" /><path d="M3 9.4h18M7.6 2.4v4.2M16.4 2.4v4.2" /><path className="ch-fill" d="M6.6 12.4h4v3.6h-4z" /></svg>
                        <span>{fmtDate(news.created_at || news.date)}</span>
                      </p>
                      <div className="ch-ghost-wrap">
                        <button type="button" className="ch-ghost" onClick={() => onTab?.('announcements')}>
                          <span className="ch-ghost-fill" aria-hidden="true" />
                          <span className="ch-ghost-label">READ MORE</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="ch-news-title">All quiet</h3>
                      <p className="ch-news-date"><span>No announcements yet.</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Today's goals (Week Planner) ──────────────────────────── */}
          <section aria-labelledby="ch-top" className="cs-panel ch-top">
            <div className="cs-panel-in ch-top-in">
              <PanelHead id="ch-top" title="Today's goals" link="/planner" linkLabel="Plan week" />
              <ul className="ch-goal-list">
                {today.loading && <li className="ch-top-empty">Loading…</li>}
                {!today.loading && today.signedOut && <li className="ch-top-empty">Sign in to plan your week.</li>}
                {!today.loading && !today.signedOut && today.items.length === 0 && (
                  <li className="ch-top-empty">
                    {today.hasPlan ? 'Nothing planned for today. Enjoy the rest day 🌙' : <>No goals yet. <a href="/planner">Plan your week →</a></>}
                  </li>
                )}
                {today.items.slice(0, 5).map(it => (
                  <li key={it.key} className={`ch-goal${it.complete ? ' is-done' : ''}`}>
                    {it.kind === 'task' ? (
                      <label className="ch-goal-task">
                        <input type="checkbox" checked={it.complete} onChange={() => today.toggleTask(it.key)} />
                        <span className="ch-goal-name">{it.label}</span>
                      </label>
                    ) : (
                      <>
                        <span className="ch-goal-icon" aria-hidden="true">{it.complete ? '✅' : it.icon}</span>
                        <span className="ch-goal-main">
                          <span className="ch-goal-name">{it.label}</span>
                          <span className="ch-goal-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (it.done / it.target) * 100)}%` }} /></span>
                        </span>
                        <span className="ch-goal-count">{it.done}/{it.target} {it.unit}</span>
                      </>
                    )}
                  </li>
                ))}
                {today.items.length > 5 && <li className="ch-top-empty"><a href="/planner">+{today.items.length - 5} more</a></li>}
              </ul>
              {today.leftMin >= 1 && <p className="ch-goal-foot">≈ {fmtMinutes(today.leftMin)} of study left today</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
