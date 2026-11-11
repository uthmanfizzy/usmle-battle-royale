import { NERVES, MUSCLES, SIGNS, REFLEXES, MYOTOMES, DERMATOMES, rootsLabel } from './muscleData';

/**
 * Muscle Mapper — the questions.
 *
 * INJURY CASES are chains, played in order, each link its own question:
 *
 *     the injury  →  which nerve  →  which roots  →  which muscle  →  which sign
 *
 * — because that is the chain a Step 1 question asks you to walk, usually
 * backwards from the sign. Every answer is a REFERENCE into muscleData
 * (`nerve: 'radial'`, `muscle: 'extensorDigitorum'`, `sign: 'wristDrop'`), so
 * the text shown is read from the one table and a verification check can
 * confirm each link holds: the roots are that nerve's roots, the muscle is
 * that nerve's muscle, the sign is that nerve's sign.
 *
 * Distractors are chosen per case, as in the ECG and ABG readers: the nerve
 * next to the one injured, the root set one off, the muscle on the
 * neighbouring nerve. Each wrong option has a reason.
 *
 * Root- and trunk-level lesions (Erb, Klumpke, a disc) name a level instead
 * of a nerve; their chain starts there.
 */

// Shorthand for one question in a chain.
const Q = (kind, answer, options, why, not = {}) => ({ kind, answer, options, why, not });

