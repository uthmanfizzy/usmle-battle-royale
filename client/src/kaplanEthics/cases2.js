/**
 * Kaplan 100 HY Ethics — case bank, part 2 (dockets 7–12).
 * Same rules as cases1.js: original wording, first option correct, `ref` is
 * the matching question number in the user's Kaplan book.
 */

const C = [];
const add = (docket, c) => C.push({ docket, ...c });

// ── 7. Reporting & Public Health ────────────────────────────────────────────
add('reporting', { id: 'rep1', ref: 2, title: 'A burn with a story',
  file: 'A 4-year-old is in the ED for the fifth time this year, now with sharply outlined scald burns on both feet; the parent says he "stepped into a hot bath." The parent is furious that a social worker asked questions, and threatens to sue you.',
  ask: 'What should you do?',
  opts: [
    { t: 'Report the family to child protective services.' },
    { t: 'Treat the burn and reassure the parent.', why: 'Suspicion alone triggers the duty to report.' },
    { t: 'Warn them you will report it next time.', why: 'There is no "next time" rule; you must report now.' },
    { t: 'Ask the parent directly whether there is abuse.', why: 'A denial changes nothing — you must still report.' },
  ],
  rule: 'Reasonable suspicion of child abuse must be reported to CPS; you are protected for a good-faith report.',
  pearl: 'Only CPS or a court can remove the child; admit him only if it is medically or safety-indicated while CPS acts.' });

add('reporting', { id: 'rep2', ref: 16, title: 'Bruises at 88',
  file: 'An 88-year-old woman who lives with her grandson-in-law has bruises in different stages of healing and is frightened when he is mentioned. She asks you not to make trouble.',
  ask: 'What should you do?',
  opts: [
    { t: 'Report it to adult protective services.' },
    { t: 'Report it only if she specifically asks you to.', why: 'Elder abuse is a mandatory report in most states.' },
    { t: 'Confront the grandson-in-law yourself.', why: 'Confrontation may put her at greater risk; the job is reporting.' },
    { t: 'Move her into a care home yourself.', why: 'You have no authority to move her; APS investigates.' },
  ],
  rule: 'Suspected elder abuse is reported to adult protective services.',
  pearl: 'Elders and children are mandatory reports; competent adults experiencing partner violence are usually not.' });

add('reporting', { id: 'rep3', ref: 82, title: 'His wife hits him',
  file: 'A 45-year-old man again has bruises and a split lip. He says his wife beats him regularly and denies hitting her. When you mention reporting, he clearly declines.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'You will report it only if he consents.' },
    { t: 'You must report it as a mandatory reporter.', why: 'Partner violence against a capable adult is not a mandatory report in most states.' },
    { t: 'You will report it if it happens again.', why: 'The number of episodes does not change the rule.' },
    { t: 'You will report once you\'re sure she\'s the attacker.', why: 'Investigating who is to blame is not your role.' },
  ],
  rule: 'Intimate-partner violence against a capable adult is reported only with the patient\'s consent.',
  pearl: 'Screen privately, document, safety-plan, and offer shelters and hotlines.' });

add('reporting', { id: 'rep4', ref: 34, title: 'Still driving',
  file: 'A 78-year-old man with early dementia still drives. Last month he was told to wear his glasses for driving. You are unsure whether he is safe behind the wheel.',
  ask: 'What should you do?',
  opts: [
    { t: 'Discuss it with him; suggest alternatives.' },
    { t: 'Have his family stop him from driving.', why: 'He still has capacity; talk to him, not about him.' },
    { t: 'Report him to the police.', why: 'There is no immediate danger and no mandate to report to police.' },
    { t: 'Take his driving licence from him.', why: 'Physicians cannot revoke licences.' },
  ],
  rule: 'With uncertain driving safety, discuss it directly with the patient first; reporting rules vary by state.',
  pearl: 'If there is clear danger and he keeps driving, follow your state\'s DMV reporting process.' });

add('reporting', { id: 'rep5', ref: 74, title: 'The odd one out',
  file: 'Which of these does NOT need to be reported to the health department?',
  ask: 'Choose the one that is not reportable.',
  opts: [
    { t: 'Genital herpes simplex infection.' },
    { t: 'Gonococcal urethritis (gonorrhoea).', why: 'Gonorrhoea is nationally notifiable.' },
    { t: 'Active pulmonary tuberculosis.', why: 'TB is reportable.' },
    { t: 'Measles (rubeola) in a child.', why: 'Measles is reportable, urgently.' },
  ],
  rule: 'HSV (and HPV) are not reportable; gonorrhoea, chlamydia, syphilis, HIV, TB, measles and salmonella are.',
  pearl: 'Reporting is for public health action, such as contact tracing and outbreak control.' });

add('reporting', { id: 'rep6', ref: 75, title: 'The TB driver who won\'t take pills',
  file: 'A school-bus driver has smear-positive pulmonary TB and stays infectious because he refuses his medicines, even under directly observed therapy at home. Every effort to persuade him has failed.',
  ask: 'What should you do?',
  opts: [
    { t: 'Stop him driving; detain him for treatment.' },
    { t: 'Nothing — he has a right to autonomy.', why: 'Autonomy ends where he endangers the public.' },
    { t: 'Restrain him and give the drugs by NG tube.', why: 'Detention is permitted, but forced administration is not the answer.' },
    { t: 'Have him arrested and sent to prison.', why: 'This is public-health detention, not a criminal matter.' },
  ],
  rule: 'An infectious, non-adherent TB patient can be removed from work and detained for treatment to protect others.',
  pearl: 'This is one of the few cases where autonomy is legally limited — because of the harm to third parties.' });

