import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A page of notebook paper to draw on — the 2×2 drawn by hand, the way it
 * is done in a book or on the exam's noteboard.
 *
 * Pointer Events throughout, so a mouse, a finger and a stylus all work;
 * a stylus's pressure thickens the ink. Strokes are smoothed through the
 * midpoints of successive samples (quadratic curves) so handwriting looks
 * like handwriting rather than a polyline.
 *
 * Tools: pen (black / blue / red), a LINE tool for the straight lines of
 * the grid (drag from one end to the other), an eraser, undo and clear.
 *
 * Strokes are kept as data in coordinates relative to the pad's width, so
 * the drawing survives a resize or rotating a phone and can be redrawn
 * exactly. The ruled paper is CSS behind a transparent canvas, so erasing
 * never rubs out the lines of the page.
 */

const INKS = { black: '#1c1d2b', blue: '#1f4fd1', red: '#c4223a' };
const ASPECT = 0.62;

export default function DrawPad({ readOnly = false, store = null }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  // [{ tool, ink, w, pts: [[x, y, p]] }] — x, y as fractions of width.
  // When the page passes a `store`, the strokes live THERE, so the drawing
  // survives this pad being unmounted (switching to another table mode and
  // back). The array is only ever mutated in place, never replaced.
  const strokesRef = useRef(null);
  if (!strokesRef.current) strokesRef.current = store ? store.strokes : [];
  const liveRef = useRef(null);
  const sizeRef = useRef({ w: 600, h: 372, dpr: 1 });
  const [tool, setTool] = useState('pen');
  const [ink, setInk] = useState('black');
  const [count, setCount] = useState(0);   // re-render when strokes change (undo enabled etc.)

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const { w, h, dpr } = sizeRef.current;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const all = liveRef.current ? [...strokesRef.current, liveRef.current] : strokesRef.current;
    for (const s of all) drawStroke(g, s, w);
  }, []);

  // Size to the box; keep the drawing.
  useEffect(() => {
    const wrap = wrapRef.current, c = canvasRef.current;
    if (!wrap || !c) return undefined;
    const layout = () => {
      const w = wrap.clientWidth;
      const h = Math.max(240, Math.round(w * ASPECT));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = `${w}px`; c.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
      redraw();
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const w = sizeRef.current.w;
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
    return [(e.clientX - r.left) / w, (e.clientY - r.top) / w, p];
  };

  const down = (e) => {
    if (readOnly) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const pt = pos(e);
    liveRef.current = {
      tool, ink,
      w: tool === 'eraser' ? 26 : tool === 'line' ? 2.6 : 2.8,
      pts: [pt, ...(tool === 'line' ? [pt] : [])],
    };
    redraw();
  };
  const move = (e) => {
    const s = liveRef.current;
    if (!s) return;
    e.preventDefault();
    const pt = pos(e);
    if (s.tool === 'line') s.pts[1] = pt;
    else {
      const last = s.pts[s.pts.length - 1];
      const d = Math.hypot(pt[0] - last[0], pt[1] - last[1]) * sizeRef.current.w;
      if (d < 1.2) return;            // ignore jitter
      s.pts.push(pt);
    }
    redraw();
  };
  const up = () => {
    const s = liveRef.current;
    if (!s) return;
    liveRef.current = null;
    // A tap still leaves a dot (a decimal point, a dot on an i).
    strokesRef.current.push(s);
    setCount(n => n + 1);
    redraw();
  };

  const undo = () => { strokesRef.current.pop(); setCount(n => n + 1); redraw(); };
  const clear = () => { strokesRef.current.length = 0; setCount(n => n + 1); redraw(); };

  // Ctrl/Cmd+Z undoes the last stroke.
  useEffect(() => {
    if (readOnly) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && strokesRef.current.length) { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const has = strokesRef.current.length > 0;
  return (
    <div className={`bsl-pad${readOnly ? ' is-readonly' : ''}`} data-strokes={count}>
      {!readOnly && (
        <div className="bsl-pad-tools" role="toolbar" aria-label="Drawing tools">
          <div className="bsl-pad-group">
            <button type="button" className={tool === 'pen' ? 'is-on' : ''} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')} title="Pen">🖊️ Pen</button>
            <button type="button" className={tool === 'line' ? 'is-on' : ''} aria-pressed={tool === 'line'} onClick={() => setTool('line')} title="Straight line — drag from one end to the other">📏 Line</button>
            <button type="button" className={tool === 'eraser' ? 'is-on' : ''} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser">🧽 Eraser</button>
          </div>
          <div className="bsl-pad-group" aria-label="Ink colour">
            {Object.entries(INKS).map(([k, c]) => (
              <button
                key={k}
                type="button"
                className={`bsl-pad-ink${ink === k && tool !== 'eraser' ? ' is-on' : ''}`}
                style={{ '--ink': c }}
                aria-label={`${k} ink`}
                aria-pressed={ink === k}
                onClick={() => { setInk(k); if (tool === 'eraser') setTool('pen'); }}
              />
            ))}
          </div>
          <div className="bsl-pad-group">
            <button type="button" onClick={undo} disabled={!has} title="Undo (Ctrl+Z)">↶ Undo</button>
            <button type="button" onClick={clear} disabled={!has} title="Clear the page">Clear</button>
          </div>
        </div>
      )}
      <div className="bsl-pad-paper" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className={`bsl-pad-canvas is-${tool}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={(e) => { if (liveRef.current && e.buttons === 0) up(); }}
          role="img"
          aria-label={readOnly ? 'Your hand-drawn table' : 'Drawing pad — draw your 2×2 table and fill it in'}
        />
        {!has && !readOnly && (
          <p className="bsl-pad-hint">Draw your 2×2 here — two lines across, two down — then write the numbers in. Use 📏 Line for straight lines.</p>
        )}
      </div>
    </div>
  );
}

function drawStroke(g, s, w) {
  const pts = s.pts.map(([x, y, p]) => [x * w, y * w, p]);
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (s.tool === 'eraser') {
    g.globalCompositeOperation = 'destination-out';
    g.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    g.strokeStyle = INKS[s.ink] || INKS.black;
  }
  const width = (p) => (s.tool === 'eraser' ? s.w : s.w * (0.55 + p * 0.9));

  if (pts.length === 1 || (s.tool === 'line' && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) < 1)) {
    g.fillStyle = g.strokeStyle;
    if (s.tool === 'eraser') g.fillStyle = 'rgba(0,0,0,1)';
    g.beginPath();
    g.arc(pts[0][0], pts[0][1], width(pts[0][2]) / 2, 0, Math.PI * 2);
    g.fill();
  } else if (s.tool === 'line') {
    g.lineWidth = width(0.5);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    g.lineTo(pts[1][0], pts[1][1]);
    g.stroke();
  } else {
    // Midpoint-quadratic smoothing, segment by segment so pressure can vary.
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const m0 = i === 1 ? a : [(pts[i - 2][0] + a[0]) / 2, (pts[i - 2][1] + a[1]) / 2];
      const m1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      g.lineWidth = width((a[2] + b[2]) / 2);
      g.beginPath();
      g.moveTo(m0[0], m0[1]);
      g.quadraticCurveTo(a[0], a[1], m1[0], m1[1]);
      if (i === pts.length - 1) g.lineTo(b[0], b[1]);
      g.stroke();
    }
  }
  g.restore();
}
