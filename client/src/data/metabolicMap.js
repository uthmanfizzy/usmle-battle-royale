/**
 * The First Aid "Summary of pathways" map, as a graph you can walk.
 *
 * Nodes are metabolites and edges are the reactions between them, each
 * carrying the enzyme that catalyses it and, where First Aid names one, the
 * disease a deficiency of that enzyme causes. Coordinates place each node on
 * the same canvas the printed figure uses, so the shape on screen is the
 * shape on the page — glycolysis down the middle, gluconeogenesis beside it,
 * the TCA cycle underneath, and the side pathways in their own corners.
 *
 * WHAT IS DELIBERATELY ABSENT: an enzyme is given only where it is a single
 * named enzyme worth recalling. A step that is really a sequence — fatty
 * acids to acetyl-CoA, mevalonate to cholesterol — carries `enzyme: null`
 * and is simply never asked as an enzyme question. Guessing at a name for
 * those would teach something untrue, which is worse than teaching nothing.
 *
 * ALIASES exist because a student types what they say out loud. "G6P",
 * "glucose 6 phosphate" and "glucose-6-phosphate" are the same answer, and a
 * run that rejects two of the three is testing typing, not biochemistry.
 */

// The numbers in First Aid's own key, kept so a step can be matched back to
// the figure the student is revising from.
export const FIGURE_NUMBERS = {
  galactokinase: 1,
  gal1p_uridyltransferase: 2,
  hexokinase: 3,
  g6pase: 4,
  g6pd: 5,
  transketolase: 6,
  pfk1: 7,
  fbpase1: 8,
  fructokinase: 9,
  aldolase_b_fructose: 10,
  aldolase: 11,
  tpi: 12,
  pyruvate_kinase: 13,
  pdh: 14,
  pyruvate_carboxylase: 15,
  pepck: 16,
  citrate_synthase: 17,
  idh: 18,
  akgdh: 19,
  cps1: 20,
  otc: 21,
  propionyl_coa_carboxylase: 22,
  hmg_coa_reductase: 23,
};

// Which coloured region of the figure a node belongs to. Used for the map's
// backdrop blocks and for the "where am I" line under the score.
export const REGIONS = {
  glycolysis:      { label: 'Glycolysis',                 rgb: '214, 211, 63'  },
  gluconeogenesis: { label: 'Gluconeogenesis',            rgb: '198, 140, 214' },
  glycogen:        { label: 'Glycogenesis / glycogenolysis', rgb: '216, 160, 92' },
  galactose:       { label: 'Galactose metabolism',       rgb: '96, 165, 214'  },
  fructose:        { label: 'Fructose metabolism',        rgb: '96, 165, 214'  },
  hmp:             { label: 'HMP shunt',                  rgb: '150, 150, 220' },
  lipid:           { label: 'Lipid metabolism',           rgb: '226, 160, 92'  },
  ketogenesis:     { label: 'Ketogenesis',                rgb: '220, 130, 170' },
  tca:             { label: 'TCA cycle',                  rgb: '160, 150, 220' },
  urea:            { label: 'Urea cycle',                 rgb: '96, 165, 214'  },
  protein:         { label: 'Protein metabolism',         rgb: '150, 200, 90'  },
};

