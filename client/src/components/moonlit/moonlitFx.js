/**
 * Moonlit main menu — the canvas effects and synthesised sound, ported from
 * the "Main Menu" design mockup. All coordinates are in the design's
 * 1672 × 941 artboard; the scene is scaled to cover the screen as a whole,
 * so the effects stay pinned to the painting.
 *
 * Sound goes through the app's shared audio graph (audio.js sfxBus), so the
 * player's volume and mute settings apply to it like every other sound.
 */
import { sfxBus } from '../../audio';

export const W = 1672;
export const H = 941;

// ── Canvas: stars, the tree's ring of lights, a shooting star, golden motes,
//    the Play sparkle burst and falling petals ────────────────────────────────

export function startScene(cv, { consumeBurst, fx, burstAt = { x: 434, y: 382 } } = {}) {
  const c = cv.getContext('2d');
  if (!c) return () => {};
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const R = Math.random;

  const stars = [];
  let guard = 0;
  while (stars.length < 90 && guard++ < 4000) {
    const x = R() * W, y = R() * 330;
    if (x < 520 && y > 135) continue;
    if (x >= 520 && x < 860 && y > 300) continue;
    if (x >= 860 && y > 240) continue;
    const dx = x - 553, dy = y - 115;
    if (dx * dx + dy * dy < 6400) continue;          // not on the moon
    stars.push({ x, y, r: 0.5 + R() * 1.2, p: R() * 6.28, s: 0.5 + R() * 1.6, flare: R() < 0.16 });
  }
  const newPetal = (initial) => {
    const top = R() < 0.6;
    return {
      x: initial ? R() * W : (top ? 200 + R() * W : W + 20),
      y: initial ? R() * H : (top ? -20 : R() * H * 0.7),
      vx: -(22 + R() * 40), vy: 16 + R() * 26,
      size: 5 + R() * 7, rot: R() * 6.28, vr: (R() - 0.5) * 2.4,
      ph: R() * 6.28, sw: 10 + R() * 22, fl: R() * 6.28, pink: R() < 0.55,
    };
  };
  const petals = Array.from({ length: reduce ? 10 : 30 }, () => newPetal(true));
  const motes = Array.from({ length: reduce ? 14 : 38 }, () => ({
    x: R() * W, y: 300 + R() * 300, vy: -(5 + R() * 12), ph: R() * 6.28,
    sp: 0.8 + R() * 1.6, r: 1 + R() * 1.6, sw: 6 + R() * 14,
  }));
  const sparks = [];
  let shoot = null, shootIn = 2.5, time = 0, last = 0, raf = 0, fxDirty = false;

  function burst() {
    for (let i = 0; i < 54; i++) {
      const a = R() * 6.283, sp = 80 + R() * 280;
      sparks.push({ x: burstAt.x + Math.cos(a) * 60, y: burstAt.y + Math.sin(a) * 14, vx: Math.cos(a) * sp * 1.4, vy: Math.sin(a) * sp * 0.8 - 40, life: 0, max: 0.7 + R() * 0.8, r: 1.2 + R() * 2.2 });
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    // 30 fps is plenty for slow stars and petals, and halves the cost of
    // redrawing and compositing a full-screen canvas on high-refresh screens.
    if (last && now - last < 31) return;
    if (!last) last = now;
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (reduce) dt *= 0.35;
    const t = (time += dt);
    if (consumeBurst && consumeBurst()) burst();
    c.clearRect(0, 0, W, H);
    let a;

    // Stars
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = '#fff3d6';
    for (const s of stars) {
      a = 0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(t * s.s + s.p), 2);
      c.globalAlpha = a;
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
      if (s.flare) {
        c.globalAlpha = a * 0.6;
        c.fillRect(s.x - s.r * 4.5, s.y - 0.4, s.r * 9, 0.8);
        c.fillRect(s.x - 0.4, s.y - s.r * 4.5, 0.8, s.r * 9);
      }
    }

    // Lights travelling round the tree's golden ring
    const cx = 1119, cy = 184, rx = 255, ry = 40, tilt = -0.063, ct = Math.cos(tilt), st = Math.sin(tilt);
    c.fillStyle = '#ffe9b0';
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 12; j++) {
        const ang = t * 0.45 + i * 1.2566 - j * 0.03;
        const ex = Math.cos(ang) * rx, ey = Math.sin(ang) * ry;
        const px = cx + ex * ct - ey * st, py = cy + ex * st + ey * ct;
        c.globalAlpha = (1 - j / 12) * 0.85;
        c.beginPath(); c.arc(px, py, 2.6 * (1 - j / 14), 0, 6.283); c.fill();
        if (j === 0) { c.globalAlpha = 0.22; c.beginPath(); c.arc(px, py, 9, 0, 6.283); c.fill(); }
      }
    }

    // Shooting star
    shootIn -= dt;
    if (!shoot && shootIn <= 0) shoot = { x: 520 + R() * 1000, y: 10 + R() * 110, life: 0 };
    if (shoot) {
      shoot.life += dt;
      const k = shoot.life / 0.9;
      if (k >= 1) { shoot = null; shootIn = 5 + R() * 8; } else {
        const sx = shoot.x - 560 * shoot.life, sy = shoot.y + 230 * shoot.life, sa = Math.sin(Math.PI * k);
        const g = c.createLinearGradient(sx, sy, sx + 120, sy - 49);
        g.addColorStop(0, `rgba(255,250,230,${sa.toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,250,230,0)');
        c.globalAlpha = 1; c.strokeStyle = g; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 120, sy - 49); c.stroke();
      }
    }

    // Drifting golden motes
    for (const m of motes) {
      m.y += m.vy * dt;
      if (m.y < 160) { m.y = 600; m.x = R() * W; }
      const mx = m.x + Math.sin(t * 0.6 + m.ph) * m.sw;
      a = (0.15 + 0.85 * Math.pow(0.5 + 0.5 * Math.sin(t * m.sp + m.ph), 3)) * Math.max(0, Math.min(1, (m.y - 160) / 120)) * Math.max(0, Math.min(1, (600 - m.y) / 80));
      c.globalAlpha = a * 0.22; c.fillStyle = '#ffd27a';
      c.beginPath(); c.arc(mx, m.y, m.r * 4, 0, 6.283); c.fill();
      c.globalAlpha = a; c.fillStyle = '#fff0c0';
      c.beginPath(); c.arc(mx, m.y, m.r, 0, 6.283); c.fill();
    }

    // Sparkle burst from the Play button — on its own canvas above the UI
    // when one is given, so the sparks fly over the button and the cards.
    const f = fx ? fx.getContext('2d') : c;
    if (fx && (sparks.length || fxDirty)) { f.clearRect(0, 0, W, H); fxDirty = sparks.length > 0; f.globalCompositeOperation = 'lighter'; }
    f.fillStyle = '#ffe6a6';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life += dt;
      if (q.life >= q.max) { sparks.splice(i, 1); continue; }
      q.vy += 70 * dt; q.vx *= 0.985; q.x += q.vx * dt; q.y += q.vy * dt;
      a = 1 - q.life / q.max;
      f.globalAlpha = a * 0.25; f.beginPath(); f.arc(q.x, q.y, q.r * 3.5, 0, 6.283); f.fill();
      f.globalAlpha = a; f.beginPath(); f.arc(q.x, q.y, q.r, 0, 6.283); f.fill();
    }
    f.globalAlpha = 1;

    // Falling petals
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < petals.length; i++) {
      let p = petals[i];
      p.x += (p.vx + Math.sin(t * 0.9 + p.ph) * p.sw) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 30 || p.x < -40) { petals[i] = p = newPetal(false); }
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + p.fl)));
      c.globalAlpha = 0.82;
      c.fillStyle = p.pink ? '#ffb4e6' : '#cfa4ff';
      c.beginPath();
      c.moveTo(-p.size, 0);
      c.bezierCurveTo(-p.size * 0.4, -p.size * 0.75, p.size * 0.6, -p.size * 0.6, p.size, 0);
      c.bezierCurveTo(p.size * 0.6, p.size * 0.6, -p.size * 0.4, p.size * 0.75, -p.size, 0);
      c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// ── Sound: night wind, a soft pad and distant chimes, plus UI cues ────────────
// Nothing is created until unlock() is called from a user gesture.

export function createMenuAudio() {
  let ac = null, bus = null, noiseBuf = null, amb = null, chimeT = 0, dead = false, lastHover = 0;
  const running = [];   // ambience sources, stopped on close (the context is shared)

  function ensure() {
    const b = sfxBus();
    if (!b) return false;                      // app is muted
    if (ac) return true;
    ac = b.c;
    const comp = ac.createDynamicsCompressor();
    comp.connect(b.out);
    bus = ac.createGain();
    bus.gain.value = 0.9;
    bus.connect(comp);
    const len = Math.floor(ac.sampleRate * 2.6);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const conv = ac.createConvolver(); conv.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.34;
    bus.connect(conv); conv.connect(wet); wet.connect(comp);
    const nlen = Math.floor(ac.sampleRate * 3);
    noiseBuf = ac.createBuffer(1, nlen, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(f, t, dur, vol, type, dest) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function chime(f, t, dur, vol, dest) {
    tone(f, t, dur, vol, 'sine', dest);
    tone(f * 2, t, dur * 0.6, vol * 0.3, 'sine', dest);
    tone(f * 4.2, t, dur * 0.25, vol * 0.08, 'sine', dest);
  }
  function thump(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.16);
  }
  function whoosh(t, dur) {
    const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(bus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function startAmbience() {
    const t = ac.currentTime;
    amb = ac.createGain(); amb.gain.value = 1; amb.connect(bus);
    // Night wind
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; lp.Q.value = 0.5;
    const wg = ac.createGain();
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.exponentialRampToValueAtTime(0.05, t + 4);
    src.connect(lp); lp.connect(wg); wg.connect(amb); src.start(t); running.push(src);
    const l1 = ac.createOscillator(), l1g = ac.createGain();
    l1.frequency.value = 0.07; l1g.gain.value = 240; l1.connect(l1g); l1g.connect(lp.frequency); l1.start(t); running.push(l1);
    const l2 = ac.createOscillator(), l2g = ac.createGain();
    l2.frequency.value = 0.113; l2g.gain.value = 0.02; l2.connect(l2g); l2g.connect(wg.gain); l2.start(t); running.push(l2);
    // Soft open-fifth pad
    const pad = ac.createGain();
    pad.gain.setValueAtTime(0.0001, t);
    pad.gain.exponentialRampToValueAtTime(1, t + 6);
    pad.connect(amb);
    [[130.81, 0.02], [196, 0.014], [261.63, 0.008]].forEach(([f, v]) => {
      const o = ac.createOscillator(), og = ac.createGain();
      o.frequency.value = f; og.gain.value = v; o.connect(og); og.connect(pad); o.start(t); running.push(o);
    });
    // Occasional distant chimes
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
    const next = () => {
      chimeT = setTimeout(() => {
        if (dead) return;
        if (ac.state === 'running' && !document.hidden) {
          const f = scale[Math.floor(Math.random() * scale.length)], now = ac.currentTime;
          chime(f, now, 3.2, 0.03, amb);
          if (Math.random() < 0.4) chime(f * 1.5, now + 0.35, 2.8, 0.02, amb);
        }
        next();
      }, 2600 + Math.random() * 4200);
    };
    next();
  }

  return {
    unlock() {
      if (dead || !ensure()) return;
      if (ac.state === 'suspended') { try { ac.resume(); } catch { /* ignore */ } }
      if (!amb) startAmbience();
    },
    hover(f) {
      if (!ac || ac.state !== 'running' || !sfxBus()) return;
      const t = ac.currentTime;
      if (t - lastHover < 0.05) return;
      lastHover = t;
      chime(f, t, 0.28, 0.045);
    },
    click(kind, f = 1046.5) {
      this.unlock();
      if (!ac || !sfxBus()) return;
      const t = ac.currentTime;
      if (kind === 'play') {
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093, 2637].forEach((n, i) => chime(n, t + i * 0.055, 1.6, 0.075));
        tone(261.63, t, 2.2, 0.05, 'triangle');
        tone(392, t, 2.2, 0.04, 'triangle');
        tone(523.25, t, 2.2, 0.03, 'triangle');
        whoosh(t, 0.75);
        thump(t);
      } else if (kind === 'bell') {
        chime(1318.5, t, 1.4, 0.1);
        tone(1318.5 * 2.76, t, 0.5, 0.03);
        chime(1318.5, t + 0.22, 1.6, 0.08);
      } else if (kind === 'logout') {
        chime(783.99, t, 0.4, 0.09);
        chime(523.25, t + 0.11, 0.7, 0.09);
      } else if (kind === 'settings') {
        tone(900, t, 0.05, 0.08, 'triangle');
        tone(1200, t + 0.08, 0.06, 0.07, 'triangle');
      } else {
        thump(t);
        chime(f / 2, t, 0.5, 0.1);
        chime(f * 0.75, t + 0.07, 0.8, 0.08);
      }
    },
    close() {
      dead = true;
      clearTimeout(chimeT);
      // The context is shared with the rest of the app, so only our own
      // ambience is faded out, never the context closed.
      if (amb && ac) {
        try {
          amb.gain.setTargetAtTime(0, ac.currentTime, 0.2);
          for (const n of running) n.stop(ac.currentTime + 1);
        } catch { /* ignore */ }
      }
      running.length = 0;
      amb = null;
    },
  };
}
