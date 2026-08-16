#!/usr/bin/env node
/**
 * One-off: give existing Supabase Storage objects a long Cache-Control.
 *
 * WHY
 * Every upload path in the app has set `cacheControl: '31536000'` since
 * 5e01fc5 (2026-08-14). Everything uploaded BEFORE that carries Storage's
 * default of `no-cache`, which means the browser re-downloads the file on
 * every single view — the same question figure re-fetched from Supabase for
 * every user, every time they see it. At ~300 KB average (largest 2.4 MB)
 * across ~90 question images, that is a large and completely avoidable share
 * of the egress bill.
 *
 * Cache-Control is fixed at UPLOAD time, and Storage has no "patch the
 * metadata" call — so the only way to change it is to re-upload the object
 * over itself. That is what this does: download, then upload to the same key
 * with upsert + the long cache header. Keys are unchanged, so every URL
 * already stored in the database keeps working.
 *
 * SAFETY
 *  - Dry run by default. Nothing is written without --apply.
 *  - Skips anything already cached, so it is safe to re-run.
 *  - Re-uploads only after a successful download of that exact object; a
 *    failed download skips the file rather than replacing it with nothing.
 *  - Content-Type is preserved from the existing object metadata.
 *
 * USAGE
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server/fix-storage-cache.js
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server/fix-storage-cache.js --apply
 *
 * The service role key is required: these are writes to Storage.
 */

const { createClient } = require('@supabase/supabase-js');

const CACHE_CONTROL = '31536000'; // 1 year. Keys embed Date.now(), so they are write-once.
const BUCKETS = ['question-images', 'images'];
const APPLY = process.argv.includes('--apply');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  console.error('SUPABASE_SERVICE_ROLE_KEY is required — this writes to Storage.');
  process.exit(1);
}
const supabase = createClient(url, key);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

// Storage's list() pages at 100 by default; walk until a short page comes back.
async function listAll(bucket) {
  const out = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit, offset });
    if (error) throw new Error(`list ${bucket}: ${error.message}`);
    const page = data || [];
    out.push(...page.filter(f => f.id)); // folders come back with a null id
    if (page.length < limit) break;
  }
  return out;
}

// list() metadata is not always populated, so read the live header instead —
// it is also the thing we actually care about being wrong.
async function currentCacheControl(bucket, name) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(name);
  try {
    const res = await fetch(data.publicUrl, { method: 'HEAD' });
    return {
      cacheControl: res.headers.get('cache-control'),
      contentType: res.headers.get('content-type'),
      bytes: Number(res.headers.get('content-length')) || 0,
      ok: res.ok,
    };
  } catch (e) {
    return { cacheControl: null, contentType: null, bytes: 0, ok: false, err: e.message };
  }
}

const isAlreadyCached = (cc) => !!cc && /max-age=\s*(\d+)/.test(cc) && Number(RegExp.$1) > 0;

async function fixOne(bucket, file) {
  const head = await currentCacheControl(bucket, file.name);
  if (!head.ok) return { status: 'unreachable', detail: head.err || 'HEAD failed' };
  if (isAlreadyCached(head.cacheControl)) return { status: 'already-cached', bytes: head.bytes };
  if (!APPLY) return { status: 'would-fix', bytes: head.bytes, was: head.cacheControl };

  const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(file.name);
  if (dlErr || !blob) return { status: 'download-failed', detail: dlErr?.message || 'empty body' };

  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.length === 0) return { status: 'download-failed', detail: 'zero bytes — refusing to overwrite' };

  const contentType = head.contentType || blob.type || 'application/octet-stream';
  const { error: upErr } = await supabase.storage.from(bucket).upload(file.name, buffer, {
    contentType,
    cacheControl: CACHE_CONTROL,
    upsert: true,
  });
  if (upErr) return { status: 'upload-failed', detail: upErr.message };
  return { status: 'fixed', bytes: buffer.length };
}

(async () => {
  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (pass --apply to write) ===');
  const totals = {};
  let bytesFixed = 0;

  for (const bucket of BUCKETS) {
    let files;
    try {
      files = await listAll(bucket);
    } catch (e) {
      console.log(`\n${bucket}: skipped (${e.message})`);
      continue;
    }
    console.log(`\n${bucket}: ${files.length} object(s)`);

    for (const file of files) {
      const r = await fixOne(bucket, file);
      totals[r.status] = (totals[r.status] || 0) + 1;
      if (r.status === 'fixed' || r.status === 'would-fix') {
        bytesFixed += r.bytes || 0;
        console.log(`  ${r.status === 'fixed' ? '✔' : '·'} ${file.name} (${kb(r.bytes || 0)}, was: ${r.was ?? 'no-cache'})`);
      } else if (r.status !== 'already-cached') {
        console.log(`  ! ${file.name} — ${r.status}${r.detail ? `: ${r.detail}` : ''}`);
      }
    }
  }

  console.log('\n--- summary ---');
  for (const [k, v] of Object.entries(totals)) console.log(`${k}: ${v}`);
  if (bytesFixed) {
    console.log(`\n${APPLY ? 'Now cached' : 'Would cache'}: ${(bytesFixed / 1048576).toFixed(1)} MB of images.`);
    console.log('Each of those was previously re-downloaded on EVERY view by EVERY user.');
  }
  if (!APPLY && bytesFixed) console.log('\nRe-run with --apply to write the change.');
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });
