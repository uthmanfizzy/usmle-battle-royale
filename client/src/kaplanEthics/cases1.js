/**
 * Kaplan 100 HY Ethics — case bank, part 1 (dockets 1–6).
 *
 * ORIGINAL wording. Each case is a new scenario written for this app that
 * teaches the same rule as one of the user's Kaplan "100 Cases" practice
 * questions (`ref` = that question's number, for the user's own
 * cross-reference). No stem, option or explanation is copied from the book —
 * the repo is public.
 *
 *   file   the case file (vignette)
 *   ask    the question put to you
 *   opts   motions; the FIRST is correct (shuffled at runtime). Every wrong
 *          option carries `why`, the reason it fails.
 *   rule   the precedent: the one-line rule the case teaches
 *   pearl  one more high-yield point around the same rule
 */

const C = [];
const add = (docket, c) => C.push({ docket, ...c });

// ── 1. Autonomy & Capacity ──────────────────────────────────────────────────
add('capacity', { id: 'cap1', ref: 37, title: 'The man who just said no',
  file: 'A 49-year-old man with a lifelong intellectual disability lives on his own, holds a part-time job stacking shelves and pays his own rent. You explain a screening colonoscopy in plain words and he repeats the risks and benefits back to you. He declines: "I don\'t want it."',
  ask: 'What should you do?',
  opts: [
    { t: 'Accept his refusal and do not schedule the colonoscopy.' },
    { t: 'Ask his sister to sign the consent instead.', why: 'He has capacity for this decision; a relative cannot overrule a capable adult.' },
    { t: 'Ask a court to order the screening.', why: 'Courts are for disputes about capacity or disagreement — there is neither here.' },
    { t: 'Schedule it anyway, as screening is clearly in his interest.', why: 'Benefit does not replace consent. Doing it would be battery.' },
  ],
  rule: 'Capacity is decision-specific: an intellectual disability does not remove the right to refuse a procedure he understands.',
  pearl: 'The bar to refuse care is lower than the bar to manage finances — someone may lack one and keep the other.' });

add('capacity', { id: 'cap2', ref: 41, title: 'Fever, confusion, no one to ask',
  file: 'A 29-year-old courier arrives febrile, stiff-necked and disoriented, swinging at anyone who approaches. CT is normal and he needs a lumbar puncture and IV antibiotics now. Two colleagues brought him; his family cannot be reached.',
  ask: 'What is the best next step?',
  opts: [
    { t: 'Sedate him, then do the LP and give antibiotics.' },
    { t: 'Have his colleagues sign the consent form.', why: 'Co-workers have no standing as surrogates.' },
    { t: 'Draw blood cultures only and wait for his family.', why: 'Meningitis cannot wait, and cultures alone are not enough to manage it.' },
    { t: 'Order an MRI of the brain before doing anything else.', why: 'An MRI delays treatment and does not diagnose meningitis.' },
  ],
  rule: 'Emergency + no capacity + no surrogate available → treat in the patient\'s best interest; consent is implied.',
  pearl: 'Delirium from an organic cause (infection, hypoxia, sodium, drugs) removes capacity for as long as it lasts.' });

add('capacity', { id: 'cap3', ref: 83, title: 'The crash that was not an accident',
  file: 'A 71-year-old man drove into a bridge pillar on purpose and is bleeding internally. In the trauma bay he refuses the operation that would stop the bleeding, saying he is ready to die. A month ago he declined surgery for a new cancer.',
  ask: 'What should you do about the operation to stop the bleeding?',
  opts: [
    { t: 'Operate now to control the bleeding.' },
    { t: 'Respect his stated wish and withhold surgery.', why: 'An active suicide attempt means his judgment is impaired — this refusal is not a capable one.' },
    { t: 'Seek a court order before operating.', why: 'There is no time, and no court order is needed to treat a suicidal emergency.' },
    { t: 'Ask his children whether to operate.', why: 'He is not a patient whose surrogate should decide; the suicide attempt itself is the issue.' },
  ],
  rule: 'A patient actively trying to end his life is presumed to lack capacity — treat the emergency.',
  pearl: 'His earlier, calm refusal of cancer surgery is a separate decision and still stands.' });

add('capacity', { id: 'cap4', ref: 88, title: 'Curable, and still no',
  file: 'A 44-year-old teacher has aggressive lymphoma. Chemotherapy offers a strong chance of remission; without it she will likely die within months. She understands this fully, shows no sign of depression, and declines treatment.',
  ask: 'What is the most appropriate action?',
  opts: [
    { t: 'Respect her decision and do not give chemotherapy.' },
    { t: 'Ask for a psychiatric evaluation before accepting it.', why: 'Nothing suggests impaired capacity; a refusal alone is not a reason to test it.' },
    { t: 'Ask a court to appoint a guardian for her.', why: 'A capable adult needs no guardian.' },
    { t: 'Offer radiotherapy in place of chemotherapy.', why: 'Swapping treatments sidesteps the real point: she has the right to refuse.' },
  ],
  rule: 'A capable adult may refuse any treatment — even a curative one — for any reason or none.',
  pearl: 'Make sure the refusal is informed: document that she understood the consequences.' });

add('capacity', { id: 'cap5', ref: 89, title: 'Pneumonia and a darker reason',
  file: 'A 76-year-old man with advancing Parkinson disease has pneumonia. Over recent months he has stopped enjoying anything, wakes at 4 a.m., and has lost weight. He refuses antibiotics and asks only for comfort care so that he can die.',
  ask: 'What should you do?',
  opts: [
    { t: 'Ask psychiatry to assess his capacity.' },
    { t: 'Comply with his request for comfort care only.', why: 'Untreated major depression may be driving this refusal; capacity must be checked first.' },
    { t: 'Ask his family what he would want.', why: 'He is awake and can speak for himself; the question is whether depression clouds his judgment.' },
    { t: 'Sedate him and give the antibiotics.', why: 'Forcing treatment before capacity is assessed is not justified.' },
  ],
  rule: 'When depression may be distorting a refusal, assess capacity before honoring it.',
  pearl: 'Psychiatry is for equivocal cases. If capacity is obviously present or absent, any physician can decide.' });

