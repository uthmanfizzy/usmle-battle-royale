/**
 * Injury Theatre — the scenes.
 *
 * Each scene plays in three acts, beat by beat:
 *   mechanism     the injury happening, with its overlay
 *   presentation  the resting posture it leaves behind
 *   attempts      the patient tries movements: what the lesion has taken
 *                 fails (a short try, a struggle, then it falls back — ✗),
 *                 what it has spared succeeds (✓)
 *
 * A beat: { cap, ms, pose?, overlay?, inset?, insetState?, struggle?, result? }
 * `pose` is MERGED into the running pose, so a beat only says what moves.
 * `inset` opens a close-up ('hand' | 'foot' | 'back') beside the body.
 *
 * Which movements fail is the anatomy, stated in the caption that shows it:
 * Erb (C5–C6) takes deltoid, supraspinatus, infraspinatus and biceps and
 * leaves the hand; Klumpke (C8–T1) takes the intrinsic hand muscles and
 * leaves the shoulder and elbow; and so on. Content follows First Aid.
 */

const N = { abd: 8, elbow: 0, wrist: 0, pron: false, hand: 'open', head: 0, foot: 0, deltoidFlat: false };
const HAND_N = { index: 0, middle: 0, ring: 0, little: 0, spread: false, thumb: 'rest', thenarWasted: false, hypothenarWasted: false };

