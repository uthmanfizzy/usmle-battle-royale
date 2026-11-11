/**
 * Turns a case's label rules (ecgTeaching LABELS) into marks on a strip.
 *
 * Every position and every number is MEASURED off the signal being drawn —
 * the PR written over a beat is that beat's PR, the ST level is read 60 ms
 * after that complex's J point against its own PR baseline, the rate is the
 * mean of the RR intervals actually in view. A label that disagreed with the
 * trace under it would teach the wrong thing with total confidence.
 *
 * Output marks:
 *   { kind: 'interval', lead, t1, t2, label }   a bracket under the trace
 *   { kind: 'point', lead, t, label }           a leader line to a feature
 *   { kind: 'span', lead, t1, t2, label }       a shaded stretch
 *   { kind: 'note', label }                     said under the strip
 */

const ms = (s) => `${Math.round(s * 1000)} ms`;
const mm = (mv) => `${mv >= 0 ? '+' : '−'}${Math.abs(mv * 10).toFixed(1)} mm`;

/**
 * Where to start the labelled window so the thing worth seeing is in it:
 * a full Wenckebach cycle from its reset, the beat before an ectopic, and so
 * on. Times are seconds into the same signal the player was shown.
 */
export function windowStart(caseDef, signal) {
  const cx = signal.complexes;
  const after = (t) => cx.find(c => c.at >= t);
  const id = caseDef.id;

  if (id === 'wenckebach' || id === 'mobitz2') {
    // The first conducted beat after a dropped P — the start of a cycle.
    for (const p of signal.pWaves) {
      if (p < 2) continue;
      const conducted = cx.some(c => c.pr && Math.abs((c.at - c.pr) - p) < 1e-6);
      if (!conducted) {
        const next = after(p + 0.05);
        if (next) return Math.max(0, next.at - next.pr - 0.3);
      }
    }
  }
  if (id === 'bigeminy') {
    const pvc = cx.find(c => c.kind === 'pvc' && c.at > 2);
    const before = pvc && [...cx].reverse().find(c => c.at < pvc.at);
    if (before) return Math.max(0, before.at - (before.pr || 0.16) - 0.3);
  }
  if (id === 'pacs' || id === 'atrial-bigeminy') {
    const idx = signal.pKinds ? signal.pKinds.findIndex((k, i) => k === 1 && signal.pWaves[i] > 2.5) : -1;
    if (idx > 0) {
      // Start a beat before the early one.
      const prevP = signal.pWaves[idx - 1];
      return Math.max(0, prevP - 0.3);
    }
  }
  if (!cx.length) return 2;
  const first = after(2);
  if (!first) return 2;
  return Math.max(0, first.at - (first.pr || 0.12) - 0.3);
}