add('reporting', { id: 'rep7', ref: 76, title: 'Who tells the partners?',
  file: 'A 24-year-old with secondary syphilis has had several partners. He is embarrassed and asks how they will find out.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'Public health notifies them, unnamed.' },
    { t: 'You will call them yourself and name him.', why: 'Contact tracing is done anonymously by public health.' },
    { t: 'He must tell each of them himself.', why: 'He may, but notification is not his burden alone.' },
    { t: 'Each partner\'s own doctor will tell them.', why: 'Public health handles partner notification.' },
  ],
  rule: 'Partner notification for STIs is done by the health department, which keeps the index patient anonymous.',
  pearl: 'The physician\'s job is to report the case; the health department traces contacts.' });

add('reporting', { id: 'rep8', ref: 85, title: 'Cigarette burns on detainees',
  file: 'At a military hospital you screen a group of detainees before transfer. Several have round burns and half-healed fractures in patterns suggesting deliberate injury.',
  ask: 'What should you do?',
  opts: [
    { t: 'Report them as possible torture.' },
    { t: 'Just treat the injuries; report nothing.', why: 'Physicians have a duty to document and report suspected torture.' },
    { t: 'Report only on the detainees being released.', why: 'Every victim is owed the report, not only some.' },
    { t: 'Report it only if you are a civilian physician.', why: 'Military and civilian physicians have the same duty.' },
  ],
  rule: 'Suspected torture must be documented and reported, by military and civilian physicians alike.',
  pearl: 'A physician\'s duty to a patient does not change because the patient is a prisoner.' });

// ── 8. HIV & Infectious Disease ─────────────────────────────────────────────
add('hiv', { id: 'hiv1', ref: 29, title: 'She declines the HIV test',
  file: 'A pregnant 30-year-old with past STIs is offered HIV testing as part of routine prenatal care. You explain why it matters for the baby; she declines.',
  ask: 'What should you do?',
  opts: [
    { t: 'Don\'t test; she may decline.' },
    { t: 'Add it quietly to her other routine bloods.', why: 'Testing after a refusal is testing without consent.' },
    { t: 'Run an HIV viral load test instead.', why: 'That is still an HIV test she has declined.' },
    { t: 'Start antiretrovirals empirically.', why: 'Treating without a diagnosis or consent is not allowed.' },
  ],
  rule: 'HIV testing is offered routinely (opt-out) but the patient can still decline; never test covertly.',
  pearl: 'Keep counselling at later visits, since she may change her mind.' });

add('hiv', { id: 'hiv2', ref: 30, title: 'The HIV-positive doctor',
  file: 'A physician you treat has just tested HIV-positive. He asks who you are legally required to inform.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'No one without his written consent.' },
    { t: 'His employer and the hospital HR department.', why: 'Employers have no right to his HIV status.' },
    { t: 'His patients, if he performs invasive procedures.', why: 'It is his responsibility to follow the guidance on invasive procedures; you have no duty to tell his patients.' },
    { t: 'His health insurance company.', why: 'Insurers get nothing without his consent.' },
  ],
  rule: 'An HIV-positive physician\'s status is confidential like any other patient\'s.',
  pearl: 'An infected clinician should seek expert-panel advice about exposure-prone procedures. That is his duty, not yours.' });

add('hiv', { id: 'hiv3', ref: 31, title: 'The dentist who won\'t see him',
  file: 'Your HIV-positive patient needs a dental abscess drained. The dentist in your group practice says he and his staff will not treat "your HIV patients."',
  ask: 'What should you do?',
  opts: [
    { t: 'Refer him to a dentist outside the group.' },
    { t: 'Have the medical director order him to treat.', why: 'No one can be forced into a doctor–patient relationship.' },
    { t: 'Treat with oral antibiotics alone instead.', why: 'An abscess needs drainage; giving worse care to avoid the problem is wrong.' },
    { t: 'Tell him he\'s breaking the law and can be sued.', why: 'His refusal is unethical, but your job is to get the patient care.' },
  ],
  rule: 'Refusing patients because of HIV is unethical, but no physician can be forced to treat; refer elsewhere.',
  pearl: 'Watch for answers that offer a medically inadequate alternative to dodge an ethical problem.' });

add('hiv', { id: 'hiv4', ref: 32, title: 'His wife doesn\'t know',
  file: 'A newly diagnosed HIV-positive man, well and not yet on treatment, has unprotected sex with his wife. She does not know his status.',
  ask: 'What is your first duty?',
  opts: [
    { t: 'Urge him strongly to tell his wife himself.' },
    { t: 'Keep his status confidential no matter what.', why: 'There is a third party at real risk, so confidentiality has limits here.' },
    { t: 'Phone the wife yourself today.', why: 'Encourage voluntary disclosure first; notification comes only if that fails.' },
    { t: 'No action is needed if they use condoms.', why: 'They don\'t use condoms, and partner notification still matters.' },
  ],
  rule: 'First step: encourage the patient to disclose to the partner himself.',
  pearl: 'If he refuses, you may notify, usually through the health department.' });