export const INJURY_CASES = [
  // ── Upper limb ─────────────────────────────────────────────────────────
  {
    id: 'surgical-neck', region: 'upper', lesion: { node: 'axillary' },
    title: 'A fall onto the shoulder',
    vignette: 'A 74-year-old falls onto her shoulder. X-ray shows a fracture of the surgical neck of the humerus. She cannot lift her arm away from her side, and the skin over the lateral shoulder is numb.',
    chain: [
      Q('nerve', 'axillary', ['axillary', 'radial', 'suprascapular', 'musculocutaneous'],
        'The axillary nerve wraps around the surgical neck with the posterior circumflex humeral artery — so a fracture there catches it.',
        { radial: 'The radial nerve is at risk at the MIDSHAFT, in the radial groove — and it would cause wrist drop.', suprascapular: 'Supraspinatus would weaken the first 15° of abduction, but would not numb the shoulder skin.', musculocutaneous: 'It would take out elbow flexion, not abduction.' }),
      Q('roots', 'axillary', ['axillary', 'radial', 'longThoracic', 'ulnar'],
        'Axillary: C5–C6, from the posterior cord.'),
      Q('muscle', 'deltoid', ['deltoid', 'supraspinatus', 'serratusAnterior', 'teresMajor'],
        'Deltoid abducts the arm from 15° to 90°. Supraspinatus only starts the movement.',
        { supraspinatus: 'Supraspinatus initiates abduction (0–15°); it is supplied by the suprascapular nerve, not the axillary.', serratusAnterior: 'Serratus takes the arm above horizontal; long thoracic nerve.', teresMajor: 'Teres major adducts and internally rotates.' }),
      Q('sign', 'flatDeltoid', ['flatDeltoid', 'winged', 'wristDrop', 'waitersTip'],
        'The deltoid wastes, flattening the shoulder, and the sensory loss sits where a regimental badge would be sewn.'),
    ],
  },
  {
    id: 'midshaft', region: 'upper',
    // Triceps branches leave ABOVE the radial groove: radial, but spared here.
    lesion: { node: 'radial', spared: ['triceps'] },
    title: 'Spiral fracture',
    vignette: 'A 30-year-old has a spiral fracture of the midshaft of the humerus. He can still straighten his elbow, but cannot lift his wrist or fingers.',
    chain: [
      Q('nerve', 'radial', ['radial', 'median', 'ulnar', 'axillary'],
        'The radial nerve runs in the radial (spiral) groove on the back of the humeral shaft.',
        { median: 'At risk with SUPRAcondylar fractures; it would affect flexion and the thenar muscles.', ulnar: 'At risk at the medial epicondyle.', axillary: 'At risk at the surgical neck.' }),
      Q('roots', 'radial', ['radial', 'ulnar', 'axillary', 'musculocutaneous'],
        'Radial: C5–T1, the continuation of the posterior cord.'),
      Q('muscle', 'extensorDigitorum', ['extensorDigitorum', 'triceps', 'fcr', 'brachialis'],
        'Wrist and finger extensors are supplied below the groove. Triceps branches leave ABOVE it — which is why the elbow still extends.',
        { triceps: 'Triceps is radial too, but its branches arise above the radial groove and are usually spared in a midshaft fracture.', fcr: 'A flexor — median nerve.', brachialis: 'An elbow flexor — musculocutaneous.' }),
      Q('sign', 'wristDrop', ['wristDrop', 'ulnarClaw', 'apeHand', 'benediction'],
        'Wrist drop — the classic radial nerve sign.'),
    ],
  },
  {
    id: 'crutches', region: 'upper', lesion: { node: 'radial' },
    title: 'After a night on crutches',
    vignette: 'A man who has been using poorly fitted crutches wakes with a weak arm: he cannot straighten his elbow, wrist or fingers.',
    chain: [
      Q('nerve', 'radial', ['radial', 'axillary', 'ulnar', 'musculocutaneous'],
        'Crutches pressing into the axilla compress the radial nerve high up — "Saturday night palsy" is the same thing from an arm draped over a chair.',
        { axillary: 'Would affect abduction, not extension of the elbow and wrist.', ulnar: 'Would cause a claw and loss of finger abduction, not wrist drop.', musculocutaneous: 'Would weaken elbow flexion.' }),
      Q('muscle', 'triceps', ['triceps', 'biceps', 'deltoid', 'fcu'],
        'Compression in the axilla is ABOVE the triceps branches, so here — unlike a midshaft fracture — the triceps is weak too.',
        { biceps: 'Biceps flexes; musculocutaneous.', deltoid: 'Abducts; axillary.', fcu: 'Ulnar.' }),
      Q('sign', 'wristDrop', ['wristDrop', 'froment', 'winged', 'okSign'],
        'Wrist drop, with weak elbow extension because the lesion is proximal.'),
    ],
  },
  {
    id: 'supracondylar', region: 'upper', lesion: { node: 'median' },
    title: 'Fall from the climbing frame',
    vignette: 'A 7-year-old falls onto an outstretched hand and has a supracondylar fracture of the humerus. Asked to make a fist, his index and middle fingers stay straight.',
    chain: [
      Q('nerve', 'median', ['median', 'ulnar', 'radial', 'recurrentMedian'],
        'Supracondylar fractures injure the median nerve (and the brachial artery) — a PROXIMAL median lesion.',
        { ulnar: 'The ulnar nerve is hit at the MEDIAL epicondyle.', radial: 'Radial gives wrist drop.', recurrentMedian: 'That branch is cut in the palm and spares the forearm flexors.' }),
      Q('roots', 'median', ['median', 'ulnar', 'musculocutaneous', 'axillary'],
        'Median: C5–T1, from the lateral and medial cords.'),
      Q('muscle', 'fds', ['fds', 'fcu', 'palmarInterossei', 'extensorDigitorum'],
        'The median-supplied flexors (FDS, and the lateral FDP) can’t flex the index and middle fingers; the ulnar half of FDP still flexes the ring and little fingers.',
        { fcu: 'Ulnar.', palmarInterossei: 'Ulnar — they adduct the fingers.', extensorDigitorum: 'An extensor — radial.' }),
      Q('sign', 'benediction', ['benediction', 'ulnarClaw', 'apeHand', 'wristDrop'],
        'The hand of benediction appears when trying to make a fist — the sign of a proximal median lesion.',
        { ulnarClaw: 'The ulnar claw appears on trying to EXTEND the fingers.', apeHand: 'Ape hand is the distal median picture (carpal tunnel), with the long flexors intact.', wristDrop: 'Radial.' }),
    ],
  },
  {
    id: 'carpal-tunnel', region: 'upper',
    // A DISTAL median lesion: the forearm muscles are supplied above the
    // tunnel and spared — they are median, but not lost.
    lesion: { node: 'median', spared: ['pronatorTeres', 'fcr', 'fds', 'fpl'] },
    title: 'Night-time tingling',
    vignette: 'A pregnant 32-year-old has burning and tingling in her thumb, index and middle fingers that wakes her at night. Shaking the hand eases it. The skin over the thenar eminence feels normal.',
    chain: [
      Q('nerve', 'median', ['median', 'ulnar', 'radial', 'musculocutaneous'],
        'Carpal tunnel syndrome: the median nerve compressed under the flexor retinaculum — common in pregnancy, hypothyroidism, RA, dialysis amyloid.',
        { ulnar: 'Ulnar symptoms are in the little and ring fingers.', radial: 'Radial sensation is on the back of the hand.', musculocutaneous: 'Sensation of the lateral forearm.' }),
      Q('muscle', 'opponens', ['opponens', 'adductorPollicis', 'fds', 'hypothenar'],
        'Distally, the median nerve supplies the thenar muscles; opponens pollicis is what lets the thumb oppose.',
        { adductorPollicis: 'Ulnar — the one thumb muscle the ulnar nerve owns.', fds: 'In the forearm, above the carpal tunnel — spared.', hypothenar: 'Ulnar.' }),
      Q('sign', 'phalen', ['phalen', 'froment', 'benediction', 'winged'],
        'Phalen and Tinel reproduce it. The thenar skin is spared because the palmar cutaneous branch leaves ABOVE the tunnel.',
        { benediction: 'That is a proximal median lesion; carpal tunnel spares the forearm flexors.' }),
    ],
  },
  {
    id: 'medial-epicondyle', region: 'upper', lesion: { node: 'ulnar' },
    title: 'The funny bone',
    vignette: 'A 25-year-old fractures the medial epicondyle. His little and ring fingers are numb, he cannot spread his fingers, and his wrist deviates radially when he flexes it.',
    chain: [
      Q('nerve', 'ulnar', ['ulnar', 'median', 'radial', 'musculocutaneous'],
        'The ulnar nerve runs behind the medial epicondyle — the "funny bone". A PROXIMAL ulnar lesion.',
        { median: 'Median is hit by SUPRAcondylar fractures.', radial: 'Radial gives wrist drop.', musculocutaneous: 'Elbow flexion.' }),
      Q('roots', 'ulnar', ['ulnar', 'median', 'axillary', 'longThoracic'],
        'Ulnar: C8–T1, from the medial cord.'),
      Q('muscle', 'fcu', ['fcu', 'fcr', 'ecrl', 'pronatorTeres'],
        'With flexor carpi ulnaris gone, flexing the wrist pulls it radially — FCR has no opposing ulnar puller.',
        { fcr: 'FCR is median and is what drags the wrist radially here.', ecrl: 'An extensor — radial.', pronatorTeres: 'Median; pronation.' }),
      Q('sign', 'ulnarClaw', ['ulnarClaw', 'benediction', 'wristDrop', 'apeHand'],
        'An ulnar claw on trying to extend the fingers — milder than with a distal lesion, because FDP to the ring and little fingers is lost too ("ulnar paradox").'),
    ],
  },
  {
    id: 'hamate', region: 'upper', lesion: { node: 'ulnar' },
    title: 'Cyclist’s hand',
    vignette: 'A cyclist who fell onto an outstretched hand has a fracture of the hook of the hamate. His ring and little fingers claw when he tries to straighten them, and he cannot hold a sheet of paper between thumb and index finger without bending his thumb.',
    chain: [
      Q('nerve', 'ulnar', ['ulnar', 'median', 'recurrentMedian', 'radial'],
        'Guyon canal: the ulnar nerve passes beside the hook of the hamate — a DISTAL ulnar lesion.',
        { median: 'Median runs through the carpal tunnel, lateral to the hamate.', recurrentMedian: 'Thenar muscles, not the claw.', radial: 'Wrist drop.' }),
      Q('muscle', 'adductorPollicis', ['adductorPollicis', 'opponens', 'apb', 'fpl'],
        'Adductor pollicis — the one thumb muscle supplied by the ulnar nerve.',
        { opponens: 'Median.', apb: 'Median.', fpl: 'Median — it is the muscle that substitutes, bending the thumb tip.' }),
      Q('sign', 'froment', ['froment', 'okSign', 'phalen', 'winged'],
        'Froment sign: with adductor pollicis weak, FPL (median) bends the thumb to grip the paper.',
        { okSign: 'A weak OK sign is the anterior interosseous (median) branch.' }),
    ],
  },
  {
    id: 'mastectomy', region: 'upper', lesion: { node: 'longThoracic' },
    title: 'After axillary dissection',
    vignette: 'Two weeks after a mastectomy with axillary lymph node dissection, a 52-year-old notices her shoulder blade sticks out when she pushes against a wall, and she cannot raise her arm above her head.',
    chain: [
      Q('nerve', 'longThoracic', ['longThoracic', 'axillary', 'suprascapular', 'thoracodorsal'],
        'The long thoracic nerve runs down the lateral chest wall over serratus anterior — directly in the field of an axillary dissection.',
        { axillary: 'Would flatten the deltoid, not wing the scapula.', suprascapular: 'Would weaken abduction initiation and external rotation.', thoracodorsal: 'Also in the axilla, but it supplies latissimus dorsi.' }),
      Q('roots', 'longThoracic', ['longThoracic', 'suprascapular', 'ulnar', 'radial'],
        'Long thoracic: C5–C7, straight from the roots — "C5, 6, 7 raise your wings to heaven".'),
      Q('muscle', 'serratusAnterior', ['serratusAnterior', 'latissimus', 'deltoid', 'supraspinatus'],
        'Serratus anterior holds the scapula against the ribs and rotates it upwards to take the arm above horizontal.'),
      Q('sign', 'winged', ['winged', 'flatDeltoid', 'emptyCan', 'waitersTip'],
        'Winged scapula.'),
    ],
  },
  {
    id: 'supraspinatus', region: 'upper', lesion: { node: 'suprascapular', muscle: 'supraspinatus' },
    title: 'The painter’s shoulder',
    vignette: 'A 58-year-old painter has shoulder pain when reaching overhead. He struggles to START lifting his arm from his side, though once it is up he can hold it. Rotator cuff tear is suspected.',
    chain: [
      Q('muscle', 'supraspinatus', ['supraspinatus', 'deltoid', 'infraspinatus', 'subscapularis'],
        'Supraspinatus initiates abduction (0–15°), and it is the most commonly injured rotator cuff muscle — it is pinched under the acromion.',
        { deltoid: 'Deltoid takes over after 15° — he can hold the arm up once it is started.', infraspinatus: 'External rotation; often injured in pitchers.', subscapularis: 'Internal rotation.' }),
      Q('nerve', 'suprascapular', ['suprascapular', 'axillary', 'subscapular', 'longThoracic'],
        'The suprascapular nerve supplies supraspinatus and infraspinatus. The rotator cuff is SItS: Supraspinatus, Infraspinatus, teres minor, Subscapularis.',
        { axillary: 'Axillary supplies the deltoid and teres minor.', subscapular: 'Subscapularis and teres major.' }),
      Q('sign', 'emptyCan', ['emptyCan', 'liftOff', 'winged', 'flatDeltoid'],
        'The empty can test isolates supraspinatus.',
        { liftOff: 'Lift-off tests subscapularis.' }),
    ],
  },
  {
    id: 'erb', region: 'upper', lesion: { node: 'UT', level: 'Upper trunk (C5–C6)', muscles: ['deltoid', 'supraspinatus', 'infraspinatus', 'biceps'] },
    title: 'A difficult delivery',
    vignette: 'After a shoulder dystocia with lateral traction on the neck, a newborn holds one arm limp at the side, internally rotated, with the elbow straight and the palm facing backwards.',
    chain: [
      Q('level', 'Upper trunk (C5–C6) — Erb palsy', ['Upper trunk (C5–C6) — Erb palsy', 'Lower trunk (C8–T1) — Klumpke palsy', 'Long thoracic nerve', 'Axillary nerve'],
        'Lateral traction on the neck tears the upper trunk: Erb palsy.',
        { 'Lower trunk (C8–T1) — Klumpke palsy': 'Klumpke follows UPWARD traction on the arm and affects the hand.', 'Long thoracic nerve': 'Would wing the scapula only.', 'Axillary nerve': 'Would explain the adducted arm but not the extended elbow or the pronation.' }),
      Q('muscle', 'biceps', ['biceps', 'triceps', 'palmarInterossei', 'fcu'],
        'Biceps (C5–C6) lost → the elbow extends and the forearm pronates. With deltoid and supraspinatus lost the arm hangs adducted; with infraspinatus lost it rotates medially.',
        { triceps: 'Triceps (C7) is spared — that is why the elbow is straight.', palmarInterossei: 'Hand — lower trunk.', fcu: 'Lower trunk.' }),
      Q('sign', 'waitersTip', ['waitersTip', 'totalClaw', 'winged', 'wristDrop'],
        'Waiter’s tip: adducted, internally rotated, extended, pronated.'),
    ],
  },
  {
    id: 'klumpke', region: 'upper', lesion: { node: 'LT', level: 'Lower trunk (C8–T1)', muscles: ['palmarInterossei', 'dorsalInterossei', 'lumbricals12', 'lumbricals34', 'apb', 'hypothenar'] },
    title: 'Grabbing a branch',
    vignette: 'A man falling from a tree grabbed a branch to stop himself. Now all of his fingers are clawed and the small muscles of his hand are wasting.',
    chain: [
      Q('level', 'Lower trunk (C8–T1) — Klumpke palsy', ['Lower trunk (C8–T1) — Klumpke palsy', 'Upper trunk (C5–C6) — Erb palsy', 'Ulnar nerve', 'Radial nerve'],
        'Sudden UPWARD traction on the arm tears the lower trunk: Klumpke palsy. (In babies: upward force on the arm during delivery.)',
        { 'Upper trunk (C5–C6) — Erb palsy': 'Erb affects the shoulder and elbow, not the hand.', 'Ulnar nerve': 'Ulnar claws only the ring and little fingers; here ALL fingers claw — the median-supplied intrinsics are lost too.', 'Radial nerve': 'Wrist drop.' }),
      Q('muscle', 'lumbricals12', ['lumbricals12', 'biceps', 'deltoid', 'extensorDigitorum'],
        'All the intrinsics — lumbricals, interossei, thenar and hypothenar — are C8–T1. Without the lumbricals the MCPs extend and the IPs flex: a claw.',
        { biceps: 'C5–C6.', deltoid: 'C5–C6.', extensorDigitorum: 'Radial; it is what pulls the MCPs into extension unopposed.' }),
      Q('sign', 'totalClaw', ['totalClaw', 'ulnarClaw', 'waitersTip', 'apeHand'],
        'A total claw hand.'),
    ],
  },
  {
    id: 'pancoast', region: 'upper', lesion: { node: 'LT', level: 'Lower trunk (C8–T1)', muscles: ['palmarInterossei', 'dorsalInterossei', 'hypothenar', 'apb'] },
    title: 'A smoker’s shoulder pain',
    vignette: 'A 64-year-old smoker has months of shoulder pain radiating down the inner arm, wasting of the small hand muscles, and a drooping left eyelid with a small pupil.',
    chain: [
      Q('level', 'Lower trunk (C8–T1) — Pancoast tumour', ['Lower trunk (C8–T1) — Pancoast tumour', 'Upper trunk (C5–C6) — Erb palsy', 'Ulnar nerve', 'Long thoracic nerve'],
        'An apical lung tumour (Pancoast) invades the lower trunk and the sympathetic chain beside it.',
        { 'Upper trunk (C5–C6) — Erb palsy': 'The upper trunk is far from the lung apex, and would spare the hand.', 'Ulnar nerve': 'A distal ulnar lesion could not explain the eye.', 'Long thoracic nerve': 'Winged scapula only.' }),
      Q('sign', 'horner', ['horner', 'winged', 'waitersTip', 'wristDrop'],
        'Horner syndrome — the tumour involves the cervical sympathetic chain (stellate ganglion). Ptosis, miosis, anhidrosis.'),
    ],
  },

  // ── Lower limb ─────────────────────────────────────────────────────────
  {
    id: 'fibular-neck', region: 'lower', lesion: { node: 'commonPeroneal' },
    title: 'Bumper injury',
    vignette: 'A pedestrian is struck on the lateral side of the knee by a car bumper; the fibular neck is fractured. Her foot slaps down when she walks, and the top of her foot is numb.',
    chain: [
      Q('nerve', 'commonPeroneal', ['commonPeroneal', 'tibial', 'femoral', 'sciatic'],
        'The common fibular nerve wraps around the neck of the fibula, just under the skin — the most commonly injured nerve in the leg.',
        { tibial: 'Tibial runs deep in the popliteal fossa and the calf; it would weaken plantarflexion.', femoral: 'Knee extension.', sciatic: 'Injured at the hip, and it would take the hamstrings too.' }),
      Q('roots', 'commonPeroneal', ['commonPeroneal', 'tibial', 'femoral', 'superiorGluteal'],
        'Common fibular: L4–S2.'),
      Q('muscle', 'tibialisAnterior', ['tibialisAnterior', 'gastrocnemius', 'tibialisPosterior', 'quadriceps'],
        'Tibialis anterior dorsiflexes the ankle; without it the foot drops. Fibularis longus is lost too, so eversion goes as well.',
        { gastrocnemius: 'Plantarflexion — tibial nerve.', tibialisPosterior: 'Inversion — tibial nerve.', quadriceps: 'Knee extension — femoral.' }),
      Q('sign', 'footDrop', ['footDrop', 'tiptoe', 'trendelenburg', 'stairs'],
        'Foot drop with a high-stepping (steppage) gait. PED — Peroneal Everts and Dorsiflexes; if injured, foot dropPED.'),
    ],
  },
  {
    id: 'injection', region: 'lower', lesion: { node: 'superiorGluteal' },
    title: 'The wrong quadrant',
    vignette: 'After an intramuscular injection into the superomedial part of her right buttock, a woman notices that when she stands on her right leg, her left hip drops.',
    chain: [
      Q('nerve', 'superiorGluteal', ['superiorGluteal', 'inferiorGluteal', 'sciatic', 'femoral'],
        'The superior gluteal nerve runs in the superomedial buttock. Inject in the SUPEROLATERAL quadrant to avoid it — and the sciatic nerve.',
        { inferiorGluteal: 'Would weaken hip extension — stairs, rising from a chair.', sciatic: 'Inferomedial, and it would weaken the leg below the knee.', femoral: 'Anterior thigh.' }),
      Q('roots', 'superiorGluteal', ['superiorGluteal', 'inferiorGluteal', 'femoral', 'pudendal'],
        'Superior gluteal: L4–S1.'),
      Q('muscle', 'gluteusMedius', ['gluteusMedius', 'gluteusMaximus', 'adductorLongus', 'hamstrings'],
        'Gluteus medius (with minimus) abducts the hip and holds the pelvis level over the standing leg.',
        { gluteusMaximus: 'Hip extension — inferior gluteal.', adductorLongus: 'Adduction — obturator.', hamstrings: 'Knee flexion — sciatic.' }),
      Q('sign', 'trendelenburg', ['trendelenburg', 'footDrop', 'stairs', 'adduction'],
        'Trendelenburg sign: standing on the affected (right) leg, the pelvis drops on the opposite (left) side. The lesion is on the side of the leg she stands on.'),
    ],
  },
  {
    id: 'hip-dislocation', region: 'lower', lesion: { node: 'sciatic' },
    title: 'Dashboard injury',
    vignette: 'A driver’s knee hits the dashboard and his hip dislocates posteriorly. Afterwards he cannot bend his knee against resistance, and has no movement at the ankle or foot.',
    chain: [
      Q('nerve', 'sciatic', ['sciatic', 'femoral', 'obturator', 'commonPeroneal'],
        'The sciatic nerve lies directly behind the hip joint, so a posterior dislocation stretches it. (The gluteal nerves can be injured too.)',
        { femoral: 'Anterior — and it would weaken knee EXTENSION.', obturator: 'Thigh adduction.', commonPeroneal: 'Would spare knee flexion and plantarflexion.' }),
      Q('roots', 'sciatic', ['sciatic', 'femoral', 'pudendal', 'superiorGluteal'],
        'Sciatic: L4–S3. It divides into the tibial and common fibular nerves above the knee.'),
      Q('muscle', 'hamstrings', ['hamstrings', 'quadriceps', 'gluteusMedius', 'iliacus'],
        'The hamstrings flex the knee — they are the sciatic nerve’s own muscles before it divides.'),
    ],
  },
  {
    id: 'stairs', region: 'lower', lesion: { node: 'inferiorGluteal' },
    title: 'Trouble on the stairs',
    vignette: 'After a posterior hip dislocation, a 40-year-old walks on the flat without difficulty but struggles to climb stairs and to stand up from a chair.',
    chain: [
      Q('nerve', 'inferiorGluteal', ['inferiorGluteal', 'superiorGluteal', 'femoral', 'obturator'],
        'The inferior gluteal nerve supplies gluteus maximus — the powerful hip extensor needed for stairs and standing up.',
        { superiorGluteal: 'Would give a Trendelenburg sign.', femoral: 'Would weaken knee extension — but she manages the flat fine.', obturator: 'Adduction.' }),
      Q('roots', 'inferiorGluteal', ['inferiorGluteal', 'superiorGluteal', 'obturator', 'tibial'],
        'Inferior gluteal: L5–S2.'),
      Q('muscle', 'gluteusMaximus', ['gluteusMaximus', 'gluteusMedius', 'quadriceps', 'iliacus'],
        'Gluteus maximus extends the hip.'),
      Q('sign', 'stairs', ['stairs', 'trendelenburg', 'footDrop', 'kneeJerk'],
        'Difficulty with stairs and rising from sitting; level walking is largely spared.'),
    ],
  },
  {
    id: 'pelvic-fracture', region: 'lower', lesion: { node: 'femoral' },
    title: 'Crushed pelvis',
    vignette: 'After a pelvic fracture, a 35-year-old’s knee gives way when he stands; he cannot straighten it against gravity and his knee jerk is absent. The front of the thigh is numb.',
    chain: [
      Q('nerve', 'femoral', ['femoral', 'obturator', 'sciatic', 'commonPeroneal'],
        'Femoral nerve: anterior thigh — injured by pelvic fractures and, iatrogenically, in pelvic and groin surgery.',
        { obturator: 'Medial thigh; adduction.', sciatic: 'Knee FLEXION.', commonPeroneal: 'Foot drop.' }),
      Q('roots', 'femoral', ['femoral', 'sciatic', 'superiorGluteal', 'pudendal'],
        'Femoral: L2–L4.'),
      Q('muscle', 'quadriceps', ['quadriceps', 'hamstrings', 'gluteusMaximus', 'gastrocnemius'],
        'Quadriceps femoris extends the knee.'),
      Q('sign', 'kneeJerk', ['kneeJerk', 'ankleJerk', 'footDrop', 'trendelenburg'],
        'The patellar reflex (L4) is lost.'),
    ],
  },
  {
    id: 'obturator', region: 'lower', lesion: { node: 'obturator' },
    title: 'After pelvic surgery',
    vignette: 'Following a pelvic lymph node dissection, a 60-year-old cannot squeeze her knees together, and the inner thigh is numb.',
    chain: [
      Q('nerve', 'obturator', ['obturator', 'femoral', 'superiorGluteal', 'pudendal'],
        'The obturator nerve runs along the lateral pelvic wall into the obturator canal — at risk in pelvic surgery.',
        { femoral: 'Anterior thigh; knee extension.', superiorGluteal: 'Hip ABduction.', pudendal: 'Perineum.' }),
      Q('roots', 'obturator', ['obturator', 'pudendal', 'tibial', 'inferiorGluteal'],
        'Obturator: L2–L4 — the same roots as the femoral nerve, a different path.'),
      Q('muscle', 'adductorLongus', ['adductorLongus', 'gluteusMedius', 'sartorius', 'quadriceps'],
        'The medial compartment — adductors and gracilis.'),
      Q('sign', 'adduction', ['adduction', 'trendelenburg', 'kneeJerk', 'footDrop'],
        'Weak adduction with medial thigh numbness.'),
    ],
  },
  {
    id: 'baker-cyst', region: 'lower', lesion: { node: 'tibial' },
    title: 'Behind the knee',
    vignette: 'A large Baker cyst compresses the back of a 55-year-old’s knee. She cannot push her foot down like pressing a pedal, cannot curl her toes, and the sole of her foot is numb.',
    chain: [
      Q('nerve', 'tibial', ['tibial', 'commonPeroneal', 'femoral', 'deepPeroneal'],
        'The tibial nerve runs down the middle of the popliteal fossa — compressed by a Baker cyst. Distally it is caught in the tarsal tunnel.',
        { commonPeroneal: 'Runs laterally, round the fibular neck — foot drop.', femoral: 'Anterior thigh.', deepPeroneal: 'Dorsiflexion.' }),
      Q('roots', 'tibial', ['tibial', 'deepPeroneal', 'femoral', 'inferiorGluteal'],
        'Tibial: L4–S3.'),
      Q('muscle', 'gastrocnemius', ['gastrocnemius', 'tibialisAnterior', 'fibularisLongus', 'quadriceps'],
        'Gastrocnemius and soleus plantarflex; tibialis posterior inverts.'),
      Q('sign', 'tiptoe', ['tiptoe', 'footDrop', 'stairs', 'trendelenburg'],
        'TIP — Tibial Inverts and Plantarflexes; if injured, can’t stand on TIPtoes.'),
    ],
  },
  {
    id: 'childbirth', region: 'lower', lesion: { node: 'pudendal' },
    title: 'After a long labour',
    vignette: 'After a prolonged second stage of labour, a woman has numbness of the perineum and some faecal incontinence.',
    chain: [
      Q('nerve', 'pudendal', ['pudendal', 'obturator', 'inferiorGluteal', 'sciatic'],
        'The pudendal nerve is stretched during childbirth. For a pudendal block, the needle is aimed at the ischial spine.',
        { obturator: 'Medial thigh.', inferiorGluteal: 'Gluteus maximus.', sciatic: 'The leg.' }),
      Q('roots', 'pudendal', ['pudendal', 'femoral', 'superiorGluteal', 'tibial'],
        'Pudendal: S2–S4 — "S2, 3, 4 keep the poo off the floor."'),
      Q('sign', 'incontinence', ['incontinence', 'trendelenburg', 'adduction', 'footDrop'],
        'Perineal numbness with faecal or urinary incontinence.'),
    ],
  },
];

