import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BEAT, SYS, beatEvents, envelope, segmentSpan, renderMurmur, breathAt,
} from './murmurEngine';
import { SITES } from './murmurData';

// ── One stethoscope at a time ───────────────────────────────────────────
// Every panel can play, but only one sound at once: starting one stops the
// other, so comparing two murmurs never turns into hearing both.
let ctx = null;
let current = null;            // { stop() }
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = AC ? new AC() : null;
  }
  return ctx;
}
export function stopAllMurmurs() { if (current) current.stop(); }

/**
 * Plays a murmur spec on a loop and reports where in the loop it is, so the
 * diagram's playhead can follow the sound.
 */
function useMurmurAudio(spec, seed) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);              // seconds into the loop
  const handle = useRef(null);
  const rendered = useMemo(() => renderMurmur(spec, 22050, seed), [spec, seed]);

  const stop = useCallback(() => {
    const h = handle.current;
    if (!h) return;
    handle.current = null;
    try { h.src.stop(); } catch { /* already stopped */ }
    cancelAnimationFrame(h.raf);
    if (current === h) current = null;
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const ac = audioCtx();
    if (!ac) return;
    if (current) current.stop();
    if (ac.state === 'suspended') ac.resume();
    const buf = ac.createBuffer(1, rendered.samples.length, rendered.sampleRate);
    buf.copyToChannel(rendered.samples, 0);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ac.createGain();
    gain.gain.value = 0.9;
    src.connect(gain).connect(ac.destination);
    const startedAt = ac.currentTime + 0.03;
    src.start(startedAt);
    const loopLen = buf.duration;
    const h = { src, raf: 0, stop: () => {} };
    const tick = () => {
      setPos(Math.max(0, (ac.currentTime - startedAt) % loopLen));
      h.raf = requestAnimationFrame(tick);
    };
    h.raf = requestAnimationFrame(tick);
    h.stop = stop;
    handle.current = h;
    current = h;
    setPlaying(true);
  }, [rendered, stop]);

  // A new sound, or the panel going away, silences the old one.
  useEffect(() => stop, [rendered, stop]);

  return { playing, pos, toggle: () => (playing ? stop() : play()), stop };
}

// ── The diagram ─────────────────────────────────────────────────────────
const W = 1000;
const H = 230;
const X0 = 46;
const X1 = W - 30;
const BASE = 128;
const x = (t) => X0 + (t / BEAT) * (X1 - X0);

/**
 * A phonocardiogram of one beat, drawn from the same spec the audio is
 * synthesised from: S1 and S2 as bars, the murmur as the filled shape of its
 * loudness between them, clicks, snaps and gallops where they fall.
 */