add('hiv', { id: 'hiv5', ref: 33, title: 'He\'s in the waiting room',
  file: 'Your HIV-positive patient has refused, again and again, to tell her partner, with whom she is now expecting a child. The partner is sitting in your waiting room.',
  ask: 'What should you do?',
  opts: [
    { t: 'Inform the partner now.' },
    { t: 'Respect her confidentiality.', why: 'An identifiable person at ongoing risk outweighs her privacy.' },
    { t: 'Tell him to use condoms without saying why.', why: 'Withholding the reason leaves him unable to protect himself or get tested.' },
    { t: 'Refer her to a doctor who will go along with her.', why: 'Moving her to another doctor does not remove the risk to him.' },
  ],
  rule: 'After repeated refusal to disclose, a physician may tell an endangered partner directly.',
  pearl: 'This is the duty to protect a third party, the same reasoning as Tarasoff.' });

add('hiv', { id: 'hiv6', ref: 72, title: 'The surgeon who is afraid',
  file: 'A 55-year-old man with well-controlled HIV needs coronary bypass surgery. Your hospital\'s cardiac surgeon refuses, citing fear of infection.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refer him to another cardiac surgeon.' },
    { t: 'Have the chief of service make him operate.', why: 'A physician cannot be compelled to treat.' },
    { t: 'Do an angioplasty and stent instead.', why: 'This substitutes a second-best treatment to avoid the ethical issue.' },
    { t: 'Add more medication instead of surgery.', why: 'Medication does not replace surgery that is indicated.' },
  ],
  rule: 'Get the patient the indicated care through another willing physician.',
  pearl: 'The surgeon\'s refusal is unethical and may be addressed separately, but the patient comes first.' });

// ── 9. Reproduction & Donation ──────────────────────────────────────────────
add('reproduction', { id: 'rpd1', ref: 9, title: 'Leftovers from IVF',
  file: 'After a successful IVF pregnancy, a couple has spare sperm, eggs and frozen embryos. They ask whether they can sell them.',
  ask: 'What should you tell them?',
  opts: [
    { t: 'Sperm and eggs yes; embryos no.' },
    { t: 'None of them may be sold.', why: 'Gametes can legally be sold.' },
    { t: 'All of them, embryos included, may be sold.', why: 'Embryos may be donated but not sold.' },
    { t: 'Only the sperm may legally be sold.', why: 'Eggs can be sold as well.' },
  ],
  rule: 'Gametes may be sold; embryos may only be donated.',
  pearl: 'Contrast with solid organs, which may never be sold.' });

add('reproduction', { id: 'rpd2', ref: 77, title: 'The doctor who objects',
  file: 'Your patient is 7 weeks pregnant and, after careful discussion, asks to be referred for an abortion. You personally believe abortion is wrong.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refer her for the abortion.' },
    { t: 'Explain your objection and decline to refer.', why: 'You may decline to perform it, but not obstruct access to it.' },
    { t: 'Insist on a waiting period first.', why: 'Imposing your own delay is obstruction.' },
    { t: 'Refer her for a psychological evaluation.', why: 'Nothing suggests impaired capacity.' },
  ],
  rule: 'A conscientious objector need not perform a procedure but must refer the patient to someone who will.',
  pearl: 'Never abandon a patient or put obstacles in her way.' });

add('reproduction', { id: 'rpd3', ref: 79, title: 'Her tubes, his objection',
  file: 'A married 29-year-old requests tubal ligation. Her husband is upset and objects; they have no children. She is clear about her decision.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refer her for the tubal ligation.' },
    { t: 'Refer her only if her husband agrees.', why: 'A spouse has no veto over her body.' },
    { t: 'Don\'t refer, since she may regret it.', why: 'Possible regret is a reason to counsel her, not to refuse.' },
    { t: 'Refer her after a psychological evaluation.', why: 'Requesting sterilization is not a reason to doubt her capacity.' },
  ],
  rule: 'Contraception and sterilization decisions belong to the patient alone; spousal consent is not required.',
  pearl: 'Counsel her about permanence and alternatives, then respect her decision.' });

add('reproduction', { id: 'rpd4', ref: 80, title: 'The husband calls',
  file: 'A married 38-year-old with three children has been referred for a first-trimester abortion. Her husband phones you, distraught, and begs you to stop it.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'You must honor your patient\'s wishes.' },
    { t: 'You will try to talk his wife out of it.', why: 'You serve the patient, not her husband.' },
    { t: 'You will cancel the appointment.', why: 'Cancelling it would override her decision.' },
    { t: 'You need a court order to delay the abortion.', why: 'A court cannot be used to stop a capable adult\'s choice either.' },
  ],
  rule: 'Partners have no legal say over a woman\'s decision to continue or end a pregnancy.',
  pearl: 'Also: never discuss your patient\'s care with him without her permission.' });

add('reproduction', { id: 'rpd5', ref: 81, title: 'Thirty weeks',
  file: 'A healthy 28-year-old at 30 weeks\' gestation requests an abortion. The fetus is normal on scans and genetic testing.',
  ask: 'What should you tell her?',
  opts: [
    { t: 'Only if her life or health is at risk.' },
    { t: 'You will go ahead with the abortion.', why: 'After viability, elective abortion is restricted.' },
    { t: 'You will proceed if she gets a court order.', why: 'Courts don\'t authorise elective post-viability abortion.' },
    { t: 'You will refuse because the fetus is normal.', why: 'The reason is viability plus law, not the fetus being normal.' },
  ],
  rule: 'After viability, abortion is generally allowed only to protect the mother\'s life or health.',
  pearl: 'State laws differ; on the exam, think about viability and the mother\'s life.' });