// ── Disc herniations: a root, not a nerve ─────────────────────────────────
export const DISC_CASES = [
  {
    id: 'disc-l5', region: 'lower', lesion: { node: 'L5', level: 'L5 root' },
    title: 'Lifting a heavy box',
    vignette: 'After lifting a heavy box, a 42-year-old has back pain shooting down the leg. Straight-leg raise is positive. His great toe is weak to extend and the top of his foot is numb.',
    chain: [
      Q('level', 'L4–L5 disc compressing the L5 root', ['L4–L5 disc compressing the L5 root', 'L5–S1 disc compressing the S1 root', 'L3–L4 disc compressing the L4 root', 'Common fibular nerve at the fibular neck'],
        'A paramedian herniation compresses the root BELOW the disc: L4–L5 → L5, the most common level.',
        { 'L5–S1 disc compressing the S1 root': 'S1 would weaken plantarflexion and lose the ankle jerk.', 'L3–L4 disc compressing the L4 root': 'L4 would weaken dorsiflexion and lose the knee jerk.', 'Common fibular nerve at the fibular neck': 'A fibular nerve lesion causes no back pain or positive straight-leg raise.' }),
      Q('muscle', 'ehl', ['ehl', 'gastrocnemius', 'quadriceps', 'gluteusMaximus'],
        'Extensor hallucis longus — great toe extension is the L5 myotome.'),
    ],
  },
  {
    id: 'disc-s1', region: 'lower', lesion: { node: 'S1', level: 'S1 root' },
    title: 'The missing ankle jerk',
    vignette: 'A 50-year-old has sciatica down the back of the leg into the lateral foot. He cannot stand on tiptoe on that side and his ankle jerk is absent.',
    chain: [
      Q('level', 'L5–S1 disc compressing the S1 root', ['L5–S1 disc compressing the S1 root', 'L4–L5 disc compressing the L5 root', 'Tibial nerve at the tarsal tunnel', 'L3–L4 disc compressing the L4 root'],
        'L5–S1 herniation compresses S1.',
        { 'L4–L5 disc compressing the L5 root': 'L5 spares the ankle jerk and weakens great toe extension.', 'Tibial nerve at the tarsal tunnel': 'A tarsal tunnel lesion would not abolish the ankle jerk or cause sciatica.', 'L3–L4 disc compressing the L4 root': 'L4 abolishes the KNEE jerk.' }),
      Q('sign', 'ankleJerk', ['ankleJerk', 'kneeJerk', 'footDrop', 'trendelenburg'],
        'The Achilles reflex is S1: "S1, 2 buckle my shoe."'),
    ],
  },
];