export const SCENES = [
  {
    id: 'erb', baby: true, title: 'Erb palsy',
    setting: 'Delivery suite',
    answer: 'Upper trunk (C5–C6) — Erb palsy',
    options: {
      'Upper trunk (C5–C6) — Erb palsy': null,
      'Lower trunk (C8–T1) — Klumpke palsy': 'Klumpke follows UPWARD traction on the arm and wrecks the hand — here the hand is the one thing that works.',
      'Axillary nerve': 'The axillary nerve alone would weaken abduction but leave lateral rotation (infraspinatus) and elbow flexion intact.',
      'Radial nerve': 'Radial palsy gives wrist drop with a normal shoulder and biceps.',
    },
    acts: {
      mechanism: [
        { cap: 'A difficult delivery: the baby’s shoulder is stuck behind the pubic bone (shoulder dystocia).', pose: N, ms: 2600 },
        { cap: 'To free it, the head is pulled hard SIDEWAYS — away from the shoulder.', pose: { head: -30 }, overlay: 'delivery', ms: 3000 },
        { cap: 'The angle between neck and shoulder is forced open: the UPPER trunk of the brachial plexus (C5–C6) stretches and tears.', overlay: 'delivery', ms: 3400 },
      ],
      presentation: [
        { cap: 'The arm now hangs in the “waiter’s tip”: ADDUCTED, INTERNALLY rotated, elbow EXTENDED, forearm PRONATED, wrist FLEXED.', pose: { head: 0, abd: -6, wrist: 38, pron: true }, ms: 4200 },
      ],
      attempts: [
        { cap: 'Tries to lift the arm out to the side — shoulder ABDUCTION (deltoid, supraspinatus)…', pose: { abd: 16 }, struggle: true, ms: 1600 },
        { cap: '…it barely leaves the side, then drops. Deltoid (axillary, C5–6) and supraspinatus (C5–6) are lost.', pose: { abd: -6 }, result: 'fail', ms: 2600 },
        { cap: 'Tries to turn the arm OUTWARD — lateral rotation (infraspinatus, teres minor)…', pose: { pron: false }, struggle: true, ms: 1500 },
        { cap: '…it rolls straight back in. Infraspinatus (suprascapular, C5–6) is lost — the arm stays internally rotated.', pose: { pron: true }, result: 'fail', ms: 2600 },
        { cap: 'Tries to BEND the elbow (biceps — musculocutaneous, C5–6)…', pose: { elbow: 20 }, struggle: true, ms: 1500 },
        { cap: '…it cannot. The elbow stays straight and the forearm pronated (biceps is also the main supinator).', pose: { elbow: 0 }, result: 'fail', ms: 2600 },
        { cap: 'Grips with the hand (C8–T1)…', pose: { hand: 'fist' }, inset: 'hand', insetState: { index: 0.9, middle: 0.9, ring: 0.9, little: 0.9, thumb: 'oppose', profile: 'fist' }, ms: 1800 },
        { cap: '…a strong grip. The hand is spared: only the upper trunk was torn.', result: 'ok', ms: 2600 },
      ],
    },
    teach: {
      roots: 'C5–C6 (upper trunk)',
      lost: ['Deltoid & supraspinatus — abduction', 'Infraspinatus — lateral rotation', 'Biceps — elbow flexion & supination'],
      sign: 'Waiter’s tip; asymmetric Moro reflex in a newborn',
      key: 'LATERAL traction on the neck (shoulder dystocia in babies; a fall onto the shoulder in adults).',
    },
  },

  {
    id: 'klumpke', frame: 'tall', title: 'Klumpke palsy',
    setting: 'A fall from a tree',
    answer: 'Lower trunk (C8–T1) — Klumpke palsy',
    options: {
      'Lower trunk (C8–T1) — Klumpke palsy': null,
      'Upper trunk (C5–C6) — Erb palsy': 'Erb takes the shoulder and elbow and spares the hand — the opposite of this.',
      'Ulnar nerve': 'The ulnar nerve alone claws only the ring and little fingers. Here ALL the fingers claw — the median-supplied lumbricals are gone too.',
      'Median nerve': 'Median injury gives an ape hand or the hand of benediction, not a claw of all four fingers.',
    },
    acts: {
      mechanism: [
        { cap: 'Falling from a tree, he grabs a branch to stop himself.', pose: { ...N, abd: 150, hand: 'fist' }, overlay: 'upward', ms: 2800 },
        { cap: 'His whole body weight wrenches the arm UPWARD.', pose: { head: 8 }, overlay: 'upward', ms: 2600 },
        { cap: 'Upward traction tears the LOWER trunk (C8–T1) — the roots of the small muscles of the hand. (In a baby: an upward pull on the arm during delivery.)', overlay: 'upward', ms: 3600 },
      ],
      presentation: [
        { cap: 'The arm hangs normally — but the hand is a TOTAL CLAW: knuckles (MCP) hyperextended, finger joints (IP) flexed, small hand muscles wasted.', pose: { abd: 8, head: 0, hand: 'claw' }, inset: 'hand', insetState: { ...HAND_N, index: 0.72, middle: 0.72, ring: 0.78, little: 0.78, thenarWasted: true, hypothenarWasted: true, profile: 'claw' }, ms: 4400 },
      ],
      attempts: [
        { cap: 'Lifts the arm out to the side…', pose: { abd: 85 }, ms: 1600 },
        { cap: '…easily. The deltoid and supraspinatus (C5–6) are intact.', result: 'ok', ms: 2000 },
        { cap: 'Bends the elbow…', pose: { abd: 8, elbow: 105 }, ms: 1600 },
        { cap: '…no problem. Biceps (C5–6) works.', result: 'ok', ms: 2000 },
        { cap: 'Tries to straighten the fingers (lumbricals extend the IP joints)…', pose: { elbow: 0 }, inset: 'hand', insetState: { index: 0.45, middle: 0.45, ring: 0.5, little: 0.5, profile: 'try' }, struggle: true, ms: 1500 },
        { cap: '…they curl straight back. All four lumbricals (C8–T1) are lost.', inset: 'hand', insetState: { index: 0.72, middle: 0.72, ring: 0.78, little: 0.78, profile: 'claw' }, result: 'fail', ms: 2600 },
        { cap: 'Tries to SPREAD the fingers (dorsal interossei)…', inset: 'hand', insetState: { spread: true, index: 0.6, middle: 0.6, ring: 0.65, little: 0.65 }, struggle: true, ms: 1400 },
        { cap: '…they fall together. The interossei (ulnar, C8–T1) are lost.', inset: 'hand', insetState: { spread: false, index: 0.72, middle: 0.72, ring: 0.78, little: 0.78 }, result: 'fail', ms: 2600 },
      ],
    },
    teach: {
      roots: 'C8–T1 (lower trunk)',
      lost: ['Lumbricals — flex MCP, extend IP', 'Interossei — spread and close the fingers', 'Thenar & hypothenar muscles'],
      sign: 'Total claw hand; Horner syndrome if T1 is torn near the spinal cord',
      key: 'UPWARD traction on the arm (grabbing a branch; delivery with the arm pulled up). A Pancoast tumour can do the same slowly.',
    },
  },

  {
    id: 'radial', title: 'Radial nerve palsy',
    setting: 'A bad fall',
    answer: 'Radial nerve — mid-shaft humerus',
    options: {
      'Radial nerve — mid-shaft humerus': null,
      'Axillary nerve — surgical neck of humerus': 'The axillary nerve would cost shoulder abduction, not wrist extension.',
      'Median nerve — supracondylar fracture': 'Median injury affects the thumb and finger flexors, not the wrist extensors.',
      'Ulnar nerve — medial epicondyle': 'Ulnar injury affects the intrinsic hand muscles; the wrist would extend.',
    },
    acts: {
      mechanism: [
        { cap: 'He falls hard onto the side of his arm.', pose: { ...N, abd: 22 }, ms: 2200 },
        { cap: 'The humerus snaps MID-SHAFT — exactly where the radial nerve winds round it in the spiral groove.', overlay: 'humerus', ms: 3600 },
      ],
      presentation: [
        { cap: 'WRIST DROP: the wrist and fingers hang flexed and cannot be lifted.', pose: { abd: 8, wrist: 52, hand: 'open' }, ms: 3600 },
      ],
      attempts: [
        { cap: 'Tries to cock the wrist back (extensor carpi radialis — radial)…', pose: { wrist: 36 }, struggle: true, ms: 1500 },
        { cap: '…it falls straight back down. The wrist extensors are lost.', pose: { wrist: 52 }, result: 'fail', ms: 2400 },
        { cap: 'Tries to straighten the fingers at the knuckles (extensor digitorum — radial)…', inset: 'hand', insetState: { ...HAND_N, index: 0.55, middle: 0.55, ring: 0.55, little: 0.55, profile: 'drop' }, struggle: true, ms: 1600 },
        { cap: '…they stay bent at the knuckles. The finger extensors are lost.', inset: 'hand', insetState: { index: 0.45, middle: 0.45, ring: 0.45, little: 0.45 }, result: 'fail', ms: 2400 },
        { cap: 'Bends, then straightens the elbow (triceps)…', inset: null, pose: { elbow: 80 }, ms: 1400 },
        { cap: '…straightens fine. The branches to triceps leave ABOVE the spiral groove, so a mid-shaft fracture usually spares it.', pose: { elbow: 0 }, result: 'ok', ms: 2800 },
      ],
    },
    teach: {
      roots: 'C5–T1 (posterior cord)',
      lost: ['Wrist extensors', 'Finger extensors (extensor digitorum)', 'Brachioradialis'],
      sign: 'Wrist drop; numb first dorsal web space',
      key: 'Mid-shaft humerus fracture, “Saturday night palsy”, crutches in the axilla (which also take triceps).',
    },
  },

  {
    id: 'axillary', frame: 'tall', title: 'Axillary nerve injury',
    setting: 'A rugby tackle',
    answer: 'Axillary nerve — anterior shoulder dislocation',
    options: {
      'Axillary nerve — anterior shoulder dislocation': null,
      'Upper trunk (C5–C6) — Erb palsy': 'Erb would also take biceps and lateral rotation — this elbow bends normally.',
      'Long thoracic nerve': 'Long thoracic palsy wings the scapula; the deltoid is normal.',
      'Suprascapular nerve': 'Suprascapular injury weakens the first 15° of abduction and lateral rotation, without deltoid wasting or a numb badge.',
    },
    acts: {
      mechanism: [
        { cap: 'In a tackle his arm is forced up and back — abducted and externally rotated.', pose: { ...N, abd: 95, elbow: -30 }, ms: 2600 },
        { cap: 'The humeral head levers out FORWARD — an anterior dislocation — stretching the axillary nerve round the surgical neck.', overlay: 'dislocation', ms: 3400 },
      ],
      presentation: [
        { cap: 'After reduction: a FLATTENED shoulder as the deltoid wastes, and a numb patch over it — the “regimental badge”.', pose: { abd: 6, elbow: 0, deltoidFlat: true }, ms: 3800 },
      ],
      attempts: [
        { cap: 'Tries to lift the arm out to the side…', pose: { abd: 22 }, struggle: true, ms: 1700 },
        { cap: '…supraspinatus manages the first ~15°, then it stalls. The deltoid (axillary, C5–6) is lost.', pose: { abd: 14 }, result: 'fail', ms: 2600 },
        { cap: 'Bends the elbow…', pose: { abd: 6, elbow: 100 }, ms: 1500 },
        { cap: '…fine. Biceps (musculocutaneous) is untouched.', result: 'ok', ms: 2000 },
        { cap: 'Grips…', pose: { elbow: 0, hand: 'fist' }, ms: 1300 },
        { cap: '…normal. The hand is fine.', result: 'ok', ms: 1800 },
      ],
    },
    teach: {
      roots: 'C5–C6 (posterior cord)',
      lost: ['Deltoid — abduction beyond 15°', 'Teres minor — lateral rotation (weak)'],
      sign: 'Flattened deltoid; numb “regimental badge” over the lateral shoulder',
      key: 'Anterior shoulder dislocation or a fracture of the SURGICAL neck of the humerus.',
    },
  },

  {
    id: 'median', baby: true, title: 'Median nerve — supracondylar fracture',
    setting: 'A fall in the playground',
    answer: 'Median nerve — supracondylar humerus fracture',
    options: {
      'Median nerve — supracondylar humerus fracture': null,
      'Median nerve — carpal tunnel': 'Carpal tunnel spares the long finger flexors, so the index and middle fingers WOULD bend into a fist.',
      'Ulnar nerve — medial epicondyle': 'Ulnar injury stops the ring and little fingers flexing — the opposite pair.',
      'Radial nerve — mid-shaft humerus': 'That would give wrist drop.',
    },
    acts: {
      mechanism: [
        { cap: 'A child falls onto an outstretched hand.', pose: { ...N, abd: 40, elbow: -10 }, ms: 2400 },
        { cap: 'The humerus breaks just above the elbow — a SUPRACONDYLAR fracture — trapping the median nerve.', overlay: 'foosh', ms: 3400 },
      ],
      presentation: [
        { cap: 'At rest the hand looks almost normal — the giveaway comes when the child uses it.', pose: { abd: 8, elbow: 0 }, inset: 'hand', insetState: { ...HAND_N }, ms: 3200 },
      ],
      attempts: [
        { cap: 'Tries to make a FIST…', pose: { hand: 'bened' }, inset: 'hand', insetState: { index: 0.15, middle: 0.15, ring: 0.85, little: 0.85 }, struggle: true, ms: 1800 },
        { cap: '…the ring and little fingers curl, but the index and middle stay straight: the HAND OF BENEDICTION. FDS and the lateral half of FDP (median) are lost.', result: 'fail', ms: 3200 },
        { cap: 'Tries to touch the thumb to the little finger (opposition)…', pose: { hand: 'open' }, inset: 'hand', insetState: { index: 0, middle: 0, ring: 0, little: 0, thumb: 'froment' }, struggle: true, ms: 1600 },
        { cap: '…the thumb cannot swing across the palm. Opponens pollicis (median) is lost — in time, an “ape hand”.', inset: 'hand', insetState: { thumb: 'rest', thenarWasted: true }, result: 'fail', ms: 2800 },
        { cap: 'Spreads the fingers…', inset: 'hand', insetState: { spread: true }, ms: 1400 },
        { cap: '…normally. The interossei are ulnar — untouched.', result: 'ok', ms: 2200 },
      ],
    },
    teach: {
      roots: 'C5–T1 (lateral + medial cords)',
      lost: ['FDS and lateral FDP — flexion of index & middle', 'Thenar muscles — opposition', 'Lateral two lumbricals'],
      sign: 'Hand of benediction (on making a fist); ape hand',
      key: 'PROXIMAL median injury (supracondylar fracture). A distal lesion (carpal tunnel) spares the long flexors.',
    },
  },

  {
    id: 'ulnar', title: 'Ulnar nerve — hook of hamate',
    setting: 'A fall onto the hand',
    answer: 'Ulnar nerve — hook of hamate (distal)',
    options: {
      'Ulnar nerve — hook of hamate (distal)': null,
      'Lower trunk (C8–T1) — Klumpke palsy': 'Klumpke claws ALL four fingers; here only the ring and little.',
      'Median nerve — carpal tunnel': 'Median injury takes opposition — here the thumb still opposes.',
      'Radial nerve — mid-shaft humerus': 'That would give wrist drop.',
    },
    acts: {
      mechanism: [
        { cap: 'He lands on the heel of his hand…', pose: { ...N, abd: 30 }, ms: 2200 },
        { cap: '…fracturing the HOOK OF THE HAMATE — right beside the ulnar nerve in Guyon’s canal. (Long-distance cyclists press on the same spot.)', overlay: 'hamate', ms: 3400 },
      ],
      presentation: [
        { cap: 'An ULNAR CLAW: the ring and little fingers curl, knuckles hyperextended; the hypothenar eminence wastes.', pose: { abd: 8, hand: 'ulnar' }, inset: 'hand', insetState: { ...HAND_N, ring: 0.75, little: 0.8, hypothenarWasted: true, profile: 'claw' }, ms: 4000 },
      ],
      attempts: [
        { cap: 'Tries to spread the fingers (dorsal interossei — ulnar)…', inset: 'hand', insetState: { spread: true, index: 0, middle: 0 }, struggle: true, ms: 1500 },
        { cap: '…they drift back together. The interossei are lost.', inset: 'hand', insetState: { spread: false }, result: 'fail', ms: 2400 },
        { cap: 'Holds a sheet of paper between thumb and index finger…', inset: 'hand', insetState: { thumb: 'froment' }, struggle: true, ms: 1600 },
        { cap: '…the thumb tip bends to grip it: FROMENT’S SIGN. Adductor pollicis (ulnar) is lost, so flexor pollicis longus (median) takes over.', result: 'fail', ms: 3000 },
        { cap: 'Touches thumb to little finger (opposition — median)…', inset: 'hand', insetState: { thumb: 'oppose' }, ms: 1600 },
        { cap: '…fine. The median-supplied thenar muscles work.', result: 'ok', ms: 2200 },
      ],
    },
    teach: {
      roots: 'C8–T1 (medial cord)',
      lost: ['Interossei — spreading and closing the fingers', 'Medial two lumbricals — ring & little', 'Adductor pollicis', 'Hypothenar muscles'],
      sign: 'Ulnar claw (ring & little); Froment sign',
      key: 'A DISTAL ulnar lesion claws more than a proximal one (the “ulnar paradox”): FDP to the ring and little fingers still works and pulls them in.',
    },
  },

  {
    id: 'peroneal', title: 'Common fibular (peroneal) nerve',
    setting: 'Hit by a car',
    answer: 'Common fibular nerve — fibular neck',
    options: {
      'Common fibular nerve — fibular neck': null,
      'Tibial nerve': 'Tibial injury takes plantarflexion and inversion — he CAN stand on his toes.',
      'L5 radiculopathy': 'L5 root injury also weakens hip abduction, and is not caused by a blow to the knee.',
      'Femoral nerve': 'Femoral injury weakens knee extension, not the ankle.',
    },
    acts: {
      mechanism: [
        { cap: 'A car bumper strikes the outside of his knee.', pose: N, overlay: 'bumper', ms: 2600 },
        { cap: 'The FIBULAR NECK fractures — the common fibular nerve wraps right around it.', overlay: 'bumper', ms: 3200 },
      ],
      presentation: [
        { cap: 'FOOT DROP: the foot hangs plantarflexed and inverted.', pose: { foot: 22 }, inset: 'foot', insetState: { angle: 30 }, ms: 3600 },
      ],
      attempts: [
        { cap: 'Tries to pull the foot UP (dorsiflexion — tibialis anterior, deep fibular)…', inset: 'foot', insetState: { angle: 18 }, struggle: true, ms: 1500 },
        { cap: '…it flops back down. Dorsiflexion is lost.', inset: 'foot', insetState: { angle: 30 }, result: 'fail', ms: 2400 },
        { cap: 'Walks across the room…', inset: 'foot', insetState: { angle: 30, steppage: true }, ms: 2400 },
        { cap: '…lifting the knee high so the toes clear the floor: a STEPPAGE gait, the foot slapping down.', result: 'fail', ms: 2800 },
        { cap: 'Stands on tiptoe (plantarflexion — gastrocnemius, tibial nerve)…', inset: 'foot', insetState: { angle: 42, steppage: false }, ms: 1600 },
        { cap: '…no problem. The tibial nerve is fine.', result: 'ok', ms: 2200 },
      ],
    },
    teach: {
      roots: 'L4–S2',
      lost: ['Tibialis anterior — dorsiflexion (deep fibular)', 'Fibularis longus & brevis — eversion (superficial fibular)'],
      sign: 'Foot drop, steppage gait; numb dorsum of the foot',
      key: 'Trauma or compression at the lateral FIBULAR NECK — a fracture, a tight cast, crossing the legs. “PED”: Peroneal Everts and Dorsiflexes; injured → foot DROPped.',
    },
  },

  {
    id: 'longthoracic', frame: 'tall', title: 'Long thoracic nerve',
    setting: 'After breast surgery',
    answer: 'Long thoracic nerve — serratus anterior',
    options: {
      'Long thoracic nerve — serratus anterior': null,
      'Axillary nerve': 'Axillary injury weakens abduction with a flat deltoid — the scapula would sit flat.',
      'Accessory nerve (CN XI) — trapezius': 'Trapezius palsy causes shoulder drop and a mild LATERAL wing, not a medial-border wing on pushing.',
      'Upper trunk (C5–C6) — Erb palsy': 'Erb would take the deltoid, infraspinatus and biceps as well.',
    },
    acts: {
      mechanism: [
        { cap: 'During a mastectomy, the lymph nodes of the axilla are cleared.', pose: N, overlay: 'surgery', ms: 2800 },
        { cap: 'The long thoracic nerve runs down the lateral chest wall right there — and is cut.', overlay: 'surgery', ms: 3200 },
      ],
      presentation: [
        { cap: 'From the back, at rest, the shoulder blades look nearly normal.', pose: { abd: 8 }, inset: 'back', insetState: { wing: false, pushing: false }, ms: 3000 },
      ],
      attempts: [
        { cap: 'Pushes against a wall…', inset: 'back', insetState: { pushing: true, wing: true }, struggle: true, ms: 2000 },
        { cap: '…the medial border of the shoulder blade lifts off the chest: a WINGED SCAPULA. Serratus anterior (C5–C7) is lost.', result: 'fail', ms: 3200 },
        { cap: 'Tries to raise the arm above the head…', inset: null, pose: { abd: 95 }, struggle: true, ms: 1800 },
        { cap: '…stalls near 90°. Serratus is needed to rotate the scapula upward for the rest of the way.', pose: { abd: 90 }, result: 'fail', ms: 2800 },
        { cap: 'Bends the elbow…', pose: { abd: 8, elbow: 100 }, ms: 1500 },
        { cap: '…normally.', result: 'ok', ms: 1800 },
      ],
    },
    teach: {
      roots: 'C5–C7',
      lost: ['Serratus anterior — holds the scapula to the chest, rotates it upward'],
      sign: 'Winged scapula (medial border), worse on pushing; cannot abduct above the horizontal',
      key: 'Mastectomy / axillary node clearance, a stab wound to the lateral chest, heavy backpacks.',
    },
  },
];

export const ACT_ORDER = ['mechanism', 'presentation', 'attempts'];
export const ACT_LABEL = { mechanism: 'The injury', presentation: 'The presentation', attempts: 'The attempts' };