add('reproduction', { id: 'rpd6', ref: 10, title: 'Who asks the family?',
  file: 'A young man is brain-dead after a crash. You, the medical student, have the warmest rapport with his family, and organ donation is being considered.',
  ask: 'Who should request consent for donation?',
  opts: [
    { t: 'The organ procurement organization.' },
    { t: 'You, since you know the family best.', why: 'Treating teams do not make the request — it avoids a conflict of interest.' },
    { t: 'The attending of record.', why: 'The treating team stays separate from the donation request.' },
    { t: 'The hospital administration.', why: 'Administration has no role in this.' },
  ],
  rule: 'Trained organ-procurement staff, not the treating team, ask families about donation.',
  pearl: 'This keeps care for the dying patient separate from interest in the organs.' });

add('reproduction', { id: 'rpd7', ref: 11, title: 'A kidney for cash',
  file: 'A healthy man wants to donate a kidney to a stranger who has offered to pay him well. He asks whether that is allowed.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'Expenses may be repaid; profit may not.' },
    { t: 'It\'s allowed as long as the recipient truly needs the kidney.', why: 'Need does not make organ sales legal.' },
    { t: 'It is fine if done in another country.', why: 'Physicians cannot keep one standard at home and another abroad.' },
    { t: 'It\'s fine if his remaining kidney is healthy.', why: 'Medical safety is not the issue; payment is.' },
  ],
  rule: 'Solid organs can never be bought or sold; reimbursing a donor\'s real expenses is allowed.',
  pearl: 'Payment would send organs to the richest rather than to the best match or the greatest need.' });

add('reproduction', { id: 'rpd8', ref: 12, title: 'The donor card and the family',
  file: 'A brain-dead woman carries a signed organ-donor card. Her family, grieving, firmly refuse donation.',
  ask: 'What should be done?',
  opts: [
    { t: 'Honor the family\'s wishes; no donation.' },
    { t: 'Recover the organs, as the card permits.', why: 'In practice, donation does not go ahead over the family\'s objection.' },
    { t: 'Seek a court order to override the family.', why: 'No one seeks a court order to take organs from a grieving family.' },
    { t: 'Stop the ventilator, then recover the organs.', why: 'This does not address the family\'s refusal.' },
  ],
  rule: 'Even with a donor card, organs are not recovered over a family\'s objection.',
  pearl: 'A donor card is legally valid, but in practice organizations always defer to the family.' });

// ── 10. End of Life ─────────────────────────────────────────────────────────
add('endoflife', { id: 'eol1', ref: 1, title: 'No reflexes left',
  file: 'After a massive brain haemorrhage, an 83-year-old has no spontaneous breaths on an apnoea test, fixed pupils, and no corneal, oculocephalic or caloric responses. He left no instructions.',
  ask: 'What is the most appropriate action?',
  opts: [
    { t: 'Remove the ventilator.' },
    { t: 'Make him DNR and continue support.', why: 'He is already dead; a DNR order has no meaning.' },
    { t: 'Seek a court order to stop the ventilator.', why: 'No consent or court is needed to stop support on a dead patient.' },
    { t: 'Place a feeding tube to prevent aspiration.', why: 'You do not feed a cadaver.' },
  ],
  rule: 'Brain death is legal death; the ventilator may be removed without consent.',
  pearl: 'Tell the family first and give them time — but the decision is not theirs to make.' });

add('endoflife', { id: 'eol2', ref: 13, title: 'DNR and a dangerous potassium',
  file: 'A capable woman with advanced multiple sclerosis chose a DNR order. She now has renal failure with a potassium of 7.9 mEq/L.',
  ask: 'What is the right management?',
  opts: [
    { t: 'Start dialysis; the DNR doesn\'t apply.' },
    { t: 'No dialysis, because she is DNR.', why: 'DNR means no CPR during arrest only.' },
    { t: 'Reverse the DNR for the dialysis.', why: 'There is nothing to reverse; DNR doesn\'t cover dialysis.' },
    { t: 'Give binders and discuss DNR with family.', why: 'She is capable; the DNR is irrelevant to this treatment.' },
  ],
  rule: 'DNR means no resuscitation in cardiac arrest. It does not limit any other treatment.',
  pearl: 'Of course, she can still refuse dialysis itself if she chooses.' });

add('endoflife', { id: 'eol3', ref: 14, title: 'DNR and still bleeding',
  file: 'A nursing-home resident with a DNR order has a GI bleed that keeps going despite transfusion, PPIs and endoscopy. He needs intensive monitoring.',
  ask: 'What should you do?',
  opts: [
    { t: 'Admit him to the ICU; DNR is fine there.' },
    { t: 'Reverse the DNR so he can go to the ICU.', why: 'The ICU and a DNR order are compatible.' },
    { t: 'DNR patients can\'t be in the ICU.', why: 'False — DNR only concerns CPR.' },
    { t: 'He may go to the ICU but not to surgery.', why: 'DNR doesn\'t exclude surgery either.' },
  ],
  rule: 'A DNR patient can receive ICU care, transfusions, surgery and everything else short of CPR.',
  pearl: 'Separate orders cover intubation (DNI) and other specific limits.' });