export function MurmurDiagram({ spec, insp = true, playhead = null, compact = false }) {
  const events = beatEvents(spec, insp);
  const shapes = (spec.segments || []).map((seg, i) => {
    const [a, b] = segmentSpan(seg);
    const pts = [];
    const N = 90;
    const amp = (seg.amp ?? 0.8) * 62;
    for (let k = 0; k <= N; k++) {
      const u = k / N;
      pts.push([x(a + u * (b - a)), envelope(seg.shape, u, seg.peak) * amp]);
    }
    const top = pts.map(([px, h]) => `${px.toFixed(1)},${(BASE - h).toFixed(1)}`);
    const bottom = pts.slice().reverse().map(([px, h]) => `${px.toFixed(1)},${(BASE + h * 0.55).toFixed(1)}`);
    return <polygon key={i} className={`murm-shape murm-shape--${seg.quality || 'blowing'}`} points={[...top, ...bottom].join(' ')} />;
  });

  return (
    <svg className={`murm-diagram${compact ? ' is-compact' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Phonocardiogram of one heartbeat">
      {/* Systole and diastole bands */}
      <rect className="murm-band murm-band--sys" x={x(0)} y={22} width={x(SYS) - x(0)} height={H - 52} />
      <rect className="murm-band murm-band--dia" x={x(SYS)} y={22} width={x(BEAT) - x(SYS)} height={H - 52} />
      <text className="murm-band-label" x={(x(0) + x(SYS)) / 2} y={H - 10}>SYSTOLE</text>
      <text className="murm-band-label" x={(x(SYS) + x(BEAT)) / 2} y={H - 10}>DIASTOLE</text>

      <line className="murm-base" x1={X0 - 10} x2={X1 + 10} y1={BASE} y2={BASE} />
      {shapes}

      {events.map((e, i) => {
        const h = Math.max(14, e.amp * (e.kind === 'S1' || e.kind === 'A2' || e.kind === 'P2' ? 78 : 52));
        const px = x(e.t);
        return (
          <g key={i} className={`murm-ev murm-ev--${e.kind}`}>
            <rect x={px - 3.5} y={BASE - h} width={7} height={h * 1.5} rx={2} />
            {e.label && <text x={px} y={BASE - h - 8}>{e.label}</text>}
          </g>
        );
      })}
      {/* The next S1, so the cycle reads as a loop */}
      {(spec.s1 ?? 1) > 0 && (
        <g className="murm-ev murm-ev--S1 is-next">
          <rect x={x(BEAT) - 3.5} y={BASE - 78 * (spec.s1 ?? 1)} width={7} height={78 * (spec.s1 ?? 1) * 1.5} rx={2} />
        </g>
      )}

      {playhead != null && <line className="murm-playhead" x1={x(playhead)} x2={x(playhead)} y1={18} y2={H - 26} />}
    </svg>
  );
}

// ── Where it is loudest ─────────────────────────────────────────────────
export function ChestMap({ site, radiation }) {
  const s = SITES[site];
  if (!s) return null;
  const cx = 20 + s.x * 160;
  const cy = 12 + s.y * 200;
  return (
    <figure className="murm-chest">
      <svg viewBox="0 0 200 220" aria-hidden="true">
        <path className="murm-torso" d="M40 20 Q100 2 160 20 L178 70 Q186 140 170 214 L30 214 Q14 140 22 70 Z" />
        <line className="murm-clav" x1="52" y1="34" x2="96" y2="40" />
        <line className="murm-clav" x1="148" y1="34" x2="104" y2="40" />
        <rect className="murm-sternum" x="93" y="40" width="14" height="96" rx="5" />
        {[64, 84, 104, 124].map((y) => (
          <path key={y} className="murm-rib" d={`M44 ${y + 6} Q70 ${y - 4} 92 ${y}`} />
        ))}
        {[64, 84, 104, 124].map((y) => (
          <path key={`r${y}`} className="murm-rib" d={`M156 ${y + 6} Q130 ${y - 4} 108 ${y}`} />
        ))}
        <path className="murm-heart" d="M96 92 Q120 78 140 100 Q150 128 132 132 Q112 132 100 122 Q90 108 96 92 Z" />
        <circle className="murm-site-pulse" cx={cx} cy={cy} r="15" />
        <circle className="murm-site" cx={cx} cy={cy} r="7" />
      </svg>
      <figcaption>
        <strong>Loudest:</strong> {s.label}
        {radiation && radiation !== '—' && <><br /><strong>Radiates:</strong> {radiation}</>}
      </figcaption>
    </figure>
  );
}

// ── The stethoscope panel: play + diagram ───────────────────────────────
/**
 * Play button, the breathing phase, and (if shown) the diagram with a
 * playhead following the sound.
 */
export default function MurmurPanel({ murmur, seed = 1, showDiagram = true, title, tone }) {
  const { playing, pos, toggle } = useMurmurAudio(murmur.spec, seed);
  const breath = breathAt(pos);
  return (
    <div className={`murm-panel${tone ? ` murm-panel--${tone}` : ''}`}>
      {title && <div className="murm-panel-title">{title}</div>}
      <div className="murm-panel-bar">
        <button type="button" className={`murm-play${playing ? ' is-on' : ''}`} onClick={toggle} aria-pressed={playing}>
          {playing ? '❚❚ Pause' : '▶ Listen'}
        </button>
        <span className={`murm-breath${playing ? '' : ' is-idle'}${breath.inspiration ? ' is-in' : ' is-out'}`}>
          🫁 {playing ? (breath.inspiration ? 'Breathing in' : 'Breathing out') : '2 beats in · 2 beats out'}
        </span>
        <span className="murm-hint">🎧 Headphones help with the low sounds</span>
      </div>
      {showDiagram ? (
        <MurmurDiagram spec={murmur.spec} insp={playing ? breath.inspiration : true} playhead={playing ? breath.inBeat * BEAT : null} />
      ) : (
        <div className={`murm-scope${playing ? ' is-on' : ''}`} aria-hidden="true">
          <span className="murm-scope-dot" key={playing ? Math.floor(pos / BEAT) : 'idle'} />
        </div>
      )}
    </div>
  );
}
