/**
 * Muscle Mapper — the knowledge base.
 *
 * Everything here is the high-yield peripheral-nerve material USMLE Step 1
 * draws on, matched to the First Aid tables: each nerve's roots, its
 * muscles, its sensory territory, the classic site of injury and what that
 * injury looks like; the brachial plexus lesions; the hand and gait signs;
 * the reflexes, myotomes and dermatomes; the disc herniations.
 *
 * ONE SOURCE FOR EVERYTHING. The questions, the explanations and the plexus
 * map are all read from these tables, so a fact appears once and cannot be
 * stated two ways. The map's anatomy (PLEXUS below) is a graph of the real
 * structure — roots, trunks, divisions, cords — and the roots it derives for
 * each nerve are checked against the roots written here.
 */

export const rootsLabel = (roots) =>
  roots.length === 1 ? roots[0] : `${roots[0]}–${roots[roots.length - 1]}`;

// ── Nerves ────────────────────────────────────────────────────────────────
export const NERVES = {
  // Upper limb
  musculocutaneous: {
    name: 'Musculocutaneous nerve', short: 'Musculocutaneous', region: 'upper', roots: ['C5', 'C6', 'C7'],
    muscles: ['coracobrachialis', 'biceps', 'brachialis'],
    sensory: 'Lateral forearm',
    injury: ['Upper trunk compression'],
    deficit: 'Loss of elbow flexion; weak supination',
  },
  axillary: {
    name: 'Axillary nerve', short: 'Axillary', region: 'upper', roots: ['C5', 'C6'],
    muscles: ['deltoid', 'teresMinor'],
    sensory: 'Skin over the deltoid — the "regimental badge" area',
    injury: ['Fracture of the surgical neck of the humerus', 'Anterior shoulder dislocation'],
    deficit: 'Flattened deltoid; loss of arm abduction beyond 15°',
    signs: ['flatDeltoid'],
  },
  radial: {
    name: 'Radial nerve', short: 'Radial', region: 'upper', roots: ['C5', 'C6', 'C7', 'C8', 'T1'],
    muscles: ['triceps', 'brachioradialis', 'ecrl', 'extensorDigitorum', 'supinator'],
    sensory: 'Posterior arm and forearm; dorsum of the hand (lateral side)',
    injury: ['Midshaft fracture of the humerus (radial groove)', 'Compression of the axilla — crutches, "Saturday night palsy"'],
    deficit: 'Wrist drop: loss of wrist and finger extension; ↓ grip strength',
    signs: ['wristDrop'],
  },
  median: {
    name: 'Median nerve', short: 'Median', region: 'upper', roots: ['C5', 'C6', 'C7', 'C8', 'T1'],
    muscles: ['pronatorTeres', 'fcr', 'fds', 'fpl', 'apb', 'opponens', 'lumbricals12'],
    sensory: 'Palm: thenar eminence and the lateral 3½ digits',
    injury: ['Supracondylar fracture of the humerus (proximal lesion)', 'Carpal tunnel syndrome; wrist laceration (distal lesion)'],
    deficit: 'Proximal: hand of benediction on making a fist. Distal: ape hand — thenar wasting, no opposition',
    signs: ['benediction', 'apeHand', 'phalen', 'okSign'],
  },
  ulnar: {
    name: 'Ulnar nerve', short: 'Ulnar', region: 'upper', roots: ['C8', 'T1'],
    muscles: ['fcu', 'fdpMedial', 'palmarInterossei', 'dorsalInterossei', 'adductorPollicis', 'hypothenar', 'lumbricals34'],
    sensory: 'Medial 1½ digits and the hypothenar eminence',
    injury: ['Fracture of the medial epicondyle — the "funny bone" (proximal)', 'Fracture of the hook of the hamate; fall onto an outstretched hand — Guyon canal (distal)'],
    deficit: 'Ulnar claw on extending the fingers; loss of finger abduction and adduction; radial deviation of the wrist on flexion (proximal lesion)',
    signs: ['ulnarClaw', 'froment'],
  },
  recurrentMedian: {
    name: 'Recurrent branch of the median nerve', short: 'Recurrent median', region: 'upper', roots: ['C5', 'C6', 'C7', 'C8', 'T1'],
    muscles: ['apb', 'opponens'],
    sensory: 'None — it is purely motor',
    injury: ['Superficial laceration of the palm'],
    deficit: 'Ape hand — loss of thenar function and opposition, with NO sensory loss',
    signs: ['apeHand'],
  },
  longThoracic: {
    name: 'Long thoracic nerve', short: 'Long thoracic', region: 'upper', roots: ['C5', 'C6', 'C7'],
    muscles: ['serratusAnterior'],
    sensory: 'None',
    injury: ['Axillary lymph node dissection after mastectomy', 'Stab wound to the lateral chest'],
    deficit: 'Winged scapula; cannot abduct the arm above horizontal',
    signs: ['winged'],
  },
  suprascapular: {
    name: 'Suprascapular nerve', short: 'Suprascapular', region: 'upper', roots: ['C5', 'C6'],
    muscles: ['supraspinatus', 'infraspinatus'],
    sensory: 'None (shoulder joint)',
    injury: ['Entrapment at the suprascapular notch', 'Upper trunk injury'],
    deficit: 'Weak initiation of abduction (0–15°) and external rotation',
    signs: ['emptyCan'],
  },
  subscapular: {
    name: 'Upper & lower subscapular nerves', short: 'Subscapular', region: 'upper', roots: ['C5', 'C6'],
    muscles: ['subscapularis', 'teresMajor'],
    sensory: 'None',
    injury: [],
    deficit: 'Weak internal rotation of the arm',
    signs: ['liftOff'],
  },
  thoracodorsal: {
    name: 'Thoracodorsal nerve', short: 'Thoracodorsal', region: 'upper', roots: ['C6', 'C7', 'C8'],
    muscles: ['latissimus'],
    sensory: 'None',
    injury: [],
    deficit: 'Weak extension, adduction and internal rotation of the arm',
  },

  // Lower limb
  obturator: {
    name: 'Obturator nerve', short: 'Obturator', region: 'lower', roots: ['L2', 'L3', 'L4'],
    muscles: ['adductorLongus', 'gracilis'],
    sensory: 'Medial thigh',
    injury: ['Pelvic surgery'],
    deficit: '↓ Thigh adduction; numbness of the medial thigh',
    signs: ['adduction'],
  },
  femoral: {
    name: 'Femoral nerve', short: 'Femoral', region: 'lower', roots: ['L2', 'L3', 'L4'],
    muscles: ['quadriceps', 'iliacus', 'sartorius'],
    sensory: 'Anterior thigh and medial leg (saphenous nerve)',
    injury: ['Pelvic fracture'],
    deficit: '↓ Knee extension (and hip flexion); ↓ patellar reflex',
    signs: ['kneeJerk'],
  },
  sciatic: {
    name: 'Sciatic nerve', short: 'Sciatic', region: 'lower', roots: ['L4', 'L5', 'S1', 'S2', 'S3'],
    muscles: ['hamstrings'],
    sensory: 'Everything below the knee except the medial leg',
    injury: ['Posterior hip dislocation', 'Misplaced intramuscular injection in the buttock'],
    deficit: 'Loss of knee flexion, and of all movement below the knee',
  },
  tibial: {
    name: 'Tibial nerve', short: 'Tibial', region: 'lower', roots: ['L4', 'L5', 'S1', 'S2', 'S3'],
    muscles: ['gastrocnemius', 'soleus', 'tibialisPosterior'],
    sensory: 'The sole of the foot',
    injury: ['Knee trauma; Baker cyst (proximal)', 'Tarsal tunnel syndrome (distal)'],
    deficit: 'Loss of plantarflexion and inversion; cannot curl the toes or stand on tiptoes',
    signs: ['tiptoe'],
    mnemonic: 'TIP — Tibial Inverts and Plantarflexes; if injured, can’t stand on TIPtoes.',
  },
  commonPeroneal: {
    name: 'Common fibular (peroneal) nerve', short: 'Common fibular', region: 'lower', roots: ['L4', 'L5', 'S1', 'S2'],
    muscles: ['tibialisAnterior', 'ehl', 'fibularisLongus'],
    sensory: 'Dorsum of the foot and anterolateral leg',
    injury: ['Fracture of the fibular neck', 'Trauma or compression of the lateral leg (tight cast, crossed legs)'],
    deficit: 'Foot drop — loss of dorsiflexion and eversion; steppage gait',
    signs: ['footDrop'],
    mnemonic: 'PED — Peroneal Everts and Dorsiflexes; if injured, foot dropPED.',
  },
  deepPeroneal: {
    name: 'Deep fibular (peroneal) nerve', short: 'Deep fibular', region: 'lower', roots: ['L4', 'L5'],
    muscles: ['tibialisAnterior', 'ehl'],
    sensory: 'The first web space only',
    injury: ['Anterior compartment syndrome'],
    deficit: 'Loss of dorsiflexion; numb first web space',
    signs: ['footDrop'],
  },
  superficialPeroneal: {
    name: 'Superficial fibular (peroneal) nerve', short: 'Superficial fibular', region: 'lower', roots: ['L5', 'S1'],
    muscles: ['fibularisLongus'],
    sensory: 'Dorsum of the foot (except the first web space)',
    injury: ['Lateral compartment injury'],
    deficit: 'Loss of eversion',
  },
  superiorGluteal: {
    name: 'Superior gluteal nerve', short: 'Superior gluteal', region: 'lower', roots: ['L4', 'L5', 'S1'],
    muscles: ['gluteusMedius', 'gluteusMinimus', 'tfl'],
    sensory: 'None',
    injury: ['Intramuscular injection into the SUPEROMEDIAL buttock', 'Posterior hip dislocation'],
    deficit: 'Trendelenburg sign — weak hip abduction',
    signs: ['trendelenburg'],
  },
  inferiorGluteal: {
    name: 'Inferior gluteal nerve', short: 'Inferior gluteal', region: 'lower', roots: ['L5', 'S1', 'S2'],
    muscles: ['gluteusMaximus'],
    sensory: 'None',
    injury: ['Posterior hip dislocation'],
    deficit: 'Difficulty climbing stairs and rising from a chair — weak hip extension',
    signs: ['stairs'],
  },
  pudendal: {
    name: 'Pudendal nerve', short: 'Pudendal', region: 'lower', roots: ['S2', 'S3', 'S4'],
    muscles: ['extAnalSphincter'],
    sensory: 'Perineum and genitalia',
    injury: ['Stretch during childbirth', 'Prolonged cycling'],
    deficit: '↓ Perineal sensation; faecal and urinary incontinence. Pudendal block is given at the ischial spine',
    signs: ['incontinence'],
  },
};

