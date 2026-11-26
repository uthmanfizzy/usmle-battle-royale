/**
 * HY Diseases · Biochemistry — every disease with a clinical picture in the
 * First Aid biochemistry chapter, as a patient to diagnose.
 *
 * A case:
 *   id, name, chapter, inherit         identity (inherit: AR, AD, XR, XD, Trisomy, Deletion, Imprinting, Mitochondrial, Diet)
 *   who                                 "Name, age and sex" shown on the chart
 *   look                                the patient as drawn (HydPatient): age, sex, skin, hair, hairStyle,
 *                                       build, pose, motion, face, signs[], setting, smell, shorts, sleeveless, shirt
 *   history   [[speaker, line], ...]    told as chat bubbles
 *   exam      [[finding, insetKind|null], ...]  insets are ExamInset kinds
 *   labs      [line, ...]
 *   hint      one sentence
 *   lookalikes { otherId: why-not }    exactly three; each id must be another case
 *   learn     { plain, chain[], key[], tx, hook }
 *
 * All wording is original. Run tools/hyd-check.mjs after editing.
 */
import molecularCellular from './bio/molecularCellular';
import genetics from './bio/genetics';
import nutrition from './bio/nutrition';
import metabolism from './bio/metabolism';

export const BIO_CHAPTERS = [
  { id: 'molecular', name: 'Molecular', icon: '🧬', blurb: 'DNA repair, purine and pyrimidine slips', tint: '96, 165, 250' },
  { id: 'cellular', name: 'Cellular', icon: '🔬', blurb: 'Collagen, cilia, peroxisomes, the Golgi', tint: '45, 212, 191' },
  { id: 'genetics', name: 'Genetics', icon: '🧩', blurb: 'Trisomies, deletions, repeats, imprinting', tint: '167, 139, 250' },
  { id: 'nutrition', name: 'Nutrition', icon: '🥕', blurb: 'Vitamins, minerals, malnutrition', tint: '251, 191, 36' },
  { id: 'metabolism', name: 'Metabolism', icon: '⚗️', blurb: 'Sugars, amino acids, storage diseases, lipids', tint: '244, 114, 182' },
];

export const INHERIT_LABEL = {
  AR: 'Autosomal recessive',
  AD: 'Autosomal dominant',
  XR: 'X-linked recessive',
  XD: 'X-linked dominant',
  Trisomy: 'Chromosomal (trisomy)',
  Deletion: 'Chromosomal deletion',
  Imprinting: 'Genomic imprinting',
  Mitochondrial: 'Mitochondrial (maternal)',
  Diet: 'Nutritional',
};

// Clothes vary from patient to patient so the waiting room is not a row of
// identical blue shirts; a case can still choose its own.
const SHIRTS = ['#6d8fb3', '#c9879b', '#7fb0a8', '#d9a35a', '#8f7cc4', '#5f9e6e', '#c46a5a', '#4f7fa8', '#b88ab8', '#e0b04a', '#5aa1b5', '#a47857'];
const PANTS = ['#3c4a5e', '#4b3f36', '#2f3b33', '#55473a', '#2d3442'];

// Tests that would name the answer before you have reasoned it out: the
// enzyme assay, the gene, the karyotype, a level that is the disease's own
// name. They are held back and shown afterwards as "Confirmed by". Labs that
// DISCRIMINATE (ammonia, MMA vs homocysteine, sweat chloride, VLCFA...) stay
// in the workup: they are the reasoning.
const CONFIRM_LABS = new Set([
  'Genetic test: SMN1 deletion',
  'Genetics: paternal 15q11-13 deletion (or maternal uniparental disomy)',
  'Genetics: UBE3A lost on the maternal chromosome 15',
  'FMR1 gene: CGG expanded and methylated',
  'HTT gene: expanded CAG repeat',
  'Genetics: frameshift deletion in dystrophin', 'Muscle biopsy: no dystrophin',
  'Genetics: in-frame (non-frameshift) dystrophin deletion', 'Biopsy: some dystrophin present',
  'Genetics: de novo MECP2 mutation',
  'Mitochondrial DNA: point mutation',
  'Genetics: APC gene mutation (chromosome 5)',
  'Genetics: germline TP53 mutation',
  'Serum retinol: low',
  'Red cell transketolase: low activity',
  'Red cell glutathione reductase activity: low',
  'Low niacin metabolites in urine',
  'Biotin: low',
  'Vitamin C: low',
  '25-OH vitamin D: low',
  'Serum zinc: low',
  'Pyruvate kinase activity: low',
  'G6PD activity: low (test after recovery)',
  'Galactose-1-phosphate: high; GALT activity absent',
  'GALT activity: normal',
  'Phenylalanine: HIGH', 'Phenyl ketones in urine',
  'Urine homogentisic acid: high',
  'Homocysteine: very HIGH',
  'Urine organic acids: methylmalonic (or propionic) acid',
  'Acid alpha-glucosidase (acid maltase): absent',
  'α-galactosidase A: low',
  'Glucocerebrosidase: low',
  'Sphingomyelinase: low',
  'Hexosaminidase A: absent',
  'Galactocerebrosidase: low',
  'Arylsulfatase A: low',
  'α-L-iduronidase: low',
  'Iduronate-2-sulfatase: low',
  'Plasma carnitine: very LOW',
  'ApoB-48 and ApoB-100: absent',
  'Lipoprotein lipase (or apoC-II): deficient',
  'LDL receptor gene mutation',
  'ApoE2/E2 genotype',
]);
const CONFIRM_INSETS = new Set([
  'trisomy21', 'trisomy18', 'trisomy13', 'del5p', 'del7q', 'del22q', 'imprint15',
  'repeatCGG', 'repeatCAG', 'repeatCTG', 'repeatGAA', 'highHcy', 'highMMA', 'highPhe',
]);

export const BIO_CASES = [...molecularCellular, ...genetics, ...nutrition, ...metabolism].map((c, i) => ({
  ...c,
  look: { shirt: SHIRTS[(i * 5) % SHIRTS.length], pants: PANTS[(i * 3) % PANTS.length], ...c.look },
  exam: c.exam.filter(([, kind]) => !CONFIRM_INSETS.has(kind)),
  labs: (c.labs || []).filter(l => !CONFIRM_LABS.has(l)),
  confirm: [
    ...c.exam.filter(([, kind]) => CONFIRM_INSETS.has(kind)),
    ...(c.labs || []).filter(l => CONFIRM_LABS.has(l)).map(l => [l, null]),
  ],
}));

// Exported for tools/hyd-check.mjs: every held-back line must exist.
export const HELD_BACK = { labs: CONFIRM_LABS, insets: CONFIRM_INSETS };
export const BIO_BY_ID = Object.fromEntries(BIO_CASES.map(c => [c.id, c]));
