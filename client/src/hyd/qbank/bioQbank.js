/**
 * HY Diseases · Biochemistry — the Qbank's own condensed cards.
 *
 * One entry per case id in hyd/bioCases.js (tools/hyd-check.mjs checks the
 * set matches). The animated Clinic keeps the long story; the Qbank asks the
 * same disease as a short, high-yield vignette:
 *
 *   s    the stem: 2–3 sentences, the classic clues only. **text** is shown
 *        bold. It must never name the disease, the gene or the enzyme assay.
 *   hy   three short high-yield points (mechanism, the association that gets
 *        asked, Dx/Tx)
 *   vs   [otherId, contrast]: the disease it is most often confused with
 *        (one of the case's lookalikes) and the one difference that settles it
 *
 * Original wording throughout.
 */
export default {
  // ── Molecular / cellular ───────────────────────────────────────────────
  ada_scid: {
    s: 'A 7-month-old girl has her fourth pneumonia, persistent **oral thrush** and chronic diarrhoea, and is falling off her growth curve. She has no palpable lymph nodes or tonsils. Lymphocytes (T and B) are very low and chest X-ray shows **no thymic shadow**.',
    hy: ['Adenosine deaminase lost → dATP builds up → toxic to lymphocytes', 'Autosomal recessive SCID: bacterial, viral AND fungal infections', 'Tx: stem cell transplant (or enzyme/gene therapy); no live vaccines'],
    vs: ['digeorge', 'DiGeorge also lacks a thymus, but brings low calcium (tetany), a cleft palate and a conotruncal heart defect; B cells are spared.'],
  },
  lesch_nyhan: {
    s: 'A 3-year-old boy **bites his lips and fingers** until they bleed and has dystonic limb postures. As a baby his nappies had **orange sand-like crystals**. Serum uric acid is high.',
    hy: ['HGPRT absent → purine salvage fails → uric acid overproduced', 'X-linked recessive: self-mutilation, dystonia, intellectual disability, gout', 'Tx: allopurinol or febuxostat (treats urate, not the behaviour)'],
    vs: ['rett', 'Rett is a girl who regresses with hand-wringing; uric acid is normal and there is no self-injury biting.'],
  },
  orotic_aciduria: {
    s: 'A 10-month-old boy is pale and failing to thrive. He has a **megaloblastic anaemia that did not respond to B12 or folate**, and needle crystals in the urine. Blood **ammonia is normal**.',
    hy: ['UMP synthase defect → pyrimidine synthesis stalls → orotic acid in urine', 'Megaloblastic anaemia resistant to B12/folate, normal ammonia', 'Tx: uridine (bypasses the block)'],
    vs: ['otc_def', 'OTC deficiency also raises urine orotic acid, but with HIGH ammonia, encephalopathy and no megaloblastic anaemia.'],
  },
  xeroderma: {
    s: 'A 9-year-old boy has blistered after brief sun exposure since infancy, with **dense freckling on sun-exposed skin**. A cheek lesion is a **squamous cell carcinoma**.',
    hy: ['Nucleotide excision repair defect: UV thymine dimers are not removed', 'Autosomal recessive; skin cancers (SCC, BCC, melanoma) in childhood', 'Tx: strict sun avoidance and skin surveillance'],
    vs: ['pellagra', 'Pellagra gives a photosensitive rash too, but with diarrhoea and dementia from low niacin, not childhood skin cancer.'],
  },
  lynch: {
    s: 'A 38-year-old woman has iron-deficiency anaemia from a **single right-sided colon cancer** with few polyps. Her mother had colon cancer at 44 and her aunt **endometrial cancer** in her 40s. Tumour shows **microsatellite instability**.',
    hy: ['DNA mismatch repair gene defect (MLH1, MSH2) → microsatellite instability', 'Autosomal dominant; proximal colon, endometrial and ovarian cancer', 'Screen: colonoscopy from early adulthood, every 1–2 years'],
    vs: ['fap', 'FAP carpets the colon with hundreds to thousands of polyps from the teens (APC); Lynch has few polyps.'],
  },
  sma: {
    s: 'A 3-month-old girl is profoundly floppy and cannot lift her head, but is **alert, smiling and tracks with her eyes**. She has **tongue fasciculations** and absent reflexes.',
    hy: ['SMN1 deletion → anterior horn cells lost (lower motor neuron)', 'Autosomal recessive "floppy baby": fasciculations, areflexia, cognition spared', 'Tx: nusinersen (antisense) or onasemnogene (gene therapy)'],
    vs: ['pompe', 'Pompe is a floppy baby too, but with a huge heart (cardiomegaly) and big tongue, without fasciculations.'],
  },
  i_cell: {
    s: 'A 14-month-old boy has increasingly **coarse facial features, gum overgrowth**, clouded corneas, claw hands and developmental delay. **Plasma lysosomal enzymes are high**.',
    hy: ['Golgi fails to add mannose-6-phosphate (phosphotransferase defect)', 'Enzymes are secreted out of the cell instead of reaching lysosomes', 'Autosomal recessive; usually fatal in childhood'],
    vs: ['hurler', 'Hurler looks similar (coarse face, cloudy corneas) but plasma enzymes are LOW, with heparan/dermatan sulfate in urine.'],
  },
  zellweger: {
    s: 'A 2-week-old girl has been **floppy since birth**, now has seizures, jaundice and hepatomegaly, with a high forehead and a wide fontanelle. Plasma **very-long-chain fatty acids are high**.',
    hy: ['Peroxisome biogenesis fails (PEX genes) → VLCFA cannot be broken down', 'Autosomal recessive: hypotonia, seizures, hepatomegaly, craniofacial dysmorphia', 'Early death in infancy'],
    vs: ['ald', 'Adrenoleukodystrophy also raises VLCFA, but in a school-age boy with neurological decline and adrenal insufficiency.'],
  },
  refsum: {
    s: 'A 19-year-old woman has **night blindness**, scaly skin, numb feet and an unsteady gait. Her **fourth toes are short**. Plasma **phytanic acid is high**.',
    hy: ['Peroxisomal alpha-oxidation defect → phytanic acid accumulates', 'Scaly skin, ataxia, retinitis pigmentosa, short 4th toe', 'Tx: diet low in phytanic acid (dairy, ruminant fat), plasmapheresis'],
    vs: ['abetalipoproteinemia', 'Abetalipoproteinaemia also gives retinitis pigmentosa and ataxia, but begins with infant steatorrhoea and acanthocytes.'],
  },
  ald: {
    s: 'An 8-year-old boy has **falling school performance**, worsening hearing, vision and gait, salt craving and **tanned skin**. Cortisol is low with high ACTH. Plasma **VLCFA are high**.',
    hy: ['ABCD1 defect → VLCFA cannot enter peroxisomes → demyelination', 'X-linked recessive: neurological decline + adrenal insufficiency', 'Tx: steroid replacement; stem cell transplant early'],
    vs: ['mld', 'MLD is a demyelinating decline too, but autosomal recessive, with no adrenal failure and normal VLCFA.'],
  },
  kartagener: {
    s: 'A 29-year-old man has lifelong **chronic sinusitis**, wet cough and ear infections, and **infertility** with immotile sperm. Heart sounds are loudest on the **right**. Nasal nitric oxide is low.',
    hy: ['Dynein arm defect → cilia and sperm flagella cannot beat', 'Autosomal recessive: bronchiectasis, situs inversus, infertility', 'Screen: low nasal nitric oxide; sweat chloride is normal'],
    vs: ['cystic_fibrosis', 'CF gives bronchiectasis too, but with a high sweat chloride, pancreatic insufficiency and no situs inversus.'],
  },
  oi: {
    s: 'A 6-year-old girl has had **five fractures after minor falls** (abuse was suspected). She has **blue sclerae** and worn, translucent teeth; her grandfather went deaf young. Calcium, phosphate and vitamin D are normal.',
    hy: ['Type I collagen defect (COL1A1/2), usually autosomal dominant', 'Brittle bones, blue sclerae, dentinogenesis imperfecta, hearing loss', 'Can be mistaken for child abuse; Tx: bisphosphonates'],
    vs: ['rickets', 'Rickets gives bowed legs and a rachitic rosary with LOW phosphate and vitamin D and HIGH ALP; OI labs are normal.'],
  },
  ehlers_danlos: {
    s: 'A 17-year-old girl dislocates her shoulder reaching for a shelf. Her **skin stretches far and springs back**, joints are **hypermobile**, and cuts heal into wide papery scars. Clotting tests are normal.',
    hy: ['Faulty collagen synthesis (classic type V; vascular type III)', 'Hyperextensible skin, hypermobile joints, easy bruising, poor healing', 'Vascular type: arterial, bowel or uterine rupture; berry aneurysms'],
    vs: ['marfan', 'Marfan is tall and lanky with an upward lens dislocation and aortic root dilation; the skin is not stretchy.'],
  },
  menkes: {
    s: 'A 4-month-old boy has **brittle, kinky, steel-coloured hair**, hypotonia, seizures and growth delay. Serum **copper and ceruloplasmin are low**.',
    hy: ['ATP7A defect → copper not absorbed → lysyl oxidase cannot cross-link collagen', 'X-linked recessive: kinky hair, seizures, hypotonia, bone fragility', 'Twisted blood vessels; often fatal in early childhood'],
    vs: ['zellweger', 'Zellweger is a floppy newborn with seizures and jaundice and high VLCFA, but normal hair and copper.'],
  },
  marfan: {
    s: 'A tall 16-year-old boy has very long arms and fingers, a sunken chest and a **lens dislocated upward and outward**. His father had aortic surgery. Echo shows **aortic root dilation**; homocysteine is normal.',
    hy: ['Fibrillin-1 defect (FBN1), autosomal dominant', 'Arachnodactyly, pectus, lens up and out, mitral valve prolapse', 'Death from aortic dissection; Tx: beta-blocker or ARB'],
    vs: ['homocystinuria', 'Homocystinuria is also marfanoid, but the lens goes DOWN and in, with clots and intellectual disability, and homocysteine is high.'],
  },
  alport: {
    s: 'A 21-year-old man has had **haematuria** since childhood, wears a hearing aid for **sensorineural deafness** and has lens problems. His maternal uncle was on dialysis by 30.',
    hy: ['Type IV collagen defect → split, layered glomerular basement membrane', 'Usually X-linked dominant: haematuria → kidney failure', '"Can\'t see, can\'t pee, can\'t hear high C" (anterior lenticonus)'],
    vs: ['fabry', 'Fabry also causes kidney failure, but begins with burning hand and foot pain, angiokeratomas and little sweating.'],
  },

  // ── Genetics ───────────────────────────────────────────────────────────
  down: {
    s: 'A 2-day-old girl of a 42-year-old mother is floppy, with a flat face, upslanting eyes and a **single palmar crease**. She vomits bile; X-ray shows a **double bubble**. Echo shows an AV septal defect.',
    hy: ['Trisomy 21, mostly maternal meiotic nondisjunction (rises with maternal age)', 'Endocardial cushion (AVSD), duodenal atresia, Hirschsprung', 'Later: early Alzheimer (APP on chr 21), ALL/AML; quad screen low AFP, high hCG and inhibin'],
    vs: ['edwards', 'Edwards has clenched fists with overlapping fingers and rocker-bottom feet; its quad screen is low across the board.'],
  },
  edwards: {
    s: 'A small newborn girl has **clenched fists with overlapping fingers**, a small jaw, low-set ears, a prominent occiput and **rocker-bottom feet**. Echo shows a VSD.',
    hy: ['Trisomy 18 (2nd most common trisomy at birth)', 'Clenched fists, rocker-bottom feet, micrognathia, prominent occiput', 'Quad screen: AFP, hCG and estriol low; inhibin normal; death within a year'],
    vs: ['patau', 'Patau has cleft lip/palate, polydactyly, microphthalmia and holoprosencephaly.'],
  },
  patau: {
    s: 'A newborn boy has a **cleft lip and palate**, **extra fingers**, very small eyes and a scalp skin defect. MRI shows **holoprosencephaly**; kidneys are polycystic.',
    hy: ['Trisomy 13', 'Cleft lip/palate, polydactyly, microphthalmia, cutis aplasia, holoprosencephaly', 'Heart defects and polycystic kidneys; death within a year'],
    vs: ['edwards', 'Edwards has clenched overlapping fingers and rocker-bottom feet, but no cleft or extra digits.'],
  },
  cri_du_chat: {
    s: 'A 3-week-old girl has a **high-pitched cry like a mewing kitten**, a small head, wide-set eyes and epicanthal folds. Echo shows a VSD.',
    hy: ['Deletion of the short arm of chromosome 5 (5p−)', 'Mewing cry, microcephaly, moderate–severe intellectual disability', 'Cardiac defects, usually VSD'],
    vs: ['williams', 'Williams (7q deletion) is an overly friendly child with an elfin face, high calcium and supravalvular aortic stenosis.'],
  },
  williams: {
    s: 'A 5-year-old boy with an **elfin face** talks happily to everyone, strangers included, and has strong verbal skills but poor drawing. He has a loud murmur; **serum calcium is high**.',
    hy: ['Microdeletion of 7q11.23 including the elastin gene', '"Cocktail party" personality, good verbal skills, intellectual disability', 'Hypercalcaemia (vitamin D sensitive), supravalvular aortic stenosis, renal artery stenosis'],
    vs: ['digeorge', 'DiGeorge (22q11) has LOW calcium, a cleft palate, no thymus and conotruncal heart defects.'],
  },
  digeorge: {
    s: 'A 4-day-old boy has a seizure and **carpal spasm**. He has a **cleft palate**, an unusual face and a loud murmur; chest X-ray shows **no thymus**. Calcium and PTH are low.',
    hy: ['22q11 deletion → 3rd and 4th pharyngeal pouches fail to develop', 'CATCH-22: Cardiac, Abnormal face, Thymic aplasia, Cleft palate, Hypocalcaemia', 'Conotruncal defects: truncus arteriosus, tetralogy of Fallot'],
    vs: ['ada_scid', 'ADA-SCID also lacks a thymic shadow, but loses B cells too, with no hypocalcaemia or facial and cardiac defects.'],
  },
  prader_willi: {
    s: 'A 7-year-old girl is **never full**; the family locks the fridge. As a baby she was **too floppy to feed**. She is obese, with small hands and feet, hypogonadism and mild intellectual disability.',
    hy: ['Imprinting: the PATERNAL 15q11-13 is missing (deletion or maternal UPD)', 'Infant hypotonia, then hyperphagia, obesity, hypogonadism', 'Maternal copy is normally silenced, so nothing covers the loss'],
    vs: ['angelman', 'Angelman is the MATERNAL loss: a happy, laughing child with seizures, ataxia and almost no speech.'],
  },
  angelman: {
    s: 'A 4-year-old boy **laughs and smiles constantly**, walks with stiff jerky steps, flaps his hands, has seizures and has **almost no words**.',
    hy: ['Imprinting: the MATERNAL UBE3A (15q) is lost (deletion or paternal UPD)', 'Inappropriate laughter, seizures, ataxia, severe intellectual disability', 'Opposite parent to Prader-Willi'],
    vs: ['prader_willi', 'Prader-Willi is the PATERNAL loss: hyperphagia and obesity after a floppy infancy, with only mild disability.'],
  },
  fragile_x: {
    s: 'A 15-year-old boy has intellectual disability, avoids eye contact and has a **long face, large jaw and large ears**, with **large testes**. A mid-systolic click is heard. Male relatives on the mother\'s side are similar.',
    hy: ['CGG repeat in FMR1 → hypermethylation; X-linked dominant with anticipation', '2nd most common genetic cause of intellectual disability; autistic features', 'Macroorchidism, mitral valve prolapse, joint laxity'],
    vs: ['down', 'Down is a flat face with upslanting eyes and a single palmar crease, found at birth; testes are not enlarged.'],
  },
  huntington: {
    s: 'A 42-year-old man has a year of **dance-like involuntary movements**, irritability, depression and forgetfulness. His father had the same, starting later. MRI shows **caudate atrophy**.',
    hy: ['CAG repeat in HTT on chromosome 4; autosomal dominant', 'Anticipation, especially through the father', 'Low GABA and ACh, high dopamine; Tx: tetrabenazine for chorea'],
    vs: ['friedreich', 'Friedreich is a childhood ataxia (GAA repeat, autosomal recessive) with a curved spine and heart disease, not chorea.'],
  },
  myotonic: {
    s: 'A 35-year-old man **cannot let go after a handshake**. He has frontal balding, a long thin face, **cataracts at 30**, small testes and a conduction block on ECG.',
    hy: ['CTG repeat in DMPK; autosomal dominant with anticipation', 'Myotonia, distal weakness, cataracts, frontal balding, gonadal atrophy', 'Arrhythmias and heart block are a cause of death'],
    vs: ['becker', 'Becker is proximal weakness with big calves and cramps in a young man; no myotonia, cataracts or balding.'],
  },
  friedreich: {
    s: 'A 12-year-old girl falls often, worse in the dark. She has **high arches**, a curving spine, lost vibration sense and **absent ankle reflexes**. Echo shows **hypertrophic cardiomyopathy**; glucose is high.',
    hy: ['GAA repeat in frataxin (FXN) → mitochondrial iron overload; autosomal recessive', 'Ataxia, kyphoscoliosis, pes cavus, lost DTRs and vibration sense', 'Hypertrophic cardiomyopathy is the main cause of death; diabetes'],
    vs: ['vit_e_def', 'Vitamin E deficiency gives the same spinal tract picture, but with fat malabsorption and haemolysis, no heart disease or high arches.'],
  },
  duchenne: {
    s: 'A 5-year-old boy waddles and **climbs up his own legs** to stand. He has **enlarged calves**. His maternal uncle used a wheelchair by 12. CK is very high.',
    hy: ['Frameshift deletion in dystrophin → no dystrophin; X-linked recessive', 'Gowers sign, calf pseudohypertrophy, proximal weakness before age 5', 'Death from dilated cardiomyopathy or respiratory failure'],
    vs: ['becker', 'Becker is the in-frame deletion: some dystrophin, onset in the teens, still walking in adulthood.'],
  },
  becker: {
    s: 'A 17-year-old boy has **thigh weakness and cramps** playing football but **still walks fine**. He has big calves; a maternal cousin is similar in his twenties. CK is high.',
    hy: ['In-frame (non-frameshift) dystrophin deletion → some working dystrophin', 'X-linked recessive; onset adolescence/early adulthood, milder than Duchenne', 'Calf pseudohypertrophy; cardiomyopathy can occur'],
    vs: ['duchenne', 'Duchenne starts before age 5 with a Gowers sign and no dystrophin (frameshift); wheelchair by the early teens.'],
  },
  rett: {
    s: 'A 3-year-old girl said "mama" at one but has **lost all words** and purposeful hand use, and now **wrings her hands** constantly. Head growth has slowed and she has seizures.',
    hy: ['De novo MECP2 mutation; X-linked dominant, almost only girls', 'Regression at 1–4 years: speech, hand use, motor skills', 'Hand-wringing, acquired microcephaly, seizures, breathing irregularities'],
    vs: ['angelman', 'Angelman never gains speech (no regression) and is a constantly happy, laughing child with hand flapping.'],
  },
  cystic_fibrosis: {
    s: 'A 4-year-old boy has had three pneumonias, a chronic wet cough, **pale greasy stools** and poor weight gain despite a big appetite. He had **meconium ileus** at birth and **tastes salty**.',
    hy: ['CFTR defect (ΔF508 misfolding) → thick secretions; autosomal recessive', 'Pseudomonas/S aureus infections, bronchiectasis, pancreatic insufficiency', 'Dx: sweat chloride high; male infertility (absent vas deferens)'],
    vs: ['kartagener', 'Primary ciliary dyskinesia gives bronchiectasis and infertility with situs inversus, but sweat chloride is normal and the pancreas works.'],
  },
  merrf: {
    s: 'A 24-year-old woman has **myoclonic jerks**, seizures and muscle fatigue on stairs. Her mother and all her mother\'s children are affected; her father\'s side is not. Muscle biopsy shows **ragged red fibres**.',
    hy: ['Mitochondrial DNA mutation: passed from mother to all children', 'Myoclonic epilepsy with ragged red fibres; lactic acidosis', 'Heteroplasmy → variable severity'],
    vs: ['lhon', 'LHON is also maternal but is sudden painless loss of central vision in a young man, without myoclonus.'],
  },
  lhon: {
    s: 'A 22-year-old man has **painless loss of central vision**, first in one eye and then six weeks later in the other. His **maternal uncle** lost his sight in his twenties.',
    hy: ['Mitochondrial DNA mutation → optic nerve degeneration; maternal inheritance', 'Acute painless bilateral vision loss, one eye then the other', 'Usually young men'],
    vs: ['merrf', 'MERRF is also maternal, but shows myoclonic seizures and ragged red fibres rather than isolated vision loss.'],
  },
  fap: {
    s: 'A 16-year-old girl has rectal bleeding and anaemia. Her **father had his colon removed at 30**. Colonoscopy shows **hundreds of polyps** carpeting the colon.',
    hy: ['APC mutation on chromosome 5q; autosomal dominant', 'Hundreds to thousands of adenomas from the teens; cancer is near-certain', 'Tx: prophylactic colectomy'],
    vs: ['lynch', 'Lynch gives few polyps and a right-sided cancer with endometrial cancer in relatives (mismatch repair).'],
  },
  li_fraumeni: {
    s: 'A 26-year-old woman with a **childhood bone sarcoma** now has breast cancer. Her brother had a childhood **brain tumour** and her mother leukaemia.',
    hy: ['Germline TP53 mutation; autosomal dominant', 'SBLA: Sarcoma, Breast, Leukaemia, Adrenal (and brain) cancers', 'Many cancer types at young ages'],
    vs: ['lynch', 'Lynch clusters colon, endometrial and ovarian cancers in adults, not childhood sarcomas and brain tumours.'],
  },

  // ── Nutrition ──────────────────────────────────────────────────────────
  vit_a_def: {
    s: 'A 6-year-old boy on a mostly rice diet **cannot see after dark**. His eyes are dry with **foamy grey patches on the conjunctiva**, and he keeps catching measles and chest infections.',
    hy: ['Retinal needed for rhodopsin → night blindness first', 'Xerophthalmia, Bitot spots, keratomalacia, dry skin, poor immunity', 'Vitamin A cuts measles deaths; also low in fat malabsorption'],
    vs: ['refsum', 'Refsum also gives night blindness, but with ataxia, scaly skin, a short 4th toe and high phytanic acid.'],
  },
  vit_a_tox: {
    s: 'A 20-year-old woman started an **acne tablet** three months ago and also takes a big multivitamin. She has a headache worse lying down with **swollen optic discs**, hair loss and peeling skin.',
    hy: ['Excess vitamin A (isotretinoin) → idiopathic intracranial hypertension', 'Chronic: alopecia, dry skin, arthralgias, hepatotoxicity', 'Teratogenic: pregnancy test and contraception required'],
    vs: ['zinc_def', 'Zinc deficiency also thins hair, but with a perioral/acral rash, lost taste and slow wound healing, no raised pressure.'],
  },
  wernicke: {
    s: 'A 55-year-old man who drinks heavily is found **confused** with **nystagmus and eye-movement palsies** and a wide-based **unsteady gait**. A glucose drip is about to be hung.',
    hy: ['Thiamine (B1) deficiency → mammillary body damage', 'Triad: confusion, ophthalmoplegia, ataxia → Korsakoff (amnesia, confabulation)', 'Give thiamine BEFORE glucose'],
    vs: ['b12_def', 'B12 deficiency is a slow posterior column loss with megaloblastic anaemia, not an acute ophthalmoplegia.'],
  },
  wet_beriberi: {
    s: 'A 48-year-old man who eats mostly **polished white rice** has leg swelling, breathlessness on walking, tingling feet and a **bounding pulse with warm hands**. X-ray shows a big heart.',
    hy: ['Thiamine (B1) deficiency → low ATP in heart and nerves', 'Wet: high-output heart failure, dilated cardiomyopathy, oedema', 'Dry: symmetric peripheral neuropathy'],
    vs: ['kwashiorkor', 'Kwashiorkor is oedema from protein lack in a small child, with a fatty liver and peeling skin, not heart failure.'],
  },
  b2_def: {
    s: 'A 30-year-old woman eating little dairy or meat has **cracks at the corners of her mouth**, a **sore magenta tongue** and light sensitivity with new corneal vessels.',
    hy: ['Riboflavin → FAD and FMN (oxidation–reduction)', 'Cheilosis, magenta tongue, corneal vascularisation', 'Sources: dairy and meat'],
    vs: ['b6_def', 'B6 deficiency also cracks the lips, but adds neuropathy, seizures and sideroblastic anaemia (often on isoniazid).'],
  },
  pellagra: {
    s: 'A 50-year-old man eating almost only **corn tortillas** has weeks of diarrhoea, new forgetfulness and a **dark scaly rash on sun-exposed skin**, including a band around the neck.',
    hy: ['Niacin (B3) deficiency → low NAD', '3 Ds: Diarrhoea, Dementia, Dermatitis (Casal necklace)', 'Causes: corn diet, Hartnup, carcinoid, isoniazid'],
    vs: ['hartnup', 'Hartnup gives the same rash in a child on a GOOD diet, from losing tryptophan in the urine.'],
  },
  hartnup: {
    s: 'An 8-year-old girl on a **normal varied diet** gets a red scaly rash on sun-exposed skin and **episodes of unsteady walking**. Cousins are similar. Urine has **high neutral amino acids**.',
    hy: ['Neutral amino acid transporter defect (gut and proximal tubule)', 'Tryptophan lost → low niacin → pellagra-like rash, ataxia', 'Autosomal recessive; Tx: high-protein diet and niacin'],
    vs: ['pellagra', 'Pellagra comes from a poor (corn) diet and adds diarrhoea and dementia; urine amino acids are normal.'],
  },
  b6_def: {
    s: 'A 40-year-old man started **TB treatment** two months ago. Now his feet burn and tingle, his lips are cracked, and last night he had a **seizure**. The marrow shows **ring sideroblasts**.',
    hy: ['Isoniazid depletes pyridoxine (B6) → cofactor for ALA synthase and neurotransmitters', 'Neuropathy, seizures, sideroblastic (microcytic) anaemia, cheilosis', 'Prevent: give B6 with isoniazid'],
    vs: ['b12_def', 'B12 deficiency causes a neuropathy too, but with a megaloblastic (macrocytic) anaemia and high MMA.'],
  },
  biotin_def: {
    s: 'A 23-year-old bodybuilder drinks **ten raw egg whites a day**. His hair is falling out, he has a scaly red rash around his eyes and mouth, and loose stools.',
    hy: ['Avidin in raw egg white binds biotin (B7)', 'Dermatitis, alopecia, enteritis', 'Biotin is the cofactor for carboxylases (pyruvate, acetyl-CoA, propionyl-CoA)'],
    vs: ['zinc_def', 'Zinc deficiency looks similar (rash, hair loss) but adds lost taste and slow wound healing, often on tube feeds.'],
  },
  folate_def: {
    s: 'A 28-year-old woman who is **30 weeks pregnant** is tired with a sore smooth tongue and **no neurological signs**. She has a megaloblastic anaemia; **homocysteine is high, MMA normal**.',
    hy: ['Folate needed for DNA synthesis → megaloblastic anaemia, hypersegmented neutrophils', 'NO neurology; homocysteine high, methylmalonic acid NORMAL', 'Causes: pregnancy, alcohol, poor diet, methotrexate/phenytoin'],
    vs: ['b12_def', 'B12 deficiency has the same anaemia but raises MMA too and damages the posterior columns.'],
  },
  b12_def: {
    s: 'A 68-year-old woman with **autoimmune thyroid disease** has numb feet, sways when she closes her eyes (**Romberg positive**) and is forgetful. She has a macrocytic anaemia; **MMA and homocysteine are both high**.',
    hy: ['B12 needed for methionine synthase and methylmalonyl-CoA mutase', 'Megaloblastic anaemia + subacute combined degeneration (can be permanent)', 'Pernicious anaemia: anti-intrinsic factor antibodies; stores last years'],
    vs: ['folate_def', 'Folate deficiency has the same anaemia, but MMA is normal and there are no neurological signs.'],
  },
  scurvy: {
    s: 'A 79-year-old widower living on **tea and toast** has **swollen bleeding gums**, a cut that will not heal, easy bruising and **corkscrew hairs**. Platelets and clotting tests are normal.',
    hy: ['Vitamin C needed to hydroxylate proline and lysine in collagen', 'Swollen gums, perifollicular haemorrhage, corkscrew hair, poor healing', 'Vitamin C also helps iron absorption'],
    vs: ['vit_k_def', 'Vitamin K deficiency bleeds with a PROLONGED PT/INR; the gums and hair are normal.'],
  },
  rickets: {
    s: 'A 2-year-old boy, **breastfed without supplements** and mostly indoors, has **bowed legs**, beading along the ribs and a soft skull. Phosphate is low, **ALP and PTH are high**.',
    hy: ['Vitamin D deficiency → poor bone mineralisation', 'Children: rickets (bowed legs, rachitic rosary, craniotabes); adults: osteomalacia', 'High ALP and PTH; low 25-OH vitamin D'],
    vs: ['oi', 'Osteogenesis imperfecta fractures easily with blue sclerae, and calcium, phosphate and ALP are normal.'],
  },
  vit_e_def: {
    s: 'A 14-year-old boy with **chronic pancreatitis and greasy stools** has leg weakness, sways with eyes closed and has a **haemolytic anaemia** with spiky red cells. MCV and MMA are normal.',
    hy: ['Vitamin E is an antioxidant protecting membranes; fat-soluble', 'Haemolysis, acanthocytes, posterior column and spinocerebellar damage', 'Looks like B12 deficiency, but no megaloblastic anaemia and MMA normal'],
    vs: ['b12_def', 'B12 deficiency damages the same tracts, but with a MACROCYTIC anaemia and high MMA.'],
  },
  vit_k_def: {
    s: 'A 5-day-old boy born at home **without birth injections** oozes blood from his umbilical stump. **PT and aPTT are prolonged**; platelets and bleeding time are normal.',
    hy: ['Vitamin K carboxylates factors II, VII, IX, X, protein C and S', 'Newborns have sterile guts and low stores → give vitamin K at birth', 'Adults: long antibiotics, fat malabsorption, warfarin'],
    vs: ['scurvy', 'Scurvy bleeds from fragile collagen (gums, follicles) with NORMAL clotting tests.'],
  },
  zinc_def: {
    s: 'A 45-year-old man on **tube feeding** after bowel surgery has lost his taste and smell, with a **red crusting rash around his mouth and on his hands and feet**, hair loss and a slowly healing wound.',
    hy: ['Zinc needed for many enzymes and wound healing', 'Perioral and acral rash, alopecia, dysgeusia, anosmia, hypogonadism', 'Inherited form: acrodermatitis enteropathica'],
    vs: ['biotin_def', 'Biotin deficiency also gives a periorificial rash and hair loss, but taste and wound healing are normal (raw egg whites).'],
  },
  kwashiorkor: {
    s: 'A 3-year-old boy, weaned onto **cassava porridge** when his sister was born, has a **swollen belly and pitting leg oedema**, an enlarged fatty liver, peeling skin and thin reddish hair. Albumin is low.',
    hy: ['Protein malnutrition with adequate calories → low albumin', 'MEALS: Malnutrition, Edema, Anemia, Liver (fatty), Skin lesions', 'Swollen belly in a small child'],
    vs: ['marasmus', 'Marasmus is total calorie lack: skin and bone, muscle wasting, NO oedema.'],
  },
  marasmus: {
    s: 'An 18-month-old girl in a drought has had very little food of any kind. She is **skin and bone** with an old-looking face and **no oedema**. Albumin is near normal.',
    hy: ['Total calorie (energy) deficiency', 'Severe muscle and fat wasting without oedema', 'Albumin often near normal'],
    vs: ['kwashiorkor', 'Kwashiorkor is protein lack: oedema, swollen belly, fatty liver and skin changes.'],
  },

  // ── Metabolism ─────────────────────────────────────────────────────────
  pdh_def: {
    s: 'A 3-month-old boy is floppy, feeds poorly and breathes fast with poor head control. He has a metabolic acidosis with **high lactate, pyruvate and alanine**; glucose is normal.',
    hy: ['Pyruvate cannot become acetyl-CoA → shunted to lactate and alanine', 'X-linked; neurological defects from infancy; arsenic mimics it (lipoic acid)', 'Tx: ketogenic diet (fat, lysine and leucine)'],
    vs: ['von_gierke', 'Von Gierke gives lactic acidosis with SEVERE fasting hypoglycaemia and a huge liver.'],
  },
  pk_def: {
    s: 'A 6-year-old girl needed transfusions for newborn jaundice and has been **mildly yellow ever since**, with **no trigger** making it worse. She has splenomegaly and **burr cells** on the smear.',
    hy: ['Pyruvate kinase lost → red cells make little ATP → rigid cells', 'Autosomal recessive: chronic extravascular haemolysis from birth', 'Splenomegaly, echinocytes; no triggers needed'],
    vs: ['g6pd_def', 'G6PD deficiency haemolyses in episodes after a trigger, with bite cells and Heinz bodies.'],
  },
  g6pd_def: {
    s: 'A 19-year-old man has fatigue, back pain and **cola-coloured urine** two days after eating **fava beans**; it happened once before after an antibiotic for a UTI. The smear shows **bite cells**.',
    hy: ['G6PD → NADPH → keeps glutathione reduced; loss → oxidant damage', 'X-linked recessive; most common enzyme deficiency; protects against malaria', 'Triggers: fava beans, sulfa drugs, primaquine, dapsone, infection; Heinz bodies'],
    vs: ['pk_def', 'PK deficiency gives continuous haemolysis from birth with no trigger, and burr cells.'],
  },
  fructosuria: {
    s: 'A healthy 30-year-old man has a routine medical. His urine dipstick for **glucose is negative**, but a **reducing-sugar test is positive**. Blood glucose and liver tests are normal.',
    hy: ['Fructokinase defect → fructose stays in blood and urine', 'Autosomal recessive; completely benign and asymptomatic', 'Fructose disorders are milder than the matching galactose ones'],
    vs: ['hfi', 'Hereditary fructose intolerance is aldolase B: vomiting and hypoglycaemia after fruit, with liver damage.'],
  },
  hfi: {
    s: 'An 8-month-old girl was fine on breast milk until **fruit purées and juice** were started. After each feed she vomits, sweats and goes floppy with **low blood sugar**; now she is jaundiced with a big liver.',
    hy: ['Aldolase B defect → fructose-1-phosphate traps phosphate', 'Low phosphate stops glycogenolysis and gluconeogenesis → hypoglycaemia', 'Tx: remove fructose, sucrose and sorbitol'],
    vs: ['fructosuria', 'Essential fructosuria (fructokinase) is harmless: no symptoms, just fructose in the urine.'],
  },
  galactokinase_def: {
    s: 'A 4-month-old girl feeds and grows well but **does not track faces or smile**. Both pupils look white: she has **bilateral cataracts**. Blood and urine galactose are high; liver tests are normal.',
    hy: ['Galactokinase defect → galactitol builds up in the lens', 'Relatively mild: infantile cataracts, otherwise well', 'Tx: remove galactose and lactose'],
    vs: ['classic_galactosemia', 'Classic galactosaemia (GALT) is a sick newborn: vomiting, jaundice, big liver and E coli sepsis, as well as cataracts.'],
  },
  classic_galactosemia: {
    s: 'A 6-day-old boy began **vomiting once breastfeeding got going**, is increasingly jaundiced with a big liver and **oil-drop cataracts**, and his blood culture grows **E coli**.',
    hy: ['GALT defect → galactose-1-phosphate is toxic', 'Failure to thrive, jaundice, hepatomegaly, cataracts, intellectual disability', 'E coli sepsis in neonates; Tx: stop galactose and lactose'],
    vs: ['galactokinase_def', 'Galactokinase deficiency causes cataracts only, in a baby who is otherwise well.'],
  },
  lactase_def: {
    s: 'A 24-year-old man gets bloating, cramps and **watery diarrhoea an hour after milk** or ice cream, though hard cheese is fine. **Breath hydrogen rises** after lactose; stool pH is low.',
    hy: ['Lactase lost (often with age) → colonic bacteria ferment lactose', 'Osmotic diarrhoea: high stool osmotic gap, low stool pH', 'Normal mucosa on biopsy; Tx: avoid dairy or take lactase'],
    vs: ['cystic_fibrosis', 'CF gives greasy fatty stools from pancreatic insufficiency with lung infections, not dairy-triggered watery diarrhoea.'],
  },
  pku: {
    s: 'A 2-year-old girl who **missed newborn screening** has seizures, no words yet, eczema, very fair skin and hair, and a **musty, mousy body odour**.',
    hy: ['Phenylalanine hydroxylase (or BH4) defect → tyrosine becomes essential', 'Intellectual disability, seizures, fair skin, eczema, musty odour', 'Tx: low-phenylalanine diet; maternal PKU harms the fetus'],
    vs: ['alkaptonuria', 'Alkaptonuria is a benign tyrosine-path defect: urine turns black on standing and cartilage darkens, without brain damage.'],
  },
  alkaptonuria: {
    s: 'A 50-year-old man has years of back and knee stiffness. Since childhood his **urine turns black if left standing**. His ear cartilage and sclerae have **blue-black patches**.',
    hy: ['Homogentisate oxidase defect → homogentisic acid builds up', 'Ochronosis: dark connective tissue, cartilage and sclerae', 'Autosomal recessive; usually benign but disabling arthralgias'],
    vs: ['g6pd_def', 'G6PD deficiency gives dark urine from haemolysis after a trigger, with anaemia and jaundice; urine is dark at once.'],
  },
  msud: {
    s: 'A 5-day-old girl fed well for two days, then began vomiting, became very sleepy and had a seizure. Her urine and **ear wax smell sweet, like burnt sugar**.',
    hy: ['Branched-chain α-ketoacid dehydrogenase defect → leucine, isoleucine, valine build up', 'Vomiting, poor feeding, sweet-smelling urine, severe brain damage', 'Tx: restrict branched-chain amino acids; give thiamine'],
    vs: ['pku', 'PKU is a toddler with a MUSTY smell, fair skin and slow developmental damage, not a sick newborn.'],
  },
  homocystinuria: {
    s: 'A tall, thin 14-year-old girl with learning difficulties has a **lens dislocated downward and inward** and a **DVT with no cause**. DEXA shows osteoporosis.',
    hy: ['Usually cystathionine β-synthase defect → homocysteine very high', 'Marfanoid habitus, intellectual disability, osteoporosis', 'Lens down and in; thrombosis and atherosclerosis; Tx: B6, B12, folate, cysteine'],
    vs: ['marfan', 'Marfan lens goes UP and out, intelligence is normal, clots are not a feature and homocysteine is normal.'],
  },
  cystinuria: {
    s: 'A 22-year-old man has his **third kidney stone since 16**; his sister has had stones too. The stones are faint on plain X-ray and urine shows **hexagonal crystals**.',
    hy: ['Transporter defect for Cystine, Ornithine, Lysine, Arginine (COLA)', 'Recurrent cystine stones, can form staghorns', 'Dx: cyanide-nitroprusside test; Tx: hydration, alkalinise urine'],
    vs: ['hartnup', 'Hartnup loses NEUTRAL amino acids (tryptophan): a pellagra-like rash and ataxia, not stones.'],
  },
  otc_def: {
    s: 'A 3-day-old boy was well for a day, then **stopped feeding, vomited and became drowsy** with fast breathing. His mother\'s brother died as a baby. **Ammonia is very high**, urine orotic acid high, BUN low.',
    hy: ['Most common urea cycle disorder; X-linked (the others are AR)', 'Carbamoyl phosphate spills into pyrimidine synthesis → orotic acid', 'Hyperammonaemia: vomiting, lethargy, cerebral oedema; no megaloblastic anaemia'],
    vs: ['orotic_aciduria', 'Hereditary orotic aciduria raises orotic acid with a NORMAL ammonia and a megaloblastic anaemia.'],
  },
  organic_acidemia: {
    s: 'A 2-week-old girl vomits, feeds poorly and is floppy with a big liver and a seizure. She has a **high anion gap metabolic acidosis with ketones**, low glucose and high ammonia.',
    hy: ['Methylmalonyl-CoA mutase or propionyl-CoA carboxylase defect', 'Infant: vomiting, hypotonia, anion gap acidosis, hypoglycaemia, hyperammonaemia', 'Some methylmalonic acidaemias respond to B12'],
    vs: ['msud', 'MSUD is the sweet burnt-sugar smell, with ammonia near normal and no large anion gap acidosis.'],
  },
  von_gierke: {
    s: 'A 6-month-old boy becomes **shaky and sweaty if he goes 3 hours without a feed**. He has a doll-like face, thin limbs and a **huge liver**. Lactate, uric acid and triglycerides are high; glucagon does not raise glucose.',
    hy: ['Glucose-6-phosphatase defect → liver cannot release glucose', 'Severe fasting hypoglycaemia; high lactate, urate (gout), triglycerides', 'Hepatomegaly and renomegaly; Tx: frequent cornstarch feeds, avoid fructose/galactose'],
    vs: ['cori', 'Cori (debranching enzyme) is a milder fasting hypoglycaemia with NORMAL lactate (gluconeogenesis works).'],
  },
  pompe: {
    s: 'A 4-month-old boy is very floppy, struggles to feed and has a **large tongue**. He sweats and breathes hard during feeds; chest X-ray shows a **very large heart**. Glucose is normal.',
    hy: ['Lysosomal acid α-glucosidase (acid maltase) defect', 'Cardiomegaly, hypotonia, macroglossia, exercise intolerance', 'Glucose normal; Tx: enzyme replacement'],
    vs: ['sma', 'SMA is a floppy but alert baby with tongue fasciculations and a NORMAL heart.'],
  },
  cori: {
    s: 'A 2-year-old girl gets **mildly shaky if she misses breakfast**, has an enlarged liver and tires easily walking. **Lactate is normal**; CK is mildly raised.',
    hy: ['Debranching enzyme (α-1,6-glucosidase) defect → limit-dextrin-like glycogen', 'Milder von Gierke with NORMAL lactate (gluconeogenesis intact)', 'Myopathy and cardiomyopathy can follow'],
    vs: ['von_gierke', 'Von Gierke is a SEVERE fasting hypoglycaemia with high lactate, urate and triglycerides.'],
  },
  mcardle: {
    s: 'A 19-year-old woman gets **painful cramps within minutes of sprinting**, does better after a short rest (**second wind**), and once passed **cola-coloured urine** after a hard session. Lactate does not rise with exercise.',
    hy: ['Muscle glycogen phosphorylase (myophosphorylase) defect', 'Cramps, myoglobinuria, second wind; blood glucose normal', 'Flat lactate on ischaemic forearm test; CK high'],
    vs: ['becker', 'Becker gives fixed proximal weakness and big calves, not exercise-triggered cramps with a second wind.'],
  },
  fabry: {
    s: 'A 15-year-old boy gets **burning pain in his hands and feet** when hot, **barely sweats**, and has **dark red spots around his navel and groin**. Urine shows protein. Maternal uncles are affected.',
    hy: ['α-galactosidase A defect → globotriaosylceramide builds up', 'X-linked recessive: neuropathic pain, angiokeratomas, hypohidrosis', 'Later: kidney failure, heart disease, stroke'],
    vs: ['alport', 'Alport is haematuria with deafness and lens changes, without pain crises or angiokeratomas.'],
  },
  gaucher: {
    s: 'A 25-year-old **Ashkenazi Jewish** woman has attacks of deep **bone pain**, a painful hip, easy bruising and fatigue. She has hepatosplenomegaly and pancytopenia; femurs look like **Erlenmeyer flasks**.',
    hy: ['Glucocerebrosidase defect → glucocerebroside in macrophages', 'Most common lysosomal storage disease: hepatosplenomegaly, pancytopenia, bone crises, AVN', '"Crumpled tissue paper" Gaucher cells; Tx: enzyme replacement'],
    vs: ['niemann_pick', 'Niemann-Pick is an infant with neurodegeneration and a cherry-red spot, with foam cells rather than bone crises.'],
  },
  niemann_pick: {
    s: 'A 6-month-old girl of **Ashkenazi Jewish** parents has lost the skills she had at 3 months. Her belly is big with **hepatosplenomegaly**, and there is a **cherry-red spot** on the macula.',
    hy: ['Sphingomyelinase defect → sphingomyelin builds up', 'Neurodegeneration, hepatosplenomegaly, cherry-red spot, foam cells', 'Autosomal recessive'],
    vs: ['tay_sachs', 'Tay-Sachs also has a cherry-red spot and regression, but NO hepatosplenomegaly, with an exaggerated startle.'],
  },
  tay_sachs: {
    s: 'A 7-month-old boy who rolled and laughed at 4 months can no longer sit, **startles violently at small noises** and has a **cherry-red spot**. Liver and spleen are **normal size**.',
    hy: ['Hexosaminidase A defect → GM2 ganglioside builds up', 'Regression, hyperacusis, hyperreflexia, cherry-red spot; onion-skin lysosomes', 'NO hepatosplenomegaly (vs Niemann-Pick)'],
    vs: ['niemann_pick', 'Niemann-Pick has the same cherry-red spot and regression, but WITH hepatosplenomegaly and foam cells.'],
  },
  krabbe: {
    s: 'A 5-month-old boy is **extremely irritable**, stiff and no longer follows toys; his optic discs are pale and **deep reflexes reduced**. Nerve conduction shows a peripheral neuropathy.',
    hy: ['Galactocerebrosidase defect → psychosine destroys myelin-making cells', 'Peripheral neuropathy, optic atrophy, developmental delay', 'Globoid cells; autosomal recessive'],
    vs: ['mld', 'MLD (arylsulfatase A) begins later, around walking age, with ataxia and loss of skills, and sulfatides in the urine.'],
  },
  mld: {
    s: 'A 2-year-old girl who walked at a year now **stumbles and falls constantly** and has lost words. Reflexes are reduced and nerve conduction is slow; MRI shows white matter damage.',
    hy: ['Arylsulfatase A defect → cerebroside sulfate (sulfatide) builds up', 'Central and peripheral demyelination: ataxia, dementia-like decline', 'Autosomal recessive'],
    vs: ['krabbe', 'Krabbe starts earlier (first months) with extreme irritability, optic atrophy and globoid cells.'],
  },
  hurler: {
    s: 'A 2-year-old boy has an increasingly **coarse face** with thick lips and tongue, **cloudy corneas**, loud snoring with apnoeas and hepatosplenomegaly, and has stopped learning words.',
    hy: ['α-L-iduronidase defect → heparan and dermatan sulfate build up', 'Gargoylism, corneal clouding, hepatosplenomegaly, airway obstruction', 'Autosomal recessive mucopolysaccharidosis'],
    vs: ['hunter', 'Hunter is milder, X-linked, with aggressive behaviour and CLEAR corneas.'],
  },
  hunter: {
    s: 'A 5-year-old boy has become **aggressive and hyperactive**, with a thickened face and stiff joints, but his **corneas are clear**. His maternal uncle had something similar.',
    hy: ['Iduronate-2-sulfatase defect → heparan and dermatan sulfate', 'Mild Hurler + aggression, NO corneal clouding', 'X-linked recessive ("Hunters aim for the X")'],
    vs: ['hurler', 'Hurler is autosomal recessive and more severe, with CLOUDY corneas.'],
  },
  carnitine_def: {
    s: 'A 3-year-old boy is weak and floppy and breathless with play. During a tummy bug he became drowsy with **low sugar and no ketones**. Echo shows a **dilated, poorly pumping heart**.',
    hy: ['Carnitine shuttle fails → long-chain fatty acids cannot enter mitochondria', 'Weakness, hypotonia, hypoketotic hypoglycaemia', 'Dilated cardiomyopathy; Tx: carnitine supplements'],
    vs: ['mcad', 'MCAD gives the same fasting hypoketotic hypoglycaemia in a previously well child, without a cardiomyopathy or weakness.'],
  },
  mcad: {
    s: 'A previously healthy 15-month-old girl ate almost nothing for a day during a vomiting illness and is now **hard to wake** and has a seizure. Glucose is low with **no urine ketones**; dicarboxylic acids are high.',
    hy: ['Medium-chain acyl-CoA dehydrogenase defect → fatty acid oxidation fails', 'Hypoketotic hypoglycaemia after fasting or illness; can cause sudden infant death', 'High C8 acylcarnitines; Tx: avoid fasting'],
    vs: ['carnitine_def', 'Primary carnitine deficiency adds chronic weakness and a dilated cardiomyopathy, with very low plasma carnitine.'],
  },
  abetalipoproteinemia: {
    s: 'A 5-month-old boy has **pale, bulky, foul greasy stools** and is not growing despite feeding well. Smear shows **acanthocytes**; cholesterol and triglycerides are **extraordinarily low**.',
    hy: ['MTP defect → no apoB-48 or apoB-100 → chylomicrons and VLDL not made', 'Steatorrhoea, failure to thrive, acanthocytes; enterocytes packed with fat', 'Later: retinitis pigmentosa and ataxia (vitamin E loss); Tx: vitamin E'],
    vs: ['cystic_fibrosis', 'CF also gives steatorrhoea, but with lung infections and a high sweat chloride; lipids are not absent.'],
  },
  hyperchylo: {
    s: 'An 11-year-old boy has his **second bout of pancreatitis** and itchy yellow bumps on his back and arms. A refrigerated blood sample forms a **creamy layer on top**. Triglycerides are extremely high.',
    hy: ['Type I: lipoprotein lipase or apoC-II deficient → chylomicrons up', 'Pancreatitis, eruptive xanthomas, hepatosplenomegaly', 'NO increased atherosclerosis risk'],
    vs: ['hypertg', 'Type IV (VLDL) also causes pancreatitis but in adults, linked to insulin resistance, with no creamy layer.'],
  },
  fh: {
    s: 'A 34-year-old non-smoking, slim man had a **heart attack at 33**; his father died of one at 40. He has **Achilles tendon xanthomas** and corneal arcus. LDL is very high; triglycerides are normal.',
    hy: ['Type II: LDL receptor (or apoB/PCSK9) defect; autosomal dominant', 'Premature atherosclerosis; homozygotes can have an MI in childhood', 'Tendon xanthomas, corneal arcus; Tx: statin ± ezetimibe/PCSK9i'],
    vs: ['dysbeta', 'Type III raises BOTH cholesterol and triglycerides (apoE2), with palmar and tuberoeruptive xanthomas.'],
  },
  dysbeta: {
    s: 'A 52-year-old man has angina and leg claudication. He has **yellow-orange streaks in his palm creases** and bumps over his elbows. **Cholesterol and triglycerides are both raised**, roughly equally.',
    hy: ['Type III: apoE2/E2 → chylomicron and VLDL remnants not cleared', 'Premature atherosclerosis', 'Palmar and tuberoeruptive xanthomas'],
    vs: ['fh', 'FH raises LDL alone, with tendon (Achilles) xanthomas; triglycerides are normal.'],
  },
  hypertg: {
    s: 'A 45-year-old woman has **acute pancreatitis** after a big meal with wine. Her father and brother have "high triglycerides". She has no xanthomas. **Triglycerides (VLDL) are very high**; LDL is normal.',
    hy: ['Type IV: hepatic VLDL overproduction; autosomal dominant', 'Hypertriglyceridaemia → acute pancreatitis', 'Linked to insulin resistance; Tx: fibrates, lifestyle'],
    vs: ['hyperchylo', 'Type I is a child with chylomicrons (creamy layer) and eruptive xanthomas from lipoprotein lipase loss.'],
  },
};
