/**
 * HY Diseases · Immunology — Qbank-only cases (no animated Clinic).
 *
 * A case: id (prefixed im_ so ids never clash with Biochemistry), name,
 * chapter, tag (mechanism / inheritance chip), lookalikes { otherId: why-not }
 * (exactly three, all Immunology ids), and the Qbank card fields:
 *   s   stem with **highlighted clues**      w   { clue: why it happens }
 *   x   plain explanation                     hy  1–2 Step 1 points
 *   vs  the closest lookalike's id (its why-not line is the contrast shown)
 *
 * Disease list follows the First Aid immunology chapter; all wording is
 * original. Run tools/hyd-check.mjs after editing.
 */

export const IMMUNO_CHAPTERS = [
  { id: 'bcell', name: 'B-cell', icon: '🅱️', blurb: 'Antibody deficiencies', tint: '96, 165, 250' },
  { id: 'tcell', name: 'T-cell & combined', icon: '🛡️', blurb: 'Thymus, MHC, SCID and friends', tint: '167, 139, 250' },
  { id: 'phago', name: 'Phagocytes & complement', icon: '🦠', blurb: 'Neutrophils, complement, spleen', tint: '45, 212, 191' },
  { id: 'hyper', name: 'Hypersensitivity & transfusion', icon: '🩸', blurb: 'Types I–IV, transfusion reactions', tint: '244, 114, 182' },
  { id: 'transplant', name: 'Transplant', icon: '🫀', blurb: 'Rejection and GVHD', tint: '251, 191, 36' },
];