// ── Muscles ───────────────────────────────────────────────────────────────
export const MUSCLES = {
  // Shoulder & rotator cuff
  deltoid: { name: 'Deltoid', nerve: 'axillary', action: 'Arm abduction beyond 15° (to 90°)' },
  teresMinor: { name: 'Teres minor', nerve: 'axillary', action: 'External rotation of the arm', cuff: true },
  supraspinatus: { name: 'Supraspinatus', nerve: 'suprascapular', action: 'Initiates abduction (0–15°)', test: 'Empty can test', cuff: true },
  infraspinatus: { name: 'Infraspinatus', nerve: 'suprascapular', action: 'External rotation of the arm', cuff: true },
  subscapularis: { name: 'Subscapularis', nerve: 'subscapular', action: 'Internal rotation and adduction of the arm', test: 'Lift-off test', cuff: true },
  teresMajor: { name: 'Teres major', nerve: 'subscapular', action: 'Adduction and internal rotation of the arm' },
  latissimus: { name: 'Latissimus dorsi', nerve: 'thoracodorsal', action: 'Extension, adduction and internal rotation of the arm' },
  serratusAnterior: { name: 'Serratus anterior', nerve: 'longThoracic', action: 'Holds the scapula to the chest wall; abduction above horizontal', test: 'Push against a wall' },
  // Arm
  biceps: { name: 'Biceps brachii', nerve: 'musculocutaneous', action: 'Elbow flexion and forearm supination' },
  brachialis: { name: 'Brachialis', nerve: 'musculocutaneous', action: 'Elbow flexion' },
  coracobrachialis: { name: 'Coracobrachialis', nerve: 'musculocutaneous', action: 'Flexion and adduction of the arm' },
  triceps: { name: 'Triceps brachii', nerve: 'radial', action: 'Elbow extension' },
  // Forearm
  brachioradialis: { name: 'Brachioradialis', nerve: 'radial', action: 'Elbow flexion with the forearm mid-prone' },
  ecrl: { name: 'Extensor carpi radialis longus', nerve: 'radial', action: 'Wrist extension' },
  extensorDigitorum: { name: 'Extensor digitorum', nerve: 'radial', action: 'Finger extension' },
  supinator: { name: 'Supinator', nerve: 'radial', action: 'Forearm supination' },
  pronatorTeres: { name: 'Pronator teres', nerve: 'median', action: 'Forearm pronation' },
  fcr: { name: 'Flexor carpi radialis', nerve: 'median', action: 'Wrist flexion with radial deviation' },
  fds: { name: 'Flexor digitorum superficialis', nerve: 'median', action: 'Flexes the PIP joints' },
  fpl: { name: 'Flexor pollicis longus', nerve: 'median', action: 'Flexes the thumb IP joint (anterior interosseous branch)', test: 'OK sign' },
  fcu: { name: 'Flexor carpi ulnaris', nerve: 'ulnar', action: 'Wrist flexion with ulnar deviation' },
  fdpMedial: { name: 'Flexor digitorum profundus (medial half)', nerve: 'ulnar', action: 'Flexes the DIP joints of the ring and little fingers' },
  // Hand
  apb: { name: 'Abductor pollicis brevis', nerve: 'median', action: 'Thumb abduction', thenar: true },
  opponens: { name: 'Opponens pollicis', nerve: 'median', action: 'Thumb opposition', thenar: true },
  lumbricals12: { name: '1st & 2nd lumbricals', nerve: 'median', action: 'Flex the MCP and extend the IP joints of the index and middle fingers' },
  lumbricals34: { name: '3rd & 4th lumbricals', nerve: 'ulnar', action: 'Flex the MCP and extend the IP joints of the ring and little fingers' },
  palmarInterossei: { name: 'Palmar interossei', nerve: 'ulnar', action: 'Finger ADduction — PAD', test: 'Grip a card between the fingers' },
  dorsalInterossei: { name: 'Dorsal interossei', nerve: 'ulnar', action: 'Finger ABduction — DAB', test: 'Spread the fingers against resistance' },
  adductorPollicis: { name: 'Adductor pollicis', nerve: 'ulnar', action: 'Thumb adduction', test: 'Froment sign' },
  hypothenar: { name: 'Hypothenar muscles', nerve: 'ulnar', action: 'Little finger abduction, flexion and opposition' },
  // Hip & thigh
  iliacus: { name: 'Iliacus (iliopsoas)', nerve: 'femoral', action: 'Hip flexion' },
  quadriceps: { name: 'Quadriceps femoris', nerve: 'femoral', action: 'Knee extension' },
  sartorius: { name: 'Sartorius', nerve: 'femoral', action: 'Flexes, abducts and laterally rotates the hip; flexes the knee' },
  adductorLongus: { name: 'Adductor longus', nerve: 'obturator', action: 'Thigh adduction' },
  gracilis: { name: 'Gracilis', nerve: 'obturator', action: 'Thigh adduction; knee flexion' },
  gluteusMedius: { name: 'Gluteus medius', nerve: 'superiorGluteal', action: 'Hip abduction — keeps the pelvis level when standing on one leg', test: 'Trendelenburg test' },
  gluteusMinimus: { name: 'Gluteus minimus', nerve: 'superiorGluteal', action: 'Hip abduction and internal rotation' },
  tfl: { name: 'Tensor fasciae latae', nerve: 'superiorGluteal', action: 'Hip abduction and flexion; tenses the IT band' },
  gluteusMaximus: { name: 'Gluteus maximus', nerve: 'inferiorGluteal', action: 'Hip extension — climbing stairs, rising from a chair' },
  hamstrings: { name: 'Hamstrings', nerve: 'sciatic', action: 'Knee flexion and hip extension' },
  // Leg
  tibialisAnterior: { name: 'Tibialis anterior', nerve: 'deepPeroneal', action: 'Ankle dorsiflexion and inversion', test: 'Heel walking' },
  ehl: { name: 'Extensor hallucis longus', nerve: 'deepPeroneal', action: 'Great toe extension' },
  fibularisLongus: { name: 'Fibularis (peroneus) longus', nerve: 'superficialPeroneal', action: 'Foot eversion' },
  gastrocnemius: { name: 'Gastrocnemius', nerve: 'tibial', action: 'Ankle plantarflexion (and knee flexion)', test: 'Standing on tiptoe' },
  soleus: { name: 'Soleus', nerve: 'tibial', action: 'Ankle plantarflexion' },
  tibialisPosterior: { name: 'Tibialis posterior', nerve: 'tibial', action: 'Foot inversion and plantarflexion' },
  extAnalSphincter: { name: 'External anal sphincter', nerve: 'pudendal', action: 'Voluntary faecal continence' },
};

