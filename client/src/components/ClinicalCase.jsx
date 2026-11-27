import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { caseById, specialtyById, saveBest, loadBest } from '../clinical';
import { Baby, Parent, BABY_REGIONS } from '../clinical/ClinicalScene';
import { AdminOnly } from './ClinicalHub';
import { sfx } from '../minigameSfx';
import SfxToggle from './SfxToggle';
import './Clinical.css';

/**
 * Clinical · one patient, start to finish:
 *
 *   Handover → History → Examination → Investigations → Diagnosis →
 *   Management → Debrief
 *
 * History is a conversation: the parent tells the story, then you choose
 * what to ask. Recommended questions can be shown with a ★.
 * Examination is technique × body part on the animated patient: pick
 * Inspect, Palpate, Stethoscope, Percuss or Measure, then a part of the
 * body. A useless pair is allowed, and the senior says why it was useless.
 *
 * Every pick is final, as on a real shift. Picking something not needed
 * (tier extra) or harmful (tier harm) gets the senior's comment at once.
 * Finishing a step with a recommended item (tier key) left out lists what was
 * missed, and the missing findings go into the notes so the case goes on.
 */

const STEPS = [
  { id: 'history', label: 'History', icon: '💬' },
  { id: 'exam', label: 'Examination', icon: '🩺' },
  { id: 'tests', label: 'Investigations', icon: '🧪' },
  { id: 'dx', label: 'Diagnosis', icon: '🎯' },
  { id: 'mgmt', label: 'Management', icon: '💊' },
  { id: 'debrief', label: 'Debrief', icon: '📋' },
];
const TOOLS = [
  { id: 'inspect', label: 'Inspect', icon: '👁️', mark: '👁️', hint: 'Look' },
  { id: 'palpate', label: 'Palpate', icon: '✋', mark: '✋', hint: 'Feel' },
  { id: 'listen', label: 'Stethoscope', icon: '🩺', mark: '🩺', hint: 'Listen' },
  { id: 'percuss', label: 'Percuss', icon: '👆', mark: '👆', hint: 'Tap' },
  { id: 'measure', label: 'Measure', icon: '📟', mark: '📟', hint: 'Devices' },
];
const toolById = (id) => TOOLS.find(t => t.id === id);
const regionLabel = (id) => BABY_REGIONS.find(r => r.id === id)?.label || id;
const go = (path) => { window.location.href = path; };

// ── Items: every pickable thing of a step in one shape ───────────────────
// { id, label, group?, tier, why, result, vital?, abcde?, tool?, region? }
function examItems(c) {
  const acts = c.exam.actions.map(a => ({
    ...a,
    id: `${a.tool}:${a.region}`,
    label: `${toolById(a.tool).label}: ${regionLabel(a.region).toLowerCase()}`,
    result: a.finding,
  }));
  const meas = (c.exam.measure || []).map(m => ({ ...m, id: `measure:${m.id}`, tool: 'measure', region: m.mark || null, result: m.finding }));
  return [...acts, ...meas];
}
function itemsFor(c, step) {
  if (step === 'history') return c.history.questions.map(q => ({ ...q, label: q.ask, result: q.answer }));
  if (step === 'exam') return examItems(c);
  if (step === 'tests') return c.tests.items;
  if (step === 'mgmt') return c.management.items.map(x => ({ ...x, result: null }));
  return [];
}
// A technique on a body part the case did not list: allowed, and useless.
function fallbackItem(c, id) {
  const [tool, region] = id.split(':');
  return {
    id, tool, region, tier: 'extra',
    label: `${toolById(tool)?.label || tool}: ${regionLabel(region).toLowerCase()}`,
    result: 'Nothing useful found.',
    why: c.exam.fallback?.[tool] || 'Not useful here.',
  };
}
function resolveItem(c, step, id) {
  const found = itemsFor(c, step).find(i => i.id === id);
  return found || (step === 'exam' ? fallbackItem(c, id) : null);
}
// The listed items plus any useless extras the player actually picked.
function allItems(c, step, pickedIds) {
  const base = itemsFor(c, step);
  const extra = pickedIds.filter(id => !base.some(i => i.id === id)).map(id => resolveItem(c, step, id)).filter(Boolean);
  return [...base, ...extra];
}