add('capacity', { id: 'cap6', ref: 44, title: 'No to the caesarean',
  file: 'At 39 weeks a 31-year-old has obstructed labour, and her team recommends a caesarean section. She understands that the baby may not survive a vaginal delivery, and declines surgery.',
  ask: 'What should you do?',
  opts: [
    { t: 'Respect her refusal; no caesarean.' },
    { t: 'Ask the baby\'s father to consent instead.', why: 'The father cannot consent to surgery on her body.' },
    { t: 'Seek a court order to perform the surgery.', why: 'A capable pregnant woman\'s refusal is not overridden for the fetus.' },
    { t: 'Sedate her and perform the operation.', why: 'Operating on a capable patient against her will is battery.' },
  ],
  rule: 'A pregnant woman with capacity can refuse treatment, even when the fetus will be harmed.',
  pearl: 'In reproductive questions, decisions follow the mother\'s autonomy — the fetus does not have rights that override it.' });

add('capacity', { id: 'cap7', ref: 101, title: 'Bleeding at 22 weeks',
  file: 'A 36-year-old mother of two, 22 weeks pregnant, has a life-threatening upper GI bleed. She is a Jehovah\'s Witness, fully alert, and refuses any blood transfusion.',
  ask: 'What should you do?',
  opts: [
    { t: 'Respect her refusal; no transfusion.' },
    { t: 'Transfuse her, because the fetus also depends on it.', why: 'Pregnancy does not suspend a capable woman\'s right to refuse.' },
    { t: 'Obtain a court order for transfusion.', why: 'Courts do not override a competent adult\'s informed refusal.' },
    { t: 'Ask the baby\'s father to consent to the transfusion.', why: 'He has no authority over her treatment.' },
  ],
  rule: 'A capable pregnant adult may refuse blood, even if she or the fetus may die.',
  pearl: 'Offer every acceptable alternative (iron, erythropoietin, cell salvage) and keep revisiting her wishes.' });

add('capacity', { id: 'cap8', ref: 35, title: 'The vitamin that wasn\'t',
  file: 'A long-standing patient of yours is clearly depressed but refuses any antidepressant. Without telling him, you prescribe an SSRI and call it a vitamin. Three months later he feels far better.',
  ask: 'How should your action be judged?',
  opts: [
    { t: 'Wrong — you treated him without his consent.' },
    { t: 'Right — it helped him and caused no side effects.', why: 'A good outcome does not make treatment without consent acceptable.' },
    { t: 'Acceptable if you tell him now that he is better.', why: 'Telling him afterwards does not undo the deception.' },
    { t: 'Wrong only because you are not a psychiatrist.', why: 'Any physician may treat depression. The problem is the deception.' },
  ],
  rule: 'Beneficence never outranks autonomy. Deceiving a patient into treatment violates consent.',
  pearl: 'Even a urinalysis or an ECG needs the patient\'s agreement.' });

add('capacity', { id: 'cap9', ref: 98, title: 'Done with dialysis',
  file: 'A 51-year-old man with end-stage renal disease asks you to stop his dialysis. He understands that he will die within days to weeks. He is not depressed or encephalopathic.',
  ask: 'What should you tell him?',
  opts: [
    { t: '"I disagree, but I will stop the dialysis."' },
    { t: '"We started dialysis, so now we have to continue it."', why: 'Withdrawing a treatment is ethically the same as never starting it.' },
    { t: '"Stopping would be physician-assisted suicide."', why: 'Stopping a treatment the patient no longer wants is withdrawal, not suicide.' },
    { t: '"I need a court order before I can stop."', why: 'A capable patient\'s request needs no court.' },
  ],
  rule: 'A capable patient may stop any treatment, including life-sustaining treatment, at any time.',
  pearl: 'There is no ethical difference between withholding a treatment and withdrawing it.' });

// ── 2. Informed Consent ─────────────────────────────────────────────────────
add('consent', { id: 'con1', ref: 38, title: 'The other ear',
  file: 'A patient consented to surgery on his left ear. Under anaesthesia, the surgeon finds that the right ear needs surgery far more.',
  ask: 'What should the surgeon do?',
  opts: [
    { t: 'Finish, wake him, and seek consent for the other ear.' },
    { t: 'Operate on the right ear, since it clearly needs it more.', why: 'Consent covers the procedure agreed to, not whatever seems more needed.' },
    { t: 'Operate on both ears while he is already asleep.', why: 'Convenience does not create consent for a second procedure.' },
    { t: 'Get a second surgeon\'s opinion, then do the right ear.', why: 'A colleague\'s agreement is not the patient\'s consent.' },
  ],
  rule: 'Consent is specific to each procedure; a new, non-emergency procedure needs new consent.',
  pearl: 'Only a true intra-operative emergency allows going beyond the consent given.' });

add('consent', { id: 'con2', ref: 39, title: 'A trial gone wrong',
  file: 'A Portuguese-speaking patient was enrolled in a drug trial. The consent was taken in English by a coordinator who did not understand the study. Nobody explained the risks, and she was harmed by the study drug. She sues.',
  ask: 'Why will the lawsuit succeed?',
  opts: [
    { t: 'All of the failures listed here together.' },
    { t: 'Only because the risks were never explained to her.', why: 'That is one failure, but not the only one in this case.' },
    { t: 'Only because she was harmed by the drug.', why: 'Harm alone is not the issue; the consent was invalid in several ways.' },
    { t: 'Only because of the language barrier.', why: 'Language was one of several defects.' },
  ],
  rule: 'Valid consent: the risks explained, in a language the patient understands, by someone who understands the procedure.',
  pearl: 'Use a professional interpreter, never a family member, for consent.' });

