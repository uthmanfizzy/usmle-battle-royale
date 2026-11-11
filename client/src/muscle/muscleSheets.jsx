/**
 * Muscle Mapper — the cheat sheets shown in Guided mode.
 *
 * Each question type has a sheet that teaches the WAY to answer it, laid
 * out as rows rather than prose (the same pattern as the ABG Reader's rule
 * cards): where a nerve breaks, which compartment a nerve owns, which muscle
 * does a movement, which sign belongs to which nerve, which roots feed which
 * part of the plexus, and the rhymes for reflexes. They are the high-yield
 * tables, so reading them IS revising.
 *
 * Kept to the limb in question — an upper-limb case shows upper-limb rows.
 */

const SITE = {
  upper: [
    ['Surgical neck of humerus', 'Axillary'],
    ['Midshaft humerus (radial groove)', 'Radial'],
    ['Axilla — crutches, "Saturday night"', 'Radial (triceps too)'],
    ['Supracondylar humerus', 'Median (proximal)'],
    ['Carpal tunnel', 'Median (distal)'],
    ['Medial epicondyle', 'Ulnar (proximal)'],
    ['Hook of hamate / Guyon canal', 'Ulnar (distal)'],
    ['Axillary node dissection', 'Long thoracic'],
  ],
  lower: [
    ['Fibular neck', 'Common fibular'],
    ['Posterior hip dislocation', 'Sciatic (± gluteal nerves)'],
    ['Superomedial buttock injection', 'Superior gluteal'],
    ['Pelvic fracture', 'Femoral'],
    ['Pelvic surgery', 'Obturator'],
    ['Baker cyst / tarsal tunnel', 'Tibial'],
    ['Childbirth (stretch)', 'Pudendal'],
  ],
};

const COMPARTMENT = {
  upper: [
    ['Anterior arm (flexors)', 'Musculocutaneous'],
    ['Posterior arm & forearm (extensors)', 'Radial'],
    ['Anterior forearm (flexors, pronators)', 'Median — except FCU & medial FDP (ulnar)'],
    ['Thenar muscles + lumbricals 1–2 (LOAF)', 'Median'],
    ['All other hand intrinsics', 'Ulnar'],
    ['Deltoid, teres minor', 'Axillary'],
    ['Supraspinatus, infraspinatus', 'Suprascapular'],
  ],
  lower: [
    ['Anterior thigh (quadriceps)', 'Femoral'],
    ['Medial thigh (adductors)', 'Obturator'],
    ['Posterior thigh (hamstrings)', 'Sciatic'],
    ['Anterior leg (dorsiflexors)', 'Deep fibular'],
    ['Lateral leg (evertors)', 'Superficial fibular'],
    ['Posterior leg (plantarflexors)', 'Tibial'],
    ['Gluteus medius & minimus', 'Superior gluteal'],
    ['Gluteus maximus', 'Inferior gluteal'],
  ],
};

const MOVEMENT = {
  upper: [
    ['Abduction 0–15°', 'Supraspinatus'],
    ['Abduction 15–90°', 'Deltoid'],
    ['Abduction above 90°', 'Serratus anterior (+ trapezius)'],
    ['External rotation', 'Infraspinatus, teres minor'],
    ['Internal rotation', 'Subscapularis'],
    ['Elbow flexion / extension', 'Biceps & brachialis / triceps'],
    ['Wrist & finger extension', 'Radial extensors'],
    ['Thumb opposition / adduction', 'Opponens (median) / adductor pollicis (ulnar)'],
    ['Finger ABduct / ADduct', 'Dorsal interossei (DAB) / palmar (PAD)'],
  ],
  lower: [
    ['Hip flexion', 'Iliopsoas'],
    ['Hip extension', 'Gluteus maximus'],
    ['Hip abduction', 'Gluteus medius & minimus'],
    ['Hip adduction', 'Adductors'],
    ['Knee extension / flexion', 'Quadriceps / hamstrings'],
    ['Dorsiflexion', 'Tibialis anterior'],
    ['Great toe extension', 'Extensor hallucis longus'],
    ['Plantarflexion', 'Gastrocnemius & soleus'],
    ['Eversion / inversion', 'Fibularis / tibialis posterior'],
  ],
};

const SIGN = {
  upper: [
    ['Wrist drop', 'Radial'],
    ['Hand of benediction (fist)', 'Median, proximal'],
    ['Ape hand', 'Median, distal / recurrent branch'],
    ['Ulnar claw (extending fingers)', 'Ulnar'],
    ['Froment sign', 'Ulnar (adductor pollicis)'],
    ['Winged scapula', 'Long thoracic'],
    ['Flat deltoid', 'Axillary'],
    ['Waiter’s tip', 'Upper trunk (Erb)'],
    ['Total claw ± Horner', 'Lower trunk (Klumpke / Pancoast)'],
  ],
  lower: [
    ['Foot drop, steppage gait', 'Common fibular — PED'],
    ['Can’t stand on tiptoes', 'Tibial — TIP'],
    ['Trendelenburg sign', 'Superior gluteal'],
    ['Can’t climb stairs', 'Inferior gluteal'],
    ['Absent knee jerk', 'Femoral / L4'],
    ['Absent ankle jerk', 'S1'],
  ],
};