// id, label, aliases, region, and where it sits on the 1000x1040 canvas.
export const NODES = [
  // ── Galactose ────────────────────────────────────────────────────────
  { id: 'galactose', label: 'Galactose', region: 'galactose', x: 300, y: 48,
    aliases: ['gal'] },
  { id: 'gal1p', label: 'Galactose-1-phosphate', region: 'galactose', x: 300, y: 112,
    aliases: ['gal 1 p', 'gal1p', 'galactose 1 p', 'galactose 1 phosphate'] },

  // ── Glycogen ─────────────────────────────────────────────────────────
  { id: 'glycogen', label: 'Glycogen', region: 'glycogen', x: 92, y: 118, aliases: [] },
  { id: 'udp_glucose', label: 'UDP-glucose', region: 'glycogen', x: 92, y: 182,
    aliases: ['udp glucose', 'udpg'] },
  { id: 'g1p', label: 'Glucose-1-phosphate', region: 'glycogen', x: 230, y: 182,
    aliases: ['g1p', 'glucose 1 p', 'glucose 1 phosphate'] },

  // ── Glycolysis spine ─────────────────────────────────────────────────
  { id: 'glucose', label: 'Glucose', region: 'glycolysis', x: 452, y: 112, aliases: [] },
  { id: 'g6p', label: 'Glucose-6-phosphate', region: 'glycolysis', x: 452, y: 182,
    aliases: ['g6p', 'glucose 6 p', 'glucose 6 phosphate'] },
  { id: 'f6p', label: 'Fructose-6-phosphate', region: 'glycolysis', x: 452, y: 252,
    aliases: ['f6p', 'fructose 6 p', 'fructose 6 phosphate'] },
  { id: 'f16bp', label: 'Fructose-1,6-bisphosphate', region: 'glycolysis', x: 452, y: 322,
    aliases: ['f16bp', 'f 1 6 bp', 'fructose 1 6 bisphosphate', 'fructose 16 bisphosphate',
      'fructose 1 6 biphosphate', 'fdp'] },
  { id: 'g3p', label: 'Glyceraldehyde-3-phosphate', region: 'glycolysis', x: 452, y: 400,
    aliases: ['g3p', 'gap', 'glyceraldehyde 3 p', 'glyceraldehyde 3 phosphate'] },
  { id: 'dhap', label: 'DHAP', region: 'glycolysis', x: 596, y: 400,
    aliases: ['dihydroxyacetone phosphate'] },
  { id: 'bpg13', label: '1,3-bisphosphoglycerate', region: 'glycolysis', x: 452, y: 466,
    aliases: ['13bpg', '1 3 bpg', '1 3 bisphosphoglycerate', '1 3 biphosphoglycerate'] },
  { id: 'pg3', label: '3-phosphoglycerate', region: 'glycolysis', x: 452, y: 526,
    aliases: ['3pg', '3 phosphoglycerate'] },
  { id: 'pg2', label: '2-phosphoglycerate', region: 'glycolysis', x: 452, y: 586,
    aliases: ['2pg', '2 phosphoglycerate'] },
  { id: 'pep', label: 'Phosphoenolpyruvate', region: 'glycolysis', x: 452, y: 646,
    aliases: ['pep', 'phosphoenol pyruvate'] },
  { id: 'pyruvate', label: 'Pyruvate', region: 'glycolysis', x: 528, y: 706, aliases: [] },
  { id: 'lactate', label: 'Lactate', region: 'glycolysis', x: 650, y: 706,
    aliases: ['lactic acid'] },
  { id: 'alanine', label: 'Alanine', region: 'glycolysis', x: 390, y: 706,
    aliases: ['ala'] },
  { id: 'acetyl_coa', label: 'Acetyl-CoA', region: 'glycolysis', x: 528, y: 776,
    aliases: ['acetyl coa', 'acetylcoa', 'acetyl co a'] },

  // ── HMP shunt ────────────────────────────────────────────────────────
  { id: 'pgl6', label: '6-phosphogluconolactone', region: 'hmp', x: 700, y: 182,
    aliases: ['6 phosphogluconolactone', '6pgl'] },
  { id: 'ribulose5p', label: 'Ribulose-5-phosphate', region: 'hmp', x: 700, y: 248,
    aliases: ['ribulose 5 p', 'ribulose 5 phosphate', 'r5p', 'ru5p'] },

  // ── Fructose ─────────────────────────────────────────────────────────
  { id: 'fructose', label: 'Fructose', region: 'fructose', x: 880, y: 322, aliases: [] },
  { id: 'f1p', label: 'Fructose-1-phosphate', region: 'fructose', x: 740, y: 322,
    aliases: ['f1p', 'fructose 1 p', 'fructose 1 phosphate'] },
  { id: 'glyceraldehyde', label: 'Glyceraldehyde', region: 'fructose', x: 740, y: 384,
    aliases: [] },

  // ── Lipid ────────────────────────────────────────────────────────────
  { id: 'glycerol', label: 'Glycerol', region: 'lipid', x: 744, y: 466, aliases: [] },
  { id: 'triglycerides', label: 'Triglycerides', region: 'lipid', x: 744, y: 528,
    aliases: ['tg', 'triacylglycerol', 'triacylglycerols'] },
  { id: 'fatty_acids', label: 'Fatty acids', region: 'lipid', x: 744, y: 590,
    aliases: ['fatty acid', 'ffa', 'free fatty acids'] },
  { id: 'malonyl_coa', label: 'Malonyl-CoA', region: 'lipid', x: 700, y: 652,
    aliases: ['malonyl coa', 'malonylcoa'] },

  // ── Ketogenesis & cholesterol ────────────────────────────────────────
  { id: 'acetoacetyl_coa', label: 'Acetoacetyl-CoA', region: 'ketogenesis', x: 700, y: 776,
    aliases: ['acetoacetyl coa', 'acetoacetylcoa'] },
  { id: 'hmg_coa', label: 'HMG-CoA', region: 'ketogenesis', x: 846, y: 776,
    aliases: ['hmg coa', 'hmgcoa', 'hydroxymethylglutaryl coa'] },
  { id: 'mevalonate', label: 'Mevalonate', region: 'ketogenesis', x: 940, y: 720,
    aliases: [] },
  { id: 'cholesterol', label: 'Cholesterol', region: 'ketogenesis', x: 940, y: 660,
    aliases: [] },
  { id: 'acetoacetate', label: 'Acetoacetate', region: 'ketogenesis', x: 912, y: 838,
    aliases: [] },
  { id: 'bhb', label: 'β-hydroxybutyrate', region: 'ketogenesis', x: 912, y: 898,
    aliases: ['b hydroxybutyrate', 'beta hydroxybutyrate', 'bhb', '3 hydroxybutyrate'] },

  // ── TCA cycle ────────────────────────────────────────────────────────
  { id: 'citrate', label: 'Citrate', region: 'tca', x: 540, y: 838, aliases: [] },
  { id: 'isocitrate', label: 'Isocitrate', region: 'tca', x: 622, y: 886, aliases: [] },
  { id: 'akg', label: 'α-ketoglutarate', region: 'tca', x: 622, y: 948,
    aliases: ['a ketoglutarate', 'alpha ketoglutarate', 'akg', 'oxoglutarate',
      'alpha oxoglutarate'] },
  { id: 'succinyl_coa', label: 'Succinyl-CoA', region: 'tca', x: 540, y: 994,
    aliases: ['succinyl coa', 'succinylcoa'] },
  { id: 'succinate', label: 'Succinate', region: 'tca', x: 430, y: 994, aliases: [] },
  { id: 'fumarate', label: 'Fumarate', region: 'tca', x: 352, y: 948, aliases: [] },
  { id: 'malate', label: 'Malate', region: 'tca', x: 352, y: 886, aliases: [] },
  { id: 'oxaloacetate', label: 'Oxaloacetate', region: 'tca', x: 430, y: 838,
    aliases: ['oaa', 'oxaloacetic acid'] },

  // ── Urea cycle ───────────────────────────────────────────────────────
  { id: 'nh3_co2', label: 'NH₃ + CO₂', region: 'urea', x: 60, y: 838,
    aliases: ['nh3 co2', 'ammonia and carbon dioxide', 'ammonia co2', 'nh3 and co2'] },
  { id: 'carbamoyl_phosphate', label: 'Carbamoyl phosphate', region: 'urea', x: 60, y: 898,
    aliases: ['carbamoyl po4', 'carbamyl phosphate'] },
  { id: 'citrulline', label: 'Citrulline', region: 'urea', x: 176, y: 866, aliases: [] },
  { id: 'aspartate', label: 'Aspartate', region: 'urea', x: 254, y: 838,
    aliases: ['asp', 'aspartic acid'] },
  { id: 'argininosuccinate', label: 'Argininosuccinate', region: 'urea', x: 254, y: 900,
    aliases: ['arginino succinate'] },
  { id: 'arginine', label: 'Arginine', region: 'urea', x: 230, y: 962, aliases: ['arg'] },
  { id: 'ornithine', label: 'Ornithine', region: 'urea', x: 92, y: 962, aliases: [] },
  { id: 'urea', label: 'Urea', region: 'urea', x: 150, y: 1012, aliases: [] },

  // ── Protein metabolism ───────────────────────────────────────────────
  { id: 'propionyl_coa', label: 'Propionyl-CoA', region: 'protein', x: 846, y: 962,
    aliases: ['propionyl coa', 'propionylcoa'] },
  { id: 'methylmalonyl_coa', label: 'Methylmalonyl-CoA', region: 'protein', x: 724, y: 962,
    aliases: ['methylmalonyl coa', 'methylmalonylcoa', 'mma coa'] },
];