add('consent', { id: 'con3', ref: 45, title: 'What nobody mentioned',
  file: 'A 60-year-old had a robotic prostatectomy after being told its risks in detail, and he had no complications. Later he reads about radiotherapy and active surveillance, which were never discussed. He sues over consent.',
  ask: 'What is the most likely outcome?',
  opts: [
    { t: 'He wins — no alternatives were discussed.' },
    { t: 'He loses — he had no complications.', why: 'Consent is about the information given, not about whether harm followed.' },
    { t: 'He loses — every risk of surgery was explained.', why: 'Explaining the risks is only part of consent; the alternatives must be covered too.' },
    { t: 'He wins — radiotherapy is the better treatment.', why: 'Neither option is superior; the failure is that he was never told about them.' },
  ],
  rule: 'Informed consent covers the diagnosis, the procedure, its risks and benefits, AND the reasonable alternatives (including no treatment).',
  pearl: 'Document the alternatives you discussed. It protects the patient and you.' });

add('consent', { id: 'con4', ref: 46, title: 'Consent by phone',
  file: 'A man needs urgent bypass surgery after a failed angioplasty. His wife is his health-care proxy but is on a flight connection in another city.',
  ask: 'How do you obtain consent?',
  opts: [
    { t: 'Take phone consent with a second witness.' },
    { t: 'Wait for her to arrive and sign in person.', why: 'Delay is unnecessary. Telephone consent is valid.' },
    { t: 'Have her name a local guardian until she arrives.', why: 'The proxy can decide herself over the phone.' },
    { t: 'Phone consent is valid only for minor procedures.', why: 'Telephone consent is valid for major surgery as well.' },
  ],
  rule: 'Telephone consent is valid when the surrogate\'s identity is confirmed and a second staff member witnesses it.',
  pearl: 'Make sure the person on the phone really is the authorized surrogate.' });

add('consent', { id: 'con5', ref: 51, title: 'The transplant she chose',
  file: 'In an IRB-approved trial, you clearly explained that a stem-cell transplant had the best chance of cure but also the highest early mortality, compared with standard chemotherapy. She understood, chose the transplant, and died of complications. Her husband sues for wrongful death.',
  ask: 'What is the likely outcome?',
  opts: [
    { t: 'He loses — she was fully informed of both options.' },
    { t: 'He wins — chemotherapy carried less risk of death.', why: 'A capable patient may choose the riskier option once properly informed.' },
    { t: 'He loses — because the trial had IRB approval.', why: 'IRB approval does not protect you from a defective consent; the full consent does.' },
    { t: 'He wins — the family was never informed.', why: 'The consent belongs to the patient, not the family.' },
  ],
  rule: 'A properly informed choice protects the physician, even when the outcome is bad.',
  pearl: 'A bad outcome is not malpractice. Malpractice requires a breach of the standard of care that caused the harm.' });

add('consent', { id: 'con6', ref: 52, title: 'The refusal nobody explained',
  file: 'After thrombolysis, a man with an ongoing STEMI is offered angioplasty. You list the procedure\'s risks but do not explain what is likely to happen without it. He declines out of fear and dies; his estate sues.',
  ask: 'What is the most likely outcome?',
  opts: [
    { t: 'You lose — he was not told the danger of refusing.' },
    { t: 'You win — he refused the treatment you offered.', why: 'A refusal is only valid if it is informed.' },
    { t: 'You win — you explained the risks of angioplasty.', why: 'Half the information is not informed refusal.' },
    { t: 'You lose — patients may not refuse lifesaving care.', why: 'Capable patients can refuse lifesaving care. The failure was in the information you gave him.' },
  ],
  rule: 'Informed refusal matters as much as informed consent: explain the consequences of declining.',
  pearl: 'Document the refusal and the consequences you explained.' });

add('consent', { id: 'con7', ref: 40, title: 'Only a slogan',
  file: 'An unconscious man is brought in after a motorcycle crash, bleeding heavily and hypotensive. No one knows him. His T-shirt reads "Proud Jehovah\'s Witness."',
  ask: 'What should you do about transfusion?',
  opts: [
    { t: 'Transfuse him.' },
    { t: 'Give IV fluids only, out of respect for the shirt.', why: 'A slogan on clothing is not a valid advance directive.' },
    { t: 'Wait for him to wake up and decide.', why: 'He will die before that; this is an emergency.' },
    { t: 'Seek a court order first.', why: 'Emergency consent is implied; no court is needed.' },
  ],
  rule: 'In an emergency with no valid directive or surrogate, consent is implied — treat.',
  pearl: 'A signed card or document stating his wishes WOULD be respected; a T-shirt is not one.' });

add('consent', { id: 'con8', ref: 36, title: 'A refusal made while lucid',
  file: 'A 70-year-old woman with breast cancer, fully alert, refused surgery both verbally and in writing. Weeks later she develops delirium and loses capacity. Her husband and daughter now ask you to operate.',
  ask: 'What is most appropriate?',
  opts: [
    { t: 'Don\'t operate; her earlier refusal stands.' },
    { t: 'Operate now that the family has consented.', why: 'Her earlier wishes, expressed while capable, bind her surrogates.' },
    { t: 'Operate if the family puts the request in writing.', why: 'A written request from the family cannot override her decision.' },
    { t: 'Ask the family to obtain a court order.', why: 'There is no genuine ambiguity to resolve; her wishes are clear.' },
  ],
  rule: 'Decisions made while capable remain valid after capacity is lost.',
  pearl: 'A surrogate is a messenger for the patient\'s wishes, not a second decision-maker.' });