// ── Signs ─────────────────────────────────────────────────────────────────
export const SIGNS = {
  wristDrop: { name: 'Wrist drop', icon: '🫳', desc: 'The wrist and fingers can’t be extended — the hand hangs limp.' },
  benediction: { name: 'Hand of benediction', icon: '✌️', desc: 'Proximal median lesion: asked to make a fist, the index and middle fingers stay straight.' },
  apeHand: { name: 'Ape hand', icon: '🐒', desc: 'Thenar wasting; the thumb can’t oppose and lies in line with the fingers.' },
  phalen: { name: 'Positive Phalen and Tinel at the wrist', icon: '🤲', desc: 'Holding the wrists flexed, or tapping over the carpal tunnel, brings on tingling in the lateral 3½ fingers.' },
  okSign: { name: 'Weak "OK" sign', icon: '👌', desc: 'Anterior interosseous lesion: the thumb tip and index tip can’t make a circle (FPL and lateral FDP).' },
  ulnarClaw: { name: 'Ulnar claw', icon: '🦅', desc: 'Trying to straighten the fingers, the ring and little fingers claw — MCPs extended, IPs flexed.' },
  froment: { name: 'Froment sign', icon: '📄', desc: 'Holding paper between thumb and index finger, the thumb tip bends — flexor pollicis longus standing in for a weak adductor pollicis.' },
  winged: { name: 'Winged scapula', icon: '🪽', desc: 'Pushing against a wall, the medial border of the scapula lifts off the chest wall.' },
  flatDeltoid: { name: 'Flat deltoid and "regimental badge" numbness', icon: '🎖️', desc: 'The shoulder loses its rounded contour; numb skin over the lateral shoulder.' },
  emptyCan: { name: 'Positive empty can test', icon: '🥫', desc: 'Arm abducted to 90° and internally rotated, thumbs down: weak and painful against resistance.' },
  liftOff: { name: 'Positive lift-off test', icon: '🙌', desc: 'Hand behind the back, the patient can’t lift it away from the spine.' },
  waitersTip: { name: 'Waiter’s tip', icon: '🤵', desc: 'Arm adducted and internally rotated, elbow extended, forearm pronated.' },
  totalClaw: { name: 'Total claw hand', icon: '🖐️', desc: 'All the intrinsic hand muscles lost: every finger clawed.' },
  horner: { name: 'Horner syndrome', icon: '👁️', desc: 'Ptosis, miosis and anhidrosis on the same side.' },
  footDrop: { name: 'Foot drop and steppage gait', icon: '🦶', desc: 'The foot slaps down; the knee is lifted high to clear the toes.' },
  trendelenburg: { name: 'Trendelenburg sign', icon: '⚖️', desc: 'Standing on the AFFECTED leg, the pelvis drops on the opposite side.' },
  tiptoe: { name: 'Can’t stand on tiptoes', icon: '🩰', desc: 'No plantarflexion; can’t curl the toes; the sole is numb.' },
  stairs: { name: 'Can’t climb stairs or rise from a chair', icon: '🪜', desc: 'Weak hip extension.' },
  kneeJerk: { name: 'Absent knee jerk', icon: '🦵', desc: 'The patellar reflex (L4) is lost, with weak knee extension.' },
  ankleJerk: { name: 'Absent ankle jerk', icon: '🦶', desc: 'The Achilles reflex (S1) is lost, with weak plantarflexion.' },
  adduction: { name: 'Weak thigh adduction', icon: '🦵', desc: 'Can’t squeeze the knees together; numb medial thigh.' },
  incontinence: { name: 'Perineal numbness and incontinence', icon: '🚻', desc: 'Loss of sensation over the perineum, with faecal or urinary incontinence.' },
};

