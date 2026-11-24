/**
 * Vitamin Vault — Step 1 nutrition (vitamins, zinc, protein-energy
 * malnutrition). Ethanol metabolism is deliberately left out.
 *
 * Written in our own words from standard Step 1 teaching. Every game mode
 * reads this one list:
 *   def / exc / fn / cause   clue strings by type. A Clinic case shows 2–3
 *                            clues of ONE type and asks which bottle treats
 *                            (or caused) it — so each clue must point to its
 *                            nutrient and no other.
 *   cof                      enzymes/reactions that need it (Cofactor Match).
 *   note                     a memory hook shown on the answer card.
 */

export const NUTRIENTS = [
  { id: 'A', label: 'A', name: 'Retinol', color: '255, 159, 67', fat: true, shape: 'round',
    role: 'Vision pigment (retinal), epithelial differentiation, antioxidant.',
    sources: 'Liver, leafy vegetables.',
    def: ['Night blindness', 'Bitot spots — foamy keratin debris on the conjunctiva', 'Dry eyes (xerophthalmia) and corneal softening (keratomalacia)', 'Dry, scaly skin and immunosuppression', 'Measles outcomes improve with supplementation'],
    exc: ['Raised intracranial pressure with headache, vomiting and blurred vision (acute)', 'Hair loss, liver enlargement and arthralgias (chronic)', 'Teratogen: cleft palate and cardiac defects', 'Requires a pregnancy test + two forms of contraception before prescribing its acne derivative'],
    fn: ['Prevents squamous metaplasia of specialized epithelium', 'Derivative used for acute promyelocytic leukemia (all-trans form)', 'Derivative used orally for severe cystic acne'],
    cause: [],
    cof: [],
    note: 'Retinol → think Retin-A for wrinkles and Acne. Fat soluble: toxicity is more likely than with water-soluble vitamins.' },

  { id: 'B1', label: 'B1', name: 'Thiamine', color: '96, 165, 250', shape: 'capsule',
    role: 'As thiamine pyrophosphate (TPP): cofactor for dehydrogenases and transketolase.',
    sources: 'Whole grains, meat.',
    def: ['Confusion, ophthalmoplegia/nystagmus and ataxia', 'Confabulation and permanent memory loss in chronic alcohol overuse', 'Symmetric polyneuropathy with muscle wasting (dry form)', 'High-output heart failure from vasodilation (wet form)', 'Mammillary body and medial dorsal thalamic damage'],
    exc: [],
    fn: ['Cofactor for pyruvate dehydrogenase, α-ketoglutarate dehydrogenase and branched-chain ketoacid dehydrogenase', 'Diagnosed by ↑ RBC transketolase activity after supplementation'],
    cause: ['Dextrose given BEFORE this vitamin to a malnourished, alcohol-dependent patient'],
    cof: ['Pyruvate dehydrogenase', 'α-Ketoglutarate dehydrogenase', 'Branched-chain ketoacid dehydrogenase', 'Transketolase'],
    note: 'Be APT (BCKDH, α-KGDH, PDH, Transketolase). Ber1Ber1 = beriberi. Wernicke = CorONA: Confusion, Ophthalmoplegia, Nystagmus, Ataxia.' },

  { id: 'B2', label: 'B2', name: 'Riboflavin', color: '250, 204, 21', shape: 'capsule',
    role: 'Forms FAD and FMN for redox reactions.',
    sources: 'Dairy, eggs, meat.',
    def: ['Cheilosis — cracked corners of the mouth', 'Magenta-coloured tongue', 'Corneal vascularization'],
    exc: [],
    fn: ['Component of FAD and FMN', 'Needed by succinate dehydrogenase in the TCA cycle'],
    cause: [],
    cof: ['Succinate dehydrogenase'],
    note: 'The 2 C’s of B2: Cheilosis, Corneal vascularization. FAD/FMN → B2 → 2 ATP.' },

  { id: 'B3', label: 'B3', name: 'Niacin', color: '244, 114, 182', shape: 'capsule',
    role: 'Forms NAD⁺/NADP⁺; made from tryptophan (needs B2 and B6).',
    sources: 'Meat, made from tryptophan.',
    def: ['Diarrhea, dementia and photosensitive dermatitis', 'Circumferential “broad collar” neck rash (Casal necklace)', 'Glossitis with hyperpigmented sun-exposed skin'],
    exc: ['Facial flushing (prostaglandin-mediated — prevent with aspirin)', 'Hyperuricemia that can precipitate gout', 'Hyperglycemia and pruritus'],
    fn: ['Used to treat dyslipidemia: lowers VLDL, raises HDL', 'Component of NAD⁺ and NADP⁺'],
    cause: ['Hartnup disease — neutral amino acid (tryptophan) transporter defect', 'Malignant carcinoid syndrome diverting tryptophan to serotonin', 'Diet of untreated corn'],
    cof: [],
    note: 'Pellagra = B3 levels fell (the 3 D’s). Podagra = B3 overdose. NAD → B3 → 3 ATP.' },

  { id: 'B5', label: 'B5', name: 'Pantothenic acid', color: '167, 139, 250', shape: 'capsule',
    role: 'Part of coenzyme A and fatty acid synthase.',
    sources: 'Widespread in foods.',
    def: ['“Burning feet” paresthesias', 'Dermatitis, enteritis and alopecia with adrenal insufficiency'],
    exc: [],
    fn: ['Component of coenzyme A (acyl transfers)'],
    cause: [],
    cof: ['Coenzyme A (acyl transfer)', 'Fatty acid synthase'],
    note: 'B5 is “pento”-thenic acid → CoA.' },

  { id: 'B6', label: 'B6', name: 'Pyridoxine', color: '45, 212, 191', shape: 'capsule',
    role: 'As pyridoxal phosphate (PLP): transamination, decarboxylation, heme and neurotransmitter synthesis.',
    sources: 'Meat, fish, potatoes.',
    def: ['Convulsions and hyperirritability', 'Sideroblastic anemia with iron overload', 'Peripheral neuropathy during isoniazid therapy'],
    exc: [],
    fn: ['Needed for ALT and AST transamination', 'Needed for synthesis of GABA, serotonin, dopamine, norepinephrine and histamine'],
    cause: ['Isoniazid', 'Oral contraceptives'],
    cof: ['ALT / AST (transamination)', 'Glycogen phosphorylase', 'δ-ALA synthase (heme)', 'Cystathionine synthase'],
    note: 'PLP does the transaminations — every amino group moved needs B6.' },

  { id: 'B7', label: 'B7', name: 'Biotin', color: '251, 146, 60', shape: 'capsule',
    role: 'Cofactor for carboxylases that add one carbon.',
    sources: 'Eggs, liver; gut bacteria.',
    def: ['Dermatitis, enteritis and alopecia after months of raw egg whites'],
    exc: [],
    fn: ['Turns pyruvate into oxaloacetate (gluconeogenesis)', 'Turns acetyl-CoA into malonyl-CoA (fatty acid synthesis)'],
    cause: ['Avidin in raw egg whites binds it'],
    cof: ['Pyruvate carboxylase', 'Acetyl-CoA carboxylase', 'Propionyl-CoA carboxylase'],
    note: '“Avidin in egg whites avidly binds biotin.” All three carboxylases add one carbon.' },

  { id: 'B9', label: 'B9', name: 'Folate', color: '74, 222, 128', shape: 'capsule',
    role: 'Becomes tetrahydrofolate (THF) for one-carbon transfers — nucleotide synthesis.',
    sources: 'Leafy greens; absorbed in the jejunum.',
    def: ['Megaloblastic anemia with ↑ homocysteine but NORMAL methylmalonic acid', 'Megaloblastic anemia with NO neurologic findings', 'Neural tube defects in the fetus'],
    exc: [],
    fn: ['Coenzyme for one-carbon (methyl) transfers via THF'],
    cause: ['Phenytoin', 'Trimethoprim', 'Methotrexate', 'Pregnancy and chronic alcohol use'],
    cof: ['Tetrahydrofolate one-carbon transfer'],
    note: 'Foliage in the “jejun”-gle. Stores last only months. Start 1 month before conception.' },

  { id: 'B12', label: 'B12', name: 'Cobalamin', color: '239, 68, 68', shape: 'capsule',
    role: 'Cofactor for methionine synthase and methylmalonyl-CoA mutase.',
    sources: 'Animal products only.',
    def: ['Megaloblastic anemia with ↑ homocysteine AND ↑ methylmalonic acid', 'Subacute combined degeneration — dorsal columns, corticospinal and spinocerebellar tracts', 'Paresthesias with hypersegmented neutrophils'],
    exc: [],
    fn: ['Moves a methyl group as methylcobalamin to make methionine'],
    cause: ['Strict vegan diet', 'Pernicious anemia (no intrinsic factor) or gastric bypass', 'Terminal ileum resection for Crohn disease', 'Diphyllobothrium latum (fish tapeworm)', 'Long-term metformin'],
    cof: ['Methionine synthase', 'Methylmalonyl-CoA mutase'],
    note: 'Stored for years in the liver. Folate can fix the blood but NOT the nerves.' },

  { id: 'C', label: 'C', name: 'Ascorbic acid', color: '253, 186, 116', shape: 'round',
    role: 'Antioxidant; collagen hydroxylation; iron absorption; dopamine → norepinephrine.',
    sources: 'Fruits and vegetables.',
    def: ['Swollen bleeding gums and corkscrew hairs', 'Perifollicular hemorrhages and poor wound healing', 'Hemarthrosis and easy bruising on a “tea and toast” diet'],
    exc: ['Calcium oxalate kidney stones', 'Worsening iron overload in hemochromatosis'],
    fn: ['Hydroxylates proline and lysine in collagen', 'Reduces Fe³⁺ to Fe²⁺ to help iron absorption (and treat methemoglobinemia)'],
    cause: ['“Tea and toast” diet'],
    cof: ['Prolyl / lysyl hydroxylase (collagen)', 'Dopamine β-hydroxylase'],
    note: 'sCurvy = a Collagen hydroxylation problem. “Absorbic” acid helps absorb iron.' },

  { id: 'D', label: 'D', name: 'Calciferol', color: '253, 224, 71', fat: true, shape: 'round',
    role: 'Calcitriol raises gut absorption of Ca²⁺ and phosphate.',
    sources: 'Sunlight on skin (D3), fish, milk; plants/fungi (D2).',
    def: ['Bowed legs (genu varum) in a child', 'Bone pain and muscle weakness in an adult (osteomalacia)', 'Hypocalcemic tetany in a breastfed infant'],
    exc: ['Hypercalcemia in sarcoidosis (macrophages activate it)', 'Hypercalciuria, loss of appetite and stupor'],
    fn: ['25-hydroxylated in the liver, 1α-hydroxylated in the kidney'],
    cause: ['Exclusive breastfeeding without supplements', 'Chronic kidney disease (no 1α-hydroxylation)', 'Little sun exposure, darker skin or prematurity'],
    cof: [],
    note: 'Breastfed infants “Don’t Know” about vitamins D and K — supplement both.' },

  { id: 'E', label: 'E', name: 'Tocopherol', color: '190, 242, 100', fat: true, shape: 'round',
    role: 'Antioxidant protecting RBC and neuronal membranes.',
    sources: 'Vegetable oils, nuts.',
    def: ['Hemolytic anemia with acanthocytes', 'Posterior column and spinocerebellar degeneration WITHOUT megaloblastic anemia', 'Ataxia that mimics Friedreich ataxia'],
    exc: ['Enhances the effect of warfarin', 'Enterocolitis in infants'],
    fn: ['Antioxidant that protects membranes from free-radical damage'],
    cause: [],
    cof: [],
    note: 'Looks like B12 deficiency neurologically — but no megaloblasts and normal MMA.' },

  { id: 'K', label: 'K', name: 'Phylloquinone', color: '34, 197, 94', fat: true, shape: 'round',
    role: 'Cofactor for γ-carboxylation of clotting factors II, VII, IX, X and proteins C and S.',
    sources: 'Leafy greens; gut bacteria.',
    def: ['Newborn bleeding with ↑ PT and ↑ aPTT but normal bleeding time', 'Bleeding after long courses of broad-spectrum antibiotics'],
    exc: [],
    fn: ['γ-carboxylates glutamate on clotting factors', 'Reduced to its active form by epoxide reductase (blocked by warfarin)'],
    cause: ['Sterile neonatal gut and none in breast milk — injection given at birth'],
    cof: ['γ-Glutamyl carboxylase (clotting factors)'],
    note: 'K is for Koagulation.' },

  { id: 'Zn', label: 'Zn', name: 'Zinc', color: '148, 163, 184', shape: 'hex', mineral: true,
    role: 'Needed by 100+ enzymes; forms zinc-finger transcription factors.',
    sources: 'Meat, shellfish.',
    def: ['Delayed wound healing with loss of taste (dysgeusia) and smell (anosmia)', 'Male hypogonadism with loss of adult body hair', 'Rash around body openings and at fingertips, with hair loss and diarrhea'],
    exc: [],
    fn: ['Forms zinc-finger transcription factor motifs'],
    cause: ['Acrodermatitis enteropathica — congenital defect in intestinal absorption'],
    cof: ['Zinc-finger transcription factors'],
    note: 'Acrodermatitis enteropathica: dermatitis + alopecia + diarrhea.' },

  { id: 'KW', label: 'KW', name: 'Kwashiorkor', color: '220, 38, 38', shape: 'bag', pem: true,
    role: 'Protein-deficient malnutrition WITH edema.',
    sources: '',
    def: ['Child with a swollen belly, edema and a fatty liver', 'Edema from low albumin (↓ oncotic pressure)', 'Skin hyperkeratosis and dyspigmentation with anemia'],
    exc: [], fn: [], cause: ['Diet with adequate calories but too little protein'], cof: [],
    note: 'MEALS: Malnutrition, Edema, Anemia, Liver (fatty), Skin lesions.' },

  { id: 'MA', label: 'MA', name: 'Marasmus', color: '161, 98, 7', shape: 'bag', pem: true,
    role: 'Total calorie deficiency WITHOUT edema.',
    sources: '',
    def: ['Severe muscle wasting with NO edema', 'Wasted child whose calories are deficient but no single nutrient is absent'],
    exc: [], fn: [], cause: ['Diet deficient in total calories'], cof: [],
    note: 'Marasmus = Muscle wasting. No edema.' },
];