// ── 3. Proxies & Surrogates ─────────────────────────────────────────────────
add('surrogates', { id: 'sur1', ref: 42, title: 'The proxy who disagrees',
  file: 'A Jehovah\'s Witness with aplastic anaemia is now delirious with neutropenic fever. While capable, he told you and his brother — his proxy — that he refuses blood even if he dies. His brother thinks the rule is absurd and wants him transfused.',
  ask: 'What should the brother do?',
  opts: [
    { t: 'Decline consent for the transfusion.' },
    { t: 'Consent, since he believes it is right.', why: 'A proxy\'s job is to carry out the patient\'s wishes, not his own.' },
    { t: 'Let the physician decide for him.', why: 'The patient\'s known wishes decide, not the doctor.' },
    { t: 'Ask their parents to make the call.', why: 'There is a designated proxy and clear wishes; parents have no role here.' },
  ],
  rule: 'Substituted judgment: the proxy decides as the patient would have, even when the proxy disagrees.',
  pearl: 'Hierarchy: patient\'s own wishes → written directive → proxy → family → physician / ethics committee / court.' });

add('surrogates', { id: 'sur2', ref: 43, title: 'Never able to say',
  file: 'A 38-year-old man has lived since birth in a care home with a profound intellectual disability and has never been able to express preferences. His parents are dead and a court-appointed guardian oversees him. He now has an incurable leukaemia; chemotherapy is burdensome and offers little.',
  ask: 'How should treatment be decided?',
  opts: [
    { t: 'The guardian decides on best interests.' },
    { t: 'Start chemotherapy, as it is the default.', why: 'There is no default; someone must weigh the burdens against the benefits.' },
    { t: 'Convene an expert panel to choose therapy.', why: 'The guardian is the legal decision-maker.' },
    { t: 'Arrange a stem-cell transplant.', why: 'An aggressive option with little benefit, and it skips the decision-maker.' },
  ],
  rule: 'For a never-competent patient there are no prior wishes, so the surrogate uses the best-interests standard.',
  pearl: 'Substituted judgment (what would they want?) applies only if the patient once had capacity.' });

add('surrogates', { id: 'sur3', ref: 48, title: 'The husband wants blood',
  file: 'A Jehovah\'s Witness woman refused blood while capable and is now unconscious and bleeding. Her husband, who is not a Witness, asks you to transfuse her.',
  ask: 'What should you tell him?',
  opts: [
    { t: '"I cannot give her the blood."' },
    { t: '"I will transfuse her if you are her proxy."', why: 'A proxy still cannot override her clearly stated wishes.' },
    { t: '"I will transfuse her now that she is unconscious."', why: 'Losing consciousness does not cancel a capable refusal.' },
    { t: '"I will honor your wish and give the blood."', why: 'His wishes are not hers.' },
  ],
  rule: 'A capable refusal stands after the patient loses consciousness; no one can reverse it for them.',
  pearl: 'Spouses get no special power to overrule the patient\'s own expressed wishes.' });

add('surrogates', { id: 'sur4', ref: 90, title: 'A loophole in the directive',
  file: 'A man with a progressive, incurable dementia had told you many times he never wants to be kept alive by artificial feeding. His proxy form says "no nasogastric tube and no gastrostomy." His proxy now asks for a jejunostomy tube, since it is "not on the list."',
  ask: 'What should you do?',
  opts: [
    { t: 'Place no feeding tube of any kind.' },
    { t: 'Place the jejunostomy, as the form allows it.', why: 'His wish was no artificial nutrition at all; the list gave examples, not loopholes.' },
    { t: 'Tell the proxy to seek a court order for the tube.', why: 'His wishes are clear enough to follow directly.' },
    { t: 'Transfer care to a doctor willing to place it.', why: 'That would help someone go against the patient\'s known wishes.' },
  ],
  rule: 'Follow the intent of the patient\'s wishes; a proxy cannot use a technicality to override them.',
  pearl: 'Artificial nutrition and hydration are medical treatments and can be refused like any other.' });

add('surrogates', { id: 'sur5', ref: 91, title: 'Partner versus mother',
  file: 'A 33-year-old man with a head injury is deteriorating and may need intubation. His partner is his named health-care agent and reports that the patient said, aloud and in writing, never to be put on a ventilator. His mother insists on intubation.',
  ask: 'What should you do?',
  opts: [
    { t: 'Follow the proxy; do not intubate.' },
    { t: 'Follow his mother and intubate.', why: 'The designated proxy outranks a parent.' },
    { t: 'Intubate for 48 hours and reassess.', why: 'A "trial" of what he refused still goes against his wishes.' },
    { t: 'Poll the rest of the family.', why: 'The family\'s opinion does not outrank a designated proxy and a written wish.' },
  ],
  rule: 'A designated proxy outranks every family member, whether or not they are related to the patient.',
  pearl: 'The ethics committee is for genuine ambiguity, not for clear, documented wishes.' });

add('surrogates', { id: 'sur6', ref: 92, title: 'A family split down the middle',
  file: 'An 80-year-old widower is in a persistent vegetative state after a cardiac arrest. He named no proxy and left no written wishes. His daughter and nephew want full treatment; his son and brother want everything stopped. Both sides say they know his wishes.',
  ask: 'What is the best first step?',
  opts: [
    { t: 'Hold a family meeting to seek consensus.' },
    { t: 'Decide yourself, in his best interest.', why: 'Physicians don\'t decide unilaterally while the family can still reach agreement.' },
    { t: 'Stop all treatment.', why: 'There is no clear evidence of his wishes yet.' },
    { t: 'Seek a court-appointed guardian.', why: 'Courts come last, after discussion and ethics review fail.' },
  ],
  rule: 'When surrogates disagree, start with discussion; mediation comes before committees and courts.',
  pearl: 'On USMLE, "discuss / meet / encourage dialogue" is usually the right first move.' });

