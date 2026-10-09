import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playShojiPluck } from '../audio';
import './MedathonIntro.css';

/**
 * The threshold into a Medathon.
 *
 * Four beats, about five seconds:
 *   1. The site switches off like an old television — the picture squeezes
 *      into a bright horizontal line, the line draws into a point, gone.
 *   2. One plucked string. The shoji door is THERE on the attack, not faded
 *      in, lit from behind in amber and alone in the dark.
 *   3. The two leaves slide apart. Light spills through the widening gap.
 *   4. The camera walks through, the frame passing either side of you.
 *
 * WHY A PORTAL: scene 1 collapses the real interface, not a picture of it —
 * `#root` itself is what folds away (see the .mv-shoji rules). That only
 * works if this overlay sits OUTSIDE #root, so it is mounted straight onto
 * the body and the page's own black shows behind the collapsing UI.
 *
 * TIMING IS SHARED WITH THE SERVER: the Medathon engine holds question one
 * back by MEDATHON_INTRO_MS (server/index.js) so none of this eats into that
 * question's clock — the speed bonus would otherwise be decided by a
 * cutscene. Move one of those numbers and you must move the other.
 */

// Milliseconds from mount. These drive BOTH the JavaScript cues and the CSS
// (handed over as custom properties below), so there is one clock, not two.
const T = {
  line:     170,   // the picture is a sliver; the bright line takes over
  point:    300,   // the line draws into a point
  dark:     470,   // nothing at all
  note:     560,   // the string is struck — and the door is there
  slide:   1500,   // the leaves begin to part
  slideMs: 1650,
  dolly:   2720,   // open enough to walk through
  dollyMs: 2230,
  out:     4960,   // the world underneath is revealed
  done:    5220,
};

export const MEDATHON_INTRO_MS = T.done;

export default function MedathonIntro({ onDone, muted = false }) {
  // 'off' is the television dying; 'lit' is everything from the note onward.
  const [lit, setLit] = useState(false);
  const doneRef = useRef(false);

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
    // Mount-only: the sequence owns its own clock from the moment it appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The door scene is display:none until the note, and a hidden element's
  // animations do not tick — they begin the moment it is shown. So every cue
  // inside it is handed over as an offset FROM the note, not from mount.
  // Scene one's cues are measured from mount, because the line is never
  // hidden. Get this wrong and the doors open a second and a half late.
  const since = (ms) => `${ms - T.note}ms`;
  const vars = {
    '--t-line': `${T.line}ms`,
    '--t-point': `${T.point}ms`,
    '--t-dark': `${T.dark}ms`,
    '--t-slide': since(T.slide),
    '--d-slide': `${T.slideMs}ms`,
    '--t-dolly': since(T.dolly),
    '--d-dolly': `${T.dollyMs}ms`,
    '--t-out': since(T.out),
    '--d-out': `${T.done - T.out}ms`,
  };

  return createPortal(
    <div className={`mi${lit ? ' is-lit' : ''}`} style={vars} aria-hidden="true">
      {/* Scene 1 lives on top of the collapsing page. */}
      <span className="mi-line" />

      {/* Everything from the note onward. Held at display:none until then so
          not one pixel of it can be seen before the string is struck. */}
      <div className="mi-scene">
        <div className="mi-world">
          {/* Beyond the doorway: a warm room with floor and posts set at
              different depths, so walking in gives real parallax rather than
              a picture being scaled up. */}
          <div className="mi-room">
            <span className="mi-back" />
            <span className="mi-far" />
            <span className="mi-floor" />
            <span className="mi-post mi-post--l1" />
            <span className="mi-post mi-post--r1" />
            <span className="mi-post mi-post--l2" />
            <span className="mi-post mi-post--r2" />
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
    </div>,
    document.body,
  );
}
