'use strict';
/**
 * Clue Ladder — Hematology, part 2: bleeding, clotting and transfusion.
 * Platelet disorders, factor deficiencies, thrombotic microangiopathies,
 * thrombophilias, heparin and transfusion reactions.
 *
 * Row: [diagnosis, [also accepted], group, [6 clues, vague → specific]]
 * Written in our own words to First Aid's facts. A clue must never name its
 * own diagnosis — run `node server/clueladder/check.js` after editing.
 */
module.exports = [
  // ── Coagulation ───────────────────────────────────────────────────────────
  ['Hemophilia A', ['factor VIII deficiency', 'classic hemophilia'], 'Coagulation', [
    'A 9-month-old boy has a large bruise on his forehead after a minor bump.',
    'Since he began crawling, his knees have swollen up several times.',
    'His mother\'s brother had a similar problem; his sisters are fine.',
    'Platelet count, bleeding time and PT are normal; PTT is long.',
    'Mixing his plasma with normal plasma corrects the PTT.',
    'The missing factor is carried and protected by von Willebrand factor; emicizumab is an option.',
  ]],
  ['Hemophilia B', ['Christmas disease', 'factor IX deficiency'], 'Coagulation', [
    'A 6-year-old boy bleeds for two days after a baby tooth is pulled.',
    'He has had bleeding into his ankle joint before.',
    'Only boys on his mother\'s side of the family are affected.',
    'PT and platelet count are normal; PTT is prolonged and corrects with mixing.',
    'Factor VIII level is normal.',
    'He is treated with factor IX concentrate.',
  ]],
  ['Hemophilia C', ['factor XI deficiency', 'Rosenthal syndrome'], 'Coagulation', [
    'A 30-year-old woman of Ashkenazi Jewish descent bleeds heavily after a tooth extraction.',
    'She has never had bleeding into her joints.',
    'Her brother and her female cousin have the same history.',
    'PT and platelets are normal; PTT is prolonged and corrects on mixing.',
    'Factor VIII and IX levels are normal.',
    'It is an autosomal recessive deficiency of factor XI.',
  ]],
  ['Acquired hemophilia', ['acquired factor VIII inhibitor', 'factor VIII inhibitor'], 'Coagulation', [
    'A 75-year-old woman with no past bleeding problems develops huge bruises on her arms and thighs.',
    'She recently had a flare of her bullous pemphigoid.',
    'Her platelet count and PT are normal.',
    'Her PTT is very long.',
    'Mixing with normal plasma does NOT correct the PTT.',
    'An autoantibody is blocking factor VIII.',
  ]],
  ['Vitamin K deficiency bleeding', ['vitamin K deficiency', 'hemorrhagic disease of the newborn'], 'Coagulation', [
    'A 5-week-old breastfed baby is brought in vomiting and very sleepy.',
    'He was born at home, and the parents declined all newborn injections.',
    'Head CT shows a brain bleed with no history of trauma.',
    'His PT is very prolonged, and his PTT is prolonged too; platelets are normal.',
    'His gut has not yet been colonized by the bacteria that make the vitamin.',
    'Factors II, VII, IX and X and proteins C and S cannot be gamma-carboxylated.',
  ]],
  ['Von Willebrand disease', ['vWD', 'von Willebrand'], 'Coagulation', [
    'A 16-year-old girl has very heavy periods since they started.',
    'She also gets frequent nosebleeds and bled a lot after her wisdom teeth came out.',
    'Her father has a similar history.',
    'Platelet count is normal, but bleeding time is long; PTT is mildly prolonged.',
    'Platelets fail to aggregate with ristocetin.',
    'Desmopressin helps by releasing the missing protein from endothelial Weibel-Palade bodies.',
  ]],
  ['Disseminated intravascular coagulation', ['DIC', 'consumptive coagulopathy'], 'Coagulation', [
    'A 45-year-old man in the ICU with gram-negative sepsis gets worse.',
    'He is now oozing blood from IV sites and his gums.',
    'His fingertips are turning dark from small-vessel clots.',
    'PT and PTT are both long, and platelets are low.',
    'Fibrinogen is low and D-dimer is very high; smear shows schistocytes.',
    'Widespread activation of clotting has used up factors and platelets.',
  ]],

  // ── Platelets ─────────────────────────────────────────────────────────────
  ['Immune thrombocytopenia', ['ITP', 'immune thrombocytopenic purpura', 'idiopathic thrombocytopenic purpura'], 'Platelets', [
    'A 5-year-old girl has new tiny red spots on her legs and bruises.',
    'She had a cold two weeks ago and is otherwise well.',
    'There is no enlarged spleen, no fever and no lymph nodes.',
    'Platelets are 12,000; hemoglobin, white cells, PT and PTT are normal.',
    'Bone marrow shows plenty of megakaryocytes.',
    'Antibodies against GpIIb/IIIa mark platelets for removal by the spleen.',
  ]],
  ['Bernard-Soulier syndrome', [], 'Platelets', [
    'A young man has bled easily from his gums and nose all his life.',
    'His parents are first cousins.',
    'His platelet count is mildly low, and his bleeding time is long.',
    'His platelets look very large on the smear.',
    'They do not aggregate with ristocetin, even when normal vWF is added.',
    'Platelets lack GpIb and cannot stick to vWF.',
  ]],
  ['Glanzmann thrombasthenia', ['Glanzmann'], 'Platelets', [
    'A girl has had nosebleeds and gum bleeding since early childhood.',
    'Her parents are related, and neither has a bleeding problem.',
    'Her platelet count and size are normal, but bleeding time is long.',
    'Her smear shows no clumping of platelets.',
    'Platelets aggregate with ristocetin, but not with ADP or collagen.',
    'Platelets lack GpIIb/IIIa, the fibrinogen receptor.',
  ]],
  ['Uremic platelet dysfunction', ['uremic bleeding', 'uremic platelet disorder'], 'Platelets', [
    'A man on dialysis has new bleeding from his gums and access site.',
    'He has missed several dialysis sessions.',
    'His BUN is very high.',
    'Platelet count, PT and PTT are all normal.',
    'His bleeding time is prolonged.',
    'Toxins that build up in kidney failure stop platelets from adhering and aggregating; desmopressin helps.',
  ]],
  ['Thrombotic thrombocytopenic purpura', ['TTP'], 'Platelets', [
    'A 35-year-old woman is brought in confused, with a fever.',
    'She has small purple spots on her legs.',
    'She is anemic, her platelets are low, and her creatinine is rising.',
    'Smear shows many schistocytes, but PT and PTT are normal.',
    'Ultra-large vWF multimers are present in her plasma.',
    'Low ADAMTS13 activity; treat urgently with plasma exchange.',
  ]],
  ['Hemolytic uremic syndrome', ['HUS'], 'Platelets', [
    'A 4-year-old boy has been sick with abdominal cramps for a week.',
    'It started after a family barbecue.',
    'His diarrhea turned bloody, then he stopped passing urine.',
    'He has anemia with schistocytes, low platelets and a high creatinine.',
    'PT and PTT are normal.',
    'Shiga toxin from E coli O157:H7 damaged his endothelium; care is supportive.',
  ]],
  ['Heparin-induced thrombocytopenia', ['HIT', 'HIT type 2'], 'Platelets', [
    'A 65-year-old man is recovering in hospital after a hip replacement.',
    'On day 7, his platelets have fallen from 250,000 to 90,000.',
    'He has developed a painful, swollen leg from a new DVT.',
    'He has been on unfractionated heparin since surgery.',
    'IgG antibodies against heparin bound to platelet factor 4 are found.',
    'Stop all heparin and switch to argatroban.',
  ]],

  // ── Thrombophilia ─────────────────────────────────────────────────────────
  ['Factor V Leiden', ['activated protein C resistance', 'APC resistance'], 'Thrombophilia', [
    'A 28-year-old woman has a DVT a few months after starting the combined pill.',
    'Her father had a pulmonary embolism at 40.',
    'She has had two pregnancy losses.',
    'PT and PTT are normal.',
    'Her plasma does not respond normally when activated protein C is added.',
    'A G-to-A point mutation gives Arg506Gln, the most common inherited thrombophilia in white populations.',
  ]],
  ['Prothrombin G20210A mutation', ['prothrombin gene mutation', 'prothrombin 20210 mutation'], 'Thrombophilia', [
    'A 30-year-old man has a DVT after a long flight.',
    'His mother had a blood clot in a brain vein.',
    'He is otherwise healthy.',
    'Protein C, protein S and antithrombin are all normal.',
    'His prothrombin levels are higher than normal.',
    'A point mutation in the 3\' untranslated region of the gene raises its production.',
  ]],
  ['Protein C deficiency', [], 'Thrombophilia', [
    'A 40-year-old woman with a new DVT was started on oral anticoagulation.',
    'She had a clot in her leg at 25.',
    'Within three days of starting warfarin, she has painful dark patches on her thighs and breasts.',
    'The patches turn into areas of dead skin.',
    'A vitamin K-dependent natural anticoagulant with a short half-life dropped first.',
    'She cannot inactivate factors Va and VIIIa well.',
  ]],
  ['Antithrombin deficiency', ['antithrombin III deficiency', 'AT III deficiency'], 'Thrombophilia', [
    'A 32-year-old man has a large DVT and a pulmonary embolism.',
    'He is started on unfractionated heparin.',
    'Even after high doses, his PTT barely changes.',
    'Before heparin, his PT, PTT and thrombin time were normal.',
    'It can also be acquired, from losing protein in the urine in nephrotic syndrome.',
    'The protein that heparin activates to block thrombin and factor Xa is low.',
  ]],

  // ── Transfusion ───────────────────────────────────────────────────────────
  ['Transfusion-related acute lung injury', ['TRALI'], 'Transfusion', [
    'A 55-year-old woman is getting plasma during surgery for a bleed.',
    'Within an hour, she becomes very short of breath.',
    'Her oxygen saturation falls, and she has a fever.',
    'Her blood pressure falls, not rises.',
    'Chest x-ray shows new bilateral infiltrates, and her heart size and filling pressures are normal.',
    'Donor antibodies activate neutrophils in the lung, causing noncardiogenic pulmonary edema.',
  ]],
  ['Transfusion-associated circulatory overload', ['TACO'], 'Transfusion', [
    'An 82-year-old man with heart failure gets three units of red cells for anemia.',
    'They are given quickly, one after another.',
    'He becomes short of breath and has to sit up.',
    'His blood pressure rises, and his neck veins are distended.',
    'He has crackles, and BNP is high; x-ray shows pulmonary edema.',
    'It is volume overload; diuretics and slower transfusion help.',
  ]],
];