const ROOTS = {
  upper: {
    lead: 'Follow the plexus: Roots → Trunks → Divisions → Cords → Branches.',
    rows: [
      ['Upper trunk', 'C5–C6 → axillary, suprascapular'],
      ['Lateral cord', 'C5–C7 → musculocutaneous'],
      ['Lower trunk / medial cord', 'C8–T1 → ulnar'],
      ['Posterior cord + lat/med', 'C5–T1 → radial, median'],
      ['Straight from roots', 'C5–C7 → long thoracic ("raise your wings")'],
    ],
  },
  lower: {
    lead: 'Front and inside of the thigh are lumbar; the back is sacral.',
    rows: [
      ['Femoral, obturator', 'L2–L4'],
      ['Superior gluteal', 'L4–S1'],
      ['Inferior gluteal', 'L5–S2'],
      ['Sciatic, tibial', 'L4–S3'],
      ['Common fibular', 'L4–S2'],
      ['Pudendal', 'S2–S4 — "keep the poo off the floor"'],
    ],
  },
};

const LEVEL = {
  lead: 'Trunk and root lesions name a LEVEL, not a nerve.',
  rows: [
    ['Lateral neck traction', 'Upper trunk C5–C6 — Erb, waiter’s tip'],
    ['Upward arm traction', 'Lower trunk C8–T1 — Klumpke, total claw'],
    ['Apical lung tumour', 'Lower trunk + Horner — Pancoast'],
    ['L4–L5 disc', 'L5 root: great toe weak, dorsum of foot numb'],
    ['L5–S1 disc', 'S1 root: ankle jerk gone, lateral foot numb'],
  ],
  note: 'A paramedian disc compresses the root BELOW it.',
};

const REFLEX = {
  lead: 'Count up from the ankle:',
  rows: [
    ['S1, 2', 'buckle my shoe — Achilles'],
    ['L3, 4', 'kick the door — patellar'],
    ['C5, 6', 'pick up sticks — biceps (brachioradialis C6)'],
    ['C7, 8', 'lay them straight — triceps'],
  ],
  note: 'First Aid’s single roots: biceps C5, brachioradialis C6, triceps C7, patellar L4, Achilles S1.',
};

const MYOTOME = {
  lead: 'One key movement per root:',
  rows: [
    ['C5', 'Elbow flexion'], ['C6', 'Wrist extension'], ['C7', 'Elbow extension'],
    ['C8', 'Finger flexion'], ['T1', 'Little finger abduction'],
    ['L2', 'Hip flexion'], ['L3', 'Knee extension'], ['L4', 'Dorsiflexion'],
    ['L5', 'Great toe extension'], ['S1', 'Plantarflexion'],
  ],
};

const DERMATOME = {
  lead: 'Landmarks to anchor on:',
  rows: [
    ['C6 · C7 · C8', 'Thumb · middle finger · little finger'],
    ['T4', 'Nipple — "T4 at the teat pore"'],
    ['T7', 'Xiphoid'],
    ['T10', 'Umbilicus — "belly butTEN"'],
    ['L1', 'Inguinal ligament — "IL"'],
    ['L4', 'Kneecap — "down on ALL 4s"'],
    ['L5 · S1', 'Dorsum of foot · lateral foot'],
  ],
};

/** The sheet for one question. */
export function sheetFor(kind, caseDef) {
  const region = caseDef.region || 'upper';
  if (kind === 'nerve') {
    return caseDef.kind === 'drill'
      ? { lead: 'Every compartment has its own nerve:', rows: COMPARTMENT[region] }
      : { lead: 'Match the injury SITE to the nerve that runs there:', rows: SITE[region] };
  }
  if (kind === 'roots') return ROOTS[region];
  if (kind === 'muscle' || kind === 'action') return { lead: 'Name the movement that is lost:', rows: MOVEMENT[region] };
  if (kind === 'sign') return { lead: 'Each sign belongs to one lesion:', rows: SIGN[region] };
  if (kind === 'level') return LEVEL;
  if (kind === 'root') {
    if (caseDef.id.startsWith('reflex')) return REFLEX;
    if (caseDef.id.startsWith('myo')) return MYOTOME;
    return DERMATOME;
  }
  return null;
}

export function CheatCard({ sheet }) {
  if (!sheet) return null;
  return (
    <div className="mm-sheet">
      <span className="mm-sheet-tag">Guide</span>
      <div className="mm-sheet-body">
        {sheet.lead && <p className="mm-sheet-lead">{sheet.lead}</p>}
        <ul className="mm-sheet-rows">
          {sheet.rows.map(([a, b]) => (
            <li key={a}>
              <span className="mm-sheet-a">{a}</span>
              <span className="mm-sheet-arrow" aria-hidden="true">→</span>
              <span className="mm-sheet-b">{b}</span>
            </li>
          ))}
        </ul>
        {sheet.note && <p className="mm-sheet-note">{sheet.note}</p>}
      </div>
    </div>
  );
}
