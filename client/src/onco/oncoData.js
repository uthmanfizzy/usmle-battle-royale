/**
 * Onco Atlas — breast and reproductive tumours (female and male).
 *
 * Facts follow First Aid's Reproductive pathology section; every line is
 * written in our own words (the repository is public — no copied text).
 *
 *   ORGANS   the atlas hotspots, each with a short "what to know first"
 *   TUMORS   one entry per lesion:
 *     id, name, organ, kind     benign | premalignant | in situ | malignant | variable
 *     fam       lesions that share a defining clue (the two yolk sac tumours,
 *               the two choriocarcinomas, the teratomas, seminoma and its
 *               ovarian twin) — never offered as options against each other
 *     who, presents, micro, marker, assoc, hook   the card
 *     clues     [{ t: 'histo' | 'marker' | 'assoc' | 'present', x }] —
 *               each must point to this lesion (or its family) alone
 *     case      { who, sees, more[] } — Tumor Board vignettes are built from it;
 *               `sees` must never name the lesion
 *
 * After editing, run: node tools/onco-check.mjs
 */

export const KINDS = {
  benign: { label: 'Benign', tone: 'ok' },
  premalignant: { label: 'Precursor', tone: 'warn' },
  insitu: { label: 'In situ', tone: 'warn' },
  malignant: { label: 'Malignant', tone: 'bad' },
  variable: { label: 'Benign or malignant', tone: 'warn' },
};

export const CLUE_TYPES = {
  histo: { label: 'Under the microscope', icon: '🔬' },
  marker: { label: 'Marker', icon: '🧪' },
  assoc: { label: 'Association', icon: '🔗' },
  present: { label: 'Presentation', icon: '🩺' },
};

export const ORGANS = [
  {
    id: 'breast', name: 'Breast', sex: 'both', icon: '🎀',
    intro: [
      'Most cancers start in the terminal duct lobular unit and usually show up after menopause as a hard lump, most often in the upper outer quadrant.',
      'Invasion of Cooper ligaments and the skin pulls the nipple in and dimples the skin.',
      'Risk rises with age, atypical hyperplasia, a family history, BRCA1/BRCA2, more lifetime oestrogen (early menarche, nulliparity, late first pregnancy, no breastfeeding), obesity after menopause and alcohol.',
      'In men the big risks are BRCA2 and Klinefelter syndrome.',
      'ER/PR or HER2 positivity is common; triple-negative disease behaves worst. In early disease, axillary node spread is the strongest prognostic factor.',
    ],
  },
  {
    id: 'vulva', name: 'Vulva', sex: 'F', icon: '🌸',
    intro: [
      'Two routes to vulvar squamous cell carcinoma: high-risk HPV (16, 18) in younger women, and years of lichen sclerosus in older women.',
      'White, leathery or ulcerated lesions look alike, so a biopsy decides.',
    ],
  },
  {
    id: 'vagina', name: 'Vagina', sex: 'F', icon: '🔻',
    intro: [
      'Primary vaginal cancer is rare: most vaginal squamous cancers have spread down from the cervix.',
      'Two exam favourites: clear cell adenocarcinoma after in-utero DES exposure, and the grapelike sarcoma of small girls.',
    ],
  },
  {
    id: 'cervix', name: 'Cervix', sex: 'F', icon: '⭕',
    intro: [
      'Driven by high-risk HPV (16, 18). Dysplasia starts at the transformation zone and is caught early by Pap smear.',
      'Cervical cancer is diagnosed youngest (under 45) and has the best prognosis of the three big gynaecologic cancers.',
    ],
  },
  {
    id: 'uterus', name: 'Uterus', sex: 'F', icon: '🍐',
    intro: [
      'Fibroids are the commonest gynaecologic tumour; endometrial carcinoma is the commonest gynaecologic cancer in high-income countries.',
      'Unopposed oestrogen is the common thread from hyperplasia to endometrioid carcinoma.',
      'Incidence in the US: endometrial > ovarian > cervical. Prognosis runs the other way: cervical best, ovarian worst.',
    ],
  },
  {
    id: 'placenta', name: 'Pregnancy (GTD)', sex: 'F', icon: '🤰',
    intro: [
      'Gestational trophoblastic disease: hydatidiform moles and choriocarcinoma.',
      'Very high hCG explains the extras: hyperemesis, hyperthyroidism, theca lutein cysts and preeclampsia before 20 weeks.',
    ],
  },
  {
    id: 'ovary', name: 'Ovary', sex: 'F', icon: '🥚',
    intro: [
      'The commonest adnexal mass after 55; presents late with bloating, bowel obstruction or a pleural effusion.',
      'More ovulations mean more risk: age, early menarche, late menopause, nulliparity, endometriosis, BRCA1/2 and Lynch syndrome. Pregnancy, breastfeeding, OCPs and tubal ligation lower it.',
      'Three families: surface epithelial, germ cell and sex cord–stromal. CA-125 tracks treatment response, but is no use for screening.',
    ],
  },
  {
    id: 'testis', name: 'Testis', sex: 'M', icon: '🔵',
    intro: [
      'About 95% are germ cell tumours, mostly in young men. Cryptorchidism and Klinefelter syndrome raise the risk.',
      'Solid masses do not transilluminate. They are removed by radical orchiectomy rather than biopsied, because a biopsy can seed the scrotum.',
      'Germ cell tumours can also arise in the midline (retroperitoneum, mediastinum, pineal, suprasellar); in infants the sacrococcygeal teratoma is the classic.',
    ],
  },
  {
    id: 'penis', name: 'Penis', sex: 'M', icon: '🍆',
    intro: [
      'Squamous cell carcinoma is the usual penile cancer. It is linked to HPV-16 and to being uncircumcised, and is commoner in Asia, Africa and South America.',
      'Three in situ precursors are told apart by where they sit and their colour.',
    ],
  },
  {
    id: 'prostate', name: 'Prostate', sex: 'M', icon: '🌰',
    intro: [
      'Two lumps in men over 50: BPH in the central transition zone (urinary symptoms, not premalignant) and adenocarcinoma in the peripheral zone (felt on rectal exam).',
      'PSA rises in both; a low free-PSA fraction points to cancer.',
    ],
  },
];

