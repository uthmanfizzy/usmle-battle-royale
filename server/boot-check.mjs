/**
 * Does the server actually START?
 *
 * `node --check` parses; it does not EVALUATE. That difference shipped a
 * crash: a top-level spread of a `const` declared 2,200 lines further down
 * parsed perfectly and then threw "Cannot access X before initialization" the
 * moment Railway ran it, taking the whole API down while every check this repo
 * had stayed green.
 *
 * This boots the real server on a throwaway port with dummy secrets, waits for
 * it to say it is listening, and kills it. It catches anything that explodes
 * during module evaluation — temporal dead zones, bad requires, a typo in a
 * top-level call — which is the one class of fault that is both easy to
 * introduce and total in its effect.
 *
 * It is NOT a test of behaviour. Nothing here touches Supabase (there are no
 * credentials, and the server degrades to local questions without them).
 *
 *   node server/boot-check.mjs
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, 'index.js');

// Dummy, and deliberately obvious. The real ones are environment-only and
// must never appear in this repo — it is public.
const env = {
  ...process.env,
  PORT: '5599',
  ADMIN_PASSWORD: 'boot-check-dummy',
  JWT_SECRET: 'boot-check-dummy-jwt-secret',
  SESSION_SECRET: 'boot-check-dummy-session-secret',
  // Not set on purpose: SUPABASE_*, GOOGLE_*. The server degrades without
  // them, and a boot check that needs credentials is one nobody runs.
};

const child = spawn(process.execPath, [entry], { env, stdio: ['ignore', 'pipe', 'pipe'] });

let out = '';
let settled = false;

const finish = (code, message) => {
  if (settled) return;
  settled = true;
  clearTimeout(timer);
  child.kill('SIGKILL');
  console.log(message);
  if (code !== 0) {
    console.log('\n── server output ──');
    console.log(out.trim() || '(nothing)');
  }
  process.exit(code);
};

const watch = (buf) => {
  out += buf.toString();
  // The line the server prints once it is listening.
  if (/running on port/i.test(out)) {
    finish(0, '✅ BOOT OK — the server evaluated and started listening.');
  }
  // Anything that kills module evaluation shows up here first.
  if (/\b(ReferenceError|TypeError|SyntaxError|RangeError)\b/.test(out)) {
    finish(1, '❌ BOOT FAILED — the server threw while starting.');
  }
};

child.stdout.on('data', watch);
child.stderr.on('data', watch);

child.on('exit', (code) => {
  if (settled) return;
  finish(1, `❌ BOOT FAILED — the server exited (code ${code}) before it was listening.`);
});

const timer = setTimeout(() => {
  finish(1, '❌ BOOT FAILED — no "running on port" within 30s.');
}, 30000);