export const NUTRIENT_BY_ID = Object.fromEntries(NUTRIENTS.map(n => [n.id, n]));

export const EXTRA_FACTS = [
  { t: 'Fat-soluble vitamins', d: 'A, D, E, K need bile, pancreatic enzymes and an intact ileum. Deficient in steatorrhea (cystic fibrosis, celiac) or mineral-oil use; they accumulate, so toxicity is commoner.' },
  { t: 'Water-soluble vitamins', d: 'B1–B12 and C wash out easily — except B12 (stored ~3–4 years) and folate (~3–4 months). B-complex deficiencies share dermatitis, glossitis and diarrhea.' },
  { t: 'Essential fatty acids', d: 'Linoleic acid (ω-6 → arachidonic acid → prostaglandins, leukotrienes) and linolenic acid (ω-3, cardioprotective) must come from the diet. Trans fats raise LDL and lower HDL.' },
  { t: 'Who needs supplements?', d: 'Vegans: B12 (and iron). Raw egg whites: B7 (and B2). Untreated corn: B3. Many diets: vitamin D. Breastfed babies: D and K.' },
];

export const CLUE_TYPES = {
  def: { label: 'Deficiency', icon: '📉', ask: 'Which nutrient is missing?' },
  exc: { label: 'Excess', icon: '📈', ask: 'Too much of which nutrient?' },
  fn: { label: 'Function', icon: '⚙️', ask: 'Which nutrient does this?' },
  cause: { label: 'Cause & diet', icon: '🍽️', ask: 'Which nutrient becomes deficient?' },
};

// Patients who walk into the clinic — paired with the clue type for flavour.
export const PATIENTS = ['🧒', '👵', '🧔', '👩', '👶', '🧑‍🦱', '👨‍🦳', '🤰', '🧑', '👱‍♀️'];
