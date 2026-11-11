import { useEffect, useRef } from 'react';
import { LOOKS, PAPER_SPEED, GAIN, MARGIN_MM, drawPaper, baselineY } from './ECGStrip';

/**
 * A full 12-lead ECG, laid out the way a machine prints one: three rows of
 * four 2.5-second columns —
 *     I    aVR   V1   V4
 *     II   aVL   V2   V5
 *     III  aVF   V3   V6
 * — with a 10-second lead II rhythm strip underneath. All four columns of a
 * row are consecutive slices of the SAME ten seconds, exactly as on paper,
 * so a beat that starts in lead I carries on in aVR.
 *
 * Same true scale and the same write-head sweep as ECGStrip (25 mm/s,
 * 10 mm/mV, small square 0.04 s / 0.1 mV), drawn across all rows at once.
 * The page is wide by nature: below about 720 px it scrolls sideways inside
 * its own box rather than shrinking the squares past countable.
 *
 * Props: signal — buildSignal(twelveLeadCase(caseDef)); paused; look; onBeat.
 */
const GRID = [
  ['I', 'aVR', 'V1', 'V4'],
  ['II', 'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6'],
];
const RHYTHM = 'II';
const SECONDS = 10;
const TRACE_MM = SECONDS * PAPER_SPEED;        // 250 mm
const COL_MM = TRACE_MM / 4;                   // 62.5 mm = 2.5 s
const BAND_MM = 30;
const GAP_MM = 6;
const MIN_W = 720;

export default function ECG12Lead({ signal, paused = false, look = 'paper', onBeat }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const paperRef = useRef(null);
  const sizeRef = useRef(null);
  const clockRef = useRef({ elapsed: 0, last: null });
  const pausedRef = useRef(paused);
  const onBeatRef = useRef(onBeat);
  const lastBeatRef = useRef(null);
  pausedRef.current = paused;
  onBeatRef.current = onBeat;

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas || !signal) return undefined;
    const L = LOOKS[look] || LOOKS.paper;
    const layout = () => {
      const w = Math.max(MIN_W, wrap.clientWidth);
      const pxPerMm = w / (MARGIN_MM + TRACE_MM);
      const h = Math.round(4 * BAND_MM * pxPerMm);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const size = { w, h, pxPerMm, bandMm: BAND_MM, dpr };
      sizeRef.current = size;
      // The grid and a calibration pulse per row, then the lead names at the
      // start of each column and the little column-change ticks.
      const paper = drawPaper(size, L, { leads: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }] });
      const g = paper.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = L.label;
      g.font = `700 ${Math.max(11, pxPerMm * 2.6)}px Inter, system-ui, sans-serif`;
      g.textBaseline = 'top';
      const rows = [...GRID, [RHYTHM]];
      rows.forEach((row, ri) => {
        row.forEach((name, ci) => {
          const x = (MARGIN_MM + ci * COL_MM) * pxPerMm;
          g.fillText(ri === 3 ? `${name} — rhythm strip` : name, x + 1.5 * pxPerMm, ri * BAND_MM * pxPerMm + 1.2 * pxPerMm);
          if (ci > 0) {
            const base = baselineY(ri, size);
            g.strokeStyle = L.ink;
            g.lineWidth = Math.max(1.2, pxPerMm * 0.3);
            g.beginPath();
            g.moveTo(x, base - 3 * pxPerMm);
            g.lineTo(x, base + 3 * pxPerMm);
            g.stroke();
          }
        });
      });
      paperRef.current = paper;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [signal, look]);

  // Start with a full page already printed.
  useEffect(() => {
    clockRef.current = { elapsed: SECONDS + 0.4, last: null };
    lastBeatRef.current = null;
  }, [signal]);

  useEffect(() => {
    if (!signal) return undefined;
    const L = LOOKS[look] || LOOKS.paper;
    const idx = Object.fromEntries(signal.leads.map((l, i) => [l.name, i]));
    let raf = 0;
    const frame = (now) => {
      const clock = clockRef.current;
      if (clock.last == null) clock.last = now;
      const dt = Math.min(0.1, (now - clock.last) / 1000);
      clock.last = now;
      if (!pausedRef.current) clock.elapsed += dt;
      draw(canvasRef.current, sizeRef.current, paperRef.current, L, signal, idx, clock.elapsed);
      if (!pausedRef.current && onBeatRef.current) {
        const q = signal.lastQrsBefore(clock.elapsed);
        if (q != null && q !== lastBeatRef.current) { lastBeatRef.current = q; onBeatRef.current(); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [signal, look]);

  return (
    <div className={`ecg-strip ecg-strip--${look} ecg-12`} ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label="Full 12-lead ECG: I, II, III, aVR, aVL, aVF and V1 to V6, with a lead II rhythm strip" />
    </div>
  );
}

function draw(canvas, size, paper, L, signal, idx, elapsed) {
  if (!canvas || !paper || !size) return;
  const g = canvas.getContext('2d');
  const { w, h, pxPerMm, dpr } = size;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.drawImage(paper, 0, 0, w, h);
  const x0 = MARGIN_MM * pxPerMm;
  const headMm = (elapsed * PAPER_SPEED) % TRACE_MM;
  g.lineWidth = Math.max(1.2, pxPerMm * 0.3);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = L.ink;
  if (L.glow) { g.shadowColor = L.ink; g.shadowBlur = L.glow * 0.7; } else g.shadowBlur = 0;

  const rows = [...GRID, [RHYTHM]];
  const traceW = TRACE_MM * pxPerMm;
  rows.forEach((row, ri) => {
    const base = baselineY(ri, size);
    g.beginPath();
    let pen = false, lastCol = -1;
    for (let px = 0; px <= traceW; px += 1) {
      const mm = px / pxPerMm;
      const col = row.length === 1 ? 0 : Math.min(3, Math.floor(mm / COL_MM));
      let behind = headMm - mm;
      if (behind < 0) behind += TRACE_MM;
      if (behind > TRACE_MM - GAP_MM) { pen = false; continue; }
      // A new column is a new lead: lift the pen at the boundary.
      if (col !== lastCol) { pen = false; lastCol = col; }
      const t = elapsed - behind / PAPER_SPEED;
      const y = base - signal.value(idx[row[col]], t) * GAIN * pxPerMm;
      if (!pen) { g.moveTo(x0 + px, y); pen = true; } else g.lineTo(x0 + px, y);
    }
    g.stroke();
  });

  // One write-head across the whole page.
  g.shadowBlur = 0;
  const hx = x0 + headMm * pxPerMm;
  g.fillStyle = L.head;
  g.fillRect(hx - 1, 0, 2, h);
}
