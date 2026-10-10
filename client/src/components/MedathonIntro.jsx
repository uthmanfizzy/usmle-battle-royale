import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playRosterStamp, playShojiPluck } from '../audio';
import FallingShaft from './FallingShaft';
import './MedathonIntro.css';

/**
 * The threshold into a Medathon.
 *
 * Five beats, about nine seconds:
 *   0. The field, as a manga spread: one slanted panel per racer, each
 *      slammed into place in its own colour, inked and screentoned.
 *   1. That page switches off like an old television — the picture squeezes
 *      into a bright horizontal line, the line draws into a point, gone.
 *   2. One plucked string. The shoji door is THERE on the attack, not faded
 *      in, lit from behind in amber and alone in the dark.
 *   3. The two leaves slide apart. Light spills through the widening gap,
 *      and what is behind them is a drop.
 *   4. The camera tips over the threshold and falls — the frame passing
 *      either side of you, the shaft opening up below. It hands over to the
 *      race still falling, because the race is played over the same shaft.
 *
 * WHY A PORTAL: the shut-off collapses the real interface, not a picture of
 * it — `#root` itself folds away alongside the roster (see the .mv-shoji
 * rules). That only works if this overlay sits OUTSIDE #root, so it is
 * mounted straight onto the body.
 *
 * TIMING IS SHARED WITH THE SERVER: the Medathon engine holds question one
 * back by MEDATHON_INTRO_MS (server/index.js) so none of this eats into that
 * question's clock — the speed bonus would otherwise be decided by a
 * cutscene. Move one of those numbers and you must move the other.
 */

// Milliseconds from mount. These drive BOTH the JavaScript cues and the CSS
// (handed over as custom properties below), so there is one clock, not two.
const T = {
  panel:    150,   // how far apart the roster panels land
  panelMs:  460,   // how long one takes to arrive
  // The spread is on screen for a full five seconds. The panels are all in
  // within the first second and a half of that, so the rest is a held shot —
  // and a held shot has to keep moving or it reads as a freeze, which is why
  // the page pushes in slowly and the light crosses it (see the CSS).
  line:    5000,   // the page is a sliver; the bright line takes over
  point:   5180,   // the line draws into a point
  dark:    5360,   // nothing at all
  note:    5480,   // the string is struck — and the door is there
  slide:   6900,   // the leaves begin to part
  slideMs: 2300,
  fall:    8700,   // open enough to go over the edge
  fallMs:  2500,
  out:    11200,   // the race underneath is revealed, still falling
  done:   11550,
};

export const MEDATHON_INTRO_MS = T.done;

// One per racer, in order. Six is plenty — a seventh would be a sliver.
const PANEL_COLOURS = 6;