// ── Drills: generated from the tables ─────────────────────────────────────
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = (arr, n, not) => shuffle(arr.filter(x => !not.includes(x))).slice(0, n);

/** "Which nerve supplies X?" — distractors from the same limb. */
export function muscleDrill(muscleId) {
  const m = MUSCLES[muscleId];
  const region = NERVES[m.nerve].region;
  const others = Object.keys(NERVES).filter(n => NERVES[n].region === region && n !== m.nerve && !NERVES[n].muscles.includes(muscleId));
  return {
    id: `drill-${muscleId}`, kind: 'drill', region, title: m.name, focusNerve: m.nerve,
    vignette: `${m.name}: ${m.action.charAt(0).toLowerCase()}${m.action.slice(1)}.`,
    chain: [
      Q('nerve', m.nerve, shuffle([m.nerve, ...pick(others, 3, [m.nerve])]), `${m.name} — ${NERVES[m.nerve].name.toLowerCase()} (${rootsLabel(NERVES[m.nerve].roots)}).`),
    ],
  };
}

/** "What does X do?" */
export function actionDrill(muscleId) {
  const m = MUSCLES[muscleId];
  const region = NERVES[m.nerve].region;
  // Distinct actions only: teres minor and infraspinatus both externally
  // rotate, and two identical options would make the question unanswerable.
  const seen = new Set([m.action]);
  const others = shuffle(Object.keys(MUSCLES).filter(k => k !== muscleId && NERVES[MUSCLES[k].nerve].region === region))
    .filter(k => { if (seen.has(MUSCLES[k].action)) return false; seen.add(MUSCLES[k].action); return true; });
  return {
    id: `act-${muscleId}`, kind: 'drill', region, title: m.name, focusNerve: m.nerve,
    vignette: `What does ${m.name.toLowerCase()} do?`,
    chain: [Q('action', muscleId, shuffle([muscleId, ...pick(others, 3, [muscleId])]), `${m.name}: ${m.action}.${m.test ? ` Tested by: ${m.test}.` : ''}`)],
  };
}

