/**
 * HY Diseases · Microbiology — mycobacteria, spirochaetes, intracellular
 * and zoonotic bacteria. Case format: see hyd/immuno/immunoCases.js.
 * Original wording.
 */
export default [
  {
    id: 'mb_tb', name: 'Reactivation tuberculosis', chapter: 'zoo', tag: 'Mycobacterium tuberculosis',
    s: 'A 50-year-old man who emigrated from India has 3 months of cough, **night sweats and weight loss**, and has **coughed up blood**. Chest X-ray shows a **cavity in the right upper lobe**. Sputum has **acid-fast rods**.',
    w: {
      'night sweats and weight loss': 'Cytokines such as TNF-α from the chronic granulomatous response cause fever, sweats and wasting.',
      'coughed up blood': 'Caseous necrosis erodes into small airway blood vessels.',
      'cavity in the right upper lobe': 'Reactivation favours the apices, which have the highest oxygen levels; necrosis empties into an airway, leaving a cavity.',
      'acid-fast rods': 'Mycolic acids in the cell wall hold the stain (Ziehl-Neelsen).',
    },
    x: 'TB is caused by inhaling M tuberculosis, which survives inside macrophages. Th1 cells and IFN-γ wall it off in caseating granulomas (primary Ghon complex). Years later, when immunity weakens, it reactivates in the upper lobes, causing cavities, cough, haemoptysis and weight loss.',
    hy: ['Treat active TB with RIPE: rifampin, isoniazid, pyrazinamide, ethambutol; screen with PPD or IGRA; TNF-α inhibitors can reactivate latent TB.', 'Extrapulmonary TB includes Pott disease (spine), meningitis, scrofula and adrenal involvement.'],
    lookalikes: {
      mb_histoplasma: 'Histoplasmosis mimics TB with cavities and granulomas, from bat or bird droppings in the Mississippi and Ohio valleys.',
      mb_leprosy: 'Leprosy affects skin and peripheral nerves, with numb patches.',
      mb_nocardia: 'Nocardia is weakly acid-fast and branching, causing lung and brain abscesses in transplant patients.',
    },
    vs: 'mb_histoplasma',
  },
  {
    id: 'mb_leprosy', name: 'Leprosy (Hansen disease)', chapter: 'zoo', tag: 'Mycobacterium leprae',
    s: 'A man from Brazil who handled **armadillos** has **pale skin patches that have lost all feeling** and thickened nerves at his elbow. Skin biopsy shows few acid-fast bacilli in **granulomas**. The organism **cannot be grown in culture** and prefers cool body areas.',
    w: {
      'armadillos': 'In the US, armadillos are a reservoir of M leprae.',
      'pale skin patches that have lost all feeling': 'M leprae infects Schwann cells in cool peripheral nerves of the skin, destroying sensation.',
      'granulomas': 'A strong Th1 response (tuberculoid leprosy) walls the bacteria off, so few are seen.',
      'cannot be grown in culture': 'M leprae cannot be cultured in vitro; it grows best in cool tissues such as skin and nerves.',
    },
    x: 'Leprosy is a chronic infection by M leprae of the skin and peripheral nerves. With a strong Th1 response (tuberculoid) there are few, limited numb patches; with a weak Th2 response (lepromatous) there is widespread disease with "lion-like" facies. Loss of sensation leads to injuries and deformity.',
    hy: ['Tuberculoid leprosy (Th1, limited, few bacteria) vs lepromatous (Th2, diffuse, many bacteria, lion-like face); treat with dapsone and rifampin (plus clofazimine for lepromatous).'],
    lookalikes: {
      mb_tb: 'TB affects the lungs with cavities, haemoptysis and night sweats.',
      mb_syphilis: 'Secondary syphilis gives a rash on the palms and soles without numb patches.',
      mb_sporothrix: 'Sporotrichosis gives nodules along the lymphatics after a rose-thorn prick.',
    },
    vs: 'mb_tb',
  },
  {
    id: 'mb_lyme', name: 'Lyme disease', chapter: 'zoo', tag: 'Borrelia burgdorferi (Ixodes tick)',
    s: 'A hiker in **Connecticut** has a **large expanding red rash with a pale centre** at the site of a tick bite. Weeks later he develops **bilateral facial palsy** and a **heart block**.',
    w: {
      'Connecticut': 'Lyme is most common in the northeastern US, where Ixodes ticks and their deer and mouse hosts live.',
      'large expanding red rash with a pale centre': 'Erythema migrans: the spirochaete spreads outward through the skin from the bite.',
      'bilateral facial palsy': 'Early disseminated Lyme affects cranial nerves, typically the facial nerve (often both sides).',
      'heart block': 'The spirochaete can infect the heart conduction system (Lyme carditis).',
    },
    x: 'Lyme disease is caused by the spirochaete Borrelia burgdorferi, carried by Ixodes ticks. It starts with erythema migrans, then can spread to cause facial palsy, carditis with heart block and meningitis. Late disease causes migratory and then chronic arthritis.',
    hy: ['Lyme: "FAKE a Key Lyme pie": Facial nerve palsy, Arthritis, Kardiac block, Erythema migrans; treat with doxycycline (ceftriaxone for severe disease); Ixodes also carries Babesia and Anaplasma.'],
    lookalikes: {
      mb_rmsf: 'Rocky Mountain spotted fever starts at the wrists and ankles and spreads inward, with fever and headache.',
      mb_rheumatic: 'Rheumatic fever gives migratory arthritis and carditis weeks after strep throat.',
      mb_syphilis: 'Secondary syphilis gives a palm and sole rash with condylomata lata.',
    },
    vs: 'mb_rheumatic',
  },
  {
    id: 'mb_syphilis', name: 'Secondary syphilis', chapter: 'zoo', tag: 'Treponema pallidum',
    s: 'A 30-year-old man who had a **painless genital ulcer that healed** two months ago now has a **rash on his palms and soles**, swollen lymph nodes and **flat, moist, wart-like lesions near the anus**. The organism **cannot be Gram-stained** but is seen with dark-field microscopy.',
    w: {
      'painless genital ulcer that healed': 'Primary syphilis: a painless, clean-based chancre that heals on its own.',
      'rash on his palms and soles': 'Spirochaetes spread through the blood, causing a widespread rash including palms and soles.',
      'flat, moist, wart-like lesions near the anus': 'Condylomata lata are highly infectious and full of spirochaetes.',
      'cannot be Gram-stained': 'T pallidum is too thin to see on Gram stain; dark-field or fluorescent antibody is used.',
    },
    x: 'Syphilis is caused by the spirochaete Treponema pallidum. Primary syphilis is a painless chancre; secondary is a disseminated rash, condylomata lata and lymph nodes; tertiary causes gummas, aortitis and neurosyphilis (tabes dorsalis, Argyll Robertson pupil). It is treated with penicillin.',
    hy: ['Syphilis: screen with VDRL or RPR (non-specific), confirm with FTA-ABS (specific); treat with penicillin G; Jarisch-Herxheimer reaction can follow treatment.', 'Congenital syphilis: notched (Hutchinson) teeth, saddle nose, saber shins, deafness.'],
    lookalikes: {
      mb_lgv: 'Lymphogranuloma venereum gives a small painless ulcer and then painful swollen groin nodes that drain.',
      mb_rmsf: 'RMSF also reaches palms and soles but follows a tick bite with high fever and headache.',
      mb_lyme: 'Lyme disease gives a bull\'s-eye rash at a tick bite.',
    },
    vs: 'mb_lgv',
  },
  {
    id: 'mb_leptospirosis', name: 'Leptospirosis (Weil disease)', chapter: 'zoo', tag: 'Leptospira interrogans',
    s: 'Two weeks after **white-water rafting in Hawaii**, a man has fever, muscle pain and **red eyes without discharge**. He then develops **jaundice and kidney failure**.',
    w: {
      'white-water rafting in Hawaii': 'Leptospira is shed in animal (especially rat) urine into fresh water; it is common in the tropics and Hawaii.',
      'red eyes without discharge': 'Conjunctival suffusion is a classic early sign.',
      'jaundice and kidney failure': 'Weil disease: severe leptospirosis with liver and kidney failure, bleeding and anaemia.',
    },
    x: 'Leptospirosis is a spirochaete infection from water contaminated with animal urine. It causes a flu-like illness with conjunctival suffusion and muscle pain. In its severe form (Weil disease) it causes jaundice, kidney failure, fever, bleeding and anaemia.',
    hy: ['Leptospirosis: animal urine in water (surfers, tropics, Hawaii); conjunctival suffusion; Weil disease = icterohaemorrhagic leptospirosis with kidney and liver failure.'],
    lookalikes: {
      mb_hep_a: 'Hepatitis A causes jaundice after contaminated food, without kidney failure or red eyes.',
      mb_yellow_fever: 'Yellow fever causes jaundice and black vomit after a mosquito bite.',
      mb_rmsf: 'RMSF causes a rash spreading from the wrists and ankles after a tick bite.',
    },
    vs: 'mb_yellow_fever',
  },
  {
    id: 'mb_rmsf', name: 'Rocky Mountain spotted fever', chapter: 'zoo', tag: 'Rickettsia rickettsii (Dermacentor tick)',
    s: 'A boy from **North Carolina** has fever and a severe headache a week after a **tick bite**. Then a rash **starts on his wrists and ankles and spreads to his trunk**, including his palms and soles.',
    w: {
      'North Carolina': 'Despite the name, RMSF is most common in the southeastern and south-central US.',
      'tick bite': 'The Dermacentor (dog) tick carries Rickettsia rickettsii.',
      'starts on his wrists and ankles and spreads to his trunk': 'Rickettsiae infect blood vessel walls (vasculitis); the rash spreads centripetally, from limbs to trunk.',
    },
    x: 'RMSF is caused by Rickettsia rickettsii, an obligate intracellular bacterium spread by ticks. It infects the endothelium, causing vasculitis. The classic triad is fever, headache and a rash that starts at the wrists and ankles and spreads inward. Untreated it can be fatal.',
    hy: ['Rashes on the palms and soles: Coxsackie A (hand-foot-mouth), RMSF and secondary syphilis ("drive CARS using your palms and soles"); treat RMSF with doxycycline, even in children.'],
    lookalikes: {
      mb_meningococcemia: 'Meningococcaemia gives a petechial rash with shock and meningitis, without a tick bite.',
      mb_lyme: 'Lyme disease starts with a single expanding bull\'s-eye rash at the bite.',
      mb_measles: 'Measles has a rash spreading DOWN from the head, with cough, coryza and conjunctivitis.',
    },
    vs: 'mb_measles',
  },
  {
    id: 'mb_q_fever', name: 'Q fever', chapter: 'zoo', tag: 'Coxiella burnetii',
    s: 'A **sheep farmer who helped with lambing** has fever, headache and pneumonia, and later raised liver enzymes. There was **no tick bite and no rash**. The organism is **spore-like and survives long in the environment**.',
    w: {
      'sheep farmer who helped with lambing': 'Coxiella is shed in huge numbers in placental tissue and birth fluids of cattle and sheep, then inhaled as aerosols.',
      'no tick bite and no rash': 'Unlike most rickettsial diseases, it is inhaled, not spread by a vector, and causes no rash.',
      'spore-like and survives long in the environment': 'Coxiella forms a spore-like form that resists heat and drying.',
    },
    x: 'Q fever is caused by Coxiella burnetii, inhaled from aerosols of birth products of cattle and sheep. It causes fever, pneumonia and hepatitis and, when chronic, culture-negative endocarditis. Unlike rickettsiae, it needs no tick and causes no rash.',
    hy: ['Q fever: inhaled aerosols from cattle and sheep amniotic fluid; pneumonia and hepatitis, culture-negative endocarditis; no rash and no vector.'],
    lookalikes: {
      mb_legionella: 'Legionella pneumonia comes from water aerosols with diarrhoea and low sodium.',
      mb_brucella: 'Brucellosis causes undulant fever after unpasteurised dairy or animal contact.',
      mb_rmsf: 'RMSF has a tick bite and a rash starting at the wrists and ankles.',
    },
    vs: 'mb_brucella',
  },
  {
    id: 'mb_cat_scratch', name: 'Cat scratch disease', chapter: 'zoo', tag: 'Bartonella henselae',
    s: 'A 10-year-old who plays with a **new kitten** has a small papule on his forearm and, two weeks later, a **tender, swollen lymph node in the armpit** with low fever. Node biopsy shows **stellate necrotising granulomas**.',
    w: {
      'new kitten': 'Bartonella henselae is carried by young cats and spread by scratches or bites (and cat fleas).',
      'tender, swollen lymph node in the armpit': 'The bacteria drain from the scratch to the nearest lymph node.',
      'stellate necrotising granulomas': 'Star-shaped areas of necrosis with granulomas are typical.',
    },
    x: 'Cat scratch disease is caused by Bartonella henselae from a cat scratch or bite. A papule forms at the scratch, followed by a tender regional lymph node with stellate granulomas. In people with AIDS, Bartonella causes bacillary angiomatosis instead.',
    hy: ['Bartonella henselae causes cat scratch disease (regional lymphadenopathy) in immunocompetent people and bacillary angiomatosis (vascular skin lesions, mimicking Kaposi sarcoma) in AIDS.'],
    lookalikes: {
      mb_pasteurella: 'Pasteurella causes cellulitis within hours to a day of a cat or dog BITE.',
      mb_tularemia: 'Tularaemia gives an ulcer with big nodes after handling rabbits or a tick bite.',
      mb_toxoplasma: 'Toxoplasmosis from cats causes mono-like lymph nodes, or brain lesions in AIDS.',
    },
    vs: 'mb_pasteurella',
  },
  {
    id: 'mb_brucella', name: 'Brucellosis', chapter: 'zoo', tag: 'Brucella (unpasteurised dairy)',
    s: 'A man who drinks **unpasteurised goat\'s milk** has **fevers that come and go over weeks**, night sweats, joint pain and an enlarged liver and spleen.',
    w: {
      'unpasteurised goat\'s milk': 'Brucella is spread from livestock through unpasteurised dairy or contact with animals.',
      'fevers that come and go over weeks': 'Undulant fever: the organism hides in macrophages and is released in waves.',
    },
    x: 'Brucellosis is caused by Brucella, a facultative intracellular gram-negative coccobacillus from livestock. People catch it from unpasteurised dairy or contact with animals. It causes undulant fever, night sweats, arthralgia and hepatosplenomegaly, sometimes with granulomas.',
    hy: ['Brucella: unpasteurised dairy, undulant fever, granulomatous hepatitis; treat with doxycycline plus rifampin.'],
    lookalikes: {
      mb_q_fever: 'Q fever is pneumonia and hepatitis after inhaling aerosols from animal birth products.',
      mb_typhoid: 'Typhoid gives a step-ladder fever with rose spots after contaminated food in the tropics.',
      mb_tb: 'TB causes lung cavities, cough and haemoptysis with weight loss.',
    },
    vs: 'mb_q_fever',
  },
  {
    id: 'mb_tularemia', name: 'Tularemia', chapter: 'zoo', tag: 'Francisella tularensis',
    s: 'A hunter who **skinned wild rabbits** has fever, an **ulcer on his finger** and **large tender lymph nodes in his armpit**.',
    w: {
      'skinned wild rabbits': 'Francisella tularensis is carried by rabbits and spread by handling them or by tick and deer fly bites.',
      'ulcer on his finger': 'The bacteria enter through a cut, forming an ulcer at the entry site.',
      'large tender lymph nodes in his armpit': 'Ulceroglandular tularaemia: the organism spreads to the regional lymph nodes.',
    },
    x: 'Tularaemia is caused by Francisella tularensis, an intracellular gram-negative coccobacillus from rabbits, ticks and deer flies. The most common form is an ulcer at the entry site with large regional lymph nodes. It can also cause pneumonia and is a bioterrorism agent.',
    hy: ['Tularaemia: rabbits, ticks and deer flies; ulceroglandular form; treat with aminoglycosides (streptomycin or gentamicin).'],
    lookalikes: {
      mb_cat_scratch: 'Cat scratch disease gives a lymph node near a kitten scratch, with stellate granulomas.',
      mb_anthrax: 'Cutaneous anthrax gives a painless black eschar after contact with wool or hides.',
      mb_sporothrix: 'Sporotrichosis gives a chain of nodules along the lymphatics after a rose-thorn prick.',
    },
    vs: 'mb_cat_scratch',
  },
  {
    id: 'mb_pasteurella', name: 'Pasteurella multocida cellulitis', chapter: 'zoo', tag: 'Cat and dog bites',
    s: 'A few hours after being **bitten on the hand by her cat**, a woman has spreading redness, swelling and pain around the wound. Culture grows a **gram-negative coccobacillus**.',
    w: {
      'bitten on the hand by her cat': 'Pasteurella multocida lives in the mouths of cats and dogs; cat bites are deep punctures.',
      'gram-negative coccobacillus': 'Pasteurella is a small gram-negative coccobacillus.',
    },
    x: 'Pasteurella multocida is part of the normal mouth flora of cats and dogs. After a bite, it causes rapid cellulitis within a day, and sometimes osteomyelitis. Amoxicillin-clavulanate is the usual treatment and prophylaxis.',
    hy: ['Pasteurella multocida: rapid cellulitis or osteomyelitis after a cat or dog bite; treat with amoxicillin-clavulanate.'],
    lookalikes: {
      mb_cat_scratch: 'Cat scratch disease causes a swollen lymph node weeks after a scratch.',
      mb_v_vulnificus: 'Vibrio vulnificus causes blistering infection after seawater exposure.',
      mb_tetanus: 'Tetanus causes muscle spasms after a dirty puncture wound in an unvaccinated person.',
    },
    vs: 'mb_cat_scratch',
  },
  {
    id: 'mb_lgv', name: 'Lymphogranuloma venereum', chapter: 'zoo', tag: 'Chlamydia trachomatis L1–L3',
    s: 'A man had a **small painless genital ulcer that healed** quickly. Weeks later he has **very painful swollen groin lymph nodes that break open and drain pus**. The organism is an **obligate intracellular bacterium** seen as inclusions in cells.',
    w: {
      'small painless genital ulcer that healed': 'The primary lesion of LGV is small and often unnoticed.',
      'very painful swollen groin lymph nodes that break open and drain pus': 'These are buboes: the infection moves into the lymph nodes, which suppurate.',
      'obligate intracellular bacterium': 'Chlamydia cannot make its own ATP and must live inside cells (elementary and reticulate bodies).',
    },
    x: 'Lymphogranuloma venereum is caused by Chlamydia trachomatis serotypes L1–L3. A small painless ulcer is followed by painful inguinal lymph nodes (buboes) that drain and can scar, causing proctitis and strictures. Doxycycline treats it.',
    hy: ['Chlamydia trachomatis serotypes: A–C trachoma (blindness), D–K urethritis, PID, neonatal conjunctivitis and pneumonia, L1–L3 lymphogranuloma venereum; treat with doxycycline or azithromycin.'],
    lookalikes: {
      mb_syphilis: 'Primary syphilis is a painless chancre with painless (not suppurating) nodes.',
      mb_gonorrhea: 'Gonorrhoea causes purulent urethritis without ulcers or buboes.',
      mb_hsv2: 'Genital herpes gives multiple PAINFUL vesicles and ulcers.',
    },
    vs: 'mb_syphilis',
  },
  {
    id: 'mb_mycoplasma', name: 'Mycoplasma pneumonia', chapter: 'zoo', tag: 'Mycoplasma pneumoniae',
    s: 'A 19-year-old **army recruit** has a low-grade fever and a **dry cough for 3 weeks** but feels well enough to keep training. Chest X-ray looks **worse than he does**, and **cold agglutinins** are present.',
    w: {
      'army recruit': 'Outbreaks spread in close-living young adults such as recruits and students.',
      'dry cough for 3 weeks': 'A mild, prolonged "walking pneumonia" with little sputum.',
      'worse than he does': 'Patchy interstitial infiltrates look more extensive than the mild symptoms suggest.',
      'cold agglutinins': 'IgM antibodies that clump red cells in the cold can cause haemolysis.',
    },
    x: 'Mycoplasma pneumoniae is a tiny bacterium with no cell wall. It causes atypical "walking" pneumonia in young adults, with a long dry cough and patchy infiltrates. Because it has no cell wall, β-lactams do not work; macrolides, doxycycline or fluoroquinolones do.',
    hy: ['Mycoplasma has no cell wall (not seen on Gram stain; resistant to β-lactams) and cholesterol in its membrane; cold agglutinins (IgM) can cause haemolytic anaemia.'],
    lookalikes: {
      mb_pneumococcus: 'Pneumococcal pneumonia is sudden, severe, lobar, with rusty sputum.',
      mb_legionella: 'Legionella is severe pneumonia with diarrhoea, confusion and low sodium in older smokers.',
      mb_influenza: 'Influenza gives sudden fever, aches and cough in winter, sometimes followed by bacterial pneumonia.',
    },
    vs: 'mb_pneumococcus',
  },
];
