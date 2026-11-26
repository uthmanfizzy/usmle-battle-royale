import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { caseById, specialtyById, saveBest, loadBest } from '../clinical';
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
 * Every pick is final, as on a real shift. Picking something not needed
 * (tier extra) or something that should not be done (tier harm) gets the
 * senior's comment straight away. Finishing a step with a must-do (tier key)
 * left out stops you: the senior says what was missed and why, and the
 * missing findings go into the notes so the next step is still playable.
 * The debrief scores it and walks through each step again.
 */

const STEPS = [
  { id: 'history', label: 'History', icon: '💬', verb: 'Ask' },
  { id: 'exam', label: 'Examination', icon: '🩺', verb: 'Examine' },
  { id: 'tests', label: 'Investigations', icon: '🧪', verb: 'Order' },
  { id: 'dx', label: 'Diagnosis', icon: '🎯' },
  { id: 'mgmt', label: 'Management', icon: '💊', verb: 'Do' },
  { id: 'debrief', label: 'Debrief', icon: '📋' },
];
const go = (path) => { window.location.href = path; };

// The pickable items of a step, in one shape: { id, label, group, tier, why, result }.
function itemsFor(c, step) {
  if (step === 'history') return c.history.questions.map(q => ({ ...q, label: q.ask, result: q.answer }));
  if (step === 'exam') return c.exam.items.map(x => ({ ...x, result: x.finding }));
  if (step === 'tests') return c.tests.items;
  if (step === 'mgmt') return c.management.items.map(x => ({ ...x, result: null }));
  return [];
}
const groupsFor = (c, step) => ({ history: c.history.groups, exam: c.exam.groups, tests: c.tests.groups, mgmt: c.management.groups }[step] || []);

const TIER_NOTE = {
  extra: { cls: 'is-extra', icon: '⚠️', head: 'Not needed here' },
  harm: { cls: 'is-harm', icon: '⛔', head: 'Should not be done' },
};

function score(c, picked, dxFirstTry) {
  let keys = 0; let got = 0; let extra = 0; let harm = 0;
  for (const step of ['history', 'exam', 'tests', 'mgmt']) {
    for (const it of itemsFor(c, step)) {
      const on = picked[step].includes(it.id);
      if (it.tier === 'key') { keys += 1; if (on) got += 1; }
      if (on && it.tier === 'extra') extra += 1;
      if (on && it.tier === 'harm') harm += 1;
    }
  }
  const raw = (keys ? (80 * got) / keys : 80) + (dxFirstTry ? 20 : 0) - 4 * extra - 12 * harm;
  return { total: Math.max(0, Math.min(100, Math.round(raw))), keys, got, extra, harm };
}

// ── Pieces ───────────────────────────────────────────────────────────────
function Monitor({ c, examined }) {
  const vitals = c.exam.items.filter(x => x.vital);
  return (
    <div className="cl-monitor" aria-label="Bedside monitor">
      {vitals.map(v => {
        const on = examined.includes(v.id);
        const [name, value, unit, tone] = v.vital;
        return (
          <div key={v.id} className={`cl-vital ${on ? `is-${tone}` : 'is-off'}`}>
            <span className="cl-vital-name">{name}</span>
            <span className="cl-vital-val">{on ? value : '--'}<small>{unit}</small></span>
          </div>
        );
      })}
    </div>
  );
}

