'use strict';
/**
 * Buzz Fun — Endocrinology.
 *
 * One row per card: [type, topic, clue, answer, [3 wrong answers], why].
 * `why` here is a LIST of high-yield points (shown one per line); the older
 * decks use one sentence plus extra-*.js. Add new cards at the END so ids
 * (BF-END-nnn) stay stable. Run server/buzzfun/check.js after editing.
 */
module.exports = [
  // ── Hypothalamus & pituitary ────────────────────────────────────────────
  ['BUZZWORD', 'Pituitary', 'Galactorrhoea, amenorrhoea and infertility in a woman; bitemporal hemianopia in a man with headaches and low libido', 'Prolactinoma', ['Somatotroph adenoma', 'Craniopharyngioma', 'Sheehan syndrome'], [
    'Most common pituitary adenoma; prolactin suppresses GnRH → hypogonadism.',
    'Women present early (menstrual change); men late with a macroadenoma and mass effect.',
    'First-line: dopamine agonists (cabergoline, bromocriptine) — even for large tumours.',
    'Other causes of ↑ prolactin: pregnancy, antipsychotics, metoclopramide, hypothyroidism (↑ TRH), CKD.']],
  ['BUZZWORD', 'Pituitary', 'Enlarging hands and feet (ring and shoe size), coarse facies, prognathism, macroglossia, sweating', 'Acromegaly', ['Gigantism from a prolactinoma', 'Cushing disease', 'Hypothyroidism'], [
    'GH excess from a somatotroph adenoma; before epiphyseal closure it causes gigantism.',
    'Screen with IGF-1; confirm with failure of GH to suppress after an oral glucose load.',
    'Death from heart failure (cardiomyopathy); also diabetes, colon polyps, sleep apnoea.',
    'Treat: transsphenoidal surgery; octreotide, pegvisomant (GH receptor antagonist).']],
  ['BUZZWORD', 'Pituitary', 'Failure to lactate and amenorrhoea after a delivery complicated by massive postpartum haemorrhage', 'Sheehan syndrome', ['Prolactinoma', 'Lymphocytic hypophysitis', 'Asherman syndrome'], [
    'Ischaemic necrosis of the pituitary, which enlarges in pregnancy without more blood supply.',
    'First sign: no lactation (↓ prolactin); later loss of pubic hair, fatigue, hypothyroidism.',
    'Panhypopituitarism: replace cortisol FIRST, then thyroid hormone.',
    'Lymphocytic hypophysitis is autoimmune and occurs in pregnancy or postpartum WITHOUT haemorrhage.']],
  ['BUZZWORD', 'Pituitary', 'Child with headache, bitemporal hemianopia and growth failure; calcified suprasellar cyst with "motor oil" fluid', 'Craniopharyngioma', ['Pituitary adenoma', 'Pinealoma', 'Medulloblastoma'], [
    'Derived from Rathke pouch remnants (oral ectoderm).',
    'Most common supratentorial tumour of childhood; calcification is the clue.',
    'Can cause diabetes insipidus and hypopituitarism.']],
  ['BUZZWORD', 'Pituitary', 'Polyuria and dilute urine after head trauma; urine osmolality rises after desmopressin', 'Central diabetes insipidus', ['Nephrogenic diabetes insipidus', 'Primary polydipsia', 'SIADH'], [
    '↓ ADH from the hypothalamus or posterior pituitary (trauma, surgery, tumour, idiopathic).',
    'Water deprivation test: urine stays dilute; desmopressin raises urine osmolality > 50%.',
    'Serum sodium high-normal or ↑; treat with desmopressin.']],
  ['SIDE_EFFECT', 'Pituitary', 'Polyuria, dilute urine and high-normal sodium in a patient on long-term lithium; no response to desmopressin', 'Nephrogenic diabetes insipidus', ['Central diabetes insipidus', 'Primary polydipsia', 'SIADH'], [
    'Collecting duct resistance to ADH (lithium, demeclocycline, hypercalcaemia, hypokalaemia, V2 receptor mutation).',
    'Desmopressin does not concentrate the urine.',
    'Treat: stop the cause; thiazides, amiloride (for lithium), indomethacin.']],
  ['BUZZWORD', 'Pituitary', 'Euvolaemic hyponatraemia with concentrated urine (urine Osm > 100) in a smoker with a central lung mass', 'SIADH', ['Primary polydipsia', 'Cerebral salt wasting', 'Adrenal insufficiency'], [
    'Causes: small cell lung cancer, CNS disease, pulmonary disease, drugs (SSRIs, carbamazepine, cyclophosphamide).',
    'Labs: ↓ serum Na and Osm, ↑ urine Osm and Na; normal volume.',
    'Treat: fluid restriction, salt tablets, tolvaptan/conivaptan, demeclocycline.',
    'Correct slowly: too fast → osmotic demyelination (central pontine myelinolysis).']],
  ['TRIAD', 'Pituitary', 'Delayed puberty, anosmia, low GnRH, FSH and LH', 'Kallmann syndrome', ['Klinefelter syndrome', 'Turner syndrome', 'Androgen insensitivity syndrome'], [
    'Failed migration of GnRH neurons and olfactory neurons from the olfactory placode.',
    'Hypogonadotropic hypogonadism (low LH/FSH) — unlike Klinefelter and Turner (high LH/FSH).',
    'May have colour blindness or renal agenesis.']],
  ['BUZZWORD', 'Pituitary', 'Sudden severe headache, visual loss and ophthalmoplegia in a patient with a known pituitary adenoma', 'Pituitary apoplexy', ['Subarachnoid haemorrhage', 'Cavernous sinus thrombosis', 'Sheehan syndrome'], [
    'Haemorrhage into a pituitary adenoma.',
    'Medical emergency: acute adrenal insufficiency from loss of ACTH.',
    'Treat with high-dose glucocorticoids and surgical decompression.']],

  // ── Thyroid ─────────────────────────────────────────────────────────────
  ['BUZZWORD', 'Thyroid', 'Hyperthyroidism with exophthalmos, pretibial myxoedema and a diffuse goitre with a bruit', 'Graves disease', ['Toxic multinodular goitre', 'Subacute granulomatous thyroiditis', 'Toxic adenoma'], [
    'TSH-receptor stimulating antibodies (type II hypersensitivity); diffuse ↑ radioiodine uptake.',
    'Ophthalmopathy and dermopathy come from fibroblasts expressing the TSH receptor (GAGs).',
    'Treat: β-blockers, methimazole (PTU in 1st trimester), radioiodine, thyroidectomy.',
    'Radioiodine can worsen the eye disease — give steroids.']],
  ['BUZZWORD', 'Thyroid', 'Painless, firm, enlarged thyroid with hypothyroidism; Hürthle cells and germinal centres on biopsy', 'Hashimoto thyroiditis', ['Riedel thyroiditis', 'Subacute granulomatous thyroiditis', 'Graves disease'], [
    'Most common cause of hypothyroidism in iodine-sufficient regions.',
    'Anti-TPO and anti-thyroglobulin antibodies; HLA-DR3 and DR5.',
    'Can start with transient hyperthyroidism (hashitoxicosis).',
    '↑ risk of primary thyroid lymphoma (MALT).']],
  ['BUZZWORD', 'Thyroid', 'Very tender thyroid, fever and transient hyperthyroidism after a viral illness; ↑ ESR, ↓ radioiodine uptake', 'Subacute granulomatous (de Quervain) thyroiditis', ['Graves disease', 'Hashimoto thyroiditis', 'Acute suppurative thyroiditis'], [
    'Granulomatous inflammation with multinucleated giant cells.',
    'Course: hyperthyroid → hypothyroid → usually recovers.',
    'Treat with NSAIDs or steroids for pain, β-blockers for symptoms.']],
  ['BUZZWORD', 'Thyroid', 'Rock-hard, fixed, painless goitre that compresses the trachea; mimics anaplastic carcinoma', 'Riedel thyroiditis', ['Hashimoto thyroiditis', 'Anaplastic carcinoma', 'Subacute granulomatous thyroiditis'], [
    'Fibrous tissue replaces the thyroid and extends into neck structures.',
    'IgG4-related disease (with retroperitoneal fibrosis, autoimmune pancreatitis).',
    'Patients are usually hypothyroid.']],
  ['BUZZWORD', 'Thyroid', 'Fever, tachycardia/AF, agitation, vomiting and diarrhoea in a hyperthyroid patient after surgery or infection', 'Thyroid storm', ['Phaeochromocytoma crisis', 'Serotonin syndrome', 'Neuroleptic malignant syndrome'], [
    'Triggers: surgery, infection, childbirth, iodine load, stopping antithyroid drugs.',
    'Treat with the 4 Ps: β-blocker (propranolol), PTU, prednisolone, potassium iodide.',
    'Iodide is given AFTER PTU to block new hormone synthesis first.']],
  ['TRIAD', 'Thyroid', 'Infant with a protruding tongue, umbilical hernia, poor feeding, jaundice and coarse facies', 'Congenital hypothyroidism (cretinism)', ['Down syndrome', 'Beckwith–Wiedemann syndrome', 'Hurler syndrome'], [
    'Causes: thyroid dysgenesis (most common in iodine-sufficient areas), dyshormonogenesis, iodine deficiency.',
    'The 6 Ps: Pot-bellied, Pale, Puffy-faced, Protruding umbilicus, Protuberant tongue, Poor brain development.',
    'Screened at birth (TSH) — early levothyroxine prevents intellectual disability.']],
  ['BUZZWORD', 'Thyroid', 'Thyroid nodule biopsy: "Orphan Annie eye" nuclei, nuclear grooves and psammoma bodies', 'Papillary thyroid carcinoma', ['Follicular thyroid carcinoma', 'Medullary thyroid carcinoma', 'Anaplastic thyroid carcinoma'], [
    'Most common thyroid cancer; excellent prognosis.',
    'Risk: childhood head and neck irradiation; RET/PTC rearrangements, BRAF mutations.',
    'Spreads by lymphatics to cervical nodes.']],
  ['BUZZWORD', 'Thyroid', 'Thyroid cancer diagnosed only by capsular or vascular invasion, spreading by blood to bone and lung', 'Follicular thyroid carcinoma', ['Papillary thyroid carcinoma', 'Medullary thyroid carcinoma', 'Follicular adenoma'], [
    'Uniform follicles; FNA cannot tell it from an adenoma — needs the whole capsule.',
    'Mutations: RAS, PAX8-PPARγ translocation.',
    'Haematogenous spread (vs papillary: lymphatic).']],
  ['BUZZWORD', 'Thyroid', 'Thyroid tumour from parafollicular C cells with amyloid stroma; ↑ calcitonin', 'Medullary thyroid carcinoma', ['Papillary thyroid carcinoma', 'Anaplastic thyroid carcinoma', 'Follicular thyroid carcinoma'], [
    'Amyloid is derived from calcitonin; stains with Congo red.',
    'Associated with MEN2A and MEN2B (RET mutation) — prophylactic thyroidectomy in carriers.',
    'Screen for phaeochromocytoma before surgery in MEN2.']],
  ['BUZZWORD', 'Thyroid', 'Rapidly enlarging neck mass with hoarseness and dysphagia in an elderly patient; undifferentiated cells', 'Anaplastic thyroid carcinoma', ['Riedel thyroiditis', 'Papillary thyroid carcinoma', 'Primary thyroid lymphoma'], [
    'Older patients; very poor prognosis.',
    'TP53 mutation.',
    'Invades local structures (trachea, oesophagus, recurrent laryngeal nerve).']],
  ['SIDE_EFFECT', 'Thyroid', 'Antithyroid drug preferred in the first trimester and in thyroid storm; risk of severe hepatotoxicity', 'Propylthiouracil', ['Methimazole', 'Potassium iodide', 'Propranolol'], [
    'Inhibits thyroid peroxidase AND peripheral conversion of T4 to T3.',
    'Shared risks: agranulocytosis (check WBC with fever or sore throat), rash.',
    'Methimazole is used otherwise — it is teratogenic in the 1st trimester (aplasia cutis).']],
  ['SIDE_EFFECT', 'Thyroid', 'Aplasia cutis congenita in a baby whose mother took this drug in the first trimester', 'Methimazole', ['Propylthiouracil', 'Levothyroxine', 'Lithium'], [
    'Inhibits thyroid peroxidase (organification and coupling).',
    'Preferred outside the 1st trimester; less hepatotoxic than PTU.',
    'Agranulocytosis is the most dangerous shared side effect.']],
  ['SIDE_EFFECT', 'Thyroid', 'Tachycardia, heat intolerance, AF and bone loss in a patient being treated for hypothyroidism', 'Levothyroxine excess', ['Methimazole excess', 'Iodine deficiency', 'Lithium toxicity'], [
    'Iatrogenic hyperthyroidism; TSH is suppressed.',
    'Elderly and cardiac patients start low and go slow.',
    'Absorption ↓ by calcium, iron, PPIs — take on an empty stomach.']],
  ['ASSOCIATION', 'Thyroid', 'Hypothyroidism or hyperthyroidism, pulmonary fibrosis and blue-grey skin from a drug rich in iodine', 'Amiodarone', ['Lithium', 'Interferon-α', 'Propranolol'], [
    'Iodine load can cause either hypo- (Wolff–Chaikoff) or hyperthyroidism (Jod-Basedow).',
    'Monitor TFTs, LFTs and PFTs on amiodarone.',
    'Lithium causes hypothyroidism and nephrogenic DI.']],

  // ── Parathyroid & calcium ───────────────────────────────────────────────
  ['BUZZWORD', 'Calcium', 'Hypercalcaemia, hypophosphataemia, ↑ PTH, kidney stones and bone pain; often found on routine labs', 'Primary hyperparathyroidism', ['Secondary hyperparathyroidism', 'Malignancy (PTHrP)', 'Familial hypocalciuric hypercalcaemia'], [
    'Most common cause: parathyroid adenoma.',
    '"Stones, bones, groans, thrones, psychiatric overtones."',
    'Osteitis fibrosa cystica: subperiosteal resorption, "brown tumours".',
    'Most common cause of hypercalcaemia in outpatients (malignancy in inpatients).']],
  ['BUZZWORD', 'Calcium', 'CKD patient with low calcium, high phosphate and high PTH', 'Secondary hyperparathyroidism', ['Primary hyperparathyroidism', 'Tertiary hyperparathyroidism', 'Pseudohypoparathyroidism'], [
    'Kidneys fail to make calcitriol and excrete phosphate → low calcium drives PTH.',
    'Renal osteodystrophy.',
    'Treat with phosphate binders, calcitriol, cinacalcet.']],
  ['BUZZWORD', 'Calcium', 'Long-standing CKD, now with HIGH calcium and very high PTH', 'Tertiary hyperparathyroidism', ['Secondary hyperparathyroidism', 'Primary hyperparathyroidism', 'Milk-alkali syndrome'], [
    'Autonomous PTH secretion after chronic stimulation (parathyroid hyperplasia).',
    'Seen in CKD and after renal transplant.',
    'Treat with parathyroidectomy.']],
  ['BUZZWORD', 'Calcium', 'Perioral tingling, carpopedal spasm with a BP cuff, twitching when the facial nerve is tapped — after thyroid surgery', 'Hypoparathyroidism', ['Hypomagnesaemia from PPIs', 'Vitamin D deficiency', 'Pseudohypoparathyroidism'], [
    'Trousseau sign (cuff) and Chvostek sign (facial nerve tap) = hypocalcaemia.',
    'Causes: surgical removal, autoimmune, DiGeorge.',
    'Labs: ↓ calcium, ↑ phosphate, ↓ PTH.',
    'ECG: prolonged QT.']],
  ['BUZZWORD', 'Calcium', 'Short stature, round face, short 4th and 5th metacarpals with hypocalcaemia and HIGH PTH', 'Pseudohypoparathyroidism type 1A', ['Hypoparathyroidism', 'Turner syndrome', 'Pseudopseudohypoparathyroidism'], [
    'Albright hereditary osteodystrophy: end-organ (kidney, bone) resistance to PTH.',
    'GNAS mutation inherited from the MOTHER (imprinting).',
    'Pseudopseudohypoparathyroidism: same physical features, normal calcium and PTH (paternal GNAS).']],
  ['BUZZWORD', 'Calcium', 'Mild hypercalcaemia, normal or slightly ↑ PTH, LOW urinary calcium; asymptomatic family members', 'Familial hypocalciuric hypercalcaemia', ['Primary hyperparathyroidism', 'Vitamin D toxicity', 'Sarcoidosis'], [
    'Inactivating mutation of the calcium-sensing receptor (CaSR) — autosomal dominant.',
    'Benign; no treatment needed.',
    'Distinguish from primary hyperparathyroidism by the low urinary calcium excretion.']],
  ['ASSOCIATION', 'Calcium', 'Hypercalcaemia with SUPPRESSED PTH in a smoker with a lung mass', 'PTHrP from squamous cell lung cancer', ['Primary hyperparathyroidism', 'Ectopic ACTH', 'Small cell lung cancer (SIADH)'], [
    'Humoral hypercalcaemia of malignancy: squamous cell (lung, head and neck), renal, breast.',
    'Other malignant causes: osteolytic metastases, myeloma, calcitriol from lymphoma.',
    'Treat with IV fluids, bisphosphonates, calcitonin.']],
  ['SIDE_EFFECT', 'Calcium', 'Calcimimetic that lowers PTH by sensitising the calcium-sensing receptor; can cause hypocalcaemia', 'Cinacalcet', ['Alendronate', 'Teriparatide', 'Calcitonin'], [
    'Used in secondary hyperparathyroidism and parathyroid carcinoma.',
    'Teriparatide: recombinant PTH given intermittently → builds bone (osteoporosis).',
    'Bisphosphonates: pill oesophagitis, osteonecrosis of the jaw, atypical femoral fracture.']],

  // ── Adrenal ─────────────────────────────────────────────────────────────
  ['BUZZWORD', 'Adrenal', 'Cushing syndrome with high ACTH that SUPPRESSES with high-dose dexamethasone', 'Cushing disease (pituitary ACTH adenoma)', ['Ectopic ACTH secretion', 'Adrenal adenoma', 'Exogenous glucocorticoids'], [
    'Most common endogenous cause of Cushing syndrome.',
    'Bilateral adrenal hyperplasia from ACTH.',
    'Treat: transsphenoidal surgery.']],
  ['BUZZWORD', 'Adrenal', 'Cushing syndrome with very high ACTH that does NOT suppress, hypokalaemia and weight loss in a smoker', 'Ectopic ACTH secretion', ['Cushing disease (pituitary ACTH adenoma)', 'Adrenal adenoma', 'Exogenous glucocorticoids'], [
    'Sources: small cell lung cancer, bronchial carcinoid.',
    'Hypokalaemic alkalosis and hyperpigmentation are prominent.',
    'Inferior petrosal sinus sampling separates pituitary from ectopic sources.']],
  ['BUZZWORD', 'Adrenal', 'Cushing syndrome with LOW ACTH and a unilateral adrenal mass; contralateral gland atrophied', 'Adrenal adenoma', ['Cushing disease (pituitary ACTH adenoma)', 'Ectopic ACTH secretion', 'Bilateral adrenal hyperplasia'], [
    'ACTH-independent: cortisol suppresses ACTH.',
    'Most common overall cause of Cushing syndrome is exogenous steroids (also low ACTH).',
    'Screening tests: 24-h urine cortisol, late-night salivary cortisol, low-dose dexamethasone test.']],
  ['BUZZWORD', 'Adrenal', 'Fatigue, weight loss, hyperpigmentation, hypotension, hyponatraemia and hyperkalaemia', 'Primary adrenal insufficiency (Addison disease)', ['Secondary adrenal insufficiency', 'Hypothyroidism', 'SIADH'], [
    'Most common cause in developed countries: autoimmune; worldwide: TB.',
    '↑ ACTH (and MSH) causes hyperpigmentation — absent in secondary insufficiency.',
    'Loss of aldosterone → ↑ K+, ↓ Na+, metabolic acidosis.',
    'Treat with hydrocortisone and fludrocortisone.']],
  ['BUZZWORD', 'Adrenal', 'Fatigue and hyponatraemia WITHOUT hyperpigmentation or hyperkalaemia after stopping long-term prednisone', 'Secondary adrenal insufficiency', ['Primary adrenal insufficiency (Addison disease)', 'Conn syndrome', 'Cushing syndrome'], [
    '↓ ACTH from the pituitary (or suppression by exogenous steroids).',
    'Aldosterone is preserved (renin–angiotensin control) — so potassium is normal.',
    'Taper steroids gradually after > 3 weeks of use.']],
  ['BUZZWORD', 'Adrenal', 'Child with meningococcal sepsis, purpura, shock and bilateral adrenal haemorrhage', 'Waterhouse–Friderichsen syndrome', ['Addison disease', 'Disseminated intravascular coagulation alone', 'Sheehan syndrome'], [
    'Acute primary adrenal insufficiency.',
    'Neisseria meningitidis (also Pseudomonas, S. pneumoniae).',
    'Treat with IV hydrocortisone, fluids, antibiotics.']],
  ['BUZZWORD', 'Adrenal', 'Resistant hypertension with hypokalaemia, metabolic alkalosis and LOW renin', 'Primary hyperaldosteronism (Conn syndrome)', ['Renal artery stenosis', 'Cushing syndrome', 'Liddle syndrome'], [
    'Adrenal adenoma or bilateral adrenal hyperplasia.',
    'Screen: high aldosterone-to-renin ratio. No oedema (aldosterone escape).',
    'Treat with spironolactone/eplerenone, or adrenalectomy for an adenoma.',
    'Secondary hyperaldosteronism (renal artery stenosis, CHF) has HIGH renin.']],
  ['BUZZWORD', 'Adrenal', 'Newborn girl with ambiguous genitalia and salt wasting (hyponatraemia, hyperkalaemia, hypotension); ↑ 17-hydroxyprogesterone', '21-hydroxylase deficiency', ['11β-hydroxylase deficiency', '17α-hydroxylase deficiency', 'Androgen insensitivity syndrome'], [
    'Most common congenital adrenal hyperplasia.',
    '↓ cortisol and aldosterone, ↑ androgens; ↑ ACTH → adrenal hyperplasia.',
    'Boys present with salt wasting or precocious puberty.',
    'Treat with glucocorticoids and mineralocorticoids.']],
  ['BUZZWORD', 'Adrenal', 'Virilisation with HYPERtension and hypokalaemia; ↑ 11-deoxycorticosterone', '11β-hydroxylase deficiency', ['21-hydroxylase deficiency', '17α-hydroxylase deficiency', 'Conn syndrome'], [
    '11-deoxycorticosterone is a weak mineralocorticoid → hypertension, low renin.',
    '↓ cortisol and aldosterone, ↑ androgens.',
    'The 1 at the start ("11") = hypertension; "21" = hypotension.']],
  ['BUZZWORD', 'Adrenal', 'Hypertension, hypokalaemia and NO sexual development; phenotypic females, XY patients undervirilised', '17α-hydroxylase deficiency', ['21-hydroxylase deficiency', '11β-hydroxylase deficiency', 'Androgen insensitivity syndrome'], [
    '↓ cortisol and sex hormones, ↑ mineralocorticoids (11-deoxycorticosterone).',
    'XX: lack secondary sexual characteristics; XY: ambiguous or female genitalia.',
    'Low renin from excess mineralocorticoid.']],
  ['TRIAD', 'Adrenal', 'Episodic headaches, sweating and palpitations with severe hypertension', 'Phaeochromocytoma', ['Carcinoid syndrome', 'Thyroid storm', 'Panic disorder'], [
    'Catecholamine-secreting chromaffin tumour of the adrenal medulla.',
    'Diagnose: plasma free or urine metanephrines; then imaging.',
    'Treat: α-blocker FIRST (phenoxybenzamine), then β-blocker, then surgery.',
    'Rule of 10s; associated with MEN2A/2B, VHL, NF1.']],
  ['BUZZWORD', 'Adrenal', 'Child with an abdominal mass crossing the midline, opsoclonus–myoclonus, ↑ urinary HVA and VMA', 'Neuroblastoma', ['Wilms tumour', 'Phaeochromocytoma', 'Hepatoblastoma'], [
    'Most common adrenal medullary tumour in children (neural crest).',
    'Homer-Wright rosettes; N-myc amplification = worse prognosis.',
    'Wilms tumour does not usually cross the midline.']],
  ['ASSOCIATION', 'Adrenal', 'Hormone made in the zona glomerulosa ("salt")', 'Aldosterone', ['Cortisol', 'DHEA', 'Epinephrine'], [
    'GFR = salt, sugar, sex: glomerulosa (aldosterone), fasciculata (cortisol), reticularis (androgens).',
    'Glomerulosa is controlled by angiotensin II and K+; fasciculata and reticularis by ACTH.',
    'The medulla (chromaffin cells) makes catecholamines.']],

  // ── Pancreas & diabetes ────────────────────────────────────────────────
  ['BUZZWORD', 'Diabetes', 'Thin 12-year-old with polyuria, polydipsia, weight loss; undetectable C-peptide', 'Type 1 diabetes mellitus', ['Type 2 diabetes mellitus', 'MODY', 'Central diabetes insipidus'], [
    'Autoimmune destruction of β cells (T-cell mediated); anti-GAD, anti-insulin antibodies.',
    'HLA-DR3 and DR4.',
    'Prone to DKA; always needs insulin.']],
  ['BUZZWORD', 'Diabetes', 'Obese adult with insulin resistance, acanthosis nigricans and amyloid deposits in the islets', 'Type 2 diabetes mellitus', ['Type 1 diabetes mellitus', 'Cushing syndrome', 'Acromegaly'], [
    'Strong genetic predisposition; obesity drives insulin resistance.',
    'Islet amyloid polypeptide (amylin) deposition.',
    'First-line: lifestyle + metformin; HHS rather than DKA.']],
  ['TRIAD', 'Diabetes', 'Kussmaul respirations, fruity breath, abdominal pain; glucose 450, anion gap metabolic acidosis', 'Diabetic ketoacidosis', ['Hyperosmolar hyperglycaemic state', 'Lactic acidosis', 'Alcoholic ketoacidosis'], [
    'Insulin deficiency → ketogenesis (β-hydroxybutyrate, acetoacetate).',
    'Total body K+ is LOW even if serum K+ is high — replace as insulin drives K+ into cells.',
    'Treat: IV fluids, insulin, potassium; add glucose when sugar falls to ~200.',
    'Complications: cerebral oedema (children), mucormycosis, hypokalaemia.']],
  ['BUZZWORD', 'Diabetes', 'Elderly type 2 diabetic with confusion, glucose > 600, serum osmolality > 320 and no ketoacidosis', 'Hyperosmolar hyperglycaemic state', ['Diabetic ketoacidosis', 'Hypoglycaemia', 'Central pontine myelinolysis'], [
    'Enough insulin to prevent ketogenesis but not hyperglycaemia.',
    'Profound dehydration from osmotic diuresis.',
    'Treat with IV fluids, insulin, potassium.']],
  ['BUZZWORD', 'Diabetes', 'Fasting hypoglycaemia with HIGH insulin and HIGH C-peptide; Whipple triad', 'Insulinoma', ['Exogenous insulin injection', 'Sulfonylurea ingestion', 'Adrenal insufficiency'], [
    'Whipple triad: low glucose, symptoms, relief with glucose.',
    'Associated with MEN1.',
    'Sulfonylureas also raise both — screen the urine/serum for the drug.']],
  ['BUZZWORD', 'Diabetes', 'Hypoglycaemic nurse with HIGH insulin but LOW C-peptide', 'Exogenous insulin injection', ['Insulinoma', 'Sulfonylurea ingestion', 'Glucagonoma'], [
    'Recombinant insulin has no C-peptide; endogenous insulin does.',
    'Classic factitious disorder scenario (healthcare worker).',
    'Proinsulin is also low with exogenous insulin.']],
  ['TRIAD', 'Diabetes', 'Necrolytic migratory erythema, diabetes, weight loss and DVT', 'Glucagonoma', ['Somatostatinoma', 'VIPoma', 'Insulinoma'], [
    'α-cell tumour of the pancreas.',
    'Also anaemia and depression.',
    'Treat: octreotide, surgery.']],
  ['TRIAD', 'Diabetes', 'Diabetes, gallstones, steatorrhoea and hypochlorhydria from an islet tumour', 'Somatostatinoma', ['Glucagonoma', 'Gastrinoma', 'VIPoma'], [
    'δ-cell tumour; somatostatin inhibits insulin, CCK, secretin, gastrin.',
    'Achlorhydria from inhibited gastrin and acid.',
    'Treat: surgery.']],
  ['TRIAD', 'Diabetes', 'Watery diarrhoea, hypokalaemia and achlorhydria (WDHA)', 'VIPoma', ['Carcinoid syndrome', 'Gastrinoma', 'Somatostatinoma'], [
    'Vasoactive intestinal peptide tumour of the pancreas.',
    'Secretory diarrhoea persists with fasting.',
    'Treat with octreotide.']],
  ['BUZZWORD', 'Diabetes', 'Multiple refractory peptic ulcers in the jejunum, diarrhoea and a positive secretin stimulation test', 'Gastrinoma (Zollinger–Ellison)', ['Helicobacter pylori ulcer disease', 'VIPoma', 'Carcinoid syndrome'], [
    'Gastrin-secreting tumour of the pancreas or duodenum.',
    'Secretin INCREASES gastrin in Zollinger–Ellison (normally suppresses it).',
    'Associated with MEN1; treat with high-dose PPI and surgery.']],
  ['ASSOCIATION', 'Diabetes', 'Diabetes from an autosomal dominant mutation in glucokinase or HNF-1α in a lean young adult with a strong family history', 'MODY', ['Type 1 diabetes mellitus', 'Type 2 diabetes mellitus', 'LADA'], [
    'Maturity-onset diabetes of the young: monogenic, autosomal dominant.',
    'Glucokinase MODY: mild stable fasting hyperglycaemia, usually no treatment.',
    'HNF-1α MODY responds well to sulfonylureas.']],
  ['ASSOCIATION', 'Diabetes', 'Glycosuria with normal blood glucose in a pregnant woman', 'Reduced renal threshold for glucose in pregnancy', ['Gestational diabetes', 'Fanconi syndrome', 'Type 1 diabetes mellitus'], [
    'GFR rises in pregnancy so more glucose is filtered than reabsorbed.',
    'Gestational diabetes is diagnosed with a glucose tolerance test (24–28 weeks).',
    'Babies of diabetic mothers: macrosomia, neonatal hypoglycaemia, caudal regression.']],

  // ── MEN & carcinoid ─────────────────────────────────────────────────────
  ['ASSOCIATION', 'MEN syndromes', 'Pituitary adenoma, parathyroid hyperplasia and pancreatic tumours (gastrinoma)', 'MEN1', ['MEN2A', 'MEN2B', 'Von Hippel–Lindau syndrome'], [
    'The 3 Ps: Pituitary, Parathyroid, Pancreas.',
    'MEN1 (menin) tumour suppressor gene, chromosome 11.',
    'Often presents with kidney stones or peptic ulcers.']],
  ['ASSOCIATION', 'MEN syndromes', 'Medullary thyroid carcinoma, phaeochromocytoma and parathyroid hyperplasia', 'MEN2A', ['MEN1', 'MEN2B', 'Neurofibromatosis type 1'], [
    'RET proto-oncogene, autosomal dominant.',
    'The 2 Ps: Parathyroid, Phaeochromocytoma (plus medullary thyroid cancer).',
    'Prophylactic thyroidectomy for RET carriers.']],
  ['ASSOCIATION', 'MEN syndromes', 'Medullary thyroid carcinoma, phaeochromocytoma, mucosal neuromas and a marfanoid habitus', 'MEN2B', ['MEN2A', 'MEN1', 'Marfan syndrome'], [
    'RET mutation; no parathyroid disease.',
    'Mucosal neuromas of lips and tongue; intestinal ganglioneuromas.',
    'Medullary thyroid cancer is aggressive and early.']],
  ['TRIAD', 'Carcinoid', 'Flushing, diarrhoea and wheezing with right-sided valve disease in a patient with liver metastases', 'Carcinoid syndrome', ['VIPoma', 'Mastocytosis', 'Phaeochromocytoma'], [
    'Serotonin from neuroendocrine tumours (small bowel) reaching the systemic circulation via liver metastases.',
    '↑ urinary 5-HIAA; niacin deficiency (tryptophan used up).',
    'Treat with octreotide; avoid triggers (alcohol, stress).',
    'Bronchial carcinoids cause symptoms without liver metastases.']],

  // ── Endocrine drugs ─────────────────────────────────────────────────────
  ['SIDE_EFFECT', 'Endocrine drugs', 'Lactic acidosis risk in renal failure; GI upset and B12 deficiency; no hypoglycaemia', 'Metformin', ['Glipizide', 'Pioglitazone', 'Sitagliptin'], [
    'Biguanide: ↓ hepatic gluconeogenesis, ↑ insulin sensitivity.',
    'First-line for type 2 diabetes; weight neutral or loss.',
    'Hold before IV contrast and in significant renal impairment.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Hypoglycaemia and weight gain from a drug that closes β-cell K+ATP channels', 'Sulfonylureas (glipizide, glyburide)', ['Metformin', 'Pioglitazone', 'Empagliflozin'], [
    'Depolarise β cells → insulin release; need functioning β cells.',
    'First generation (chlorpropamide): disulfiram-like reaction with alcohol.',
    'Glyburide: higher risk of hypoglycaemia in the elderly and in renal failure.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Weight gain, oedema, heart failure exacerbation and fractures from a PPAR-γ agonist', 'Thiazolidinediones (pioglitazone)', ['Metformin', 'Sulfonylureas (glipizide, glyburide)', 'GLP-1 agonists'], [
    'Increase insulin sensitivity via adiponectin and PPAR-γ.',
    'Contraindicated in NYHA class III–IV heart failure.',
    'No hypoglycaemia on their own.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'UTIs, genital yeast infections, euglycaemic DKA and volume depletion', 'SGLT2 inhibitors (empagliflozin)', ['DPP-4 inhibitors (sitagliptin)', 'GLP-1 agonists', 'Thiazolidinediones (pioglitazone)'], [
    'Block glucose reabsorption in the proximal tubule.',
    'Cardio- and renoprotective: ↓ heart failure hospitalisation and CKD progression.',
    'Weight loss and modest BP reduction.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Nausea, pancreatitis and a boxed warning for medullary thyroid carcinoma; marked weight loss', 'GLP-1 agonists (semaglutide, liraglutide)', ['DPP-4 inhibitors (sitagliptin)', 'SGLT2 inhibitors (empagliflozin)', 'Pramlintide'], [
    '↑ glucose-dependent insulin release, ↓ glucagon, slow gastric emptying, ↑ satiety.',
    'Contraindicated with a personal or family history of MTC or MEN2.',
    'Cardiovascular benefit; weight loss.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Mild URIs and rarely pancreatitis from an oral drug that stops incretin breakdown', 'DPP-4 inhibitors (sitagliptin)', ['GLP-1 agonists (semaglutide, liraglutide)', 'Acarbose', 'Metformin'], [
    'Inhibit dipeptidyl peptidase-4 → ↑ endogenous GLP-1 and GIP.',
    'Weight neutral; low hypoglycaemia risk.',
    'Acarbose (α-glucosidase inhibitor) causes flatulence and diarrhoea.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Hypoglycaemia, hypokalaemia and lipodystrophy at injection sites', 'Insulin', ['Metformin', 'Pioglitazone', 'Sitagliptin'], [
    'Insulin drives K+ into cells — used to treat hyperkalaemia (with glucose).',
    'Rapid: lispro, aspart; short: regular; intermediate: NPH; long: glargine, detemir.',
    'Only regular insulin is routinely given IV (DKA).']],
  ['ASSOCIATION', 'Endocrine drugs', 'Somatostatin analogue for acromegaly, carcinoid, VIPoma, glucagonoma and variceal bleeding', 'Octreotide', ['Pegvisomant', 'Cabergoline', 'Desmopressin'], [
    'Inhibits GH, insulin, glucagon, VIP, gastrin and splanchnic blood flow.',
    'Side effects: gallstones, nausea, steatorrhoea.',
    'Pegvisomant is a GH receptor antagonist (acromegaly).']],
  ['ASSOCIATION', 'Endocrine drugs', 'V2 receptor antagonist used for euvolaemic or hypervolaemic hyponatraemia (SIADH)', 'Tolvaptan', ['Desmopressin', 'Demeclocycline', 'Fludrocortisone'], [
    'Conivaptan blocks V1a and V2 (IV).',
    'Risk: overly rapid sodium correction, liver injury.',
    'Demeclocycline causes nephrogenic DI — another SIADH option.']],
  ['ASSOCIATION', 'Endocrine drugs', 'ADH analogue for central DI, haemophilia A, von Willebrand disease and bedwetting', 'Desmopressin', ['Tolvaptan', 'Vasopressin', 'Oxytocin'], [
    'V2 agonist: ↑ water reabsorption in the collecting duct.',
    'Releases factor VIII and vWF from endothelial cells.',
    'Risk: hyponatraemia.']],
  ['ASSOCIATION', 'Endocrine drugs', 'Mineralocorticoid replacement in Addison disease', 'Fludrocortisone', ['Dexamethasone', 'Spironolactone', 'Hydrocortisone alone'], [
    'Synthetic mineralocorticoid with little glucocorticoid activity.',
    'Side effects: oedema, hypertension, hypokalaemia.',
    'Also used for orthostatic hypotension.']],
  ['SIDE_EFFECT', 'Endocrine drugs', 'Gynaecomastia and hyperkalaemia from an aldosterone antagonist used in Conn syndrome', 'Spironolactone', ['Eplerenone', 'Amiloride', 'Hydrochlorothiazide'], [
    'Also an androgen receptor antagonist → gynaecomastia, ↓ libido.',
    'Eplerenone is more selective — fewer antiandrogen effects.',
    'Used in heart failure, cirrhotic ascites, hirsutism (PCOS).']],
];