add('endoflife', { id: 'eol4', ref: 15, title: 'DNR and appendicitis',
  file: 'An 86-year-old with a long-standing DNR order has acute appendicitis. He wants the operation and wants to remain DNR.',
  ask: 'What should you do about surgery?',
  opts: [
    { t: 'Operate; DNR doesn\'t prevent surgery.' },
    { t: 'Suspend the DNR for the operation.', why: 'He wants it kept; you can\'t suspend it against his wishes.' },
    { t: 'Surgery is OK only without intubation.', why: 'Intubation for anaesthesia is not resuscitation.' },
    { t: 'No surgery is possible while he is DNR.', why: 'DNR doesn\'t restrict surgery.' },
  ],
  rule: 'DNR status does not preclude surgery or anaesthesia; discuss its peri-operative meaning with the patient.',
  pearl: 'A "required reconsideration" conversation is good practice, but the decision is his.' });

add('endoflife', { id: 'eol5', ref: 86, title: 'Dialysis for a hopeless brain',
  file: 'An ICU patient in a persistent vegetative state from anoxic injury now has sepsis, GI bleeding and respiratory failure, and is developing renal failure. Dialysis would be futile.',
  ask: 'What is the most appropriate step?',
  opts: [
    { t: 'Recommend against dialysis.' },
    { t: 'Start haemodialysis.', why: 'Physicians are not obliged to give futile treatment.' },
    { t: 'Start peritoneal dialysis.', why: 'Changing the type of dialysis does not make it any less futile.' },
    { t: 'List him for a kidney transplant.', why: 'Absurdly futile.' },
  ],
  rule: 'Physicians need not offer or provide futile care.',
  pearl: 'Futility is a medical judgment; communicate it compassionately to the family.' });

add('endoflife', { id: 'eol6', ref: 87, title: 'Paralysed and certain',
  file: 'A 30-year-old climber is quadriplegic and ventilator-dependent after a high cervical fracture, with no recovery in four months. She is alert, not depressed, and repeatedly asks to have the ventilator removed, knowing she will die.',
  ask: 'What should you do?',
  opts: [
    { t: 'Remove the ventilator as she requests.' },
    { t: 'Get her health-care proxy\'s approval.', why: 'A proxy has no role while the patient has capacity.' },
    { t: 'Seek family consensus first.', why: 'Her own capable decision is what counts.' },
    { t: 'Obtain a court order to keep ventilating.', why: 'Courts don\'t force treatment on capable adults.' },
  ],
  rule: 'A capable patient may refuse or withdraw any life-sustaining treatment.',
  pearl: 'Sedation and comfort measures during withdrawal are appropriate and expected.' });

add('endoflife', { id: 'eol7', ref: 94, title: 'Pain relief that may shorten life',
  file: 'A 70-year-old with bone metastases and severe COPD has pain that only escalating IV opioids control, which may depress his breathing and shorten his life. He is alert and capable.',
  ask: 'What is the most ethical approach?',
  opts: [
    { t: 'Give it, once he understands the risks.' },
    { t: 'It\'s acceptable only if he is DNR.', why: 'DNR status is unrelated to relief of pain.' },
    { t: 'Never acceptable if it might shorten his life.', why: 'Double effect makes it acceptable.' },
    { t: 'Leave him in pain to protect his breathing.', why: 'Undertreating pain is a failure of care.' },
  ],
  rule: 'Double effect: relieving suffering is ethical even if death is a foreseen but unintended effect.',
  pearl: 'The intent is relief, not death; the dose is titrated to symptoms.' });

add('endoflife', { id: 'eol8', ref: 96, title: 'What can the family stop?',
  file: 'An elderly man in a permanent vegetative state has no living will or proxy. His family is in full agreement about his previously stated wishes, and asks to stop treatment.',
  ask: 'Which treatment can NOT be stopped at the family\'s direction?',
  opts: [
    { t: 'None of them.' },
    { t: 'Artificial food and fluids.', why: 'Artificial nutrition is a medical treatment like any other.' },
    { t: 'The mechanical ventilator.', why: 'The ventilator may be withdrawn as well.' },
    { t: 'Routine daily blood tests.', why: 'Tests can be stopped too.' },
  ],
  rule: 'A united family conveying the patient\'s wishes can withdraw any treatment, including nutrition.',
  pearl: 'If the family disagrees, start with mediation, then the ethics committee, then courts.' });

add('endoflife', { id: 'eol9', ref: 97, title: '"Take this tube out"',
  file: 'A 72-year-old man after a stroke has a nasogastric feeding tube. He is alert, capable and not depressed, and asks for it to come out because it is uncomfortable.',
  ask: 'What should you say?',
  opts: [
    { t: '"I\'ll take that tube out right away."' },
    { t: '"Let me talk to your family first."', why: 'A capable patient\'s decision doesn\'t need the family.' },
    { t: '"Only if you let me place a gastric tube."', why: 'You cannot make his choice conditional on another procedure.' },
    { t: '"Let\'s see how much you can eat first."', why: 'Delaying his request disregards it.' },
  ],
  rule: 'A capable adult can stop any treatment, including artificial nutrition, without giving a reason.',
  pearl: 'You may explain the consequences, but you can\'t make him justify his choice.' });