/**
 * Reactions. `from`/`to` are node ids; `both: true` means the arrow runs in
 * each direction and the step can be walked either way.
 *
 * enzyme      what catalyses it, or null where the step is a sequence rather
 *             than one named enzyme — those are never asked as enzyme steps.
 * disease     what a deficiency causes, where First Aid names one.
 * cofactor    'biotin' | 'tpp' | 'b12', the markers on the printed figure.
 * irreversible  the figure's # — a regulated, one-way step.
 */
export const EDGES = [
  // ── Galactose ────────────────────────────────────────────────────────
  { from: 'galactose', to: 'gal1p', key: 'galactokinase',
    enzyme: 'Galactokinase', enzymeAliases: ['galactokinase', 'gk'],
    disease: 'Galactokinase deficiency', diseaseAliases: ['galactokinase deficiency',
      'mild galactosemia', 'galactosemia', 'non classic galactosemia'] },
  { from: 'gal1p', to: 'g1p', key: 'gal1p_uridyltransferase',
    enzyme: 'Galactose-1-phosphate uridyltransferase',
    enzymeAliases: ['galactose 1 phosphate uridyltransferase', 'galt', 'uridyltransferase',
      'gal 1 p uridyltransferase'],
    disease: 'Classic galactosemia', diseaseAliases: ['classic galactosemia',
      'classical galactosemia', 'galactosemia', 'severe galactosemia'] },

  // ── Glycogen ─────────────────────────────────────────────────────────
  { from: 'g1p', to: 'udp_glucose', key: 'udp_glucose_pyrophosphorylase',
    enzyme: 'UDP-glucose pyrophosphorylase',
    enzymeAliases: ['udp glucose pyrophosphorylase', 'udp glucose phosphorylase'] },
  { from: 'udp_glucose', to: 'glycogen', key: 'glycogen_synthase',
    enzyme: 'Glycogen synthase', enzymeAliases: ['glycogen synthase', 'glycogen synthetase'] },
  { from: 'glycogen', to: 'g1p', key: 'glycogen_phosphorylase',
    enzyme: 'Glycogen phosphorylase',
    enzymeAliases: ['glycogen phosphorylase', 'phosphorylase'],
    disease: 'McArdle disease', diseaseAliases: ['mcardle disease', 'mcardle',
      'mcardles disease', 'type v glycogen storage disease', 'glycogen storage disease type 5'] },
  { from: 'g1p', to: 'g6p', key: 'phosphoglucomutase', both: true,
    enzyme: 'Phosphoglucomutase', enzymeAliases: ['phosphoglucomutase'] },

  // ── Glycolysis ───────────────────────────────────────────────────────
  { from: 'glucose', to: 'g6p', key: 'hexokinase', irreversible: true,
    enzyme: 'Hexokinase / glucokinase',
    enzymeAliases: ['hexokinase', 'glucokinase', 'hexokinase glucokinase',
      'hexokinase or glucokinase'] },
  { from: 'g6p', to: 'glucose', key: 'g6pase', irreversible: true,
    enzyme: 'Glucose-6-phosphatase', enzymeAliases: ['glucose 6 phosphatase', 'g6pase'],
    disease: 'Von Gierke disease', diseaseAliases: ['von gierke disease', 'von gierke',
      'von gierkes disease', 'type i glycogen storage disease',
      'glycogen storage disease type 1'] },
  { from: 'g6p', to: 'f6p', key: 'phosphoglucose_isomerase', both: true,
    enzyme: 'Phosphoglucose isomerase',
    enzymeAliases: ['phosphoglucose isomerase', 'phosphohexose isomerase',
      'glucose 6 phosphate isomerase'] },
  { from: 'f6p', to: 'f16bp', key: 'pfk1', irreversible: true,
    enzyme: 'Phosphofructokinase-1', enzymeAliases: ['phosphofructokinase 1', 'pfk1', 'pfk'] },
  { from: 'f16bp', to: 'f6p', key: 'fbpase1', irreversible: true,
    enzyme: 'Fructose-1,6-bisphosphatase 1',
    enzymeAliases: ['fructose 1 6 bisphosphatase', 'fructose 1 6 bisphosphatase 1',
      'fbpase', 'fbpase 1', 'fructose 1 6 biphosphatase'] },
  { from: 'f16bp', to: 'g3p', key: 'aldolase', both: true,
    enzyme: 'Aldolase B (liver), A (muscle)',
    enzymeAliases: ['aldolase', 'aldolase a', 'aldolase b', 'aldolase b liver a muscle'] },
  { from: 'f16bp', to: 'dhap', key: 'aldolase_dhap', both: true,
    enzyme: 'Aldolase B (liver), A (muscle)',
    enzymeAliases: ['aldolase', 'aldolase a', 'aldolase b'] },
  { from: 'dhap', to: 'g3p', key: 'tpi', both: true,
    enzyme: 'Triose phosphate isomerase',
    enzymeAliases: ['triose phosphate isomerase', 'tpi', 'triosephosphate isomerase'] },
  { from: 'g3p', to: 'bpg13', key: 'gapdh', both: true,
    enzyme: 'Glyceraldehyde-3-phosphate dehydrogenase',
    enzymeAliases: ['glyceraldehyde 3 phosphate dehydrogenase', 'gapdh', 'g3p dehydrogenase'] },
  { from: 'bpg13', to: 'pg3', key: 'pgk', both: true,
    enzyme: 'Phosphoglycerate kinase', enzymeAliases: ['phosphoglycerate kinase', 'pgk'] },
  { from: 'pg3', to: 'pg2', key: 'pgm', both: true,
    enzyme: 'Phosphoglycerate mutase', enzymeAliases: ['phosphoglycerate mutase', 'pgm'] },
  { from: 'pg2', to: 'pep', key: 'enolase', both: true,
    enzyme: 'Enolase', enzymeAliases: ['enolase'] },
  { from: 'pep', to: 'pyruvate', key: 'pyruvate_kinase', irreversible: true,
    enzyme: 'Pyruvate kinase', enzymeAliases: ['pyruvate kinase', 'pk'],
    disease: 'Pyruvate kinase deficiency',
    diseaseAliases: ['pyruvate kinase deficiency', 'pk deficiency',
      'hemolytic anemia', 'haemolytic anaemia'] },
  { from: 'pyruvate', to: 'lactate', key: 'ldh', both: true,
    enzyme: 'Lactate dehydrogenase', enzymeAliases: ['lactate dehydrogenase', 'ldh'] },
  { from: 'pyruvate', to: 'alanine', key: 'alt', both: true,
    enzyme: 'Alanine aminotransferase',
    enzymeAliases: ['alanine aminotransferase', 'alt', 'alanine transaminase'] },
  { from: 'pyruvate', to: 'acetyl_coa', key: 'pdh', irreversible: true, cofactor: 'tpp',
    enzyme: 'Pyruvate dehydrogenase',
    enzymeAliases: ['pyruvate dehydrogenase', 'pdh', 'pyruvate dehydrogenase complex'],
    disease: 'Pyruvate dehydrogenase deficiency',
    diseaseAliases: ['pyruvate dehydrogenase deficiency', 'pdh deficiency',
      'lactic acidosis'] },

  // ── Gluconeogenesis ──────────────────────────────────────────────────
  { from: 'pyruvate', to: 'oxaloacetate', key: 'pyruvate_carboxylase',
    irreversible: true, cofactor: 'biotin',
    enzyme: 'Pyruvate carboxylase', enzymeAliases: ['pyruvate carboxylase', 'pc'] },
  { from: 'oxaloacetate', to: 'pep', key: 'pepck', irreversible: true,
    enzyme: 'PEP carboxykinase',
    enzymeAliases: ['pep carboxykinase', 'pepck', 'phosphoenolpyruvate carboxykinase'] },

  // ── HMP shunt ────────────────────────────────────────────────────────
  { from: 'g6p', to: 'pgl6', key: 'g6pd', irreversible: true,
    enzyme: 'Glucose-6-phosphate dehydrogenase',
    enzymeAliases: ['glucose 6 phosphate dehydrogenase', 'g6pd', 'g 6 pd'],
    disease: 'G6PD deficiency',
    diseaseAliases: ['g6pd deficiency', 'glucose 6 phosphate dehydrogenase deficiency',
      'hemolytic anemia', 'haemolytic anaemia'] },
  { from: 'pgl6', to: 'ribulose5p', key: 'pgd', enzyme: null },
  { from: 'ribulose5p', to: 'f6p', key: 'transketolase_f6p', cofactor: 'tpp',
    enzyme: 'Transketolase', enzymeAliases: ['transketolase'] },
  { from: 'ribulose5p', to: 'g3p', key: 'transketolase_g3p', cofactor: 'tpp',
    enzyme: 'Transketolase', enzymeAliases: ['transketolase'] },

  // ── Fructose ─────────────────────────────────────────────────────────
  { from: 'fructose', to: 'f1p', key: 'fructokinase',
    enzyme: 'Fructokinase', enzymeAliases: ['fructokinase'],
    disease: 'Essential fructosuria',
    diseaseAliases: ['essential fructosuria', 'fructosuria'] },
  { from: 'f1p', to: 'dhap', key: 'aldolase_b_fructose',
    enzyme: 'Aldolase B', enzymeAliases: ['aldolase b', 'aldolase'],
    disease: 'Hereditary fructose intolerance',
    diseaseAliases: ['hereditary fructose intolerance', 'fructose intolerance'] },
  { from: 'f1p', to: 'glyceraldehyde', key: 'aldolase_b_glyceraldehyde',
    enzyme: 'Aldolase B', enzymeAliases: ['aldolase b', 'aldolase'],
    disease: 'Hereditary fructose intolerance',
    diseaseAliases: ['hereditary fructose intolerance', 'fructose intolerance'] },
  { from: 'glyceraldehyde', to: 'g3p', key: 'triose_kinase',
    enzyme: 'Triose kinase', enzymeAliases: ['triose kinase', 'triokinase'] },

  // ── Lipid ────────────────────────────────────────────────────────────
  { from: 'glycerol', to: 'dhap', key: 'glycerol_kinase',
    enzyme: 'Glycerol kinase', enzymeAliases: ['glycerol kinase'] },
  { from: 'triglycerides', to: 'glycerol', key: 'lipase', both: true,
    enzyme: 'Hormone-sensitive lipase',
    enzymeAliases: ['hormone sensitive lipase', 'lipase', 'hsl'] },
  { from: 'triglycerides', to: 'fatty_acids', key: 'lipase_fa', both: true,
    enzyme: 'Hormone-sensitive lipase',
    enzymeAliases: ['hormone sensitive lipase', 'lipase', 'hsl'] },
  { from: 'fatty_acids', to: 'acetyl_coa', key: 'beta_oxidation', enzyme: null },
  { from: 'acetyl_coa', to: 'malonyl_coa', key: 'acc', cofactor: 'biotin',
    enzyme: 'Acetyl-CoA carboxylase',
    enzymeAliases: ['acetyl coa carboxylase', 'acc', 'acetylcoa carboxylase'] },
  { from: 'malonyl_coa', to: 'fatty_acids', key: 'fas',
    enzyme: 'Fatty acid synthase', enzymeAliases: ['fatty acid synthase', 'fas'] },

  // ── Ketogenesis & cholesterol ────────────────────────────────────────
  { from: 'acetyl_coa', to: 'acetoacetyl_coa', key: 'thiolase', both: true,
    enzyme: 'Thiolase', enzymeAliases: ['thiolase', 'acetyl coa acetyltransferase'] },
  { from: 'acetoacetyl_coa', to: 'hmg_coa', key: 'hmg_coa_synthase',
    enzyme: 'HMG-CoA synthase', enzymeAliases: ['hmg coa synthase', 'hmgcoa synthase'] },
  { from: 'hmg_coa', to: 'mevalonate', key: 'hmg_coa_reductase',
    enzyme: 'HMG-CoA reductase',
    enzymeAliases: ['hmg coa reductase', 'hmgcoa reductase', 'hmgcr'] },
  { from: 'mevalonate', to: 'cholesterol', key: 'cholesterol_synthesis', enzyme: null },
  { from: 'hmg_coa', to: 'acetoacetate', key: 'hmg_coa_lyase',
    enzyme: 'HMG-CoA lyase', enzymeAliases: ['hmg coa lyase', 'hmgcoa lyase'] },
  { from: 'acetoacetate', to: 'bhb', key: 'bhb_dehydrogenase', both: true,
    enzyme: 'β-hydroxybutyrate dehydrogenase',
    enzymeAliases: ['b hydroxybutyrate dehydrogenase', 'beta hydroxybutyrate dehydrogenase',
      'bhb dehydrogenase', '3 hydroxybutyrate dehydrogenase'] },

  // ── TCA cycle ────────────────────────────────────────────────────────
  { from: 'acetyl_coa', to: 'citrate', key: 'citrate_synthase',
    enzyme: 'Citrate synthase', enzymeAliases: ['citrate synthase', 'citrate synthetase'] },
  { from: 'oxaloacetate', to: 'citrate', key: 'citrate_synthase_oaa',
    enzyme: 'Citrate synthase', enzymeAliases: ['citrate synthase', 'citrate synthetase'] },
  { from: 'citrate', to: 'isocitrate', key: 'aconitase',
    enzyme: 'Aconitase', enzymeAliases: ['aconitase'] },
  { from: 'isocitrate', to: 'akg', key: 'idh',
    enzyme: 'Isocitrate dehydrogenase',
    enzymeAliases: ['isocitrate dehydrogenase', 'idh'] },
  { from: 'akg', to: 'succinyl_coa', key: 'akgdh', cofactor: 'tpp',
    enzyme: 'α-ketoglutarate dehydrogenase',
    enzymeAliases: ['a ketoglutarate dehydrogenase', 'alpha ketoglutarate dehydrogenase',
      'akgdh', 'alpha kg dehydrogenase'] },
  { from: 'succinyl_coa', to: 'succinate', key: 'succinyl_coa_synthetase',
    enzyme: 'Succinyl-CoA synthetase',
    enzymeAliases: ['succinyl coa synthetase', 'succinate thiokinase',
      'succinyl coa synthase'] },
  { from: 'succinate', to: 'fumarate', key: 'sdh',
    enzyme: 'Succinate dehydrogenase',
    enzymeAliases: ['succinate dehydrogenase', 'sdh', 'complex ii'] },
  { from: 'fumarate', to: 'malate', key: 'fumarase',
    enzyme: 'Fumarase', enzymeAliases: ['fumarase', 'fumarate hydratase'] },
  { from: 'malate', to: 'oxaloacetate', key: 'mdh', both: true,
    enzyme: 'Malate dehydrogenase', enzymeAliases: ['malate dehydrogenase', 'mdh'] },

  // ── Urea cycle ───────────────────────────────────────────────────────
  { from: 'nh3_co2', to: 'carbamoyl_phosphate', key: 'cps1',
    enzyme: 'Carbamoyl phosphate synthetase I',
    enzymeAliases: ['carbamoyl phosphate synthetase i', 'carbamoyl phosphate synthetase 1',
      'cps i', 'cps1', 'cps'],
    disease: 'CPS I deficiency',
    diseaseAliases: ['cps i deficiency', 'cps1 deficiency',
      'carbamoyl phosphate synthetase i deficiency', 'hyperammonemia'] },
  { from: 'carbamoyl_phosphate', to: 'citrulline', key: 'otc',
    enzyme: 'Ornithine transcarbamylase',
    enzymeAliases: ['ornithine transcarbamylase', 'otc', 'ornithine transcarbamoylase'],
    disease: 'OTC deficiency',
    diseaseAliases: ['otc deficiency', 'ornithine transcarbamylase deficiency',
      'hyperammonemia', 'orotic aciduria'] },
  { from: 'ornithine', to: 'citrulline', key: 'otc_ornithine',
    enzyme: 'Ornithine transcarbamylase',
    enzymeAliases: ['ornithine transcarbamylase', 'otc'] },
  { from: 'citrulline', to: 'argininosuccinate', key: 'ass',
    enzyme: 'Argininosuccinate synthetase',
    enzymeAliases: ['argininosuccinate synthetase', 'argininosuccinate synthase', 'ass'] },
  // Aspartate had no reaction leading INTO it, so nowhere on the map could
  // reach it — the urea cycle's nitrogen donor was a box you could only ever
  // look at. Transamination from oxaloacetate is where it actually comes
  // from, and it joins the cycle to the TCA beside it.
  { from: 'oxaloacetate', to: 'aspartate', key: 'ast', both: true,
    enzyme: 'Aspartate aminotransferase',
    enzymeAliases: ['aspartate aminotransferase', 'ast', 'aspartate transaminase',
      'got', 'glutamate oxaloacetate transaminase'] },
  { from: 'aspartate', to: 'argininosuccinate', key: 'ass_asp',
    enzyme: 'Argininosuccinate synthetase',
    enzymeAliases: ['argininosuccinate synthetase', 'argininosuccinate synthase', 'ass'] },
  { from: 'argininosuccinate', to: 'arginine', key: 'asl',
    enzyme: 'Argininosuccinase',
    enzymeAliases: ['argininosuccinase', 'argininosuccinate lyase', 'asl'] },
  { from: 'argininosuccinate', to: 'fumarate', key: 'asl_fumarate',
    enzyme: 'Argininosuccinase',
    enzymeAliases: ['argininosuccinase', 'argininosuccinate lyase', 'asl'] },
  { from: 'arginine', to: 'urea', key: 'arginase',
    enzyme: 'Arginase', enzymeAliases: ['arginase'] },
  { from: 'arginine', to: 'ornithine', key: 'arginase_ornithine',
    enzyme: 'Arginase', enzymeAliases: ['arginase'] },

  // ── Protein metabolism ───────────────────────────────────────────────
  { from: 'propionyl_coa', to: 'methylmalonyl_coa', key: 'propionyl_coa_carboxylase',
    cofactor: 'biotin',
    enzyme: 'Propionyl-CoA carboxylase',
    enzymeAliases: ['propionyl coa carboxylase', 'propionylcoa carboxylase', 'pcc'] },
  { from: 'methylmalonyl_coa', to: 'succinyl_coa', key: 'mm_coa_mutase', cofactor: 'b12',
    enzyme: 'Methylmalonyl-CoA mutase',
    enzymeAliases: ['methylmalonyl coa mutase', 'methylmalonylcoa mutase', 'mcm'] },
];

