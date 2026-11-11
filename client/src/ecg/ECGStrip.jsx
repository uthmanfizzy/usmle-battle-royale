import { useEffect, useRef } from 'react';

/**
 * An ECG strip that is being recorded as you watch.
 *
 * TRUE SCALE. Paper speed 25 mm/s and gain 10 mm/mV, on a 1 mm / 5 mm grid,
 * with the 1 mV calibration pulse at the start of every lead. The pixel size
 * of a millimetre is chosen from the width available, but the RATIO is never
 * bent: one small square is always 0.04 s and 0.1 mV, one large square always
 * 0.2 s and 0.5 mV. That is the whole point — a strip you cannot count boxes
 * on cannot be read, and counting boxes is the skill.
 *
 * ANIMATED LIKE A MONITOR. A write-head sweeps left to right at paper speed,
 * drawing the live trace; a short erased gap runs ahead of it, and behind the
 * gap is the previous sweep. Every pixel is computed from absolute time each
 * frame, so pausing is exact and nothing drifts.
 *
 * The strip starts FULL: the first frame already shows a complete sweep
 * rather than an empty grid filling up, because the first few seconds of a
 * question are when you most want something to read.
 *
 * Props:
 *   signal   from buildSignal(): { leads, value(li, t), lastQrsBefore(t) }
 *   paused   freeze the sweep for counting
 *   look     'paper' (pink grid, dark ink) or 'monitor' (green on black)
 *   onBeat   called when a QRS passes the write-head (for a pulse indicator)
 */
export const PAPER_SPEED = 25;      // mm per second
export const GAIN = 10;             // mm per mV
export const MARGIN_MM = 14;        // left margin: lead label + calibration pulse
const GAP_MM = 9;            // the erased band ahead of the write-head

export const LOOKS = {
  paper: {
    bg: '#fff4f2',
    minor: 'rgba(232, 120, 120, 0.28)',
    major: 'rgba(214, 72, 72, 0.55)',
    ink: '#1a1622',
    label: '#7a2a2a',
    head: 'rgba(214, 54, 60, 0.9)',
    glow: 0,
  },
  monitor: {
    bg: '#04120b',
    minor: 'rgba(60, 220, 140, 0.07)',
    major: 'rgba(60, 220, 140, 0.18)',
    ink: '#3dff96',
    label: 'rgba(120, 255, 180, 0.8)',
    head: 'rgba(160, 255, 200, 1)',
    glow: 8,
  },
};