// ── Reflexes, myotomes, dermatomes ───────────────────────────────────────
// First Aid: "S1, 2 buckle my shoe; L3, 4 kick the door; C5, 6 pick up
// sticks; C7, 8 lay them straight." The single root asked is the one First
// Aid names.
export const REFLEXES = [
  { id: 'biceps', name: 'Biceps reflex', root: 'C5', hint: 'C5, 6 pick up sticks' },
  { id: 'brachioradialis', name: 'Brachioradialis reflex', root: 'C6' },
  { id: 'triceps', name: 'Triceps reflex', root: 'C7', hint: 'C7, 8 lay them straight' },
  { id: 'patellar', name: 'Patellar (knee) reflex', root: 'L4', hint: 'L3, 4 kick the door' },
  { id: 'achilles', name: 'Achilles (ankle) reflex', root: 'S1', hint: 'S1, 2 buckle my shoe' },
  { id: 'cremasteric', name: 'Cremasteric reflex', root: 'L1', hint: 'L1–L2, "testicles move"' },
  { id: 'anal', name: 'Anal wink reflex', root: 'S3', hint: 'S3–S4, "winks galore"' },
];

// The ASIA key muscles: one movement per root.
export const MYOTOMES = [
  { root: 'C5', movement: 'Elbow flexion (biceps)' },
  { root: 'C6', movement: 'Wrist extension' },
  { root: 'C7', movement: 'Elbow extension (triceps)' },
  { root: 'C8', movement: 'Finger flexion (middle finger DIP)' },
  { root: 'T1', movement: 'Little finger abduction' },
  { root: 'L2', movement: 'Hip flexion' },
  { root: 'L3', movement: 'Knee extension' },
  { root: 'L4', movement: 'Ankle dorsiflexion' },
  { root: 'L5', movement: 'Great toe extension' },
  { root: 'S1', movement: 'Ankle plantarflexion' },
];