/**
 * Where a run can begin. Each is a junction a student will recognise, so the
 * first move is never a guess into the dark.
 *
 * There is one for every region, and that is not decoration. Reactions run
 * the way the biochemistry runs: galactose, fructose, the urea cycle and
 * propionyl-CoA all flow INTO the central spine and never back out of it, so
 * a run that could only ever start at glucose could never reach them — a
 * third of the map would be unvisitable. Rather than let the walk cross an
 * arrow backwards, which would teach the pathway wrong, each of those
 * corners is somewhere you can start.
 */
export const START_POINTS = [
  { id: 'glucose',       title: 'Glucose',       blurb: 'The top of glycolysis.' },
  { id: 'pyruvate',      title: 'Pyruvate',      blurb: 'The glycolysis / TCA junction.' },
  { id: 'acetyl_coa',    title: 'Acetyl-CoA',    blurb: 'The gateway to the TCA cycle.' },
  { id: 'citrate',       title: 'Citrate',       blurb: 'Straight into the TCA cycle.' },
  { id: 'galactose',     title: 'Galactose',     blurb: 'Galactose metabolism, from the top.' },
  { id: 'fructose',      title: 'Fructose',      blurb: 'Fructose metabolism, from the top.' },
  { id: 'glycogen',      title: 'Glycogen',      blurb: 'Glycogenolysis into glycolysis.' },
  { id: 'triglycerides', title: 'Triglycerides', blurb: 'Lipid metabolism and ketogenesis.' },
  { id: 'nh3_co2',       title: 'NH₃ + CO₂',     blurb: 'The urea cycle, from the start.' },
  { id: 'propionyl_coa', title: 'Propionyl-CoA', blurb: 'Protein metabolism into the TCA.' },
];