export const IMMUNO_CASES = [
  // ── B-cell ─────────────────────────────────────────────────────────────
  {
    id: 'im_bruton', name: 'X-linked (Bruton) agammaglobulinemia', chapter: 'bcell', tag: 'X-linked recessive (BTK)',
    s: 'A 10-month-old boy has had recurrent ear infections and two pneumonias, all **starting after 6 months of age**. He has **no visible tonsils** and tiny lymph nodes. Flow cytometry shows **almost no B cells**; IgG, IgA and IgM are all very low.',
    w: {
      'starting after 6 months of age': 'The mother\'s IgG crosses the placenta and protects the baby for the first months. It fades by about 6 months, and then the infections begin.',
      'no visible tonsils': 'Tonsils and lymph nodes are mostly made of B-cell follicles. With no B cells, they barely form.',
      'almost no B cells': 'BTK is a tyrosine kinase that pre-B cells need to finish maturing. Without it, B cells never reach the blood.',
    },
    x: 'BTK is needed for B cells to mature in the bone marrow. Without it there are no mature B cells, no plasma cells and no antibodies of any class. The baby is protected by the mother\'s IgG at first, then gets repeated bacterial infections with encapsulated organisms and enteroviruses.',
    hy: ['Bruton agammaglobulinemia is X-linked recessive (BTK), so it affects boys: B cells and all immunoglobulin classes are absent.', 'Live vaccines are contraindicated, and enteroviruses (polio, echovirus) can cause chronic infection; treat with IVIG.'],
    lookalikes: {
      im_cvid: 'CVID has B cells in normal numbers that fail to become plasma cells, and it usually shows after puberty.',
      im_hyperigm: 'Hyper-IgM has normal B cells and normal or HIGH IgM, with Pneumocystis and Cryptosporidium infections.',
      im_scid: 'SCID also lacks T cells, giving thrush, chronic diarrhoea, viral infections and no thymic shadow from the first months.',
    },
    vs: 'im_cvid',
  },
  {
    id: 'im_iga', name: 'Selective IgA deficiency', chapter: 'bcell', tag: 'Most common primary immunodeficiency',
    s: 'A 25-year-old man has a **severe allergic reaction during his first blood transfusion**, with hypotension and wheeze. He has had frequent sinus infections and has **coeliac disease**. IgG and IgM are normal.',
    w: {
      'severe allergic reaction during his first blood transfusion': 'His immune system has never seen IgA, so it treats the IgA in donor plasma as foreign. His anti-IgA antibodies trigger anaphylaxis.',
      'coeliac disease': 'Low IgA goes with autoimmune disease, and coeliac is the classic one. IgA-based coeliac tests can also come back falsely negative.',
    },
    x: 'IgA protects mucosal surfaces such as the airways and gut. In selective IgA deficiency, IgA is very low while IgG and IgM are normal. Most people have no symptoms, but some get sinus, lung and gut infections (such as giardia), autoimmune disease, allergies, and anaphylaxis to blood products that contain IgA.',
    hy: ['Selective IgA deficiency is the most common primary immunodeficiency; it causes false-negative IgA-based coeliac tests.', 'Give washed or IgA-deficient blood products to avoid transfusion anaphylaxis.'],
    lookalikes: {
      im_cvid: 'CVID lowers IgG too (often with IgA and IgM), with bronchiectasis, autoimmunity and lymphoma risk.',
      im_bruton: 'Bruton lacks ALL antibody classes and B cells, presenting in infant boys.',
      im_at: 'Ataxia-telangiectasia also has low IgA, but with cerebellar ataxia and telangiectasias in a child.',
    },
    vs: 'im_cvid',
  },
  {
    id: 'im_cvid', name: 'Common variable immunodeficiency', chapter: 'bcell', tag: 'B-cell differentiation defect',
    s: 'A 24-year-old woman has had four pneumonias in three years and now has **bronchiectasis** on CT, plus immune thrombocytopenia. IgG, IgA and IgM are all low, but **B cell numbers are normal**, and she makes **no antibody response to vaccines**.',
    w: {
      'bronchiectasis': 'Repeated bacterial lung infections damage the airway walls until they become permanently widened.',
      'B cell numbers are normal': 'B cells are made, but they fail to turn into antibody-making plasma cells.',
      'no antibody response to vaccines': 'Without plasma cells, no new antibody is made, so vaccines produce no rise in antibody levels.',
    },
    x: 'In CVID, B cells exist but cannot mature into plasma cells, so several immunoglobulin classes fall. It is usually noticed after puberty. Patients get recurrent sinus and lung infections and have higher rates of autoimmune disease and lymphoma.',
    hy: ['CVID has low plasma cells and immunoglobulins with normal B-cell counts, and an increased risk of autoimmune disease, bronchiectasis and lymphoma.'],
    lookalikes: {
      im_bruton: 'Bruton has ABSENT B cells and presents in infant boys after 6 months.',
      im_iga: 'Selective IgA deficiency has normal IgG and IgM and is often silent.',
      im_hyperigm: 'Hyper-IgM has normal or HIGH IgM with low IgG, presenting in early childhood with opportunistic infections.',
    },
    vs: 'im_bruton',
  },

  // ── T-cell and combined ────────────────────────────────────────────────
  {
    id: 'im_digeorge', name: 'Thymic aplasia (DiGeorge syndrome)', chapter: 'tcell', tag: '22q11 microdeletion',
    s: 'A 5-day-old boy has **jittery spasms of his hands**. He has a cleft palate, low-set ears and a loud murmur; echo shows **truncus arteriosus**. Chest X-ray shows **no thymic shadow**.',
    w: {
      'jittery spasms of his hands': 'The parathyroid glands did not form, so PTH and calcium are low. Low calcium makes nerves fire too easily, causing tetany.',
      'truncus arteriosus': 'Neural crest cells of the same pharyngeal region build the heart\'s outflow tract, so conotruncal defects are typical.',
      'no thymic shadow': 'The thymus comes from the 3rd pharyngeal pouch. When it does not form, T cells cannot mature.',
    },
    x: 'A microdeletion at 22q11 stops the 3rd and 4th pharyngeal pouches from developing. The thymus and parathyroids are missing, so there are few T cells and low calcium. Babies also have heart outflow defects, a cleft palate and an unusual face.',
    hy: ['CATCH-22: Cardiac (conotruncal) defects, Abnormal facies, Thymic aplasia, Cleft palate, Hypocalcaemia, chromosome 22q11.', 'The T-cell deficiency causes recurrent viral and fungal infections.'],
    lookalikes: {
      im_scid: 'SCID also has no thymic shadow, but calcium is normal, there are no face or heart defects, and antibody responses fail too.',
      im_cmc: 'Chronic mucocutaneous candidiasis gives thrush and nail infections, but the thymus, calcium and heart are normal.',
      im_bare2: 'MHC II deficiency gives SCID-like infections from low CD4 cells, with normal calcium and heart.',
    },
    vs: 'im_scid',
  },
  {
    id: 'im_il12r', name: 'IL-12 receptor deficiency', chapter: 'tcell', tag: 'Autosomal recessive',
    s: 'A 1-year-old boy develops **spreading mycobacterial infection after his BCG vaccine**, with fever, large lymph nodes and bone lesions. He has also had disseminated Salmonella. Blood **IFN-γ is low**.',
    w: {
      'spreading mycobacterial infection after his BCG vaccine': 'BCG is a live, weakened mycobacterium. Normally Th1 cells and macrophages contain it; without IL-12 signalling it spreads through the body.',
      'IFN-γ is low': 'IL-12 tells Th1 and NK cells to make IFN-γ. With a broken receptor little IFN-γ is made, so macrophages are never fully activated.',
    },
    x: 'Macrophages release IL-12 to push T cells toward a Th1 response and make them release IFN-γ. IFN-γ then activates macrophages to kill microbes living inside them. When the IL-12 receptor is faulty, IFN-γ stays low and mycobacteria and Salmonella spread.',
    hy: ['IL-12 receptor deficiency (low IFN-γ) is the most common cause of Mendelian susceptibility to mycobacterial disease; it can present after BCG vaccination.'],
    lookalikes: {
      im_cgd: 'CGD causes infections with catalase-positive bacteria and fungi (S aureus, Aspergillus) with granulomas, from a failed respiratory burst.',
      im_scid: 'SCID causes infections of every kind from infancy, with thrush, diarrhoea and no thymic shadow.',
      im_bare1: 'MHC I deficiency gives chronic respiratory infections and skin granulomas from low CD8 cells, not spreading mycobacteria.',
    },
    vs: 'im_cgd',
  },
  {
    id: 'im_job', name: 'Autosomal dominant hyper-IgE syndrome (Job syndrome)', chapter: 'tcell', tag: 'Autosomal dominant (STAT3)',
    s: 'A 9-year-old girl has recurrent **staph skin abscesses that are not warm, red or painful**, eczema, a broad coarse face and two fractures after minor falls. Her **baby teeth have not fallen out**. IgE is very high and eosinophils are raised.',
    w: {
      'staph skin abscesses that are not warm, red or painful': 'STAT3 is needed to make Th17 cells, which call neutrophils in. With few neutrophils arriving, abscesses form without the usual heat and redness ("cold" abscesses).',
      'baby teeth have not fallen out': 'STAT3 is also needed to resorb the roots of baby teeth, so they stay in and the adult teeth come in behind them.',
    },
    x: 'A STAT3 mutation stops Th17 cells developing. Without Th17 signals, neutrophils are not recruited well, so staph abscesses form without heat or redness. Patients also have eczema, coarse features, retained baby teeth, fractures and a very high IgE.',
    hy: ['ABCDEF of Job syndrome: cold staph Abscesses, retained Baby teeth, Coarse face, Dermatologic problems (eczema), high IgE, bone Fractures.'],
    lookalikes: {
      im_wiskott: 'Wiskott-Aldrich also has eczema and high IgE, but in a boy with low, small platelets and bleeding.',
      im_cgd: 'CGD abscesses are inflamed and form granulomas, with an abnormal respiratory burst test, not a high IgE.',
      im_lad: 'LAD also forms no pus, but presents in a newborn with late cord separation and a very high neutrophil count.',
    },
    vs: 'im_wiskott',
  },
  {
    id: 'im_cmc', name: 'Chronic mucocutaneous candidiasis', chapter: 'tcell', tag: 'T-cell dysfunction (classically AIRE)',
    s: 'A 7-year-old girl has had **Candida infections of her mouth, nails and skin** for years that keep coming back after treatment, but **never in her blood or organs**. A skin test with Candida antigen gives **no reaction**.',
    w: {
      'Candida infections of her mouth, nails and skin': 'T cells (especially Th17) keep Candida in check on skin and mucous membranes. When they fail, the fungus keeps regrowing there.',
      'never in her blood or organs': 'Neutrophils still work, and they are what stop Candida invading deeper tissues.',
      'no reaction': 'The Candida skin test is a T-cell (type IV) reaction. If T cells cannot respond to Candida, the skin stays flat.',
    },
    x: 'In chronic mucocutaneous candidiasis, T cells cannot respond properly to Candida. The fungus grows on skin, nails and mucous membranes again and again, but working neutrophils stop it invading. The classic inherited form comes from defects in the AIRE gene.',
    hy: ['AIRE deficiency causes autoimmune polyendocrine syndrome type 1: Chronic mucocutaneous candidiasis, Hypoparathyroidism, Adrenal insufficiency.'],
    lookalikes: {
      im_digeorge: 'DiGeorge has thrush too, but in a newborn with low calcium, a heart defect and no thymus.',
      im_job: 'Job syndrome gives cold staph abscesses, eczema and a very high IgE.',
      im_scid: 'SCID adds severe viral and bacterial infections, diarrhoea and failure to thrive in infancy.',
    },
    vs: 'im_digeorge',
  },
  {
    id: 'im_scid', name: 'Severe combined immunodeficiency (SCID)', chapter: 'tcell', tag: 'Most often X-linked (IL-2Rγ)',
    s: 'A 5-month-old boy has **thrush**, chronic diarrhoea, failure to thrive and Pneumocystis pneumonia. His newborn screen showed **very low TRECs**. Chest X-ray shows no thymic shadow, and T cells are almost absent.',
    w: {
      'thrush': 'With almost no T cells, nothing keeps Candida in check in the mouth.',
      'very low TRECs': 'TRECs are small DNA circles left over when new T cells rearrange their receptors in the thymus. Few new T cells means few TRECs.',
    },
    x: 'SCID is a group of defects that wipe out T cells and, with them, working antibody responses. The most common form is a defect in the common gamma chain shared by the IL-2 and several other cytokine receptors, which is X-linked. Babies get viral, bacterial, fungal and protozoal infections and fail to thrive.',
    hy: ['Causes of SCID: IL-2Rγ defect (X-linked, most common), adenosine deaminase deficiency (autosomal recessive) and RAG mutations (no VDJ recombination).', 'SCID is picked up on newborn screening by low TRECs; treat with a stem cell transplant and avoid live vaccines.'],
    lookalikes: {
      im_digeorge: 'DiGeorge also lacks a thymus, but has low calcium, a cleft palate and a conotruncal heart defect.',
      im_bruton: 'Bruton spares T cells: no thrush or Pneumocystis, just bacterial infections after 6 months.',
      im_hyperigm: 'Hyper-IgM also gets Pneumocystis, but T cells are present and IgM is normal or high.',
    },
    vs: 'im_digeorge',
  },
  {
    id: 'im_at', name: 'Ataxia-telangiectasia', chapter: 'tcell', tag: 'Autosomal recessive (ATM)',
    s: 'A 6-year-old boy has had an **increasingly unsteady, wide-based walk** since he was a toddler, **small dilated vessels on the whites of his eyes**, and frequent sinus infections. AFP is high and IgA is low.',
    w: {
      'increasingly unsteady, wide-based walk': 'Without ATM, cells cannot repair DNA damage well, and cerebellar Purkinje cells slowly die, causing ataxia.',
      'small dilated vessels on the whites of his eyes': 'Telangiectasias (spider-like dilated small vessels) on the conjunctiva and face are a hallmark of the disease.',
    },
    x: 'The ATM gene senses DNA damage and stops the cell cycle so the damage can be repaired. Without it, mutations build up and cells are very sensitive to radiation. Children develop cerebellar ataxia, telangiectasias, low IgA (and often IgG and IgE) and a high risk of lymphoma and leukaemia.',
    hy: ['Ataxia-telangiectasia triad: cerebellar ataxia, spider angiomas (telangiectasias) and IgA deficiency, with a high AFP.', 'Patients are very sensitive to radiation, so limit X-ray exposure.'],
    lookalikes: {
      im_iga: 'Selective IgA deficiency has low IgA too, but no ataxia or telangiectasias.',
      im_wiskott: 'Wiskott-Aldrich has eczema, low small platelets and bleeding, not ataxia.',
      im_chediak: 'Chédiak-Higashi has partial albinism, neuropathy and giant granules in neutrophils.',
    },
    vs: 'im_iga',
  },
  {
    id: 'im_hyperigm', name: 'Hyper-IgM syndrome', chapter: 'tcell', tag: 'X-linked recessive (CD40L)',
    s: 'A 2-year-old boy has had severe bacterial pneumonias and now has **Pneumocystis pneumonia**, plus watery diarrhoea from Cryptosporidium. **IgM is high**, while IgG, IgA and IgE are very low.',
    w: {
      'Pneumocystis pneumonia': 'CD40L also lets helper T cells activate macrophages. Without it, opportunistic organisms like Pneumocystis are not controlled.',
      'IgM is high': 'B cells need the CD40L–CD40 signal from T cells to switch class. Without it they keep making only IgM.',
    },
    x: 'Helper T cells use CD40 ligand to tell B cells to switch from IgM to IgG, IgA and IgE. When CD40L is faulty, B cells keep making only IgM and germinal centres do not form. Children get severe pyogenic infections plus opportunistic ones like Pneumocystis, Cryptosporidium and CMV.',
    hy: ['Hyper-IgM syndrome is most often an X-linked CD40L defect that blocks class switching: normal or high IgM with very low IgG, IgA and IgE.'],
    lookalikes: {
      im_bruton: 'Bruton has absent B cells and ALL immunoglobulins low, including IgM.',
      im_cvid: 'CVID lowers all classes, usually after puberty, without opportunistic infections.',
      im_scid: 'SCID has no T cells at all, with failure to thrive and no thymic shadow.',
    },
    vs: 'im_bruton',
  },
  {
    id: 'im_wiskott', name: 'Wiskott-Aldrich syndrome', chapter: 'tcell', tag: 'X-linked recessive (WAS)',
    s: 'A 2-year-old boy has **eczema**, recurrent ear infections and pneumonias, and **bloody diarrhoea and easy bruising**. His platelets are low and **smaller than normal** on the smear. IgE and IgA are high and IgM is low.',
    w: {
      'eczema': 'The faulty WAS protein upsets how immune cells are regulated, which leads to eczema and allergy.',
      'bloody diarrhoea and easy bruising': 'Low platelet numbers mean small bleeds in the gut and skin are not stopped.',
      'smaller than normal': 'Platelets need the WAS protein to build their actin skeleton, so they come out few and small.',
    },
    x: 'The WAS gene controls the actin cytoskeleton in white cells and platelets. Without it, immune cells cannot reorganise to present antigen properly, and platelets are few and small. Boys get eczema, bleeding and recurrent pyogenic infections, with a higher risk of autoimmunity and cancer.',
    hy: ['WATER: Wiskott-Aldrich: Thrombocytopenia (small platelets), Eczema, Recurrent infections; X-linked recessive.', 'There is an increased risk of autoimmune disease and malignancy such as lymphoma.'],
    lookalikes: {
      im_job: 'Job syndrome also has eczema and high IgE, but with cold staph abscesses, retained baby teeth and normal platelets.',
      im_at: 'Ataxia-telangiectasia has ataxia and telangiectasias, not eczema and bleeding.',
      im_hyperigm: 'Hyper-IgM has high IgM, opportunistic infections and normal platelets.',
    },
    vs: 'im_job',
  },
  {
    id: 'im_bare1', name: 'MHC class I deficiency (bare lymphocyte syndrome type I)', chapter: 'tcell', tag: 'Autosomal recessive (TAP)',
    s: 'A 15-year-old girl has had **chronic sinus and lung infections** for years and now has **ulcerating granulomas on her face**. CD8+ T cells are very low, while CD4+ cells and immunoglobulins are normal.',
    w: {
      'chronic sinus and lung infections': 'Without MHC I, CD8 T cells are few and cannot recognise virus-infected airway cells, so respiratory infections linger.',
      'ulcerating granulomas on her face': 'Skin granulomas and vasculitis are a recognised feature of TAP deficiency, thought to come from poorly controlled NK cells.',
    },
    x: 'TAP pumps peptide fragments into the endoplasmic reticulum so they can be loaded onto MHC class I. With TAP broken, little MHC I reaches the cell surface. CD8 T cells, which are selected and activated on MHC I, are few, causing chronic respiratory infections and skin granulomas with normal antibodies.',
    hy: ['Bare lymphocyte syndrome type I (TAP mutation) lowers MHC I and CD8 cells; type II lowers MHC II and CD4 cells and looks like SCID.'],
    lookalikes: {
      im_bare2: 'MHC II deficiency lowers CD4 cells and antibodies, giving SCID-like infections in infancy.',
      im_cvid: 'CVID lowers immunoglobulins with normal T-cell counts.',
      im_il12r: 'IL-12 receptor deficiency gives spreading mycobacterial infection, often after BCG.',
    },
    vs: 'im_bare2',
  },
  {
    id: 'im_bare2', name: 'MHC class II deficiency (bare lymphocyte syndrome type II)', chapter: 'tcell', tag: 'Autosomal recessive',
    s: 'A 6-month-old girl has failure to thrive, chronic diarrhoea and Pneumocystis pneumonia. **CD4+ T cells are very low** while CD8+ cells are present, and **immunoglobulins are low**. Her immune cells **do not express HLA-DR**.',
    w: {
      'CD4+ T cells are very low': 'CD4 cells are selected in the thymus on MHC class II. Without MHC II, few of them develop.',
      'immunoglobulins are low': 'B cells need CD4 help (and their own MHC II to present antigen) to make antibody.',
      'do not express HLA-DR': 'HLA-DR is an MHC class II molecule. The transcription factors that switch on MHC II genes are faulty, so it is never made.',
    },
    x: 'Mutations in the transcription factors that switch on MHC class II genes leave antigen-presenting cells without MHC II. CD4 helper T cells cannot be selected or activated, so B cells get no help either. The infant has SCID-like infections and low antibodies.',
    hy: ['MHC II deficiency (bare lymphocyte type II) gives low CD4 cells and low immunoglobulins; treat with a stem cell transplant and IVIG.'],
    lookalikes: {
      im_scid: 'Classic SCID lacks T cells of both types (low TRECs) and has no thymic shadow.',
      im_bare1: 'MHC I deficiency lowers CD8 cells with normal antibodies, giving chronic lung infections and skin granulomas.',
      im_digeorge: 'DiGeorge has low T cells with low calcium, a cleft palate and a conotruncal heart defect.',
    },
    vs: 'im_scid',
  },
  {
    id: 'im_ipex', name: 'IPEX syndrome', chapter: 'tcell', tag: 'X-linked (FOXP3)',
    s: 'A 2-month-old boy has **severe watery diarrhoea**, an eczema-like rash and **diabetes needing insulin**. His mother\'s brother died in infancy with the same problems.',
    w: {
      'severe watery diarrhoea': 'With no regulatory T cells, other T cells attack the gut lining (autoimmune enteropathy).',
      'diabetes needing insulin': 'Self-reactive T cells destroy the pancreatic beta cells because nothing holds them back.',
    },
    x: 'FOXP3 is the master switch for regulatory T cells, which keep self-reactive T cells in check. When FOXP3 is missing, there are no working Tregs and autoimmunity starts in infancy. The classic picture is enteropathy, endocrine disease such as type 1 diabetes, and dermatitis.',
    hy: ['IPEX = Immune dysregulation, Polyendocrinopathy, Enteropathy, X-linked; caused by a FOXP3 mutation (no regulatory T cells).'],
    lookalikes: {
      im_cmc: 'AIRE-related chronic mucocutaneous candidiasis gives Candida infections with hypoparathyroidism and adrenal failure in childhood.',
      im_scid: 'SCID causes infections and diarrhoea from absent immunity, not autoimmune diabetes.',
      im_wiskott: 'Wiskott-Aldrich has eczema with low, small platelets and bleeding.',
    },
    vs: 'im_cmc',
  },

  // ── Phagocytes and complement ──────────────────────────────────────────
  {
    id: 'im_lad', name: 'Leukocyte adhesion deficiency (type 1)', chapter: 'phago', tag: 'Autosomal recessive (CD18)',
    s: 'A 5-week-old boy\'s **umbilical cord stump is still attached**. He has an infected umbilicus and skin infections that form **no pus**. His **white cell count is very high**.',
    w: {
      'umbilical cord stump is still attached': 'Neutrophils help the cord stump separate. If they cannot leave the blood, it stays on past 30 days.',
      'no pus': 'Pus is made of neutrophils. If they cannot get out of the vessels into tissue, none collects.',
      'white cell count is very high': 'Neutrophils are stuck in the bloodstream instead of leaving it, so their count in the blood rises.',
    },
    x: 'Neutrophils need the integrin LFA-1 (CD18) to stick firmly to vessel walls and squeeze into tissues. In LAD type 1, CD18 is faulty, so neutrophils stay in the blood. Infections form no pus, the cord separates late and the blood neutrophil count is very high.',
    hy: ['LAD type 1 is an autosomal recessive CD18 (LFA-1 integrin) defect: delayed cord separation (>30 days), absent pus and neutrophilia.'],
    lookalikes: {
      im_cgd: 'In CGD, neutrophils reach the tissues but cannot kill catalase-positive organisms, so granulomas form.',
      im_chediak: 'Chédiak-Higashi has giant granules, partial albinism and neuropathy.',
      im_job: 'Job syndrome gives cold abscesses with high IgE, eczema and retained baby teeth.',
    },
    vs: 'im_cgd',
  },
  {
    id: 'im_chediak', name: 'Chédiak-Higashi syndrome', chapter: 'phago', tag: 'Autosomal recessive (LYST)',
    s: 'A 4-year-old boy with **very pale skin and silvery hair** has recurrent staph and strep infections and numb, weak feet. His blood smear shows **giant granules in the neutrophils**.',
    w: {
      'very pale skin and silvery hair': 'Pigment granules (melanosomes) are not moved properly to skin and hair cells, causing partial albinism.',
      'giant granules in the neutrophils': 'Faulty lysosome trafficking makes granules fuse into abnormally large ones.',
    },
    x: 'The LYST gene controls how lysosomes are moved and fused. When it fails, phagosomes cannot fuse with lysosomes properly, so neutrophils cannot kill bacteria, and granules merge into giant ones. Children get recurrent pyogenic infections, partial albinism, neuropathy and progressive neurodegeneration.',
    hy: ['PLAIN: Progressive neurodegeneration, Lymphohistiocytosis, Albinism (partial), recurrent pyogenic Infections, peripheral Neuropathy.'],
    lookalikes: {
      im_cgd: 'CGD has normal colouring and granules, with infections from catalase-positive organisms and granulomas.',
      im_lad: 'LAD has delayed cord separation and no pus, with a very high neutrophil count.',
      im_at: 'Ataxia-telangiectasia has ataxia, telangiectasias and low IgA, not albinism.',
    },
    vs: 'im_cgd',
  },
  {
    id: 'im_cgd', name: 'Chronic granulomatous disease', chapter: 'phago', tag: 'Most often X-linked (NADPH oxidase)',
    s: 'A 3-year-old boy has had a **Staphylococcus aureus liver abscess**, Serratia osteomyelitis and Aspergillus pneumonia. Biopsies show **granulomas**. The **dihydrorhodamine test shows no fluorescence**.',
    w: {
      'Staphylococcus aureus liver abscess': 'Catalase-positive organisms destroy their own hydrogen peroxide, so the neutrophil cannot borrow it to kill them.',
      'granulomas': 'Phagocytes swallow the microbes but cannot kill them, so the body walls them off in granulomas.',
      'dihydrorhodamine test shows no fluorescence': 'The dye only glows when oxidised by the respiratory burst. No burst means no fluorescence.',
    },
    x: 'NADPH oxidase makes superoxide for the neutrophil\'s respiratory burst. In CGD it is faulty, so phagocytes swallow microbes but cannot kill catalase-positive ones, which also break down the little peroxide they produce. Patients get recurrent infections and granulomas.',
    hy: ['Catalase-positive organisms in CGD: S aureus, Burkholderia cepacia, Serratia, Nocardia, Aspergillus.', 'Diagnose with an abnormal dihydrorhodamine flow cytometry test (nitroblue tetrazolium does not turn blue).'],
    lookalikes: {
      im_lad: 'In LAD, neutrophils cannot leave the blood: no pus and delayed cord separation.',
      im_chediak: 'Chédiak-Higashi has giant granules, partial albinism and neuropathy.',
      im_job: 'Job syndrome gives cold staph abscesses with a very high IgE and eczema.',
    },
    vs: 'im_lad',
  },
  {
    id: 'im_hae', name: 'Hereditary angioedema (C1 inhibitor deficiency)', chapter: 'phago', tag: 'Autosomal dominant',
    s: 'A 19-year-old woman has repeated episodes of **swelling of her lips, hands and bowel wall without hives or itch**. The latest started after a new **blood pressure tablet**. Her mother has the same problem. C4 is low.',
    w: {
      'swelling of her lips, hands and bowel wall without hives or itch': 'The swelling is driven by bradykinin, not histamine, so there are no hives or itch and antihistamines do not help.',
      'blood pressure tablet': 'ACE inhibitors stop the breakdown of bradykinin, so bradykinin builds up further and triggers swelling.',
    },
    x: 'C1 inhibitor normally holds back the complement C1 complex and kallikrein. Without enough of it, kallikrein runs unchecked and makes bradykinin, which makes vessels leak. Patients get recurrent deep swelling of the skin, airway and bowel, with a low C4 from constant complement use.',
    hy: ['Hereditary angioedema is C1 esterase inhibitor deficiency with low C4; ACE inhibitors are contraindicated.', 'Treat attacks with ecallantide (kallikrein inhibitor), icatibant (bradykinin B2 receptor antagonist) or C1 inhibitor concentrate.'],
    lookalikes: {
      im_anaphylaxis: 'Anaphylaxis is IgE-driven: hives, itch, wheeze and hypotension that respond to adrenaline.',
      im_pnh: 'PNH is loss of complement protectors on red cells, causing haemolysis and clots, not swelling.',
      im_early_c: 'Early complement deficiency causes encapsulated infections and lupus, not swelling attacks.',
    },
    vs: 'im_anaphylaxis',
  },
  {
    id: 'im_pnh', name: 'Paroxysmal nocturnal hemoglobinuria', chapter: 'phago', tag: 'Acquired (PIGA mutation)',
    s: 'A 34-year-old man passes **dark urine that is worst in the morning** and is tired. He now has abdominal pain from a **hepatic vein clot**. He has haemolysis with low haptoglobin, and low white cells and platelets. Flow cytometry shows **red cells lacking CD55 and CD59**.',
    w: {
      'dark urine that is worst in the morning': 'Complement destroys red cells inside the vessels, so haemoglobin spills into the urine; urine made overnight is most concentrated.',
      'hepatic vein clot': 'Free haemoglobin and complement-activated platelets make blood clot in unusual veins such as the hepatic vein (Budd-Chiari).',
      'red cells lacking CD55 and CD59': 'CD55 and CD59 protect cells from complement and are held on by GPI anchors, which the PIGA mutation stops being made.',
    },
    x: 'An acquired PIGA mutation in a blood stem cell stops GPI anchors being made. Red cells then lose CD55 and CD59, which normally protect them from complement. Complement destroys them inside the vessels, causing haemolysis, dark urine, low blood counts and clots in unusual veins.',
    hy: ['PNH triad: haemolytic anaemia, pancytopenia and atypical venous thrombosis (Budd-Chiari, portal, cerebral).', 'Treat with eculizumab (anti-C5), which blocks the membrane attack complex; vaccinate against Neisseria first.'],
    lookalikes: {
      im_ahtr: 'An acute haemolytic transfusion reaction starts minutes after ABO-incompatible blood is given.',
      im_hae: 'Hereditary angioedema is C1 inhibitor loss: swelling attacks with low C4 and no haemolysis.',
      im_terminal_c: 'Terminal complement deficiency causes Neisseria infections, not haemolysis.',
    },
    vs: 'im_ahtr',
  },
  {
    id: 'im_early_c', name: 'Early complement deficiency (C1–C4)', chapter: 'phago', tag: 'Usually autosomal recessive',
    s: 'A 22-year-old woman with **recurrent pneumococcal sinus infections and pneumonia** develops a **lupus-like illness** with a malar rash, arthritis and a positive ANA. **CH50 is very low**.',
    w: {
      'recurrent pneumococcal sinus infections and pneumonia': 'Early complement proteins coat encapsulated bacteria with C3b so they can be eaten. Without them, these bacteria escape.',
      'lupus-like illness': 'Early complement also clears immune complexes and dead-cell debris. When these build up, lupus develops.',
      'CH50 is very low': 'CH50 tests the whole classical pathway. If C1, C2 or C4 is missing, the pathway cannot run.',
    },
    x: 'The early classical complement proteins (C1, C2, C4) and C3 coat bacteria and immune complexes so they can be cleared. When one is missing, encapsulated bacteria cause repeated sinus and lung infections. Immune complexes are not cleared either, so lupus is common.',
    hy: ['Early complement deficiencies (C1–C4) raise the risk of SLE ("SLEarly") and of infections with encapsulated bacteria.', 'CH50 tests the classical pathway (C1, C2, C4); AH50 tests the alternative pathway.'],
    lookalikes: {
      im_terminal_c: 'Terminal complement (C5–C9) deficiency gives recurrent Neisseria infections and no lupus.',
      im_hae: 'C1 inhibitor deficiency causes swelling attacks without hives, not infections.',
      im_asplenia: 'Asplenia also gives encapsulated infections, with Howell-Jolly bodies after splenectomy, and complement is normal.',
    },
    vs: 'im_terminal_c',
  },
  {
    id: 'im_terminal_c', name: 'Terminal complement deficiency (C5–C9)', chapter: 'phago', tag: 'Usually autosomal recessive',
    s: 'An 18-year-old man has his **second episode of meningococcal meningitis**; his brother had gonococcal arthritis. He is otherwise well. **CH50 is undetectable**, and antibody levels are normal.',
    w: {
      'second episode of meningococcal meningitis': 'Neisseria are killed mainly by the membrane attack complex (C5b–9) punching holes in them. Without it they survive.',
      'CH50 is undetectable': 'CH50 needs the whole cascade, through C9, to burst the test red cells. One missing terminal part brings it to zero.',
    },
    x: 'C5 to C9 form the membrane attack complex, which kills bacteria by punching holes in their membranes. Neisseria species depend on this route for clearance more than other bacteria. People missing a terminal component get recurrent Neisseria infections, often meningococcal.',
    hy: ['Terminal complement (C5–C9) deficiency causes recurrent Neisseria bacteraemia; eculizumab (anti-C5) creates the same risk.'],
    lookalikes: {
      im_early_c: 'Early complement deficiency gives encapsulated sinus and lung infections and a lupus-like illness.',
      im_asplenia: 'Asplenia gives overwhelming pneumococcal sepsis, with Howell-Jolly bodies on the smear.',
      im_bruton: 'Bruton gives low antibodies of every class, starting in infancy.',
    },
    vs: 'im_early_c',
  },
  {
    id: 'im_asplenia', name: 'Asplenia (post-splenectomy infection)', chapter: 'phago', tag: 'Acquired (surgical or functional)',
    s: 'A 40-year-old man who had his **spleen removed after a car crash** becomes septic and hypotensive within hours from pneumococcus. His blood smear shows **Howell-Jolly bodies** and target cells.',
    w: {
      'spleen removed after a car crash': 'The spleen filters bacteria coated with antibody and makes IgM against capsules, so encapsulated bacteria are not cleared without it.',
      'Howell-Jolly bodies': 'These are leftover bits of nucleus in red cells. The spleen normally plucks them out, so they persist after splenectomy.',
    },
    x: 'The spleen removes bacteria coated with antibody and complement, and its macrophages clear old and damaged red cells. Without a spleen, encapsulated bacteria (pneumococcus, Hib, meningococcus) can cause overwhelming sepsis. The blood smear shows red cell inclusions the spleen would normally have removed.',
    hy: ['After splenectomy, vaccinate against S pneumoniae, Hib and N meningitidis; the smear shows Howell-Jolly bodies, target cells and thrombocytosis.', 'Sickle cell disease causes functional asplenia (autosplenectomy) with the same infection risk.'],
    lookalikes: {
      im_terminal_c: 'Terminal complement deficiency gives recurrent Neisseria infections with a normal spleen and smear.',
      im_early_c: 'Early complement deficiency causes encapsulated infections with a lupus-like illness and a low CH50.',
      im_bruton: 'Bruton gives low antibodies and recurrent infections in infant boys.',
    },
    vs: 'im_early_c',
  },

  // ── Hypersensitivity and transfusion ───────────────────────────────────
  {
    id: 'im_anaphylaxis', name: 'Anaphylaxis (type I hypersensitivity)', chapter: 'hyper', tag: 'Type I hypersensitivity (IgE)',
    s: 'Within **10 minutes of a bee sting**, a 30-year-old man has widespread **hives, wheeze and lip swelling** and a blood pressure of 75/40. Serum **tryptase is raised**.',
    w: {
      '10 minutes of a bee sting': 'IgE from an earlier sting is already sitting on his mast cells. The venom cross-links it at once, so the reaction is immediate.',
      'hives, wheeze and lip swelling': 'Histamine and leukotrienes make vessels leak and airways tighten.',
      'tryptase is raised': 'Tryptase is an enzyme stored in mast cell granules. A raised level shows mast cells have degranulated.',
    },
    x: 'After an earlier exposure, the person made IgE that sits on mast cells and basophils. On re-exposure, the allergen cross-links that IgE and the cells release histamine and other mediators within minutes. Vessels leak and widen and airways tighten, causing hives, wheeze, swelling and shock.',
    hy: ['Type I hypersensitivity has an immediate phase (mast cell degranulation) and a late phase hours later (leukotrienes, eosinophils).', 'Treat anaphylaxis with intramuscular epinephrine first.'],
    lookalikes: {
      im_hae: 'Hereditary angioedema swells without hives or itch, is bradykinin-driven and does not respond to adrenaline.',
      im_serum_sickness: 'Serum sickness appears 1–2 weeks after a foreign protein, with fever, rash and joint pains.',
      im_allergic_tx: 'An allergic transfusion reaction is hives during a transfusion, without shock.',
    },
    vs: 'im_hae',
  },
  {
    id: 'im_serum_sickness', name: 'Serum sickness', chapter: 'hyper', tag: 'Type III hypersensitivity',
    s: 'A 45-year-old man was given **antivenom made in horses** after a snake bite. **Ten days later** he has fever, an itchy rash, joint pains and protein in his urine. **C3 and C4 are low**.',
    w: {
      'antivenom made in horses': 'Horse proteins are foreign, so his immune system makes antibodies against them.',
      'Ten days later': 'It takes about 1–2 weeks to make enough antibody, and complexes form while the foreign protein is still circulating.',
      'C3 and C4 are low': 'The immune complexes switch on complement, which gets used up.',
    },
    x: 'Antibodies made against a foreign protein bind it in the blood and form immune complexes. These complexes settle in vessels, joints and kidneys and activate complement. That causes fever, rash, joint pain and kidney involvement about 1–2 weeks after exposure.',
    hy: ['Serum sickness is the prototype type III (immune complex) reaction; drugs acting as haptens (such as penicillin) can cause a serum sickness-like reaction.', 'Other type III examples: SLE, post-streptococcal glomerulonephritis and IgA vasculitis.'],
    lookalikes: {
      im_arthus: 'An Arthus reaction is LOCAL: swelling and necrosis at the injection site hours after a booster.',
      im_anaphylaxis: 'Anaphylaxis comes within minutes, with hives, wheeze and shock.',
      im_contact: 'Contact dermatitis is a T-cell rash only where the skin touched the trigger, 1–2 days later.',
    },
    vs: 'im_arthus',
  },
  {
    id: 'im_arthus', name: 'Arthus reaction', chapter: 'hyper', tag: 'Type III hypersensitivity (local)',
    s: 'A 30-year-old woman had a tetanus booster 2 years ago and is given another today by mistake. **Eight hours later** the injection site is **red, swollen and painful, and starts to blister and die**. She has no fever or rash elsewhere.',
    w: {
      'Eight hours later': 'She already has plenty of IgG from the last booster. It meets the injected antigen in the skin and forms complexes within hours.',
      'red, swollen and painful, and starts to blister and die': 'The complexes lodge in small vessel walls, activate complement and attract neutrophils, causing a local vasculitis and tissue death.',
    },
    x: 'An Arthus reaction is a local immune complex reaction. Antibodies already in the blood meet the injected antigen in the skin, form complexes in small vessel walls and activate complement. Neutrophils rush in and cause swelling, bleeding and necrosis at that one spot.',
    hy: ['The Arthus reaction is a local, subacute type III reaction, often after an extra vaccine booster; it involves antigen–antibody complexes and complement, not T cells.'],
    lookalikes: {
      im_serum_sickness: 'Serum sickness is systemic: fever, rash, joint pains and kidney involvement after 1–2 weeks.',
      im_contact: 'Contact dermatitis is a T-cell reaction 1–2 days later with an itchy blistering rash, not necrosis.',
      im_anaphylaxis: 'Anaphylaxis is within minutes and body-wide, with hives and shock.',
    },
    vs: 'im_serum_sickness',
  },
  {
    id: 'im_contact', name: 'Allergic contact dermatitis', chapter: 'hyper', tag: 'Type IV hypersensitivity',
    s: 'A 25-year-old woman gets an **itchy, blistering rash exactly under her new watch strap** and belt buckle, starting **2 days after** she first wears them. **Patch testing to nickel** is positive.',
    w: {
      'itchy, blistering rash exactly under her new watch strap': 'Sensitised T cells react only where the allergen touched the skin, so the rash copies the shape of the object.',
      '2 days after': 'T cells have to be recruited and release cytokines, which takes 1–3 days: a delayed reaction.',
      'Patch testing to nickel': 'A small amount of allergen under a patch reproduces the same T-cell reaction 48–72 hours later.',
    },
    x: 'Small chemicals such as nickel bind skin proteins and are picked up by antigen-presenting cells. On re-exposure, sensitised T cells return to that spot and release cytokines that inflame the skin. Because it depends on T cells, the rash takes 1–3 days to appear and stays where the trigger touched.',
    hy: ['Type IV hypersensitivity is T-cell mediated and delayed; remember the 4 Ts: T cells, Transplant rejection, TB skin test, Touching (contact dermatitis).'],
    lookalikes: {
      im_anaphylaxis: 'Type I allergy causes hives within minutes, not a blistering rash 2 days later.',
      im_arthus: 'An Arthus reaction is immune-complex necrosis at an injection site within hours.',
      im_gvhd: 'GVHD gives a widespread rash with diarrhoea and jaundice after a transplant.',
    },
    vs: 'im_anaphylaxis',
  },
  {
    id: 'im_ahtr', name: 'Acute hemolytic transfusion reaction', chapter: 'hyper', tag: 'Type II hypersensitivity',
    s: 'Fifteen minutes into a blood transfusion, a 60-year-old man has fever, **flank pain**, hypotension and **red-brown urine**, and starts **oozing from his drip sites**. The unit was meant for another patient.',
    w: {
      'flank pain': 'Haemoglobin and debris from burst red cells injure the kidneys, causing flank pain.',
      'red-brown urine': 'Red cells burst inside the vessels and free haemoglobin passes into the urine.',
      'oozing from his drip sites': 'Massive haemolysis sets off DIC, which uses up clotting factors and platelets, so he bleeds.',
    },
    x: 'The patient\'s own anti-A or anti-B antibodies bind the ABO-incompatible donor red cells and activate complement. The cells burst inside the vessels within minutes. Free haemoglobin, shock, kidney injury and DIC follow.',
    hy: ['An acute haemolytic transfusion reaction is a type II reaction with intravascular haemolysis: positive direct Coombs test, low haptoglobin and haemoglobinuria.', 'Stop the transfusion immediately.'],
    lookalikes: {
      im_fnhtr: 'A febrile non-haemolytic reaction gives fever and chills only, with no haemolysis or shock.',
      im_dhtr: 'A delayed haemolytic reaction appears days later with milder haemolysis outside the vessels.',
      im_trali: 'TRALI causes sudden breathlessness and lung infiltrates within 6 hours, without haemolysis.',
    },
    vs: 'im_dhtr',
  },
  {
    id: 'im_dhtr', name: 'Delayed hemolytic transfusion reaction', chapter: 'hyper', tag: 'Anamnestic antibody response',
    s: 'A 70-year-old woman who was transfused **during a pregnancy decades ago** gets 2 units of blood after surgery. **Five days later** her haemoglobin has fallen again and she is mildly jaundiced. Her **direct Coombs test is newly positive**.',
    w: {
      'during a pregnancy decades ago': 'That exposure to foreign red cell antigens (such as Kidd or Rh) primed her, but the antibody later faded below detectable levels.',
      'Five days later': 'Memory B cells take a few days to boost antibody levels again (an anamnestic response).',
      'direct Coombs test is newly positive': 'The new IgG is now coating the donor red cells, which the Coombs test detects.',
    },
    x: 'Long ago the patient was sensitised to a minor red cell antigen, but the antibody level was too low to show up on screening. After transfusion, memory cells quickly make more antibody, which coats the donor red cells. Those cells are removed in the spleen over days, giving a milder haemolysis outside the vessels.',
    hy: ['Delayed haemolytic transfusion reactions occur days to weeks later, are usually mild and extravascular, and come from an anamnestic antibody response.'],
    lookalikes: {
      im_ahtr: 'An acute haemolytic reaction starts within minutes, with shock, flank pain and haemoglobinuria.',
      im_fnhtr: 'A febrile non-haemolytic reaction gives fever within hours and no haemolysis.',
      im_pnh: 'PNH haemolysis is not tied to a transfusion and comes with clots and low blood counts.',
    },
    vs: 'im_ahtr',
  },
  {
    id: 'im_fnhtr', name: 'Febrile nonhemolytic transfusion reaction', chapter: 'hyper', tag: 'Cytokines / anti-HLA antibodies',
    s: 'A 55-year-old woman with leukaemia who has had **many transfusions** develops **fever and chills an hour into a platelet transfusion**. Her blood pressure, breathing and urine are normal, and **tests for haemolysis are negative**.',
    w: {
      'many transfusions': 'Repeated exposure leads to antibodies against the HLA on donor white cells.',
      'fever and chills an hour into a platelet transfusion': 'Cytokines released by donor white cells during storage, or her antibodies reacting with those cells, cause the fever.',
      'tests for haemolysis are negative': 'Red cells are not being destroyed, so it is a diagnosis made by excluding a haemolytic reaction.',
    },
    x: 'During storage, white cells in donated blood release cytokines, and people who have had many transfusions often have antibodies against donor white cell HLA. Either way, the result is fever and chills within a few hours. There is no haemolysis, so it is a diagnosis of exclusion.',
    hy: ['Febrile non-haemolytic reactions are the most common transfusion reaction; leukoreduced blood products help prevent them.'],
    lookalikes: {
      im_ahtr: 'An acute haemolytic reaction adds hypotension, flank pain, haemoglobinuria and DIC.',
      im_trali: 'TRALI causes low oxygen and bilateral lung infiltrates within 6 hours.',
      im_allergic_tx: 'An allergic reaction gives hives and itch without fever.',
    },
    vs: 'im_ahtr',
  },
  {
    id: 'im_trali', name: 'Transfusion-related acute lung injury (TRALI)', chapter: 'hyper', tag: 'Donor anti-HLA / anti-neutrophil antibodies',
    s: 'Two hours after a plasma transfusion, a 50-year-old man becomes **acutely breathless and hypoxic** with a mild fever. Chest X-ray shows **bilateral infiltrates**, but **BNP and his echo are normal** and his neck veins are flat.',
    w: {
      'acutely breathless and hypoxic': 'Antibodies in the donor plasma activate the patient\'s neutrophils in the lung capillaries, which then leak fluid.',
      'bilateral infiltrates': 'The leaky capillaries flood both lungs: a non-cardiogenic pulmonary oedema.',
      'BNP and his echo are normal': 'The heart is not overloaded, which is what separates this from fluid overload (TACO).',
    },
    x: 'Antibodies in the donor plasma (against HLA or neutrophil antigens) bind the recipient\'s neutrophils. The activated neutrophils damage the lung capillaries, which leak fluid. The result is non-cardiogenic pulmonary oedema within 6 hours of the transfusion.',
    hy: ['TRALI: acute hypoxaemia and bilateral infiltrates within 6 hours of transfusion, with a normal BNP and normal heart function (unlike TACO).'],
    lookalikes: {
      im_taco: 'TACO is fluid overload: raised JVP, high BNP and hypertension, and it improves with diuretics.',
      im_allergic_tx: 'An allergic reaction gives hives and wheeze without lung infiltrates.',
      im_fnhtr: 'A febrile non-haemolytic reaction gives fever and chills with normal oxygen levels.',
    },
    vs: 'im_taco',
  },
  {
    id: 'im_taco', name: 'Transfusion-associated circulatory overload (TACO)', chapter: 'hyper', tag: 'Volume overload',
    s: 'An 82-year-old woman with heart failure is given 3 units of blood quickly. Several hours later she is short of breath with a **raised JVP**, hypertension and crackles. Her **BNP is high**, and she improves with a diuretic.',
    w: {
      'raised JVP': 'Too much volume too fast raises pressure in the veins and the right heart.',
      'BNP is high': 'Overstretched ventricles release BNP, showing the lung fluid comes from the heart (cardiogenic).',
    },
    x: 'TACO is simply too much fluid given too fast for the heart to handle. Raised pressure in the lung vessels pushes fluid into the lungs (cardiogenic pulmonary oedema). Older patients and those with heart or kidney disease are most at risk.',
    hy: ['TACO appears about 6–12 hours after transfusion with breathlessness, pulmonary oedema, raised JVP and hypertension; treat with diuretics and slower transfusion.'],
    lookalikes: {
      im_trali: 'TRALI has a normal BNP, a normal heart and flat neck veins: leaky lungs, not overload.',
      im_ahtr: 'An acute haemolytic reaction gives shock, flank pain and red urine within minutes.',
      im_allergic_tx: 'An allergic reaction gives hives and itch, without fluid overload.',
    },
    vs: 'im_trali',
  },
  {
    id: 'im_allergic_tx', name: 'Allergic (urticarial) transfusion reaction', chapter: 'hyper', tag: 'Type I hypersensitivity',
    s: 'Twenty minutes into a plasma transfusion, a 35-year-old woman develops **itchy hives** over her chest and arms with mild wheeze. Her blood pressure and temperature are normal, and **her IgA level is normal**.',
    w: {
      'itchy hives': 'She has IgE against a protein in the donor plasma, so her mast cells release histamine.',
      'her IgA level is normal': 'This rules out the severe anaphylaxis seen in IgA deficiency, where antibodies attack donor IgA.',
    },
    x: 'The recipient has IgE against a protein in the donor plasma. Mast cells release histamine, giving hives, itching and sometimes wheeze. It is usually mild and settles with antihistamines.',
    hy: ['Allergic transfusion reactions are type I (IgE) reactions to donor plasma proteins; true anaphylaxis suggests IgA deficiency with anti-IgA antibodies, so use washed or IgA-deficient products.'],
    lookalikes: {
      im_iga: 'In IgA deficiency, anti-IgA antibodies cause full anaphylaxis with shock during a transfusion.',
      im_fnhtr: 'A febrile reaction gives fever and chills without hives.',
      im_ahtr: 'An acute haemolytic reaction gives fever, hypotension, flank pain and red urine.',
    },
    vs: 'im_iga',
  },

  // ── Transplant ─────────────────────────────────────────────────────────
  {
    id: 'im_hyperacute', name: 'Hyperacute transplant rejection', chapter: 'transplant', tag: 'Type II hypersensitivity',
    s: '**Minutes after the vascular clamps are released** in a kidney transplant, the graft turns **mottled and dusky** and makes no urine. Biopsy shows **widespread clots in the graft vessels**.',
    w: {
      'Minutes after the vascular clamps are released': 'The recipient already has antibodies against the donor (from pregnancy, transfusion, a past transplant or ABO mismatch), so the attack is instant.',
      'mottled and dusky': 'Clots block the graft\'s blood supply, so the organ becomes ischaemic.',
      'widespread clots in the graft vessels': 'Antibodies bind the vessel lining and activate complement, which makes the vessels clot.',
    },
    x: 'The recipient already has antibodies against the donor\'s antigens (ABO or HLA). As soon as blood flows into the graft, the antibodies bind the vessel lining and activate complement. The vessels clot and the graft dies, so it must be removed.',
    hy: ['Hyperacute rejection is a type II reaction caused by pre-existing antibodies, within minutes; ABO typing and crossmatching prevent it.'],
    lookalikes: {
      im_acute_rej: 'Acute rejection takes weeks to months, from T cells or newly made antibodies.',
      im_chronic_rej: 'Chronic rejection develops over months to years with vessel narrowing and fibrosis.',
      im_gvhd: 'GVHD is donor T cells attacking the HOST (skin, gut, liver), mainly after bone marrow transplant.',
    },
    vs: 'im_acute_rej',
  },
  {
    id: 'im_acute_rej', name: 'Acute transplant rejection', chapter: 'transplant', tag: 'Cellular (type IV) ± humoral',
    s: '**Six weeks after** a kidney transplant, a 45-year-old man has a rising creatinine and a mild fever. He admits **missing doses of his immunosuppressant**. Biopsy shows a **dense lymphocytic infiltrate** in the graft with vasculitis.',
    w: {
      'Six weeks after': 'It takes weeks for the recipient\'s T cells to be activated against the donor MHC.',
      'missing doses of his immunosuppressant': 'Immunosuppressants keep T cells from activating; missed doses let rejection start.',
      'dense lymphocytic infiltrate': 'CD8 and CD4 T cells are invading the graft (a type IV reaction).',
    },
    x: 'In acute rejection, the recipient\'s T cells recognise the donor\'s MHC as foreign and attack the graft. Newly made antibodies can add damage (shown by C4d deposition). It happens weeks to months after the transplant and can usually be reversed with more immunosuppression.',
    hy: ['Acute rejection is cellular (CD8+ and CD4+ T cells against donor MHC) or humoral (new antibodies with C4d deposition); it can be reversed with immunosuppressants.'],
    lookalikes: {
      im_hyperacute: 'Hyperacute rejection happens within minutes from pre-existing antibodies, with graft thrombosis.',
      im_chronic_rej: 'Chronic rejection is a slow decline over months to years with arteriosclerosis and fibrosis.',
      im_gvhd: 'GVHD is donor immune cells attacking the host\'s skin, gut and liver.',
    },
    vs: 'im_chronic_rej',
  },
  {
    id: 'im_chronic_rej', name: 'Chronic transplant rejection', chapter: 'transplant', tag: 'Type II and IV',
    s: 'Six years after a kidney transplant, a 52-year-old woman\'s creatinine has crept up slowly over several years. Biopsy shows **thickened, narrowed graft arteries** with **interstitial fibrosis** and tubular atrophy.',
    w: {
      'thickened, narrowed graft arteries': 'Cytokines from recipient T cells make the smooth muscle in the graft\'s arteries grow, narrowing them.',
      'interstitial fibrosis': 'Years of low-grade injury and poor blood supply are repaired with scar tissue.',
    },
    x: 'In chronic rejection, recipient T cells and antibodies keep reacting to donor antigens at a low level for years. Their cytokines make the smooth muscle in graft arteries grow, narrowing them, and the organ slowly scars. It is the main cause of late graft loss.',
    hy: ['Chronic rejection by organ: chronic allograft nephropathy (kidney), bronchiolitis obliterans (lung), accelerated atherosclerosis (heart) and vanishing bile duct syndrome (liver).'],
    lookalikes: {
      im_acute_rej: 'Acute rejection occurs weeks to months after transplant with a dense lymphocytic infiltrate and is reversible.',
      im_hyperacute: 'Hyperacute rejection destroys the graft within minutes through vessel thrombosis.',
      im_gvhd: 'GVHD affects the host\'s skin, gut and liver, not the graft.',
    },
    vs: 'im_acute_rej',
  },
  {
    id: 'im_gvhd', name: 'Graft-versus-host disease', chapter: 'transplant', tag: 'Type IV hypersensitivity',
    s: 'Four weeks after an **allogeneic bone marrow transplant** for leukaemia, a 30-year-old woman develops a **rash that starts on her palms and soles and spreads**, **profuse watery diarrhoea** and jaundice.',
    w: {
      'allogeneic bone marrow transplant': 'The graft contains working donor T cells, and the host is too immunosuppressed to reject them.',
      'rash that starts on her palms and soles and spreads': 'Donor T cells attack the host\'s skin as foreign.',
      'profuse watery diarrhoea': 'Donor T cells attack the lining of the host\'s gut.',
    },
    x: 'In graft-versus-host disease, donor T cells in the graft see the recipient\'s tissues as foreign. Because the host is immunosuppressed, it cannot get rid of them. They attack the skin, gut and liver, causing rash, diarrhoea and jaundice.',
    hy: ['GVHD is a type IV reaction, most common after bone marrow and liver transplants; irradiate blood products for immunocompromised patients to prevent it.', 'After a bone marrow transplant for leukaemia, a related graft-versus-tumour effect can help.'],
    lookalikes: {
      im_acute_rej: 'Acute rejection is the host attacking the GRAFT, with graft dysfunction.',
      im_contact: 'Contact dermatitis is a rash only where skin touched an allergen, without diarrhoea or jaundice.',
      im_chronic_rej: 'Chronic rejection is slow graft scarring and vessel narrowing over years.',
    },
    vs: 'im_acute_rej',
  },
];

export const IMMUNO_BY_ID = Object.fromEntries(IMMUNO_CASES.map(c => [c.id, c]));
