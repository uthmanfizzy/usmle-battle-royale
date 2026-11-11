import { useEffect, useMemo, useRef, useState } from 'react';
import { buildSignal } from './ecgEngine';
import { annotate, windowStart } from './ecgAnnotate';
import { PAPER_SPEED, GAIN, MARGIN_MM, LOOKS, drawPaper, baselineY } from './ECGStrip';

/**
 * A still strip with its features labelled — the "here is what you were
 * looking at" view shown after an answer.
 *
 * Same paper, same scale and same signal as the live strip (pass the same
 * seed and it is the very strip the player just read), frozen on a window
 * chosen to contain the thing worth seeing: a whole Wenckebach cycle, the
 * beat before an ectopic, and so on. The marks come from ecgAnnotate, which
 * measures every number it writes off this signal.
 *
 * Point labels sit in rows along the top of each lead with a leader line down
 * to the feature; intervals are brackets below the trace; ST segments are a
 * shaded stretch. Rows are assigned so labels never overprint each other.
 * Notes that are not about one point go under the strip, in the page's own
 * type, where they can be read rather than squinted at.
 */
const LABEL_INK = {
  paper:   { ink: '#1d4ed8', alert: '#c2410c', pill: 'rgba(255, 255, 255, 0.94)', shade: 'rgba(29, 78, 216, 0.10)' },
  monitor: { ink: '#ffd166', alert: '#ff8a65', pill: 'rgba(0, 0, 0, 0.78)',       shade: 'rgba(255, 209, 102, 0.10)' },
};