export function reflexDrill(r) {
  const roots = shuffle([r.root, ...pick(['C5', 'C6', 'C7', 'C8', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2'].filter(x => x !== r.root), 3, [r.root])]);
  return {
    id: `reflex-${r.id}`, kind: 'root', title: r.name, rootFocus: r.root,
    vignette: `Which root does the ${r.name.toLowerCase()} test?`,
    chain: [Q('root', r.root, roots, `${r.name}: ${r.root}.${r.hint ? ` (${r.hint}.)` : ''}`)],
  };
}

export function myotomeDrill(m) {
  const pool = MYOTOMES.map(x => x.root).filter(x => x !== m.root);
  return {
    id: `myo-${m.root}`, kind: 'root', title: m.movement, rootFocus: m.root,
    vignette: `Weakness of ${m.movement.charAt(0).toLowerCase()}${m.movement.slice(1)} points to which root?`,
    chain: [Q('root', m.root, shuffle([m.root, ...pick(pool, 3, [m.root])]), `${m.movement}: ${m.root} — a key myotome.`)],
  };
}

export function dermatomeDrill(d) {
  const pool = DERMATOMES.map(x => x.root).filter(x => x !== d.root);
  return {
    id: `derm-${d.root}`, kind: 'root', title: d.landmark, rootFocus: d.root,
    vignette: `Which dermatome covers the ${d.landmark.toLowerCase()}?`,
    chain: [Q('root', d.root, shuffle([d.root, ...pick(pool, 3, [d.root])]), `${d.landmark}: ${d.root}.${d.hint ? ` (${d.hint}.)` : ''}`)],
  };
}

export const SETS = {
  injuries: { label: 'Nerve injuries', build: () => shuffle([...INJURY_CASES, ...DISC_CASES]) },
  muscles: { label: 'Muscles & actions', build: () => shuffle(Object.keys(MUSCLES).flatMap(k => (Math.random() < 0.5 ? [muscleDrill(k)] : [actionDrill(k)]))) },
  roots: { label: 'Reflexes, myotomes & dermatomes', build: () => shuffle([...REFLEXES.map(reflexDrill), ...MYOTOMES.map(myotomeDrill), ...DERMATOMES.map(dermatomeDrill)]) },
  all: {
    label: 'Everything',
    build: () => {
      const inj = shuffle([...INJURY_CASES, ...DISC_CASES]).slice(0, 5);
      const mus = shuffle(Object.keys(MUSCLES)).slice(0, 3).map(k => (Math.random() < 0.5 ? muscleDrill(k) : actionDrill(k)));
      const roots = shuffle([...REFLEXES.map(reflexDrill), ...MYOTOMES.map(myotomeDrill), ...DERMATOMES.map(dermatomeDrill)]).slice(0, 2);
      return shuffle([...inj, ...mus, ...roots]);
    },
  },
};

/** How each kind of answer is shown. */
export function optionLabel(kind, key) {
  if (kind === 'nerve') return NERVES[key]?.name || key;
  if (kind === 'roots') return rootsLabel(NERVES[key]?.roots || []);
  if (kind === 'muscle') return MUSCLES[key]?.name || key;
  if (kind === 'action') return MUSCLES[key]?.action || key;
  if (kind === 'sign') return SIGNS[key] ? `${SIGNS[key].icon} ${SIGNS[key].name}` : key;
  return key;   // 'level', 'root' — already words
}