add('surrogates', { id: 'sur7', ref: 93, title: 'No consensus, no directive',
  file: 'A 90-year-old woman with end-stage dementia can no longer communicate or eat. There is no proxy and no directive. Her many relatives have met repeatedly and still cannot agree on what she would have wanted.',
  ask: 'What should you do about her care?',
  opts: [
    { t: 'Refer the case to the ethics committee.' },
    { t: 'Follow the wishes of the eldest child.', why: 'Seniority confers no special authority without a legal hierarchy.' },
    { t: 'Do what you think is best.', why: 'The physician is not the default decision-maker while there is a dispute.' },
    { t: 'Ask the hospital administrator to consent.', why: 'Administrators have no role as surrogates.' },
  ],
  rule: 'If family discussion fails, the next step is an ethics committee; courts come only after that.',
  pearl: 'Order: family meeting → ethics committee → court.' });

add('surrogates', { id: 'sur8', ref: 95, title: 'A clear living will',
  file: 'After a massive stroke, a 79-year-old woman is ventilator-dependent with no hope of recovery and cannot communicate. Her husband brings a living will she signed: "No ventilator if there is no hope of recovery." They never discussed it.',
  ask: 'What should you do?',
  opts: [
    { t: 'Remove the ventilator, per the will.' },
    { t: 'Keep ventilating, since they never discussed it.', why: 'The written directive is valid without any discussion.' },
    { t: 'Seek a court order to remove it.', why: 'A clear living will needs no court.' },
    { t: 'Ask the rest of the family what they think.', why: 'The family\'s opinions do not override her written wishes.' },
  ],
  rule: 'A clear, applicable living will is followed as written.',
  pearl: 'The more specific the directive, the stronger it is.' });

add('surrogates', { id: 'sur9', ref: 99, title: 'An old, vague directive',
  file: 'A 94-year-old man with dementia is ventilated for aspiration pneumonia and has a feeding tube. An old chart contains a note: "no heroic measures, keep me comfortable." There is no proxy, family or regular physician to consult.',
  ask: 'What should you do about the ventilator and feeding tube?',
  opts: [
    { t: 'Continue both for now.' },
    { t: 'Remove both the ventilator and the feeding tube.', why: '"No heroic measures" is too vague to justify withdrawal.' },
    { t: 'Decide on your own what is best for him.', why: 'Nobody has authorized you to make that call.' },
    { t: 'Remove the feeding tube but keep the ventilator.', why: 'An arbitrary split with no basis in his wishes.' },
  ],
  rule: 'If a directive is ambiguous, keep treating until the patient\'s wishes are clear.',
  pearl: 'You can stop later once the wishes are clarified; you cannot reverse a death.' });

add('surrogates', { id: 'sur10', ref: 100, title: 'What a proxy is for',
  file: 'A medical student asks what a health-care proxy actually does.',
  ask: 'Which answer is correct?',
  opts: [
    { t: 'States and carries out the patient\'s own wishes.' },
    { t: 'Decides what the proxy thinks is best.', why: 'Best-interest judgment applies only when the patient\'s wishes are unknown.' },
    { t: 'Passes the family\'s wishes on to the doctors.', why: 'The proxy represents the patient, not the family.' },
    { t: 'Handles the patient\'s finances when capacity is lost.', why: 'That is a financial power of attorney, a separate role.' },
  ],
  rule: 'The proxy delivers the patient\'s wishes, like a messenger. He or she does not replace them.',
  pearl: 'If the patient regains capacity, the proxy\'s authority ends immediately.' });

// ── 4. Minors ───────────────────────────────────────────────────────────────
add('minors', { id: 'min1', ref: 59, title: 'Brought in by a neighbour',
  file: 'A 13-year-old girl fell off her bike and has a scalp laceration that needs stitches. She is stable. A neighbour brought her in; her parents are on their way.',
  ask: 'Which is correct?',
  opts: [
    { t: 'Wait for one parent to consent.' },
    { t: 'The neighbour can give consent.', why: 'Neighbours, aunts and family friends cannot consent for a minor.' },
    { t: 'She can consent for herself.', why: 'She is not emancipated, and stitches are not one of the exceptions for minors.' },
    { t: 'Wait until both parents agree.', why: 'One parent\'s consent is enough.' },
  ],
  rule: 'For a non-emergency, a minor needs consent from one parent or legal guardian.',
  pearl: 'In a true emergency, never delay lifesaving care to find a parent.' });

add('minors', { id: 'min2', ref: 60, title: 'A teen with discharge',
  file: 'A 15-year-old comes alone to clinic with vaginal discharge and a positive gonorrhoea test. She does not want her parents to know.',
  ask: 'What is most appropriate?',
  opts: [
    { t: 'Treat her now, confidentially.' },
    { t: 'Treat only if she agrees to tell her parents.', why: 'Minors can consent to STI care on their own.' },
    { t: 'Treat her, then inform her parents afterwards.', why: 'Telling her parents would breach her confidentiality.' },
    { t: 'Wait until a parent can be informed.', why: 'Delaying treatment risks complications and spread.' },
  ],
  rule: 'Minors may consent to STI care, contraception, prenatal care and substance-use treatment without a parent.',
  pearl: 'Confidential care for these keeps teenagers coming back instead of avoiding care.' });

add('minors', { id: 'min3', ref: 61, title: 'Father and son, same crash',
  file: 'A Jehovah\'s Witness father and his 10-year-old son are both critically injured in a crash and both need blood. The father, awake and capable, refuses blood for himself and for his son.',
  ask: 'What should you do?',
  opts: [
    { t: 'Transfuse the boy but not the father.' },
    { t: 'Transfuse neither of them.', why: 'Parents may not refuse lifesaving care for their child.' },
    { t: 'Transfuse both of them.', why: 'The capable father\'s refusal for himself must be respected.' },
    { t: 'Get a court order before transfusing the boy.', why: 'In an emergency you treat the child now; no order is needed.' },
  ],
  rule: 'An adult can refuse for himself, but a parent cannot refuse lifesaving treatment for a child.',
  pearl: 'Still ask the parents for permission, and treat the child even if they refuse.' });