export default function ECGLabelledStrip({ caseDef, seed = 1, rules, look = 'paper', title, tone = 'case' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const signal = useMemo(() => buildSignal(caseDef, seed), [caseDef, seed]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;

    const render = () => {
      const w = Math.max(280, wrap.clientWidth);
      // A little more magnification than the live strip — these are to be
      // studied, and the labels need room.
      const secs = Math.min(8, Math.max(3.2, (w - 60) / (6 * PAPER_SPEED)));
      const pxPerMm = w / (MARGIN_MM + secs * PAPER_SPEED);
      const nLeads = signal.leads.length;
      const bandMm = nLeads === 1 ? 42 : 30;
      const h = Math.round(nLeads * bandMm * pxPerMm);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const size = { w, h, pxPerMm, bandMm, dpr, traceMm: w / pxPerMm - MARGIN_MM };
      const L = LOOKS[look] || LOOKS.paper;
      const ink = LABEL_INK[look] || LABEL_INK.paper;

      const t0 = windowStart(caseDef, signal);
      const t1 = t0 + size.traceMm / PAPER_SPEED;
      const marks = annotate(rules, caseDef, signal, t0, t1);
      setNotes(marks.filter(m => m.kind === 'note').map(m => m.label));

      const g = canvas.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(drawPaper(size, L, signal), 0, 0, w, h);

      const x0 = MARGIN_MM * pxPerMm;
      const xOf = (t) => x0 + (t - t0) * PAPER_SPEED * pxPerMm;
      const yOf = (li, v) => baselineY(li, size) - v * GAIN * pxPerMm;

      // Shaded spans first, so the trace draws over them.
      for (const mk of marks.filter(m => m.kind === 'span')) {
        const top = mk.lead * bandMm * pxPerMm;
        g.fillStyle = ink.shade;
        g.fillRect(xOf(mk.t1), top, Math.max(2, xOf(mk.t2) - xOf(mk.t1)), bandMm * pxPerMm);
      }

      // The trace.
      g.save();
      g.beginPath();
      g.rect(x0, 0, size.traceMm * pxPerMm, h);
      g.clip();
      g.strokeStyle = L.ink;
      g.lineWidth = Math.max(1.3, pxPerMm * 0.3);
      g.lineJoin = 'round';
      g.lineCap = 'round';
      if (L.glow) { g.shadowColor = L.ink; g.shadowBlur = L.glow; }
      for (let li = 0; li < nLeads; li++) {
        g.beginPath();
        for (let px = 0; px <= size.traceMm * pxPerMm; px++) {
          const t = t0 + px / pxPerMm / PAPER_SPEED;
          const y = yOf(li, signal.value(li, t));
          if (px === 0) g.moveTo(x0 + px, y); else g.lineTo(x0 + px, y);
        }
        g.stroke();
      }
      g.restore();
      g.shadowBlur = 0;

      // Labels.
      const font = Math.max(10.5, Math.min(13, pxPerMm * 1.9));
      g.font = `700 ${font}px Inter, system-ui, sans-serif`;
      g.textBaseline = 'middle';
      const lineH = font + 7;
      const pad = 5;
      const occupied = new Map();          // `${lead}:${zone}:${row}` → [[x1, x2]]
      const place = (lead, zone, x1, x2, startRow = 0) => {
        for (let row = startRow; row < 8; row++) {
          const key = `${lead}:${zone}:${row}`;
          const taken = occupied.get(key) || [];
          if (taken.every(([a, b]) => x2 < a - 4 || x1 > b + 4)) {
            taken.push([x1, x2]);
            occupied.set(key, taken);
            return row;
          }
        }
        return 7;
      };
      const pill = (x, y, text, color) => {
        const tw = g.measureText(text).width;
        const bw = tw + pad * 2;
        const bx = Math.min(Math.max(x - bw / 2, x0 + 2), w - bw - 2);
        g.fillStyle = ink.pill;
        roundRect(g, bx, y - lineH / 2 + 2, bw, lineH - 4, 6);
        g.fill();
        g.strokeStyle = color;
        g.lineWidth = 1.2;
        g.stroke();
        g.fillStyle = color;
        g.fillText(text, bx + pad, y + 0.5);
        return [bx, bx + bw];
      };

      // Point labels (and span labels) in rows along the top of the lead.
      for (const mk of marks.filter(m => m.kind === 'point' || m.kind === 'span')) {
        const t = mk.kind === 'span' ? (mk.t1 + mk.t2) / 2 : mk.t;
        const x = xOf(t);
        if (x < x0 || x > w) continue;
        const color = mk.alert ? ink.alert : ink.ink;
        const text = mk.label;
        const tw = g.measureText(text).width + pad * 2;
        const row = place(mk.lead, 'top', x - tw / 2, x + tw / 2);
        const top = mk.lead * bandMm * pxPerMm;
        const ly = top + lineH * 0.7 + row * lineH;
        const py = yOf(mk.lead, signal.value(mk.lead, t));
        // Leader line from the label to the feature, with a dot on it.
        g.strokeStyle = color;
        g.lineWidth = 1.2;
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(x, ly + lineH / 2 - 2);
        g.lineTo(x, py);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = color;
        g.beginPath();
        g.arc(x, py, mk.small ? 2.6 : 3.4, 0, Math.PI * 2);
        g.fill();
        pill(x, ly, text, color);
      }

      // Interval brackets below the trace. All brackets in a lead stack from
      // ONE shared line — below the lowest point any of them spans — so rows
      // mean the same height everywhere and the collision check holds.
      // (Stacking each from its own low point let a short bracket's row 0
      // land on a long bracket's row 1, and their labels overprinted.)
      const intervals = marks.filter(m => m.kind === 'interval');
      const floor = new Map();
      for (const mk of intervals) {
        const xa = xOf(mk.t1), xb = xOf(mk.t2);
        let lowest = floor.get(mk.lead) ?? baselineY(mk.lead, size);
        for (let x = Math.max(x0, xa); x <= Math.min(w, xb); x += 2) {
          const t = t0 + (x - x0) / pxPerMm / PAPER_SPEED;
          lowest = Math.max(lowest, yOf(mk.lead, signal.value(mk.lead, t)));
        }
        floor.set(mk.lead, lowest);
      }
      for (const mk of intervals) {
        const xa = xOf(mk.t1), xb = xOf(mk.t2);
        if (xb < x0 || xa > w) continue;
        const text = mk.label;
        const tw = g.measureText(text).width + pad * 2;
        const mid = (xa + xb) / 2;
        const row = place(mk.lead, 'bottom', Math.min(xa, mid - tw / 2), Math.max(xb, mid + tw / 2), mk.row || 0);
        const by = floor.get(mk.lead) + 2.5 * pxPerMm + row * (lineH + 6);
        g.strokeStyle = ink.ink;
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(xa, by - 4); g.lineTo(xa, by + 4);
        g.moveTo(xa, by); g.lineTo(xb, by);
        g.moveTo(xb, by - 4); g.lineTo(xb, by + 4);
        g.stroke();
        pill(mid, by + lineH / 2 + 3, text, ink.ink);
      }
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [signal, caseDef, rules, look]);

  return (
    <figure className={`ecgl ecgl--${tone}`}>
      {title && <figcaption className="ecgl-title">{title}</figcaption>}
      <div className={`ecg-strip ecg-strip--${look}`} ref={wrapRef}>
        <canvas ref={canvasRef} role="img" aria-label={`${title || 'ECG'} — labelled`} />
      </div>
      {notes.length > 0 && (
        <ul className="ecgl-notes">
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </figure>
  );
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
