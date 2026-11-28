/**
 * HY Diseases Qbank cards — Metabolism. Format: see bioQbank.js.
 * Original wording.
 */
export default {
  pdh_def: {
    s: 'A 3-month-old boy is floppy, feeds poorly and breathes fast with poor head control. He has a metabolic acidosis with **high lactate, pyruvate and alanine**; glucose is normal.',
    w: {
      'high lactate, pyruvate and alanine': 'Pyruvate cannot enter the Krebs cycle, so it backs up and is turned into lactate (by LDH) and alanine (by ALT).',
    },
    x: 'The pyruvate dehydrogenase complex turns pyruvate into acetyl-CoA so it can enter the Krebs cycle. When it fails, pyruvate is diverted to lactate and alanine, causing lactic acidosis. The brain cannot get enough energy, so the baby is floppy and delayed.',
    hy: ['Treat with a ketogenic diet (high fat, and the purely ketogenic amino acids lysine and leucine), because fat and ketones bypass PDH.', 'Arsenic inhibits lipoic acid, a PDH cofactor, and causes the same picture.'],
    vs: ['von_gierke', 'Von Gierke gives lactic acidosis WITH severe fasting hypoglycaemia and a huge liver.'],
  },
  pk_def: {
    s: 'A 6-year-old girl needed transfusions for newborn jaundice and has been **mildly yellow ever since**, with **no trigger** making it worse. She has splenomegaly and **burr cells** on the smear.',
    w: {
      'mildly yellow ever since': 'Red cells are broken down all the time, so bilirubin stays raised and the skin stays a little yellow.',
      'no trigger': 'The problem is a constant lack of energy in the red cell, not damage from oxidants, so nothing needs to set it off.',
      'burr cells': 'Without ATP, red cells cannot keep their shape and develop spiky projections (echinocytes).',
    },
    x: 'Red cells have no mitochondria, so they rely on glycolysis for energy. Pyruvate kinase is a key step, and without it the cells run out of ATP. They become rigid and are destroyed in the spleen from birth onwards.',
    hy: ['Pyruvate kinase deficiency is autosomal recessive and causes chronic extravascular haemolysis from the newborn period, with splenomegaly.'],
    vs: ['g6pd_def', 'G6PD deficiency haemolyses in episodes after a trigger, with bite cells and Heinz bodies.'],
  },
  g6pd_def: {
    s: 'A 19-year-old man has fatigue, back pain and **cola-coloured urine** two days after eating **fava beans**; it happened once before after an antibiotic for a UTI. The smear shows **bite cells**.',
    w: {
      'cola-coloured urine': 'Red cells burst inside the vessels, releasing haemoglobin, which spills into the urine and darkens it.',
      'fava beans': 'Fava beans contain oxidants. Without G6PD, red cells cannot defend themselves against oxidant stress.',
      'bite cells': 'Damaged haemoglobin clumps into Heinz bodies. The spleen plucks them out, leaving a "bite" in the cell.',
    },
    x: 'G6PD makes NADPH, which keeps glutathione ready to neutralise oxidants in red cells. Without it, an oxidant trigger damages haemoglobin and the cells burst. Attacks follow fava beans, some drugs or infections.',
    hy: ['G6PD deficiency is X-linked recessive, the most common human enzyme deficiency, and protects against malaria.', 'Triggers include fava beans, sulfa drugs, primaquine, dapsone and infection; smear shows Heinz bodies and bite cells.'],
    vs: ['pk_def', 'PK deficiency gives continuous haemolysis from birth with no trigger, and burr cells.'],
  },
  fructosuria: {
    s: 'A **healthy** 30-year-old man has a routine medical. His urine dipstick for glucose is negative, but a **reducing-sugar test is positive**. Blood glucose and liver tests are normal.',
    w: {
      'healthy': 'Fructose that is not processed just leaves in the urine and causes no harm, so the person is well.',
      'reducing-sugar test is positive': 'Fructose is a reducing sugar. The glucose dipstick only detects glucose, so only the general reducing-sugar test is positive.',
    },
    x: 'Essential fructosuria is a missing fructokinase enzyme. Fructose cannot be trapped in cells, so it stays in the blood and spills into the urine. It causes no symptoms and is usually found by chance.',
    hy: ['Essential fructosuria (fructokinase) is autosomal recessive and benign; disorders of fructose metabolism are milder than the matching galactose ones.'],
    vs: ['hfi', 'Hereditary fructose intolerance (aldolase B) causes vomiting and low blood sugar after fruit, with liver damage.'],
  },
  hfi: {
    s: 'An 8-month-old girl was fine on breast milk until **fruit purées and juice** were started. After each feed she vomits, sweats and goes floppy with **low blood sugar**; now she is jaundiced with a big liver.',
    w: {
      'fruit purées and juice': 'Breast milk has no fructose. Symptoms start when fructose or sucrose (fruit, juice, honey) enters the diet.',
      'low blood sugar': 'Fructose-1-phosphate traps phosphate, so liver phosphate runs out and the liver cannot release glucose.',
    },
    x: 'Hereditary fructose intolerance is a lack of aldolase B. After fructose is eaten, fructose-1-phosphate builds up and traps the liver\'s phosphate. Without phosphate the liver cannot make or release glucose, so the baby becomes hypoglycaemic and the liver is damaged.',
    hy: ['Treat by removing fructose, sucrose and sorbitol from the diet.'],
    vs: ['fructosuria', 'Essential fructosuria (fructokinase) is harmless: no symptoms, just fructose in the urine.'],
  },
  galactokinase_def: {
    s: 'A 4-month-old girl feeds and grows well but **does not track faces or smile**. Both pupils look white: she has **bilateral cataracts**. Blood and urine galactose are high; liver tests are normal.',
    w: {
      'does not track faces or smile': 'She cannot see clearly because of the cataracts, so she does not follow faces or smile back.',
      'bilateral cataracts': 'Extra galactose is turned into galactitol by aldose reductase in the lens. Galactitol draws in water and clouds the lens.',
    },
    x: 'Galactokinase deficiency means galactose cannot be trapped and used. The extra galactose is turned into galactitol in the lens, which causes cataracts. Otherwise the baby is well, because no toxic galactose-1-phosphate is made.',
    hy: ['Galactokinase deficiency is the milder galactose disorder: infantile cataracts only; treat by removing galactose and lactose.'],
    vs: ['classic_galactosemia', 'Classic galactosaemia (GALT) is a sick newborn with vomiting, jaundice, a big liver and E coli sepsis as well as cataracts.'],
  },
  classic_galactosemia: {
    s: 'A 6-day-old boy began **vomiting once breastfeeding got going**, is increasingly jaundiced with a big liver and oil-drop cataracts, and his blood culture grows **E coli**.',
    w: {
      'vomiting once breastfeeding got going': 'Breast milk contains lactose, which is split into galactose. Toxic galactose-1-phosphate builds up once milk is fed.',
      'E coli': 'Galactose-1-phosphate impairs white cell function, so newborns are especially prone to E coli sepsis.',
    },
    x: 'Classic galactosaemia is a lack of GALT. Galactose-1-phosphate builds up in the liver, brain, kidney and lens. The newborn vomits, becomes jaundiced with a big liver, gets cataracts and can develop E coli sepsis.',
    hy: ['Classic galactosaemia (GALT deficiency) causes failure to thrive, jaundice, hepatomegaly, cataracts and intellectual disability; stop all galactose and lactose.'],
    vs: ['galactokinase_def', 'Galactokinase deficiency causes cataracts only, in a baby who is otherwise well.'],
  },
  lactase_def: {
    s: 'A 24-year-old man gets bloating, cramps and **watery diarrhoea an hour after milk** or ice cream, though hard cheese is fine. **Breath hydrogen rises** after lactose; stool pH is low.',
    w: {
      'watery diarrhoea an hour after milk': 'Undigested lactose stays in the gut and pulls water in by osmosis.',
      'Breath hydrogen rises': 'Colon bacteria ferment the lactose and release hydrogen, which is absorbed and breathed out.',
    },
    x: 'Lactase splits milk sugar (lactose) in the small intestine. When lactase declines, lactose reaches the colon, where bacteria ferment it into gas and acid. This causes bloating, cramps and an osmotic diarrhoea after dairy.',
    hy: ['Lactose intolerance gives an osmotic diarrhoea with a high stool osmotic gap and low stool pH, with normal intestinal lining on biopsy.'],
    vs: ['cystic_fibrosis', 'CF gives greasy fatty stools from pancreatic failure with lung infections, not dairy-triggered watery diarrhoea.'],
  },
  pku: {
    s: 'A 2-year-old girl who **missed newborn screening** has seizures, no words yet, eczema, **very fair skin and hair**, and a **musty, mousy body odour**.',
    w: {
      'missed newborn screening': 'This disease is usually caught on the newborn heel-prick test and treated with diet before brain damage starts.',
      'very fair skin and hair': 'Tyrosine is needed to make melanin. When phenylalanine cannot become tyrosine, pigment is low.',
      'musty, mousy body odour': 'Excess phenylalanine is turned into phenyl ketones such as phenylacetate, which smell musty.',
    },
    x: 'PKU is a lack of phenylalanine hydroxylase, which turns phenylalanine into tyrosine. Phenylalanine builds up and damages the developing brain, and tyrosine becomes an essential amino acid. Untreated children have intellectual disability, seizures, fair colouring and a musty smell.',
    hy: ['PKU is autosomal recessive; treat with a low-phenylalanine diet and extra tyrosine, and avoid aspartame.', 'Maternal PKU (high levels in pregnancy) harms the baby: microcephaly, intellectual disability and heart defects.'],
    vs: ['alkaptonuria', 'Alkaptonuria is a benign tyrosine-pathway defect: urine turns black on standing and cartilage darkens, without brain damage.'],
  },
  alkaptonuria: {
    s: 'A 50-year-old man has years of back and knee stiffness. Since childhood his **urine turns black if left standing**. His ear cartilage and sclerae have **blue-black patches**.',
    w: {
      'urine turns black if left standing': 'Homogentisic acid in the urine slowly oxidises in air into a dark pigment.',
      'blue-black patches': 'Homogentisic acid deposits in connective tissue and polymerises into a dark pigment (ochronosis).',
    },
    x: 'Alkaptonuria is a lack of homogentisate oxidase in the tyrosine breakdown pathway. Homogentisic acid builds up and is deposited in cartilage, turning it dark and brittle. Patients get dark urine, dark ear cartilage and sclerae, and painful arthritis.',
    hy: ['Alkaptonuria is autosomal recessive and usually benign, but ochronosis causes debilitating arthralgias.'],
    vs: ['g6pd_def', 'G6PD deficiency gives dark urine from haemolysis after a trigger, with anaemia and jaundice; the urine is dark at once.'],
  },
  msud: {
    s: 'A 5-day-old girl fed well for two days, then began vomiting, became very sleepy and had a seizure. Her urine and **ear wax smell sweet, like burnt sugar**.',
    w: {
      'ear wax smell sweet, like burnt sugar': 'Branched-chain keto acids from isoleucine build up and give a sweet, maple-syrup smell to urine, sweat and ear wax.',
    },
    x: 'MSUD is a lack of the enzyme that breaks down the branched-chain amino acids leucine, isoleucine and valine. They and their keto acids build up and poison the brain. Newborns vomit, become drowsy and have seizures, with a sweet smell.',
    hy: ['MSUD is a branched-chain α-ketoacid dehydrogenase defect; this enzyme needs thiamine (B1), and treatment is restricting leucine, isoleucine and valine.'],
    vs: ['pku', 'PKU is a toddler with a MUSTY smell, fair skin and slow developmental damage, not a sick newborn.'],
  },
  homocystinuria: {
    s: 'A tall, thin 14-year-old girl with learning difficulties has a **lens dislocated downward and inward** and a **DVT with no cause**. DEXA shows osteoporosis.',
    w: {
      'lens dislocated downward and inward': 'Homocysteine damages the fibres that hold the lens, so it slips down and in (the opposite of Marfan).',
      'DVT with no cause': 'High homocysteine damages vessel linings and makes blood clot easily, causing clots and early atherosclerosis.',
    },
    x: 'Homocystinuria is usually a lack of cystathionine β-synthase, so homocysteine cannot be converted onward. Homocysteine builds up and damages connective tissue, vessels and the brain. Patients are tall and thin, with lens dislocation, clots, osteoporosis and learning difficulties.',
    hy: ['Treatment: vitamin B6 (in responders), B12 and folate, extra cysteine and a low-methionine diet.'],
    vs: ['marfan', 'In Marfan the lens goes UP and out, intelligence is normal, clots are not a feature and homocysteine is normal.'],
  },
  cystinuria: {
    s: 'A 22-year-old man has his **third kidney stone since 16**; his sister has had stones too. The stones are faint on plain X-ray and urine shows **hexagonal crystals**.',
    w: {
      'third kidney stone since 16': 'Cystine is lost in the urine all the time. It is poorly soluble, so stones keep forming from a young age.',
      'hexagonal crystals': 'Cystine crystals have a typical six-sided shape, which is diagnostic.',
    },
    x: 'Cystinuria is a defect in the kidney transporter that reabsorbs cystine and other dibasic amino acids. Cystine stays in the urine, where it does not dissolve well. It forms repeated kidney stones, sometimes large staghorn stones.',
    hy: ['The transporter carries COLA: Cystine, Ornithine, Lysine, Arginine; diagnose with the cyanide-nitroprusside test.', 'Treat with lots of fluid and alkalinising the urine (acetazolamide or potassium citrate).'],
    vs: ['hartnup', 'Hartnup loses NEUTRAL amino acids (tryptophan): a pellagra-like rash and ataxia, not stones.'],
  },
  otc_def: {
    s: 'A 3-day-old boy was well for a day, then **stopped feeding, vomited and became drowsy** with fast breathing. His mother\'s brother died as a baby. **Ammonia is very high**, urine orotic acid high, BUN low.',
    w: {
      'stopped feeding, vomited and became drowsy': 'Once protein feeds start, ammonia builds up and poisons the brain.',
      'Ammonia is very high': 'OTC is a step in the urea cycle, which turns ammonia into urea. When it is blocked, ammonia cannot be cleared.',
    },
    x: 'OTC deficiency blocks the urea cycle, so ammonia is not turned into urea. Ammonia builds up and causes vomiting, drowsiness and brain swelling. The unused carbamoyl phosphate spills into pyrimidine synthesis, making orotic acid.',
    hy: ['OTC deficiency is the most common urea cycle disorder and is X-linked (the others are autosomal recessive).', 'Unlike hereditary orotic aciduria, there is high ammonia and no megaloblastic anaemia.'],
    vs: ['orotic_aciduria', 'Hereditary orotic aciduria raises orotic acid with a NORMAL ammonia and a megaloblastic anaemia.'],
  },
  organic_acidemia: {
    s: 'A 2-week-old girl vomits, feeds poorly and is floppy with a big liver and a seizure. She has a **high anion gap metabolic acidosis with ketones**, low glucose and high ammonia.',
    w: {
      'high anion gap metabolic acidosis with ketones': 'Methylmalonic or propionic acid builds up in the blood; these extra acids create the anion gap.',
    },
    x: 'Organic acidaemias are blocks in breaking down certain amino acids and odd-chain fats. Methylmalonyl-CoA mutase or propionyl-CoA carboxylase is missing, so acids pile up. Infants get a severe acidosis, vomiting, floppiness, low sugar and high ammonia.',
    hy: ['Methylmalonic acidaemia (methylmalonyl-CoA mutase) can respond to B12; propionic acidaemia is a propionyl-CoA carboxylase (biotin-dependent) defect.'],
    vs: ['msud', 'MSUD has the sweet burnt-sugar smell, with ammonia near normal and no big anion gap acidosis.'],
  },
  von_gierke: {
    s: 'A 6-month-old boy becomes **shaky and sweaty if he goes 3 hours without a feed**. He has a doll-like face, thin limbs and a **huge liver**. Lactate, uric acid and triglycerides are high; glucagon does not raise glucose.',
    w: {
      'shaky and sweaty if he goes 3 hours without a feed': 'The liver cannot release glucose from glycogen or from gluconeogenesis, so blood sugar falls as soon as food runs out.',
      'huge liver': 'Glycogen keeps being made but cannot be turned back into free glucose, so it fills the liver (and kidneys).',
    },
    x: 'Von Gierke disease is a lack of glucose-6-phosphatase, the last step that lets the liver release glucose. Glycogen and glucose-6-phosphate pile up in the liver. The baby has severe fasting hypoglycaemia, a huge liver and high lactate, uric acid and triglycerides.',
    hy: ['Von Gierke (GSD I) is autosomal recessive; treat with frequent feeds and cornstarch, and avoid fructose and galactose.'],
    vs: ['cori', 'Cori (debranching enzyme) is a milder fasting hypoglycaemia with NORMAL lactate, because gluconeogenesis works.'],
  },
  pompe: {
    s: 'A 4-month-old boy is very floppy, struggles to feed and has a **large tongue**. He sweats and breathes hard during feeds; chest X-ray shows a **very large heart**. Glucose is normal.',
    w: {
      'large tongue': 'Glycogen collects inside the lysosomes of tongue muscle, enlarging it.',
      'very large heart': 'Heart muscle fills with lysosomal glycogen and thickens (hypertrophic cardiomyopathy), which is often fatal.',
    },
    x: 'Pompe disease is a lack of lysosomal acid α-glucosidase (acid maltase). Glycogen cannot be broken down inside lysosomes, so it builds up in heart and skeletal muscle. Babies are floppy with a big heart and tongue, but blood sugar is normal.',
    hy: ['Pompe (GSD II) is the glycogen storage disease that affects the heart; enzyme replacement is available.'],
    vs: ['sma', 'SMA is a floppy but alert baby with tongue fasciculations and a NORMAL heart.'],
  },
  cori: {
    s: 'A 2-year-old girl gets **mildly shaky if she misses breakfast**, has an enlarged liver and tires easily walking. **Lactate is normal**; CK is mildly raised.',
    w: {
      'mildly shaky if she misses breakfast': 'Only the branch points of glycogen cannot be broken down. The outer chains and gluconeogenesis still make glucose, so lows are mild.',
      'Lactate is normal': 'Gluconeogenesis works normally and uses lactate, so it does not build up.',
    },
    x: 'Cori disease is a lack of the debranching enzyme. Glycogen can only be partly broken down, leaving short stubby branches stored in the liver and muscle. Children have mild fasting hypoglycaemia, a big liver and muscle weakness.',
    hy: ['Cori (GSD III) is like a milder von Gierke with normal lactate; it can cause myopathy and cardiomyopathy.'],
    vs: ['von_gierke', 'Von Gierke is a SEVERE fasting hypoglycaemia with high lactate, uric acid and triglycerides.'],
  },
  mcardle: {
    s: 'A 19-year-old woman gets **painful cramps within minutes of sprinting**, does better after a short rest (**second wind**), and once passed **cola-coloured urine** after a hard session. Lactate does not rise with exercise.',
    w: {
      'painful cramps within minutes of sprinting': 'Muscle cannot break down its own glycogen, so it runs out of fuel during intense exercise.',
      'second wind': 'After a few minutes, blood flow brings glucose and fatty acids from elsewhere, so the muscle has fuel again.',
      'cola-coloured urine': 'Muscle cells break down under the strain and release myoglobin, which colours the urine.',
    },
    x: 'McArdle disease is a lack of muscle glycogen phosphorylase (myophosphorylase). Muscle cannot use its stored glycogen during hard exercise. This causes cramps, muscle breakdown and dark urine, but blood glucose is normal.',
    hy: ['McArdle (GSD V): lactate does not rise on exercise testing, and the "second wind" phenomenon is a classic clue.'],
    vs: ['becker', 'Becker gives steady proximal weakness and big calves, not exercise-triggered cramps with a second wind.'],
  },
  fabry: {
    s: 'A 15-year-old boy gets **burning pain in his hands and feet** when hot, **barely sweats**, and has **dark red spots around his navel and groin**. Urine shows protein. Maternal uncles are affected.',
    w: {
      'burning pain in his hands and feet': 'Fat (globotriaosylceramide) builds up in small nerve fibres, causing painful neuropathy, worse with heat or exercise.',
      'barely sweats': 'Lipid collects in sweat glands and their nerves, so sweating is reduced.',
      'dark red spots around his navel and groin': 'These are angiokeratomas: small vessels in the skin dilate when lipid builds up in their walls.',
    },
    x: 'Fabry disease is a lack of α-galactosidase A. A fatty molecule called globotriaosylceramide builds up in nerves, blood vessels, kidneys and heart. Boys get burning limb pain, red skin spots and reduced sweating, then kidney and heart disease.',
    hy: ['Fabry is the X-linked recessive sphingolipidosis; late complications are kidney failure, cardiovascular disease and stroke.'],
    vs: ['alport', 'Alport is blood in the urine with deafness and lens changes, without pain crises or skin spots.'],
  },
  gaucher: {
    s: 'A 25-year-old **Ashkenazi Jewish** woman has attacks of deep **bone pain**, a painful hip, easy bruising and fatigue. She has hepatosplenomegaly and pancytopenia; femurs look like **Erlenmeyer flasks**.',
    w: {
      'Ashkenazi Jewish': 'Several lysosomal storage diseases, including Gaucher, Tay-Sachs and Niemann-Pick, are more common in this population.',
      'bone pain': 'Lipid-filled macrophages pack the bone marrow, causing bone crises and avascular necrosis of the femoral head.',
      'Erlenmeyer flasks': 'Marrow packed with Gaucher cells widens the end of the femur into a flask shape.',
    },
    x: 'Gaucher disease is a lack of glucocerebrosidase. Glucocerebroside builds up in macrophages, which fill the spleen, liver and bone marrow. This causes a big spleen and liver, low blood counts and bone pain.',
    hy: ['Gaucher is the most common lysosomal storage disease; the macrophages look like "crumpled tissue paper".', 'Treat with enzyme replacement.'],
    vs: ['niemann_pick', 'Niemann-Pick is an infant with brain degeneration and a cherry-red spot, with foam cells rather than bone crises.'],
  },
  niemann_pick: {
    s: 'A 6-month-old girl of Ashkenazi Jewish parents has **lost the skills she had at 3 months**. Her belly is big with **hepatosplenomegaly**, and there is a **cherry-red spot** on the macula.',
    w: {
      'lost the skills she had at 3 months': 'Sphingomyelin builds up in neurons, which slowly die, so the baby goes backwards (regression).',
      'hepatosplenomegaly': 'Lipid-laden foam cells (macrophages) fill the liver and spleen.',
      'cherry-red spot': 'Lipid builds up in the retina around the fovea, turning it pale, so the normal red centre stands out.',
    },
    x: 'Niemann-Pick disease is a lack of sphingomyelinase. Sphingomyelin builds up in neurons and macrophages. Infants lose skills, develop a big liver and spleen, and have a cherry-red spot on the macula.',
    hy: ['Niemann-Pick (sphingomyelinase) is autosomal recessive with foam cells, a cherry-red spot and hepatosplenomegaly.'],
    vs: ['tay_sachs', 'Tay-Sachs also has a cherry-red spot and regression, but NO hepatosplenomegaly, with an exaggerated startle.'],
  },
  tay_sachs: {
    s: 'A 7-month-old boy who rolled and laughed at 4 months can no longer sit, **startles violently at small noises** and has a cherry-red spot. Liver and spleen are **normal size**.',
    w: {
      'startles violently at small noises': 'Damaged neurons over-react to sound (hyperacusis), giving a big whole-body startle.',
      'normal size': 'In Tay-Sachs the lipid builds up only in neurons, not in macrophages, so the liver and spleen stay normal.',
    },
    x: 'Tay-Sachs disease is a lack of hexosaminidase A. GM2 ganglioside builds up inside neurons, which swell and die. Infants regress, startle to noise and have a cherry-red spot, but the liver and spleen are not enlarged.',
    hy: ['Tay-Sachs neurons show "onion skin" lysosomes; it is autosomal recessive and more common in Ashkenazi Jewish families.'],
    vs: ['niemann_pick', 'Niemann-Pick has the same cherry-red spot and regression, but WITH hepatosplenomegaly and foam cells.'],
  },
  krabbe: {
    s: 'A 5-month-old boy is **extremely irritable**, stiff and no longer follows toys; his **optic discs are pale** and deep reflexes reduced. Nerve conduction shows a peripheral neuropathy.',
    w: {
      'extremely irritable': 'A toxic lipid (psychosine) destroys the myelin-making cells of the brain and nerves, which is painful and distressing.',
      'optic discs are pale': 'The optic nerve loses its myelin and shrinks (optic atrophy), so the baby stops following objects.',
    },
    x: 'Krabbe disease is a lack of galactocerebrosidase. Psychosine builds up and kills the cells that make myelin in the brain and peripheral nerves. Babies become irritable and stiff, lose vision and develop a neuropathy.',
    hy: ['Krabbe shows "globoid cells" in the brain and affects both central and peripheral myelin; it is autosomal recessive.'],
    vs: ['mld', 'MLD (arylsulfatase A) starts later, around walking age, with ataxia and loss of skills, and sulfatides in the urine.'],
  },
  mld: {
    s: 'A 2-year-old girl who walked at a year now **stumbles and falls constantly** and has **lost words**. Reflexes are reduced and nerve conduction is slow; MRI shows white matter damage.',
    w: {
      'stumbles and falls constantly': 'Myelin is lost in the brain and peripheral nerves, so balance and walking fail.',
      'lost words': 'Damage to the brain\'s white matter causes a dementia-like loss of skills she had already learned.',
    },
    x: 'Metachromatic leukodystrophy is a lack of arylsulfatase A. Cerebroside sulfate (sulfatide) builds up and destroys myelin in both the brain and the nerves. Children lose walking, speech and other skills.',
    hy: ['MLD is autosomal recessive, with central and peripheral demyelination causing ataxia and dementia.'],
    vs: ['krabbe', 'Krabbe starts earlier (first months) with extreme irritability, optic atrophy and globoid cells.'],
  },
  hurler: {
    s: 'A 2-year-old boy has an increasingly **coarse face** with thick lips and tongue, **cloudy corneas**, loud snoring with apnoeas and hepatosplenomegaly, and has stopped learning words.',
    w: {
      'coarse face': 'Glycosaminoglycans (heparan and dermatan sulfate) build up in the soft tissues of the face, thickening them ("gargoylism").',
      'cloudy corneas': 'Dermatan sulfate collects in the cornea and clouds it, which is a key way to tell Hurler from Hunter.',
    },
    x: 'Hurler syndrome is a lack of α-L-iduronidase. Heparan and dermatan sulfate cannot be broken down and build up in many tissues. Children get a coarse face, cloudy corneas, a big liver and spleen, airway blockage and developmental delay.',
    hy: ['Hurler is an autosomal recessive mucopolysaccharidosis with corneal clouding; urine has heparan and dermatan sulfate.'],
    vs: ['hunter', 'Hunter is milder and X-linked, with aggressive behaviour and CLEAR corneas.'],
  },
  hunter: {
    s: 'A 5-year-old boy has become **aggressive and hyperactive**, with a thickened face and stiff joints, but his **corneas are clear**. His maternal uncle had something similar.',
    w: {
      'aggressive and hyperactive': 'Glycosaminoglycans build up in the brain and cause behaviour problems, which are typical of Hunter.',
      'corneas are clear': 'Unlike Hurler, the cornea is spared, which is the key way to tell them apart.',
    },
    x: 'Hunter syndrome is a lack of iduronate-2-sulfatase. Heparan and dermatan sulfate build up, giving a coarse face and stiff joints. It is a milder relative of Hurler with aggression and clear corneas.',
    hy: ['Hunter is X-linked recessive ("Hunters see clearly and aim for the X"), with no corneal clouding.'],
    vs: ['hurler', 'Hurler is autosomal recessive and more severe, with CLOUDY corneas.'],
  },
  carnitine_def: {
    s: 'A 3-year-old boy is **weak and floppy** and breathless with play. During a tummy bug he became drowsy with **low sugar and no ketones**. Echo shows a dilated, poorly pumping heart.',
    w: {
      'weak and floppy': 'Muscle needs fat for fuel. Without carnitine, long-chain fatty acids cannot reach the mitochondria to be burned.',
      'low sugar and no ketones': 'Fasting normally switches the body to fat burning, which makes ketones and spares glucose. Without it, glucose runs out and no ketones are made.',
    },
    x: 'Carnitine carries long-chain fatty acids into mitochondria to be burned. Without it, fat cannot be used for energy, so muscles and the heart weaken. During fasting, blood sugar falls with no ketones.',
    hy: ['Primary carnitine deficiency causes hypoketotic hypoglycaemia and dilated cardiomyopathy; treat with carnitine supplements.'],
    vs: ['mcad', 'MCAD gives the same fasting low sugar without ketones in a previously well child, without a weak heart or muscles.'],
  },
  mcad: {
    s: 'A **previously healthy** 15-month-old girl ate almost nothing for a day during a vomiting illness and is now **hard to wake** and has a seizure. Glucose is low with **no urine ketones**; dicarboxylic acids are high.',
    w: {
      'previously healthy': 'Children are well when eating normally; the problem only appears when they must burn fat during fasting or illness.',
      'hard to wake': 'With glucose low and no ketones to use instead, the brain runs out of fuel.',
      'no urine ketones': 'Fatty acids cannot be fully broken down, so ketones cannot be made.',
    },
    x: 'MCAD deficiency blocks the breakdown of medium-chain fatty acids in mitochondria. In fasting or illness the body cannot burn fat, so glucose runs out and no ketones are made. Children become drowsy, have seizures and can die suddenly.',
    hy: ['MCAD causes hypoketotic hypoglycaemia after fasting and can present as sudden infant death; treat by avoiding fasting.'],
    vs: ['carnitine_def', 'Primary carnitine deficiency adds long-term weakness and a weak, dilated heart, with very low carnitine.'],
  },
  abetalipoproteinemia: {
    s: 'A 5-month-old boy has **pale, bulky, foul greasy stools** and is not growing despite feeding well. Smear shows **acanthocytes**; cholesterol and triglycerides are **extraordinarily low**.',
    w: {
      'pale, bulky, foul greasy stools': 'Gut cells cannot package fat into chylomicrons, so fat stays in the cells or passes out in the stool.',
      'acanthocytes': 'Abnormal fat in the red cell membranes makes them spiky.',
      'extraordinarily low': 'No chylomicrons or VLDL are made, so almost no fat is carried in the blood.',
    },
    x: 'Abetalipoproteinaemia is a lack of microsomal triglyceride transfer protein (MTP). Without it, apoB-48 and apoB-100 particles cannot be made, so chylomicrons and VLDL are missing. Fat and fat-soluble vitamins are not absorbed, causing fatty stools and poor growth.',
    hy: ['Later, low vitamin E causes retinitis pigmentosa and spinocerebellar degeneration; treat with a low-fat diet and high-dose vitamin E.'],
    vs: ['cystic_fibrosis', 'CF also gives fatty stools, but with lung infections and a high sweat chloride; blood fats are not absent.'],
  },
  hyperchylo: {
    s: 'An 11-year-old boy has his **second bout of pancreatitis** and **itchy yellow bumps** on his back and arms. A refrigerated blood sample forms a **creamy layer on top**. Triglycerides are extremely high.',
    w: {
      'second bout of pancreatitis': 'Very high triglycerides are broken down in the pancreas into free fatty acids, which damage it and trigger pancreatitis.',
      'itchy yellow bumps': 'These are eruptive xanthomas: fat-filled macrophages in the skin when triglycerides are very high.',
      'creamy layer on top': 'Chylomicrons are light and float, so they form a creamy layer on top of chilled plasma.',
    },
    x: 'Familial hyperchylomicronaemia is a lack of lipoprotein lipase or its activator apoC-II. Chylomicrons cannot be cleared, so triglycerides are extremely high. This causes pancreatitis, eruptive xanthomas and a big liver and spleen.',
    hy: ['Type I hyperlipidaemia does NOT increase the risk of atherosclerosis.'],
    vs: ['hypertg', 'Type IV (VLDL) also causes pancreatitis, but in adults with insulin resistance, and no creamy layer.'],
  },
  fh: {
    s: 'A 34-year-old non-smoking, slim man had a **heart attack at 33**; his father died of one at 40. He has **Achilles tendon xanthomas** and corneal arcus. LDL is very high; triglycerides are normal.',
    w: {
      'heart attack at 33': 'Very high LDL from birth clogs the coronary arteries decades earlier than normal.',
      'Achilles tendon xanthomas': 'LDL cholesterol is taken up by macrophages in tendons, forming lumps; tendon xanthomas are typical of this disease.',
    },
    x: 'Familial hypercholesterolaemia is a defect in the LDL receptor (or apoB or PCSK9). The liver cannot remove LDL from the blood, so LDL is very high from birth. This causes early heart attacks, tendon xanthomas and corneal arcus.',
    hy: ['FH is type II hyperlipidaemia, autosomal dominant; homozygotes can have heart attacks in childhood.', 'Treat with statins, plus ezetimibe or PCSK9 inhibitors.'],
    vs: ['dysbeta', 'Type III raises BOTH cholesterol and triglycerides (apoE2), with palm-crease and elbow xanthomas.'],
  },
  dysbeta: {
    s: 'A 52-year-old man has angina and leg claudication. He has **yellow-orange streaks in his palm creases** and bumps over his elbows. **Cholesterol and triglycerides are both raised**, roughly equally.',
    w: {
      'yellow-orange streaks in his palm creases': 'These palmar xanthomas are almost unique to type III; remnant particles deposit in the skin creases.',
      'Cholesterol and triglycerides are both raised': 'Remnants of chylomicrons and VLDL carry both lipids, so both rise together.',
    },
    x: 'Dysbetalipoproteinaemia is caused by the apoE2/E2 genotype. ApoE2 binds poorly to liver receptors, so chylomicron and VLDL remnants are not cleared. Both cholesterol and triglycerides rise, causing early atherosclerosis and typical xanthomas.',
    hy: ['Type III hyperlipidaemia (apoE2) gives palmar and tuberoeruptive xanthomas and premature atherosclerosis.'],
    vs: ['fh', 'FH raises LDL alone, with tendon (Achilles) xanthomas; triglycerides are normal.'],
  },
  hypertg: {
    s: 'A 45-year-old woman has **acute pancreatitis** after a big meal with wine. Her **father and brother have "high triglycerides"**. She has no xanthomas. Triglycerides (VLDL) are very high; LDL is normal.',
    w: {
      'acute pancreatitis': 'Very high triglycerides are broken down in the pancreas into free fatty acids, which inflame it; alcohol and a big meal push them higher.',
      'father and brother have "high triglycerides"': 'Familial hypertriglyceridaemia is autosomal dominant, so it shows in each generation.',
    },
    x: 'Familial hypertriglyceridaemia is overproduction of VLDL by the liver. Triglycerides are very high while LDL is normal. The main danger is acute pancreatitis, and it is linked to insulin resistance.',
    hy: ['Type IV hyperlipidaemia is autosomal dominant hepatic VLDL overproduction; treat with lifestyle changes and fibrates.'],
    vs: ['hyperchylo', 'Type I is a child with chylomicrons (creamy layer) and eruptive xanthomas from lipoprotein lipase loss.'],
  },
};