export const TUMORS = [
  // ── Breast ───────────────────────────────────────────────────────────────
  {
    id: 'fibroadenoma', name: 'Fibroadenoma', organ: 'breast', kind: 'benign',
    who: 'Women under 35',
    presents: 'A small, rubbery, sharply outlined lump that slides away under the fingers.',
    micro: 'Fibrous stroma mixed with glands.',
    assoc: 'Grows and gets tender with oestrogen (before periods, in pregnancy). Cancer risk is not usually raised.',
    hook: 'The "breast mouse": young, mobile, harmless.',
    clues: [
      { t: 'present', x: 'Rubbery, very mobile, well-defined breast lump in a woman under 35' },
      { t: 'assoc', x: 'Benign breast lump that enlarges and aches before each period and in pregnancy' },
    ],
    case: { who: 'A 24-year-old woman', sees: 'notices a painless 2-cm lump in her left breast that is firm, smooth and moves freely under the examiner\'s fingers', more: ['It became a little larger and tender during her last menstrual cycle.', 'There is no nipple discharge or skin change.'] },
  },
  {
    id: 'papilloma', name: 'Intraductal papilloma', organ: 'breast', kind: 'benign',
    who: 'Premenopausal to middle-aged women',
    presents: 'Nipple discharge from one side, clear or bloody, from a tiny growth just under the areola.',
    micro: 'A small fibroepithelial (papillary) growth inside a lactiferous duct.',
    assoc: 'The commonest cause of nipple discharge. Slightly raises cancer risk.',
    hook: 'Bloody discharge, no lump: think papilloma first.',
    clues: [
      { t: 'present', x: 'Commonest cause of one-sided bloody or serous nipple discharge' },
      { t: 'histo', x: 'Small papillary growth inside a lactiferous duct beneath the areola' },
    ],
    case: { who: 'A 42-year-old woman', sees: 'reports spots of blood on her bra from the right nipple for two weeks; no mass is felt', more: ['Pressing at the edge of the areola brings out a drop of bloody fluid from a single duct.'] },
  },
  {
    id: 'phyllodes', name: 'Phyllodes tumor', organ: 'breast', kind: 'variable',
    who: 'Women in their 40s–50s',
    presents: 'A large, quickly growing breast mass.',
    micro: 'Overgrown connective tissue and cysts pushed into leaflike fronds.',
    assoc: 'Most are benign but some turn malignant.',
    hook: 'Phyllo = leaf: think of layered filo pastry.',
    clues: [
      { t: 'histo', x: 'Stroma growing in leaflike projections with cysts' },
      { t: 'present', x: 'Large, rapidly enlarging breast mass in a woman in her fifth decade' },
    ],
    case: { who: 'A 48-year-old woman', sees: 'has a breast mass that has grown from a grape to a lemon in four months; it is firm, bulky and not attached to skin', more: ['Biopsy shows overgrown stroma forming leaflike folds around cystic spaces.'] },
  },
  {
    id: 'dcis', name: 'Ductal carcinoma in situ (DCIS)', organ: 'breast', kind: 'insitu',
    who: 'Usually found on screening mammography',
    presents: 'Usually no lump: picked up as microcalcifications on a mammogram.',
    micro: 'Malignant cells fill the duct lumen; the basement membrane is intact.',
    assoc: 'Grows out of ductal atypia. Later cancer risk is in the same breast and quadrant.',
    hook: 'Calcifications without a mass: DCIS.',
    clues: [
      { t: 'present', x: 'Clustered microcalcifications on screening mammogram, nothing palpable' },
      { t: 'histo', x: 'Malignant cells filling breast ducts with an intact basement membrane' },
    ],
    case: { who: 'A 56-year-old woman', sees: 'has a routine screening mammogram showing a cluster of fine microcalcifications; breast exam is normal', more: ['Biopsy shows atypical cells packing the ducts without crossing the basement membrane.'] },
  },
  {
    id: 'lcis', name: 'Lobular carcinoma in situ (LCIS)', organ: 'breast', kind: 'insitu',
    who: 'Found by chance on a biopsy done for something else',
    presents: 'No mass and no calcifications.',
    micro: 'Lobules filled with small, loosely cohesive cells that have lost E-cadherin.',
    assoc: 'Marks higher risk of cancer in either breast, unlike DCIS.',
    hook: 'Lobular = loose (no E-cadherin) and in both breasts.',
    clues: [
      { t: 'assoc', x: 'Incidental in situ breast lesion that raises cancer risk in BOTH breasts' },
      { t: 'present', x: 'In situ breast lesion with neither a mass nor calcifications, found only by chance' },
    ],
    case: { who: 'A 45-year-old woman', sees: 'has a biopsy for an unrelated finding; the report describes an incidental in situ lesion of the lobules with no mass or calcification on imaging', more: ['Immunostaining shows loss of E-cadherin.', 'She is told her risk is raised in both breasts.'] },
  },
  {
    id: 'paget-breast', name: 'Paget disease of the breast', organ: 'breast', kind: 'malignant',
    who: 'Older women',
    presents: 'A red, scaly, crusted, eczema-like patch on the nipple and areola that does not heal.',
    micro: 'Large malignant cells (Paget cells: adenocarcinoma cells inside the epidermis) in the nipple skin.',
    assoc: 'Always means an underlying DCIS or invasive cancer has spread up the ducts to the skin.',
    hook: 'Nipple "eczema" that won\'t heal = cancer underneath.',
    clues: [
      { t: 'present', x: 'Eczema-like, crusting rash of one nipple that does not respond to creams' },
      { t: 'assoc', x: 'Skin lesion that always signals a carcinoma in the ducts beneath it' },
    ],
    case: { who: 'A 63-year-old woman', sees: 'has had an itchy, scaly, weeping patch on her right nipple for three months despite steroid cream', more: ['Biopsy of the nipple skin shows large clear cells scattered through the epidermis.'] },
  },
  {
    id: 'idc', name: 'Invasive ductal carcinoma', organ: 'breast', kind: 'malignant',
    who: 'Postmenopausal women (and the usual type in men)',
    presents: 'A rock-hard, fixed lump, often upper outer quadrant, with skin dimpling or nipple retraction.',
    micro: 'Small duct-forming glands in dense desmoplastic stroma; firm with sharp edges.',
    assoc: 'The commonest invasive breast cancer.',
    hook: 'Ductal = duct-forming glands + desmoplasia, the classic hard lump.',
    clues: [
      { t: 'histo', x: 'Small glands forming ducts within a dense desmoplastic stroma' },
      { t: 'assoc', x: 'Most common type of invasive breast cancer' },
      { t: 'present', x: 'Rock-hard breast mass with sharp margins, tethered to the skin' },
    ],
    case: { who: 'A 61-year-old woman', sees: 'finds a hard, irregular, fixed lump in the upper outer quadrant of her breast with dimpling of the skin above it', more: ['Biopsy shows small glands forming ducts in a dense fibrous stroma.'] },
  },
  {
    id: 'ilc', name: 'Invasive lobular carcinoma', organ: 'breast', kind: 'malignant',
    who: 'Postmenopausal women',
    presents: 'A vague thickening rather than a clear lump; often in both breasts or many spots.',
    micro: 'E-cadherin lost, so cells line up in single file; no ducts and little desmoplasia.',
    assoc: 'Often bilateral and multifocal.',
    hook: 'Lobular cells lose their "glue" and queue in single file.',
    clues: [
      { t: 'histo', x: 'Breast cancer cells invading in single-file lines with no gland formation' },
      { t: 'marker', x: 'Invasive breast cancer that is negative for E-cadherin' },
    ],
    case: { who: 'A 66-year-old woman', sees: 'has an ill-defined thickening in the left breast and a similar area in the right', more: ['Biopsy shows small cells infiltrating in single file, with no duct formation and little fibrous reaction.'] },
  },
  {
    id: 'inflammatory', name: 'Inflammatory breast carcinoma', organ: 'breast', kind: 'malignant',
    who: 'Any adult woman',
    presents: 'A warm, red, swollen, painful breast with peau d\'orange; often no lump.',
    micro: 'Tumour cells blocking the lymphatics of the dermis.',
    assoc: 'Mistaken for mastitis. Poor prognosis (about half alive at 5 years).',
    hook: 'Mastitis that antibiotics never fix: think of this.',
    clues: [
      { t: 'present', x: 'Red, warm, swollen breast with orange-peel skin and no palpable mass' },
      { t: 'histo', x: 'Tumour emboli plugging dermal lymphatic channels of the breast' },
    ],
    case: { who: 'A 52-year-old woman who is not breastfeeding', sees: 'has a breast that became red, hot, heavy and swollen over three weeks; the skin is pitted like orange peel and no discrete mass is felt', more: ['A course of antibiotics made no difference.'] },
  },

  // ── Vulva ────────────────────────────────────────────────────────────────
  {
    id: 'lichen-sclerosus', name: 'Lichen sclerosus', organ: 'vulva', kind: 'premalignant',
    who: 'Girls before puberty, and women around or after menopause',
    presents: 'Intense itch, painful sex and urination; thin, porcelain-white plaques that may tear or bleed.',
    micro: 'Chronic inflammatory thinning and scarring of the skin.',
    assoc: 'Benign, but a slight risk of SCC. It is the source of non-HPV vulvar cancer.',
    hook: 'White, papery skin around vulva and anus in a figure eight.',
    clues: [
      { t: 'present', x: 'Porcelain-white vulvar plaques forming a figure eight around the anus' },
      { t: 'assoc', x: 'Chronic vulvar condition behind the non-HPV type of vulvar SCC' },
    ],
    case: { who: 'A 62-year-old woman', sees: 'has years of severe vulvar itching; the skin is thin, shiny and white, spreading around the anus in a figure-of-eight', more: ['She also has pain with intercourse and when passing stool.'] },
  },
  {
    id: 'vulvar-scc', name: 'Vulvar squamous cell carcinoma', organ: 'vulva', kind: 'malignant',
    who: 'Younger women (HPV) or older women with lichen sclerosus',
    presents: 'A white plaque (leukoplakia), lump or ulcer on the vulva; biopsy is needed.',
    micro: 'Invasive malignant squamous cells.',
    assoc: 'HPV 16/18-related, or arising from long-standing lichen sclerosus.',
    hook: 'Two roads, one cancer: HPV when young, lichen sclerosus when old.',
    clues: [
      { t: 'assoc', x: 'Vulvar cancer linked to HPV 16/18 OR to long-standing lichen sclerosus' },
    ],
    case: { who: 'A 74-year-old woman with decades of lichen sclerosus', sees: 'develops a firm, raised, white plaque on the labium that has started to ulcerate', more: ['Biopsy shows invasive nests of keratinising squamous cells.'] },
  },
  {
    id: 'paget-vulva', name: 'Extramammary Paget disease', organ: 'vulva', kind: 'insitu',
    who: 'Postmenopausal women',
    presents: 'Itchy, red, crusted or ulcerated vulvar patches.',
    micro: 'Adenocarcinoma cells within the epidermis (intraepithelial adenocarcinoma).',
    assoc: 'Usually NOT tied to an underlying cancer, unlike Paget disease of the nipple.',
    hook: 'Same cells as nipple Paget, but on the vulva it usually stands alone.',
    clues: [
      { t: 'histo', x: 'Adenocarcinoma cells inside vulvar epidermis, usually without a cancer underneath' },
      { t: 'assoc', x: 'Intraepithelial adenocarcinoma of the vulva with low risk of an underlying carcinoma' },
    ],
    case: { who: 'A 68-year-old woman', sees: 'has an itchy, red, moist, crusted plaque on the vulva that has spread slowly over a year', more: ['Biopsy shows large pale glandular-type cells within the epidermis; no deeper tumour is found.'] },
  },

  // ── Vagina ───────────────────────────────────────────────────────────────
  {
    id: 'vaginal-scc', name: 'Vaginal squamous cell carcinoma', organ: 'vagina', kind: 'malignant',
    who: 'Women with cervical cancer',
    presents: 'Vaginal bleeding or a mass.',
    micro: 'Malignant squamous cells.',
    assoc: 'Usually spread from a cervical SCC; primary vaginal carcinoma is rare.',
    hook: 'A vaginal SCC is a cervical SCC until proven otherwise.',
    clues: [
      { t: 'assoc', x: 'Vaginal cancer that is usually secondary spread from the cervix' },
    ],
    case: { who: 'A 58-year-old woman treated two years ago for cervical squamous carcinoma', sees: 'has new vaginal bleeding and an ulcerated mass in the upper vaginal wall', more: ['Biopsy shows malignant squamous epithelium identical to her earlier tumour.'] },
  },
  {
    id: 'clear-cell', name: 'Clear cell adenocarcinoma of the vagina', organ: 'vagina', kind: 'malignant',
    who: 'Young women exposed to DES in the womb',
    presents: 'Abnormal vaginal bleeding or discharge.',
    micro: 'Glandular cells with clear cytoplasm, arising from vaginal adenosis (glandular columnar epithelium left in the upper vagina).',
    assoc: 'Diethylstilbestrol (DES) taken by the mother in pregnancy.',
    hook: 'DES → adenosis → clear cell.',
    clues: [
      { t: 'assoc', x: 'Vaginal cancer in a woman whose mother took diethylstilbestrol (DES) in pregnancy' },
      { t: 'histo', x: 'Arises from vaginal adenosis: glandular columnar epithelium left in the upper vagina' },
    ],
    case: { who: 'A 21-year-old woman', sees: 'has irregular vaginal bleeding; her mother was given a synthetic oestrogen during pregnancy to prevent miscarriage', more: ['Exam shows red glandular patches in the upper vagina and a small mass.'] },
  },
  {
    id: 'botryoides', name: 'Sarcoma botryoides', organ: 'vagina', kind: 'malignant',
    who: 'Girls under 4',
    presents: 'A clear, grapelike, polypoid mass coming out of the vagina.',
    micro: 'Embryonal rhabdomyosarcoma variant: spindle-shaped cells, desmin-positive.',
    assoc: 'A rhabdomyosarcoma, so a tumour of skeletal muscle lineage.',
    hook: 'Botrys = bunch of grapes.',
    clues: [
      { t: 'present', x: 'Grapelike polypoid mass protruding from the vagina of a toddler' },
      { t: 'marker', x: 'Desmin-positive spindle cells in a vaginal mass of a young child' },
    ],
    case: { who: 'A 3-year-old girl', sees: 'is brought in after her mother sees a soft, clear, grape-cluster-like mass hanging from the vagina', more: ['Biopsy shows small spindle cells that stain for desmin.'] },
  },

  // ── Cervix ───────────────────────────────────────────────────────────────
  {
    id: 'cin', name: 'Cervical dysplasia / CIN', organ: 'cervix', kind: 'premalignant',
    who: 'Young, sexually active women',
    presents: 'No symptoms: found on Pap smear.',
    micro: 'Disordered squamous growth starting at the basal layer of the transformation zone (graded CIN 1–3). Koilocytes (wrinkled "raisin" nucleus with a clear halo) prove HPV.',
    assoc: 'HPV-16/18: E6 knocks out p53 and E7 knocks out Rb. CIN 3 rarely regresses.',
    hook: '"6 before 7, P before R": E6 → p53, E7 → Rb.',
    clues: [
      { t: 'histo', x: 'Koilocytes: raisin-like nuclei with a perinuclear halo' },
      { t: 'assoc', x: 'HPV E6 inactivates p53 and E7 inactivates Rb in this precancer' },
      { t: 'histo', x: 'Dysplasia beginning in the basal layer at the transformation zone, graded 1–3' },
    ],
    case: { who: 'A 26-year-old woman', sees: 'has a routine Pap smear reported as abnormal; she has no symptoms', more: ['Colposcopic biopsy shows disordered squamous cells in the lower two-thirds of the epithelium with koilocytes.'] },
  },
  {
    id: 'cervical-ca', name: 'Invasive cervical carcinoma', organ: 'cervix', kind: 'malignant',
    who: 'Women around 40–45',
    presents: 'Bleeding after sex or between periods; late, flank pain from blocked ureters.',
    micro: 'Usually squamous cell carcinoma.',
    assoc: 'Risks: HPV, many partners, smoking, early first sex, DES, immunosuppression (HIV, transplant). Spreading sideways can block the ureters, causing hydronephrosis and renal failure.',
    hook: 'Cervical cancer can kill through the kidneys.',
    clues: [
      { t: 'present', x: 'Postcoital bleeding, then hydronephrosis from tumour spreading to the ureters' },
      { t: 'assoc', x: 'Gynaecologic cancer with the best prognosis, usually diagnosed before 45' },
    ],
    case: { who: 'A 41-year-old woman who has never had a Pap smear', sees: 'has bleeding after intercourse for six months; labs show a rising creatinine and ultrasound shows bilateral hydronephrosis', more: ['She smokes and has HIV.'] },
  },

  // ── Uterus ───────────────────────────────────────────────────────────────
  {
    id: 'leiomyoma', name: 'Leiomyoma (fibroid)', organ: 'uterus', kind: 'benign',
    who: 'Reproductive-age women, more often Black women',
    presents: 'Often silent; heavy bleeding, pelvic pressure or fertility problems. Enlarged, knobbly uterus on exam.',
    micro: 'Whorled bundles of smooth muscle with crisp borders.',
    assoc: 'The commonest gynaecologic tumour. Oestrogen-sensitive: grows in pregnancy, shrinks after menopause. Often multiple: submucosal, intramural or subserosal.',
    hook: 'Whorls of muscle in a lumpy uterus.',
    clues: [
      { t: 'histo', x: 'Whorled bundles of smooth muscle with well-demarcated borders' },
      { t: 'assoc', x: 'Most common gynaecologic tumour; grows in pregnancy, shrinks after menopause' },
      { t: 'present', x: 'Enlarged uterus with an irregular, nodular contour and heavy periods' },
    ],
    case: { who: 'A 38-year-old woman', sees: 'has heavy, prolonged periods and pelvic pressure; the uterus is enlarged with an irregular, knobbly outline', more: ['Ultrasound shows several well-circumscribed masses in the uterine wall.'] },
  },
  {
    id: 'endo-hyperplasia', name: 'Endometrial hyperplasia', organ: 'uterus', kind: 'premalignant',
    who: 'Women with unopposed oestrogen',
    presents: 'Abnormal uterine bleeding.',
    micro: 'Too many endometrial glands; nuclear atypia carries the greatest cancer risk.',
    assoc: 'Unopposed oestrogen: obesity, PCOS/chronic anovulation, nulliparity, oestrogen-only HRT, tamoxifen.',
    hook: 'Atypia is the alarm bell.',
    clues: [
      { t: 'histo', x: 'Excess endometrial glands; nuclear atypia marks the highest cancer risk' },
    ],
    case: { who: 'A 49-year-old woman with obesity and PCOS', sees: 'has irregular heavy bleeding; endometrial sampling shows crowded glands but intact stroma between them', more: ['She has never been pregnant.'] },
  },
  {
    id: 'endometrial-ca', name: 'Endometrial carcinoma (endometrioid)', organ: 'uterus', kind: 'malignant',
    who: 'Postmenopausal women, around 55',
    presents: 'Bleeding after menopause.',
    micro: 'Endometrioid type: glands packed back to back with no stroma between them.',
    assoc: 'Commonest gynaecologic cancer in high-income countries. Long exposure to unopposed oestrogen.',
    hook: 'Any postmenopausal bleed is this until shown otherwise.',
    clues: [
      { t: 'histo', x: 'Back-to-back endometrial glands with no intervening stroma' },
      { t: 'assoc', x: 'Most common gynaecologic cancer in high-income countries' },
      { t: 'present', x: 'Postmenopausal bleeding in an obese woman after years of unopposed oestrogen' },
    ],
    case: { who: 'A 58-year-old woman with obesity and diabetes', sees: 'has had vaginal bleeding for a month, five years after her last period', more: ['Biopsy shows crowded glands touching one another with no stroma in between.'] },
  },

  // ── Gestational trophoblastic disease ────────────────────────────────────
  {
    id: 'complete-mole', name: 'Complete hydatidiform mole', organ: 'placenta', kind: 'premalignant',
    who: 'Pregnant women',
    presents: 'Vaginal bleeding, vomiting, uterus too big for dates, pelvic pressure; snowstorm or grape-cluster ultrasound; no fetus.',
    micro: 'All villi swollen (hydropic) with diffuse trophoblast proliferation. p57-negative (only the maternal gene is expressed).',
    marker: 'hCG very high',
    assoc: '46,XX (or XY): an empty egg fertilised by one sperm that duplicates. 15–20% become invasive moles, about 2% choriocarcinoma. Treat with suction curettage and follow hCG.',
    hook: 'Complete = completely paternal, no fetus.',
    clues: [
      { t: 'marker', x: 'Molar pregnancy that is p57-negative' },
      { t: 'assoc', x: '46,XX karyotype from an empty egg and one duplicated sperm' },
      { t: 'present', x: 'Snowstorm ultrasound, uterus large for dates, and no fetal parts' },
    ],
    case: { who: 'A 19-year-old woman at 12 weeks\' gestation', sees: 'has vaginal bleeding and severe vomiting; her uterus is the size of 20 weeks and ultrasound shows a snowstorm pattern with no fetus', more: ['hCG is far above normal for the gestation; she has a tremor and a low TSH.'] },
  },
  {
    id: 'partial-mole', name: 'Partial hydatidiform mole', organ: 'placenta', kind: 'premalignant',
    who: 'Pregnant women',
    presents: 'Bleeding or missed miscarriage; some fetal parts on ultrasound.',
    micro: 'Only some villi swollen, with patchy trophoblast proliferation. p57-positive.',
    marker: 'hCG raised, less than a complete mole',
    assoc: 'Triploid (69,XXX/XXY/XYY): one egg plus two sperm. Under 5% become invasive; choriocarcinoma is rare.',
    hook: 'Partial = partly fetal.',
    clues: [
      { t: 'assoc', x: 'Triploid 69,XXY conception from one egg and two sperm' },
      { t: 'marker', x: 'Molar pregnancy that stains p57-positive and contains fetal parts' },
    ],
    case: { who: 'A 30-year-old woman at 11 weeks\' gestation', sees: 'has spotting; ultrasound shows an abnormal fetus with a thick, cystic placenta', more: ['Karyotype of the tissue is 69,XXY.'] },
  },
  {
    id: 'chorio-gest', name: 'Choriocarcinoma (gestational)', organ: 'placenta', kind: 'malignant', fam: 'chorio',
    who: 'Women after a mole, miscarriage or even a normal pregnancy',
    presents: 'Abnormal uterine bleeding, signs of high hCG, then cough, breathlessness and haemoptysis.',
    micro: 'Sheets of cytotrophoblast and syncytiotrophoblast with NO chorionic villi.',
    marker: 'hCG very high',
    assoc: 'Spreads through the blood to the lungs ("cannonball" metastases). Very sensitive to methotrexate. Can also arise in the gonads without a pregnancy.',
    hook: 'Trophoblast without villi, and cannonballs in the chest.',
    clues: [
      { t: 'histo', x: 'Malignant cytotrophoblast and syncytiotrophoblast with no villi' },
      { t: 'present', x: '"Cannonball" lung metastases weeks after a molar pregnancy' },
    ],
    case: { who: 'A 27-year-old woman evacuated for a molar pregnancy two months ago', sees: 'now has haemoptysis and vaginal bleeding; chest X-ray shows several round lesions in both lungs', more: ['hCG, which had been falling, is rising again.'] },
  },

  // ── Ovary ────────────────────────────────────────────────────────────────
  {
    id: 'serous-cystadenoma', name: 'Serous cystadenoma', organ: 'ovary', kind: 'benign',
    who: 'Adult women',
    presents: 'An adnexal cyst, often in both ovaries.',
    micro: 'A cyst lined by fallopian-tube-type (serous) epithelium.',
    assoc: 'The commonest ovarian neoplasm overall.',
    hook: 'Most common ovarian tumour of all: benign and serous.',
    clues: [
      { t: 'assoc', x: 'Most common ovarian neoplasm overall (benign)' },
      { t: 'histo', x: 'Benign ovarian cyst lined by fallopian tube–like epithelium' },
    ],
    case: { who: 'A 40-year-old woman', sees: 'has a smooth, thin-walled cyst in each ovary found on pelvic ultrasound', more: ['Removed cysts contain watery fluid and are lined by ciliated tubal-type cells without atypia.'] },
  },
  {
    id: 'mucinous-cystadenoma', name: 'Mucinous cystadenoma', organ: 'ovary', kind: 'benign',
    who: 'Adult women',
    presents: 'A very large, many-chambered cyst; abdominal swelling.',
    micro: 'Many locules lined by mucus-secreting (endocervical/intestinal-type) epithelium.',
    assoc: 'Benign; can become huge.',
    hook: 'Mucinous = many chambers of mucus.',
    clues: [
      { t: 'histo', x: 'Huge multiloculated benign ovarian cyst lined by mucus-secreting cells' },
    ],
    case: { who: 'A 35-year-old woman', sees: 'has a slowly growing abdomen; imaging shows a 25-cm ovarian mass divided into many chambers', more: ['The cyst is full of thick sticky material, lined by tall mucin-filled cells without atypia.'] },
  },
  {
    id: 'brenner', name: 'Brenner tumor', organ: 'ovary', kind: 'benign',
    who: 'Older women',
    presents: 'Usually an incidental small solid ovarian mass.',
    micro: 'Nests of bladder-like (urothelial) cells in fibrous stroma; nuclei grooved like coffee beans.',
    assoc: 'Usually benign.',
    hook: 'Bladder cells in the ovary, with coffee-bean nuclei.',
    clues: [
      { t: 'histo', x: 'Nests of urothelium-like cells with "coffee bean" nuclei in the ovary' },
    ],
    case: { who: 'A 60-year-old woman', sees: 'has a small, firm, solid ovarian mass found during surgery for something else', more: ['Microscopy shows nests of cells that resemble bladder lining, with grooved nuclei.'] },
  },
  {
    id: 'serous-carcinoma', name: 'Serous carcinoma', organ: 'ovary', kind: 'malignant',
    who: 'Women over 55, BRCA carriers',
    presents: 'Bloating, abdominal swelling with ascites, early satiety; often late.',
    micro: 'Malignant serous epithelium with psammoma bodies.',
    marker: 'CA-125 (for monitoring, not screening)',
    assoc: 'The commonest malignant ovarian tumour; often both ovaries.',
    hook: 'Psammoma bodies in the ovary.',
    clues: [
      { t: 'histo', x: 'Malignant ovarian tumour with psammoma bodies' },
      { t: 'assoc', x: 'Most common malignant ovarian neoplasm' },
    ],
    case: { who: 'A 63-year-old woman with a BRCA1 mutation', sees: 'has three months of bloating and early fullness; she has ascites and bilateral complex adnexal masses', more: ['CA-125 is high. Biopsy shows papillary malignant epithelium with laminated calcifications.'] },
  },
  {
    id: 'mucinous-carcinoma', name: 'Mucinous carcinoma', organ: 'ovary', kind: 'malignant',
    who: 'Adult women',
    presents: 'Abdominal distension; the belly can fill with jelly.',
    micro: 'Malignant mucin-producing epithelium.',
    assoc: 'Rare as a primary; often a metastasis from the appendix or GI tract. Can cause pseudomyxoma peritonei (jelly belly).',
    hook: 'Jelly belly: check the appendix.',
    clues: [
      { t: 'assoc', x: 'Ovarian tumour with pseudomyxoma peritonei, often really from the appendix' },
    ],
    case: { who: 'A 55-year-old woman', sees: 'has a swollen abdomen; at surgery the peritoneal cavity is filled with gelatinous mucin around an ovarian mass', more: ['The appendix is also abnormal.'] },
  },
  {
    id: 'dermoid', name: 'Mature cystic teratoma (dermoid cyst)', organ: 'ovary', kind: 'benign', fam: 'teratoma',
    who: 'Young women',
    presents: 'An ovarian cyst that may twist (torsion) and hurt; occasionally hyperthyroidism.',
    micro: 'Tissue from all three germ layers: skin, hair, sebum, teeth.',
    assoc: 'The commonest ovarian tumour in young women. Struma ovarii (mostly thyroid tissue) can cause hyperthyroidism. Rarely turns into SCC.',
    hook: 'Hair and teeth in an ovarian cyst.',
    clues: [
      { t: 'present', x: 'Ovarian cyst containing hair, sebum and a tooth on imaging' },
      { t: 'assoc', x: 'Most common ovarian tumour in young women' },
      { t: 'present', x: 'Hyperthyroidism from an ovarian mass made mostly of thyroid tissue (struma ovarii)' },
    ],
    case: { who: 'A 22-year-old woman', sees: 'has sudden pelvic pain; ultrasound shows a twisted ovary containing a cystic mass with fat and a calcified, tooth-like structure', more: ['The removed cyst is full of hair and greasy material.'] },
  },
  {
    id: 'immature-teratoma', name: 'Immature teratoma', organ: 'ovary', kind: 'malignant', fam: 'teratoma',
    who: 'Girls and women under 20',
    presents: 'A rapidly growing solid ovarian mass.',
    micro: 'Immature, embryonic-looking tissue, mostly primitive neuroectoderm.',
    assoc: 'Malignant and aggressive.',
    hook: 'Immature neural tissue = malignant teratoma.',
    clues: [
      { t: 'histo', x: 'Primitive, embryonic-like neuroectodermal tissue in an ovarian germ cell tumour' },
    ],
    case: { who: 'A 15-year-old girl', sees: 'has a rapidly enlarging, mostly solid pelvic mass arising from one ovary', more: ['Microscopy shows fetal-type tissues, mostly primitive neural tubules.'] },
  },
  {
    id: 'dysgerminoma', name: 'Dysgerminoma', organ: 'ovary', kind: 'malignant', fam: 'seminoma',
    who: 'Adolescent girls',
    presents: 'A solid ovarian mass in a teenager.',
    micro: 'Sheets of uniform "fried egg" cells (the ovarian twin of seminoma).',
    marker: 'hCG and LDH raised',
    assoc: 'Malignant; rarer than its testicular counterpart.',
    hook: 'Dysgerminoma : ovary :: seminoma : testis.',
    clues: [
      { t: 'marker', x: 'Ovarian tumour with raised LDH and hCG in a teenager' },
      { t: 'assoc', x: 'Ovarian counterpart of the testicular seminoma' },
    ],
    case: { who: 'A 16-year-old girl', sees: 'has abdominal swelling from a solid ovarian mass; LDH is high and hCG is mildly raised', more: ['Microscopy shows sheets of large round cells with clear cytoplasm, like fried eggs.'] },
  },
  {
    id: 'yolk-sac-ovary', name: 'Yolk sac tumor (ovary)', organ: 'ovary', kind: 'malignant', fam: 'yolk_sac',
    who: 'Girls and young women',
    presents: 'A fast-growing, painful pelvic mass.',
    micro: 'Yellow, crumbly, bleeding mass; Schiller-Duval bodies (look like glomeruli) in about half.',
    marker: 'AFP raised',
    assoc: 'Also called endodermal sinus tumour. Malignant and aggressive.',
    hook: 'AFP + glomerulus-like bodies = yolk sac.',
    clues: [
      { t: 'histo', x: 'Schiller-Duval bodies resembling glomeruli' },
      { t: 'marker', x: 'Germ cell tumour with a very high AFP' },
    ],
    case: { who: 'A 17-year-old girl', sees: 'has a rapidly growing pelvic mass from one ovary; serum AFP is markedly raised', more: ['The cut surface is yellow, friable and haemorrhagic.'] },
  },
  {
    id: 'fibroma', name: 'Fibroma (Meigs syndrome)', organ: 'ovary', kind: 'benign',
    who: 'Middle-aged and older women',
    presents: 'A solid ovarian mass with a "pulling" feeling in the groin; may come with ascites and a pleural effusion.',
    micro: 'Bundles of spindle-shaped fibroblasts.',
    assoc: 'Meigs syndrome: ovarian fibroma + ascites + pleural effusion (resolves after removal).',
    hook: 'Fibroma + fluid in the belly and the chest = Meigs.',
    clues: [
      { t: 'assoc', x: 'Benign ovarian tumour with ascites and a right pleural effusion' },
      { t: 'histo', x: 'Benign ovarian mass of bundled spindle-shaped fibroblasts' },
    ],
    case: { who: 'A 57-year-old woman', sees: 'has breathlessness, a right pleural effusion, ascites and a solid ovarian mass', more: ['Everything resolves after the mass is removed; it is made of spindle cells.'] },
  },
  {
    id: 'thecoma', name: 'Thecoma', organ: 'ovary', kind: 'benign',
    who: 'Postmenopausal women',
    presents: 'Postmenopausal bleeding from oestrogen made by the tumour.',
    micro: 'Lipid-laden theca-type stromal cells.',
    assoc: 'Mostly benign; may produce oestrogen.',
    hook: 'Theca cells make the oestrogen precursors, and so does this tumour.',
    clues: [
      { t: 'assoc', x: 'Mostly benign oestrogen-making ovarian tumour of theca-type cells' },
    ],
    case: { who: 'A 64-year-old woman', sees: 'has postmenopausal bleeding and a solid ovarian mass; the mass is yellow and made of lipid-rich stromal cells', more: ['There are no Call-Exner bodies and no raised inhibin.'] },
  },
  {
    id: 'sertoli-leydig', name: 'Sertoli-Leydig cell tumor', organ: 'ovary', kind: 'benign',
    who: 'Young women',
    presents: 'Virilisation: excess hair, deeper voice, temporal balding, enlarged clitoris.',
    micro: 'Grey to yellow-brown mass that looks like testis: tubules of Sertoli cells with Leydig cells between them.',
    assoc: 'Makes androgens.',
    hook: 'A testis in the ovary: masculinises.',
    clues: [
      { t: 'present', x: 'Ovarian tumour that causes hirsutism, balding and clitoromegaly' },
      { t: 'histo', x: 'Ovarian tumour that looks like testis: Sertoli-cell tubules with Leydig cells between' },
    ],
    case: { who: 'A 25-year-old woman', sees: 'has had stopped periods, a deepening voice, facial hair and clitoral enlargement over six months; there is a solid ovarian mass', more: ['Serum testosterone is high.'] },
  },
  {
    id: 'granulosa', name: 'Granulosa cell tumor', organ: 'ovary', kind: 'malignant',
    who: 'Women in their 50s (or girls before puberty)',
    presents: 'Signs of oestrogen: postmenopausal bleeding, endometrial hyperplasia, sore breasts; early puberty in girls.',
    micro: 'Call-Exner bodies: granulosa cells around small pools of pink fluid, like tiny follicles.',
    marker: 'Inhibin raised',
    assoc: 'The commonest malignant sex cord–stromal tumour. Makes oestrogen and/or progesterone.',
    hook: '"Give Granny a Call" (Call-Exner).',
    clues: [
      { t: 'histo', x: 'Call-Exner bodies' },
      { t: 'marker', x: 'Ovarian tumour that raises serum inhibin' },
      { t: 'assoc', x: 'Most common malignant sex cord–stromal tumour of the ovary' },
    ],
    case: { who: 'A 56-year-old woman', sees: 'has postmenopausal bleeding, tender breasts and a solid ovarian mass; endometrial biopsy shows hyperplasia', more: ['Serum inhibin is raised.'] },
  },

  // ── Testis ───────────────────────────────────────────────────────────────
  {
    id: 'seminoma', name: 'Seminoma', organ: 'testis', kind: 'malignant', fam: 'seminoma',
    who: 'Men aged about 15–35 (never infants)',
    presents: 'Painless, even enlargement of one testis.',
    micro: 'Lobules of large cells with clear cytoplasm, the "fried egg" look.',
    marker: 'PLAP positive; AFP normal',
    assoc: 'The commonest testicular tumour. Very radiosensitive; spreads late; excellent prognosis.',
    hook: 'Seminoma: PLAP, radiosensitive, does best.',
    clues: [
      { t: 'marker', x: 'Testicular tumour positive for placental alkaline phosphatase (PLAP)' },
      { t: 'assoc', x: 'Most common testicular tumour; highly radiosensitive with an excellent outlook' },
    ],
    case: { who: 'A 32-year-old man', sees: 'notices his right testis has become heavy and uniformly enlarged without pain; it does not transilluminate', more: ['AFP is normal.', 'Microscopy shows lobules of large clear cells.'] },
  },
  {
    id: 'embryonal', name: 'Embryonal carcinoma', organ: 'testis', kind: 'malignant',
    who: 'Men aged 20–30',
    presents: 'A painful testicular mass, sometimes with metastases at presentation.',
    micro: 'Haemorrhagic, necrotic mass of primitive cells; usually mixed with other germ cell types.',
    marker: 'hCG may be raised; AFP normal if pure (raised when mixed)',
    assoc: 'Worse prognosis than seminoma.',
    hook: 'Painful and bloody, the aggressive one.',
    clues: [
      { t: 'present', x: 'PAINFUL, haemorrhagic, necrotic testicular germ cell tumour' },
    ],
    case: { who: 'A 25-year-old man', sees: 'has a tender testicular mass and back pain; CT shows enlarged retroperitoneal nodes', more: ['The cut surface is haemorrhagic and necrotic. AFP is normal and hCG is mildly raised.'] },
  },
  {
    id: 'teratoma-testis', name: 'Teratoma (testis)', organ: 'testis', kind: 'variable', fam: 'teratoma',
    who: 'Boys and men',
    presents: 'A testicular mass.',
    micro: 'Tissues from more than one germ layer.',
    assoc: 'In adult men a mature teratoma can still be malignant; it is benign in boys (and in women).',
    hook: 'A mature teratoma is only "safe" in kids and women.',
    clues: [
      { t: 'assoc', x: 'Germ cell tumour that is benign in children but can be malignant in adult men even when mature' },
    ],
    case: { who: 'A 28-year-old man', sees: 'has a testicular mass containing cartilage, intestinal-type glands and skin elements', more: ['Despite mature-looking tissue, he later develops retroperitoneal metastases.'] },
  },
  {
    id: 'yolk-sac-testis', name: 'Yolk sac tumor (testis)', organ: 'testis', kind: 'malignant', fam: 'yolk_sac',
    who: 'Boys under 3',
    presents: 'A testicular mass in a toddler.',
    micro: 'Yellow, mucinous; Schiller-Duval bodies.',
    marker: 'AFP very high',
    assoc: 'The commonest testicular tumour in boys under 3.',
    hook: 'Toddler + testis lump + AFP = yolk sac.',
    clues: [
      { t: 'assoc', x: 'Most common testicular tumour in boys under 3' },
    ],
    case: { who: 'A 2-year-old boy', sees: 'is brought in with a painless enlarging right testis', more: ['Serum AFP is very high.'] },
  },
  {
    id: 'chorio-testis', name: 'Choriocarcinoma (testis)', organ: 'testis', kind: 'malignant', fam: 'chorio',
    who: 'Young men',
    presents: 'Often comes to light through metastases to lung or brain; gynecomastia or hyperthyroid symptoms.',
    micro: 'Disordered syncytiotrophoblast and cytotrophoblast.',
    marker: 'hCG very high',
    assoc: 'Spreads early through the blood. hCG shares its α subunit with TSH (and LH), causing hyperthyroidism and gynecomastia.',
    hook: 'A man with breasts and thyrotoxicosis: check hCG.',
    clues: [
      { t: 'present', x: 'Young man with gynecomastia and hyperthyroid symptoms from a testicular tumour' },
    ],
    case: { who: 'A 24-year-old man', sees: 'has haemoptysis, tender breast enlargement and palpitations; there is a small testicular nodule', more: ['hCG is enormously raised and TSH is suppressed.'] },
  },
  {
    id: 'leydig', name: 'Leydig cell tumor', organ: 'testis', kind: 'benign',
    who: 'Boys and men',
    presents: 'Precocious puberty in boys; gynecomastia in men.',
    micro: 'Golden-brown tumour with Reinke crystals (pink rod-shaped inclusions).',
    assoc: 'Mostly benign; makes androgens or oestrogens.',
    hook: 'Reinke crystals, golden brown.',
    clues: [
      { t: 'histo', x: 'Reinke crystals in a golden-brown testicular tumour' },
      { t: 'present', x: 'Precocious puberty in a boy caused by a hormone-making testicular tumour' },
    ],
    case: { who: 'A 7-year-old boy', sees: 'has pubic hair, a deepening voice and a growth spurt, with a small firm testicular nodule', more: ['The removed tumour is golden brown with rod-shaped pink crystals in the cells.'] },
  },
  {
    id: 'sertoli', name: 'Sertoli cell tumor', organ: 'testis', kind: 'benign',
    who: 'Adult men',
    presents: 'A testicular mass, usually without hormone effects.',
    micro: 'Tubules formed by Sertoli cells.',
    assoc: 'Also called androblastoma (from sex cord stroma). Mostly benign.',
    hook: 'The quiet sex cord tumour of the testis.',
    clues: [
      { t: 'assoc', x: 'Testicular sex cord–stromal tumour also called androblastoma' },
    ],
    case: { who: 'A 40-year-old man', sees: 'has a slowly growing, painless testicular nodule with normal hormone levels and normal tumour markers', more: ['Microscopy shows tubules lined by sex cord–type cells; it is a sex cord–stromal tumour, not a germ cell tumour.'] },
  },
  {
    id: 'testis-lymphoma', name: 'Testicular lymphoma', organ: 'testis', kind: 'malignant',
    who: 'Men over 60',
    presents: 'Testicular enlargement, often in both testes.',
    micro: 'Usually diffuse large B-cell lymphoma.',
    assoc: 'Aggressive. The commonest testicular cancer in men over 60.',
    hook: 'Old man, both testes: lymphoma.',
    clues: [
      { t: 'assoc', x: 'Most common testicular cancer in men over 60' },
      { t: 'present', x: 'Bilateral testicular masses in an elderly man' },
    ],
    case: { who: 'A 70-year-old man', sees: 'has painless swelling of both testes over two months', more: ['Biopsy shows sheets of large B cells.'] },
  },

  // ── Penis ────────────────────────────────────────────────────────────────
  {
    id: 'penile-scc', name: 'Penile squamous cell carcinoma', organ: 'penis', kind: 'malignant',
    who: 'Older uncircumcised men',
    presents: 'A growth or ulcer on the penis.',
    micro: 'Invasive squamous carcinoma.',
    assoc: 'Linked to HPV-16 and to being uncircumcised; commoner in Asia, Africa and South America.',
    hook: 'Circumcision and HPV vaccination prevent it.',
    clues: [
      { t: 'assoc', x: 'Most common penile cancer, tied to HPV-16 and lack of circumcision' },
    ],
    case: { who: 'A 67-year-old uncircumcised man', sees: 'has an enlarging, ulcerated, warty growth on the glans with inguinal lymph nodes', more: ['Biopsy shows invasive keratinising squamous cells.'] },
  },
  {
    id: 'bowen', name: 'Bowen disease', organ: 'penis', kind: 'insitu',
    who: 'Older men',
    presents: 'A white plaque (leukoplakia) on the SHAFT.',
    micro: 'Squamous carcinoma in situ.',
    assoc: 'A precursor of penile SCC.',
    hook: 'Bowen = white, on the shaft.',
    clues: [
      { t: 'present', x: 'White plaque (leukoplakia) of squamous carcinoma in situ on the penile shaft' },
    ],
    case: { who: 'A 60-year-old man', sees: 'has a slowly enlarging, white, scaly plaque on the shaft of his penis', more: ['Biopsy shows full-thickness atypia without invasion.'] },
  },
  {
    id: 'queyrat', name: 'Erythroplasia of Queyrat', organ: 'penis', kind: 'insitu',
    who: 'Older uncircumcised men',
    presents: 'A red, velvety plaque (erythroplakia) on the GLANS.',
    micro: 'Squamous carcinoma in situ.',
    assoc: 'A precursor of penile SCC.',
    hook: 'Queyrat = red, on the glans.',
    clues: [
      { t: 'present', x: 'Red velvety plaque (erythroplakia) of carcinoma in situ on the glans' },
    ],
    case: { who: 'A 58-year-old uncircumcised man', sees: 'has a shiny, red, velvety patch on the glans that has not healed with antifungal cream', more: ['Biopsy shows carcinoma in situ.'] },
  },
  {
    id: 'bowenoid', name: 'Bowenoid papulosis', organ: 'penis', kind: 'insitu',
    who: 'Younger sexually active men',
    presents: 'Several small reddish papules.',
    micro: 'Carcinoma in situ, of uncertain malignant potential.',
    assoc: 'HPV-related.',
    hook: 'Papulosis = many papules.',
    clues: [
      { t: 'present', x: 'Multiple reddish papules showing carcinoma in situ of uncertain potential' },
    ],
    case: { who: 'A 28-year-old man', sees: 'has several small reddish-brown papules on the penis', more: ['Biopsy shows in situ squamous atypia; the lesions are HPV-related.'] },
  },

  // ── Prostate ─────────────────────────────────────────────────────────────
  {
    id: 'prostate-ca', name: 'Prostatic adenocarcinoma', organ: 'prostate', kind: 'malignant',
    who: 'Men over 50',
    presents: 'Often silent; a hard nodule on rectal exam; late, back pain from bone metastases.',
    micro: 'Graded by Gleason score (gland architecture), which tracks metastatic potential.',
    marker: 'PSA up with a LOW free-PSA fraction; prostatic acid phosphatase (PAP)',
    assoc: 'Arises in the peripheral zone (posterior lobe). Confirmed by transrectal ultrasound-guided needle biopsy. OsteoBLASTic bone metastases (raised ALP), reaching the spine through the Batson venous plexus.',
    hook: 'Peripheral, palpable, PSA, and bone-forming mets.',
    clues: [
      { t: 'present', x: 'Osteoblastic vertebral metastases with raised ALP in an older man' },
      { t: 'histo', x: 'Graded by the Gleason system of glandular architecture' },
      { t: 'assoc', x: 'Arises in the peripheral (posterior) zone of the prostate' },
      { t: 'marker', x: 'Raised total PSA with a LOW free-PSA fraction' },
    ],
    case: { who: 'A 72-year-old man', sees: 'has low back pain; the rectal exam finds a hard, irregular nodule in the posterior gland', more: ['Total PSA is high with a low free fraction; bone scan shows sclerotic vertebral lesions.'] },
  },
  {
    id: 'bph', name: 'Benign prostatic hyperplasia', organ: 'prostate', kind: 'benign',
    who: 'Men over 50',
    presents: 'Frequency, nocturia, hesitancy, weak stream, dribbling; smooth, rubbery, enlarged gland.',
    micro: 'Hyperplasia (not hypertrophy) of the transition zone, squeezing the urethra into a slit.',
    marker: 'Total PSA can rise, with a HIGHER free fraction',
    assoc: 'Not premalignant. Can lead to bladder hypertrophy, hydronephrosis and UTIs. Treat with α1-blockers, 5α-reductase inhibitors, PDE-5 inhibitors or TURP.',
    hook: 'Transition zone, urinary symptoms, not cancer.',
    clues: [
      { t: 'histo', x: 'Nodular hyperplasia of the transition zone compressing the urethra' },
      { t: 'marker', x: 'Raised PSA with a HIGH free fraction' },
    ],
    case: { who: 'A 68-year-old man', sees: 'gets up four times a night to pass urine and has a weak stream; the gland feels smooth, rubbery and symmetrically enlarged', more: ['PSA is mildly raised with a high free fraction.'] },
  },
];

export const TUMOR_BY_ID = Object.fromEntries(TUMORS.map(t => [t.id, t]));
export const ORGAN_BY_ID = Object.fromEntries(ORGANS.map(o => [o.id, o]));
export const famOf = (t) => t.fam || t.id;

/** Every clue as a quiz item: { key, t, x, tumor }. */
export const CLUES = TUMORS.flatMap(t => t.clues.map((c, i) => ({ key: `${t.id}-${i}`, t: c.t, x: c.x, tumor: t })));