export const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));

/**
 * Loose enough that a student is answering biochemistry rather than
 * spelling: case, accents, hyphens, commas, Greek letters, the word "acid"
 * and every kind of whitespace all stop mattering.
 */
export function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/β/g, 'b').replace(/α/g, 'a').replace(/γ/g, 'g')
    .replace(/₂/g, '2').replace(/₃/g, '3')
    .replace(/[-–—_,.'’()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const expand = (label, aliases) => {
  const all = new Set([normalise(label), ...(aliases || []).map(normalise)]);
  all.delete('');
  return all;
};

export function nodeAnswers(node) {
  return expand(node.label, node.aliases);
}

export function enzymeAnswers(edge) {
  return edge.enzyme ? expand(edge.enzyme, edge.enzymeAliases) : new Set();
}

export function diseaseAnswers(edge) {
  return edge.disease ? expand(edge.disease, edge.diseaseAliases) : new Set();
}

export function matches(answer, accepted) {
  return accepted.has(normalise(answer));
}

/** Every step leaving a node, with the direction already resolved. */
export function stepsFrom(nodeId) {
  const out = [];
  for (const e of EDGES) {
    if (e.from === nodeId) out.push({ edge: e, to: e.to });
    else if (e.both && e.to === nodeId) out.push({ edge: e, to: e.from });
  }
  // A pair of nodes can be joined by more than one reaction (pyruvate and
  // oxaloacetate, say). Keep the first — the walk only needs one way across.
  const seen = new Set();
  return out.filter(s => (seen.has(s.to) ? false : seen.add(s.to)));
}