add('endoflife', { id: 'eol10', ref: 102, title: 'Lines and labs too',
  file: 'After a cardiac arrest, a man is in a permanent vegetative state. His wife and children unanimously report that he often said he never wanted to live "like a vegetable". The ventilator has been withdrawn and he still breathes. They now ask to stop the IV lines and the blood tests.',
  ask: 'What should you do?',
  opts: [
    { t: 'Remove the IV lines and stop the blood draws.' },
    { t: 'Refuse — you may only withhold new treatments.', why: 'Withdrawing is ethically identical to withholding.' },
    { t: 'Refer to the ethics committee first.', why: 'There is no disagreement to resolve.' },
    { t: 'Obtain a court order.', why: 'Consistent oral wishes, conveyed by a united family, need no court.' },
  ],
  rule: 'Clear oral wishes are an advance directive. A united family can convey them and have any treatment withdrawn.',
  pearl: 'Order of strength: patient now → written directive → proxy → oral wishes via family → best interests.' });

add('endoflife', { id: 'eol11', ref: 65, title: 'A request for the means',
  file: 'A 66-year-old with metastatic pancreatic cancer has severe pain. He asks you for a supply of pills large enough to end his life when he chooses. There is no state law permitting this where you practise.',
  ask: 'What is the most appropriate response?',
  opts: [
    { t: 'Treat his pain; do not supply the pills.' },
    { t: 'Give him the pills, since he is terminal.', why: 'Physician-assisted suicide is not permitted here.' },
    { t: 'Admit him for psychiatric evaluation.', why: 'Nothing suggests he is dangerously suicidal; this is a request to talk about.' },
    { t: 'Start an antidepressant at once.', why: 'There is no evidence of depression to treat.' },
  ],
  rule: 'Physician-assisted suicide is illegal in most of the US; the duty is aggressive palliation.',
  pearl: 'Explore the fears behind the request: pain, dependence, being a burden.' });

add('endoflife', { id: 'eol12', ref: 66, title: 'A lethal injection at home',
  file: 'A capable 75-year-old with progressing ALS, not depressed and supported by his family, asks you to come to his home and give him a lethal injection.',
  ask: 'What should you tell him?',
  opts: [
    { t: 'You can never take part in euthanasia.' },
    { t: 'You\'ll do it, as he\'s capable and not depressed.', why: 'Euthanasia is illegal everywhere in the US.' },
    { t: 'You\'ll agree because his condition will worsen.', why: 'Prognosis does not make euthanasia legal.' },
    { t: 'You\'ll do it if he moves to a state that allows it.', why: 'No US state allows a physician to administer a lethal injection.' },
  ],
  rule: 'Euthanasia (the physician administers) is never permitted in the US; assisted suicide (the patient self-administers) is legal in only a few states.',
  pearl: 'Offer hospice, symptom control and an honest discussion of ventilator decisions.' });

// ── 11. Professionalism ─────────────────────────────────────────────────────
add('professionalism', { id: 'pro1', ref: 24, title: 'Dinner, a talk, and a gift card',
  file: 'A drug company invites residents to a dinner with an educational lecture, and every attendee gets a $500 gift card to a clothing store.',
  ask: 'What is the right course?',
  opts: [
    { t: 'Go to the dinner and the talk; refuse the gift card.' },
    { t: 'Accept all three.', why: 'A cash-equivalent gift is not acceptable.' },
    { t: 'Refuse everything — any industry contact is unethical.', why: 'Modest meals with educational content are acceptable.' },
    { t: 'Accept it all, since you are only a resident.', why: 'The same rules apply to trainees.' },
  ],
  rule: 'Modest meals and educational events from industry are fine; cash and cash equivalents are not.',
  pearl: 'No gift may be tied to prescribing.' });

add('professionalism', { id: 'pro2', ref: 25, title: 'A fee for Grand Rounds',
  file: 'A device maker is sponsoring your Grand Rounds talk and offers a $1,000 speaker\'s fee.',
  ask: 'What should you do?',
  opts: [
    { t: 'Accept it and disclose your conflicts.' },
    { t: 'You must refuse the money.', why: 'Reasonable fees for real work are acceptable.' },
    { t: 'Accept it, as long as you don\'t mention it.', why: 'Hiding the fee is what makes it unethical.' },
    { t: 'Accept only if you donate it to charity.', why: 'The issue is disclosure, not where the money goes.' },
  ],
  rule: 'Honoraria for genuine work are acceptable with full disclosure of conflicts of interest.',
  pearl: 'Disclosure lets the audience judge possible bias for themselves.' });

add('professionalism', { id: 'pro3', ref: 26, title: 'A cheque during mania',
  file: 'A patient in the middle of a manic episode, talking rapidly and grandiosely, offers you a large cheque to "fund your research."',
  ask: 'What should you say?',
  opts: [
    { t: '"Thank you, but I can\'t accept this."' },
    { t: '"I accept, on behalf of the department."', why: 'His judgment is impaired; accepting would exploit him.' },
    { t: '"I accept, if it funds bipolar research."', why: 'The purpose doesn\'t fix the exploitation.' },
    { t: '"I\'ll accept once psychiatry has seen you."', why: 'A gift that depends on a psychiatric review is still compromised.' },
  ],
  rule: 'Never accept gifts from a patient whose judgment is impaired by acute illness.',
  pearl: 'Gifts from patients must be free of duress, illness or expectation.' });

add('professionalism', { id: 'pro4', ref: 27, title: 'Cake and a scarf',
  file: 'The family of an elderly patient you have cared for over many years brings you a home-cooked meal, a cake and a hand-knitted scarf.',
  ask: 'What should you do?',
  opts: [
    { t: 'Accept the gifts graciously.' },
    { t: 'Refuse all of them.', why: 'Refusing small gestures of thanks can hurt the relationship.' },
    { t: 'Accept the food but not the scarf.', why: 'Small personal items are acceptable as well.' },
    { t: 'Accept them, then report them to admin.', why: 'There is no reporting requirement for small gifts.' },
  ],
  rule: 'Small gifts from patients are acceptable if they aren\'t tied to any expectation of care.',
  pearl: 'A gift that comes with a request (a prescription, a disability form) must be declined.' });

