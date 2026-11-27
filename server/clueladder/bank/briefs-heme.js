'use strict';
/**
 * The brief shown after a Hematology case is revealed, so a round teaches.
 * 'Diagnosis name': [what it is, high-yield point, high-yield point]
 * Names must match the bank exactly; check.js fails on a missing or stray one.
 * Written in our own words to First Aid's facts.
 */
module.exports = {
  // Newborn
  'Rh hemolytic disease of the newborn': ['An Rh-negative mother makes anti-D IgG after exposure to Rh-positive fetal blood; in a later pregnancy it crosses the placenta and destroys fetal red cells.', 'Hydrops fetalis, jaundice shortly after birth and kernicterus; usually spares the first pregnancy.', 'Prevented by anti-D immune globulin in the third trimester and after delivery or any bleeding event.'],
  'ABO hemolytic disease of the newborn': ['A group O mother\'s pre-existing anti-A/anti-B IgG crosses the placenta and attacks a group A or B baby\'s red cells.', 'Mild jaundice within 24 hours of birth; can affect the firstborn.', 'Usually milder than Rh disease; treated with phototherapy or exchange transfusion.'],

  // Microcytic anemia
  'Iron deficiency anemia': ['Too little iron to make heme, most often from chronic blood loss (GI, heavy periods) or high demand.', 'Fatigue, pallor, pica, spoon nails, restless legs, glossitis.', 'Low iron and ferritin, high TIBC, high RDW; microcytic hypochromic cells.'],
  'Plummer-Vinson syndrome': ['A triad of iron deficiency anemia, esophageal webs and dysphagia.', 'Glossitis and angular cheilitis are common.', 'Raises the risk of esophageal squamous cell carcinoma.'],
  'Alpha-thalassemia silent carrier': ['Deletion of one of the four alpha-globin genes on chromosome 16.', 'No anemia and a normal blood count.', 'Found only by family screening or gene testing.'],
  'Alpha-thalassemia trait': ['Deletion of two of the four alpha-globin genes (cis deletions common in Asians, trans in Africans).', 'Mild microcytic hypochromic anemia with a high red cell count.', 'Normal iron studies; Mentzer index (MCV/RBC) under 13.'],
  'Hemoglobin H disease': ['Deletion of three alpha-globin genes, so excess beta chains form beta-4 tetramers (HbH).', 'Moderate to severe microcytic hemolytic anemia with splenomegaly.', 'HbH inclusions are seen with a supravital stain.'],
  'Hemoglobin Barts disease': ['Deletion of all four alpha-globin genes; excess gamma chains form gamma-4 tetramers (Hb Barts).', 'Hydrops fetalis; incompatible with life.', 'Hb Barts binds O2 tightly and cannot release it to tissues.'],
  'Beta-thalassemia minor': ['One abnormal beta-globin gene (chromosome 11); mostly in Mediterranean populations.', 'Mild microcytic anemia, usually without symptoms.', 'Raised HbA2 on electrophoresis is the key finding.'],
  'Beta-thalassemia intermedia': ['Both beta-globin genes affected, with some beta chain still made (β+/β+ or β+/β0).', 'Variable anemia, from mild to needing occasional transfusion.', 'Sits between thalassemia minor and major in severity.'],
  'Beta-thalassemia major': ['No beta chain made (β0/β0), so severe anemia appears once HbF falls after about 6 months.', 'Marrow expansion (crew-cut skull, chipmunk face), extramedullary hematopoiesis with hepatosplenomegaly.', 'Transfusion dependent, with secondary hemochromatosis; raised HbF and HbA2; parvovirus B19 aplastic crises.'],
  'Sickle cell beta-thalassemia': ['One sickle gene plus one beta-thalassemia gene.', 'Mild to moderate sickle cell disease; microcytic red cells.', 'Severity depends on whether some normal beta chain is made (β+) or none (β0).'],
  'Lead poisoning': ['Lead inhibits ferrochelatase and ALA dehydratase, blocking heme synthesis.', 'LEAD: Lead lines on gums and bones, Encephalopathy and Erythrocyte basophilic stippling, Abdominal colic and sideroblastic Anemia, Drops (wrist and foot drop).', 'High protoporphyrin and ALA; treat with succimer (children), EDTA or dimercaprol.'],
  'Sideroblastic anemia': ['Defective protoporphyrin synthesis traps iron in mitochondria around the nucleus.', 'Causes: X-linked ALA synthase defect, alcohol, lead, B6 deficiency, isoniazid, MDS.', 'High iron and ferritin; ringed sideroblasts on Prussian blue stain; treat with pyridoxine (B6).'],

  // Macrocytic anemia
  'Vitamin B12 deficiency': ['Lack of cobalamin impairs DNA synthesis (megaloblastic anemia) and myelin maintenance.', 'Causes: pernicious anemia, gastrectomy, Crohn disease, vegan diet, fish tapeworm.', 'High homocysteine AND methylmalonic acid; subacute combined degeneration (dorsal columns, lateral corticospinal tracts).'],
  'Folate deficiency': ['Lack of folate impairs DNA synthesis, giving a megaloblastic anemia; body stores last only months.', 'Causes: poor diet (alcohol use), pregnancy, hemolysis, methotrexate, trimethoprim, phenytoin.', 'High homocysteine but NORMAL methylmalonic acid; no neurologic signs.'],
  'Orotic aciduria': ['Autosomal recessive UMP synthase deficiency blocks de novo pyrimidine synthesis.', 'Megaloblastic anemia that does not respond to B12 or folate, failure to thrive.', 'Orotic acid in urine with NO hyperammonemia (vs OTC deficiency); treat with uridine.'],
  'Diamond-Blackfan anemia': ['A congenital pure red cell aplasia from an intrinsic defect in erythroid progenitors.', 'Rapid-onset macrocytic anemia in the first year; triphalangeal thumbs, short stature, craniofacial anomalies.', 'Raised HbF; white cells and platelets are normal (vs Fanconi anemia).'],

  // Normocytic anemia
  'Anemia of chronic disease': ['Inflammation (IL-6) makes the liver release hepcidin, which traps iron in macrophages and cuts gut absorption.', 'Seen with chronic infection, cancer, autoimmune disease and CKD.', 'Low iron, low TIBC but HIGH ferritin; normocytic, can become microcytic.'],
  'Aplastic anemia': ['Failure or destruction of hematopoietic stem cells, giving pancytopenia.', 'Causes: radiation, viruses (EBV, HIV, hepatitis), Fanconi anemia, drugs (benzene, chloramphenicol), idiopathic.', 'Hypocellular, fatty marrow; treat with antithymocyte globulin, cyclosporine or marrow transplant.'],
  'Fanconi anemia': ['An autosomal recessive DNA repair defect causing bone marrow failure.', 'Short stature, café-au-lait spots, absent thumbs/radial defects, pancytopenia.', 'High risk of AML and other cancers.'],

  // Hemolytic anemia
  'Hereditary spherocytosis': ['Usually autosomal dominant defects in red cell skeleton proteins (ankyrin, spectrin, band 3) make cells lose membrane and turn spherical.', 'Extravascular hemolysis: jaundice, splenomegaly, pigment gallstones, parvovirus aplastic crises.', 'High MCHC, no central pallor, increased osmotic fragility, abnormal EMA binding; Coombs negative; splenectomy helps.'],
  'Hereditary elliptocytosis': ['A mutation in red cell membrane proteins (often spectrin) makes cells oval.', 'Usually asymptomatic or mild hemolysis.', 'Elliptocytes on the blood smear.'],
  'Paroxysmal nocturnal hemoglobinuria': ['An acquired PIGA mutation stops GPI anchors, so red cells lack CD55 (DAF) and CD59 (MIRL) and are lysed by complement.', 'Triad: Coombs-negative intravascular hemolysis, pancytopenia and venous thrombosis (e.g. Budd-Chiari).', 'Flow cytometry for CD55/CD59; treat with eculizumab (anti-C5).'],
  'G6PD deficiency': ['An X-linked recessive defect in G6PD lowers NADPH and glutathione, so red cells are damaged by oxidants.', 'Hemolysis after sulfa drugs, antimalarials, infection or fava beans: back pain, dark urine.', 'Heinz bodies and bite cells; enzyme levels may look normal during an acute episode.'],
  'Pyruvate kinase deficiency': ['Autosomal recessive defect in glycolysis; red cells cannot make enough ATP and become rigid.', 'Hemolytic anemia in a newborn; extravascular hemolysis.', 'Raised 2,3-BPG shifts the O2 curve right; burr cells on smear.'],
  'Sickle cell anemia': ['A point mutation in beta-globin (glutamate to valine) makes HbS polymerize when deoxygenated.', 'Vaso-occlusive crises (dactylitis, acute chest syndrome, stroke, priapism), autosplenectomy and encapsulated infections (Salmonella osteomyelitis).', 'Aplastic crisis with parvovirus B19; treat with hydroxyurea (raises HbF), hydration, transfusion.'],
  'Sickle cell trait': ['One sickle gene and one normal gene (HbAS).', 'Usually no symptoms; protection against malaria.', 'Sickling in the low-O2 renal medulla can cause painless hematuria and papillary necrosis.'],
  'Hemoglobin C disease': ['A glutamate-to-lysine mutation in beta-globin (HbC); both genes affected.', 'Mild extravascular hemolysis and splenomegaly.', 'HbC crystals and target cells on smear; HbC moves least toward the anode.'],
  'Hemoglobin SC disease': ['One HbS gene and one HbC gene.', 'Milder than sickle cell anemia; the spleen often persists.', 'Proliferative retinopathy and bone infarcts are characteristic.'],
  'Warm autoimmune hemolytic anemia': ['IgG autoantibodies against red cells at body temperature cause mainly extravascular hemolysis.', 'Linked to SLE, CLL and drugs (beta-lactams, alpha-methyldopa); "warm weather is Good" (IgG).', 'Spherocytes; direct Coombs positive; treat with steroids, rituximab, then splenectomy.'],
  'Cold agglutinin disease': ['IgM autoantibodies and complement bind red cells in the cold, causing agglutination and hemolysis.', 'Painful blue fingers and toes in the cold; follows Mycoplasma pneumoniae or EBV, or with CLL.', 'Direct Coombs positive for C3; avoid cold; rituximab.'],
  'Drug-induced hemolytic anemia': ['A drug triggers antibody destruction of red cells or oxidant injury.', 'Common causes: penicillins, cephalosporins, NSAIDs, chemotherapy.', 'Usually Coombs positive; stopping the drug is the treatment.'],
  'Macroangiopathic hemolytic anemia': ['Red cells are mechanically torn by prosthetic heart valves or aortic stenosis.', 'Intravascular hemolysis: low haptoglobin, hemoglobinuria, hemosiderinuria.', 'Schistocytes on smear; Coombs negative.'],

  // Porphyria & iron
  'Acute intermittent porphyria': ['Autosomal dominant porphobilinogen deaminase deficiency; porphobilinogen and ALA build up.', '5 P\'s: Painful abdomen, Port-wine urine, Polyneuropathy, Psychological disturbance, Precipitated by drugs (CYP450 inducers), alcohol, starvation.', 'No photosensitivity; treat with hemin and glucose (they reduce ALA synthase).'],
  'Porphyria cutanea tarda': ['The most common porphyria: uroporphyrinogen decarboxylase deficiency, so uroporphyrin builds up.', 'Blistering photosensitive skin on sun-exposed areas, hyperpigmentation, tea-colored urine.', 'Triggered by alcohol and hepatitis C; treat with phlebotomy, sun avoidance, hydroxychloroquine.'],
  'Acute iron poisoning': ['Iron causes free radical formation and lipid peroxidation, killing cells; a leading cause of poisoning deaths in children.', 'Abdominal pain, vomiting, GI bleeding; radiopaque pills on x-ray; then anion gap acidosis and organ failure.', 'Treat with chelation (deferoxamine) and gastric lavage; can cause later GI scarring.'],

  // Coagulation
  'Hemophilia A': ['X-linked recessive deficiency of factor VIII.', 'Hemarthroses, deep muscle bleeds and easy bruising; affects boys.', 'Prolonged PTT, normal PT and bleeding time; treat with desmopressin, factor VIII or emicizumab.'],
  'Hemophilia B': ['X-linked recessive deficiency of factor IX (Christmas disease).', 'Clinically the same as hemophilia A: joint and muscle bleeds.', 'Prolonged PTT that corrects with mixing; treat with factor IX concentrate.'],
  'Hemophilia C': ['Autosomal recessive deficiency of factor XI, more common in Ashkenazi Jews.', 'Milder bleeding, usually after surgery or dental work; affects both sexes.', 'Prolonged PTT; treat with factor XI concentrate.'],
  'Acquired hemophilia': ['An autoantibody against a clotting factor, usually factor VIII, in a previously normal person.', 'Sudden large bruises and soft tissue bleeds, often in older adults or postpartum.', 'Prolonged PTT that does NOT correct on mixing study (an inhibitor, not a deficiency).'],
  'Vitamin K deficiency bleeding': ['Lack of vitamin K stops gamma-carboxylation of factors II, VII, IX, X and proteins C and S.', 'Newborns lack gut bacteria that make vitamin K; also from broad-spectrum antibiotics, malabsorption.', 'Prolonged PT (first) and PTT; prevented by a vitamin K shot at birth.'],
  'Von Willebrand disease': ['The most common inherited bleeding disorder, usually autosomal dominant: too little or faulty vWF.', 'Mucosal bleeding: heavy periods, nosebleeds, bleeding after dental work.', 'Prolonged bleeding time and often PTT (vWF protects factor VIII); abnormal ristocetin test; treat with desmopressin.'],
  'Disseminated intravascular coagulation': ['Widespread activation of clotting uses up platelets and factors, causing clots and bleeding together.', 'Causes (SSSTOP): Sepsis, Snake bites, heat Stroke, Trauma, Obstetric complications, Pancreatitis, plus malignancy (APL).', 'Long PT and PTT, low platelets and fibrinogen, high D-dimer, schistocytes.'],

  // Platelets
  'Immune thrombocytopenia': ['Anti-GpIIb/IIIa antibodies coat platelets, which are removed by splenic macrophages.', 'Children after a viral infection (self-limited); adult women with chronic disease or with SLE, HIV, CLL.', 'Isolated low platelets with more megakaryocytes in the marrow; treat with steroids, IVIG, rituximab, TPO agonists, splenectomy.'],
  'Bernard-Soulier syndrome': ['Autosomal recessive lack of GpIb, so platelets cannot stick to vWF.', 'Mucosal bleeding; mildly low platelets that are very large.', 'No aggregation with ristocetin, not corrected by adding vWF.'],
  'Glanzmann thrombasthenia': ['Autosomal recessive lack of GpIIb/IIIa, so platelets cannot aggregate with each other.', 'Mucosal bleeding with a normal platelet count.', 'No clumping on smear; normal ristocetin response, but no aggregation to ADP or collagen.'],
  'Uremic platelet dysfunction': ['Uremic toxins in kidney failure stop platelets from adhering and aggregating.', 'Bleeding with a normal platelet count, PT and PTT.', 'Prolonged bleeding time; treated with dialysis and desmopressin.'],
  'Thrombotic thrombocytopenic purpura': ['Deficiency or inhibition of ADAMTS13 leaves large vWF multimers that cause platelet microthrombi.', 'Pentad: thrombocytopenia, MAHA (schistocytes), renal injury, fever, neurologic symptoms; usually adult women.', 'Normal PT and PTT (vs DIC); treat urgently with plasma exchange, steroids, rituximab.'],
  'Hemolytic uremic syndrome': ['Shiga toxin from E coli O157:H7 damages endothelium, causing microthrombi in the kidneys.', 'Children after bloody diarrhea: thrombocytopenia, MAHA and acute kidney injury.', 'Normal PT and PTT; supportive care.'],
  'Heparin-induced thrombocytopenia': ['IgG antibodies against heparin bound to platelet factor 4 activate platelets, causing clotting and a falling count.', 'Platelets drop by over 50% about 5-10 days after starting heparin, often with new thrombosis.', 'Stop all heparin and start a non-heparin anticoagulant (argatroban, bivalirudin, fondaparinux).'],

  // Thrombophilia
  'Factor V Leiden': ['A point mutation (Arg506Gln) makes factor V resistant to inactivation by activated protein C.', 'The most common inherited cause of hypercoagulability in white populations.', 'DVT, cerebral vein thrombosis, recurrent pregnancy loss; risk rises with OCPs and pregnancy.'],
  'Prothrombin G20210A mutation': ['A point mutation in the 3\' untranslated region of the prothrombin gene raises its production.', 'Venous clots (DVT, cerebral vein thrombosis).', 'The second most common inherited thrombophilia; autosomal dominant.'],
  'Protein C deficiency': ['Low protein C reduces the inactivation of factors Va and VIIIa.', 'Recurrent venous clots.', 'High risk of warfarin-induced skin necrosis, because protein C falls before the clotting factors do.'],
  'Antithrombin deficiency': ['Low antithrombin means thrombin and factor Xa are not inhibited.', 'Venous clots; can be acquired from protein loss in nephrotic syndrome.', 'Heparin works poorly: the PTT barely rises with standard doses.'],

  // Transfusion
  'Transfusion-related acute lung injury': ['Donor antibodies activate the recipient\'s neutrophils in the lung, causing noncardiogenic pulmonary edema.', 'Within 6 hours of transfusion (often plasma): hypoxia, fever, bilateral infiltrates.', 'Hypotension and normal filling pressures distinguish it from TACO.'],
  'Transfusion-associated circulatory overload': ['Too much volume transfused too fast for the heart to handle.', 'Older patients and those with heart or kidney failure: dyspnea, pulmonary edema.', 'Hypertension, raised JVP and BNP; treat with diuretics and slower transfusion.'],

  // Lymphoma
  'Nodular sclerosis Hodgkin lymphoma': ['The most common subtype of Hodgkin lymphoma: collagen bands divide the node into nodules.', 'Young women with a mediastinal or cervical mass; B symptoms.', 'Reed-Sternberg cells (CD15+, CD30+) and lacunar cells; excellent prognosis.'],
  'Mixed cellularity Hodgkin lymphoma': ['A Hodgkin subtype with a mixed background of eosinophils, plasma cells and histiocytes.', 'Strongly associated with EBV and HIV; older men.', 'Many Reed-Sternberg cells; eosinophilia from IL-5.'],
  'Lymphocyte-rich Hodgkin lymphoma': ['A Hodgkin subtype with few Reed-Sternberg cells in a background of many small lymphocytes.', 'Usually early-stage at diagnosis.', 'The best prognosis ("the rich have better bank accounts").'],
  'Lymphocyte-depleted Hodgkin lymphoma': ['A Hodgkin subtype with many Reed-Sternberg cells and few lymphocytes.', 'Older, HIV-positive patients with advanced disease.', 'The worst prognosis.'],
  'Burkitt lymphoma': ['A highly aggressive B-cell lymphoma driven by c-myc, from t(8;14).', 'Endemic (African): jaw mass, EBV. Sporadic: abdomen or pelvis (ileocecal).', '"Starry sky" histology; very high proliferation; risk of tumor lysis syndrome.'],
  'Diffuse large B-cell lymphoma': ['The most common non-Hodgkin lymphoma in adults: sheets of large B cells.', 'A rapidly growing mass in nodes or outside them; B symptoms.', 'Can arise from CLL (Richter) or follicular lymphoma; BCL-2 and BCL-6 mutations.'],
  'Follicular lymphoma': ['An indolent B-cell lymphoma from t(14;18), which overexpresses anti-apoptotic BCL-2.', 'Painless "waxing and waning" lymph nodes in older adults.', 'Can transform into diffuse large B-cell lymphoma.'],
  'Mantle cell lymphoma': ['An aggressive B-cell lymphoma from t(11;14), which overexpresses cyclin D1.', 'Older men presenting at a late stage; can involve the GI tract.', 'CD5+ but CD23- (CLL is CD5+ CD23+).'],
  'MALT lymphoma': ['A marginal zone B-cell lymphoma at sites of chronic inflammation.', 'Stomach (H pylori gastritis), salivary glands (Sjögren), thyroid (Hashimoto).', 'Gastric MALT can regress after H pylori is eradicated; t(11;18).'],
  'Primary CNS lymphoma': ['A B-cell lymphoma confined to the brain, linked to EBV.', 'An AIDS-defining illness: confusion, seizures, memory loss.', 'Usually a single ring-enhancing lesion; tell it from toxoplasmosis by CSF EBV DNA or lack of response to treatment.'],
  'Adult T-cell lymphoma': ['A T-cell neoplasm caused by HTLV-1.', 'Common in Japan, West Africa and the Caribbean; skin lesions and lymphadenopathy.', 'Lytic bone lesions and hypercalcemia; "cloverleaf" nuclei.'],
  'Mycosis fungoides': ['The most common cutaneous T-cell lymphoma: CD4+ T cells in the skin.', 'Itchy patches in sun-protected areas progressing to plaques and tumors.', 'Pautrier microabscesses; spread to the blood is Sézary syndrome (cerebriform nuclei).'],

  // Plasma cell
  'Multiple myeloma': ['A malignant clone of plasma cells in the marrow makes a monoclonal immunoglobulin (IgG > IgA).', 'CRAB: hyperCalcemia, Renal failure, Anemia, Bone lytic lesions (punched out); infections.', 'M spike, Bence Jones light chains in urine, rouleaux; >10% clonal plasma cells; can cause AL amyloidosis.'],
  'Waldenstrom macroglobulinemia': ['A B-cell neoplasm with plasma-cell features that makes a monoclonal IgM.', 'Hyperviscosity: headache, blurry vision, bleeding; lymphadenopathy, hepatosplenomegaly, neuropathy.', 'IgM M spike with NO lytic bone lesions; "sausage-link" retinal veins.'],
  'Monoclonal gammopathy of undetermined significance': ['A small plasma cell clone making an M protein without causing symptoms.', 'M spike under 3 g/dL and fewer than 10% clonal plasma cells; no CRAB features.', 'Progresses to myeloma at about 1-2% a year, so it is monitored.'],
  'AL amyloidosis': ['Deposition of misfolded immunoglobulin light chains from a plasma cell clone.', 'Nephrotic syndrome, restrictive cardiomyopathy (low-voltage ECG), macroglossia, neuropathy, periorbital bruising.', 'Congo red stain shows apple-green birefringence under polarized light.'],

  // Leukemia
  'Acute lymphoblastic leukemia': ['A malignancy of immature lymphoblasts; the most common cancer in children.', 'Associated with Down syndrome; bone pain, infections, bleeding; T-ALL can present as a mediastinal mass.', 'TdT+ (and CD10+ in B-ALL); spreads to CNS and testes; t(12;21) good, t(9;22) poor prognosis.'],
  'Chronic lymphocytic leukemia': ['A neoplasm of mature-looking B cells; the most common leukemia in adults (>60).', 'Often found by chance; smudge cells; can cause warm autoimmune hemolytic anemia.', 'CD5+, CD20+, CD23+; Richter transformation to DLBCL.'],
  'Hairy cell leukemia': ['A mature B-cell neoplasm with cells that have hair-like cytoplasmic projections.', 'Middle-aged men: massive splenomegaly, pancytopenia, no lymphadenopathy; dry tap from marrow fibrosis.', 'TRAP positive (now flow cytometry); BRAF mutations; treat with cladribine or pentostatin.'],
  'Acute myeloid leukemia': ['A malignancy of myeloblasts (over 20% blasts in the marrow).', 'Older adults; risks include prior chemotherapy, radiation, benzene, MDS, Down syndrome.', 'Myeloperoxidase-positive blasts, Auer rods; can cause leukostasis.'],
  'Acute promyelocytic leukemia': ['An AML subtype from t(15;17), forming PML-RARA, which blocks promyelocyte maturation.', 'Presents with DIC and bleeding; many Auer rods.', 'Treat with all-trans retinoic acid (vitamin A) and arsenic trioxide, which make the cells mature.'],
  'Acute megakaryoblastic leukemia': ['An AML of megakaryocyte precursors.', 'The leukemia classically linked to Down syndrome in young children.', 'Blasts express platelet markers; marrow fibrosis.'],
  'Chronic myeloid leukemia': ['A myeloproliferative neoplasm driven by BCR-ABL from t(9;22), the Philadelphia chromosome.', 'Very high white count with all stages of granulocytes, basophilia and splenomegaly.', 'Low LAP score; can transform to AML or ALL (blast crisis); treat with imatinib.'],
  'Leukemoid reaction': ['A reactive rise in neutrophils (over 50,000) in response to infection or inflammation.', 'Toxic granulation, Döhle bodies and cytoplasmic vacuoles in neutrophils.', 'High LAP score and no basophilia, unlike CML.'],
  'Myelodysplastic syndrome': ['Stem cell disorders with ineffective hematopoiesis and dysplastic cells; blasts under 20%.', 'Older adults; risks include radiation, benzene and prior chemotherapy.', 'Pseudo-Pelger-Huët neutrophils (bilobed), ringed sideroblasts; can turn into AML.'],
  'Richter transformation': ['Transformation of CLL/SLL into an aggressive lymphoma, usually DLBCL.', 'Sudden enlarging nodes, B symptoms and a high LDH in a patient with known CLL.', 'Poor prognosis.'],

  // Myeloproliferative
  'Polycythemia vera': ['A myeloproliferative neoplasm, usually from a JAK2 V617F mutation, that raises red cell mass.', 'Itching after a warm shower, erythromelalgia, plethora; thromboses such as Budd-Chiari.', 'LOW EPO (vs secondary polycythemia); treat with phlebotomy, hydroxyurea, ruxolitinib.'],
  'Essential thrombocythemia': ['A myeloproliferative neoplasm with overproduction of megakaryocytes and platelets.', 'Bleeding and thrombosis; erythromelalgia.', 'Very high platelet count with large, abnormal platelets; JAK2, CALR or MPL mutations.'],
  'Primary myelofibrosis': ['Abnormal megakaryocytes release TGF-beta, which drives marrow fibrosis.', 'Massive splenomegaly from extramedullary hematopoiesis.', 'Teardrop cells and a leukoerythroblastic smear; dry tap.'],
  'Secondary polycythemia': ['A raised red cell mass driven by EPO, appropriate (hypoxia) or inappropriate (EPO-secreting tumor).', 'Appropriate: lung disease, high altitude, cyanotic heart disease, sleep apnea. Inappropriate: RCC, HCC, exogenous EPO, androgens.', 'EPO is HIGH (vs polycythemia vera); white cells and platelets are normal.'],
  'Relative polycythemia': ['A high hematocrit from low plasma volume, not more red cells.', 'Dehydration and burns.', 'Normal red cell mass, oxygen and EPO; corrects with fluids.'],

  // Other neoplasms
  'Langerhans cell histiocytosis': ['A proliferation of immature Langerhans cells (dendritic cells) that cannot activate T cells.', 'Children with lytic bone lesions, skin rash, recurrent otitis media with a mastoid mass.', 'S-100+, CD1a+, CD207+ (langerin); Birbeck "tennis racket" granules on EM.'],
  'Systemic mastocytosis': ['Clonal proliferation of mast cells from a KIT D816V mutation.', 'Flushing, itching, hypotension, abdominal pain, diarrhea, peptic ulcers (histamine).', 'High serum tryptase; skin lesions urticate when stroked (Darier sign).'],
  'Tumor lysis syndrome': ['Massive tumor cell breakdown releases potassium, phosphate and nucleic acids, usually at the start of chemotherapy.', 'Most often in leukemias and lymphomas (e.g. Burkitt).', 'High K+, phosphate and uric acid, low calcium ("BreaK the CUP"); prevent with fluids, allopurinol, rasburicase.'],
};