function Notes({ c, picked, reviewed }) {
  const section = (step, title) => {
    const items = itemsFor(c, step);
    const mine = picked[step].map(id => items.find(i => i.id === id)).filter(Boolean);
    const missed = reviewed[step] ? items.filter(i => i.tier === 'key' && !picked[step].includes(i.id)) : [];
    const rows = [...mine, ...missed].filter(i => i.result);
    if (!rows.length) return null;
    return (
      <div className="cl-notes-sec">
        <h4>{title}</h4>
        <ul>
          {rows.map(i => (
            <li key={i.id} className={missed.includes(i) ? 'is-missed' : ''}>
              {step === 'history' ? <><b>Q:</b> {i.label}<br /><span>{i.result}</span></> : <><b>{i.label}:</b> {i.result}</>}
              {missed.includes(i) && <em> (senior)</em>}
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
      {feed.slice().reverse().slice(0, 4).map(f => (
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

function ChoiceStep({ c, step, picked, onPick, onDone, missed, onContinue }) {
  const items = itemsFor(c, step);
  const meta = STEPS.find(s => s.id === step);
  const groups = groupsFor(c, step);
  const latest = picked[picked.length - 1];
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
                    disabled={on || !!missed} onClick={() => onPick(i)}>
                    <span className="cl-choice-label">{i.label}</span>
                    {on && i.result && <span className="cl-choice-result">{i.result}</span>}
                    {on && !i.result && <span className="cl-choice-result">{step === 'mgmt' ? 'Done.' : ''}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!missed ? (
        <div className="cl-step-foot">
          {step === 'tests' && picked.length === 0 && (
            <button type="button" className="cl-btn cl-btn--ghost" onClick={onDone}>No investigations needed →</button>
          )}
          <button type="button" className="cl-btn" onClick={onDone}>
            {step === 'mgmt' ? 'Finish the case →' : `Done with ${meta.label.toLowerCase()} →`}
          </button>
        </div>
      ) : (
        <div className="cl-missed">
          {missed.length ? (
            <>
              <h3>🧑‍⚕️ Your senior: you missed {missed.length === 1 ? 'one thing' : `${missed.length} things`}</h3>
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
            <h3>🧑‍⚕️ Your senior: nothing important missed. {step === 'tests' && picked.length === 0 ? c.tests.noneNeededNote : 'Well done.'}</h3>
          )}
          {step === 'tests' && picked.length > 0 && !missed.length && <p className="cl-missed-note">{c.tests.noneNeededNote}</p>}
          <button type="button" className="cl-btn" onClick={onContinue}>Continue →</button>
        </div>
      )}
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
  const firstExam = c.exam.items.find(x => x.id === picked.exam[0]);
  const abcdeFirst = firstExam?.group === c.exam.abcdeGroup;
  const grade = s.total >= 85 ? ['🏅', 'Safe and efficient'] : s.total >= 65 ? ['👍', 'Safe, with gaps'] : ['📚', 'Needs supervision'];
  useEffect(() => { saveBest(c.id, s.total); }, [c.id, s.total]);
  return (
    <div className="cl-debrief">
      <section className="cl-score">
        <span className="cl-score-medal" aria-hidden="true">{grade[0]}</span>
        <div>
          <p className="cl-kicker">Debrief</p>
          <h2>{grade[1]}</h2>
          <p className="cl-score-line"><b>{s.total}</b>/100 · {s.got}/{s.keys} essentials · {s.extra} not needed · {s.harm} harmful</p>
        </div>
      </section>
      <div className="cl-debrief-approach">
        {abcdeFirst
          ? <p>✓ You started the examination with the ABCDE first look. That is the right first step in an unwell child.</p>
          : <p>⚠️ Your first examination step was <b>{firstExam?.label || 'not recorded'}</b>. In an unwell child, start with the ABCDE first look and decide how sick they are.</p>}
        {dxTries.length > 1 && <p>⚠️ The diagnosis took {dxTries.length} tries.</p>}
      </div>
      {['history', 'exam', 'tests', 'mgmt'].map(step => {
        const items = itemsFor(c, step);
        const missed = items.filter(i => i.tier === 'key' && !picked[step].includes(i.id));
        const wasted = items.filter(i => (i.tier === 'extra' || i.tier === 'harm') && picked[step].includes(i.id));
        const good = items.filter(i => (i.tier === 'key' || i.tier === 'useful') && picked[step].includes(i.id));
        const meta = STEPS.find(x => x.id === step);
        return (
          <section key={step} className="cl-debrief-step">
            <h3><span aria-hidden="true">{meta.icon}</span> {meta.label}</h3>
            {good.length > 0 && <p className="cl-debrief-good">✓ {good.map(i => i.label).join(' · ')}</p>}
            {missed.map(i => <div key={i.id} className="cl-debrief-row is-missed"><b>Missed: {i.label}</b><p>{i.why}</p></div>)}
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

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [stage]);

  function pick(step, item) {
    setPicked(p => ({ ...p, [step]: [...p[step], item.id] }));
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

  const stepIndex = STEPS.findIndex(s => s.id === stage);
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
            <span className="cl-brief-avatar" aria-hidden="true">{c.patient.icon}</span>
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
            <li>Work through it as you would on the ward: history, examination, tests, diagnosis, management.</li>
            <li>Every choice is final. Your senior tells you at once if something was not needed.</li>
            <li>When you finish a step, anything essential you left out is pointed out.</li>
          </ul>
          <div className="cl-step-foot">
            {best != null && <span className="cl-best">Best: <b>{best}</b>/100</span>}
            <button type="button" className="cl-btn" onClick={() => { sfx.next?.(); setStage('history'); }}>See the patient →</button>
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
            <Monitor c={c} examined={[...picked.exam, ...(reviewed.exam || []).map(i => i.id)]} />
            <Notes c={c} picked={picked} reviewed={reviewed} />
          </aside>
          <main className="cl-main">
            <h2 className="cl-stage-title">
              <span aria-hidden="true">{STEPS[stepIndex].icon}</span> {STEPS[stepIndex].label}
            </h2>
            {stage === 'history' && (
              <div className="cl-chat">
                {c.history.opening.map(([who, line]) => (
                  <div key={line} className="cl-bubble"><b>{who}</b><p>{line}</p></div>
                ))}
                <p className="cl-chat-prompt">What do you want to ask?</p>
              </div>
            )}
            {stage === 'exam' && <p className="cl-stage-hint">Choose what to examine, in the order you would do it.</p>}
            {stage === 'tests' && <p className="cl-stage-hint">Order only what will change what you do.</p>}
            {stage === 'mgmt' && <p className="cl-stage-hint">Decide where he goes and what he needs. Pick everything you would do.</p>}
            <Feed feed={feed.filter(f => f.key.startsWith(`${stage}-`))} />
            {stage === 'dx' ? (
              <DiagnosisStep c={c} tries={dxTries}
                onPick={(id) => { setDxTries(t => [...t, id]); if (id === c.diagnosis.answer) sfx.correct?.(); else sfx.wrong?.(); }}
                onContinue={() => setStage('mgmt')} />
            ) : (
              <ChoiceStep key={stage} c={c} step={stage} picked={picked[stage]}
                onPick={(i) => pick(stage, i)} onDone={() => done(stage)}
                missed={reviewed[stage]} onContinue={() => { sfx.next?.(); setStage(nextOf[stage]); }} />
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
