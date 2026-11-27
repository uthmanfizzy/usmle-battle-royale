'use strict';

// Inner Circle · Endocrinology · Endocrine drugs (notes pp. 314-315).
// Row: [topic, page, stem, [correct, wrong x4], explanation, take-home].

module.exports = [
  ['Thionamide toxicity', 314,
    "A woman on methimazole for 6 weeks has a fever of 39 C and a sore throat. What is the next step?",
    ['Stop methimazole; check the WBC count', 'Start antibiotics and continue methimazole', 'Switch to propylthiouracil today', 'Do a throat swab and wait for the result', 'Reduce the methimazole dose by half'],
    "Fever and sore throat on a thionamide suggest ==agranulocytosis, a rare but dangerous side effect==. The drug is stopped and the white cell count is checked straight away. A count below 1,000 means permanent discontinuation, and PTU cannot be used instead because the reaction occurs with both drugs. Routine counts are not cost-effective, so patients must be told to report these symptoms.",
    "Fever and sore throat on PTU or methimazole: stop it and check the WBC."],
  ['Thionamide toxicity', 314,
    "A man on propylthiouracil has a sore throat and fever. His total white cell count is 6,200/mm3 with a normal granulocyte count. What does this suggest?",
    ['The drug is probably not the cause', 'He has agranulocytosis and must stop', 'He must stop the drug for life', 'He has PTU liver failure', 'He needs a bone marrow biopsy'],
    "A white cell count ==above about 1,500/mm3 makes antithyroid drug toxicity an unlikely cause== of the fever and sore throat, so another cause, such as a viral infection, is sought. Agranulocytosis shows a very low granulocyte count.",
    "A normal white cell count rules out thionamide agranulocytosis."],
  ['Levothyroxine interactions', 315,
    "A woman's TSH has risen since she started taking an iron supplement with her levothyroxine every morning. What is the best advice?",
    ['Take them 4 hours apart', 'Double the levothyroxine dose permanently', 'Switch to liothyronine tablets instead', 'Stop the iron supplement for good', 'Take both together with food'],
    "==Iron, calcium, aluminum antacids, PPIs, sucralfate and bile acid binders such as cholestyramine reduce levothyroxine absorption==. Separating the doses by about 4 hours is usually enough. Levothyroxine is best taken on an empty stomach.",
    "Iron, calcium and PPIs block levothyroxine absorption: separate them."],
  ['Levothyroxine interactions', 315,
    "A woman on levothyroxine starts oral estrogen therapy. Her TSH rises. Why?",
    ['Estrogen raises TBG', 'Estrogen speeds up thyroxine breakdown', 'Estrogen blocks levothyroxine absorption', 'Estrogen suppresses TSH receptors', 'Estrogen causes autoimmune thyroiditis'],
    "==Oral estrogen, tamoxifen, raloxifene, heroin and methadone raise thyroxine-binding globulin==, so more hormone is bound and less is free, and the levothyroxine dose often needs to go up. Androgens, glucocorticoids and slow-release niacin do the opposite and lower TBG.",
    "Oral estrogen raises TBG and levothyroxine needs."],
  ['Levothyroxine interactions', 315,
    "A man on levothyroxine is started on rifampin for tuberculosis. What happens to his thyroid hormone needs?",
    ['They rise; it speeds thyroxine breakdown', 'They fall, because rifampin blocks TSH', 'No change, as rifampin does not interact', 'They fall, because rifampin raises TBG', 'They rise, because rifampin causes thyroiditis'],
    "==Rifampin, phenytoin and carbamazepine induce liver enzymes that break down thyroid hormone faster==, so a higher levothyroxine dose is often needed. TSH should be checked a few weeks after starting or stopping one of these drugs.",
    "Enzyme inducers raise levothyroxine needs."],
];