add('professionalism', { id: 'pro5', ref: 28, title: 'Industry gifts at a student fair',
  file: 'At a careers fair, a medical-equipment company offers students a modest lunch, a stethoscope and a voucher for the medical school bookshop.',
  ask: 'Which may be accepted?',
  opts: [
    { t: 'All three may be accepted.' },
    { t: 'None of them.', why: 'Modest educational or patient-care items are acceptable.' },
    { t: 'Only the lunch.', why: 'The stethoscope and bookshop voucher have educational value.' },
    { t: 'The lunch and stethoscope, but not the voucher.', why: 'A voucher for a medical bookshop is educational.' },
  ],
  rule: 'Acceptable industry gifts are modest, educational or useful for patient care.',
  pearl: 'Not acceptable: cash, department-store cards, and concert or sports tickets.' });

add('professionalism', { id: 'pro6', ref: 67, title: 'Alcohol on the resident\'s breath',
  file: 'As a sub-intern on labour and delivery, you notice the senior resident smells of alcohol and is behaving oddly while seeing patients.',
  ask: 'What should you do?',
  opts: [
    { t: 'Report him to his program director.' },
    { t: 'Say nothing, since you are his subordinate.', why: 'Patient safety outranks hierarchy.' },
    { t: 'Talk to him privately and tell no one.', why: 'An impaired physician caring for patients needs official action.' },
    { t: 'Report him straight to the state licensing board.', why: 'For a trainee, the program director is the right first level.' },
  ],
  rule: 'Report a physician who is impaired at work to the person responsible for him; for a trainee, that is the program director or chair.',
  pearl: 'Make sure his patients are safe right now as well.' });

add('professionalism', { id: 'pro7', ref: 68, title: 'The attending who forgets',
  file: 'A senior attending in another division gets lost in hallways and forgets what residents tell him. The chief knows but keeps him on service because the rota is short.',
  ask: 'What should you do?',
  opts: [
    { t: 'Report him to the licensing board.' },
    { t: 'Nothing, since the chief already knows.', why: 'Institutional inaction does not remove your duty.' },
    { t: 'Tell your own division head.', why: 'The internal channel has already failed.' },
    { t: 'Speak to him directly about it.', why: 'Direct conversation does not protect his patients.' },
  ],
  rule: 'If the institution won\'t act on an impaired physician, report to the state licensing board.',
  pearl: 'Escalation goes from the internal chain to the external board when internal channels fail.' });

add('professionalism', { id: 'pro8', ref: 69, title: 'Saturday night',
  file: 'Out on a Saturday, you see one of your residents very drunk at a bar, kissing someone you know is not her spouse. On Monday her work is entirely normal.',
  ask: 'What should you do?',
  opts: [
    { t: 'Nothing.' },
    { t: 'Speak to her directly about her behaviour.', why: 'Her private life is not your concern.' },
    { t: 'Discuss it with her program director.', why: 'Behaviour off duty, with no effect on her work, is not reportable.' },
    { t: 'Refer her to a physician-impairment program.', why: 'There is no evidence she is impaired at work.' },
  ],
  rule: 'A physician\'s private conduct off duty is not your concern unless it affects patient care.',
  pearl: 'Impairment is about being unfit at work, not about how someone lives outside it.' });

add('professionalism', { id: 'pro9', ref: 70, title: 'Closing the list',
  file: 'A busy inner-city GP already has a full list and decides to stop taking new patients.',
  ask: 'How is his decision best described?',
  opts: [
    { t: 'It is both legal and ethical.' },
    { t: 'Legal but unethical.', why: 'Limiting a practice to what you can manage is responsible.' },
    { t: 'Illegal and unethical.', why: 'Physicians may choose whom they take on (but not on a discriminatory basis).' },
    { t: 'Ethical only if he arranges a transfer.', why: 'There is no relationship yet, so there is nothing to transfer.' },
  ],
  rule: 'A physician may decline new patients, but not for discriminatory reasons, and may not abandon current ones.',
  pearl: 'Emergencies (EMTALA) are the exception: you must stabilize everyone.' });

add('professionalism', { id: 'pro10', ref: 71, title: 'The gag rule',
  file: 'Your managed-care employer tells you not to mention stem-cell transplantation to myeloma patients because it is expensive, and hints that your costs per patient affect promotion. A patient now asks about his options.',
  ask: 'What should you do?',
  opts: [
    { t: 'Tell him all about transplant.' },
    { t: 'Mention transplant only if he asks about it.', why: 'Full disclosure is your duty, not something triggered by his question.' },
    { t: 'Refer him to an oncologist for that conversation.', why: 'Passing the conversation on to someone else avoids your duty.' },
    { t: 'Tell him to sue the managed-care plan.', why: 'Not your role, and it doesn\'t inform him.' },
  ],
  rule: 'The patient\'s interest comes first; an employer\'s gag on treatment options is ignored.',
  pearl: 'Financial incentives must never limit what you tell a patient.' });