export function annotate(rules, caseDef, signal, t0, t1) {
  const out = [];
  const inView = (t) => t >= t0 + 0.02 && t <= t1 - 0.02;
  const cxIn = signal.complexes.filter(c => inView(c.at) && inView(c.at + 0.12));
  // The nth complex fully in view (with its T), for single-beat labels.
  // `beat` lets labels be spread across beats instead of piling every one
  // onto the first complex, where they overprint each other.
  const firstWhole = (li = 0, n = 0) => cxIn.filter(c => inView(signal.timings(li, c).tEnd))[n]
    || cxIn.find(c => inView(signal.timings(li, c).tEnd));
  const withP = () => cxIn.filter(k => k.pr && inView(k.at - k.pr));

  for (const r of rules || []) {
    const li = r.lead ?? 0;
    switch (r.type) {
      case 'note':
        out.push({ kind: 'note', label: r.text });
        break;

      case 'p': {
        // The P belonging to the first fully visible complex — or, failing
        // that, the first P wave in view.
        const c = withP()[r.beat || 0] || withP()[0];
        const onset = c ? c.at - c.pr : signal.pWaves.find(p => inView(p));
        if (onset != null) out.push({ kind: 'point', lead: li, t: onset + 0.05, label: r.label || 'P wave' });
        break;
      }

      case 'allP':
        signal.pWaves.filter(p => inView(p + 0.05)).forEach(p => {
          out.push({ kind: 'point', lead: li, t: p + 0.05, label: r.label || 'P', small: true });
        });
        break;

      case 'pr':
        withP().slice(r.beat || 0, (r.beat || 0) + (r.count || 1)).forEach(c => {
          out.push({ kind: 'interval', lead: li, t1: c.at - c.pr, t2: c.at, label: `${r.label ? r.label + ' ' : 'PR '}${ms(c.pr)}` });
        });
        break;

      case 'dropped':
        signal.pWaves.filter(p => inView(p + 0.05)).forEach(p => {
          const conducted = signal.complexes.some(c => c.at > p && c.at - p < 0.5);
          if (!conducted) out.push({ kind: 'point', lead: li, t: p + 0.05, label: 'P — not conducted', alert: true });
        });
        break;

      case 'qrs': {
        const c = firstWhole(li, r.beat || 0);
        if (!c) break;
        const tm = signal.timings(li, c);
        out.push({ kind: 'interval', lead: li, t1: tm.qrsOn, t2: tm.qrsOff, label: `${r.label ? r.label + ' ' : 'QRS '}${ms(tm.qrsOff - tm.qrsOn)}` });
        break;
      }

      case 'rr': {
        const peaks = cxIn.map(c => signal.timings(li, c).peak).filter(inView);
        for (let i = 0; i + 1 < peaks.length && i < (r.count || 2); i++) {
          out.push({ kind: 'interval', lead: li, t1: peaks[i], t2: peaks[i + 1], label: `RR ${ms(peaks[i + 1] - peaks[i])}`, row: 1 });
        }
        break;
      }

      case 'rate': {
        const peaks = cxIn.map(c => signal.timings(li, c).peak);
        if (peaks.length < 2) break;
        const rr = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
        const squares = rr / 0.2;
        out.push({ kind: 'note', label: `Rate ≈ 300 ÷ ${squares.toFixed(1)} large squares ≈ ${Math.round(60 / rr)}/min` });
        break;
      }

      case 't': {
        const c = firstWhole(li, r.beat || 0);
        if (!c) break;
        out.push({ kind: 'point', lead: li, t: signal.timings(li, c).tPeak, label: r.label || 'T wave' });
        break;
      }

      case 'u': {
        const c = firstWhole(li, r.beat || 0);
        const tm = c && signal.timings(li, c);
        if (tm?.uPeak && inView(tm.uPeak)) out.push({ kind: 'point', lead: li, t: tm.uPeak, label: r.label || 'U wave' });
        break;
      }

      case 'qt': {
        const c = firstWhole(li, r.beat || 0);
        if (!c) break;
        const tm = signal.timings(li, c);
        const qtc = tm.qt / Math.sqrt(c.rr);
        out.push({ kind: 'interval', lead: li, t1: tm.qrsOn, t2: tm.tEnd, label: `QT ${ms(tm.qt)} · QTc ${ms(qtc)}` });
        break;
      }

      case 'st': {
        const c = firstWhole(li, r.beat || 0);
        if (!c) break;
        const tm = signal.timings(li, c);
        // Measured as a reader does: 60 ms after J, against the PR baseline.
        const level = signal.value(li, tm.j + 0.06) - signal.value(li, tm.qrsOn - 0.02);
        const shown = Math.abs(level) < 0.03 ? 'isoelectric' : mm(level);
        out.push({ kind: 'span', lead: li, t1: tm.j, t2: Math.max(tm.j + 0.05, tm.tPeak - 0.04), label: `${r.label ? r.label + ' ' : 'ST '}${r.label === 'ST isoelectric' ? '' : shown}`.trim() });
        break;
      }

      case 'prseg': {
        const c = cxIn.find(k => k.pr && inView(k.at - k.pr));
        if (!c) break;
        out.push({ kind: 'point', lead: li, t: c.at - 0.03, label: r.label || 'PR segment' });
        break;
      }

      case 'kernel': {
        const c = firstWhole(li, r.beat || 0);
        if (!c) break;
        const morph = signal.morphOf(li, c);
        const k = morph.qrs[r.k];
        if (k) out.push({ kind: 'point', lead: li, t: c.at + k.c, label: r.label });
        break;
      }

      case 'pvc': {
        const c = cxIn.find(k => k.kind === 'pvc');
        if (c) out.push({ kind: 'point', lead: li, t: signal.timings(li, c).peak, label: 'PVC — early, broad, no P', alert: true });
        break;
      }

      case 'compensatory': {
        const pvc = cxIn.find(k => k.kind === 'pvc');
        if (!pvc) break;
        const before = [...cxIn].reverse().find(k => k.at < pvc.at && k.kind === 'normal');
        const next = cxIn.find(k => k.at > pvc.at && k.kind === 'normal');
        if (before && next) {
          out.push({ kind: 'interval', lead: li, t1: signal.timings(li, before).peak, t2: signal.timings(li, next).peak, label: `${ms(next.at - before.at)} = 2 sinus cycles (compensatory pause)`, row: 1 });
        }
        break;
      }

      case 'escape': {
        const c = cxIn.find(k => k.kind === 'escape');
        if (c) out.push({ kind: 'point', lead: li, t: signal.timings(li, c).peak, label: 'Broad escape QRS', alert: true });
        break;
      }

      case 'pac': {
        if (!signal.pKinds) break;
        signal.pWaves.forEach((p, i) => {
          if (signal.pKinds[i] === 1 && inView(p + 0.05)) {
            out.push({ kind: 'point', lead: li, t: p + 0.05, label: 'Early, different P (PAC)', alert: true });
          }
        });
        break;
      }

      case 'flutter': {
        // Mark the flutter waves between two beats: troughs every 0.2 s.
        const c = cxIn[0];
        if (!c) break;
        // The sawtooth's deepest point is at 78% of each 0.2 s cycle.
        let tw = Math.ceil((c.at + 0.05) / 0.2) * 0.2 + 0.78 * 0.2;
        let n = 0;
        while (tw < t1 && n < 5) {
          if (inView(tw)) out.push({ kind: 'point', lead: li, t: tw, label: n === 0 ? 'F wave (300/min)' : 'F', small: n > 0 });
          tw += 0.2; n++;
        }
        break;
      }

      case 'times': {
        // Points at a fixed period — for rhythms with no discrete complexes,
        // whose structure is in time: torsades' spindles and the twists
        // between them. Two labels at most, so the strip stays readable.
        let n = 0;
        for (let k = Math.ceil((t0 - (r.offset || 0)) / r.every); n < (r.max || 2); k++) {
          const t = (r.offset || 0) + k * r.every;
          if (t > t1) break;
          if (inView(t)) { out.push({ kind: 'point', lead: li, t, label: r.label, alert: r.alert }); n++; }
        }
        break;
      }

      case 'fwaves': {
        // A stretch of baseline between two beats.
        if (cxIn.length < 2) break;
        const a = signal.timings(li, cxIn[0]).tEnd + 0.04;
        const b = signal.timings(li, cxIn[1]).qrsOn - 0.04;
        if (b > a + 0.1) out.push({ kind: 'span', lead: li, t1: a, t2: b, label: 'Fibrillatory waves' });
        break;
      }

      default: break;
    }
  }
  return out;
}
