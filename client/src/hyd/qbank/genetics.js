/**
 * HY Diseases Qbank cards — Genetics. Format: see bioQbank.js.
 * Original wording.
 */
export default {
  down: {
    s: 'A 2-day-old girl of a **42-year-old mother** is floppy, with a flat face, upslanting eyes and a **single palmar crease**. She vomits bile; X-ray shows a **double bubble**. Echo shows an AV septal defect.',
    w: {
      '42-year-old mother': 'Older eggs are more likely to fail to separate their chromosomes in meiosis (nondisjunction), so the risk rises with maternal age.',
      'single palmar crease': 'An extra chromosome 21 changes how the hands develop in the womb, leaving one crease across the palm instead of two.',
      'double bubble': 'The duodenum has not opened up (duodenal atresia), so air is trapped in the stomach and the first part of the duodenum, giving two bubbles.',
    },
    x: 'Down syndrome is an extra copy of chromosome 21, usually from nondisjunction in the mother\'s egg. The extra genes change how the face, heart and gut form. Babies are floppy with typical facial features, and often have heart and bowel defects.',
    hy: ['Heart: atrioventricular septal defect (endocardial cushion defect); gut: duodenal atresia and Hirschsprung disease.', 'Later life brings early Alzheimer disease (the APP gene is on chromosome 21) and acute leukaemia (ALL, AML).'],
    vs: ['edwards', 'Edwards has clenched fists with overlapping fingers and rocker-bottom feet, and its quad screen is low across the board.'],
  },
  edwards: {
    s: 'A small newborn girl has **clenched fists with overlapping fingers**, a small jaw, low-set ears, a prominent occiput and **rocker-bottom feet**. Echo shows a VSD.',
    w: {
      'clenched fists with overlapping fingers': 'A typical hand posture in trisomy 18: the index finger lies over the middle finger and the fist stays closed.',
      'rocker-bottom feet': 'The heel sticks out and the sole curves outward like the bottom of a rocking chair, a classic sign of trisomy 18.',
    },
    x: 'Edwards syndrome is an extra copy of chromosome 18. It causes severe growth and developmental problems, heart defects and a typical pattern of clenched hands and rounded feet. Most babies die within the first year.',
    hy: ['Trisomy 18 is the second most common autosomal trisomy at birth, and on the quad screen AFP, hCG and estriol are all low.'],
    vs: ['patau', 'Patau has cleft lip and palate, extra fingers, small eyes and holoprosencephaly.'],
  },
  patau: {
    s: 'A newborn boy has a **cleft lip and palate**, **extra fingers**, very small eyes and a scalp skin defect. MRI shows **holoprosencephaly**; kidneys are polycystic.',
    w: {
      'cleft lip and palate': 'The face is built from fusing midline structures. In trisomy 13 the midline does not form properly, leaving a cleft.',
      'extra fingers': 'Limb development is disturbed by the extra chromosome, giving polydactyly.',
      'holoprosencephaly': 'The forebrain fails to split into two hemispheres. It is the brain version of the same midline failure as the cleft.',
    },
    x: 'Patau syndrome is an extra copy of chromosome 13. The midline of the face and brain fails to form properly, giving clefts, tiny eyes and a single forebrain. Heart and kidney defects are common, and most babies die within a year.',
    hy: ['Trisomy 13 key features: cleft lip/palate, polydactyly, microphthalmia, cutis aplasia and holoprosencephaly.'],
    vs: ['edwards', 'Edwards has clenched overlapping fingers and rocker-bottom feet, but no cleft or extra fingers.'],
  },
  cri_du_chat: {
    s: 'A 3-week-old girl has a **high-pitched cry like a mewing kitten**, a small head, wide-set eyes and epicanthal folds. Echo shows a VSD.',
    w: {
      'high-pitched cry like a mewing kitten': 'The voice box (larynx) is small and abnormally formed, so the cry is thin and high, like a cat.',
    },
    x: 'Cri-du-chat syndrome is caused by losing part of the short arm of chromosome 5. The larynx develops abnormally, giving the cat-like cry. Babies also have a small head, intellectual disability and often a heart defect.',
    hy: ['Cri-du-chat is a 5p deletion ("cri du chat" = cry of the cat), with microcephaly, moderate to severe intellectual disability and VSD.'],
    vs: ['williams', 'Williams (7q deletion) is an overly friendly child with an elfin face, high calcium and supravalvular aortic stenosis.'],
  },
  williams: {
    s: 'A 5-year-old boy with an elfin face **talks happily to everyone, strangers included**, and has strong verbal skills but poor drawing. He has a loud murmur; **serum calcium is high**.',
    w: {
      'talks happily to everyone, strangers included': 'The deleted region contains genes for social brain circuits. The result is an unusually warm, friendly "cocktail party" personality.',
      'serum calcium is high': 'These children are extra sensitive to vitamin D, so they absorb too much calcium.',
    },
    x: 'Williams syndrome is a small deletion on chromosome 7 that includes the elastin gene. Weak elastin narrows the large arteries, especially just above the aortic valve. Children have an elfin face, a very friendly personality and high calcium.',
    hy: ['Williams syndrome causes supravalvular aortic stenosis and renal artery stenosis because elastin is missing.'],
    vs: ['digeorge', 'DiGeorge (22q11) has LOW calcium, a cleft palate, no thymus and outflow-tract heart defects.'],
  },
  digeorge: {
    s: 'A 4-day-old boy has a seizure and **carpal spasm**. He has a cleft palate, an unusual face and a loud murmur; chest X-ray shows **no thymus**. Calcium and PTH are low.',
    w: {
      'carpal spasm': 'The parathyroid glands did not form, so there is no PTH and blood calcium falls. Low calcium makes nerves fire too easily, causing spasms.',
      'no thymus': 'The thymus comes from the same embryonic pouch as the parathyroids. When it does not form, T cells cannot mature.',
    },
    x: 'DiGeorge syndrome is a deletion on chromosome 22q11. The 3rd and 4th pharyngeal pouches fail to develop, so the thymus and parathyroids are missing. The baby has low calcium, low T cells, a cleft palate and heart defects of the outflow tract.',
    hy: ['Remember CATCH-22: Cardiac defects, Abnormal face, Thymic aplasia, Cleft palate, Hypocalcaemia, chromosome 22.', 'Typical heart defects are truncus arteriosus and tetralogy of Fallot.'],
    vs: ['ada_scid', 'ADA-SCID also has no thymic shadow, but loses B cells too, without low calcium or face and heart defects.'],
  },
  prader_willi: {
    s: 'A 7-year-old girl is **never full**; the family locks the fridge. As a baby she was **too floppy to feed**. She is obese, with small hands and feet, hypogonadism and mild intellectual disability.',
    w: {
      'never full': 'The hypothalamus, which signals fullness, works abnormally, so she has a constant drive to eat (hyperphagia).',
      'too floppy to feed': 'Poor muscle tone in infancy makes sucking weak. Feeding problems come first, then the overeating starts in childhood.',
    },
    x: 'Prader-Willi syndrome happens when the father\'s copy of a region on chromosome 15 is missing. The mother\'s copy of these genes is normally switched off (imprinted), so nothing covers the loss. Babies are floppy, then children develop extreme hunger, obesity and small genitals.',
    hy: ['Prader-Willi is caused by a paternal 15q11-13 deletion or maternal uniparental disomy (both copies from the mother).'],
    vs: ['angelman', 'Angelman is the MATERNAL loss: a happy, laughing child with seizures, ataxia and almost no speech.'],
  },
  angelman: {
    s: 'A 4-year-old boy **laughs and smiles constantly**, walks with stiff jerky steps, flaps his hands, has seizures and has **almost no words**.',
    w: {
      'laughs and smiles constantly': 'Loss of the UBE3A gene in the brain disturbs emotional circuits, giving a happy demeanour and laughter at odd times.',
      'almost no words': 'Speech is the most severely affected skill; most children never develop more than a few words.',
    },
    x: 'Angelman syndrome happens when the mother\'s copy of the UBE3A gene on chromosome 15 is lost. In the brain only the mother\'s copy is normally active. Children have severe intellectual disability, seizures, jerky movements and a constantly happy manner.',
    hy: ['Angelman is a maternal 15q deletion or paternal uniparental disomy (both copies from the father); it is the imprinting partner of Prader-Willi.'],
    vs: ['prader_willi', 'Prader-Willi is the PATERNAL loss: hyperphagia and obesity after a floppy infancy, with only mild disability.'],
  },
  fragile_x: {
    s: 'A 15-year-old boy has intellectual disability, avoids eye contact and has a **long face, large jaw and large ears**, with **large testes**. A mid-systolic click is heard. Male relatives on the mother\'s side are similar.',
    w: {
      'long face, large jaw and large ears': 'Loss of the FMR1 protein affects connective tissue growth, giving a long face with a big jaw and prominent ears.',
      'large testes': 'Macroorchidism after puberty is a classic sign; the FMR1 protein normally limits testicular growth.',
    },
    x: 'Fragile X is caused by a long CGG repeat in the FMR1 gene on the X chromosome. The repeat gets methylated and the gene is switched off. Boys develop intellectual disability, autistic features, a long face, large ears and large testes.',
    hy: ['Fragile X is the second most common genetic cause of intellectual disability (after Down) and shows anticipation.', 'Connective tissue signs include mitral valve prolapse and loose joints.'],
    vs: ['down', 'Down is seen at birth with a flat face, upslanting eyes and a single palmar crease; testes are not enlarged.'],
  },
  huntington: {
    s: 'A 42-year-old man has a year of **dance-like involuntary movements**, irritability, depression and forgetfulness. His father had the same, starting later. MRI shows **caudate atrophy**.',
    w: {
      'dance-like involuntary movements': 'The caudate normally holds back unwanted movement. As it dies, movements leak through as chorea.',
      'caudate atrophy': 'The mutant protein kills GABA neurons in the caudate first, so it shrinks and the lateral ventricles look bigger.',
    },
    x: 'Huntington disease is caused by an expanded CAG repeat in the HTT gene. The faulty protein kills neurons in the caudate, which control movement and behaviour. Patients develop chorea, mood change and dementia in mid-life.',
    hy: ['Huntington is autosomal dominant with anticipation, especially when inherited from the father.', 'Neurotransmitters: GABA and ACh fall, dopamine is relatively high; tetrabenazine reduces chorea.'],
    vs: ['friedreich', 'Friedreich is a childhood ataxia (GAA repeat, autosomal recessive) with a curved spine and heart disease, not chorea.'],
  },
  myotonic: {
    s: 'A 35-year-old man **cannot let go after a handshake**. He has frontal balding, a long thin face, **cataracts at 30**, small testes and a conduction block on ECG.',
    w: {
      'cannot let go after a handshake': 'Muscle chloride channels do not work properly, so muscle keeps firing after it contracts. That slow relaxation is myotonia.',
      'cataracts at 30': 'The toxic RNA from the repeat affects many tissues, including the lens, causing cataracts at a young age.',
    },
    x: 'Myotonic dystrophy is caused by an expanded CTG repeat in the DMPK gene. The abnormal RNA disrupts the processing of many other genes. That gives slow muscle relaxation, weakness, cataracts, balding, small testes and heart rhythm problems.',
    hy: ['Myotonic dystrophy is autosomal dominant with anticipation, and heart block or arrhythmia is a major cause of death.'],
    vs: ['becker', 'Becker gives proximal weakness with big calves and cramps in a young man; no myotonia, cataracts or balding.'],
  },
  friedreich: {
    s: 'A 12-year-old girl falls often, worse in the dark. She has **high arches**, a curving spine, lost vibration sense and absent ankle reflexes. Echo shows **hypertrophic cardiomyopathy**; glucose is high.',
    w: {
      'high arches': 'Long-term weakness of foot muscles from nerve damage pulls the foot into a high arch (pes cavus).',
      'hypertrophic cardiomyopathy': 'Frataxin is needed in mitochondria. Heart muscle depends on mitochondria, so it thickens and becomes the main cause of death.',
    },
    x: 'Friedreich ataxia is caused by a GAA repeat that switches off frataxin, a mitochondrial iron-handling protein. Iron builds up in mitochondria and damages nerves, the spinal cord and the heart. Children become ataxic, lose reflexes and vibration sense, and develop heart disease and diabetes.',
    hy: ['Friedreich ataxia is autosomal recessive (GAA repeat, FXN gene), and hypertrophic cardiomyopathy is the most common cause of death.'],
    vs: ['vit_e_def', 'Vitamin E deficiency affects the same spinal tracts, but comes with fat malabsorption and haemolysis, and no heart disease.'],
  },
  duchenne: {
    s: 'A 5-year-old boy waddles and **climbs up his own legs** to stand. He has **enlarged calves**. His maternal uncle used a wheelchair by 12. CK is very high.',
    w: {
      'climbs up his own legs': 'This is the Gowers sign. His hip and thigh muscles are too weak to stand, so he pushes himself up using his arms.',
      'enlarged calves': 'Dead muscle is replaced by fat and scar tissue, which makes the calves big but weak (pseudohypertrophy).',
    },
    x: 'Duchenne muscular dystrophy is caused by a frameshift deletion in the dystrophin gene, so no dystrophin is made. Dystrophin anchors the muscle cell to its surroundings; without it, fibres tear and die. Boys are weak from early childhood and lose walking by their teens.',
    hy: ['Duchenne is X-linked recessive, and the most common causes of death are dilated cardiomyopathy and respiratory failure.'],
    vs: ['becker', 'Becker is an in-frame deletion: some dystrophin, onset in the teens, still walking in adulthood.'],
  },
  becker: {
    s: 'A 17-year-old boy has **thigh weakness and cramps** playing football but **still walks fine**. He has big calves; a maternal cousin is similar in his twenties. CK is high.',
    w: {
      'thigh weakness and cramps': 'The partly working dystrophin still lets muscle tear with effort, giving cramps and proximal weakness.',
      'still walks fine': 'An in-frame deletion keeps the reading frame, so a shorter but partly working dystrophin is made. The disease is milder and later.',
    },
    x: 'Becker muscular dystrophy is a dystrophin deletion that does not shift the reading frame. A shorter dystrophin with some function is made. So the weakness starts later and progresses more slowly than in Duchenne.',
    hy: ['Becker is X-linked recessive and milder than Duchenne because the deletion is in-frame (non-frameshift).'],
    vs: ['duchenne', 'Duchenne starts before age 5 with a Gowers sign and no dystrophin (frameshift); wheelchair by the early teens.'],
  },
  rett: {
    s: 'A 3-year-old girl said "mama" at one but has **lost all words** and purposeful hand use, and now **wrings her hands** constantly. Head growth has slowed and she has seizures.',
    w: {
      'lost all words': 'Development is normal at first, then MECP2 loss disrupts maturing brain circuits, so learned skills slip away (regression).',
      'wrings her hands': 'Purposeful hand use is replaced by repetitive midline hand-wringing, the hallmark movement of Rett.',
    },
    x: 'Rett syndrome is caused by a new mutation in MECP2 on the X chromosome. Girls develop normally at first, then from about age 1 to 4 lose speech and hand skills. They develop hand-wringing, a slowing head growth, seizures and breathing problems.',
    hy: ['Rett is X-linked dominant and seen almost only in girls, because affected boys usually do not survive.'],
    vs: ['angelman', 'Angelman never gains speech in the first place and is a constantly happy, laughing child with hand flapping.'],
  },
  cystic_fibrosis: {
    s: 'A 4-year-old boy has had three pneumonias, a chronic wet cough, **pale greasy stools** and poor weight gain despite a big appetite. He had **meconium ileus** at birth and **tastes salty**.',
    w: {
      'pale greasy stools': 'Thick mucus blocks the pancreatic ducts, so digestive enzymes cannot reach the gut and fat passes out unabsorbed.',
      'meconium ileus': 'The baby\'s first stool is so thick and sticky that it blocks the small bowel.',
      'tastes salty': 'Sweat glands cannot pull chloride back out of sweat, so the skin is unusually salty.',
    },
    x: 'Cystic fibrosis is caused by a faulty CFTR chloride channel. Without chloride and water movement, secretions in the lungs, pancreas and gut become thick. This blocks airways and ducts, causing lung infections, poor digestion and salty sweat.',
    hy: ['CF is autosomal recessive; the commonest mutation (ΔF508) makes a misfolded protein that is destroyed before reaching the cell surface.', 'Diagnose with a high sweat chloride test; males are infertile from absent vas deferens.'],
    vs: ['kartagener', 'Primary ciliary dyskinesia causes bronchiectasis and infertility with situs inversus, but sweat chloride is normal and the pancreas works.'],
  },
  merrf: {
    s: 'A 24-year-old woman has **myoclonic jerks**, seizures and muscle fatigue on stairs. Her **mother and all her mother\'s children are affected**; her father\'s side is not. Muscle biopsy shows ragged red fibres.',
    w: {
      'myoclonic jerks': 'Neurons with failing mitochondria become unstable and fire suddenly, causing quick jerks and seizures.',
      'mother and all her mother\'s children are affected': 'Mitochondria come only from the egg, so a mother passes mitochondrial DNA to every child and a father to none.',
    },
    x: 'MERRF is caused by a mutation in mitochondrial DNA. Muscle and brain need the most energy, so they fail first. Patients get myoclonic seizures, weak tiring muscles and lactic acidosis; muscle shows "ragged red fibres" packed with abnormal mitochondria.',
    hy: ['Mitochondrial diseases pass from an affected mother to all her children, with variable severity because of heteroplasmy.'],
    vs: ['lhon', 'LHON is also maternal but is sudden painless loss of central vision in a young man, without seizures.'],
  },
  lhon: {
    s: 'A 22-year-old man has **painless loss of central vision**, first in one eye and then six weeks later in the other. His **maternal uncle** lost his sight in his twenties.',
    w: {
      'painless loss of central vision': 'The optic nerve fibres serving central vision use a lot of energy, so they die first when mitochondria fail. No inflammation means no pain.',
      'maternal uncle': 'Mitochondrial DNA comes only from the mother, so relatives on her side are affected.',
    },
    x: 'LHON is a mitochondrial DNA mutation that damages the cells of the optic nerve. Central vision is lost suddenly and painlessly, first in one eye and then the other. Young men are affected most often.',
    hy: ['LHON shows maternal (mitochondrial) inheritance and presents as acute bilateral painless vision loss in young men.'],
    vs: ['merrf', 'MERRF is also maternal, but shows myoclonic seizures and ragged red fibres rather than isolated vision loss.'],
  },
  fap: {
    s: 'A 16-year-old girl has rectal bleeding and anaemia. Her **father had his colon removed at 30**. Colonoscopy shows **hundreds of polyps** carpeting the colon.',
    w: {
      'father had his colon removed at 30': 'Affected families have their colon removed early because cancer is almost certain otherwise; it is passed down in an autosomal dominant way.',
      'hundreds of polyps': 'APC normally limits cell division. With one faulty copy inherited, each polyp needs only one more hit, so polyps appear by the hundred.',
    },
    x: 'FAP is caused by an inherited mutation in the APC tumour suppressor gene. Without APC, colon cells divide too much and form hundreds of adenomas from the teenage years. One of them will almost certainly turn into cancer unless the colon is removed.',
    hy: ['FAP is an autosomal dominant APC mutation on chromosome 5q; treatment is prophylactic colectomy.'],
    vs: ['lynch', 'Lynch gives only a few polyps and a right-sided cancer, with endometrial cancer in relatives (mismatch repair).'],
  },
  li_fraumeni: {
    s: 'A 26-year-old woman with a **childhood bone sarcoma** now has breast cancer. Her brother had a childhood **brain tumour** and her mother leukaemia.',
    w: {
      'childhood bone sarcoma': 'TP53 normally stops damaged cells from dividing. With one faulty copy from birth, cancers like sarcoma appear in childhood.',
      'brain tumour': 'Many different cancer types in one family is the clue: p53 protects every tissue, not just one organ.',
    },
    x: 'Li-Fraumeni syndrome is an inherited mutation in TP53, the "guardian of the genome". Without working p53, damaged cells keep dividing. Families get many different cancers at young ages: sarcoma, breast, brain, leukaemia and adrenal tumours.',
    hy: ['Li-Fraumeni is autosomal dominant TP53; remember SBLA: Sarcoma, Breast, Leukaemia, Adrenal gland cancers.'],
    vs: ['lynch', 'Lynch clusters colon, endometrial and ovarian cancers in adults, not childhood sarcomas and brain tumours.'],
  },
};