add('professionalism', { id: 'pro11', ref: 73, title: 'Twenty years as her doctor',
  file: 'A widowed 62-year-old internist and a widowed patient he has looked after for decades have grown close. She would like a romantic relationship.',
  ask: 'What should he tell her?',
  opts: [
    { t: '"Not while I\'m your doctor."' },
    { t: '"Since it\'s your idea, we can begin dating."', why: 'Who suggests it does not matter while he is still her doctor.' },
    { t: '"We can be close, but not sexually."', why: 'Any romantic relationship with a current patient is off-limits.' },
    { t: '"We need ethics board approval first."', why: 'No board can approve a relationship with a current patient.' },
  ],
  rule: 'Romantic relationships with current patients are never allowed; end the professional relationship first.',
  pearl: 'For psychiatrists, a relationship is prohibited even after the professional relationship ends.' });

// ── 12. Research & Society ──────────────────────────────────────────────────
add('research', { id: 'res1', ref: 17, title: 'The prison execution',
  file: 'You are the physician in a state prison. On execution day, the technician cannot place the IV, and the warden asks you to place it and supervise the drugs.',
  ask: 'What should you say?',
  opts: [
    { t: '"I can\'t take part in an execution at all."' },
    { t: '"I\'ll place the line but won\'t push the drugs."', why: 'Placing the IV is participation.' },
    { t: '"I\'ll place it but won\'t prepare the drugs."', why: 'Any part of the procedure is participation.' },
    { t: '"I\'ll take care of all of it."', why: 'A physician must never take part in an execution.' },
  ],
  rule: 'Physicians must not participate in executions in any way.',
  pearl: 'Certifying death after the execution is the one accepted exception.' });

add('research', { id: 'res2', ref: 84, title: 'Monitoring an interrogation',
  file: 'You are asked to monitor a terror suspect\'s oxygen saturation during a simulated strangulation so interrogators know when to stop.',
  ask: 'What should you do?',
  opts: [
    { t: 'Refuse — you can\'t take part in torture.' },
    { t: 'Take part, as the evidence against him is strong.', why: 'There is no exception for guilt.' },
    { t: 'Take part only with a court order.', why: 'No order can make torture ethical.' },
    { t: 'Take part with a military release.', why: 'Paperwork doesn\'t change participation.' },
  ],
  rule: 'Physicians may never participate in, monitor, or enable torture.',
  pearl: 'Monitoring a patient so that torture can continue is still participation in torture.' });

add('research', { id: 'res3', ref: 18, title: 'A higher dose of an approved drug',
  file: 'You plan a trial comparing doses of a drug that is already FDA-approved, to see whether a higher dose helps more.',
  ask: 'Which is true about your study?',
  opts: [
    { t: 'Participants still need informed consent.' },
    { t: 'No consent is needed, as the drug is FDA-approved.', why: 'Research on humans always needs informed consent.' },
    { t: 'No IRB review is needed.', why: 'All human-subjects research needs IRB review.' },
    { t: 'No consent is needed, as you\'re testing for benefit.', why: 'The study\'s aim doesn\'t remove the need for consent.' },
  ],
  rule: 'All research on human subjects requires IRB oversight and informed consent.',
  pearl: 'Participants can withdraw at any time without penalty.' });

add('research', { id: 'res4', ref: 19, title: 'Prisoners in a trial',
  file: 'A researcher asks what rules govern enrolling prisoners in clinical research.',
  ask: 'Which statement is correct?',
  opts: [
    { t: 'Their rights are the same as anyone\'s.' },
    { t: 'Prisoners may never take part in research.', why: 'They may, with the same protections as other participants.' },
    { t: 'No informed consent is needed from prisoners.', why: 'Consent is always required.' },
    { t: 'Taking part can earn early release.', why: 'That would be coercion.' },
  ],
  rule: 'Prisoners keep full research rights, including voluntary consent free from coercion.',
  pearl: 'Incentives such as sentence reduction would make the consent coerced.' });

add('research', { id: 'res5', ref: 20, title: 'Statin money and a paper',
  file: 'You led a heart-outcomes trial of a statin, and the manufacturer provided most of the funding. You are writing it up.',
  ask: 'What is required for your authorship?',
  opts: [
    { t: 'None, if you disclose the funding.' },
    { t: 'Industry funding bars you from being an author.', why: 'Funding does not disqualify you, provided you disclose it.' },
    { t: 'Nothing, as long as the data are accurate.', why: 'Disclosure is required regardless.' },
    { t: 'Nothing, if the checks went to the institution.', why: 'Institutional funding must still be disclosed.' },
  ],
  rule: 'Disclose every relevant financial relationship when you publish or present research.',
  pearl: 'A well-known retracted vaccine paper is the cautionary tale: its author\'s conflicts of interest were undisclosed.' });

add('research', { id: 'res6', ref: 21, title: 'Why the IRB exists',
  file: 'A student asks what an institutional review board is primarily for.',
  ask: 'Which answer is best?',
  opts: [
    { t: 'To protect research subjects.' },
    { t: 'To protect the institution from liability.', why: 'That is risk management\'s role.' },
    { t: 'To protect the investigator from liability.', why: 'The IRB protects the participants.' },
    { t: 'To make sure the study is financially viable.', why: 'Budgets are not the IRB\'s concern.' },
  ],
  rule: 'IRBs protect the rights and welfare of human research subjects.',
  pearl: 'They grew out of the Nuremberg trials. An IRB also rejects a placebo arm when an effective therapy already exists.' });

export default C;