add('minors', { id: 'min4', ref: 62, title: 'Pregnant at 16',
  file: 'A 16-year-old is pregnant and comes for her first prenatal visit. She asks you not to tell her parents.',
  ask: 'What should you say?',
  opts: [
    { t: '"You\'ll get your care, and it stays private."' },
    { t: '"I am sorry, but I have to tell your parents."', why: 'Prenatal care is one of the confidential exceptions for minors.' },
    { t: '"I won\'t tell your parents, but I must tell the father."', why: 'There is no duty to notify the father.' },
    { t: '"I won\'t mention it unless they ask me."', why: 'If they ask, you still may not disclose. Confidentiality does not depend on whether they ask.' },
  ],
  rule: 'Minors can consent confidentially to prenatal care.',
  pearl: 'Encourage family involvement, but do not require it.' });

add('minors', { id: 'min5', ref: 63, title: 'Appendicitis at camp',
  file: 'An 11-year-old at summer camp has acute appendicitis. Her parents cannot be reached by home phone or mobile. The camp director brought her in.',
  ask: 'What should you do?',
  opts: [
    { t: 'Perform the appendectomy.' },
    { t: 'Ask the camp director to consent.', why: 'The director has no authority to consent for her.' },
    { t: 'Do not operate until a parent consents.', why: 'Waiting risks perforation; this is an emergency.' },
    { t: 'Treat with IV antibiotics alone.', why: 'This is inadequate care, chosen only to avoid the consent question.' },
  ],
  rule: 'Emergency care for a minor proceeds without parental consent when parents are unreachable.',
  pearl: 'Keep trying to reach the parents, but do not let that delay the operation.' });

add('minors', { id: 'min6', ref: 64, title: 'Living on her own at 17',
  file: 'A 17-year-old has lived alone for a year, works full-time at a café and pays all her own bills. She wants isotretinoin for severe acne and understands its teratogenic risk.',
  ask: 'What should you tell her?',
  opts: [
    { t: '"I\'ll prescribe it as you\'ve asked."' },
    { t: '"Bring a parent and I will prescribe it."', why: 'She is emancipated, so no parent is needed.' },
    { t: '"I need your parents\' signed consent first."', why: 'Emancipated minors consent like adults.' },
    { t: '"Women your age can\'t take this medicine."', why: 'False. It is used with contraception and pregnancy testing.' },
  ],
  rule: 'An emancipated minor — self-supporting and living independently, married, in the military, or a parent — consents like an adult.',
  pearl: 'Still follow the iPLEDGE-type safeguards: two forms of contraception and pregnancy tests.' });

add('minors', { id: 'min7', ref: 78, title: 'A teenager seeking abortion',
  file: 'A 15-year-old is pregnant, has considered her options and asks for an abortion referral. Her parents do not know.',
  ask: 'What should you do first?',
  opts: [
    { t: 'Strongly encourage her to tell her parents.' },
    { t: 'Refer her without parental notification.', why: 'Notification rules vary by state; on the exam, the safe first step is to encourage her to involve her parents.' },
    { t: 'Refuse to refer her without parental consent.', why: 'Refusing to refer abandons her care.' },
    { t: 'Seek a court order declaring her emancipated.', why: 'There is no dispute requiring a court here.' },
  ],
  rule: 'On abortion in minors, encourage voluntary involvement of the parents; the laws differ from state to state.',
  pearl: 'Choose court involvement only when the case describes a real dispute.' });

add('minors', { id: 'min8', ref: 47, title: 'Parents refuse for their child',
  file: 'A 7-year-old with sickle cell disease has a stroke and needs an urgent exchange transfusion. His parents refuse on religious grounds.',
  ask: 'What should be done?',
  opts: [
    { t: 'Transfuse the child.' },
    { t: 'Honor the parents\' wishes; no transfusion.', why: 'Withholding lifesaving care from a child is a form of neglect.' },
    { t: 'Wait for a formal court hearing.', why: 'You can\'t delay an emergency for a court hearing.' },
    { t: 'Ask the child to decide for himself.', why: 'A 7-year-old cannot consent or refuse.' },
  ],
  rule: 'The state\'s interest in a child\'s life outweighs the parents\' religious refusal of lifesaving care.',
  pearl: 'Parents can only decline care that is truly futile.' });

// ── 5. Confidentiality ──────────────────────────────────────────────────────
add('confidentiality', { id: 'cnf1', ref: 3, title: 'A colleague asks',
  file: 'A radiographer with a valid hospital badge asks you how a coworker admitted overnight is doing. She says they are close friends.',
  ask: 'What is the best response?',
  opts: [
    { t: 'Decline without the patient\'s permission.' },
    { t: 'Share the details, since she is hospital staff.', why: 'Staff who are not caring for the patient have no right to the record.' },
    { t: 'Share only if she is a relative.', why: 'Relatives also need the patient\'s permission.' },
    { t: 'Have her sign a release form first.', why: 'The release must come from the patient, not the person asking.' },
  ],
  rule: 'Only the patient — or a legal exception — authorizes disclosure; being an employee or a friend does not.',
  pearl: 'Health information in the workplace can be used to discriminate against a patient.' });

add('confidentiality', { id: 'cnf2', ref: 4, title: 'Badges at the door',
  file: 'Two federal agents arrive at your clinic, show badges, and ask to see a patient\'s chart, assuring you it will help their investigation. They have no warrant or court order.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refuse without a signed release or a court order.' },
    { t: 'Give them the chart, since they are federal agents.', why: 'A badge is not legal authority over the medical record.' },
    { t: 'Read them only the relevant parts aloud.', why: 'Reading it aloud is still a disclosure.' },
    { t: 'Give them copies but keep the original.', why: 'Copies breach confidentiality just as much.' },
  ],
  rule: 'Release records only with the patient\'s signed authorization, or a court order, warrant or subpoena.',
  pearl: 'Who is asking does not change this rule.' });