const TIER_NOTE = {
  extra: { cls: 'is-extra', icon: '⚠️', head: 'Not needed here' },
  harm: { cls: 'is-harm', icon: '⛔', head: 'Should not be done' },
};

function score(c, picked, dxFirstTry) {
  let keys = 0; let got = 0; let extra = 0; let harm = 0;
  for (const step of ['history', 'exam', 'tests', 'mgmt']) {
    for (const it of allItems(c, step, picked[step])) {
      const on = picked[step].includes(it.id);
      if (it.tier === 'key') { keys += 1; if (on) got += 1; }
      if (on && it.tier === 'extra') extra += 1;
      if (on && it.tier === 'harm') harm += 1;
    }
  }
  const raw = (keys ? (80 * got) / keys : 80) + (dxFirstTry ? 20 : 0) - 3 * extra - 12 * harm;
  return { total: Math.max(0, Math.min(100, Math.round(raw))), keys, got, extra, harm };
}

// ── Pieces ───────────────────────────────────────────────────────────────
const VITAL_ORDER = ['RR', 'SpO₂', 'HR', 'Temp', 'BP'];
function Monitor({ c, examIds }) {
  const items = examItems(c);
  const seen = {};
  for (const it of items) if (it.vital && !(it.vital[0] in seen)) seen[it.vital[0]] = null;
  for (const id of examIds) {
    const it = items.find(i => i.id === id);
    if (it?.vital) seen[it.vital[0]] = it.vital;
  }
  const names = VITAL_ORDER.filter(n => n in seen);
  return (
    <div className="cl-monitor" aria-label="Bedside monitor">
      {names.map(n => {
        const v = seen[n];
        return (
          <div key={n} className={`cl-vital ${v ? `is-${v[3]}` : 'is-off'}`}>
            <span className="cl-vital-name">{n}</span>
            <span className="cl-vital-val">{v ? v[1] : '--'}<small>{v ? v[2] : ''}</small></span>
          </div>
        );
      })}
    </div>
  );
}

