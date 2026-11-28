/**
 * HY Diseases · Microbiology — fungi. Case format: see
 * hyd/immuno/immunoCases.js. Original wording.
 */
export default [
  {
    id: 'mb_histoplasma', name: 'Histoplasmosis', chapter: 'fungi', tag: 'Histoplasma capsulatum',
    s: 'A man from **Ohio who cleaned out a bat-filled cave and chicken coop** has fever, cough and hilar lymph nodes. Biopsy shows **tiny yeasts packed inside macrophages**.',
    w: {
      'Ohio who cleaned out a bat-filled cave and chicken coop': 'Histoplasma lives in soil enriched with bird or bat droppings in the Mississippi and Ohio River valleys.',
      'tiny yeasts packed inside macrophages': 'Histoplasma is a small yeast that hides inside macrophages, smaller than a red cell.',
    },
    x: 'Histoplasmosis is caused by inhaling spores of Histoplasma capsulatum from bird or bat droppings. Most infections are mild, but it can cause pneumonia, granulomas that mimic TB, and disseminated disease in AIDS. The yeast lives inside macrophages.',
    hy: ['Endemic fungi: Histoplasma (Mississippi/Ohio valleys, bat and bird droppings, yeast in macrophages), Blastomyces (east of Mississippi, broad-based budding), Coccidioides (southwest US, spherules); treat severe disease with amphotericin B, mild with itraconazole.'],
    lookalikes: {
      mb_tb: 'TB causes upper-lobe cavities with acid-fast rods, not intracellular yeast.',
      mb_blasto: 'Blastomycosis has large yeast with BROAD-based budding and spreads to skin and bone.',
      mb_cocci: 'Coccidioidomycosis comes from the southwest US desert with spherules full of endospores.',
    },
    vs: 'mb_tb',
  },
  {
    id: 'mb_blasto', name: 'Blastomycosis', chapter: 'fungi', tag: 'Blastomyces dermatitidis',
    s: 'A man from **Wisconsin who works in the woods** has pneumonia and **warty, crusted skin lesions** on his face. Biopsy shows **large yeasts with a thick wall and a single broad-based bud**.',
    w: {
      'Wisconsin who works in the woods': 'Blastomyces lives in moist soil and rotting wood east of the Mississippi and around the Great Lakes.',
      'warty, crusted skin lesions': 'It spreads from the lungs to skin (and bone), causing verrucous lesions.',
      'large yeasts with a thick wall and a single broad-based bud': '"Blasto buds broadly": large yeast with a wide-necked bud.',
    },
    x: 'Blastomycosis is caused by inhaling Blastomyces spores from soil and decaying wood. It causes pneumonia and often spreads to skin and bone. In tissue it forms large yeast with a single broad-based bud.',
    hy: ['Blastomyces: east of the Mississippi and Great Lakes; broad-based budding yeast; lung, skin and bone disease.'],
    lookalikes: {
      mb_histoplasma: 'Histoplasma is a SMALL yeast inside macrophages, from bat or bird droppings.',
      mb_paracocci: 'Paracoccidioidomycosis has a yeast with many buds ("captain\'s wheel") in Latin America.',
      mb_cocci: 'Coccidioidomycosis shows spherules with endospores in the southwest US.',
    },
    vs: 'mb_paracocci',
  },
  {
    id: 'mb_cocci', name: 'Coccidioidomycosis', chapter: 'fungi', tag: 'Coccidioides immitis',
    s: 'Two weeks after a **dust storm in Arizona**, a woman has cough, fever and **tender red nodules on her shins**. Biopsy shows **large spherules filled with endospores**.',
    w: {
      'dust storm in Arizona': 'Coccidioides lives in desert soil in the southwestern US; dust and earthquakes spread spores.',
      'tender red nodules on her shins': 'Erythema nodosum ("desert bumps") is a hypersensitivity reaction to the infection.',
      'large spherules filled with endospores': 'In tissue, Coccidioides forms large spherules packed with endospores.',
    },
    x: 'Coccidioidomycosis ("valley fever") comes from inhaling arthroconidia from desert soil in the southwest US. It often causes pneumonia with erythema nodosum and arthralgias ("desert rheumatism"). It can spread to skin, bone and meninges.',
    hy: ['Coccidioides: southwest US and California, spherules with endospores, erythema nodosum and arthralgias; can disseminate to meninges.'],
    lookalikes: {
      mb_histoplasma: 'Histoplasma is a small yeast inside macrophages, in the Ohio and Mississippi valleys.',
      mb_blasto: 'Blastomyces is a broad-based budding yeast in the Great Lakes region.',
      mb_tb: 'TB causes upper-lobe cavities with acid-fast rods.',
    },
    vs: 'mb_histoplasma',
  },
  {
    id: 'mb_paracocci', name: 'Paracoccidioidomycosis', chapter: 'fungi', tag: 'Paracoccidioides brasiliensis',
    s: 'A **Brazilian farm worker** has chronic cough and **painful ulcers in his mouth**. Biopsy shows **yeast with many small buds around it, like a ship\'s wheel**.',
    w: {
      'Brazilian farm worker': 'Paracoccidioides is endemic to rural Latin America.',
      'painful ulcers in his mouth': 'It commonly spreads to the mouth and nose mucosa.',
      'yeast with many small buds around it, like a ship\'s wheel': 'Multiple budding gives a "captain\'s wheel" look.',
    },
    x: 'Paracoccidioidomycosis is an endemic fungal infection of Latin America, inhaled from soil. It causes chronic lung disease and mucosal ulcers of the mouth and nose. The yeast has many buds around it like a ship\'s wheel.',
    hy: ['Paracoccidioides: Latin America, "captain\'s wheel" yeast with multiple buds.'],
    lookalikes: {
      mb_blasto: 'Blastomyces has a SINGLE broad-based bud, in North America.',
      mb_histoplasma: 'Histoplasma is a small intracellular yeast in the Ohio and Mississippi valleys.',
      mb_candida: 'Candida causes thrush that scrapes off, with pseudohyphae.',
    },
    vs: 'mb_blasto',
  },
  {
    id: 'mb_candida', name: 'Vulvovaginal candidiasis', chapter: 'fungi', tag: 'Candida albicans',
    s: 'A woman with **diabetes who has just finished antibiotics** has intense vulvar itching and a **thick, white, "cottage cheese" discharge**. Vaginal pH is normal, and KOH prep shows **budding yeast with pseudohyphae**.',
    w: {
      'diabetes who has just finished antibiotics': 'Antibiotics kill protective lactobacilli and high glucose feeds the yeast.',
      'thick, white, "cottage cheese" discharge': 'Typical of candidal vaginitis, with itching and redness.',
      'budding yeast with pseudohyphae': 'Candida forms pseudohyphae and germ tubes at 37 °C.',
    },
    x: 'Candida albicans is normal flora that overgrows when the balance is upset (antibiotics, diabetes, pregnancy, immunosuppression). It causes vaginitis, oral thrush, oesophagitis and, in neutropenic or catheterised patients, invasive infection.',
    hy: ['Candida: pseudohyphae and germ tubes at 37 °C; thrush, vaginitis, oesophagitis (AIDS), endocarditis in IV drug users; treat vaginal infection with fluconazole.'],
    lookalikes: {
      mb_gardnerella: 'Bacterial vaginosis gives thin grey fishy discharge without itching, with clue cells and pH >4.5.',
      mb_trichomonas: 'Trichomoniasis gives frothy yellow-green discharge with a strawberry cervix.',
      mb_aspergillus: 'Aspergillus is a mould with acute-angle septate hyphae, invading the lungs.',
    },
    vs: 'mb_gardnerella',
  },
  {
    id: 'mb_aspergillus', name: 'Invasive aspergillosis', chapter: 'fungi', tag: 'Aspergillus fumigatus',
    s: 'A man with **leukaemia and a neutrophil count near zero** after chemotherapy has fever and haemoptysis. CT shows a lung nodule with a **halo of bleeding**. Biopsy shows **thin hyphae with walls, branching at sharp (45°) angles**.',
    w: {
      'leukaemia and a neutrophil count near zero': 'Neutrophils are the main defence against moulds, so neutropenia lets Aspergillus invade.',
      'halo of bleeding': 'The fungus invades blood vessels, causing infarcts and bleeding around the nodule (halo sign).',
      'thin hyphae with walls, branching at sharp (45°) angles': 'Aspergillus has septate hyphae with acute-angle branching.',
    },
    x: 'Aspergillus fumigatus is an inhaled mould. In neutropenic patients it invades lung blood vessels, causing haemorrhagic infarcts. It also causes allergic bronchopulmonary aspergillosis in asthma and CF, and aspergillomas in old lung cavities.',
    hy: ['Aspergillus: septate hyphae at acute (45°) angles; invasive disease in neutropenia, ABPA in asthma and CF, aspergilloma in old TB cavities; treat invasive disease with voriconazole.'],
    lookalikes: {
      mb_mucor: 'Mucor has WIDE, non-septate hyphae branching at right angles, attacking sinuses in diabetic ketoacidosis.',
      mb_candida: 'Candida is a yeast with pseudohyphae.',
      mb_nocardia: 'Nocardia is a branching acid-fast bacterium, not a fungus.',
    },
    vs: 'mb_mucor',
  },
  {
    id: 'mb_cryptococcus', name: 'Cryptococcal meningitis', chapter: 'fungi', tag: 'Cryptococcus neoformans',
    s: 'A man with **AIDS (CD4 count 40)** has weeks of headache and confusion. **CSF opening pressure is very high**, and **India ink shows yeast with a thick clear capsule**. He keeps **pigeons**.',
    w: {
      'AIDS (CD4 count 40)': 'Cryptococcal meningitis occurs when CD4 falls below about 100.',
      'CSF opening pressure is very high': 'The capsule clogs the arachnoid villi, blocking CSF drainage and raising pressure.',
      'India ink shows yeast with a thick clear capsule': 'The polysaccharide capsule shows as a clear halo against the ink.',
      'pigeons': 'Cryptococcus lives in soil and pigeon droppings.',
    },
    x: 'Cryptococcus neoformans is an encapsulated yeast from pigeon droppings and soil. In people with AIDS it causes a slow meningitis with very high CSF pressure. The capsule is seen with India ink and detected by latex agglutination (capsular antigen).',
    hy: ['Cryptococcus: India ink, mucicarmine stain, capsular antigen; "soap bubble" lesions in the brain; treat with amphotericin B plus flucytosine, then fluconazole.'],
    lookalikes: {
      mb_toxoplasma: 'Toxoplasmosis in AIDS causes ring-enhancing brain lesions, not meningitis.',
      mb_pml: 'PML gives focal deficits from white matter lesions without meningitis.',
      mb_histoplasma: 'Histoplasma is a small yeast inside macrophages, usually lung disease.',
    },
    vs: 'mb_toxoplasma',
  },
  {
    id: 'mb_mucor', name: 'Mucormycosis', chapter: 'fungi', tag: 'Mucor and Rhizopus',
    s: 'A man in **diabetic ketoacidosis** has facial pain, headache and a **black, dead patch on his palate and nasal turbinates**. Biopsy shows **wide, ribbon-like hyphae without cross-walls branching at right angles**.',
    w: {
      'diabetic ketoacidosis': 'High glucose, acidosis and free iron help the fungus grow and weaken neutrophils.',
      'black, dead patch on his palate and nasal turbinates': 'The mould invades blood vessels, causing tissue infarction (necrosis).',
      'wide, ribbon-like hyphae without cross-walls branching at right angles': 'Mucor and Rhizopus have broad non-septate hyphae with wide-angle branching.',
    },
    x: 'Mucormycosis is caused by moulds such as Mucor and Rhizopus. In diabetic ketoacidosis or neutropenia, it invades from the sinuses into blood vessels, the eye and the brain, causing black necrotic tissue. It needs urgent surgery and amphotericin B.',
    hy: ['Mucormycosis: DKA, neutropenia and iron overload; non-septate hyphae at 90°; rhinocerebral spread; treat with surgical debridement and amphotericin B.'],
    lookalikes: {
      mb_aspergillus: 'Aspergillus has thin septate hyphae at ACUTE angles, invading the lungs in neutropenia.',
      mb_pseudomonas: 'Malignant otitis externa is a Pseudomonas infection of the ear canal in diabetics.',
      mb_anthrax: 'Cutaneous anthrax gives a painless black eschar on the skin after animal products.',
    },
    vs: 'mb_aspergillus',
  },
  {
    id: 'mb_pcp', name: 'Pneumocystis pneumonia', chapter: 'fungi', tag: 'Pneumocystis jirovecii',
    s: 'A man with **untreated HIV (CD4 count 120)** has weeks of **dry cough and breathlessness that worsens on walking**, with low oxygen levels. Chest X-ray shows **diffuse "ground-glass" changes** in both lungs. Silver stain shows **disc-shaped cysts**.',
    w: {
      'untreated HIV (CD4 count 120)': 'PCP occurs when CD4 falls below 200.',
      'dry cough and breathlessness that worsens on walking': 'The organism fills the alveoli, impairing gas exchange, especially with exertion.',
      'diffuse "ground-glass" changes': 'Interstitial and alveolar involvement on both sides.',
      'disc-shaped cysts': 'Pneumocystis cysts stain with methenamine silver.',
    },
    x: 'Pneumocystis jirovecii is a yeast-like fungus that causes pneumonia in people with HIV (CD4 below 200) and other immunosuppression. It causes a slowly worsening dry cough, breathlessness and low oxygen with diffuse ground-glass changes. TMP-SMX treats and prevents it.',
    hy: ['PCP: start TMP-SMX prophylaxis when CD4 <200; add steroids if severe hypoxaemia; dapsone or atovaquone if allergic to sulfa.'],
    lookalikes: {
      mb_cryptococcus: 'Cryptococcus causes meningitis with high CSF pressure in AIDS.',
      mb_tb: 'TB causes upper-lobe cavities, night sweats and haemoptysis.',
      mb_histoplasma: 'Histoplasmosis causes pneumonia after bat or bird droppings, with yeast in macrophages.',
    },
    vs: 'mb_tb',
  },
  {
    id: 'mb_sporothrix', name: 'Sporotrichosis', chapter: 'fungi', tag: 'Sporothrix schenckii',
    s: 'A **gardener pricked by a rose thorn** develops a small ulcerating bump on her hand, then **a chain of similar nodules running up her forearm**. Culture shows a **cigar-shaped budding yeast** at body temperature.',
    w: {
      'gardener pricked by a rose thorn': 'Sporothrix lives on plants and in soil and enters through a thorn prick ("rose gardener\'s disease").',
      'a chain of similar nodules running up her forearm': 'The fungus spreads along the lymphatic vessels (lymphocutaneous spread).',
      'cigar-shaped budding yeast': 'Sporothrix is dimorphic: a cigar-shaped yeast in tissue.',
    },
    x: 'Sporotrichosis is caused by Sporothrix schenckii, a dimorphic fungus on plants and in soil. After a thorn or splinter injury, it forms a nodule that spreads in a chain up the lymphatics. It is treated with itraconazole.',
    hy: ['Sporotrichosis: "rose gardener\'s disease", ascending lymphocutaneous nodules, cigar-shaped yeast; treat with itraconazole or potassium iodide.'],
    lookalikes: {
      mb_cat_scratch: 'Cat scratch disease gives one swollen lymph node after a kitten scratch.',
      mb_tularemia: 'Tularaemia gives an ulcer with big nodes after handling rabbits.',
      mb_actinomyces: 'Actinomycosis gives a jaw abscess with sulfur granules after dental work.',
    },
    vs: 'mb_tularemia',
  },
];