add('confidentiality', { id: 'cnf3', ref: 6, title: '"Don\'t tell her"',
  file: 'A frail but alert 82-year-old is awaiting a biopsy that will probably show widespread cancer. Her loving family asks you to give the results to them first and not to tell her, "so she can enjoy the time left."',
  ask: 'What should you tell them?',
  opts: [
    { t: 'You must give her the results; she is your patient.' },
    { t: 'You will honor their wishes.', why: 'A capable patient has the right to her own diagnosis.' },
    { t: 'You will comply if they put the request in writing.', why: 'Writing it down does not give them a right they don\'t have.' },
    { t: 'Only her health-care proxy can make that decision.', why: 'A proxy acts only when the patient lacks capacity.' },
  ],
  rule: 'A capable patient is told first; the family learns only what she permits.',
  pearl: 'Ask her how much she wants to know and who she wants told. A patient may waive her right to the information, but the family cannot waive it for her.' });

add('confidentiality', { id: 'cnf4', ref: 7, title: 'A gene his children may carry',
  file: 'A divorced man is diagnosed with an autosomal dominant cancer syndrome. A reliable test can tell whether his children are affected. His ex-wife has custody, and he forbids you to tell her, threatening to sue.',
  ask: 'What should you do?',
  opts: [
    { t: 'Tell the ex-wife the children are at risk.' },
    { t: 'Respect his confidentiality and say nothing.', why: 'The children\'s safety outweighs his privacy.' },
    { t: 'Ask the health department to inform her.', why: 'Health departments notify contacts of infectious diseases, not genetic ones.' },
    { t: 'Seek a court order before telling her.', why: 'No court order is needed to protect children at risk.' },
  ],
  rule: 'Confidentiality yields when withholding information puts an identifiable third party at serious risk.',
  pearl: 'You face more liability for leaving the children unprotected than for the disclosure.' });

add('confidentiality', { id: 'cnf5', ref: 8, title: 'Afraid to be found',
  file: 'An undocumented farm worker has active TB. His household needs screening, and he fears the health department will report him to immigration.',
  ask: 'What should you tell him?',
  opts: [
    { t: '"Immigration status is never reported."' },
    { t: '"There is mandatory reporting to the government."', why: 'False. Immigration status is not reportable.' },
    { t: '"Only patients who don\'t take their medicine get reported."', why: 'Non-adherence can lead to detention for treatment, but never to an immigration report.' },
    { t: '"We will fully treat you before deportation."', why: 'Physicians are not immigration enforcers.' },
  ],
  rule: 'Immigration status is never reported. Physicians and health departments treat; they do not police.',
  pearl: 'Reporting immigration status would drive sick people away from care, and endanger the public.' });

add('confidentiality', { id: 'cnf6', ref: 22, title: 'A gene on the job form',
  file: 'A 34-year-old brings a pre-employment health form. It also asks for an APC gene test so the company can forecast future health costs.',
  ask: 'What should you do?',
  opts: [
    { t: 'Ask whether she wants it done and reported.' },
    { t: 'Perform the test and send in the result.', why: 'Testing and reporting need her own decision.' },
    { t: 'Run the test but keep the result secret.', why: 'Testing her without her choice is still not consent.' },
    { t: 'Refuse to run any test at all.', why: 'It is her right to choose; you don\'t refuse for her.' },
  ],
  rule: 'Genetic testing requires the patient\'s own informed choice, including about who receives the result.',
  pearl: 'Genetic discrimination in employment and health insurance is prohibited (GINA).' });

add('confidentiality', { id: 'cnf7', ref: 23, title: 'The employer wants her BRCA result',
  file: 'At a patient\'s request you performed BRCA testing. Her employer now writes asking for copies of any genetic tests.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refuse to release it to the employer.' },
    { t: 'Release it, as the employer has asked formally.', why: 'Employers have no right to a patient\'s genetic information.' },
    { t: 'Release it only if the result is positive.', why: 'A positive result is exactly the information that would let them discriminate.' },
    { t: 'Refer the request to the ethics committee.', why: 'This is not a dilemma; the answer is clear.' },
  ],
  rule: 'Genetic information is confidential. Employers cannot obtain it.',
  pearl: 'Without a release from the patient, the answer to any third party is no.' });

add('confidentiality', { id: 'cnf8', ref: 5, title: 'A threat in therapy',
  file: 'In a session, a man with paranoid schizophrenia tells his psychiatrist that his landlord is plotting against him and that he will kill the landlord "when the moment comes." Earlier the psychiatrist promised that everything said would stay private.',
  ask: 'What should the psychiatrist do?',
  opts: [
    { t: 'Warn both the landlord and the police.' },
    { t: 'Keep it confidential and talk him out of it.', why: 'A credible threat to an identifiable person overrides confidentiality.' },
    { t: 'Tell only the medical director.', why: 'The duty is to protect the potential victim.' },
    { t: 'Warn the landlord and say nothing to police.', why: 'The duty includes notifying law enforcement as well.' },
  ],
  rule: 'Tarasoff: a credible threat against an identifiable person creates a duty to warn the victim and notify the police.',
  pearl: 'A promise of total confidentiality never covers a threat of serious harm.' });

// ── 6. Records, Errors & Malpractice ────────────────────────────────────────
add('records', { id: 'rec1', ref: 56, title: '"Why do you want it?"',
  file: 'A patient asks the hospital for a copy of her records. The clerk refuses unless she explains why she wants them.',
  ask: 'What should you tell her?',
  opts: [
    { t: 'She needs no reason to get her records.' },
    { t: 'She can have them only for a legitimate reason.', why: 'The right of access needs no justification.' },
    { t: 'Only her doctors can access her records.', why: 'Patients have a right of access to their own records.' },
    { t: 'She must first settle any unpaid bills.', why: 'Access cannot be held hostage to payment.' },
  ],
  rule: 'Patients have a right to see and copy their own records, with no reason required.',
  pearl: 'A reasonable copying fee may be charged; refusal is never allowed.' });

