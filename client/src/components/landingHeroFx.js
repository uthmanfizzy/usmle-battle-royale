/**
 * Landing hero — the canvas effects and the synthesised sound, ported from
 * the "Medvale hero" design mockup. Nothing here is a file: every sound is
 * built with Web Audio, every particle drawn on one canvas.
 *
 *   startHeroFx(canvas, getArt, opts)  → stop()
 *   createHeroAudio(opts)               → { unlock, sfx, setMuted, close, ... }
 */

const PARTICLES = 110;
const VOLUME = 70;        // percent

// ── Canvas: fog banks, drifting embers, leaf shards, the staff's flame ────────

export function startHeroFx(cv, getArt, { consumeBurst } = {}) {
  const ctx = cv.getContext('2d');
  if (!ctx) return () => {};
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const R = Math.random;
  const rr = (a, b) => a + R() * (b - a);
  function sprite(size, stops) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) gr.addColorStop(o, col);
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const glowS = sprite(64, [[0, 'rgba(215,255,170,1)'], [0.22, 'rgba(130,255,90,0.6)'], [1, 'rgba(60,200,40,0)']]);
  const fogS = sprite(256, [[0, 'rgba(110,170,95,0.5)'], [0.5, 'rgba(80,130,70,0.18)'], [1, 'rgba(60,100,50,0)']]);
  const fogs = [], motes = [], shards = [], wisps = [], sparks = [], rings = [];
  let wispAcc = 0, sparkAcc = 0;
  let last = performance.now();
  const t0 = last;
  let raf = 0;

  const mote = (seed) => ({ u: rr(-0.05, 1.05), v: seed ? rr(0, 1) : 1.05, vx: rr(0.002, 0.012), vy: rr(0.006, 0.03), s: rr(0.5, 2.1), ph: rr(0, 6.28), tw: rr(0.4, 1.7), a: rr(0.25, 0.9) });
  const shard = (seed) => ({ u: seed ? rr(0, 1) : rr(-0.05, 0.9), v: seed ? rr(0, 1) : 1.05, vx: rr(0.006, 0.028), vy: rr(0.004, 0.02), rot: rr(0, 6.28), vr: rr(-1.2, 1.2), len: rr(3, 8), wid: rr(1, 2.6), ph: rr(0, 6.28), a: rr(0.2, 0.55) });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (reduce) dt *= 0.2;
    const T = (now - t0) / 1000;
    const k = Math.max(0.55, Math.min(1.4, w / 1892));
    const dens = reduce ? Math.min(PARTICLES, 40) : PARTICLES;
    let i, x, y, al, s;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    // Where the staff's crystal sits right now (the art breathes and moves).
    let sx = w * 0.52, sy = h * 0.25, ka = h / 907;
    const art = getArt();
    if (art) {
      const ar = art.getBoundingClientRect();
      const cr = cv.getBoundingClientRect();
      if (ar.width) {
        sx = ar.left - cr.left + ar.width * 0.2;
        sy = ar.top - cr.top + ar.height * 0.24;
        ka = ar.height / 907;
      }
    }

    // Fog banks
    while (fogs.length < 7) {
      fogs.push({ u: rr(-0.2, 1.2), v: rr(0.3, 1), r: rr(0.16, 0.32), vx: rr(0.006, 0.018) * (R() < 0.5 ? -1 : 1), a: rr(0.1, 0.22), ph: rr(0, 6.28), f: rr(0.05, 0.14) });
    }
    for (const fg of fogs) {
      fg.u += fg.vx * dt;
      if (fg.u > 1.4) fg.u = -0.4;
      if (fg.u < -0.4) fg.u = 1.4;
      const fr = fg.r * w;
      ctx.globalAlpha = fg.a * (0.6 + 0.4 * Math.sin(T * fg.f * 6.28 + fg.ph));
      ctx.drawImage(fogS, fg.u * w - fr, fg.v * h - fr * 0.55, fr * 2, fr * 1.1);
    }

    // Drifting embers
    while (motes.length < dens) motes.push(mote(true));
    if (motes.length > dens) motes.length = dens;
    for (i = 0; i < motes.length; i++) {
      let m = motes[i];
      m.u += (m.vx + 0.006 * Math.sin(T * 0.6 + m.ph)) * dt;
      m.v -= m.vy * dt;
      if (m.v < -0.05 || m.u > 1.08) { m = mote(false); motes[i] = m; }
      al = m.a * (0.3 + 0.7 * Math.min(1, Math.max(0, (m.u - 0.15) / 0.5))) * (0.3 + 0.7 * Math.abs(Math.sin(T * m.tw + m.ph)));
      s = m.s * k * 3.6;
      ctx.globalAlpha = al;
      ctx.drawImage(glowS, m.u * w - s, m.v * h - s, s * 2, s * 2);
    }

    // Leaf-like shards
    const nS = Math.round(dens / 7);
    while (shards.length < nS) shards.push(shard(true));
    if (shards.length > nS) shards.length = nS;
    ctx.fillStyle = 'rgb(160,205,90)';
    for (i = 0; i < shards.length; i++) {
      let sh = shards[i];
      sh.u += sh.vx * dt;
      sh.v -= sh.vy * dt;
      sh.rot += sh.vr * dt;
      if (sh.v < -0.05 || sh.u > 1.08) { sh = shard(false); shards[i] = sh; }
      x = sh.u * w; y = sh.v * h;
      const cs = Math.cos(sh.rot), sn = Math.sin(sh.rot);
      const ln = sh.len * k, wd = sh.wid * k;
      ctx.globalAlpha = sh.a * (0.3 + 0.7 * Math.min(1, Math.max(0, (sh.u - 0.15) / 0.5))) * (0.55 + 0.45 * Math.sin(T * 1.1 + sh.ph));
      ctx.setTransform(dpr * cs, dpr * sn, -dpr * sn, dpr * cs, dpr * x, dpr * y);
      ctx.beginPath();
      ctx.moveTo(-ln, 0); ctx.lineTo(0, -wd); ctx.lineTo(ln, 0); ctx.lineTo(0, wd);
      ctx.closePath();
      ctx.fill();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Flame rising off the crystal
    wispAcc += (reduce ? 6 : 30) * dt;
    while (wispAcc >= 1 && wisps.length < 90) {
      wispAcc -= 1;
      wisps.push({ x: sx + rr(-9, 9) * ka, y: sy + rr(-6, 10) * ka, vx: rr(-52, -14) * ka, vy: rr(-120, -55) * ka, life: rr(0.7, 1.5), age: 0, r: rr(9, 20) * ka, ph: rr(0, 6.28) });
    }
    if (wispAcc > 3) wispAcc = 0;
    for (i = wisps.length - 1; i >= 0; i--) {
      const q = wisps[i];
      q.age += dt;
      if (q.age >= q.life) { wisps.splice(i, 1); continue; }
      const p = q.age / q.life;
      q.x += (q.vx + 16 * ka * Math.sin(T * 4 + q.ph)) * dt;
      q.y += q.vy * dt;
      const rad = q.r * (1 + 0.7 * p) * (1 - 0.45 * p);
      ctx.globalAlpha = 0.16 * Math.sin(Math.PI * p);
      ctx.drawImage(glowS, q.x - rad, q.y - rad, rad * 2, rad * 2);
    }

    // Sparks: a trickle always, a burst when Enter is pressed
    sparkAcc += 3 * dt;
    while (sparkAcc >= 1) {
      sparkAcc -= 1;
      sparks.push({ x: sx + rr(-6, 6) * ka, y: sy, vx: rr(-40, 30) * ka, vy: rr(-150, -70) * ka, life: rr(0.8, 1.8), age: 0, r: rr(2, 4.5) * ka });
    }
    if (consumeBurst && consumeBurst()) {
      for (i = 0; i < 90; i++) {
        const ang = rr(0, 6.283), spd = rr(60, 420) * ka;
        sparks.push({ x: sx, y: sy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 40 * ka, life: rr(0.6, 1.7), age: 0, r: rr(2.5, 6) * ka });
      }
      rings.push({ r: 8 * ka, a: 0.8 });
      rings.push({ r: 2 * ka, a: 0.45 });
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.age += dt;
      if (sp.age >= sp.life) { sparks.splice(i, 1); continue; }
      const damp = 1 - 1.6 * dt;
      sp.vx *= damp;
      sp.vy = sp.vy * damp - 30 * ka * dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      ctx.globalAlpha = 0.9 * Math.pow(1 - sp.age / sp.life, 1.5);
      ctx.drawImage(glowS, sp.x - sp.r, sp.y - sp.r, sp.r * 2, sp.r * 2);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      const rg = rings[i];
      rg.r += 520 * ka * dt;
      rg.a -= 0.9 * dt;
      if (rg.a <= 0) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = rg.a;
      ctx.strokeStyle = 'rgb(150,255,110)';
      ctx.lineWidth = 2 * ka;
      ctx.beginPath();
      ctx.arc(sx, sy, rg.r, 0, 6.2832);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  raf = requestAnimationFrame(frame);
  return () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
}

// ── Sound: wind + low drone bed, chimes, crackle, and UI cues ─────────────────
//
// Browsers only allow audio after a user gesture, so nothing is created until
// unlock() is called from one (the hero's pointerdown).

export function createHeroAudio({ isMuted }) {
  let ac = null, master = null, bus = null, verb = null, noise = null, amb = null;
  let chimeT = 0, crackT = 0, lastHover = 0;

  function route(node, verbAmt) {
    node.connect(bus);
    if (verbAmt) {
      const s = ac.createGain();
      s.gain.value = verbAmt;
      node.connect(s);
      s.connect(verb);
    }
  }

  function tone(o) {
    if (!ac) return;
    const t0 = ac.currentTime + (o.at || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain, t0 + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    route(g, o.verb);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  function noiseBurst(o) {
    if (!ac) return;
    const t0 = ac.currentTime + (o.at || 0);
    const src = ac.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + o.dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain, t0 + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    route(g, o.verb);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + o.dur + 0.05);
  }

  const ambientOn = () => !!ac && ac.state === 'running' && !isMuted();

  function chime() {
    chimeT = setTimeout(() => {
      if (!ac) return;
      if (ambientOn()) {
        const notes = [659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
        const f = notes[Math.floor(Math.random() * notes.length)];
        tone({ f0: f, dur: 2.8, gain: 0.028, attack: 0.012, verb: 1 });
        tone({ f0: f * 2.01, dur: 1.6, gain: 0.007, attack: 0.01, verb: 1 });
        if (Math.random() < 0.4) tone({ f0: f * 1.5, dur: 2.4, gain: 0.016, attack: 0.02, verb: 1, at: 0.24 });
      }
      chime();
    }, 4500 + Math.random() * 6500);
  }

  function crackle() {
    crackT = setTimeout(() => {
      if (!ac) return;
      if (ambientOn()) {
        noiseBurst({ type: 'highpass', f0: 2400 + Math.random() * 3600, dur: 0.02 + Math.random() * 0.03, gain: 0.008 + Math.random() * 0.02, attack: 0.002 });
      }
      crackle();
    }, 90 + Math.random() * 430);
  }

  function ambient() {
    const now = ac.currentTime;
    amb = ac.createGain();
    amb.gain.value = 1;
    const fade = ac.createGain();
    fade.gain.setValueAtTime(0.0001, now);
    fade.gain.exponentialRampToValueAtTime(1, now + 4);
    amb.connect(fade);
    fade.connect(master);
    const send = ac.createGain();
    send.gain.value = 0.5;
    amb.connect(send);
    send.connect(verb);

    // Wind: band-passed noise that swells and shifts
    const src = ac.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 430;
    bp.Q.value = 0.7;
    const wg = ac.createGain();
    wg.gain.value = 0.085;
    const l1 = ac.createOscillator(); l1.frequency.value = 0.07;
    const l1g = ac.createGain(); l1g.gain.value = 230;
    l1.connect(l1g); l1g.connect(bp.frequency);
    const l2 = ac.createOscillator(); l2.frequency.value = 0.113;
    const l2g = ac.createGain(); l2g.gain.value = 0.045;
    l2.connect(l2g); l2g.connect(wg.gain);
    src.connect(bp); bp.connect(wg); wg.connect(amb);
    src.start(now); l1.start(now); l2.start(now);

    // Drone: a low A-minor bed with slow, uneven tremolo
    const voices = [
      [55, 'sine', 0.15, 0.05],
      [82.41, 'sine', 0.07, 0.083],
      [110.35, 'triangle', 0.034, 0.061],
      [130.81, 'sine', 0.026, 0.097],
      [164.81, 'sine', 0.02, 0.071],
      [220.6, 'sine', 0.011, 0.127],
      [261.63, 'sine', 0.008, 0.043],
    ];
    for (const [freq, type, gain, rate] of voices) {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ac.createGain();
      g.gain.value = gain;
      const lfo = ac.createOscillator();
      lfo.frequency.value = rate;
      const lg = ac.createGain();
      lg.gain.value = gain * 0.45;
      lfo.connect(lg); lg.connect(g.gain);
      osc.connect(g); g.connect(amb);
      osc.start(now); lfo.start(now);
    }
    chime();
    crackle();
  }

  function applyVolume() {
    if (!ac || !master) return;
    const target = isMuted() ? 0 : (VOLUME / 100) * 0.9;
    master.gain.setTargetAtTime(target, ac.currentTime, 0.06);
  }

  function ensure() {
    if (ac) {
      if (ac.state === 'suspended' && !document.hidden) ac.resume();
      return ac;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch { return null; }
    master = ac.createGain();
    master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    master.connect(comp);
    comp.connect(ac.destination);
    bus = ac.createGain();
    bus.connect(master);
    const len = Math.floor(ac.sampleRate * 3);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    verb = ac.createConvolver();
    verb.buffer = ir;
    const wet = ac.createGain();
    wet.gain.value = 0.42;
    verb.connect(wet);
    wet.connect(master);
    const nlen = Math.floor(ac.sampleRate * 2);
    noise = ac.createBuffer(1, nlen, ac.sampleRate);
    const nd = noise.getChannelData(0);
    for (let j = 0; j < nlen; j++) nd[j] = Math.random() * 2 - 1;
    ambient();
    applyVolume();
    return ac;
  }

  function sfx(name) {
    const hover = name === 'hover' || name === 'hoverCta';
    if (hover) {
      // Hovers never start the audio; they only sound once it is running.
      if (!ac || ac.state !== 'running') return;
      const n = Date.now();
      if (n - lastHover < 70) return;
      lastHover = n;
    } else {
      ensure();
    }
    if (!ac || isMuted()) return;
    if (name === 'hover') {
      tone({ f0: 1320, f1: 1760, dur: 0.07, gain: 0.03, verb: 0.3 });
    } else if (name === 'hoverCta') {
      noiseBurst({ f0: 600, f1: 2600, q: 1.2, dur: 0.24, gain: 0.05, attack: 0.08, verb: 0.3 });
      tone({ f0: 440, dur: 0.2, gain: 0.02, attack: 0.04, verb: 0.6 });
    } else if (name === 'click') {
      tone({ type: 'triangle', f0: 420, f1: 260, dur: 0.11, gain: 0.09, verb: 0.2 });
    } else if (name === 'trailer') {
      noiseBurst({ type: 'highpass', f0: 3000, dur: 0.03, gain: 0.12, attack: 0.002 });
      noiseBurst({ type: 'highpass', f0: 3600, dur: 0.03, gain: 0.1, attack: 0.002, at: 0.09 });
      tone({ f0: 220, f1: 330, dur: 0.8, gain: 0.06, attack: 0.35, verb: 0.8, at: 0.1 });
      tone({ f0: 330, f1: 495, dur: 0.8, gain: 0.04, attack: 0.4, verb: 0.8, at: 0.1 });
    } else if (name === 'enter') {
      tone({ f0: 130, f1: 36, dur: 0.95, gain: 0.55, attack: 0.006 });
      noiseBurst({ type: 'lowpass', f0: 1400, f1: 120, dur: 0.6, gain: 0.28, attack: 0.004, verb: 0.4 });
      noiseBurst({ f0: 320, f1: 3200, q: 1.4, dur: 0.55, gain: 0.06, attack: 0.3, verb: 0.6 });
      const arp = [440, 523.25, 659.25, 880, 1046.5, 1318.51];
      arp.forEach((f, i) => {
        tone({ f0: f, dur: 2, gain: 0.06, attack: 0.01, verb: 1, at: 0.12 + i * 0.075 });
        tone({ type: 'triangle', f0: f / 2, dur: 1.2, gain: 0.025, attack: 0.02, verb: 0.6, at: 0.12 + i * 0.075 });
      });
      noiseBurst({ type: 'highpass', f0: 6000, dur: 1.3, gain: 0.018, attack: 0.25, verb: 1, at: 0.3 });
    } else if (name === 'unmute') {
      tone({ f0: 660, dur: 0.12, gain: 0.06, at: 0.08, verb: 0.4 });
      tone({ f0: 990, dur: 0.16, gain: 0.05, at: 0.17, verb: 0.5 });
    }
  }

  function onVisibility() {
    if (!ac) return;
    if (document.hidden) { if (ac.state === 'running') ac.suspend(); }
    else if (ac.state === 'suspended') ac.resume();
  }
  document.addEventListener('visibilitychange', onVisibility);

  return {
    unlock: () => !!ensure(),
    sfx,
    applyVolume,
    close() {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(chimeT);
      clearTimeout(crackT);
      const a = ac;
      ac = null;
      if (a && a.close) { try { a.close(); } catch { /* already closed */ } }
    },
  };
}