export default function ECGStrip({ signal, paused = false, look = 'paper', onBeat, ariaLabel }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const paperRef = useRef(null);          // the grid, drawn once per size
  const sizeRef = useRef({ w: 0, h: 0, pxPerMm: 4, bandMm: 40, dpr: 1 });
  const clockRef = useRef({ elapsed: 0, last: null });
  const pausedRef = useRef(paused);
  const lastBeatRef = useRef(null);
  const onBeatRef = useRef(onBeat);
  pausedRef.current = paused;
  onBeatRef.current = onBeat;

  const nLeads = signal?.leads?.length || 1;

  // Size the canvas to its box, at device pixel ratio, and redraw the paper.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;

    const layout = () => {
      const w = Math.max(280, wrap.clientWidth);
      // Aim for ~5 px per mm, which makes a small square easily countable,
      // but always show at least 4 s of trace so a slow rhythm has two beats.
      let secs = Math.min(10, Math.max(4, (w - 60) / (5 * PAPER_SPEED)));
      const pxPerMm = w / (MARGIN_MM + secs * PAPER_SPEED);
      // One lead gets a tall band; several share the height, as on a 12-lead.
      const bandMm = nLeads === 1 ? 36 : 26;
      const h = Math.round(nLeads * bandMm * pxPerMm);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h, pxPerMm, bandMm, dpr, traceMm: w / pxPerMm - MARGIN_MM };
      paperRef.current = drawPaper(sizeRef.current, LOOKS[look] || LOOKS.paper, signal);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [nLeads, look, signal]);

  // A new case starts with a full sweep already on the strip.
  useEffect(() => {
    const traceMm = sizeRef.current.traceMm || 200;
    clockRef.current = { elapsed: traceMm / PAPER_SPEED + 0.5, last: null };
    lastBeatRef.current = null;
  }, [signal]);

  // The sweep.
  useEffect(() => {
    if (!signal) return undefined;
    let raf = 0;
    const frame = (now) => {
      const clock = clockRef.current;
      if (clock.last == null) clock.last = now;
      const dt = Math.min(0.1, (now - clock.last) / 1000);   // a background tab must not fast-forward
      clock.last = now;
      if (!pausedRef.current) clock.elapsed += dt;

      draw(canvasRef.current, sizeRef.current, paperRef.current, LOOKS[look] || LOOKS.paper, signal, clock.elapsed);

      // Tell the page a beat went by, so its heart can pulse in time.
      if (!pausedRef.current && onBeatRef.current) {
        const q = signal.lastQrsBefore(clock.elapsed);
        if (q != null && q !== lastBeatRef.current) {
          lastBeatRef.current = q;
          onBeatRef.current();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [signal, look]);

  return (
    <div className={`ecg-strip ecg-strip--${look}`} ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel || 'ECG strip'} />
    </div>
  );
}

// ── Paper ─────────────────────────────────────────────────────────────────
export function drawPaper(size, L, signal) {
  const { w, h, pxPerMm, bandMm, dpr } = size;
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.fillStyle = L.bg;
  g.fillRect(0, 0, w, h);

  // 1 mm minor lines, then 5 mm major lines over them.
  const mmW = w / pxPerMm, mmH = h / pxPerMm;
  g.lineWidth = 1;
  g.strokeStyle = L.minor;
  g.beginPath();
  for (let x = 0; x <= mmW; x += 1) { const px = Math.round(x * pxPerMm) + 0.5; g.moveTo(px, 0); g.lineTo(px, h); }
  for (let y = 0; y <= mmH; y += 1) { const py = Math.round(y * pxPerMm) + 0.5; g.moveTo(0, py); g.lineTo(w, py); }
  g.stroke();
  g.strokeStyle = L.major;
  g.lineWidth = 1.2;
  g.beginPath();
  for (let x = 0; x <= mmW; x += 5) { const px = Math.round(x * pxPerMm) + 0.5; g.moveTo(px, 0); g.lineTo(px, h); }
  for (let y = 0; y <= mmH; y += 5) { const py = Math.round(y * pxPerMm) + 0.5; g.moveTo(0, py); g.lineTo(w, py); }
  g.stroke();

  // Per lead: the name, and the standard calibration pulse — 1 mV (10 mm)
  // tall, 0.2 s (5 mm) wide. It is how a reader confirms the gain before
  // trusting any voltage on the strip.
  const leads = signal?.leads || [{ name: 'II' }];
  leads.forEach((lead, li) => {
    const base = baselineY(li, size);
    g.fillStyle = L.label;
    g.font = `700 ${Math.max(11, pxPerMm * 2.6)}px Inter, system-ui, sans-serif`;
    g.textBaseline = 'top';
    g.fillText(lead.name, 1.5 * pxPerMm, li * bandMm * pxPerMm + 1.2 * pxPerMm);
    g.strokeStyle = L.ink;
    g.lineWidth = Math.max(1.2, pxPerMm * 0.32);
    g.lineJoin = 'miter';
    g.beginPath();
    const x0 = 6 * pxPerMm;
    g.moveTo(x0 - 1.5 * pxPerMm, base);
    g.lineTo(x0, base);
    g.lineTo(x0, base - GAIN * pxPerMm);
    g.lineTo(x0 + 5 * pxPerMm, base - GAIN * pxPerMm);
    g.lineTo(x0 + 5 * pxPerMm, base);
    g.lineTo(x0 + 6.5 * pxPerMm, base);
    g.stroke();
  });
  return c;
}

// The isoelectric line sits a little below the middle of each band: R waves
// and ST elevation need more room above than S waves need below.
export function baselineY(li, size) {
  return (li * size.bandMm + size.bandMm * 0.56) * size.pxPerMm;
}

// ── One frame ─────────────────────────────────────────────────────────────
function draw(canvas, size, paper, L, signal, elapsed) {
  if (!canvas || !paper) return;
  const g = canvas.getContext('2d');
  const { w, h, pxPerMm, dpr } = size;
  const traceMm = size.traceMm;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.drawImage(paper, 0, 0, w, h);

  const x0 = MARGIN_MM * pxPerMm;
  const traceW = traceMm * pxPerMm;
  // Where the write-head is along the trace area, in mm.
  const headMm = (elapsed * PAPER_SPEED) % traceMm;

  g.lineWidth = Math.max(1.3, pxPerMm * 0.34);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = L.ink;
  if (L.glow) { g.shadowColor = L.ink; g.shadowBlur = L.glow; } else { g.shadowBlur = 0; }

  const leads = signal.leads.length;
  const step = 1;   // one sample per CSS pixel
  for (let li = 0; li < leads; li++) {
    const base = baselineY(li, size);
    g.save();
    // Clipped left and right only. A real 12-lead never clips a complex to
    // its own row — LBBB's deep S in V1 runs down into the next lead, and
    // flattening it at the band edge would misstate the very amplitude being
    // read. Overlap is what the paper does, so overlap is what this does.
    g.beginPath();
    g.rect(x0, 0, traceW, h);
    g.clip();
    g.beginPath();
    let pen = false;
    for (let px = 0; px <= traceW; px += step) {
      const mm = px / pxPerMm;
      let behind = headMm - mm;                 // mm since the head passed here
      if (behind < 0) behind += traceMm;        // last sweep
      // The erased band just ahead of the head.
      if (behind > traceMm - GAP_MM) { pen = false; continue; }
      const t = elapsed - behind / PAPER_SPEED;
      const y = base - signal.value(li, t) * GAIN * pxPerMm;
      if (!pen) { g.moveTo(x0 + px, y); pen = true; } else g.lineTo(x0 + px, y);
    }
    g.stroke();
    g.restore();

    // The write-head: a bright point where the trace is being drawn now.
    const hx = x0 + headMm * pxPerMm;
    const hy = base - signal.value(li, elapsed) * GAIN * pxPerMm;
    g.shadowBlur = 0;
    g.fillStyle = L.head;
    g.beginPath();
    g.arc(hx, hy, Math.max(2.2, pxPerMm * 0.6), 0, Math.PI * 2);
    g.fill();
    const halo = g.createRadialGradient(hx, hy, 0, hx, hy, pxPerMm * 3);
    halo.addColorStop(0, L === LOOKS.monitor ? 'rgba(120,255,180,0.35)' : 'rgba(214,54,60,0.22)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(hx, hy, pxPerMm * 3, 0, Math.PI * 2);
    g.fill();
    if (L.glow) { g.shadowColor = L.ink; g.shadowBlur = L.glow; }
  }
  g.shadowBlur = 0;
}
