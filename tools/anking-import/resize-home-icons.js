'use strict';
/**
 * One-off: downscale the 10 home-images dashboard icons in place.
 *
 * They were uploaded at 1024-1536px source resolution but never render above
 * 34px CSS anywhere in the app (Dashboard.jsx / DashboardNew.jsx), which was
 * driving unnecessary Supabase Storage egress on every dashboard view. This
 * downloads each current icon, resizes to 128x128 (safe headroom for ~4x DPR),
 * and PUTs it back to the SAME object path (upsert) so no DB row or URL
 * changes. Uses the same .env service-role key as import-live.js.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const cfg = require('./config.js'); // loads .env into process.env as a side effect

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');

const TARGET = 128; // physical px; largest real display is 34px CSS

async function main() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/home_images?select=*`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const rows = await r.json();

  const results = [];
  for (const row of rows) {
    if (!row.slot_name.startsWith('icon_')) continue; // only the header/nav icons, not chest_image etc.

    const u = new URL(row.image_url);
    const marker = '/object/public/home-images/';
    const objectPath = decodeURIComponent(u.pathname.slice(u.pathname.indexOf(marker) + marker.length));

    const getRes = await fetch(row.image_url);
    const inputBuf = Buffer.from(await getRes.arrayBuffer());
    const beforeBytes = inputBuf.length;
    const beforeMeta = await sharp(inputBuf).metadata();

    const outputBuf = await sharp(inputBuf)
      .resize(TARGET, TARGET, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/home-images/${objectPath}`, {
      method: 'PUT',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
        'cache-control': 'max-age=31536000',
      },
      body: outputBuf,
    });
    const uploadJson = await uploadRes.json().catch(() => ({}));

    const entry = {
      slot: row.slot_name,
      objectPath,
      before: { w: beforeMeta.width, h: beforeMeta.height, bytes: beforeBytes },
      after: { w: TARGET, h: TARGET, bytes: outputBuf.length },
      uploadOk: uploadRes.ok,
      uploadStatus: uploadRes.status,
      uploadJson,
    };
    results.push(entry);
    console.log(
      row.slot_name, uploadRes.ok ? 'OK' : 'FAIL', uploadRes.status,
      `${beforeMeta.width}x${beforeMeta.height} ${(beforeBytes / 1024).toFixed(0)}KB -> ` +
      `${TARGET}x${TARGET} ${(outputBuf.length / 1024).toFixed(1)}KB`
    );
  }
  fs.writeFileSync(path.join(__dirname, 'out', 'resize-home-icons-report.json'), JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
