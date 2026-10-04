import { useState, useRef, useEffect, useMemo } from 'react';
import labValues from '../labValues';
import { labsWithValuesIn } from '../utils/labMatch';
import './LabValues.css';

const EXAMS = ['USMLE', 'PLAB'];

function readExam() {
  try {
    const saved = localStorage.getItem('mr_lab_exam');
    if (EXAMS.includes(saved)) return saved;
  } catch {}
  return 'USMLE';
}

export default function LabValues({ onClose, questionText = '' }) {
  const [exam, setExam] = useState(readExam);
  const [query, setQuery] = useState('');
  // The tab row is three-way: USMLE and PLAB are unit systems showing the whole
  // sheet, "This question" is the same sheet filtered to what the stem names.
  // Exactly one is active, so there is never a question about what is on screen;
  // the question tab uses whichever unit system was last chosen.
  const [scope, setScope] = useState('question');

  // Draggable panel (desktop). On mobile CSS pins it as a bottom sheet.
  const [position, setPosition] = useState({ x: Math.max(16, window.innerWidth - 400), y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Persist the exam choice
  useEffect(() => {
    try { localStorage.setItem('mr_lab_exam', exam); } catch {}
  }, [exam]);

  const handleMouseDown = (e) => {
    // Only drag from the header, never from controls / list
    if (!e.target.closest('.lab-header')) return;
    if (e.target.closest('.lab-close-btn')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    const up = () => setIsDragging(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, [isDragging, dragOffset]);

  // What this question mentions, for the scope switch and its count.
  // Each row carries the figure the question gave for it, and whether that is
  // above or below the range — reading "LDH 420 (140–280) HIGH" is the whole
  // job, and doing it in your head under time pressure is where mistakes live.
  const mentioned = useMemo(
    () => labsWithValuesIn(questionText, labValues[exam] || []),
    [questionText, exam],
  );
  // A stem that names nothing (or a panel opened outside a question) falls
  // back to the full sheet rather than showing "nothing here".
  const effectiveScope = mentioned.length === 0 ? 'all' : scope;

  // Filter + group by category for the selected exam
  const grouped = useMemo(() => {
    const list = effectiveScope === 'question' ? mentioned : (labValues[exam] || []);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            (r.units || '').toLowerCase().includes(q)
        )
      : list;
    const map = new Map();
    for (const row of filtered) {
      if (!map.has(row.category)) map.set(row.category, []);
      map.get(row.category).push(row);
    }
    return Array.from(map.entries()); // [ [category, rows[]], ... ]
  }, [exam, query, effectiveScope, mentioned]);

  const panelStyle = window.innerWidth > 768
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : {};

  return (
    <div
      ref={panelRef}
      className="lab-values-panel"
      style={panelStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="lab-header">
        <span className="lab-title">🧪 Lab Values</span>
        <button className="lab-close-btn" onClick={onClose} title="Close">×</button>
      </div>

      <div className="lab-controls">
        <div className="lab-toggle" role="tablist" aria-label="Values shown">
          {EXAMS.map((ex) => (
            <button
              key={ex}
              role="tab"
              aria-selected={effectiveScope === 'all' && exam === ex}
              className={`lab-toggle-btn ${effectiveScope === 'all' && exam === ex ? 'active' : ''}`}
              onClick={() => { setExam(ex); setScope('all'); }}
              title={`All ${ex} reference ranges`}
            >
              {ex}
            </button>
          ))}
          <button
            role="tab"
            aria-selected={effectiveScope === 'question'}
            className={`lab-toggle-btn lab-toggle-btn--q ${effectiveScope === 'question' ? 'active' : ''}`}
            onClick={() => { setScope('question'); setQuery(''); }}
            disabled={mentioned.length === 0}
            title={mentioned.length
              ? 'Only the values this question mentions'
              : 'Nothing in this question has a reference range here'}
          >
            🧪 This question
            {mentioned.length > 0 && <span className="lab-tab-count">{mentioned.length}</span>}
          </button>
        </div>
        <input
          className="lab-search"
          type="text"
          placeholder="Search e.g. sodium, ALT…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="lab-body">
        {grouped.length === 0 && (
          <div className="lab-empty">
            {query
              ? <>No values match “{query}”.</>
              : <>Nothing in this question has a reference range here.</>}
          </div>
        )}
        {grouped.map(([category, rows]) => (
          <div key={category} className="lab-group">
            <div className="lab-group-title">{category}</div>
            <table className={`lab-table${effectiveScope === 'question' ? ' lab-table--q' : ''}`}>
              {effectiveScope === 'question' && (
                <thead>
                  <tr className="lab-head-row">
                    <th>Test</th>
                    <th>In this question</th>
                    <th>Normal</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.verdict ? `lab-row lab-row--${r.verdict}` : 'lab-row'}>
                    <td className="lab-name">{r.name}</td>
                    {effectiveScope === 'question' && (
                      <td className="lab-given">
                        {r.patient ? (
                          <>
                            <span className="lab-given-num">{r.patient.raw}</span>
                            {r.patient.unit && <span className="lab-given-unit">{r.patient.unit}</span>}
                            {r.verdict && r.verdict !== 'normal' && (
                              <span className={`lab-flag lab-flag--${r.verdict}`}>
                                {r.verdict === 'high' ? '▲ High' : '▼ Low'}
                              </span>
                            )}
                            {r.verdict === 'normal' && <span className="lab-flag lab-flag--normal">✓ Normal</span>}
                            {/* Said out loud rather than guessed: a figure in
                                other units cannot be compared with this range. */}
                            {!r.verdict && r.unitMismatch && (
                              <span className="lab-flag lab-flag--unknown">different units</span>
                            )}
                          </>
                        ) : (
                          <span className="lab-given-none">—</span>
                        )}
                      </td>
                    )}
                    <td className="lab-val">
                      {r.value}
                      {r.units && <span className="lab-units">{r.units}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="lab-footer-note">
        Reference ranges vary by source — verify before clinical use.
      </div>
    </div>
  );
}