export const DERMATOMES = [
  { root: 'C6', landmark: 'Thumb' },
  { root: 'C7', landmark: 'Middle finger' },
  { root: 'C8', landmark: 'Little finger' },
  { root: 'T4', landmark: 'Nipple', hint: 'T4 at the teat pore' },
  { root: 'T7', landmark: 'Xiphoid process' },
  { root: 'T10', landmark: 'Umbilicus', hint: 'T10 at the belly butTEN — where early appendicitis pain is referred' },
  { root: 'L1', landmark: 'Inguinal ligament', hint: 'L1 is IL — Inguinal Ligament' },
  { root: 'L4', landmark: 'Kneecap and medial leg', hint: 'Down on ALL 4s' },
  { root: 'L5', landmark: 'Dorsum of the foot and great toe' },
  { root: 'S1', landmark: 'Lateral foot and sole' },
];

export const ALL_ROOTS = ['C5', 'C6', 'C7', 'C8', 'T1', 'T4', 'T7', 'T10', 'L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4'];

// ── The plexuses, as graphs ───────────────────────────────────────────────
/**
 * Nodes and edges of the real structure, with drawing positions. The map
 * highlights a nerve by walking these edges back to the roots, keeping only
 * the branches that carry that nerve's own roots — so the axillary nerve
 * lights the posterior cord but only the C5–C6 part of it, as it should.
 *
 * Brachial: "Randy Travis Drinks Cold Beer" — Roots, Trunks, Divisions,
 * Cords, Branches.
 */
