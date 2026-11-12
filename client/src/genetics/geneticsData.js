/**
 * Genetics Roulette — the conditions.
 *
 * Each condition has its inheritance `pattern`, the `gene` (or chromosomal
 * change) behind it, a one-line classic `clue`, and a `fact` worth knowing.
 * Gene labels are unique strings, so a gene can be offered as a distractor
 * for another condition without two options ever reading the same.
 *
 * Mendelian and mitochondrial conditions get a RISK question, computed from
 * the parents' genotypes (geneticsEngine.js) — never typed. Chromosomal and
 * imprinting conditions get a MECHANISM question instead, curated here,
 * because their recurrence risk is not a Punnett square.
 *
 * Patterns follow First Aid for USMLE Step 1 (e.g. fragile X and Alport as
 * X-linked dominant).
 */

export const PATTERNS = {
  AD: { label: 'Autosomal dominant', short: 'AD' },
  AR: { label: 'Autosomal recessive', short: 'AR' },
  XLR: { label: 'X-linked recessive', short: 'XLR' },
  XLD: { label: 'X-linked dominant', short: 'XLD' },
  MITO: { label: 'Mitochondrial', short: 'Mito' },
  CHROM: { label: 'Chromosomal (aneuploidy / deletion)', short: 'Chromosomal' },
  IMPRINT: { label: 'Genomic imprinting', short: 'Imprinting' },
};

