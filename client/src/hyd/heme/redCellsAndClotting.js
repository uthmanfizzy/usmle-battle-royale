/**
 * HY Diseases · Haematology & Oncology — anaemias, haem synthesis, bleeding
 * and clotting. Case format: see hyd/immuno/immunoCases.js. Original wording.
 */
export default [
  // ── Microcytic and haem synthesis ──────────────────────────────────────
  {
    id: 'hm_iron_def', name: 'Iron deficiency anemia', chapter: 'micro', tag: 'Microcytic, hypochromic',
    s: 'A 34-year-old woman with **very heavy periods** is tired and breathless, and she **craves ice** to chew. Her nails are spoon-shaped. Hb is low with a low MCV; **ferritin is low and TIBC is high**.',
    w: {
      'very heavy periods': 'Every period loses iron in the blood. Over months, losses outpace what the diet replaces, emptying the iron stores.',
      'craves ice': 'Pica (especially for ice, called pagophagia) is a classic, poorly understood symptom of iron deficiency.',
      'ferritin is low and TIBC is high': 'Ferritin is stored iron, so it falls first. The liver makes more transferrin to grab any iron it can, so TIBC rises.',
    },
    x: 'Iron is needed to make haem. When iron stores run out, usually from blood loss, red cells are made smaller and paler than normal. Ferritin falls, transferrin (TIBC) rises and the patient becomes tired, pale and breathless.',
    hy: ['Iron deficiency: low ferritin, high TIBC, low serum iron and transferrin saturation; in an older adult, look for a bleeding colon cancer.', 'Plummer-Vinson syndrome is iron deficiency with oesophageal webs and glossitis.'],
    lookalikes: {
      hm_acd: 'Anaemia of chronic disease has HIGH ferritin and LOW TIBC, because hepcidin locks iron away.',
      hm_beta_thal: 'Beta-thalassaemia trait or disease has a very low MCV with normal or high iron and raised HbA2.',
      hm_sideroblastic: 'Sideroblastic anaemia has HIGH iron and ferritin with ringed sideroblasts in the marrow.',
    },
    vs: 'hm_acd',
  },
  {
    id: 'hm_beta_thal', name: 'Beta-thalassemia major', chapter: 'micro', tag: 'Autosomal recessive (β-globin)',
    s: 'A 9-month-old boy of Greek parents is pale with a big spleen and **prominent cheekbones and forehead**. Hb is very low with a very low MCV and target cells. Electrophoresis shows **almost no HbA and a high HbF**.',
    w: {
      'prominent cheekbones and forehead': 'The marrow expands massively trying to make red cells, widening the skull and facial bones ("chipmunk" face, "crew-cut" skull X-ray).',
      'almost no HbA and a high HbF': 'With no beta chains, adult HbA (α2β2) cannot be made. Gamma chains still pair with alpha, so fetal HbF stays high.',
    },
    x: 'In beta-thalassaemia major, both beta-globin genes make little or no beta chain. Excess alpha chains clump inside red cell precursors and destroy them, so red cell production is ineffective. Symptoms start at around 6 months, when fetal haemoglobin is replaced, with severe anaemia, marrow expansion and a big spleen.',
    hy: ['Beta-thalassaemia major needs lifelong transfusions, which cause iron overload (secondary haemochromatosis) unless chelation is given.', 'Marrow expansion gives a "crew-cut" skull X-ray; parvovirus B19 can trigger an aplastic crisis.'],
    lookalikes: {
      hm_alpha_thal: 'HbH disease (alpha-thalassaemia) has excess beta chains forming β4 tetramers, not high HbF.',
      hm_iron_def: 'Iron deficiency has low ferritin and high TIBC, with normal electrophoresis.',
      hm_sickle: 'Sickle cell disease has HbS on electrophoresis with crescent-shaped cells and pain crises.',
    },
    vs: 'hm_alpha_thal',
  },
  {
    id: 'hm_alpha_thal', name: 'Alpha-thalassemia (HbH disease)', chapter: 'micro', tag: '3 of 4 α-globin genes deleted',
    s: 'A 20-year-old woman of Southeast Asian descent has a moderate microcytic anaemia and a big spleen. Iron studies are normal. Her red cells show **inclusions when stained with brilliant cresyl blue**, and electrophoresis shows **tetramers of beta chains**.',
    w: {
      'inclusions when stained with brilliant cresyl blue': 'Unstable β4 tetramers precipitate inside the red cells and show up as "golf ball" inclusions with this supravital stain.',
      'tetramers of beta chains': 'With only one working alpha gene, extra beta chains have nothing to pair with and join up as β4 (HbH).',
    },
    x: 'Alpha-globin comes from four genes. In HbH disease, three of the four are deleted, so alpha chains are scarce and the extra beta chains form unstable β4 tetramers (HbH). These damage red cells, causing a moderate haemolytic microcytic anaemia.',
    hy: ['Alpha-thalassaemia by genes lost: 1 = silent carrier, 2 = trait (cis deletion more common in Asian, trans in African ancestry), 3 = HbH (β4), 4 = Hb Barts (γ4) with hydrops fetalis.'],
    lookalikes: {
      hm_beta_thal: 'Beta-thalassaemia major lacks beta chains, so HbF is high and HbA almost absent.',
      hm_iron_def: 'Iron deficiency has low ferritin and high TIBC, with normal electrophoresis.',
      hm_hbc: 'HbC disease shows hexagonal haemoglobin crystals and target cells, with a mild normocytic anaemia.',
    },
    vs: 'hm_beta_thal',
  },
  {
    id: 'hm_lead', name: 'Lead poisoning', chapter: 'micro', tag: 'Inhibits ferrochelatase and ALA dehydratase',
    s: 'A 2-year-old boy living in an **old house with peeling paint** has abdominal pain, constipation and is falling behind in speech. He has a microcytic anaemia, and his smear shows **basophilic stippling** of the red cells.',
    w: {
      'old house with peeling paint': 'Old paint contains lead, and toddlers swallow paint chips and dust from hand-to-mouth play.',
      'basophilic stippling': 'Lead blocks the enzyme that breaks down ribosomal RNA, so RNA clumps stay in the red cells as blue dots.',
    },
    x: 'Lead blocks two enzymes of haem synthesis, ALA dehydratase and ferrochelatase, so haem cannot be made properly and a microcytic anaemia develops. It also damages nerves, the gut and the kidneys. Children get abdominal pain, constipation and developmental delay; adults get neuropathy such as wrist or foot drop.',
    hy: ['Lead poisoning: raised ALA and protoporphyrin, ringed sideroblasts in the marrow and basophilic stippling; lead lines on gums and long bones.', 'Chelation: succimer in children; dimercaprol and EDTA for severe poisoning.'],
    lookalikes: {
      hm_sideroblastic: 'Sideroblastic anaemia also has ringed sideroblasts, but from an ALA synthase defect, alcohol or B6 lack, without lead exposure.',
      hm_iron_def: 'Iron deficiency has low ferritin and no basophilic stippling.',
      hm_aip: 'Acute intermittent porphyria gives abdominal pain and neuropathy with port-wine urine, not anaemia.',
    },
    vs: 'hm_sideroblastic',
  },
  {
    id: 'hm_sideroblastic', name: 'Sideroblastic anemia', chapter: 'micro', tag: 'Defective haem synthesis',
    s: 'A 50-year-old man who **drinks heavily** has fatigue and a microcytic anaemia. Unlike iron deficiency, **serum iron and ferritin are high**. A marrow aspirate stained with Prussian blue shows **iron granules forming a ring around red cell nuclei**.',
    w: {
      'drinks heavily': 'Alcohol is a common acquired cause; it interferes with haem synthesis and with vitamin B6, a cofactor for ALA synthase.',
      'serum iron and ferritin are high': 'Iron is plentiful but cannot be built into haem, so it builds up in the body.',
      'iron granules forming a ring around red cell nuclei': 'Unused iron collects in the mitochondria, which sit around the nucleus, forming ringed sideroblasts.',
    },
    x: 'In sideroblastic anaemia, the cell has iron but cannot put it into haem. Iron then piles up in mitochondria around the nucleus, forming ringed sideroblasts. Causes include an inherited X-linked ALA synthase defect, alcohol, lead, isoniazid and copper deficiency.',
    hy: ['Sideroblastic anaemia: high iron, normal or low TIBC and high ferritin; the X-linked form may respond to pyridoxine (B6), the cofactor for ALA synthase.'],
    lookalikes: {
      hm_iron_def: 'Iron deficiency has LOW iron and ferritin with high TIBC.',
      hm_lead: 'Lead poisoning has ringed sideroblasts too, but with basophilic stippling, abdominal pain and neuropathy after lead exposure.',
      hm_acd: 'Anaemia of chronic disease has low serum iron (but high ferritin) and no ringed sideroblasts.',
    },
    vs: 'hm_iron_def',
  },
  {
    id: 'hm_aip', name: 'Acute intermittent porphyria', chapter: 'micro', tag: 'Autosomal dominant (porphobilinogen deaminase)',
    s: 'A 28-year-old woman has **severe abdominal pain with a soft, non-tender abdomen**, weakness in her arms, anxiety and confusion, starting after she began **a strict fasting diet and a seizure drug**. Her urine turns **dark red-brown on standing**.',
    w: {
      'severe abdominal pain with a soft, non-tender abdomen': 'The pain comes from toxic effects on the gut\'s nerves, not inflammation, so the belly is soft despite severe pain.',
      'a strict fasting diet and a seizure drug': 'Fasting and CYP450-inducing drugs (such as phenytoin or barbiturates) switch on ALA synthase, pushing more precursors into the blocked pathway.',
      'dark red-brown on standing': 'Porphobilinogen and other precursors spill into the urine and darken it in light and air ("port-wine" urine).',
    },
    x: 'AIP is a partial lack of porphobilinogen deaminase in haem synthesis. When triggers increase ALA synthase activity, the precursors ALA and porphobilinogen build up and poison nerves. Attacks bring the 5 Ps: painful abdomen, port-wine pee, polyneuropathy, psychological symptoms and precipitation by drugs, alcohol or fasting.',
    hy: ['Treat AIP attacks with hemin and glucose, which switch off ALA synthase; there is no photosensitivity (unlike porphyria cutanea tarda).'],
    lookalikes: {
      hm_pct: 'Porphyria cutanea tarda causes blistering skin on sun-exposed areas, without abdominal pain or neuropathy.',
      hm_lead: 'Lead poisoning gives abdominal pain and neuropathy with a microcytic anaemia and basophilic stippling.',
      hm_sickle: 'Sickle cell pain crises have haemolytic anaemia and sickled cells on the smear.',
    },
    vs: 'hm_pct',
  },
  {
    id: 'hm_pct', name: 'Porphyria cutanea tarda', chapter: 'micro', tag: 'Uroporphyrinogen decarboxylase deficiency',
    s: 'A 52-year-old man with **hepatitis C** who drinks alcohol has **blisters and fragile skin on the backs of his hands** after sun exposure, with darker skin and extra facial hair. His urine is **tea-coloured**.',
    w: {
      'hepatitis C': 'Hepatitis C, alcohol and iron overload lower the activity of uroporphyrinogen decarboxylase in the liver and trigger the disease.',
      'blisters and fragile skin on the backs of his hands': 'Porphyrins collect in the skin and react with sunlight, damaging the skin and making it blister.',
      'tea-coloured': 'Excess uroporphyrin is passed in the urine and colours it.',
    },
    x: 'Porphyria cutanea tarda is a lack of uroporphyrinogen decarboxylase, the most common porphyria. Uroporphyrin builds up and makes the skin sensitive to light, causing blisters, scarring and pigment change on sun-exposed areas. Alcohol, hepatitis C, iron and oestrogens bring it out.',
    hy: ['Porphyria cutanea tarda is the most common porphyria; treat with phlebotomy, sun avoidance and low-dose hydroxychloroquine.'],
    lookalikes: {
      hm_aip: 'Acute intermittent porphyria gives abdominal pain, neuropathy and psychiatric symptoms without skin blisters.',
      hm_lead: 'Lead poisoning gives abdominal pain, neuropathy and anaemia, without photosensitive blisters.',
      hm_iron_poison: 'Iron poisoning in a child causes vomiting, GI bleeding and metabolic acidosis after swallowing tablets.',
    },
    vs: 'hm_aip',
  },
  {
    id: 'hm_iron_poison', name: 'Acute iron poisoning', chapter: 'micro', tag: 'Free radical injury',
    s: 'A 3-year-old girl swallowed a handful of her mother\'s **pregnancy vitamins that look like sweets**. Two hours later she has vomiting, abdominal pain and **bloody stools**. An abdominal X-ray shows **radiopaque pills**, and she develops an anion gap acidosis.',
    w: {
      'pregnancy vitamins that look like sweets': 'Prenatal tablets are rich in iron and brightly coated, so they are a common accidental poisoning in children.',
      'bloody stools': 'Free iron makes free radicals that directly corrode the stomach and gut lining.',
      'radiopaque pills': 'Iron is dense and shows up on X-ray, helping confirm the ingestion.',
    },
    x: 'Large doses of iron overwhelm the body\'s binding proteins. Free iron produces free radicals and damages cell membranes, first in the gut and then in the liver and other organs. Children get vomiting and GI bleeding, then shock, metabolic acidosis and multi-organ failure; scarring can later block the gut.',
    hy: ['Treat acute iron poisoning with chelation using deferoxamine (and supportive care); chronic iron overload is treated with phlebotomy or chelation.'],
    lookalikes: {
      hm_lead: 'Lead poisoning is a slow, chronic exposure with anaemia, basophilic stippling and developmental delay.',
      hm_pct: 'Porphyria cutanea tarda causes blistering skin in adults, often with iron overload but not acute poisoning.',
      hm_hus: 'HUS gives bloody diarrhoea with low platelets, haemolysis and kidney failure after E coli.',
    },
    vs: 'hm_lead',
  },

  // ── Normocytic, haemolytic and marrow ──────────────────────────────────
  {
    id: 'hm_acd', name: 'Anemia of chronic disease', chapter: 'hemolytic', tag: 'Hepcidin-mediated iron block',
    s: 'A 60-year-old woman with **long-standing rheumatoid arthritis** has a mild normocytic anaemia. **Serum iron and TIBC are low, but ferritin is high**.',
    w: {
      'long-standing rheumatoid arthritis': 'Chronic inflammation raises IL-6, which makes the liver produce hepcidin.',
      'Serum iron and TIBC are low, but ferritin is high': 'Hepcidin traps iron inside macrophages (ferritin stays high) and blocks gut absorption, so little iron reaches the blood.',
    },
    x: 'In chronic inflammation, IL-6 makes the liver release hepcidin. Hepcidin blocks ferroportin, the iron exit channel, so iron is locked inside macrophages and gut cells. Red cell production slows, giving a mild normocytic (sometimes microcytic) anaemia despite plenty of stored iron.',
    hy: ['Anaemia of chronic disease: low iron, low TIBC, HIGH ferritin; treat the cause, and EPO can help in chronic kidney disease.'],
    lookalikes: {
      hm_iron_def: 'Iron deficiency has LOW ferritin and HIGH TIBC.',
      hm_sideroblastic: 'Sideroblastic anaemia has HIGH serum iron and ringed sideroblasts in the marrow.',
      hm_aplastic: 'Aplastic anaemia drops ALL blood counts, with an empty, fatty marrow.',
    },
    vs: 'hm_iron_def',
  },
  {
    id: 'hm_aplastic', name: 'Aplastic anemia', chapter: 'hemolytic', tag: 'Stem cell failure',
    s: 'Three months after **treatment with chloramphenicol**, a 24-year-old man has fatigue, gum bleeding and recurrent infections. **All three blood counts are low** with normal cell shapes, and the marrow is **mostly fat with few blood-forming cells**.',
    w: {
      'treatment with chloramphenicol': 'Some drugs (chloramphenicol, benzene, alkylating agents) damage or trigger an immune attack on the marrow stem cells.',
      'All three blood counts are low': 'Stem cells make red cells, white cells and platelets, so losing them lowers all three (pancytopenia).',
      'mostly fat with few blood-forming cells': 'When stem cells die, the empty marrow space fills with fat.',
    },
    x: 'Aplastic anaemia is failure or destruction of the marrow\'s stem cells. Without them, red cells, white cells and platelets all fall, causing tiredness, infections and bleeding. Causes include radiation, viruses, drugs, Fanconi anaemia and immune attack.',
    hy: ['Aplastic anaemia causes pancytopenia with a hypocellular, fatty marrow; treat with withdrawal of the cause, immunosuppression (antithymocyte globulin, cyclosporine) or a marrow transplant.'],
    lookalikes: {
      hm_fanconi: 'Fanconi anaemia is an inherited marrow failure in a child with short stature, café-au-lait spots and thumb defects.',
      hm_mds: 'Myelodysplastic syndrome has low counts with a FULL marrow of abnormal-looking cells.',
      hm_hairy: 'Hairy cell leukaemia also causes pancytopenia, but with a huge spleen and hair-like B cells.',
    },
    vs: 'hm_mds',
  },
  {
    id: 'hm_fanconi', name: 'Fanconi anemia', chapter: 'hemolytic', tag: 'Autosomal recessive DNA repair defect',
    s: 'A 7-year-old boy is **short for his age**, has **café-au-lait spots** and an **underdeveloped thumb** on one hand. He now has bruising and pallor, with low red cells, white cells and platelets.',
    w: {
      'short for his age': 'The DNA repair defect affects growth in many tissues, so children are often small.',
      'café-au-lait spots': 'Patchy pigment changes in the skin are a common associated finding.',
      'underdeveloped thumb': 'Thumb and radius defects come from abnormal limb development, a classic clue.',
    },
    x: 'Fanconi anaemia is an inherited defect in the repair of DNA cross-links. Cells, especially marrow stem cells, die easily, so the marrow fails in childhood. Children have short stature, skin and thumb or radius changes, and a high risk of leukaemia and other cancers.',
    hy: ['Fanconi anaemia is an autosomal recessive DNA cross-link repair defect causing aplastic anaemia, with normocytic or macrocytic red cells and a predisposition to cancer.'],
    lookalikes: {
      hm_aplastic: 'Acquired aplastic anaemia has no birth defects and follows drugs, viruses or radiation.',
      hm_all: 'ALL also lowers blood counts in a child, but the marrow is packed with lymphoblasts.',
      hm_itp: 'ITP lowers only platelets, in a child who is otherwise well after a virus.',
    },
    vs: 'hm_aplastic',
  },
  {
    id: 'hm_spherocytosis', name: 'Hereditary spherocytosis', chapter: 'hemolytic', tag: 'Autosomal dominant (membrane skeleton)',
    s: 'A 10-year-old girl has mild jaundice, a big spleen and **gallstones**; her father had his spleen removed. Her smear shows **small round red cells with no central pallor**, MCHC is high, and an **osmotic fragility test is abnormal**.',
    w: {
      'gallstones': 'Constant red cell breakdown produces lots of bilirubin, which forms pigment gallstones at a young age.',
      'small round red cells with no central pallor': 'A weak membrane skeleton (spectrin, ankyrin, band 3) means bits of membrane are lost, so the cell rounds up into a sphere.',
      'osmotic fragility test is abnormal': 'Spheres have little spare membrane, so they burst quickly when placed in dilute salt solution.',
    },
    x: 'Hereditary spherocytosis is a defect in proteins that link the red cell membrane to its skeleton. The cells lose membrane, become small spheres and get trapped and destroyed in the spleen. This causes anaemia, jaundice, a big spleen and pigment gallstones.',
    hy: ['Hereditary spherocytosis: high MCHC, abnormal EMA binding test and osmotic fragility; parvovirus B19 can cause an aplastic crisis; splenectomy is curative for the anaemia.'],
    lookalikes: {
      hm_warm_aiha: 'Warm autoimmune haemolysis also shows spherocytes, but the direct Coombs test is POSITIVE and there is no family history.',
      hm_sickle: 'Sickle cell disease shows crescent cells and pain crises, and the spleen shrinks with age.',
      hm_hbc: 'HbC disease shows target cells and hexagonal crystals.',
    },
    vs: 'hm_warm_aiha',
  },
  {
    id: 'hm_sickle', name: 'Sickle cell anemia', chapter: 'hemolytic', tag: 'Autosomal recessive (Glu→Val in β-globin)',
    s: 'A 6-year-old boy of West African descent has **painful swelling of his hands and feet**, repeated pain crises and now **fever with osteomyelitis from Salmonella**. His smear shows **crescent-shaped red cells and Howell-Jolly bodies**.',
    w: {
      'painful swelling of his hands and feet': 'Sickled cells block small vessels in the finger and toe bones (dactylitis), often the first crisis in young children.',
      'fever with osteomyelitis from Salmonella': 'Repeated infarcts destroy the spleen and damaged bone is easily seeded, so Salmonella osteomyelitis is classic.',
      'crescent-shaped red cells and Howell-Jolly bodies': 'HbS polymerises when deoxygenated, bending cells into crescents; Howell-Jolly bodies remain because the spleen has infarcted (autosplenectomy).',
    },
    x: 'A single point mutation (glutamic acid to valine) in beta-globin makes HbS. When oxygen is low, HbS polymerises and the red cells sickle, block small vessels and are destroyed early. This causes haemolytic anaemia, pain crises, organ infarcts and a spleen that is lost early in life.',
    hy: ['Sickle complications: acute chest syndrome (a common cause of death), stroke, avascular necrosis, priapism, renal papillary necrosis and aplastic crisis with parvovirus B19.', 'Hydroxyurea raises HbF and reduces crises; sickle trait protects against malaria.'],
    lookalikes: {
      hm_hbc: 'HbC disease (Glu→Lys) gives a milder anaemia with target cells and crystals, without vaso-occlusive crises.',
      hm_spherocytosis: 'Hereditary spherocytosis gives spherocytes and a BIG spleen, without vaso-occlusion.',
      hm_beta_thal: 'Beta-thalassaemia major shows target cells and very high HbF with no HbS.',
    },
    vs: 'hm_hbc',
  },
  {
    id: 'hm_hbc', name: 'HbC disease', chapter: 'hemolytic', tag: 'Autosomal recessive (Glu→Lys in β-globin)',
    s: 'A 30-year-old man of West African descent has a mild anaemia, mild jaundice and a slightly big spleen, but **has never had a pain crisis**. His smear shows many **target cells** and **hexagonal crystals inside the red cells**.',
    w: {
      'has never had a pain crisis': 'HbC does not polymerise into long fibres like HbS, so cells do not sickle and block vessels.',
      'target cells': 'HbC cells lose water and become stiff, leaving haemoglobin pooled in the centre: a target appearance.',
      'hexagonal crystals inside the red cells': 'HbC crystallises when the cells dehydrate, forming rod or hexagonal crystals.',
    },
    x: 'In HbC disease, glutamic acid in beta-globin is replaced by lysine. The abnormal haemoglobin crystallises inside red cells, which are then removed by the spleen. The result is a mild extravascular haemolysis with target cells and crystals, but no sickling.',
    hy: ['HbC is a glutamic acid-to-lysine mutation; HbSC (one of each gene) is milder than HbSS sickle cell disease.'],
    lookalikes: {
      hm_sickle: 'Sickle cell disease (Glu→Val) has crescent cells, pain crises and autosplenectomy.',
      hm_alpha_thal: 'HbH disease has a microcytic anaemia with β4 tetramers and "golf ball" inclusions.',
      hm_spherocytosis: 'Hereditary spherocytosis shows spherocytes and abnormal osmotic fragility, not target cells and crystals.',
    },
    vs: 'hm_sickle',
  },
  {
    id: 'hm_warm_aiha', name: 'Warm autoimmune hemolytic anemia', chapter: 'hemolytic', tag: 'IgG, extravascular',
    s: 'A 35-year-old woman with **lupus** has fatigue and jaundice. Her smear shows **spherocytes**, LDH is high, haptoglobin is low, and the **direct Coombs test is positive for IgG**.',
    w: {
      'lupus': 'Autoimmune diseases such as SLE (as well as CLL and drugs like methyldopa) cause warm autoimmune haemolysis.',
      'spherocytes': 'Splenic macrophages nibble off IgG-coated membrane, so the cells round up into spheres.',
      'direct Coombs test is positive for IgG': 'The test detects antibody already stuck to the patient\'s red cells.',
    },
    x: 'In warm AIHA, IgG antibodies coat red cells at body temperature. Macrophages in the spleen remove parts or all of the coated cells (extravascular haemolysis), leaving spherocytes. It is often idiopathic or linked to SLE, CLL or certain drugs.',
    hy: ['Warm AIHA is IgG-mediated, Coombs-positive extravascular haemolysis; treat with glucocorticoids, rituximab or splenectomy.'],
    lookalikes: {
      hm_cold_aiha: 'Cold agglutinin disease is IgM at cold temperatures, with blue fingers in the cold and red cell clumps after Mycoplasma or EBV.',
      hm_spherocytosis: 'Hereditary spherocytosis also has spherocytes, but the Coombs test is NEGATIVE and it runs in families.',
      hm_ttp: 'TTP has schistocytes, low platelets, fever and neurological signs with a negative Coombs test.',
    },
    vs: 'hm_cold_aiha',
  },
  {
    id: 'hm_cold_aiha', name: 'Cold agglutinin disease', chapter: 'hemolytic', tag: 'IgM, complement-mediated',
    s: 'Two weeks after a **Mycoplasma pneumonia**, a 22-year-old student has anaemia, and his **fingers, ears and nose turn blue in the cold**. The smear shows **red cells clumped together**, and the Coombs test is positive for complement (C3).',
    w: {
      'Mycoplasma pneumonia': 'The immune response to Mycoplasma (or EBV) can make IgM that cross-reacts with red cell antigens.',
      'fingers, ears and nose turn blue in the cold': 'The IgM binds red cells in the cooler extremities, making them clump and block small vessels.',
      'red cells clumped together': 'IgM is a large pentamer that links many red cells together (agglutination).',
    },
    x: 'In cold agglutinin disease, IgM antibodies bind red cells in the cold parts of the body and fix complement. The cells clump and are destroyed, partly in the vessels and partly in the liver. It follows Mycoplasma or EBV infection, or comes with lymphomas such as CLL or Waldenström.',
    hy: ['Cold AIHA is IgM and complement on red cells at low temperatures; triggers include Mycoplasma pneumoniae, infectious mononucleosis and CLL.'],
    lookalikes: {
      hm_warm_aiha: 'Warm AIHA is IgG at body temperature, giving spherocytes without cold-induced symptoms.',
      hm_waldenstrom: 'Waldenström macroglobulinaemia makes monoclonal IgM with hyperviscosity in an older adult.',
      hm_hdn: 'Haemolytic disease of the newborn is maternal IgG crossing the placenta into the baby.',
    },
    vs: 'hm_warm_aiha',
  },
  {
    id: 'hm_hdn', name: 'Hemolytic disease of the newborn', chapter: 'hemolytic', tag: 'Type II hypersensitivity (maternal IgG)',
    s: 'A **Rh-negative woman** in her second pregnancy **received no anti-D injection** after her first delivery. Her baby is born swollen with fluid, severely anaemic and quickly jaundiced. The **baby\'s direct Coombs test is positive**.',
    w: {
      'Rh-negative woman': 'An Rh-negative mother can make antibodies against an Rh-positive baby\'s red cells.',
      'received no anti-D injection': 'Anti-D (RhoGAM) clears the baby\'s Rh-positive cells from the mother\'s blood before she can be sensitised.',
      'baby\'s direct Coombs test is positive': 'Maternal IgG crossed the placenta and is now coating the baby\'s red cells.',
    },
    x: 'At the first delivery, fetal Rh-positive cells enter the Rh-negative mother\'s blood and she makes anti-D antibodies. In the next Rh-positive pregnancy, her IgG crosses the placenta and destroys the baby\'s red cells. The baby can develop severe anaemia, heart failure with oedema (hydrops fetalis) and jaundice.',
    hy: ['Give anti-D immunoglobulin (RhoGAM) to Rh-negative mothers at around 28 weeks and after delivery of an Rh-positive baby.', 'ABO haemolytic disease (an O mother with an A or B baby) can occur in a first pregnancy and is usually mild.'],
    lookalikes: {
      hm_cold_aiha: 'Cold agglutinin disease is the patient\'s own IgM after Mycoplasma or EBV, not maternal antibody.',
      hm_spherocytosis: 'Hereditary spherocytosis causes newborn jaundice too, but is Coombs-negative and runs in the family.',
      hm_beta_thal: 'Beta-thalassaemia major appears after 6 months, when HbF falls, not at birth.',
    },
    vs: 'hm_spherocytosis',
  },

  // ── Bleeding and clotting ──────────────────────────────────────────────
  {
    id: 'hm_hemophilia_a', name: 'Hemophilia A', chapter: 'bleed', tag: 'X-linked recessive (factor VIII)',
    s: 'A 2-year-old boy has a **swollen, painful knee after a minor fall** and bled for days after a tooth injury. His maternal uncle had the same. **PTT is prolonged**, while PT, platelet count and bleeding time are normal.',
    w: {
      'swollen, painful knee after a minor fall': 'Clotting factor defects cause deep bleeds into joints and muscles (haemarthrosis), unlike the skin bleeds of platelet problems.',
      'PTT is prolonged': 'Factor VIII is part of the intrinsic pathway, which the PTT measures; PT tests the extrinsic pathway and stays normal.',
    },
    x: 'Haemophilia A is a lack of clotting factor VIII, inherited on the X chromosome. The platelet plug forms, but the clotting cascade cannot make enough fibrin to secure it. Boys get deep bleeding into joints and muscles and prolonged bleeding after injury.',
    hy: ['Haemophilia A (factor VIII), B (factor IX) and C (factor XI) all prolong the PTT; treat A with factor VIII concentrate or desmopressin in mild cases, and emicizumab.'],
    lookalikes: {
      hm_vwd: 'Von Willebrand disease gives mucosal bleeding (nosebleeds, heavy periods) with a long BLEEDING TIME, and affects both sexes.',
      hm_dic: 'DIC prolongs PT and PTT with low platelets and fibrinogen in a very sick patient.',
      hm_glanzmann: 'Glanzmann thrombasthenia gives mucosal bleeding with a long bleeding time and normal PTT.',
    },
    vs: 'hm_vwd',
  },
  {
    id: 'hm_vwd', name: 'von Willebrand disease', chapter: 'bleed', tag: 'Usually autosomal dominant',
    s: 'A 16-year-old girl has **very heavy periods** and frequent **nosebleeds**; her father bleeds easily too. Platelet count is normal, but **bleeding time is prolonged and PTT is mildly prolonged**.',
    w: {
      'very heavy periods': 'Lack of vWF weakens the platelet plug, so mucosal surfaces such as the uterus and nose bleed.',
      'nosebleeds': 'Mucosal bleeding is the signature of a platelet-adhesion problem.',
      'bleeding time is prolonged and PTT is mildly prolonged': 'vWF glues platelets to damaged vessel walls (bleeding time) and protects factor VIII from breakdown (PTT).',
    },
    x: 'Von Willebrand factor does two jobs: it sticks platelets to exposed collagen and it carries and protects factor VIII. When it is low or faulty, platelets cannot adhere well and factor VIII levels fall. It is the most common inherited bleeding disorder, usually mild, causing nosebleeds and heavy periods.',
    hy: ['Von Willebrand disease: prolonged bleeding time with normal platelets and a normal or prolonged PTT; ristocetin cofactor test is abnormal.', 'Treat with desmopressin, which releases vWF stored in endothelial cells, or vWF concentrate.'],
    lookalikes: {
      hm_hemophilia_a: 'Haemophilia A is boys with deep joint bleeds, a long PTT and a NORMAL bleeding time.',
      hm_bernard: 'Bernard-Soulier also has a long bleeding time, but with low, GIANT platelets.',
      hm_itp: 'ITP gives mucosal bleeding with a LOW platelet count.',
    },
    vs: 'hm_hemophilia_a',
  },
  {
    id: 'hm_itp', name: 'Immune thrombocytopenia', chapter: 'bleed', tag: 'Anti-GpIIb/IIIa antibodies',
    s: 'Two weeks after a cold, a 5-year-old girl develops **tiny red spots on her legs** and bleeding gums. She is otherwise well, with no big spleen. **Platelets are 12,000** but other counts are normal, and the marrow shows **plenty of megakaryocytes**.',
    w: {
      'tiny red spots on her legs': 'Petechiae are pinpoint skin bleeds from tiny capillaries when platelets are very low.',
      'Platelets are 12,000': 'Antibodies coat platelets and the spleen removes them, so the count falls while other cells are untouched.',
      'plenty of megakaryocytes': 'The marrow is working hard to replace the destroyed platelets, so their parent cells increase.',
    },
    x: 'In ITP, antibodies (usually against GpIIb/IIIa) coat platelets, and macrophages in the spleen remove them. The marrow makes more, but not enough. It often follows a viral illness in children; in adults it can be chronic or linked to SLE, HIV, HCV or CLL.',
    hy: ['ITP is isolated thrombocytopenia with increased megakaryocytes; treat with glucocorticoids, IVIG, rituximab, TPO receptor agonists (eltrombopag, romiplostim) or splenectomy if refractory.'],
    lookalikes: {
      hm_ttp: 'TTP has low platelets PLUS haemolysis with schistocytes, fever, confusion and kidney injury.',
      hm_hus: 'HUS has low platelets with haemolysis and kidney failure after bloody diarrhoea.',
      hm_all: 'ALL lowers platelets too, but with anaemia, fever, bone pain and blasts in the blood.',
    },
    vs: 'hm_ttp',
  },
  {
    id: 'hm_ttp', name: 'Thrombotic thrombocytopenic purpura', chapter: 'bleed', tag: 'ADAMTS13 deficiency',
    s: 'A 32-year-old woman has fever, **confusion** and bruising. She has low platelets and anaemia with **schistocytes** on the smear, a raised creatinine, and **normal PT and PTT**.',
    w: {
      'confusion': 'Platelet microthrombi block small vessels in the brain, causing neurological symptoms.',
      'schistocytes': 'Red cells are sliced as they squeeze past platelet clots in small vessels, leaving fragments.',
      'normal PT and PTT': 'Only platelets are clumping; the clotting factor cascade is not being used up, which separates it from DIC.',
    },
    x: 'ADAMTS13 normally cuts large von Willebrand factor multimers into smaller pieces. In TTP it is missing, often from an autoantibody, so huge vWF multimers make platelets clump in small vessels. Platelets are used up and red cells are shredded, damaging the brain and kidneys.',
    hy: ['TTP and HUS share the triad of thrombocytopenia, microangiopathic haemolytic anaemia and acute kidney injury; TTP adds fever and neurological symptoms.', 'Treat TTP urgently with plasma exchange, glucocorticoids and rituximab.'],
    lookalikes: {
      hm_hus: 'HUS is usually a child with bloody diarrhoea from Shiga toxin-producing E coli, with kidney failure.',
      hm_dic: 'DIC has prolonged PT and PTT and low fibrinogen, because clotting factors are consumed.',
      hm_itp: 'ITP has low platelets alone, without haemolysis or organ damage.',
    },
    vs: 'hm_hus',
  },
  {
    id: 'hm_hus', name: 'Hemolytic-uremic syndrome', chapter: 'bleed', tag: 'Shiga toxin (E coli O157:H7)',
    s: 'A week after **bloody diarrhoea following an undercooked burger**, a 4-year-old boy is pale and **passing very little urine**. He has low platelets, anaemia with schistocytes and a high creatinine. PT and PTT are normal.',
    w: {
      'bloody diarrhoea following an undercooked burger': 'Undercooked beef can carry Shiga toxin-producing E coli O157:H7, which damages gut and then vessel linings.',
      'passing very little urine': 'The toxin injures the kidney\'s capillaries, which fill with microthrombi, causing acute kidney failure.',
    },
    x: 'Shiga toxin from E coli O157:H7 damages the lining of small vessels, especially in the kidney. Platelets clump on the damaged lining, red cells are shredded passing through, and the kidneys fail. It is a common cause of acute kidney injury in children.',
    hy: ['HUS = thrombocytopenia, microangiopathic haemolytic anaemia and acute kidney injury after bloody diarrhoea; management is supportive (antibiotics are avoided in STEC).'],
    lookalikes: {
      hm_ttp: 'TTP is usually an adult woman with fever and neurological signs, from low ADAMTS13.',
      hm_dic: 'DIC prolongs PT and PTT and lowers fibrinogen in a critically ill patient.',
      hm_itp: 'ITP has low platelets after a virus, without haemolysis or kidney failure.',
    },
    vs: 'hm_ttp',
  },
  {
    id: 'hm_bernard', name: 'Bernard-Soulier syndrome', chapter: 'bleed', tag: 'Autosomal recessive (GpIb)',
    s: 'A 12-year-old boy has lifelong nosebleeds and easy bruising. His **platelet count is mildly low and the platelets are huge** on the smear. Bleeding time is prolonged, and platelets **do not clump with ristocetin**, even when normal plasma is added.',
    w: {
      'platelet count is mildly low and the platelets are huge': 'The GpIb defect affects how platelets are made, giving fewer, giant platelets.',
      'do not clump with ristocetin': 'Ristocetin makes vWF bind GpIb. With GpIb missing, the platelets cannot respond, and adding normal vWF does not fix it.',
    },
    x: 'In Bernard-Soulier syndrome, platelets lack GpIb, the receptor that binds von Willebrand factor. Without it they cannot stick to damaged vessel walls, so the first platelet plug fails. Patients have mucosal bleeding, giant platelets and a mildly low count.',
    hy: ['Bernard-Soulier: GpIb defect in platelet-to-vWF ADHESION, with big platelets and low count; Glanzmann is a GpIIb/IIIa defect in AGGREGATION.'],
    lookalikes: {
      hm_glanzmann: 'Glanzmann thrombasthenia has a NORMAL platelet count and size, with no clumping on the smear (GpIIb/IIIa).',
      hm_vwd: 'Von Willebrand disease has normal-sized platelets and a ristocetin test that corrects with normal plasma.',
      hm_itp: 'ITP has a very low count from antibody destruction, without a lifelong history.',
    },
    vs: 'hm_glanzmann',
  },
  {
    id: 'hm_glanzmann', name: 'Glanzmann thrombasthenia', chapter: 'bleed', tag: 'Autosomal recessive (GpIIb/IIIa)',
    s: 'A 6-year-old girl of consanguineous parents has frequent nosebleeds and heavy gum bleeding. Her **platelet count and size are normal**, but bleeding time is long and the smear shows **no platelet clumping**.',
    w: {
      'platelet count and size are normal': 'The platelets are made normally; they just cannot link to each other.',
      'no platelet clumping': 'GpIIb/IIIa binds fibrinogen to bridge platelets together. Without it platelets stay single, even on the smear.',
    },
    x: 'In Glanzmann thrombasthenia, platelets lack the GpIIb/IIIa integrin that binds fibrinogen. Platelets can stick to the vessel wall but cannot link to each other, so the plug never grows. Patients have mucosal bleeding with normal platelet numbers.',
    hy: ['Glanzmann thrombasthenia is a GpIIb/IIIa defect in platelet aggregation; GpIIb/IIIa inhibitors (abciximab, eptifibatide, tirofiban) mimic it.'],
    lookalikes: {
      hm_bernard: 'Bernard-Soulier has LOW, GIANT platelets and a GpIb adhesion defect.',
      hm_vwd: 'Von Willebrand disease has normal platelets that clump, with a long PTT and an abnormal ristocetin test.',
      hm_hemophilia_a: 'Haemophilia A gives joint bleeds with a long PTT and a normal bleeding time.',
    },
    vs: 'hm_bernard',
  },
  {
    id: 'hm_dic', name: 'Disseminated intravascular coagulation', chapter: 'bleed', tag: 'Consumptive coagulopathy',
    s: 'A 28-year-old woman with **placental abruption** starts **oozing from her drip sites** and has bruises. Platelets and **fibrinogen are low**, **PT and PTT are prolonged**, D-dimer is high and the smear shows schistocytes.',
    w: {
      'placental abruption': 'The placenta releases tissue factor into the mother\'s blood, which switches on clotting everywhere at once.',
      'oozing from her drip sites': 'Clotting factors and platelets are used up in tiny clots, so there is nothing left to stop bleeding.',
      'fibrinogen are low': 'Fibrinogen is consumed making fibrin, and fibrin breakdown raises the D-dimer.',
      'PT and PTT are prolonged': 'Many clotting factors are being used up, so both pathways are slowed.',
    },
    x: 'In DIC, a trigger such as sepsis, trauma, obstetric problems or cancer switches on clotting throughout the body. Tiny clots block vessels while platelets and clotting factors are used up, so the patient both clots and bleeds. PT and PTT lengthen, fibrinogen falls and D-dimer rises.',
    hy: ['Causes of DIC: SSSTOP — Sepsis (gram-negative), Snake bites, heat Stroke, Trauma, Obstetric complications, Pancreatitis (plus malignancy and transfusion).', 'Acute promyelocytic leukaemia often presents with DIC.'],
    lookalikes: {
      hm_ttp: 'TTP has schistocytes and low platelets with NORMAL PT, PTT and fibrinogen.',
      hm_hus: 'HUS has haemolysis, low platelets and kidney failure with normal clotting times.',
      hm_hemophilia_a: 'Haemophilia A prolongs only the PTT, with normal platelets and fibrinogen.',
    },
    vs: 'hm_ttp',
  },
  {
    id: 'hm_hit', name: 'Heparin-induced thrombocytopenia', chapter: 'bleed', tag: 'Type II (IgG against heparin–PF4)',
    s: 'Seven days after starting **heparin** for a hip replacement, a 70-year-old woman\'s **platelets have fallen by over half**, and she develops a **new clot in her leg**.',
    w: {
      'heparin': 'Heparin binds platelet factor 4 (PF4), and the body can make antibodies against this heparin–PF4 complex.',
      'platelets have fallen by over half': 'Antibody-coated platelets are activated and removed, so the count drops, typically 5–10 days after starting heparin.',
      'new clot in her leg': 'The antibodies ACTIVATE platelets, so clotting rather than bleeding is the danger.',
    },
    x: 'In HIT, IgG antibodies form against heparin bound to platelet factor 4. They activate platelets, which release more PF4 and clump, so platelet counts fall while new clots form. It usually starts 5–10 days after heparin is begun.',
    hy: ['In HIT, stop all heparin and start a non-heparin anticoagulant such as argatroban, bivalirudin or fondaparinux; do not start warfarin until platelets recover.'],
    lookalikes: {
      hm_itp: 'ITP lowers platelets with BLEEDING, not clotting, and is not tied to heparin.',
      hm_dic: 'DIC has prolonged PT and PTT and low fibrinogen in a critically ill patient.',
      hm_fvl: 'Factor V Leiden causes clots with a NORMAL platelet count.',
    },
    vs: 'hm_itp',
  },
  {
    id: 'hm_fvl', name: 'Factor V Leiden', chapter: 'bleed', tag: 'Autosomal dominant thrombophilia',
    s: 'A 25-year-old woman on the **combined pill** has a DVT after a long flight. Her mother had a clot in pregnancy. Her **factor V resists inactivation by activated protein C**; platelets, PT and PTT are normal.',
    w: {
      'combined pill': 'Oestrogen increases clotting factors, adding to an inherited tendency to clot.',
      'factor V resists inactivation by activated protein C': 'A point mutation (Arg506Gln) near the cleavage site means activated protein C cannot switch factor V off.',
    },
    x: 'Factor V Leiden is a point mutation in factor V that stops activated protein C from breaking it down. Factor V stays active for longer and makes more thrombin. It is the most common inherited cause of a clotting tendency, causing DVTs, cerebral vein clots and recurrent pregnancy loss.',
    hy: ['Factor V Leiden is the most common inherited thrombophilia (autosomal dominant, Arg506Gln); other hereditary thrombophilias are prothrombin G20210A, antithrombin deficiency and protein C or S deficiency.'],
    lookalikes: {
      hm_protein_c: 'Protein C deficiency also causes clots, with a high risk of warfarin-induced skin necrosis.',
      hm_antithrombin: 'Antithrombin deficiency causes clots and resistance to heparin (the PTT barely rises).',
      hm_hit: 'HIT causes clots with FALLING platelets after heparin.',
    },
    vs: 'hm_protein_c',
  },
  {
    id: 'hm_protein_c', name: 'Protein C deficiency', chapter: 'bleed', tag: 'Autosomal dominant thrombophilia',
    s: 'Three days after starting **warfarin** for a DVT (without heparin cover), a 40-year-old man develops **painful, dark, dying patches of skin** on his thighs and abdomen. His brother also had unprovoked clots.',
    w: {
      'warfarin': 'Warfarin blocks vitamin K-dependent proteins. Protein C has the shortest half-life, so it falls before the clotting factors do.',
      'painful, dark, dying patches of skin': 'In the first days the blood is briefly MORE likely to clot, so small skin vessels thrombose and the skin dies (warfarin-induced skin necrosis).',
    },
    x: 'Protein C, with protein S, switches off factors Va and VIIIa. With an inherited deficiency, clotting is poorly controlled and clots form easily. Starting warfarin drops protein C even further before the clotting factors fall, so the skin\'s small vessels clot and the skin dies.',
    hy: ['Protein C deficiency increases the risk of warfarin-induced skin necrosis; bridge with heparin when starting warfarin. Protein C Cancels, protein S Stops coagulation.'],
    lookalikes: {
      hm_fvl: 'Factor V Leiden causes clots with normal protein C levels and resistance to activated protein C.',
      hm_antithrombin: 'Antithrombin deficiency causes clots and a poor PTT response to heparin.',
      hm_hit: 'HIT causes clots with falling platelets after HEPARIN, not warfarin.',
    },
    vs: 'hm_fvl',
  },
  {
    id: 'hm_antithrombin', name: 'Antithrombin deficiency', chapter: 'bleed', tag: 'Inherited or acquired thrombophilia',
    s: 'A 30-year-old man with **nephrotic syndrome** develops a renal vein clot. On heparin, his **PTT barely rises** despite standard doses. Platelets are normal.',
    w: {
      'nephrotic syndrome': 'Antithrombin is a small protein lost in the urine when the kidney leaks protein, so it can be acquired this way.',
      'PTT barely rises': 'Heparin works by boosting antithrombin. With little antithrombin, heparin has little to work through.',
    },
    x: 'Antithrombin inactivates thrombin (IIa) and factor Xa, and heparin works by strengthening it. When antithrombin is low, clots form easily and heparin has a weak effect. It can be inherited or acquired, for example through urine loss in nephrotic syndrome.',
    hy: ['Antithrombin deficiency causes venous clots and heparin resistance; it does not change the baseline PT or PTT.'],
    lookalikes: {
      hm_fvl: 'Factor V Leiden causes clots with a normal heparin response.',
      hm_protein_c: 'Protein C deficiency causes clots and warfarin-induced skin necrosis.',
      hm_hit: 'HIT causes clots with a falling platelet count after heparin.',
    },
    vs: 'hm_fvl',
  },
];
