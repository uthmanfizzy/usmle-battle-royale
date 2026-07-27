'use strict';
/**
 * Storage-key derivation and content-type sniffing for AnKing media.
 *
 * Pure functions — no network, no filesystem writes. Everything here is
 * deterministic so that re-running the importer derives the identical key for
 * the identical source file, which is what makes the upload idempotent.
 */

const crypto = require('crypto');

/**
 * Anki filenames contain spaces, parentheses, commas, apostrophes and non-ASCII
 * ("ZR) DHEA - androstenedione_1566160514431.jpg", "01 Apex, Normal S1 S2.mp3").
 * Those are hostile as storage keys, so the key is sanitised — but sanitising is
 * lossy and two distinct originals can collapse onto one key ("a b.jpg" and
 * "a_b.jpg"). A short hash of the ORIGINAL, case-sensitive filename is appended
 * to keep keys unique, and anking_media stores the original alongside the key so
 * references in card HTML still resolve.
 *
 * Case is deliberately NOT normalised in the hash input: the collection contains
 * "ZZoverall picture_1566160514431.JPG" whose on-disk casing differs from the
 * reference, and folding case here would merge files that Anki treats as one but
 * a case-sensitive store would not.
 */
function storageKey(originalFilename) {
  const name = String(originalFilename);
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const rawExt = dot > 0 ? name.slice(dot + 1) : '';

  const safeStem = stem
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // strip combining accents
    .replace(/[^A-Za-z0-9._-]/g, '_')  // everything else -> _
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80) || 'file';

  const safeExt = rawExt.replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 8);

  // Hash the exact original so distinct sources never collide.
  const hash = crypto.createHash('sha1').update(name, 'utf8').digest('hex').slice(0, 10);
  // Two-char shard keeps any single storage "folder" to a few hundred objects.
  const shard = hash.slice(0, 2);

  return `${shard}/${safeStem}_${hash}${safeExt ? '.' + safeExt : ''}`;
}

/**
 * Sniff the real type from magic bytes. The filename extension cannot be
 * trusted: the collection holds web-scraped images saved as .php/.aspx/.ashx/
 * .large, which would otherwise be served with a wrong or missing content type.
 */
function sniffContentType(buf, filename) {
  const b = buf;
  const startsWith = (...bytes) => bytes.every((v, i) => b[i] === v);

  if (b.length >= 3 && startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (b.length >= 8 && startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (b.length >= 6 && b.slice(0, 6).toString('latin1').match(/^GIF8[79]a$/)) return 'image/gif';
  if (b.length >= 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (b.length >= 12 && b.slice(4, 8).toString('latin1') === 'ftyp') {
    const brand = b.slice(8, 12).toString('latin1');
    if (brand.startsWith('M4A') || brand.startsWith('mp4') || brand.startsWith('isom')) return 'audio/mp4';
  }
  if (b.length >= 3 && b.slice(0, 3).toString('latin1') === 'ID3') return 'audio/mpeg';
  if (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'audio/mpeg'; // MPEG frame sync
  const head = b.slice(0, 400).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml';

  // Fall back to the extension, then to a generic binary type.
  const ext = String(filename).split('.').pop().toLowerCase();
  const byExt = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  };
  return byExt[ext] || 'application/octet-stream';
}

function mediaTypeOf(contentType) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'other';
}

module.exports = { storageKey, sniffContentType, mediaTypeOf };