function Notes({ c, picked, reviewed }) {
  const section = (step, title) => {
    // What was asked, found or resulted, in order; a technique the case does
    // not list found nothing, so it has no line in the notes.
    const listed = itemsFor(c, step);
    const mine = picked[step].map(id => listed.find(i => i.id === id)).filter(i => i && i.result);
    const missed = reviewed[step] || [];
    const rows = [...mine, ...missed.filter(i => i.result)];
    if (!rows.length) return null;
    return (
      <div className="cl-notes-sec">
        <h4>{title}</h4>
        <ul>
          {rows.map(i => (
            <li key={i.id} className={missed.includes(i) ? 'is-missed' : ''}>
              {step === 'history' ? <><b>Q:</b> {i.label}<br /><span>{i.result}</span></> : <><b>{i.label}:</b> {i.result}</>}
              {missed.includes(i) && <em> (from your senior)</em>}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return (
    <div className="cl-notes">
      <h3>📝 Notes</h3>
      <div className="cl-notes-sec">
        <h4>Handover</h4>
        <p>{c.triage}</p>
      </div>
      {section('history', 'History')}
      {section('exam', 'Examination')}
      {section('tests', 'Results')}
    </div>
  );
}

function Feed({ feed }) {
  if (!feed.length) return null;
  return (
    <div className="cl-feed" aria-live="polite">
      {feed.slice().reverse().slice(0, 3).map(f => (
        <div key={f.key} className={`cl-feed-item ${TIER_NOTE[f.tier].cls}`}>
          <span className="cl-feed-icon" aria-hidden="true">{TIER_NOTE[f.tier].icon}</span>
          <div>
            <b>{TIER_NOTE[f.tier].head}: {f.label}</b>
            <p>{f.why}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// "Done" for a step, and once pressed, the senior's list of what was missed.
function StepFooter({ c, step, pickedCount, missed, onDone, onContinue }) {
  const meta = STEPS.find(s => s.id === step);
  if (!missed) {
    return (
      <div className="cl-step-foot">
        {step === 'tests' && pickedCount === 0 && (
          <button type="button" className="cl-btn cl-btn--ghost" onClick={onDone}>No investigations needed →</button>
        )}
        <button type="button" className="cl-btn" onClick={onDone}>
          {step === 'mgmt' ? 'Finish the case →' : `Done with ${meta.label.toLowerCase()} →`}
        </button>
      </div>
    );
  }
  return (
    <div className="cl-missed">
      {missed.length ? (
        <>
          <h3>🧑‍⚕️ Your senior: you missed {missed.length === 1 ? 'one thing' : `${missed.length} things`} that are recommended</h3>
          <ul>
            {missed.map(i => (
              <li key={i.id}>
                <b>{i.label}</b>
                {i.result && <span className="cl-missed-res">{i.result}</span>}
                <p>{i.why}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <h3>🧑‍⚕️ Your senior: nothing important missed. {step === 'tests' && pickedCount === 0 ? c.tests.noneNeededNote : 'Well done.'}</h3>
      )}
      {step === 'tests' && pickedCount > 0 && !missed.length && <p className="cl-missed-note">{c.tests.noneNeededNote}</p>}
      <button type="button" className="cl-btn" onClick={onContinue}>Continue →</button>
    </div>
  );
}

// ── History: meet the parent ─────────────────────────────────────────────
function HistoryStep({ c, picked, onPick, footer }) {
  const items = itemsFor(c, 'history');
  const [shown, setShown] = useState(0);         // opening lines told so far
  const [hints, setHints] = useState(true);       // show ★ Recommended
  const [talking, setTalking] = useState(false);
  const logRef = useRef(null);
  const opening = c.history.opening;
  const told = shown >= opening.length;

  useEffect(() => {
    if (told) return undefined;
    setTalking(true);
    const t = setTimeout(() => { setShown(s => s + 1); sfx.bubble?.(); }, shown === 0 ? 600 : 1500);
    return () => clearTimeout(t);
  }, [shown, told]);
  useEffect(() => {
    if (!talking) return undefined;
    const t = setTimeout(() => setTalking(false), 1300);
    return () => clearTimeout(t);
  }, [talking, shown, picked.length]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [shown, picked.length]);

  function ask(q) { onPick(q); setTalking(true); }

  return (
    <>
      <div className="cl-scene">
        <div className="cl-scene-parent"><Parent who={c.patient.parent || 'mum'} talking={talking} /><span>{c.history.opening[0][0]}</span></div>
        <div className="cl-scene-baby"><Baby look={c.patient.look} size="sm" /><span>{c.patient.name}</span></div>
      </div>
      <div className="cl-convo" ref={logRef}>
        {opening.slice(0, shown).map(([who, line]) => (
          <div key={line} className="cl-say cl-say--parent"><b>{who}</b><p>{line}</p></div>
        ))}
        {!told && <div className="cl-say cl-say--parent cl-typing" aria-label="Mum is talking"><span /><span /><span /></div>}
        {picked.map(id => {
          const q = items.find(i => i.id === id);
          return (
            <div key={id} className="cl-say-pair">
              <div className="cl-say cl-say--you"><b>You</b><p>{q.ask}</p></div>
              <div className="cl-say cl-say--parent"><b>{opening[0][0]}</b><p>{q.answer}</p></div>
            </div>
          );
        })}
      </div>
      {told && (
        <div className="cl-ask">
          <div className="cl-ask-head">
            <h3>What would you like to ask?</h3>
            <label className="cl-toggle">
              <input type="checkbox" checked={hints} onChange={e => setHints(e.target.checked)} />
              <span>Show recommended questions</span>
            </label>
          </div>
          <p className="cl-stage-hint">Not every question is needed. Ask what will change your assessment.</p>
          {c.history.groups.map(g => {
            const list = items.filter(i => i.group === g);
            return (
              <div key={g} className="cl-group">
                <h3>{g}</h3>
                <div className="cl-qchips">
                  {list.map(q => {
                    const on = picked.includes(q.id);
                    const tone = on ? (q.tier === 'extra' ? ' is-extra' : q.tier === 'harm' ? ' is-harm' : ' is-done') : '';
                    return (
                      <button key={q.id} type="button" className={`cl-qchip${tone}`} disabled={on || footer.props.missed} onClick={() => ask(q)}>
                        {q.ask}
                        {hints && q.tier === 'key' && <span className="cl-rec">★ Recommended</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {footer}
        </div>
      )}
    </>
  );
}

// ── Examination: technique × body part ───────────────────────────────────
function ExamStep({ c, picked, onPick, footer }) {
  const [tool, setTool] = useState('inspect');
  const [last, setLast] = useState(null);
  const marks = {};
  for (const id of picked) {
    const it = resolveItem(c, 'exam', id);
    if (it?.region) marks[it.region] = toolById(it.tool)?.mark;
  }
  function doIt(id) {
    const it = resolveItem(c, 'exam', id);
    setLast(it);
    if (!picked.includes(id)) onPick(it);
  }
  const offBody = BABY_REGIONS.filter(r => r.offBody);
  const locked = !!footer.props.missed;
  const t = toolById(tool);

  return (
    <>
      <div className="cl-tools" role="toolbar" aria-label="Examination technique">
        {TOOLS.map(x => (
          <button key={x.id} type="button" className={`cl-tool${tool === x.id ? ' is-on' : ''}`} onClick={() => setTool(x.id)} aria-pressed={tool === x.id}>
            <span aria-hidden="true">{x.icon}</span>{x.label}
          </button>
        ))}
      </div>
      <div className="cl-exam">
        <div className={`cl-exam-stage${locked ? ' is-locked' : ''}`}>
          {tool !== 'measure' ? (
            <Baby look={c.patient.look} onRegion={locked ? null : (r) => doIt(`${tool}:${r}`)} active={tool} marks={marks} />
          ) : (
            <Baby look={c.patient.look} marks={marks} />
          )}
          <p className="cl-exam-tip">
            {tool === 'measure' ? 'Choose a device on the right.' : <>{t.icon} <b>{t.label}</b>: tap a part of {c.patient.name}.</>}
          </p>
        </div>
        <div className="cl-exam-side">
          {tool === 'measure' ? (
            <div className="cl-group">
              <h3>Devices</h3>
              <div className="cl-choices cl-choices--one">
                {c.exam.measure.map(m => {
                  const id = `measure:${m.id}`;
                  const on = picked.includes(id);
                  const tone = on ? (m.tier === 'extra' ? ' is-extra' : m.tier === 'harm' ? ' is-harm' : ' is-done') : '';
                  return (
                    <button key={id} type="button" className={`cl-choice${tone}`} disabled={locked} onClick={() => doIt(id)}>
                      <span className="cl-choice-label">{m.label}</span>
                      {on && <span className="cl-choice-result">{m.finding}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="cl-group">
              <h3>Or {t.label.toLowerCase()}…</h3>
              <div className="cl-choices cl-choices--one">
                {offBody.map(r => (
                  <button key={r.id} type="button" className="cl-choice" disabled={locked} onClick={() => doIt(`${tool}:${r.id}`)}>
                    <span className="cl-choice-label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {last && (
            <div className={`cl-finding${last.tier === 'extra' ? ' is-extra' : last.tier === 'harm' ? ' is-harm' : ''}`} key={last.id}>
              <span className="cl-finding-head">{toolById(last.tool)?.icon} {last.label}</span>
              <p>{last.result}</p>
              {(last.tier === 'extra' || last.tier === 'harm') && <p className="cl-finding-why"><b>Not useful:</b> {last.why}</p>}
            </div>
          )}
          <div className="cl-done-list">
            <h3>Done so far ({picked.length})</h3>
            {picked.length === 0 ? <p className="cl-stage-hint">Start the way you would on the ward.</p> : (
              <ul>
                {picked.map(id => {
                  const it = resolveItem(c, 'exam', id);
                  return <li key={id} className={it.tier === 'extra' || it.tier === 'harm' ? 'is-extra' : ''}>{it.label}</li>;
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      {footer}
    </>
  );
}

function ChoiceStep({ c, step, picked, onPick, footer }) {
  const items = itemsFor(c, step);
  const groups = step === 'tests' ? c.tests.groups : c.management.groups;
  const latest = picked[picked.length - 1];
  const locked = !!footer.props.missed;
  return (
    <div className="cl-step">
      {groups.map(g => {
        const list = items.filter(i => i.group === g);
        if (!list.length) return null;
        return (
          <div key={g} className="cl-group">
            <h3>{g}</h3>
            <div className="cl-choices">
              {list.map(i => {
                const on = picked.includes(i.id);
                const toneCls = on ? (i.tier === 'harm' ? ' is-harm' : i.tier === 'extra' ? ' is-extra' : ' is-done') : '';
                return (
                  <button key={i.id} type="button" className={`cl-choice${toneCls}${latest === i.id ? ' is-latest' : ''}`}
                    disabled={on || locked} onClick={() => onPick(i)}>
                    <span className="cl-choice-label">{i.label}</span>
                    {on && <span className="cl-choice-result">{i.result || 'Done.'}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {footer}
    </div>
  );
}

function DiagnosisStep({ c, tries, onPick, onContinue }) {
  const solved = tries.includes(c.diagnosis.answer);
  return (
    <div className="cl-step">
      <div className="cl-group">
        <h3>What is the most likely diagnosis?</h3>
        <div className="cl-dx">
          {c.diagnosis.options.map(o => {
            const tried = tries.includes(o.id);
            const right = o.id === c.diagnosis.answer;
            return (
              <div key={o.id} className={`cl-dx-opt${tried ? (right ? ' is-right' : ' is-wrong') : ''}`}>
                <button type="button" disabled={tried || solved} onClick={() => onPick(o.id)}>
                  {o.label} {tried && (right ? '✓' : '✕')}
                </button>
                {(tried || solved) && <p>{o.why}</p>}
              </div>
            );
          })}
        </div>
      </div>
      {solved && (
        <div className="cl-step-foot">
          <button type="button" className="cl-btn" onClick={onContinue}>Plan the management →</button>
        </div>
      )}
    </div>
  );
}

function Debrief({ c, picked, dxTries, onAgain, onBack }) {
  const s = score(c, picked, dxTries.length === 1);
  const firstExam = picked.exam[0] ? resolveItem(c, 'exam', picked.exam[0]) : null;
  const abcdeFirst = !!firstExam?.abcde;
  const grade = s.total >= 85 ? ['🏅', 'Safe and efficient'] : s.total >= 65 ? ['👍', 'Safe, with gaps'] : ['📚', 'Needs supervision'];
  useEffect(() => { saveBest(c.id, s.total); }, [c.id, s.total]);
  return (
    <div className="cl-debrief">
      <section className="cl-score">
        <span className="cl-score-medal" aria-hidden="true">{grade[0]}</span>
        <div>
          <p className="cl-kicker">Debrief</p>
          <h2>{grade[1]}</h2>
          <p className="cl-score-line"><b>{s.total}</b>/100 · {s.got}/{s.keys} recommended · {s.extra} not needed · {s.harm} harmful</p>
        </div>
      </section>
      <div className="cl-debrief-approach">
        {abcdeFirst
          ? <p>✓ You began the examination with a first-look (ABCDE) step: <b>{firstExam.label}</b>. That is the right way to start with an unwell child.</p>
          : <p>⚠️ Your first examination step was <b>{firstExam?.label || 'not recorded'}</b>. With an unwell child, start with the first look: general appearance, breathing, colour and saturations, before anything else.</p>}
        {dxTries.length > 1 && <p>⚠️ The diagnosis took {dxTries.length} tries.</p>}
      </div>
      {['history', 'exam', 'tests', 'mgmt'].map(step => {
        const items = allItems(c, step, picked[step]);
        const missed = items.filter(i => i.tier === 'key' && !picked[step].includes(i.id));
        const wasted = items.filter(i => (i.tier === 'extra' || i.tier === 'harm') && picked[step].includes(i.id));
        const good = items.filter(i => (i.tier === 'key' || i.tier === 'useful') && picked[step].includes(i.id));
        const meta = STEPS.find(x => x.id === step);
        return (
          <section key={step} className="cl-debrief-step">
            <h3><span aria-hidden="true">{meta.icon}</span> {meta.label}</h3>
            {good.length > 0 && <p className="cl-debrief-good">✓ {good.map(i => i.label).join(' · ')}</p>}
            {missed.map(i => <div key={i.id} className="cl-debrief-row is-missed"><b>Recommended, missed: {i.label}</b><p>{i.why}</p></div>)}
            {wasted.map(i => <div key={i.id} className={`cl-debrief-row ${i.tier === 'harm' ? 'is-harm' : 'is-extra'}`}><b>{i.tier === 'harm' ? 'Should not be done' : 'Not needed'}: {i.label}</b><p>{i.why}</p></div>)}
            {!missed.length && !wasted.length && <p className="cl-debrief-clean">Nothing missed and nothing wasted.</p>}
          </section>
        );
      })}
      <section className="cl-debrief-step">
        <h3><span aria-hidden="true">🏥</span> What happened</h3>
        <p>{c.outcome}</p>
      </section>
      <section className="cl-debrief-step cl-pearls">
        <h3><span aria-hidden="true">📌</span> Take-home points</h3>
        <ul>{c.pearls.map(p => <li key={p}>{p}</li>)}</ul>
        <p className="cl-source">{c.source}</p>
      </section>
      <div className="cl-step-foot">
        <button type="button" className="cl-btn cl-btn--ghost" onClick={onBack}>Back to cases</button>
        <button type="button" className="cl-btn" onClick={onAgain}>Try the case again</button>
      </div>
    </div>
  );
}

// ── The case ─────────────────────────────────────────────────────────────
function CaseRun({ c, spec }) {
  const [stage, setStage] = useState('brief');
  const [picked, setPicked] = useState({ history: [], exam: [], tests: [], mgmt: [] });
  const [reviewed, setReviewed] = useState({});   // step -> missed[] once "Done" is pressed
  const [dxTries, setDxTries] = useState([]);
  const [feed, setFeed] = useState([]);
  const topRef = useRef(null);
  const best = useMemo(() => loadBest()[c.id], [c.id]);

  useEffect(() => { topRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [stage]);

  function pick(step, item) {
    setPicked(p => (p[step].includes(item.id) ? p : { ...p, [step]: [...p[step], item.id] }));
    if (item.tier === 'extra' || item.tier === 'harm') {
      setFeed(f => [...f, { key: `${step}-${item.id}`, tier: item.tier, label: item.label, why: item.why }]);
      sfx.wrong?.();
    } else {
      sfx.select?.();
    }
  }
  function done(step) {
    const missed = itemsFor(c, step).filter(i => i.tier === 'key' && !picked[step].includes(i.id));
    setReviewed(r => ({ ...r, [step]: missed }));
    if (missed.length) sfx.wrong?.(); else sfx.correct?.();
  }
  const nextOf = { history: 'exam', exam: 'tests', tests: 'dx', mgmt: 'debrief' };
  function restart() {
    setStage('brief'); setPicked({ history: [], exam: [], tests: [], mgmt: [] });
    setReviewed({}); setDxTries([]); setFeed([]);
  }
  const footer = (step) => (
    <StepFooter c={c} step={step} pickedCount={picked[step].length} missed={reviewed[step]}
      onDone={() => done(step)} onContinue={() => { sfx.next?.(); setStage(nextOf[step]); }} />
  );

  const stepIndex = STEPS.findIndex(s => s.id === stage);
  const hint = {
    exam: 'Choose a technique, then the part of the body. Start as you would with any unwell child.',
    tests: 'Order only what will change what you do.',
    mgmt: 'Decide where he goes and what he needs. Pick everything you would do.',
  }[stage];
  return (
    <div className="cl-screen" ref={topRef}>
      <header className="cl-top">
        <button type="button" className="cl-back" onClick={() => go(`/clinical/${spec.id}`)}>← {spec.name}</button>
        <span className="cl-top-title">{c.title}</span>
        <SfxToggle className="cl-sfx" />
      </header>

      {stage !== 'brief' && (
        <ol className="cl-stepper">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < stepIndex ? 'is-done' : i === stepIndex ? 'is-now' : ''}>
              <span aria-hidden="true">{i < stepIndex ? '✓' : s.icon}</span>{s.label}
            </li>
          ))}
        </ol>
      )}

      {stage === 'brief' && (
        <section className="cl-brief">
          <p className="cl-kicker">{c.setting}</p>
          <div className="cl-brief-patient">
            <div className="cl-brief-baby"><Baby look={c.patient.look} size="sm" /></div>
            <div>
              <h1>{c.patient.name}, {c.patient.age}</h1>
              <p>Weight {c.patient.weight}</p>
            </div>
          </div>
          <div className="cl-handover">
            <span className="cl-handover-tag">Triage handover</span>
            <p>{c.triage}</p>
          </div>
          <ul className="cl-brief-rules">
            <li>Meet the family, take the history, examine, choose tests, make the diagnosis and treat.</li>
            <li>Every choice is final. Your senior tells you at once if something was not needed.</li>
            <li>When you finish a step, anything recommended that you left out is pointed out.</li>
          </ul>
          <p className="cl-guidelines">Follows {c.guidelines}.</p>
          <div className="cl-step-foot">
            {best != null && <span className="cl-best">Best: <b>{best}</b>/100</span>}
            <button type="button" className="cl-btn" onClick={() => { sfx.next?.(); setStage('history'); }}>Meet the family →</button>
          </div>
        </section>
      )}

      {stage !== 'brief' && stage !== 'debrief' && (
        <div className="cl-layout">
          <aside className="cl-side">
            <div className="cl-patient">
              <span className="cl-patient-avatar" aria-hidden="true">{c.patient.icon}</span>
              <div><b>{c.patient.name}</b><span>{c.patient.age} · {c.patient.weight}</span></div>
            </div>
            <Monitor c={c} examIds={[...picked.exam, ...(reviewed.exam || []).map(i => i.id)]} />
            <Notes c={c} picked={picked} reviewed={reviewed} />
          </aside>
          <main className="cl-main">
            <h2 className="cl-stage-title">
              <span aria-hidden="true">{STEPS[stepIndex].icon}</span> {stage === 'history' ? 'Meet the family' : STEPS[stepIndex].label}
            </h2>
            {hint && <p className="cl-stage-hint">{hint}</p>}
            {/* The examination explains a useless step in its own findings card. */}
            {stage !== 'exam' && <Feed feed={feed.filter(f => f.key.startsWith(`${stage}-`))} />}
            {stage === 'history' && <HistoryStep c={c} picked={picked.history} onPick={(i) => pick('history', i)} footer={footer('history')} />}
            {stage === 'exam' && <ExamStep c={c} picked={picked.exam} onPick={(i) => pick('exam', i)} footer={footer('exam')} />}
            {(stage === 'tests' || stage === 'mgmt') && (
              <ChoiceStep key={stage} c={c} step={stage} picked={picked[stage]} onPick={(i) => pick(stage, i)} footer={footer(stage)} />
            )}
            {stage === 'dx' && (
              <DiagnosisStep c={c} tries={dxTries}
                onPick={(id) => { setDxTries(t => [...t, id]); if (id === c.diagnosis.answer) sfx.correct?.(); else sfx.wrong?.(); }}
                onContinue={() => setStage('mgmt')} />
            )}
          </main>
        </div>
      )}

      {stage === 'debrief' && (
        <Debrief c={c} picked={picked} dxTries={dxTries} onAgain={restart} onBack={() => go(`/clinical/${spec.id}`)} />
      )}
    </div>
  );
}

export default function ClinicalCase() {
  const { specialty, caseId } = useParams();
  const spec = specialtyById(specialty);
  const c = caseById(specialty, caseId);
  return (
    <AdminOnly>
      {c ? <CaseRun c={c} spec={spec} /> : (
        <div className="cl-screen"><div className="cl-gate"><h1>Case not found</h1>
          <button type="button" className="cl-btn" onClick={() => go('/clinical')}>Back to Clinical</button></div></div>
      )}
    </AdminOnly>
  );
}