export const CONDITIONS = [
  // ── Autosomal dominant ────────────────────────────────────────────────
  { id: 'huntington', name: 'Huntington disease', short: 'Huntington', pattern: 'AD', gene: 'HTT · CAG repeat · chromosome 4', clue: 'Chorea, dementia and depression starting in the 30s–40s; caudate atrophy.', fact: 'Trinucleotide repeat — ANTICIPATION, especially when inherited from the father.' },
  { id: 'marfan', name: 'Marfan syndrome', short: 'Marfan', pattern: 'AD', gene: 'FBN1 (fibrillin-1) · chromosome 15', clue: 'Tall with long limbs, lens subluxation UPWARD, aortic root dilation.', fact: 'Death from aortic dissection; mitral valve prolapse common.' },
  { id: 'nf1', name: 'Neurofibromatosis type 1', short: 'NF1', pattern: 'AD', gene: 'NF1 (neurofibromin) · chromosome 17', clue: 'Café-au-lait spots, neurofibromas, Lisch nodules, axillary freckling.', fact: 'Neurofibromin is a tumour suppressor that switches off RAS. Variable expressivity.' },
  { id: 'nf2', name: 'Neurofibromatosis type 2', short: 'NF2', pattern: 'AD', gene: 'NF2 (merlin) · chromosome 22', clue: 'Bilateral vestibular schwannomas, juvenile cataracts, meningiomas.', fact: 'NF2 — chromosome 22, two acoustic neuromas.' },
  { id: 'achondroplasia', name: 'Achondroplasia', short: 'Achondroplasia', pattern: 'AD', gene: 'FGFR3 (activating mutation) · chromosome 4', clue: 'Short limbs with a normal-sized trunk and large head.', fact: 'Most cases are new mutations linked to ADVANCED PATERNAL AGE. Homozygosity is lethal.', noHomozygote: true },
  { id: 'adpkd', name: 'Autosomal dominant polycystic kidney disease', short: 'ADPKD', pattern: 'AD', gene: 'PKD1 (polycystin-1) · chromosome 16', clue: 'Bilateral enlarged cystic kidneys, flank pain, haematuria, hypertension.', fact: 'Berry aneurysms, hepatic cysts and mitral valve prolapse go with it.' },
  { id: 'fh', name: 'Familial hypercholesterolaemia', short: 'Familial hyper-chol.', pattern: 'AD', gene: 'LDLR (LDL receptor) · chromosome 19', clue: 'Very high LDL, tendon xanthomas, early MI.', fact: 'Homozygotes may have MIs in their teens.' },
  { id: 'fap', name: 'Familial adenomatous polyposis', short: 'FAP', pattern: 'AD', gene: 'APC · chromosome 5', clue: 'Hundreds to thousands of colonic polyps from adolescence.', fact: 'Colorectal cancer is certain without prophylactic colectomy.' },
  { id: 'tsc', name: 'Tuberous sclerosis', short: 'Tuberous sclerosis', pattern: 'AD', gene: 'TSC2 (tuberin) · chromosome 16', clue: 'Ash-leaf spots, angiofibromas, seizures, cardiac rhabdomyoma, renal angiomyolipoma.', fact: 'TSC1 (hamartin, chr 9) or TSC2 (tuberin, chr 16) — tumour suppressors acting on mTOR.' },
  { id: 'vhl', name: 'von Hippel–Lindau disease', short: 'von Hippel–Lindau', pattern: 'AD', gene: 'VHL · chromosome 3', clue: 'Haemangioblastomas of retina and cerebellum, bilateral renal cell carcinoma, phaeochromocytoma.', fact: 'VHL loss stabilises HIF-1α → angiogenesis. VHL has 3 letters → chromosome 3.' },
  { id: 'li-fraumeni', name: 'Li–Fraumeni syndrome', short: 'Li–Fraumeni', pattern: 'AD', gene: 'TP53 · chromosome 17', clue: 'Many cancers at a young age — sarcoma, breast, brain, leukaemia, adrenal (SBLA).', fact: 'Germline loss of the “guardian of the genome”.' },
  { id: 'myotonic', name: 'Myotonic dystrophy type 1', short: 'Myotonic dystrophy', pattern: 'AD', gene: 'DMPK · CTG repeat · chromosome 19', clue: 'Myotonia (cannot let go of a handshake), frontal balding, cataracts, testicular atrophy, arrhythmia.', fact: 'Trinucleotide repeat — anticipation, especially through the mother.' },
  { id: 'men2', name: 'Multiple endocrine neoplasia type 2A', short: 'MEN2A', pattern: 'AD', gene: 'RET (proto-oncogene) · chromosome 10', clue: 'Medullary thyroid carcinoma, phaeochromocytoma, parathyroid hyperplasia.', fact: 'RET carriers have prophylactic thyroidectomy.' },
  { id: 'spherocytosis', name: 'Hereditary spherocytosis', short: 'Hered. spherocytosis', pattern: 'AD', gene: 'Ankyrin / spectrin / band 3 (RBC cytoskeleton)', clue: 'Haemolytic anaemia, splenomegaly, raised MCHC, positive osmotic fragility (EMA binding ↓).', fact: 'Treated with splenectomy; Howell–Jolly bodies afterwards.' },
  { id: 'lynch', name: 'Lynch syndrome (HNPCC)', short: 'Lynch', pattern: 'AD', gene: 'MLH1 / MSH2 (DNA mismatch repair)', clue: 'Right-sided colon cancer before 50, endometrial and ovarian cancer; few polyps.', fact: 'Microsatellite instability. The 3-2-1 rule: 3 relatives, 2 generations, 1 before 50.' },

  // ── Autosomal recessive ───────────────────────────────────────────────
  { id: 'cf', name: 'Cystic fibrosis', short: 'Cystic fibrosis', pattern: 'AR', gene: 'CFTR (chloride channel) · chromosome 7', clue: 'Recurrent lung infections, meconium ileus, pancreatic insufficiency, raised sweat chloride.', fact: 'Commonest: ΔF508 — misfolded protein retained in the ER.' },
  { id: 'sickle', name: 'Sickle cell disease', short: 'Sickle cell', pattern: 'AR', gene: 'HBB — Glu6Val point mutation · chromosome 11', clue: 'Painful crises, dactylitis, autosplenectomy, Salmonella osteomyelitis.', fact: 'Glutamic acid → valine at position 6 of β-globin. Heterozygotes are protected from malaria.' },
  { id: 'pku', name: 'Phenylketonuria', short: 'PKU', pattern: 'AR', gene: 'PAH (phenylalanine hydroxylase) · chromosome 12', clue: 'Intellectual disability, fair skin, eczema and a musty body odour.', fact: 'Screened at birth; avoid phenylalanine (and aspartame), supplement tyrosine.' },
  { id: 'tay-sachs', name: 'Tay–Sachs disease', short: 'Tay–Sachs', pattern: 'AR', gene: 'HEXA (hexosaminidase A) · chromosome 15', clue: 'Progressive neurodegeneration, cherry-red macula, NO hepatosplenomegaly.', fact: 'GM2 ganglioside builds up in lysosomes; onion-skin lysosomes.' },
  { id: 'gaucher', name: 'Gaucher disease', short: 'Gaucher', pattern: 'AR', gene: 'GBA (glucocerebrosidase) · chromosome 1', clue: 'Hepatosplenomegaly, bone crises, avascular necrosis of the femur, pancytopenia.', fact: 'The commonest lysosomal storage disease. Gaucher cells look like crumpled tissue paper.' },
  { id: 'wilson', name: 'Wilson disease', short: 'Wilson', pattern: 'AR', gene: 'ATP7B (copper transporter) · chromosome 13', clue: 'Liver disease, Kayser–Fleischer rings, movement disorder and psychiatric change in a young person.', fact: 'Low ceruloplasmin; treat with penicillamine or trientine.' },
  { id: 'hemochromatosis', name: 'Hereditary haemochromatosis', short: 'Haemochromatosis', pattern: 'AR', gene: 'HFE — C282Y · chromosome 6', clue: 'Bronze diabetes: cirrhosis, diabetes, skin pigmentation, arthropathy.', fact: 'Associated with HLA-A3. Treat with phlebotomy.' },
  { id: 'sma', name: 'Spinal muscular atrophy', short: 'SMA', pattern: 'AR', gene: 'SMN1 (survival motor neuron) · chromosome 5', clue: '“Floppy baby” with tongue fasciculations — anterior horn cell loss.', fact: 'Type 1 is Werdnig–Hoffmann. Gene therapy and nusinersen now exist.' },
  { id: 'friedreich', name: 'Friedreich ataxia', short: 'Friedreich ataxia', pattern: 'AR', gene: 'FXN (frataxin) · GAA repeat · chromosome 9', clue: 'Ataxia in a child, kyphoscoliosis, pes cavus, hypertrophic cardiomyopathy, diabetes.', fact: 'The trinucleotide repeat disorder that is autosomal RECESSIVE.' },
  { id: 'cah', name: '21-Hydroxylase deficiency (CAH)', short: 'CAH (21-OH)', pattern: 'AR', gene: 'CYP21A2 · chromosome 6', clue: 'Ambiguous genitalia in a female infant, salt wasting, hypotension, high 17-OH-progesterone.', fact: 'The commonest form of congenital adrenal hyperplasia.' },
  { id: 'alkaptonuria', name: 'Alkaptonuria', short: 'Alkaptonuria', pattern: 'AR', gene: 'HGD (homogentisate oxidase) · chromosome 3', clue: 'Urine that turns black on standing, dark connective tissue (ochronosis), arthritis.', fact: 'A defect in tyrosine breakdown.' },
  { id: 'hurler', name: 'Hurler syndrome', short: 'Hurler', pattern: 'AR', gene: 'IDUA (α-L-iduronidase) · chromosome 4', clue: 'Gargoylism, corneal clouding, hepatosplenomegaly, developmental delay.', fact: 'Heparan and dermatan sulfate accumulate. Hunter is the X-linked one, with NO corneal clouding.' },
  { id: 'galactosemia', name: 'Classic galactosaemia', short: 'Galactosaemia', pattern: 'AR', gene: 'GALT (galactose-1-phosphate uridyltransferase)', clue: 'Jaundice, vomiting and infantile cataracts after starting milk; E. coli sepsis.', fact: 'Remove galactose and lactose from the diet.' },
  { id: 'at', name: 'Ataxia–telangiectasia', short: 'Ataxia–telangiectasia', pattern: 'AR', gene: 'ATM (DNA damage repair) · chromosome 11', clue: 'Cerebellar ataxia, spider angiomas, IgA deficiency, sinopulmonary infections.', fact: 'Raised AFP; high risk of lymphoma and leukaemia; radiation sensitive.' },

  // ── X-linked recessive ────────────────────────────────────────────────
  { id: 'dmd', name: 'Duchenne muscular dystrophy', short: 'Duchenne', pattern: 'XLR', gene: 'DMD (dystrophin) — frameshift · Xp21', clue: 'Boy with proximal weakness, Gowers sign, calf pseudohypertrophy, cardiomyopathy.', fact: 'Dystrophin is the largest human gene. Becker is the in-frame, milder form.' },
  { id: 'hemophilia-a', name: 'Haemophilia A', short: 'Haemophilia A', pattern: 'XLR', gene: 'F8 (factor VIII) · Xq28', clue: 'Haemarthroses and deep bleeding in a boy; prolonged PTT, normal PT and platelets.', fact: 'Treat with factor VIII or desmopressin (mild cases).' },
  { id: 'hemophilia-b', name: 'Haemophilia B', short: 'Haemophilia B', pattern: 'XLR', gene: 'F9 (factor IX) · Xq27', clue: 'Bleeding like haemophilia A, but factor IX is low (Christmas disease).', fact: 'Prolonged PTT; corrects with mixing study.' },
  { id: 'g6pd', name: 'G6PD deficiency', short: 'G6PD', pattern: 'XLR', gene: 'G6PD · Xq28', clue: 'Haemolysis after fava beans, sulfa drugs, primaquine or infection; Heinz bodies, bite cells.', fact: 'The commonest human enzyme deficiency; malaria protection.' },
  { id: 'fabry', name: 'Fabry disease', short: 'Fabry', pattern: 'XLR', gene: 'GLA (α-galactosidase A) · Xq22', clue: 'Burning pain in hands and feet, angiokeratomas, hypohidrosis, later renal and cardiac failure.', fact: 'Ceramide trihexoside accumulates.' },
  { id: 'hunter', name: 'Hunter syndrome', short: 'Hunter', pattern: 'XLR', gene: 'IDS (iduronate-2-sulfatase) · Xq28', clue: 'Mild Hurler-like features with aggressive behaviour and NO corneal clouding.', fact: 'Hunters need to see clearly to aim — no corneal clouding.' },
  { id: 'lesch-nyhan', name: 'Lesch–Nyhan syndrome', short: 'Lesch–Nyhan', pattern: 'XLR', gene: 'HPRT1 (hypoxanthine-guanine phosphoribosyltransferase) · Xq26', clue: 'Self-mutilation, gout, dystonia and orange “sand” in the nappy.', fact: 'Defective purine salvage → hyperuricaemia.' },
  { id: 'bruton', name: 'Bruton X-linked agammaglobulinaemia', short: 'Bruton XLA', pattern: 'XLR', gene: 'BTK (Bruton tyrosine kinase) · Xq22', clue: 'A boy with recurrent bacterial infections after 6 months, absent B cells and tonsils.', fact: 'Infections begin when maternal IgG wanes.' },
  { id: 'wiskott', name: 'Wiskott–Aldrich syndrome', short: 'Wiskott–Aldrich', pattern: 'XLR', gene: 'WAS (WASp) · Xp11', clue: 'Thrombocytopenia, eczema and recurrent infections (TIE) in a boy.', fact: 'Small platelets; raised risk of autoimmunity and lymphoma.' },
  { id: 'otc', name: 'Ornithine transcarbamylase deficiency', short: 'OTC deficiency', pattern: 'XLR', gene: 'OTC · Xp11.4', clue: 'Hyperammonaemia in a newborn boy with RAISED urinary orotic acid.', fact: 'The commonest urea cycle disorder.' },

  // ── X-linked dominant ─────────────────────────────────────────────────
  { id: 'rickets', name: 'Hypophosphataemic rickets', short: 'Hypophos. rickets', pattern: 'XLD', gene: 'PHEX · Xp22', clue: 'Rickets that does not respond to vitamin D; low phosphate from renal wasting.', fact: 'Raised FGF23. Also called vitamin D–resistant rickets.' },
  { id: 'fragile-x', name: 'Fragile X syndrome', short: 'Fragile X', pattern: 'XLD', gene: 'FMR1 · CGG repeat · Xq27.3', clue: 'Intellectual disability, long face, large jaw, large ears, macro-orchidism.', fact: 'Trinucleotide repeat with hypermethylation. The commonest inherited cause of intellectual disability.' },
  { id: 'alport', name: 'Alport syndrome', short: 'Alport', pattern: 'XLD', gene: 'COL4A5 (type IV collagen) · Xq22', clue: 'Haematuria, sensorineural deafness and eye problems (“can’t see, can’t pee, can’t hear a bee”).', fact: 'Split, basket-weave glomerular basement membrane.' },

  // ── Mitochondrial ─────────────────────────────────────────────────────
  { id: 'melas', name: 'MELAS', short: 'MELAS', pattern: 'MITO', gene: 'mtDNA — MT-TL1 (tRNA-Leu)', clue: 'Mitochondrial myopathy, encephalopathy, lactic acidosis and stroke-like episodes.', fact: 'Ragged red fibres on muscle biopsy. Severity varies with heteroplasmy.' },
  { id: 'lhon', name: 'Leber hereditary optic neuropathy', short: 'LHON', pattern: 'MITO', gene: 'mtDNA — MT-ND4 (complex I)', clue: 'Sudden bilateral painless vision loss in a young man.', fact: 'Only passed on by the mother; more men affected.' },
  { id: 'merrf', name: 'MERRF', short: 'MERRF', pattern: 'MITO', gene: 'mtDNA — MT-TK (tRNA-Lys)', clue: 'Myoclonic epilepsy with ragged red fibres.', fact: 'Every child of an affected mother inherits it; none of an affected father’s.' },

  // ── Chromosomal and imprinting (mechanism question) ───────────────────
  { id: 'down', name: 'Down syndrome', short: 'Down', pattern: 'CHROM', gene: 'Trisomy 21', clue: 'Flat face, epicanthal folds, single palmar crease, ASD/AVSD, duodenal atresia, early Alzheimer disease.', fact: 'Quad screen: ↓ AFP, ↑ β-hCG, ↓ estriol, ↑ inhibin A.',
    mech: { answer: 'Maternal meiotic nondisjunction', others: [['Robertsonian translocation', 'The cause in about 4% — the one that can recur in families.'], ['Mosaicism', 'Post-zygotic, about 1% — usually milder.'], ['Uniparental disomy', 'Both copies from one parent — the mechanism in some Prader–Willi and Angelman cases.']], why: 'About 95% of Down syndrome is meiotic nondisjunction, mostly in maternal meiosis I — which is why risk climbs with maternal age.' } },
  { id: 'edwards', name: 'Edwards syndrome', short: 'Edwards', pattern: 'CHROM', gene: 'Trisomy 18', clue: 'Clenched fists with overlapping fingers, rocker-bottom feet, micrognathia, prominent occiput.', fact: 'Death usually within the first year. Quad screen: ↓ AFP, ↓ β-hCG, ↓ estriol, normal inhibin.',
    mech: { answer: 'Meiotic nondisjunction', others: [['Microdeletion', 'Microdeletions cause Williams, DiGeorge and cri-du-chat — not trisomies.'], ['Trinucleotide repeat expansion', 'That is Huntington, fragile X, myotonic dystrophy, Friedreich ataxia.'], ['Imprinting defect', 'Imprinting causes Prader–Willi and Angelman syndromes.']], why: 'Trisomies arise from nondisjunction — chromosomes failing to separate in meiosis.' } },
  { id: 'patau', name: 'Patau syndrome', short: 'Patau', pattern: 'CHROM', gene: 'Trisomy 13', clue: 'Holoprosencephaly, cleft lip and palate, polydactyly, cutis aplasia, microphthalmia.', fact: 'Death usually within the first year.',
    mech: { answer: 'Meiotic nondisjunction', others: [['Microdeletion', 'Microdeletions cause Williams, DiGeorge and cri-du-chat.'], ['Mitochondrial mutation', 'Mitochondrial disease is a point mutation in mtDNA, not a whole extra chromosome.'], ['Imprinting defect', 'Imprinting causes Prader–Willi and Angelman syndromes.']], why: 'Trisomy 13 is mostly nondisjunction; a minority are Robertsonian translocations.' } },
  { id: 'turner', name: 'Turner syndrome', short: 'Turner', pattern: 'CHROM', gene: '45,XO', clue: 'Short stature, webbed neck, shield chest, bicuspid aortic valve, coarctation, streak ovaries.', fact: 'The commonest cause of primary amenorrhoea. Horseshoe kidney.',
    mech: { answer: 'Loss of an X chromosome (meiotic or mitotic error)', others: [['Trisomy from maternal nondisjunction', 'That adds a chromosome — Turner is a missing one.'], ['Microdeletion of 22q11', 'That is DiGeorge syndrome.'], ['X-linked recessive mutation', 'Turner is a whole missing chromosome, not a single-gene mutation.']], why: 'Usually the PATERNAL X (or Y) is lost. About half are mosaics.' } },
  { id: 'klinefelter', name: 'Klinefelter syndrome', short: 'Klinefelter', pattern: 'CHROM', gene: '47,XXY', clue: 'Tall man with small firm testes, gynaecomastia, infertility, female hair distribution.', fact: 'Barr body present; raised FSH and LH, low testosterone.',
    mech: { answer: 'Meiotic nondisjunction of the sex chromosomes', others: [['Robertsonian translocation', 'Robertsonian translocations involve acrocentric autosomes (13, 14, 15, 21, 22).'], ['Microdeletion', 'Klinefelter is an EXTRA chromosome, not a deletion.'], ['Uniparental disomy', 'That is two copies from one parent with the normal count — not an extra X.']], why: 'Nondisjunction in either parent gives the extra X.' } },
  { id: 'cri-du-chat', name: 'Cri-du-chat syndrome', short: 'Cri-du-chat', pattern: 'CHROM', gene: '5p deletion', clue: 'A high-pitched, cat-like cry, microcephaly, intellectual disability, VSD.', fact: '“Cri du chat” = cry of the cat; chromosome 5 short arm.',
    mech: { answer: 'Congenital deletion of the short arm of chromosome 5', others: [['Trisomy 5', 'There is no viable trisomy 5 — this is a deletion.'], ['Trinucleotide repeat expansion', 'That is Huntington, fragile X, myotonic dystrophy, Friedreich ataxia.'], ['Imprinting defect', 'Imprinting causes Prader–Willi and Angelman syndromes.']], why: 'A deletion of 5p (5p−).' } },
  { id: 'williams', name: 'Williams syndrome', short: 'Williams', pattern: 'CHROM', gene: '7q11.23 microdeletion (elastin)', clue: '“Elfin” face, extremely friendly, hypercalcaemia, supravalvular aortic stenosis.', fact: 'Good verbal skills with intellectual disability.',
    mech: { answer: 'Microdeletion on chromosome 7', others: [['Meiotic nondisjunction', 'Nondisjunction causes whole-chromosome trisomies and monosomies.'], ['Imprinting defect', 'Imprinting causes Prader–Willi and Angelman syndromes.'], ['Robertsonian translocation', 'That fuses acrocentric chromosomes — not a loss of 7q11.23.']], why: 'A microdeletion including the elastin gene (ELN) at 7q11.23.' } },
  { id: 'digeorge', name: '22q11.2 deletion (DiGeorge) syndrome', short: 'DiGeorge', pattern: 'CHROM', gene: '22q11.2 microdeletion', clue: 'CATCH-22: cardiac defects, abnormal face, thymic aplasia, cleft palate, hypocalcaemia.', fact: 'Failure of the 3rd and 4th pharyngeal pouches.',
    mech: { answer: 'Microdeletion on chromosome 22', others: [['Trisomy 22', 'It is a deletion, not an extra chromosome.'], ['X-linked recessive mutation', 'It affects both sexes and is on chromosome 22.'], ['Imprinting defect', 'Imprinting causes Prader–Willi and Angelman syndromes.']], why: 'A microdeletion at 22q11.2, usually new, detected by FISH or microarray.' } },
  { id: 'prader-willi', name: 'Prader–Willi syndrome', short: 'Prader–Willi', pattern: 'IMPRINT', gene: '15q11–13 — PATERNAL genes not expressed', clue: 'Hyperphagia and obesity, hypotonia, hypogonadism, intellectual disability.', fact: 'Maternal copies are imprinted (silenced) normally; losing the paternal copy leaves none.',
    mech: { answer: 'Deletion of the paternal 15q11–13 (or maternal uniparental disomy)', others: [['Deletion of the maternal UBE3A region', 'That is Angelman syndrome.'], ['Trinucleotide repeat on chromosome 15', 'No repeat expansion is involved.'], ['Trisomy 15', 'Not a trisomy — the missing piece is the paternal contribution.']], why: 'Paternal deletion (~70%) or maternal UPD (~25%): either way, no active paternal copy.' } },
  { id: 'angelman', name: 'Angelman syndrome', short: 'Angelman', pattern: 'IMPRINT', gene: 'UBE3A (15q11–13) — MATERNAL copy lost', clue: 'Inappropriate laughter (“happy puppet”), seizures, ataxia, severe intellectual disability.', fact: 'UBE3A is normally expressed only from the maternal allele in neurons.',
    mech: { answer: 'Deletion of the maternal 15q11–13 (or paternal uniparental disomy)', others: [['Deletion of the paternal 15q11–13', 'That is Prader–Willi syndrome.'], ['Microdeletion of 22q11', 'That is DiGeorge syndrome.'], ['Trinucleotide repeat on chromosome 15', 'No repeat expansion is involved.']], why: 'Maternal deletion or paternal UPD — no active maternal UBE3A. Remember: AngelMan = Maternal.' } },
];