add('records', { id: 'rec2', ref: 57, title: 'Who owns the chart?',
  file: 'A student asks who owns a medical record.',
  ask: 'Which statement is correct?',
  opts: [
    { t: 'Patient owns the information; provider owns the file.' },
    { t: 'The patient owns all of it.', why: 'The physical paper or electronic file belongs to the provider.' },
    { t: 'The provider owns all of it.', why: 'The information belongs to the patient, who has a right of access.' },
    { t: 'The provider owns the information; the patient owns the file.', why: 'This reverses the correct answer.' },
  ],
  rule: 'The information belongs to the patient; the record\'s medium belongs to the provider.',
  pearl: 'That is why the hospital keeps the original and gives the patient a copy.' });

add('records', { id: 'rec3', ref: 58, title: 'A number that was wrong',
  file: 'You recorded a 400 mL blood loss in a trauma patient who later died. You now realise the true loss was about 2.5 L.',
  ask: 'How do you correct the record?',
  opts: [
    { t: 'Add a new note with today\'s date and time.' },
    { t: 'Backdate a new note to the original time.', why: 'Backdating is falsification.' },
    { t: 'Remove the original page from the chart.', why: 'Removing anything from a chart destroys evidence.' },
    { t: 'Blank out the old entry with correction fluid.', why: 'An original entry is never obliterated.' },
  ],
  rule: 'Correct a record with a new, currently dated note. Never alter, erase or remove the original.',
  pearl: 'A single line through an error, still legible, plus a dated correction is acceptable.' });

add('records', { id: 'rec4', ref: 54, title: 'The missed doses',
  file: 'Halfway through a six-week IV antibiotic course for osteomyelitis, the order lapsed and you didn\'t notice for two days. The patient is fine and the drug has been restarted.',
  ask: 'What should you tell the patient?',
  opts: [
    { t: 'Apologize and tell him you missed it.' },
    { t: 'Nothing, since there was no clinical harm.', why: 'Errors are disclosed whether or not harm occurred.' },
    { t: 'That a clerical error caused a short delay.', why: 'Blaming the system for your own error is dishonest.' },
    { t: 'Ask the nurse to explain the mix-up.', why: 'The responsible physician discloses the error personally.' },
  ],
  rule: 'Disclose medical errors to the patient honestly, promptly and personally, with an apology.',
  pearl: 'Disclosure reduces lawsuits; concealment increases them.' });

add('records', { id: 'rec5', ref: 49, title: 'Illegible order, ten-fold dose',
  file: 'An intern\'s scrawled order for one drug is read as another, and the patient receives a dose far above the safe range, causing arrhythmias. The patient never finds out.',
  ask: 'Which statement is correct?',
  opts: [
    { t: 'The intern and the hospital are both liable.' },
    { t: 'No one is liable, as it was unintentional.', why: 'Negligence does not require intent.' },
    { t: 'Only the pharmacy is liable for missing it.', why: 'Responsibility is shared with whoever wrote the order.' },
    { t: 'No one is liable, as the patient never found out.', why: 'Liability does not depend on whether the patient finds out.' },
  ],
  rule: 'Malpractice = duty + breach + harm + causation. Intent and the patient\'s awareness are irrelevant.',
  pearl: 'Hospitals are vicariously liable for the trainees and staff they employ.' });

add('records', { id: 'rec6', ref: 50, title: 'What risk management does',
  file: 'A new resident asks what the hospital\'s risk management department is for.',
  ask: 'Which best describes its role?',
  opts: [
    { t: 'To limit the hospital\'s legal risk.' },
    { t: 'To act as the patient\'s advocate.', why: 'Patient advocacy is a different service.' },
    { t: 'To ensure ethical management of patients.', why: 'That is the ethics committee\'s role.' },
    { t: 'To ensure good clinical care is delivered.', why: 'That belongs to clinicians and quality improvement.' },
  ],
  rule: 'Risk management protects the institution from litigation; it is not an ethics resource.',
  pearl: 'So on ethics questions, "consult risk management" is rarely the right answer.' });

add('records', { id: 'rec7', ref: 53, title: 'The fall she never mentioned',
  file: 'A 74-year-old admitted for dehydration never tells staff that she is dizzy; nothing in her chart suggests a fall risk. Left alone in the bathroom, she faints and cuts her head. She sues for negligence.',
  ask: 'What is the most likely outcome?',
  opts: [
    { t: 'She loses: she never reported dizziness.' },
    { t: 'She wins because the nurses were negligent.', why: 'Staff cannot act on a symptom no one reported or documented.' },
    { t: 'She wins only if the injury was serious.', why: 'The size of the injury is not what decides liability.' },
    { t: 'She wins because the physician was negligent.', why: 'There was nothing for the physician to act on.' },
  ],
  rule: 'Patients must tell the team about their symptoms; no breach of duty means no malpractice.',
  pearl: 'Liability needs a duty that was breached — an unforeseeable event is not negligence.' });

add('records', { id: 'rec8', ref: 55, title: 'The attending says no',
  file: 'Your private attending refuses to start a beta-blocker for a patient with stable heart failure and no contraindication. He dismisses your question: "I\'ve practised for decades." The patient adores him.',
  ask: 'What should you do about the disagreement?',
  opts: [
    { t: 'Take the disagreement to the chief of service.' },
    { t: 'Prescribe it yourself once he has gone home.', why: 'Countermanding the attending of record is not your call.' },
    { t: 'Report him to the licensing board.', why: 'This is a clinical disagreement, not impairment or misconduct.' },
    { t: 'Do nothing, since he is the attending of record.', why: 'Patient safety means raising it through the proper channel.' },
  ],
  rule: 'Escalate a clinical disagreement up the chain of command: chief of service or department chair.',
  pearl: 'The licensing board is for impairment or dangerous incompetence, not for a single disagreement.' });

export default C;
