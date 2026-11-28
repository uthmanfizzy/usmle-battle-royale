/**
 * HY Diseases Qbank cards — Nutrition. Format: see bioQbank.js.
 * Original wording.
 */
export default {
  vit_a_def: {
    s: 'A 6-year-old boy on a mostly rice diet **cannot see after dark**. His eyes are dry with **foamy grey patches on the conjunctiva**, and he **keeps catching measles** and chest infections.',
    w: {
      'cannot see after dark': 'Rods need retinal (vitamin A) to make rhodopsin, the pigment for dim light. Night vision fails first.',
      'foamy grey patches on the conjunctiva': 'These are Bitot spots. Without vitamin A the eye surface stops making mucus and turns dry and keratinised.',
      'keeps catching measles': 'Vitamin A keeps mucous membranes and immune cells healthy, so infections are more frequent and more severe.',
    },
    x: 'Vitamin A is needed for the light-sensing pigment in the retina and for healthy linings of the eye, gut and airway. Without it, night vision goes first, then the eyes dry out and the child gets more infections. It is common where diets are mostly rice or other staples.',
    hy: ['Vitamin A deficiency causes night blindness, xerophthalmia, Bitot spots and keratomalacia; giving vitamin A reduces measles deaths.'],
    vs: ['refsum', 'Refsum also gives night blindness, but with ataxia, scaly skin, a short 4th toe and high phytanic acid.'],
  },
  vit_a_tox: {
    s: 'A 20-year-old woman started an **acne tablet** three months ago and also takes a big multivitamin. She has a headache worse lying down with **swollen optic discs**, hair loss and peeling skin.',
    w: {
      'acne tablet': 'Isotretinoin is a vitamin A derivative, so it adds to the vitamin A load and causes the same toxic effects.',
      'swollen optic discs': 'Too much vitamin A raises the pressure of the fluid around the brain (pseudotumor cerebri), which pushes on the optic nerves.',
    },
    x: 'Too much vitamin A, often from isotretinoin plus supplements, is toxic. It raises the pressure inside the skull and damages the skin, hair and liver. Patients get headache, blurred vision, hair loss and peeling skin.',
    hy: ['Vitamin A is strongly teratogenic, so isotretinoin needs a negative pregnancy test and reliable contraception.'],
    vs: ['zinc_def', 'Zinc deficiency also thins hair, but gives a rash around the mouth and hands, lost taste and slow wound healing, without raised pressure.'],
  },
  wernicke: {
    s: 'A 55-year-old man who **drinks heavily** is found **confused** with **nystagmus and eye-movement palsies** and a wide-based unsteady gait. A glucose drip is about to be hung.',
    w: {
      'drinks heavily': 'Alcohol use means poor diet and poor thiamine absorption, so thiamine stores run out.',
      'confused': 'Without thiamine, brain cells cannot burn glucose for energy, and the areas around the third ventricle are damaged.',
      'nystagmus and eye-movement palsies': 'The brainstem nuclei that move the eyes are among the most energy-hungry areas, so they fail early.',
    },
    x: 'Wernicke encephalopathy is caused by a lack of thiamine (vitamin B1). Thiamine helps enzymes that turn glucose into energy, so the brain starves. Patients become confused, unsteady and have abnormal eye movements.',
    hy: ['Always give thiamine BEFORE glucose, because a glucose load uses up the last thiamine and can worsen the damage.', 'Untreated, it progresses to Korsakoff syndrome: memory loss and confabulation, with damage to the mammillary bodies.'],
    vs: ['b12_def', 'B12 deficiency is a slow loss of position and vibration sense with a large-cell anaemia, not a sudden eye-movement palsy.'],
  },
  wet_beriberi: {
    s: 'A 48-year-old man who eats mostly **polished white rice** has leg swelling, breathlessness on walking, tingling feet and a **bounding pulse with warm hands**. X-ray shows a big heart.',
    w: {
      'polished white rice': 'Polishing rice removes the husk, which is where the thiamine is, so a rice-only diet leaves little vitamin B1.',
      'bounding pulse with warm hands': 'Without thiamine, tissues cannot make energy and blood vessels relax widely. The heart has to pump much more, so this is high-output heart failure.',
    },
    x: 'Beriberi is thiamine (B1) deficiency. Wet beriberi affects the heart: vessels dilate, the heart pumps hard and eventually fails, causing swelling and breathlessness. Dry beriberi affects nerves and causes a tingling neuropathy.',
    hy: ['Thiamine is the cofactor for pyruvate dehydrogenase, α-ketoglutarate dehydrogenase, transketolase and branched-chain ketoacid dehydrogenase.'],
    vs: ['kwashiorkor', 'Kwashiorkor is swelling from lack of protein in a small child, with a fatty liver and peeling skin, not heart failure.'],
  },
  b2_def: {
    s: 'A 30-year-old woman eating little dairy or meat has **cracks at the corners of her mouth**, a **sore magenta tongue** and light sensitivity with new corneal vessels.',
    w: {
      'cracks at the corners of her mouth': 'Riboflavin is needed for fast-turnover skin at the lip edges. Without it, the corners crack (angular cheilitis).',
      'sore magenta tongue': 'The tongue lining is inflamed and congested, giving a purple-red colour typical of riboflavin lack.',
    },
    x: 'Riboflavin (vitamin B2) forms FAD and FMN, which carry electrons in energy reactions. Without it, fast-growing tissues like the lips, tongue and cornea suffer. Patients get cracked lips, a sore magenta tongue and eye changes.',
    hy: ['Riboflavin forms FAD and FMN (used by succinate dehydrogenase in the Krebs cycle); deficiency gives cheilosis and corneal vascularisation.'],
    vs: ['b6_def', 'B6 deficiency also cracks the lips, but adds neuropathy, seizures and a sideroblastic anaemia, often on isoniazid.'],
  },
  pellagra: {
    s: 'A 50-year-old man eating almost only **corn tortillas** has weeks of diarrhoea, new forgetfulness and a **dark scaly rash on sun-exposed skin**, including a band around the neck.',
    w: {
      'corn tortillas': 'Niacin in corn is bound up and hard to absorb, and corn is low in tryptophan, which the body uses to make niacin.',
      'dark scaly rash on sun-exposed skin': 'Without NAD, sun-damaged skin cannot repair itself, so exposed areas become dark, rough and scaly (the neck band is the Casal necklace).',
    },
    x: 'Pellagra is niacin (vitamin B3) deficiency. Niacin makes NAD, which almost every cell needs for energy. Fast-turnover tissues fail first, giving the three Ds: diarrhoea, dermatitis and dementia.',
    hy: ['Causes of pellagra: a corn diet, Hartnup disease, carcinoid syndrome (tryptophan used for serotonin) and isoniazid (which lowers B6, needed to make niacin).'],
    vs: ['hartnup', 'Hartnup gives the same rash in a child on a GOOD diet, because tryptophan is lost in the urine.'],
  },
  hartnup: {
    s: 'An 8-year-old girl on a **normal varied diet** gets a red scaly rash on sun-exposed skin and **episodes of unsteady walking**. Cousins are similar. Urine has **high neutral amino acids**.',
    w: {
      'normal varied diet': 'Her food is fine; the problem is absorbing and keeping tryptophan, so she becomes niacin deficient anyway.',
      'episodes of unsteady walking': 'Low niacin affects the cerebellum, causing bouts of ataxia, often after illness or poor intake.',
      'high neutral amino acids': 'The transporter that reabsorbs neutral amino acids in the kidney and gut is faulty, so they spill into the urine.',
    },
    x: 'Hartnup disease is a defect in the transporter for neutral amino acids, including tryptophan, in the gut and kidney. Tryptophan is lost, so the body cannot make enough niacin. This causes a pellagra-like rash and episodes of ataxia despite a normal diet.',
    hy: ['Hartnup disease is autosomal recessive; treat with a high-protein diet and nicotinic acid.'],
    vs: ['pellagra', 'Pellagra comes from a poor (corn) diet and adds diarrhoea and dementia; urine amino acids are normal.'],
  },
  b6_def: {
    s: 'A 40-year-old man started **TB treatment** two months ago. Now his feet burn and tingle, his lips are cracked, and last night he had a **seizure**. The marrow shows **ring sideroblasts**.',
    w: {
      'TB treatment': 'Isoniazid binds and uses up pyridoxine (B6), so people on it become deficient unless B6 is given too.',
      'seizure': 'B6 is needed to make GABA, the brain\'s calming signal. Low GABA makes the brain prone to seizures.',
      'ring sideroblasts': 'B6 is the cofactor for ALA synthase, the first step of haem. Iron cannot be built into haem and collects in a ring around the nucleus.',
    },
    x: 'Pyridoxine (vitamin B6) is a cofactor for making haem and neurotransmitters. The drug isoniazid depletes it. The result is a burning neuropathy, seizures, cracked lips and a sideroblastic anaemia.',
    hy: ['Give pyridoxine with isoniazid to prevent neuropathy; B6 deficiency causes a microcytic sideroblastic anaemia.'],
    vs: ['b12_def', 'B12 deficiency also causes a neuropathy, but with a large-cell (megaloblastic) anaemia and high MMA.'],
  },
  biotin_def: {
    s: 'A 23-year-old bodybuilder drinks **ten raw egg whites a day**. His **hair is falling out**, he has a scaly red rash around his eyes and mouth, and loose stools.',
    w: {
      'ten raw egg whites a day': 'Raw egg white contains avidin, which grabs biotin in the gut and stops it being absorbed.',
      'hair is falling out': 'Biotin-dependent carboxylases are needed for fat synthesis in skin and hair, so hair thins and skin becomes inflamed.',
    },
    x: 'Biotin (vitamin B7) is the helper for carboxylase enzymes that add CO2 in fat and sugar metabolism. Avidin in raw egg whites binds it and blocks absorption. Deficiency causes hair loss, a rash around the face and diarrhoea.',
    hy: ['Biotin is the cofactor for pyruvate carboxylase, acetyl-CoA carboxylase and propionyl-CoA carboxylase.'],
    vs: ['zinc_def', 'Zinc deficiency looks similar (rash, hair loss) but adds lost taste and slow wound healing, often on tube feeds.'],
  },
  folate_def: {
    s: 'A 28-year-old woman who is **30 weeks pregnant** is tired with a sore smooth tongue and **no neurological signs**. She has a megaloblastic anaemia; **homocysteine is high, MMA normal**.',
    w: {
      '30 weeks pregnant': 'Pregnancy greatly increases the need for folate to make DNA for the baby and the extra red cells, and stores are small.',
      'no neurological signs': 'Folate is not needed to keep myelin healthy, so unlike B12 deficiency the nerves are spared.',
      'homocysteine is high, MMA normal': 'Folate is needed to recycle homocysteine, so it rises. MMA only rises when B12 is missing, so it stays normal.',
    },
    x: 'Folate is needed to make the building blocks of DNA. Without it, red cell precursors cannot divide properly and grow large, giving a megaloblastic anaemia. Unlike B12 deficiency, there is no nerve damage and MMA is normal.',
    hy: ['Folate deficiency develops within months (small stores), and is caused by pregnancy, alcohol, poor diet and drugs like methotrexate and phenytoin.', 'Folate before conception reduces neural tube defects.'],
    vs: ['b12_def', 'B12 deficiency gives the same anaemia but raises MMA too and damages the spinal cord.'],
  },
  b12_def: {
    s: 'A 68-year-old woman with **autoimmune thyroid disease** has numb feet, sways when she closes her eyes (**Romberg positive**) and is forgetful. She has a macrocytic anaemia; **MMA and homocysteine are both high**.',
    w: {
      'autoimmune thyroid disease': 'Autoimmune diseases cluster together; pernicious anaemia (antibodies against intrinsic factor) often comes with them.',
      'Romberg positive': 'B12 is needed for healthy myelin. The dorsal columns, which carry position sense, are damaged, so she relies on her eyes to balance.',
      'MMA and homocysteine are both high': 'B12 is the cofactor for two enzymes: one clears homocysteine and one clears methylmalonic acid, so both build up.',
    },
    x: 'Vitamin B12 is needed to make DNA and to keep myelin healthy. Without it, red cells grow large and the spinal cord\'s dorsal and lateral columns degenerate. The commonest cause is pernicious anaemia, where antibodies block the intrinsic factor needed to absorb B12.',
    hy: ['B12 deficiency causes subacute combined degeneration (dorsal columns, lateral corticospinal tracts, spinocerebellar tracts), which can be permanent.', 'B12 stores last years, so deficiency develops slowly.'],
    vs: ['folate_def', 'Folate deficiency has the same anaemia, but MMA is normal and there are no neurological signs.'],
  },
  scurvy: {
    s: 'A 79-year-old widower living on **tea and toast** has **swollen bleeding gums**, a cut that will not heal, easy bruising and **corkscrew hairs**. Platelets and clotting tests are normal.',
    w: {
      'tea and toast': 'A diet with no fresh fruit or vegetables contains almost no vitamin C.',
      'swollen bleeding gums': 'Collagen holds gums and small vessels together. Without vitamin C, collagen is weak and the gums swell and bleed.',
      'corkscrew hairs': 'Weak collagen in hair follicles lets the hair shaft coil, and tiny vessels around each follicle bleed.',
    },
    x: 'Vitamin C is needed to make strong collagen by adding hydroxyl groups to proline and lysine. Without it, collagen is weak, so vessels, gums and healing wounds fall apart. Clotting tests are normal because the clotting factors themselves are fine.',
    hy: ['Vitamin C is needed for hydroxylation of proline and lysine in collagen synthesis, and it also helps absorb iron.'],
    vs: ['vit_k_def', 'Vitamin K deficiency bleeds with a PROLONGED PT/INR; the gums and hair are normal.'],
  },
  rickets: {
    s: 'A 2-year-old boy, **breastfed without supplements** and mostly indoors, has **bowed legs**, beading along the ribs and a soft skull. Phosphate is low, **ALP and PTH are high**.',
    w: {
      'breastfed without supplements': 'Breast milk is low in vitamin D, and little sun exposure means the skin makes little either.',
      'bowed legs': 'Without vitamin D, new bone is soft and poorly mineralised, so the legs bend once the child starts walking.',
      'ALP and PTH are high': 'Low vitamin D lowers calcium, so PTH rises. Bone cells work hard trying to build bone, so ALP rises too.',
    },
    x: 'Rickets is vitamin D deficiency in a growing child. Without vitamin D, the gut absorbs little calcium and phosphate, so new bone stays soft. The legs bow, the ribs bead and the skull is soft; in adults the same problem is called osteomalacia.',
    hy: ['Rickets labs: low phosphate, low or normal calcium, high PTH, high alkaline phosphatase and low 25-OH vitamin D.'],
    vs: ['oi', 'Osteogenesis imperfecta fractures easily with blue sclerae, and calcium, phosphate and ALP are normal.'],
  },
  vit_e_def: {
    s: 'A 14-year-old boy with **chronic pancreatitis and greasy stools** has leg weakness, sways with eyes closed and has a **haemolytic anaemia** with spiky red cells. MCV and MMA are normal.',
    w: {
      'chronic pancreatitis and greasy stools': 'Vitamin E is fat-soluble. When fat is not digested, vitamin E is lost in the stool with it.',
      'haemolytic anaemia': 'Vitamin E protects cell membranes from oxidation. Without it, red cell membranes are damaged and the cells burst.',
    },
    x: 'Vitamin E is an antioxidant that protects cell membranes. Deficiency usually comes from fat malabsorption. It damages red cells (haemolysis) and the long nerve tracts of the spinal cord, causing ataxia and loss of position sense.',
    hy: ['Vitamin E deficiency mimics B12 deficiency neurologically, but without a megaloblastic anaemia and with a normal MMA.'],
    vs: ['b12_def', 'B12 deficiency damages the same spinal tracts, but with a MACROCYTIC anaemia and high MMA.'],
  },
  vit_k_def: {
    s: 'A 5-day-old boy born at home **without birth injections** oozes blood from his umbilical stump. **PT and aPTT are prolonged**; platelets and bleeding time are normal.',
    w: {
      'without birth injections': 'Newborns are routinely given vitamin K at birth. Without it, they are at risk because their stores are tiny.',
      'PT and aPTT are prolonged': 'Vitamin K activates clotting factors II, VII, IX and X. Without it they do not work, so both clotting times are long.',
    },
    x: 'Vitamin K is needed to activate several clotting factors. Newborns have very low stores, little in breast milk and no gut bacteria to make it. Without a vitamin K injection at birth they can bleed, with long clotting times but normal platelets.',
    hy: ['Vitamin K activates factors II, VII, IX, X and proteins C and S; in adults, deficiency comes from long antibiotic courses, fat malabsorption or warfarin.'],
    vs: ['scurvy', 'Scurvy bleeds from fragile collagen (gums, hair follicles) with NORMAL clotting tests.'],
  },
  zinc_def: {
    s: 'A 45-year-old man on **tube feeding** after bowel surgery has **lost his taste and smell**, with a **red crusting rash around his mouth and on his hands and feet**, hair loss and a slowly healing wound.',
    w: {
      'tube feeding': 'Feeds without enough zinc and losses from the gut after surgery quickly lead to zinc deficiency.',
      'lost his taste and smell': 'Taste and smell cells turn over fast and need zinc-dependent enzymes, so these senses fade.',
      'red crusting rash around his mouth and on his hands and feet': 'Skin repair needs zinc. The rash affects areas around body openings and the ends of the limbs.',
    },
    x: 'Zinc is needed by many enzymes, especially in fast-growing tissue and wound healing. Deficiency causes a crusting rash around the mouth and on the hands and feet, hair loss, loss of taste and smell, and slow healing.',
    hy: ['The inherited form, acrodermatitis enteropathica, is a defect in zinc absorption; zinc deficiency also causes hypogonadism.'],
    vs: ['biotin_def', 'Biotin deficiency also gives a rash around the face and hair loss, but taste and wound healing are normal (raw egg whites).'],
  },
  kwashiorkor: {
    s: 'A 3-year-old boy, weaned onto **cassava porridge** when his sister was born, has a **swollen belly and pitting leg oedema**, an enlarged fatty liver, peeling skin and thin reddish hair. Albumin is low.',
    w: {
      'cassava porridge': 'Cassava gives calories but almost no protein, so the child gets energy without enough protein.',
      'swollen belly and pitting leg oedema': 'Without protein the liver makes little albumin. Low albumin cannot hold fluid in the vessels, so it leaks into tissues.',
    },
    x: 'Kwashiorkor is protein malnutrition when calories may still be enough. The liver cannot make albumin, so fluid leaks out and the child swells. The liver also fills with fat because it cannot make the proteins that export fat.',
    hy: ['Remember MEAL: Malnutrition, Edema, Anemia, Liver (fatty) — plus skin and hair changes.'],
    vs: ['marasmus', 'Marasmus is total calorie lack: skin and bone, muscle wasting and NO oedema.'],
  },
  marasmus: {
    s: 'An 18-month-old girl in a drought has had very little food of any kind. She is **skin and bone** with an old-looking face and **no oedema**. Albumin is near normal.',
    w: {
      'skin and bone': 'With too few calories of any kind, the body burns its own fat and muscle for energy.',
      'no oedema': 'The body breaks down muscle to keep albumin made, so blood proteins and fluid balance are kept near normal.',
    },
    x: 'Marasmus is a severe shortage of all calories. The body uses up its fat and muscle to survive, leaving the child wasted. Unlike kwashiorkor, albumin is protected, so there is no swelling.',
    hy: ['Marasmus = total calorie deficiency with severe muscle wasting and no oedema.'],
    vs: ['kwashiorkor', 'Kwashiorkor is protein lack: oedema, a swollen belly, fatty liver and skin changes.'],
  },
};
