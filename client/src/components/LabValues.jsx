import { useState, useRef, useEffect, useMemo } from 'react';
import labValues from '../labValues';
import './LabValues.css';

const EXAMS = ['USMLE', 'PLAB'];

function readExam() {
  try {
    const saved = localStorage.getItem('mr_lab_exam');
    if (EXAMS.includes(saved)) return saved;
  } catch {}
  return 'USMLE';
}

export default function LabValues({ onClose }) {
  const [exam, setExam] = useState(readExam);
  const [query, setQuery] = useState('');

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

  // Filter + group by category for the selected exam
  const grouped = useMemo(() => {
    const list = labValues[exam] || [];
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
  }, [exam, query]);

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
        <div className="lab-toggle" role="tablist" aria-label="Exam">
          {EXAMS.map((ex) => (
            <button
              key={ex}
              role="tab"
              aria-selected={exam === ex}
              className={`lab-toggle-btn ${exam === ex ? 'active' : ''}`}
              onClick={() => setExam(ex)}
            >
              {ex}
            </button>
          ))}
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
          <div className="lab-empty">No values match “{query}”.</div>
        )}
        {grouped.map(([category, rows]) => (
          <div key={category} className="lab-group">
            <div className="lab-group-title">{category}</div>
            <table className="lab-table">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="lab-name">{r.name}</td>
                    <td className="lab-val">{r.value}</td>
                    <td className="lab-units">{r.units}</td>
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
