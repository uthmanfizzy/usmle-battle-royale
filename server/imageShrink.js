// Shrinks an uploaded image before it goes to Supabase Storage, which is the
// one quota the free plan keeps running out of. Pictures were stored exactly as
// uploaded (multi-MB PNG screenshots); re-encoding to WebP and capping the
// longest side keeps them visually the same at a fraction of the size.
//
// Never makes things worse: animated or unknown formats, decode failures, and
// results that are not actually smaller all return the original untouched.
let sharp = null;
try { sharp = require('sharp'); } catch { /* not installed: uploads pass through */ }

const RESIZABLE = new Set(['jpeg', 'png', 'webp']);

/**
 * @param {Buffer} buffer   the uploaded bytes
 * @param {string} mimeType what the client said it is
 * @param {string} ext      the extension the caller would otherwise use
 * @param {{maxDim?: number, quality?: number}} [opts]
 * @returns {Promise<{buffer: Buffer, mimeType: string, ext: string}>}
 */
async function shrinkImage(buffer, mimeType, ext, { maxDim = 1600, quality = 80 } = {}) {
  const original = { buffer, mimeType, ext };
  if (!sharp || !Buffer.isBuffer(buffer) || buffer.length === 0) return original;
  try {
    const meta = await sharp(buffer).metadata();
    if (!RESIZABLE.has(meta.format)) return original;          // gif, svg, avif…
    if ((meta.pages || 1) > 1) return original;                 // animated webp/png
    const out = await sharp(buffer)
      .rotate()                                                 // honour EXIF orientation
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
    if (out.length >= buffer.length) return original;
    console.log(`[shrinkImage] ${meta.format} ${meta.width}x${meta.height} ${Math.round(buffer.length / 1024)} KB -> webp ${Math.round(out.length / 1024)} KB`);
    return { buffer: out, mimeType: 'image/webp', ext: 'webp' };
  } catch (err) {
    console.warn('[shrinkImage] kept original:', err.message);
    return original;
  }
}

// Page backgrounds and hero art are shown full-screen, so they keep more pixels.
const BACKGROUND = { maxDim: 2560, quality: 85 };

module.exports = { shrinkImage, BACKGROUND };