// The rules for calling a pattern from a pedigree, laid out.
export const PATTERN_RULES = {
  AD: [['Every generation', 'Vertical transmission'], ['Male = female', 'Male-to-male transmission happens'], ['Affected × unaffected', '50% of children affected'], ['Often', 'Structural proteins, tumour suppressors; variable expressivity']],
  AR: [['Skips generations', 'Horizontal — siblings affected, parents not'], ['Parents', 'Usually both carriers; consanguinity'], ['Carrier × carrier', '25% affected · 50% carriers'], ['Often', 'Enzyme deficiencies']],
  XLR: [['Mostly males', 'Sons of carrier mothers'], ['No male-to-male', 'Fathers pass Y to sons'], ['Carrier mother', '50% of sons affected · 50% of daughters carriers'], ['Affected father', 'All daughters carriers, no sons affected']],
  XLD: [['Affected father', 'ALL daughters affected, NO sons'], ['Affected mother', '50% of sons and daughters'], ['Females', 'Affected more often, often milder']],
  MITO: [['Only from the MOTHER', 'Mitochondria come with the egg'], ['Affected mother', 'All children inherit it'], ['Affected father', 'No children inherit it'], ['Severity', 'Varies — heteroplasmy']],
  CHROM: [['Trisomies', 'Meiotic nondisjunction; risk ↑ with maternal age'], ['Monosomy X', 'Turner'], ['Microdeletions', 'Williams (7q11), DiGeorge (22q11), cri-du-chat (5p)']],
  IMPRINT: [['Imprinting', 'One parent’s copy is silenced by methylation'], ['Paternal copy missing', 'Prader–Willi'], ['Maternal copy missing', 'Angelman (UBE3A)'], ['Also', 'Uniparental disomy can cause either']],
};