export const PLEXUS = {
  upper: {
    title: 'Brachial plexus',
    // Wide enough that the posterior cord's small branches (subscapular,
    // thoracodorsal) sit in their own column instead of on the axillary pill.
    width: 670, height: 400,
    columns: [
      { x: 40, label: 'Roots' }, { x: 150, label: 'Trunks' }, { x: 240, label: 'Divisions' },
      { x: 335, label: 'Cords' }, { x: 500, label: 'Nerves' },
    ],
    nodes: {
      C5: { x: 40, y: 70, kind: 'root', label: 'C5' },
      C6: { x: 40, y: 125, kind: 'root', label: 'C6' },
      C7: { x: 40, y: 180, kind: 'root', label: 'C7' },
      C8: { x: 40, y: 235, kind: 'root', label: 'C8' },
      T1: { x: 40, y: 290, kind: 'root', label: 'T1' },
      UT: { x: 150, y: 97, kind: 'trunk', label: 'Upper' },
      MT: { x: 150, y: 180, kind: 'trunk', label: 'Middle' },
      LT: { x: 150, y: 262, kind: 'trunk', label: 'Lower' },
      UTa: { x: 240, y: 80, kind: 'div', label: 'A' },
      UTp: { x: 240, y: 118, kind: 'div', label: 'P' },
      MTa: { x: 240, y: 162, kind: 'div', label: 'A' },
      MTp: { x: 240, y: 200, kind: 'div', label: 'P' },
      LTa: { x: 240, y: 245, kind: 'div', label: 'A' },
      LTp: { x: 240, y: 283, kind: 'div', label: 'P' },
      LC: { x: 335, y: 95, kind: 'cord', label: 'Lateral' },
      PC: { x: 335, y: 190, kind: 'cord', label: 'Posterior' },
      MC: { x: 335, y: 285, kind: 'cord', label: 'Medial' },
      musculocutaneous: { x: 500, y: 55, kind: 'nerve' },
      axillary: { x: 500, y: 150, kind: 'nerve' },
      radial: { x: 500, y: 205, kind: 'nerve' },
      median: { x: 500, y: 260, kind: 'nerve' },
      ulnar: { x: 500, y: 315, kind: 'nerve' },
      suprascapular: { x: 500, y: 18, kind: 'nerve', minor: true },
      subscapular: { x: 408, y: 150, kind: 'nerve', minor: true },
      thoracodorsal: { x: 408, y: 232, kind: 'nerve', minor: true },
      longThoracic: { x: 150, y: 360, kind: 'nerve', minor: true },
      recurrentMedian: { x: 610, y: 260, kind: 'nerve', minor: true },
    },
    edges: [
      ['C5', 'UT'], ['C6', 'UT'], ['C7', 'MT'], ['C8', 'LT'], ['T1', 'LT'],
      ['UT', 'UTa'], ['UT', 'UTp'], ['MT', 'MTa'], ['MT', 'MTp'], ['LT', 'LTa'], ['LT', 'LTp'],
      ['UTa', 'LC'], ['MTa', 'LC'], ['LTa', 'MC'],
      ['UTp', 'PC'], ['MTp', 'PC'], ['LTp', 'PC'],
      ['LC', 'musculocutaneous'], ['LC', 'median'], ['MC', 'median'], ['MC', 'ulnar'],
      ['PC', 'axillary'], ['PC', 'radial'], ['PC', 'subscapular'], ['PC', 'thoracodorsal'],
      ['UT', 'suprascapular'],
      ['C5', 'longThoracic'], ['C6', 'longThoracic'], ['C7', 'longThoracic'],
      ['median', 'recurrentMedian'],
    ],
  },
  lower: {
    title: 'Lumbosacral plexus',
    width: 620, height: 400,
    columns: [{ x: 40, label: 'Roots' }, { x: 230, label: 'Nerves' }, { x: 400, label: 'Branches' }, { x: 545, label: '' }],
    nodes: {
      L2: { x: 40, y: 40, kind: 'root', label: 'L2' },
      L3: { x: 40, y: 85, kind: 'root', label: 'L3' },
      L4: { x: 40, y: 130, kind: 'root', label: 'L4' },
      L5: { x: 40, y: 175, kind: 'root', label: 'L5' },
      S1: { x: 40, y: 220, kind: 'root', label: 'S1' },
      S2: { x: 40, y: 265, kind: 'root', label: 'S2' },
      S3: { x: 40, y: 310, kind: 'root', label: 'S3' },
      S4: { x: 40, y: 355, kind: 'root', label: 'S4' },
      femoral: { x: 230, y: 45, kind: 'nerve' },
      obturator: { x: 230, y: 100, kind: 'nerve' },
      superiorGluteal: { x: 230, y: 160, kind: 'nerve' },
      inferiorGluteal: { x: 230, y: 212, kind: 'nerve' },
      sciatic: { x: 230, y: 268, kind: 'nerve' },
      pudendal: { x: 230, y: 345, kind: 'nerve' },
      tibial: { x: 400, y: 245, kind: 'nerve' },
      commonPeroneal: { x: 400, y: 300, kind: 'nerve' },
      deepPeroneal: { x: 545, y: 280, kind: 'nerve', minor: true },
      superficialPeroneal: { x: 545, y: 330, kind: 'nerve', minor: true },
    },
    edges: [
      ['L2', 'femoral'], ['L3', 'femoral'], ['L4', 'femoral'],
      ['L2', 'obturator'], ['L3', 'obturator'], ['L4', 'obturator'],
      ['L4', 'superiorGluteal'], ['L5', 'superiorGluteal'], ['S1', 'superiorGluteal'],
      ['L5', 'inferiorGluteal'], ['S1', 'inferiorGluteal'], ['S2', 'inferiorGluteal'],
      ['L4', 'sciatic'], ['L5', 'sciatic'], ['S1', 'sciatic'], ['S2', 'sciatic'], ['S3', 'sciatic'],
      ['S2', 'pudendal'], ['S3', 'pudendal'], ['S4', 'pudendal'],
      ['sciatic', 'tibial'], ['sciatic', 'commonPeroneal'],
      ['commonPeroneal', 'deepPeroneal'], ['commonPeroneal', 'superficialPeroneal'],
    ],
  },
};

