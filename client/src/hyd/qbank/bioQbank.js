/**
 * HY Diseases · Biochemistry — the Qbank's own condensed cards, one per case
 * id in hyd/bioCases.js (tools/hyd-check.mjs checks the set matches). The
 * animated Clinic keeps the long story; the Qbank asks the same disease as a
 * short, high-yield vignette:
 *
 *   s    the stem: 2–3 sentences, the classic clues only. **text** is a
 *        highlighted clue. It must never name the disease, gene or enzyme assay.
 *   w    { 'highlighted text': 'why it happens' } — one entry per **clue**,
 *        shown as a pop-up when the clue is tapped after answering
 *   x    the explanation: 2–3 plain, full sentences
 *   hy   1–2 Step 1 high-yield points, as full sentences
 *   vs   [otherId, contrast]: the disease it is most often confused with (one
 *        of the case's lookalikes) and the difference that settles it
 *
 * Original wording throughout.
 */
import molecularCellular from './molecularCellular.js';
import genetics from './genetics.js';
import nutrition from './nutrition.js';
import metabolism from './metabolism.js';

export default { ...molecularCellular, ...genetics, ...nutrition, ...metabolism };
