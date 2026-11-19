'use strict';
/**
 * Buzz Fun — Reproductive (Vanilla bank).
 *
 * One row per card: [type, topic, clue, answer, [3 wrong answers], why].
 * `why` is a LIST of high-yield points (shown one per line). Wrong answers
 * come from the same topic. Add new cards at the END so ids (BF-REP-nnn)
 * stay stable. Run server/buzzfun/check.js after editing.
 *
 * (The UWorld bank has its own reproductive deck in uworld/reproductive.js;
 * this one is played when the host picks Vanilla.)
 */
module.exports = [
  // ── Embryology & sexual development ─────────────────────────────────────
  ['MECHANISM', 'Sexual development', 'Product of the SRY gene on the Y chromosome', 'Testis-determining factor', ['Antimüllerian hormone', 'Dihydrotestosterone', 'Inhibin B'], [
    'SRY turns the indifferent gonad into a testis.',
    'Sertoli cells then make AMH (Müllerian ducts regress); Leydig cells make testosterone (Wolffian ducts develop).',
    'Without SRY the default is female development.']],
  ['MECHANISM', 'Sexual development', 'Hormone that develops the prostate, penis and scrotum in the male fetus', 'Dihydrotestosterone', ['Testosterone', 'Antimüllerian hormone', 'Estradiol'], [
    'Testosterone is converted to DHT by 5α-reductase in target tissues.',
    'DHT: external genitalia and prostate; testosterone: Wolffian ducts (epididymis, vas, seminal vesicles).',
    '5α-reductase deficiency gives ambiguous genitalia until puberty, when testosterone rises.']],
  ['ASSOCIATION', 'Sexual development', 'Bicornuate uterus, recurrent miscarriage — failed step in development', 'Incomplete fusion of the paramesonephric ducts', ['Failed regression of the mesonephric ducts', 'Failed canalisation of the vaginal plate', 'Absent Müllerian duct development'], [
    'The paramesonephric (Müllerian) ducts fuse in the midline to form the uterus, tubes and upper vagina.',
    'Incomplete fusion → bicornuate uterus; failed septum resorption → septate uterus (most common anomaly).',
    'Associated with miscarriage, malpresentation and urinary tract anomalies.']],
  ['BUZZWORD', 'Sexual development', '46,XY with female external genitalia, blind vaginal pouch, no uterus, sparse pubic hair, inguinal testes', 'Androgen insensitivity syndrome', ['5α-reductase deficiency', 'Müllerian agenesis', 'Turner syndrome'], [
    'Defective androgen receptor (X-linked).',
    'AMH still works, so no uterus; testosterone, estrogen and LH are all high.',
    'Breasts develop from aromatised testosterone; gonadectomy after puberty (malignancy risk).']],
  ['BUZZWORD', 'Sexual development', 'Ambiguous genitalia at birth that virilise at puberty in a 46,XY child', '5α-reductase deficiency', ['Androgen insensitivity syndrome', 'Congenital adrenal hyperplasia', 'Klinefelter syndrome'], [
    'Cannot convert testosterone to DHT; autosomal recessive.',
    'Internal genitalia are male (testosterone acts on Wolffian ducts).',
    'Testosterone and estrogen normal; LH normal or high.']],
  ['BUZZWORD', 'Sexual development', 'Primary amenorrhoea, normal breasts and pubic hair, short blind vagina, 46,XX', 'Müllerian agenesis', ['Androgen insensitivity syndrome', 'Imperforate hymen', 'Turner syndrome'], [
    'Mayer-Rokitansky-Küster-Hauser syndrome: absent uterus and upper vagina.',
    'Ovaries are normal, so secondary sexual characteristics and hormones are normal.',
    'Distinguish from AIS by karyotype and normal pubic hair.']],
  ['BUZZWORD', 'Sexual development', 'Anosmia with delayed puberty and low FSH and LH', 'Kallmann syndrome', ['Klinefelter syndrome', 'Turner syndrome', 'Constitutional growth delay'], [
    'Failed migration of GnRH neurons and olfactory neurons from the olfactory placode.',
    'Hypogonadotropic hypogonadism: low GnRH, FSH, LH and sex steroids.',
    'Infertility treated with pulsatile GnRH or gonadotropins.']],

  // ── Chromosomal disorders ───────────────────────────────────────────────
  ['TRIAD', 'Sex chromosome disorders', 'Tall man with small firm testes, gynecomastia and infertility', 'Klinefelter syndrome (47,XXY)', ['Kallmann syndrome', 'Androgen insensitivity syndrome', 'Fragile X syndrome'], [
    'Seminiferous tubule dysgenesis → ↓ inhibin → ↑ FSH; Leydig dysfunction → ↓ testosterone → ↑ LH.',
    'Barr body present; nondisjunction in either parent.',
    'Increased risk of breast cancer and learning difficulties.']],
  ['TRIAD', 'Sex chromosome disorders', 'Short stature, webbed neck and primary amenorrhoea', 'Turner syndrome (45,X)', ['Noonan syndrome', 'Kallmann syndrome', 'Müllerian agenesis'], [
    'Streak ovaries → ↓ estrogen, ↑ FSH and LH (hypergonadotropic hypogonadism).',
    'Bicuspid aortic valve, coarctation and aortic dissection; horseshoe kidney.',
    'Newborn: cystic hygroma and lymphoedema of hands and feet.']],
  ['ASSOCIATION', 'Sex chromosome disorders', 'Most common cardiac lesion in Turner syndrome', 'Bicuspid aortic valve', ['Ventricular septal defect', 'Pulmonary stenosis', 'Transposition of the great arteries'], [
    'Also preductal coarctation of the aorta and aortic root dilation.',
    'Dissection is a leading cause of death, especially in pregnancy.',
    'Noonan syndrome (normal karyotype) has pulmonary stenosis instead.']],
  ['ASSOCIATION', 'Sex chromosome disorders', 'Turner syndrome kidney anomaly', 'Horseshoe kidney', ['Polycystic kidney disease', 'Renal agenesis', 'Posterior urethral valves'], [
    'Kidneys fused at the lower poles, trapped under the inferior mesenteric artery.',
    'Raises the risk of hydronephrosis, stones and infection.',
    'Also seen in trisomy 13, 18 and 21.']],

  // ── Menstrual cycle & hormones ──────────────────────────────────────────
  ['MECHANISM', 'Menstrual cycle', 'Trigger for the midcycle LH surge', 'Sustained high estrogen', ['Falling progesterone', 'Rising inhibin', 'Falling estrogen'], [
    'Estrogen normally gives negative feedback, but a sustained peak switches to positive feedback.',
    'The LH surge triggers ovulation about 36 hours later.',
    'Follicular phase length varies; luteal phase is fixed at about 14 days.']],
  ['MECHANISM', 'Menstrual cycle', 'Hormone that makes the endometrium secretory, raises body temperature and thickens cervical mucus', 'Progesterone', ['Estradiol', 'FSH', 'Inhibin'], [
    'Made by the corpus luteum after ovulation (and later the placenta).',
    'Spiral arteries, glycogen-rich glands, and a 0.5 °C temperature rise.',
    'Its withdrawal causes menstruation when the corpus luteum regresses.']],
  ['MECHANISM', 'Menstrual cycle', 'Two-cell model: cell that converts androgens to estradiol', 'Granulosa cell', ['Theca interna cell', 'Leydig cell', 'Oocyte'], [
    'LH stimulates theca cells to make androstenedione from cholesterol.',
    'FSH stimulates aromatase in granulosa cells, converting it to estradiol.',
    'Mirror of the testis: Leydig (LH) and Sertoli (FSH).']],
  ['ASSOCIATION', 'Menstrual cycle', 'Phase of the cycle with a fixed length of about 14 days', 'Luteal phase', ['Follicular phase', 'Menstrual phase', 'Proliferative phase'], [
    'The corpus luteum lives about 14 days unless rescued by hCG.',
    'Variation in cycle length comes from the follicular phase.',
    'Ovulation = cycle length minus 14 days.']],
  ['DEFICIENCY', 'Menstrual cycle', 'Amenorrhoea in a marathon runner with low body fat and low bone density', 'Functional hypothalamic amenorrhoea', ['Premature ovarian insufficiency', 'Polycystic ovary syndrome', 'Asherman syndrome'], [
    'Low energy availability suppresses pulsatile GnRH → low FSH, LH and estrogen.',
    'Female athlete triad: low energy, amenorrhoea, osteoporosis.',
    'Treat by restoring energy balance and weight.']],
  ['BUZZWORD', 'Menstrual cycle', 'Secondary amenorrhoea after a dilation and curettage, no bleeding after estrogen-progestin challenge', 'Asherman syndrome', ['Sheehan syndrome', 'Premature ovarian insufficiency', 'Polycystic ovary syndrome'], [
    'Intrauterine adhesions destroy the basal endometrium.',
    'Hormones are normal; the outflow (endometrium) is the problem.',
    'Diagnose and treat with hysteroscopy.']],
  ['ASSOCIATION', 'Menstrual cycle', 'Menopause lab pattern', 'High FSH, low estrogen', ['Low FSH, low estrogen', 'High FSH, high estrogen', 'Low FSH, high estrogen'], [
    'Follicles are depleted, so estrogen and inhibin fall and FSH rises (best marker).',
    'Estrone from fat aromatisation becomes the main estrogen.',
    'Before age 40 this is premature ovarian insufficiency.']],

  // ── Pregnancy physiology ────────────────────────────────────────────────
  ['MECHANISM', 'Pregnancy physiology', 'Main role of hCG in the first trimester', 'Maintains the corpus luteum', ['Triggers ovulation', 'Promotes lactation', 'Relaxes the pubic symphysis'], [
    'hCG acts on LH receptors to keep the corpus luteum making progesterone.',
    'The placenta takes over progesterone production by about 10 weeks.',
    'Very high hCG: molar pregnancy, multiple gestation, choriocarcinoma.']],
  ['MECHANISM', 'Pregnancy physiology', 'Placental hormone that causes insulin resistance in late pregnancy', 'Human placental lactogen', ['Human chorionic gonadotropin', 'Relaxin', 'Progesterone'], [
    'hPL (chorionic somatomammotropin) shifts glucose to the fetus.',
    'Rises through the second and third trimesters.',
    'Unmasks gestational diabetes when the pancreas cannot compensate.']],
  ['ASSOCIATION', 'Pregnancy physiology', 'Physiological anaemia of pregnancy', 'Plasma volume rises more than red cell mass', ['Iron is diverted to the fetus', 'Erythropoietin falls', 'Red cell lifespan shortens'], [
    'Plasma volume rises about 50%, red cell mass about 25%.',
    'Hemoglobin falls by dilution; viscosity falls, aiding placental flow.',
    'Iron deficiency is still common and should be treated.']],
  ['ASSOCIATION', 'Pregnancy physiology', 'Arterial blood gas of normal pregnancy', 'Respiratory alkalosis', ['Respiratory acidosis', 'Metabolic acidosis', 'Metabolic alkalosis'], [
    'Progesterone stimulates the respiratory centre, raising tidal volume.',
    'PaCO2 falls to about 30 mm Hg; kidneys excrete bicarbonate to compensate.',
    'This gradient helps CO2 pass from fetus to mother.']],
  ['ASSOCIATION', 'Pregnancy physiology', 'Haemodynamic value that FALLS in normal pregnancy', 'Systemic vascular resistance', ['Cardiac output', 'Heart rate', 'Plasma volume'], [
    'Progesterone and nitric oxide relax vascular smooth muscle.',
    'Blood pressure dips in the second trimester.',
    'Cardiac output rises 30 to 50%, mainly via stroke volume.']],
  ['MECHANISM', 'Pregnancy physiology', 'Why lactation does not begin until after delivery despite high prolactin', 'Placental progesterone blocks it', ['Prolactin receptors are absent', 'Oxytocin levels are too low', 'hCG inhibits the breast'], [
    'High estrogen and progesterone block prolactin action on milk production.',
    'Delivery of the placenta removes them, and milk comes in over 2 to 3 days.',
    'Retained placenta can delay lactation.']],
  ['ASSOCIATION', 'Pregnancy physiology', 'Twin placentation when the embryo splits on days 4 to 8', 'Monochorionic diamniotic', ['Dichorionic diamniotic', 'Monochorionic monoamniotic', 'Conjoined twins'], [
    'Split before day 4: dichorionic diamniotic.',
    'Days 8 to 12: monochorionic monoamniotic; after day 13: conjoined.',
    'Monochorionic twins risk twin-twin transfusion syndrome.']],

  // ── Obstetric complications ─────────────────────────────────────────────
  ['TRIAD', 'Obstetric complications', 'New hypertension after 20 weeks with proteinuria', 'Preeclampsia', ['Gestational hypertension', 'Chronic hypertension', 'HELLP syndrome'], [
    'Abnormal spiral artery remodelling → placental ischaemia → sFlt-1 blocks VEGF → endothelial dysfunction.',
    'Severe features: BP ≥160/110, headache, visual change, RUQ pain, low platelets.',
    'Magnesium sulfate prevents seizures; delivery is curative. Low-dose aspirin prevents it in high-risk women.']],
  ['TRIAD', 'Obstetric complications', 'Hemolysis, elevated liver enzymes, low platelets in the third trimester', 'HELLP syndrome', ['Acute fatty liver of pregnancy', 'Intrahepatic cholestasis of pregnancy', 'Thrombotic thrombocytopenic purpura'], [
    'Variant of severe preeclampsia (BP may be normal).',
    'Schistocytes and high LDH; risk of hepatic hematoma and rupture.',
    'Treat with delivery.']],
  ['BUZZWORD', 'Obstetric complications', 'Painless bright red bleeding in the third trimester', 'Placenta previa', ['Placental abruption', 'Vasa previa', 'Uterine rupture'], [
    'Placenta over or near the internal os.',
    'Risk factors: prior cesarean, multiparity, advanced maternal age.',
    'Never do a digital cervical exam; diagnose by ultrasound.']],
  ['BUZZWORD', 'Obstetric complications', 'Painful bleeding with a hard, tender uterus and fetal distress', 'Placental abruption', ['Placenta previa', 'Vasa previa', 'Placenta accreta'], [
    'Premature separation of the placenta from the decidua.',
    'Risk factors: hypertension, cocaine, trauma, smoking.',
    'Can cause DIC and fetal death.']],
  ['BUZZWORD', 'Obstetric complications', 'Painless bleeding at rupture of membranes with sudden fetal bradycardia', 'Vasa previa', ['Placenta previa', 'Placental abruption', 'Uterine rupture'], [
    'Fetal vessels run through the membranes over the internal os.',
    'Rupture bleeds FETAL blood, so the fetus exsanguinates quickly.',
    'Emergency cesarean.']],
  ['BUZZWORD', 'Obstetric complications', 'Placenta that will not separate after delivery in a woman with a prior cesarean', 'Placenta accreta spectrum', ['Uterine atony', 'Retained products of conception', 'Uterine inversion'], [
    'Defective decidua basalis lets villi attach to (accreta), invade (increta) or penetrate (percreta) the myometrium.',
    'Biggest risks: prior cesarean plus placenta previa.',
    'Often needs cesarean hysterectomy.']],
  ['ASSOCIATION', 'Obstetric complications', 'Most common cause of postpartum haemorrhage', 'Uterine atony', ['Retained placenta', 'Genital tract laceration', 'Coagulopathy'], [
    'Boggy uterus after delivery; risk with overdistension, long labor, magnesium.',
    'Treat with uterine massage then oxytocin, methylergonovine, carboprost, misoprostol.',
    'Avoid methylergonovine in hypertension and carboprost in asthma.']],
  ['BUZZWORD', 'Obstetric complications', 'Sudden hypoxia, hypotension and DIC during labor or right after delivery', 'Amniotic fluid embolism', ['Pulmonary embolism', 'Peripartum cardiomyopathy', 'Eclampsia'], [
    'Fetal material enters maternal circulation, causing an anaphylactoid reaction.',
    'Cardiorespiratory collapse and DIC within minutes.',
    'High mortality; treatment is supportive.']],

  // ── Pregnancy loss & ectopic ────────────────────────────────────────────
  ['BUZZWORD', 'Early pregnancy', 'Missed period, unilateral pelvic pain, vaginal bleeding and an adnexal mass', 'Ectopic pregnancy', ['Ovarian torsion', 'Threatened abortion', 'Ruptured corpus luteum cyst'], [
    'Most commonly in the ampulla of the fallopian tube.',
    'Risk factors: prior PID, tubal surgery, prior ectopic, IUD in place.',
    'Stable and unruptured: methotrexate; unstable: surgery.']],
  ['MECHANISM', 'Early pregnancy', 'Drug for a small unruptured ectopic pregnancy — how it works', 'Inhibits dihydrofolate reductase', ['Blocks progesterone receptors', 'Stimulates uterine contractions', 'Inhibits aromatase'], [
    'Methotrexate stops DNA synthesis in rapidly dividing trophoblast.',
    'Follow beta-hCG until undetectable.',
    'Contraindicated in rupture, instability or a high hCG with fetal heart activity.']],
  ['ASSOCIATION', 'Early pregnancy', 'Most common cause of first-trimester miscarriage', 'Chromosomal abnormality', ['Uterine anomaly', 'Antiphospholipid syndrome', 'Maternal infection'], [
    'Usually autosomal trisomy (trisomy 16 is the most common).',
    'Recurrent loss: check karyotype of both parents, antiphospholipid antibodies, uterine anatomy.',
    'Second-trimester loss suggests cervical insufficiency or uterine anomaly.']],
  ['MECHANISM', 'Early pregnancy', 'Mifepristone action in medical abortion', 'Progesterone receptor antagonist', ['Prostaglandin E1 analog', 'Oxytocin receptor agonist', 'Folate antagonist'], [
    'Blocks progesterone, so the decidua breaks down and the cervix softens.',
    'Followed by misoprostol (PGE1 analog) to cause contractions.',
    'Also used for Cushing syndrome (glucocorticoid receptor block).']],

  // ── Gestational trophoblastic disease ───────────────────────────────────
  ['BUZZWORD', 'Trophoblastic disease', 'Snowstorm ultrasound, uterus large for dates, very high hCG, no fetal parts', 'Complete hydatidiform mole', ['Partial hydatidiform mole', 'Choriocarcinoma', 'Missed abortion'], [
    '46,XX (usually), all paternal DNA: an empty egg fertilised by one sperm that duplicates.',
    'Hyperemesis, early preeclampsia, theca lutein cysts, hyperthyroidism (hCG acts on TSH receptor).',
    'Suction curettage, then follow hCG to zero; 15 to 20% become malignant.']],
  ['BUZZWORD', 'Trophoblastic disease', 'Triploid conceptus with fetal parts and patchy swollen villi', 'Partial hydatidiform mole', ['Complete hydatidiform mole', 'Invasive mole', 'Placental site trophoblastic tumour'], [
    '69,XXX or 69,XXY: a normal egg fertilised by two sperm.',
    'hCG raised less; lower risk of choriocarcinoma than a complete mole.',
    'p57 stain positive (maternal DNA present), unlike a complete mole.']],
  ['BUZZWORD', 'Trophoblastic disease', 'Hemoptysis and very high hCG months after a molar pregnancy; sheets of trophoblast with no villi', 'Choriocarcinoma', ['Invasive mole', 'Partial hydatidiform mole', 'Placental site trophoblastic tumour'], [
    'Malignant cytotrophoblast and syncytiotrophoblast with no chorionic villi.',
    'Spreads by blood early, especially to the lungs ("cannonball" nodules).',
    'Very sensitive to methotrexate-based chemotherapy.']],

  // ── Ovarian tumours ──────────────────────────────────────────────────────
  ['BUZZWORD', 'Ovarian tumours', 'Ovarian cyst containing hair, teeth and sebum', 'Mature cystic teratoma', ['Endometrioma', 'Mucinous cystadenoma', 'Dysgerminoma'], [
    'Most common ovarian germ cell tumour; benign (dermoid cyst).',
    'Common cause of ovarian torsion.',
    'Struma ovarii (thyroid tissue) can cause hyperthyroidism.']],
  ['BUZZWORD', 'Ovarian tumours', 'Call-Exner bodies, endometrial hyperplasia and precocious puberty', 'Granulosa cell tumour', ['Sertoli-Leydig cell tumour', 'Thecoma', 'Yolk sac tumour'], [
    'Most common malignant sex cord-stromal tumour; secretes estrogen.',
    'Postmenopausal bleeding or precocious puberty from estrogen excess.',
    'Inhibin is the tumour marker.']],
  ['BUZZWORD', 'Ovarian tumours', 'Schiller-Duval bodies and raised AFP in a young girl', 'Yolk sac tumour', ['Dysgerminoma', 'Choriocarcinoma', 'Immature teratoma'], [
    'Glomerulus-like structures (Schiller-Duval bodies).',
    'Aggressive malignant germ cell tumour of children and young women.',
    'AFP is the marker.']],
  ['BUZZWORD', 'Ovarian tumours', 'Sheets of "fried egg" cells, raised LDH, adolescent girl', 'Dysgerminoma', ['Yolk sac tumour', 'Granulosa cell tumour', 'Mature cystic teratoma'], [
    'Ovarian counterpart of the testicular seminoma.',
    'Very radiosensitive; good prognosis.',
    'Associated with Turner syndrome and gonadal dysgenesis.']],
  ['TRIAD', 'Ovarian tumours', 'Ovarian fibroma, ascites and right pleural effusion', 'Meigs syndrome', ['Krukenberg tumour', 'Pseudomyxoma peritonei', 'Ovarian hyperstimulation syndrome'], [
    'Benign fibroma with ascites and hydrothorax.',
    'All resolve after the tumour is removed.',
    'Fibromas are bundles of spindle fibroblasts.']],
  ['BUZZWORD', 'Ovarian tumours', 'Bilateral ovarian masses with mucin-filled signet ring cells', 'Krukenberg tumour', ['Mucinous cystadenocarcinoma', 'Brenner tumour', 'Serous cystadenocarcinoma'], [
    'Metastasis, classically from diffuse gastric adenocarcinoma.',
    'Signet ring cells push the nucleus aside.',
    'Bilateral ovarian masses should prompt a GI search.']],
  ['ASSOCIATION', 'Ovarian tumours', 'Most common malignant ovarian tumour; psammoma bodies; BRCA1', 'High-grade serous carcinoma', ['Mucinous carcinoma', 'Endometrioid carcinoma', 'Clear cell carcinoma'], [
    'Often arises from the fallopian tube fimbria.',
    'CA-125 used to monitor; presents late with ascites and bloating.',
    'OCPs and pregnancy lower risk (fewer ovulations).']],
  ['BUZZWORD', 'Ovarian tumours', 'Ovarian tumour with "coffee bean" nuclei and Walthard-like urothelial nests', 'Brenner tumour', ['Granulosa cell tumour', 'Fibroma', 'Dysgerminoma'], [
    'Usually benign; urothelium-like (transitional) epithelium.',
    'Nuclear grooves give the coffee-bean look.',
    'Granulosa cell tumours also have coffee-bean nuclei but with Call-Exner bodies.']],

  // ── Uterus & cervix ──────────────────────────────────────────────────────
  ['BUZZWORD', 'Uterus & cervix', 'Irregular, enlarged uterus with heavy periods; whorled smooth muscle', 'Leiomyoma', ['Adenomyosis', 'Endometrial carcinoma', 'Leiomyosarcoma'], [
    'Most common tumour in women; more common in Black women.',
    'Estrogen-sensitive: grow in pregnancy, shrink after menopause.',
    'Benign; does not progress to leiomyosarcoma.']],
  ['BUZZWORD', 'Uterus & cervix', 'Uniformly enlarged, soft, tender ("boggy") uterus with painful heavy periods', 'Adenomyosis', ['Leiomyoma', 'Endometriosis', 'Endometrial hyperplasia'], [
    'Endometrial glands and stroma within the myometrium.',
    'Common in multiparous women in their 40s.',
    'Hysterectomy is definitive.']],
  ['TRIAD', 'Uterus & cervix', 'Dysmenorrhoea, dyspareunia and infertility', 'Endometriosis', ['Adenomyosis', 'Pelvic inflammatory disease', 'Leiomyoma'], [
    'Endometrial tissue outside the uterus (ovary most common: chocolate cysts).',
    'Retrograde menstruation is the leading theory.',
    'Treat with NSAIDs, OCPs, progestins, GnRH agonists; laparoscopy for diagnosis.']],
  ['ASSOCIATION', 'Uterus & cervix', 'Major risk factor for endometrioid (type 1) endometrial cancer', 'Unopposed estrogen', ['HPV infection', 'BRCA1 mutation', 'Prior cesarean section'], [
    'Obesity, PCOS, nulliparity, early menarche, late menopause, tamoxifen.',
    'Preceded by endometrial hyperplasia; PTEN mutations.',
    'Serous (type 2) is p53-related, in older thin women, and more aggressive.']],
  ['ASSOCIATION', 'Uterus & cervix', 'Lynch syndrome cancer second only to colon', 'Endometrial carcinoma', ['Ovarian carcinoma', 'Breast carcinoma', 'Cervical carcinoma'], [
    'Mismatch repair gene mutation (MLH1, MSH2); microsatellite instability.',
    'Screening includes endometrial sampling.',
    'Also gastric, small bowel, urothelial and ovarian cancers.']],
  ['MECHANISM', 'Uterus & cervix', 'How HPV E6 and E7 cause cervical cancer', 'Inactivate p53 and Rb', ['Activate RAS and MYC', 'Inactivate BRCA1 and BRCA2', 'Activate HER2 and EGFR'], [
    'E6 degrades p53; E7 binds Rb, releasing E2F.',
    'High-risk types 16 and 18; transformation zone is most vulnerable.',
    'Koilocytes mark HPV infection on Pap smear.']],
  ['ASSOCIATION', 'Uterus & cervix', 'Most common cause of death in invasive cervical cancer', 'Renal failure from ureteral obstruction', ['Liver metastasis', 'Pulmonary embolism', 'Massive haemorrhage'], [
    'Lateral spread obstructs the ureters → hydronephrosis → uremia.',
    'Squamous cell carcinoma is the most common type.',
    'HIV raises the risk (AIDS-defining).']],

  // ── Breast ───────────────────────────────────────────────────────────────
  ['BUZZWORD', 'Breast', 'Mobile, rubbery, well-circumscribed breast lump in a young woman', 'Fibroadenoma', ['Phyllodes tumour', 'Fibrocystic change', 'Intraductal papilloma'], [
    'Most common benign breast tumour; stroma compresses ducts into slits.',
    'Grows with estrogen (pregnancy) and may be tender before periods.',
    'Not a precursor to cancer.']],
  ['BUZZWORD', 'Breast', 'Bloody nipple discharge from one duct, no mass', 'Intraductal papilloma', ['Ductal carcinoma in situ', 'Paget disease of the breast', 'Mammary duct ectasia'], [
    'Benign papillary growth in a large lactiferous duct beneath the areola.',
    'Fibrovascular cores lined by epithelium and myoepithelium.',
    'Excised to exclude papillary carcinoma.']],
  ['BUZZWORD', 'Breast', 'Rapidly growing large breast mass with "leaf-like" projections in an older woman', 'Phyllodes tumour', ['Fibroadenoma', 'Medullary carcinoma', 'Inflammatory carcinoma'], [
    'Overgrowth of stroma forming leaf-like fronds.',
    'Peaks in the 50s; some are malignant.',
    'Wide local excision.']],
  ['BUZZWORD', 'Breast', 'Eczematous, scaly nipple that does not heal with steroid cream', 'Paget disease of the breast', ['Intraductal papilloma', 'Mammary duct ectasia', 'Fat necrosis'], [
    'Malignant cells with clear halos in the epidermis of the nipple.',
    'Almost always signals underlying DCIS or invasive carcinoma.',
    'Paget cells are positive for HER2 and CK7.']],
  ['BUZZWORD', 'Breast', 'Single-file "Indian file" cells and loss of E-cadherin', 'Invasive lobular carcinoma', ['Invasive ductal carcinoma', 'Medullary carcinoma', 'Mucinous carcinoma'], [
    'CDH1 mutation; cells lack cohesion.',
    'Often bilateral and multifocal.',
    'Spreads to unusual sites (peritoneum, ovaries, GI tract).']],
  ['BUZZWORD', 'Breast', 'Red, warm, swollen breast with peau d\'orange and no fever', 'Inflammatory breast carcinoma', ['Acute mastitis', 'Fat necrosis', 'Paget disease of the breast'], [
    'Tumour emboli block dermal lymphatics.',
    'Poor prognosis; often mistaken for mastitis.',
    'Breast abscess and mastitis are usually in breastfeeding women.']],
  ['ASSOCIATION', 'Breast', 'Breast cancer marker targeted by trastuzumab', 'HER2/neu', ['Estrogen receptor', 'BRCA1', 'E-cadherin'], [
    'HER2 is a receptor tyrosine kinase (ERBB2) — amplified in about 20%.',
    'Trastuzumab is a monoclonal antibody; cardiotoxicity is the key side effect.',
    'Triple-negative cancers lack ER, PR and HER2; linked with BRCA1.']],
  ['ASSOCIATION', 'Breast', 'Firm breast lump after a seatbelt injury; calcifications and foamy macrophages on biopsy', 'Fat necrosis', ['Fibroadenoma', 'Invasive ductal carcinoma', 'Phyllodes tumour'], [
    'Necrotic fat with foamy macrophages and calcium soaps.',
    'Can mimic cancer on exam and mammography.',
    'Benign; history of trauma or surgery.']],

  // ── Infections ───────────────────────────────────────────────────────────
  ['BUZZWORD', 'Genital infections', 'Thin grey discharge, fishy odour, clue cells, pH above 4.5', 'Bacterial vaginosis', ['Trichomoniasis', 'Vulvovaginal candidiasis', 'Gonococcal cervicitis'], [
    'Gardnerella overgrowth as lactobacilli decline; no inflammation.',
    'Positive whiff test (amines with KOH).',
    'Metronidazole or clindamycin; partners not treated.']],
  ['BUZZWORD', 'Genital infections', 'Frothy green discharge, strawberry cervix and motile pear-shaped organisms', 'Trichomoniasis', ['Bacterial vaginosis', 'Vulvovaginal candidiasis', 'Chlamydial cervicitis'], [
    'Trichomonas vaginalis, a flagellated protozoan.',
    'Wet mount shows motile trophozoites; NAAT is more sensitive.',
    'Metronidazole for the patient AND partner.']],
  ['BUZZWORD', 'Genital infections', 'Thick white "cottage cheese" discharge with itching after antibiotics', 'Vulvovaginal candidiasis', ['Bacterial vaginosis', 'Trichomoniasis', 'Atrophic vaginitis'], [
    'Pseudohyphae on KOH; normal vaginal pH.',
    'Risk: antibiotics, diabetes, pregnancy, immunosuppression.',
    'Fluconazole or topical azoles.']],
  ['BUZZWORD', 'Genital infections', 'Painless genital ulcer with a clean base and firm, rolled edges', 'Primary syphilis', ['Chancroid', 'Genital herpes', 'Lymphogranuloma venereum'], [
    'Treponema pallidum chancre; heals by itself in weeks.',
    'Dark-field microscopy; RPR/VDRL then treponemal test.',
    'Benzathine penicillin G.']],
  ['BUZZWORD', 'Genital infections', 'Painful genital ulcer with ragged edges and suppurative inguinal nodes', 'Chancroid', ['Primary syphilis', 'Lymphogranuloma venereum', 'Granuloma inguinale'], [
    'Haemophilus ducreyi ("you do cry").',
    'School-of-fish arrangement on Gram stain.',
    'Azithromycin or ceftriaxone.']],
  ['BUZZWORD', 'Genital infections', 'Painless ulcer followed by painful, matted inguinal nodes that drain', 'Lymphogranuloma venereum', ['Chancroid', 'Primary syphilis', 'Genital herpes'], [
    'Chlamydia trachomatis serovars L1 to L3.',
    'Can cause proctitis and rectal strictures.',
    'Doxycycline.']],
  ['ASSOCIATION', 'Genital infections', 'Violin-string adhesions between the liver capsule and the abdominal wall', 'Fitz-Hugh–Curtis syndrome', ['Tubo-ovarian abscess', 'Pelvic tuberculosis', 'Actinomycosis'], [
    'Perihepatitis complicating PID (chlamydia or gonorrhea).',
    'Right upper quadrant pain with pelvic infection.',
    'PID also leaves tubal scarring → infertility and ectopic pregnancy.']],

  // ── Male reproductive ───────────────────────────────────────────────────
  ['BUZZWORD', 'Male reproductive', 'Sudden severe scrotal pain, high-riding testis, absent cremasteric reflex', 'Testicular torsion', ['Epididymitis', 'Torsion of the appendix testis', 'Varicocele'], [
    'Bell-clapper deformity: testis poorly anchored to the tunica vaginalis.',
    'Twisting blocks venous outflow first, then arterial supply.',
    'Surgery within 6 hours; fix both testes.']],
  ['BUZZWORD', 'Male reproductive', '"Bag of worms" in the left scrotum that grows on standing', 'Varicocele', ['Hydrocele', 'Spermatocele', 'Indirect inguinal hernia'], [
    'Dilated pampiniform plexus; left gonadal vein drains into the left renal vein at a right angle.',
    'Sudden right-sided or non-reducing varicocele: think renal cell carcinoma or IVC obstruction.',
    'Cause of infertility (raised scrotal temperature); does not transilluminate.']],
  ['BUZZWORD', 'Male reproductive', 'Painless scrotal swelling that glows when a light is shone through it', 'Hydrocele', ['Varicocele', 'Testicular seminoma', 'Scrotal hematocele'], [
    'Fluid within the tunica vaginalis.',
    'Congenital: patent processus vaginalis (communicating), usually resolves by age 1 to 2.',
    'Spermatocele also transilluminates but sits on the epididymis.']],
  ['BUZZWORD', 'Male reproductive', 'Painless homogeneous testicular mass with "fried egg" cells, raised PLAP', 'Seminoma', ['Embryonal carcinoma', 'Yolk sac tumour', 'Leydig cell tumour'], [
    'Most common testicular tumour; peak age 15 to 35.',
    'Very radiosensitive; late metastasis; excellent prognosis.',
    'AFP is never raised in a pure seminoma.']],
  ['BUZZWORD', 'Male reproductive', 'Testicular tumour with Reinke crystals and precocious puberty or gynecomastia', 'Leydig cell tumour', ['Sertoli cell tumour', 'Seminoma', 'Choriocarcinoma'], [
    'Golden-brown tumour; makes androgens or estrogens.',
    'Usually benign.',
    'Reinke crystals are rod-shaped cytoplasmic inclusions.']],
  ['ASSOCIATION', 'Male reproductive', 'Most common testicular cancer in men over 60', 'Lymphoma', ['Seminoma', 'Embryonal carcinoma', 'Yolk sac tumour'], [
    'Usually diffuse large B-cell lymphoma; often bilateral.',
    'Arises as metastasis or primary; aggressive.',
    'Germ cell tumours dominate in young men.']],
  ['ASSOCIATION', 'Male reproductive', 'Zone of the prostate where most adenocarcinomas arise', 'Peripheral zone', ['Transition zone', 'Central zone', 'Periurethral zone'], [
    'Peripheral zone sits against the rectum, so cancer can be felt on rectal exam.',
    'BPH arises in the transition zone (periurethral), causing obstruction.',
    'Osteoblastic bone metastases via the vertebral venous plexus.']],
  ['MECHANISM', 'Male reproductive', 'Finasteride mechanism in BPH', '5α-reductase inhibition', ['Alpha-1 receptor blockade', 'Androgen receptor blockade', 'GnRH receptor agonism'], [
    'Blocks conversion of testosterone to DHT, shrinking the prostate over months.',
    'Lowers PSA by about half — double the value to interpret it.',
    'Also used for male-pattern baldness; teratogenic to a male fetus.']],
  ['BUZZWORD', 'Male reproductive', 'Young man with posterior testicular pain relieved by lifting the testis, intact cremasteric reflex', 'Acute epididymitis', ['Testicular torsion', 'Orchitis from mumps', 'Varicocele'], [
    'Under 35: chlamydia or gonorrhea; over 35 or insertive anal sex: E. coli.',
    'Pain relief on elevation is Prehn sign.',
    'Ceftriaxone plus doxycycline in young sexually active men.']],

  // ── Reproductive pharmacology ───────────────────────────────────────────
  ['MECHANISM', 'Reproductive drugs', 'Clomiphene mechanism for ovulation induction', 'Blocks hypothalamic estrogen receptors', ['Inhibits ovarian aromatase', 'Stimulates FSH receptors directly', 'Blocks progesterone receptors'], [
    'Selective estrogen receptor modulator: removes negative feedback → ↑ GnRH, FSH, LH.',
    'Side effects: hot flashes, multiple pregnancy, visual disturbance, ovarian enlargement.',
    'Letrozole (aromatase inhibitor) is now first-line for PCOS.']],
  ['SIDE_EFFECT', 'Reproductive drugs', 'Tamoxifen increases the risk of these two serious problems', 'Endometrial cancer and thromboembolism', ['Osteoporosis and fractures', 'Breast cancer and stroke', 'Hepatitis and pancreatitis'], [
    'SERM: antagonist at the breast, agonist at the uterus and bone.',
    'Raloxifene is an antagonist at the uterus, so no endometrial cancer risk (but still clots).',
    'Both protect bone.']],
  ['SIDE_EFFECT', 'Reproductive drugs', 'Aromatase inhibitor side effect in postmenopausal breast cancer', 'Osteoporosis', ['Endometrial cancer', 'Venous thromboembolism', 'Hepatotoxicity'], [
    'Anastrozole and letrozole block peripheral conversion of androgens to estrogen.',
    'Low estrogen causes bone loss and arthralgia.',
    'Used for ER-positive cancer after menopause.']],
  ['MECHANISM', 'Reproductive drugs', 'Leuprolide given continuously for prostate cancer', 'Downregulates pituitary GnRH receptors', ['Blocks androgen receptors', 'Inhibits 5α-reductase', 'Inhibits 17α-hydroxylase'], [
    'Initial flare of LH and testosterone, then suppression.',
    'An antiandrogen (flutamide, bicalutamide) covers the flare.',
    'Given in pulses it STIMULATES — used for infertility.']],
  ['SIDE_EFFECT', 'Reproductive drugs', 'Combined oral contraceptives are contraindicated in a smoker over 35 because of', 'Thromboembolic risk', ['Hepatic adenoma risk', 'Breast cancer risk', 'Ovarian cancer risk'], [
    'Estrogen raises clotting factors; smoking adds arterial and venous risk.',
    'Also avoid in migraine with aura, prior VTE and estrogen-dependent cancer.',
    'COCs LOWER ovarian and endometrial cancer risk.']],
  ['MECHANISM', 'Reproductive drugs', 'Terbutaline and nifedipine use in pregnancy', 'Tocolysis', ['Cervical ripening', 'Seizure prophylaxis', 'Fetal lung maturity'], [
    'Relax uterine smooth muscle to delay preterm labor for 48 hours.',
    'Indomethacin and magnesium are also used.',
    'Corticosteroids (betamethasone) are given for fetal lung maturity in that window.']],
  ['SIDE_EFFECT', 'Reproductive drugs', 'Danazol side effect in a woman treated for endometriosis', 'Weight gain and hirsutism', ['Hot flashes only', 'Endometrial hyperplasia', 'Galactorrhoea'], [
    'Synthetic androgen that also acts as a partial agonist at androgen receptors.',
    'Acne, hirsutism, deep voice, weight gain, hepatotoxicity.',
    'Also used for hereditary angioedema.']],
  ['MECHANISM', 'Reproductive drugs', 'Oxytocin effect beyond uterine contraction', 'Milk let-down', ['Milk production', 'Cervical softening', 'Ovulation'], [
    'Released from the posterior pituitary in response to suckling.',
    'Contracts myoepithelial cells around alveoli (ejection).',
    'Prolactin drives milk PRODUCTION; high doses of oxytocin can cause water retention.']],
];