/**
 * The parts of the map a nerve's fibres run through: every upstream node and
 * edge whose roots overlap the nerve's own. Returns { nodes:Set, edges:Set,
 * roots:[...] } — the roots being what the GRAPH says the nerve carries,
 * which the verification checks against NERVES[x].roots.
 */
export function pathTo(region, target, onlyRoots = null) {
  const P = PLEXUS[region];
  const parents = {};
  for (const [a, b] of P.edges) (parents[b] = parents[b] || []).push(a);
  // Which roots each node carries, from the roots down.
  const carries = {};
  const carry = (id) => {
    if (carries[id]) return carries[id];
    if (P.nodes[id]?.kind === 'root') return (carries[id] = new Set([id]));
    const s = new Set();
    for (const p of parents[id] || []) for (const r of carry(p)) s.add(r);
    return (carries[id] = s);
  };
  const want = new Set(onlyRoots || NERVES[target]?.roots || [...carry(target)]);
  const nodes = new Set([target]);
  const edges = new Set();
  const walk = (id) => {
    for (const p of parents[id] || []) {
      const overlap = [...carry(p)].some(r => want.has(r));
      if (!overlap) continue;
      edges.add(`${p}>${id}`);
      if (!nodes.has(p)) { nodes.add(p); walk(p); }
    }
  };
  walk(target);
  const roots = [...nodes].filter(n => P.nodes[n]?.kind === 'root');
  return { nodes, edges, roots };
}

/** Everything downstream of a lesion at `node`: what it takes out. */
export function downstreamOf(region, node) {
  const P = PLEXUS[region];
  const kids = {};
  for (const [a, b] of P.edges) (kids[a] = kids[a] || []).push(b);
  const out = new Set();
  const walk = (id) => { for (const k of kids[id] || []) if (!out.has(k)) { out.add(k); walk(k); } };
  walk(node);
  return out;
}

export const regionOfNerve = (id) => NERVES[id]?.region;