export default function MedathonIntro({ onDone, muted = false, players = [], user = null, socketId = null }) {
  // 'off' is the television dying; 'lit' is everything from the note onward.
  const [lit, setLit] = useState(false);
  const doneRef = useRef(false);

  // The field. Only the local player's avatar is in hand — the lobby payload
  // carries no picture for anyone else — so everybody else gets their initial
  // drawn as the artwork rather than a borrowed stock face.
  const roster = useMemo(() => {
    const list = (Array.isArray(players) && players.length)
      ? players
      : [{ id: socketId, username: user?.username || 'You' }];
    return list.slice(0, PANEL_COLOURS).map((p, i) => {
      const mine = (socketId && p.id === socketId) || (!socketId && i === 0);
      const name = p.username || 'Racer';
      return {
        key: p.id ?? `p${i}`,
        name,
        initial: name.trim()[0]?.toUpperCase() || '?',
        avatar: mine ? (user?.avatar_url || null) : null,
        mine,
      };
    });
  }, [players, user, socketId]);

  useEffect(() => {
    const html = document.documentElement;
    const timers = [];
    let note = null;

    html.style.setProperty('--mi-t-line', `${T.line}ms`);
    html.classList.add('mv-shoji');

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      html.classList.remove('mv-shoji');
      // The note is still ringing if we were skipped; let it go rather than
      // clipping it mid-decay.
      onDone?.();
    };

    // One stamp per panel as it lands, and a heavier one as the page
    // settles. The flash is at panelMs - 130, so the sound goes with the hit
    // rather than after it.
    if (!muted) {
      roster.forEach((_, i) => {
        timers.push(setTimeout(
          () => { try { playRosterStamp(i); } catch { /* no audio, no matter */ } },
          i * T.panel + T.panelMs - 130,
        ));
      });
      timers.push(setTimeout(
        () => { try { playRosterStamp(roster.length, true); } catch { /* no audio, no matter */ } },
        (roster.length - 1) * T.panel + T.panelMs + 40,
      ));
    }

    timers.push(setTimeout(() => {
      setLit(true);
      if (!muted) {
        try { note = playShojiPluck(); } catch { /* no audio, no matter */ }
      }
    }, T.note));

    // The interface comes back under the last fade, so the cut into the
    // tournament lands on the bright frame rather than on black.
    timers.push(setTimeout(() => html.classList.remove('mv-shoji'), T.out));
    timers.push(setTimeout(finish, T.done));

    // Nothing may strand anyone inside a cutscene.
    const onKey = (e) => { if (e.key === 'Escape') { try { note?.stop(); } catch { /* already done */ } finish(); } };
    document.addEventListener('keydown', onKey);

    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey);
      html.classList.remove('mv-shoji');
      html.style.removeProperty('--mi-t-line');
    };
    // Mount-only: the sequence owns its own clock from the moment it
    // appears, and the field cannot change once the race has started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The door scene is display:none until the note, and a hidden element's
  // animations do not tick — they begin the moment it is shown. So every cue
  // inside it is handed over as an offset FROM the note, not from mount.
  // The roster and the shut-off are measured from mount, because neither is
  // ever hidden. Get this wrong and the doors open seconds late.
  const since = (ms) => `${ms - T.note}ms`;
  const settled = T.panel * Math.max(0, roster.length - 1) + T.panelMs;
  const vars = {
    '--t-line': `${T.line}ms`,
    '--t-point': `${T.point}ms`,
    '--t-dark': `${T.dark}ms`,
    '--t-settle': `${settled}ms`,
    '--d-panel': `${T.panelMs}ms`,
    '--t-slide': since(T.slide),
    '--d-slide': `${T.slideMs}ms`,
    '--t-dolly': since(T.fall),
    '--d-dolly': `${T.fallMs}ms`,
    '--t-out': since(T.out),
    '--d-out': `${T.done - T.out}ms`,
  };

  return createPortal(
    <div className={`mi${lit ? ' is-lit' : ''}`} style={vars} aria-hidden="true">
      {/* ── The field ────────────────────────────────────────────────────
          A manga spread: slanted panels with black between them, each racer
          inked in their own colour. It collapses with the page when the
          television goes off. */}
      <div className="mi-roster" style={{ '--count': roster.length }}>
        <div className="mi-roster-inner">
          {roster.map((p, i) => (
            <div
              key={p.key}
              className={`mi-pan mi-pan--${i % PANEL_COLOURS}${p.mine ? ' is-you' : ''}`}
              style={{ '--d': `${i * T.panel}ms`, '--from': i % 2 ? '112%' : '-112%' }}
            >
              <span className="mi-pan-art">
                <span className="mi-pan-initial">{p.initial}</span>
                {p.avatar && (
                  <img
                    src={p.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
              </span>
              {/* Ink, screentone and the rain of scratch lines. */}
              <span className="mi-pan-ink" />
              {/* The racer's colour, laid over the artwork as a duotone. */}
              <span className="mi-pan-wash" />
              {/* The hit as the panel lands. */}
              <span className="mi-pan-flash" />
              <span className="mi-pan-name">{p.name}</span>
              {p.mine && <span className="mi-pan-you">YOU</span>}
            </div>
          ))}
        </div>
      </div>

      {/* The bright line the page collapses into. */}
      <span className="mi-line" />

      {/* Everything from the note onward. Held at display:none until then so
          not one pixel of it can be seen before the string is struck. */}
      <div className="mi-scene">
        <div className="mi-world">
          {/* Beyond the doorway there is no floor: the shaft the race is
              played over, seen from its top. The same component the game
              mounts behind itself, so going over the edge and landing in the
              match is one continuous fall. */}
          <div className="mi-room">
            <FallingShaft layers={12} seconds={3.2} />
          </div>

          {/* The light that gets out as the gap widens. */}
          <div className="mi-spill" />
          <div className="mi-rays">
            <span /><span /><span />
          </div>

          {/* The two leaves. Paper over a lattice, slats along the bottom. */}
          <div className="mi-door mi-door--l">
            <span className="mi-paper" />
            <span className="mi-koshi" />
          </div>
          <div className="mi-door mi-door--r">
            <span className="mi-paper" />
            <span className="mi-koshi" />
          </div>

          {/* The surround, and the dark beyond it: both nearest the camera,
              so both are first past the edges on the way in. */}
          <div className="mi-jamb" />
          <div className="mi-wall" />
        </div>
      </div>

      {/* Air tearing past once the fall is on. */}
      <span className="mi-wind" />
    </div>,
    document.body,
  );
}
