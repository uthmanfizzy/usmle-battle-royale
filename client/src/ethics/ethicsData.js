/**
 * HY Ethics — the scenario bank for Amboss Quest's ethics mode.
 *
 * Original wording written for this app: each scenario teaches one of the
 * standard USMLE ethics rules (consent, capacity, confidentiality, minors,
 * reporting, end of life…). Nothing is copied from a commercial source.
 *
 *   who / name   the character the player faces (emoji + role)
 *   says         what they say to you (the speech bubble)
 *   ctx          the situation, one or two sentences
 *   opts         answer options; the FIRST is correct (shuffled at runtime).
 *                Each wrong option carries `why` — the reason it fails.
 *   rule         the one-line rule the scenario teaches
 *   hy           extra high-yield points
 *   tag          the principle at stake (for the badge)
 */

export const PRINCIPLES = {
  autonomy: { label: 'Autonomy', icon: '🗽', hue: '132, 204, 22' },
  beneficence: { label: 'Beneficence', icon: '💚', hue: '45, 212, 191' },
  nonmaleficence: { label: 'Non-maleficence', icon: '🛡️', hue: '96, 165, 250' },
  justice: { label: 'Justice', icon: '⚖️', hue: '250, 204, 21' },
  confidentiality: { label: 'Confidentiality', icon: '🔒', hue: '167, 139, 250' },
  professionalism: { label: 'Professionalism', icon: '🎓', hue: '251, 146, 60' },
  capacity: { label: 'Capacity', icon: '🧠', hue: '244, 114, 182' },
  safety: { label: 'Safety', icon: '🚨', hue: '248, 113, 113' },
};

export const CHAPTERS = [
  { id: 'boundaries', name: 'Boundaries', icon: '🚧', blurb: 'Romance, treating family, and gifts.' },
  { id: 'consent', name: 'Autonomy & Consent', icon: '✍️', blurb: 'Refusals, who consents, and surprises in theatre.' },
  { id: 'decisions', name: 'Shared Decisions', icon: '🤝', blurb: 'Requests you disagree with and futile care.' },
  { id: 'capacity', name: 'Capacity & Surrogates', icon: '🧠', blurb: 'Advance directives and who decides.' },
  { id: 'minors', name: 'Minors', icon: '🧸', blurb: 'Parents, teens, and when you treat anyway.' },
  { id: 'reporting', name: 'Records & Reporting', icon: '📋', blurb: 'Charts, drivers, partner and elder abuse.' },
  { id: 'disclosure', name: 'Disclosure & Errors', icon: '🔐', blurb: 'Who gets told what, and owning mistakes.' },
  { id: 'colleagues', name: 'Colleagues & System', icon: '🏥', blurb: 'EMTALA, adherence, impaired and fraudulent peers.' },
  { id: 'endoflife', name: 'End of Life', icon: '🕯️', blurb: 'DNR, comfort care, and requests to die.' },
  { id: 'counseling', name: 'Hard Conversations', icon: '💬', blurb: 'Grief, anger, agitation, and opioid demands.' },
];

const S = [];
const add = (ch, s) => S.push({ ch, ...s });

// ── Boundaries ──────────────────────────────────────────────────────────────
add('boundaries', { id: 'b1', who: '💐', name: 'A patient’s mother',
  says: 'You’ve been so kind to my son. Would you like to get lunch with me sometime — just the two of us?',
  ctx: 'She is closely involved in her child’s care and decisions.',
  tag: 'professionalism',
  opts: [
    { t: 'Kindly decline, keep contact focused on the child’s care, and consider transferring care if it continues.' },
    { t: 'Accept, since she is not technically your patient.', why: 'Key third parties involved in care count — a relationship is off-limits.' },
    { t: 'Accept once the child is discharged from this admission.', why: 'The child is still your patient; the conflict remains.' },
    { t: 'Report her to hospital security.', why: 'Disproportionate — she has done nothing dangerous.' },
  ],
  rule: 'Never date a current patient or anyone involved in their care decisions.',
  hy: ['Set firm boundaries and use closed-ended questions.', 'Bring a chaperone if needed; transfer care if the boundary cannot hold.'] });

add('boundaries', { id: 'b2', who: '😏', name: 'Patient on the exam table',
  says: '(during a genital exam) You know, you’re much better-looking than my last doctor…',
  ctx: 'The examination is not yet finished.', tag: 'professionalism',
  opts: [
    { t: 'Tell him calmly that the comment is inappropriate, bring in a chaperone, and finish only what is medically needed.' },
    { t: 'Ignore it and carry on as normal.', why: 'Boundaries must be named, not ignored.' },
    { t: 'Stop and discharge him from your practice immediately.', why: 'Address the behaviour first; abandonment is not the first step.' },
    { t: 'Laugh it off to keep rapport.', why: 'Signals the comment is acceptable.' },
  ],
  rule: 'Name inappropriate sexual comments directly, add a chaperone, and limit contact to what is necessary.',
  hy: ['Switch to direct, closed-ended questions.'] });

add('boundaries', { id: 'b3', who: '🧳', name: 'Your close friend',
  says: 'I’m flying out tomorrow and forgot to refill my birth-control pill. Could you just write me a script?',
  ctx: 'It is not an emergency, and she has her own physician.', tag: 'professionalism',
  opts: [
    { t: 'Decline and suggest she contact her own physician or an urgent-care service.' },
    { t: 'Prescribe it — the pill is low risk.', why: 'Treating friends/family is avoided except for emergencies or trivial problems.' },
    { t: 'Give her samples from your clinic instead.', why: 'Still treating a friend outside a proper relationship.' },
    { t: 'Prescribe it but document it under another patient.', why: 'Falsifying records — never.' },
  ],
  rule: 'Do not treat yourself, family or friends — except emergencies, isolated settings or minor problems.',
  hy: ['A nosebleed or a first-degree burn is fine to handle.'] });

add('boundaries', { id: 'b4', who: '👴', name: 'Your father (after a crash)',
  says: 'I need surgery and I only trust you. Please — you operate.',
  ctx: 'You are a surgeon at the same hospital.', tag: 'professionalism',
  opts: [
    { t: 'Ask the attending surgeon whether you may assist rather than lead.' },
    { t: 'Perform the operation as primary surgeon.', why: 'Emotional involvement clouds judgment — another surgeon leads.' },
    { t: 'Refuse to be anywhere near the operating room.', why: 'You may assist with the primary surgeon’s permission.' },
    { t: 'Transfer him to another hospital.', why: 'Unnecessary delay for an urgent procedure.' },
  ],
  rule: 'Another surgeon leads; you may assist with the attending’s permission.',
  hy: ['Objectivity is the reason family should not be treated.'] });

add('boundaries', { id: 'b5', who: '🦢', name: 'Grateful patient',
  says: 'I made you this origami swan and a card. Thank you for everything!',
  ctx: 'The gift has almost no monetary value.', tag: 'professionalism',
  opts: [
    { t: 'Thank her warmly and accept it.' },
    { t: 'Politely decline — doctors cannot take gifts.', why: 'Small, personal, low-value gifts may be accepted.' },
    { t: 'Accept it and give her an extra appointment slot in return.', why: 'Gifts must not change care.' },
    { t: 'Accept but tell her to stop doing it.', why: 'Needlessly cold — nothing wrong was done.' },
  ],
  rule: 'Small, non-intimate gifts of little value may be accepted graciously.',
  hy: ['Never let a gift influence the care given.'] });

add('boundaries', { id: 'b6', who: '🖼️', name: 'Wealthy patient',
  says: 'I’d like your office to have this original painting from my private collection.',
  ctx: 'It is by a famous artist and worth a great deal.', tag: 'professionalism',
  opts: [
    { t: 'Thank him, decline politely, explain why, and reassure him your care is unchanged.' },
    { t: 'Accept it for the office, since it is not for you personally.', why: 'High-value gifts create conflicts of interest regardless of who keeps them.' },
    { t: 'Accept and donate it to charity.', why: 'Still accepting a highly valuable gift.' },
    { t: 'Decline without explanation.', why: 'Explain and reassure — protect the relationship.' },
  ],
  rule: 'Decline valuable or intimate gifts, explain the conflict of interest, and reassure the patient.',
  hy: [] });

add('boundaries', { id: 'b7', who: '💆', name: 'Patient in a manic episode',
  says: 'Here’s a $100 spa gift card. You deserve it!',
  ctx: 'She has an active mood episode.', tag: 'capacity',
  opts: [
    { t: 'Decline gently and reassure her that it changes nothing in her care.' },
    { t: 'Accept — $100 is a modest amount.', why: 'Her judgment may be impaired by the mood episode.' },
    { t: 'Accept and return it when she is euthymic.', why: 'Do not accept in the first place.' },
    { t: 'Document it as a symptom and change her medication.', why: 'Declining is the issue here, not a medication change.' },
  ],
  rule: 'Do not accept gifts from a patient whose judgment may be impaired (eg a mood episode).',
  hy: [] });

add('boundaries', { id: 'b8', who: '💼', name: 'Pharmaceutical rep',
  says: 'Loved your paper on our drug! We’ll cover your conference trip and fund a trial at your hospital.',
  ctx: 'The drug would genuinely benefit your patients.', tag: 'professionalism',
  opts: [
    { t: 'Decline both the travel and the funding offer.' },
    { t: 'Accept the trial funding but not the travel.', why: 'Industry research needs no conflict, IRB approval and full disclosure — not an offer tied to your work.' },
    { t: 'Accept both if you disclose them later.', why: 'Disclosure alone does not remove the conflict.' },
    { t: 'Accept the travel because conferences are educational.', why: 'Personal travel paid by industry is a conflict of interest.' },
  ],
  rule: 'Decline industry money that creates a conflict of interest.',
  hy: ['Industry-funded research is allowed only with no conflict, IRB approval and full disclosure.'] });

add('boundaries', { id: 'b9', who: '📚', name: 'Pharmaceutical rep',
  says: 'Here are some free leaflets on healthy eating for your patients with hypertension.',
  ctx: 'They are educational and cheap.', tag: 'beneficence',
  opts: [
    { t: 'Accept them — they help patients and have little value.' },
    { t: 'Decline: all industry gifts are banned.', why: 'Low-value items that directly benefit patients are acceptable.' },
    { t: 'Accept only if they include a drug discount coupon.', why: 'The value is the patient benefit, not promotion.' },
    { t: 'Accept and keep them for your own use.', why: 'They are for patients.' },
  ],
  rule: 'Low-value industry items that directly benefit patients may be accepted.',
  hy: [] });

// ── Autonomy & consent ─────────────────────────────────────────────────────
add('consent', { id: 'c1', who: '🙏', name: 'Adult patient',
  says: 'My faith doesn’t allow this treatment. I understand what could happen, and I still say no.',
  ctx: 'He is alert, oriented and has capacity.', tag: 'autonomy',
  opts: [
    { t: 'Explain all options, confirm he understands the consequences, and respect his refusal.' },
    { t: 'Treat him anyway because the risk is high.', why: 'A capable adult may refuse any treatment.' },
    { t: 'Ask his family to persuade him.', why: 'Pressure undermines autonomy; the decision is his.' },
    { t: 'Seek a court order to treat.', why: 'Courts are for minors or incapable patients, not capable adults.' },
  ],
  rule: 'A capable adult can refuse treatment, even life-saving treatment.',
  hy: [] });

add('consent', { id: 'c2', who: '🚑', name: 'Unconscious trauma patient’s friend',
  says: 'Don’t give her blood! She’s a Jehovah’s Witness — I’m sure of it.',
  ctx: 'No card, no directive, family unreachable; she is bleeding heavily before surgery.', tag: 'beneficence',
  opts: [
    { t: 'Transfuse — her wishes cannot be verified and no surrogate is present.' },
    { t: 'Withhold blood out of respect for her faith.', why: 'An unverifiable claim does not override life-saving care.' },
    { t: 'Wait until the family can be reached.', why: 'Delay could be fatal.' },
    { t: 'Ask the friend to sign consent instead.', why: 'A friend is not a legal surrogate here.' },
  ],
  rule: 'Without clear documented wishes or a surrogate, give emergency life-saving treatment.',
  hy: ['A wallet card or advance directive WOULD be honoured for an adult.'] });

add('consent', { id: 'c3', who: '🌿', name: 'Patient with high cholesterol',
  says: 'I’d rather try a herbal supplement than take my statin.',
  ctx: 'She seems firm in her preference.', tag: 'autonomy',
  opts: [
    { t: 'Ask why, check the supplement for interactions and safety, and integrate it if it is harmless.' },
    { t: 'Tell her herbal remedies are nonsense.', why: 'Do not belittle the patient’s choice.' },
    { t: 'Refuse to see her unless she takes the statin.', why: 'Abandonment — not acceptable.' },
    { t: 'Stop the statin immediately as she requests, without discussion.', why: 'Explore the reason and counsel first.' },
  ],
  rule: 'Explore, check safety, and respect complementary therapy that poses no risk.',
  hy: [] });

add('consent', { id: 'c4', who: '👫', name: 'Patient’s husband',
  says: 'How is my wife really doing? What’s her prognosis?',
  ctx: 'She has not said you may share her information.', tag: 'confidentiality',
  opts: [
    { t: 'Explain that you need her permission before sharing any details.' },
    { t: 'Tell him — spouses have a right to know.', why: 'Spouses have no automatic right to medical information.' },
    { t: 'Share only the good news.', why: 'Still disclosure without consent.' },
    { t: 'Say she is fine to avoid worrying him.', why: 'Never lie; just ask for consent.' },
  ],
  rule: 'Share health information only with the patient’s explicit consent.',
  hy: [] });

add('consent', { id: 'c5', who: '🩺', name: 'Your attending',
  says: 'I’m doing the procedure in 20 minutes — you go and get the consent signed.',
  ctx: 'You are an intern who will not perform the procedure.', tag: 'professionalism',
  opts: [
    { t: 'Respectfully explain that the person performing the procedure should obtain consent.' },
    { t: 'Get the signature — it is just paperwork.', why: 'Consent is a discussion of risks and alternatives by the operator.' },
    { t: 'Ask a nurse to get it signed instead.', why: 'Same problem — the operator obtains consent.' },
    { t: 'Skip consent since the procedure is urgent.', why: 'Urgent is not emergent; consent is still needed.' },
  ],
  rule: 'Informed consent is obtained by the clinician who performs the procedure.',
  hy: ['Valid consent: capacity, disclosure (risks, benefits, alternatives), understanding, voluntariness.'] });

add('consent', { id: 'c6', who: '🔪', name: 'Scrub nurse',
  says: 'Look — there’s a small benign-looking ovarian cyst. Want to take it out while we’re in?',
  ctx: 'It is not life-threatening; there is no medical power of attorney.', tag: 'autonomy',
  opts: [
    { t: 'Finish the planned operation and get consent for the cyst once she is awake.' },
    { t: 'Remove it now to spare her a second operation.', why: 'Non-emergency procedures need the patient’s consent.' },
    { t: 'Call her husband for permission and proceed.', why: 'The patient can decide herself once awake.' },
    { t: 'Remove it and tell her afterwards.', why: 'Consent cannot be obtained retroactively.' },
  ],
  rule: 'Non-urgent incidental findings wait for the patient’s own consent.',
  hy: ['A LIFE-THREATENING finding can be treated immediately — consent is waived to prevent imminent harm.'] });

add('consent', { id: 'c7', who: '🩸', name: 'Anaesthetist',
  says: 'That’s a ruptured aneurysm we didn’t expect. She’ll die without repair now.',
  ctx: 'The patient is under anaesthesia.', tag: 'beneficence',
  opts: [
    { t: 'Repair it now — consent is waived for an immediate threat to life.' },
    { t: 'Close and consent her for a second operation.', why: 'She may die before waking — this is an emergency.' },
    { t: 'Find the next of kin before proceeding.', why: 'Delay is dangerous; emergency exception applies.' },
    { t: 'Ask the ethics committee.', why: 'No time — act in the emergency.' },
  ],
  rule: 'In an emergency, treat to prevent imminent death or serious harm.',
  hy: [] });

add('consent', { id: 'c8', who: '✂️', name: 'Male patient',
  says: 'I’d like a vasectomy.',
  ctx: 'His wife, also your patient, recently told you she wants to conceive soon.', tag: 'confidentiality',
  opts: [
    { t: 'Explore his reasons, explain risks and alternatives, and encourage him to discuss it with his wife.' },
    { t: 'Tell him his wife wants a baby.', why: 'Breaches her confidentiality.' },
    { t: 'Require his wife’s consent first.', why: 'A spouse’s consent is not required.' },
    { t: 'Refuse the referral.', why: 'He is entitled to make the decision.' },
  ],
  rule: 'Spousal consent is not required for a patient’s own procedure — but encourage communication.',
  hy: [] });

// ── Shared decisions & futility ────────────────────────────────────────────
add('decisions', { id: 'd1', who: '🙋', name: 'Patient',
  says: 'I want this elective procedure — will you do it?',
  ctx: 'It conflicts with your personal beliefs; it is not an emergency.', tag: 'autonomy',
  opts: [
    { t: 'Give balanced information on all options, explain you won’t perform it, and transfer care to a qualified colleague.' },
    { t: 'Refuse and say nothing more.', why: 'You must still inform and ensure access to care.' },
    { t: 'Try to talk her out of it based on your beliefs.', why: 'Information must be impartial.' },
    { t: 'Perform it despite your objection.', why: 'Conscientious objection is allowed for non-emergencies — with transfer.' },
  ],
  rule: 'You may decline a non-emergency procedure on conscience grounds, but must inform and transfer.',
  hy: [] });

add('decisions', { id: 'd2', who: '🧲', name: 'Worried patient',
  says: 'I want an MRI of my back. My friend had one.',
  ctx: 'It is not indicated.', tag: 'nonmaleficence',
  opts: [
    { t: 'Ask what worries him, address it, and do not order an unnecessary test.' },
    { t: 'Order it to keep him satisfied.', why: 'Unnecessary tests cause harm and cost.' },
    { t: 'Refer him to another doctor who might order it.', why: 'Do not pass the problem on.' },
    { t: 'Refuse to discuss it further.', why: 'Explore the underlying concern.' },
  ],
  rule: 'Do not provide unnecessary interventions — explore the concern behind the request.',
  hy: [] });

add('decisions', { id: 'd3', who: '💊', name: 'Patient',
  says: 'I don’t want that pill you prescribed. What about the one I saw on TV?',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Ask open-ended questions about his understanding and preferences, correct misconceptions, and compare both options.' },
    { t: 'Insist on the original prescription.', why: 'Shared decision-making means exploring his view.' },
    { t: 'Switch to the advertised drug without discussion.', why: 'Discuss the pros and cons first.' },
    { t: 'Tell him TV adverts are always lies.', why: 'Dismissive; explore instead.' },
  ],
  rule: 'Shared decision-making: explore beliefs, correct misconceptions, compare options.',
  hy: [] });

add('decisions', { id: 'd4', who: '💔', name: 'Wife of a trauma patient',
  says: 'Please, keep doing CPR! Don’t stop!',
  ctx: 'Over 30 minutes of high-quality CPR, no shockable rhythm, no ROSC; death has been pronounced.', tag: 'nonmaleficence',
  opts: [
    { t: 'Gently tell her he has died and explain that everything possible was done.' },
    { t: 'Restart CPR for her sake.', why: 'Physicians need not provide futile treatment.' },
    { t: 'Ask her to leave the room.', why: 'She needs compassionate disclosure.' },
    { t: 'Continue CPR until she agrees to stop.', why: 'Futile — and prolongs her distress.' },
  ],
  rule: 'Physicians are not obliged to provide futile treatment.',
  hy: [] });

add('decisions', { id: 'd5', who: '🫀', name: 'Family at the bedside',
  says: 'He moved his leg when we touched him — he can’t be dead! Keep the ventilator on.',
  ctx: 'Brain death has been confirmed.', tag: 'nonmaleficence',
  opts: [
    { t: 'Explain that brain death is death and the movement is a spinal reflex; involve the ethics committee if they insist.' },
    { t: 'Keep the ventilator on indefinitely.', why: 'Futile — brain death is legal death.' },
    { t: 'Switch it off immediately without discussion.', why: 'Explain compassionately first.' },
    { t: 'Repeat the brain-death tests every day.', why: 'The diagnosis is already confirmed.' },
  ],
  rule: 'Brain death = death; spinal reflexes can persist.',
  hy: ['Unresolved disputes over futile care go to the ethics committee.'] });

// ── Capacity & surrogates ──────────────────────────────────────────────────
add('capacity', { id: 'p1', who: '📜', name: 'Distraught spouse',
  says: 'He’s arresting — do everything!',
  ctx: 'He has a written directive refusing CPR and confirmed it on admission.', tag: 'autonomy',
  opts: [
    { t: 'Honour the advance directive and explain this to his wife compassionately.' },
    { t: 'Resuscitate — the wife is next of kin.', why: 'The patient’s own documented wishes come first.' },
    { t: 'Start CPR and stop if she agrees later.', why: 'Violates his directive.' },
    { t: 'Call the ethics committee first.', why: 'The directive is clear and recent.' },
  ],
  rule: 'Follow a valid advance directive unless the patient has more recently said otherwise.',
  hy: [] });

add('capacity', { id: 'p2', who: '🍺', name: 'Intoxicated patient',
  says: 'I’m LEAVING. Touch me and my lawyer will sue all of you!',
  ctx: 'He is acutely drunk and confused, and leaving would be dangerous.', tag: 'capacity',
  opts: [
    { t: 'Assess capacity (impaired), explain the danger, keep him, and reassess when sober.' },
    { t: 'Let him go — adults may refuse care.', why: 'Only adults WITH capacity can; his is impaired.' },
    { t: 'Have him sign against medical advice and discharge.', why: 'AMA requires capacity.' },
    { t: 'Call his lawyer to discuss.', why: 'Irrelevant to his safety.' },
  ],
  rule: 'Capacity is decision-specific; intoxication impairs it.',
  hy: ['Capacity: understand, appreciate, reason, communicate a choice.'] });

add('capacity', { id: 'p3', who: '🏘️', name: 'Neighbour in the ER',
  says: 'He always said he’d never want dialysis or anything to keep him alive.',
  ctx: 'He is unresponsive; no written directive. His only relative is an estranged father.', tag: 'capacity',
  opts: [
    { t: 'Try to reach the father as next of kin; if he can’t be found, the neighbour may act as surrogate.' },
    { t: 'Follow the neighbour’s word immediately.', why: 'Next of kin comes first.' },
    { t: 'Ignore the father because they are estranged.', why: 'Estrangement does not remove next-of-kin status.' },
    { t: 'Ask for a court-appointed guardian before anything.', why: 'Try the legal surrogate hierarchy first.' },
  ],
  rule: 'No capacity and no directive → surrogate, starting with next of kin.',
  hy: ['Surrogates decide by substituted judgment — what the patient would want.'] });

add('capacity', { id: 'p4', who: '👵', name: 'Patient’s sister',
  says: 'She needs a feeding tube! Her husband is wrong to refuse it.',
  ctx: 'A 91-year-old who cannot communicate; no directive.', tag: 'capacity',
  opts: [
    { t: 'Hold a family meeting about her likely wishes; if no agreement, the husband decides.' },
    { t: 'Side with the sister — nutrition is basic care.', why: 'The spouse is higher in the surrogate order.' },
    { t: 'Place the tube until the dispute is settled.', why: 'The legal surrogate has declined.' },
    { t: 'Let the doctor decide.', why: 'The surrogate decides, guided by her wishes.' },
  ],
  rule: 'Surrogate order: spouse → adult children → parents → siblings → others.',
  hy: [] });

add('capacity', { id: 'p5', who: '🔄', name: 'Patient with schizophrenia and cancer',
  says: 'I’ve changed my mind. I want the feeding tube after all.',
  ctx: 'His brother (his medical power of attorney) strongly disagrees.', tag: 'capacity',
  opts: [
    { t: 'Reassess his capacity — have him explain his condition and the procedure — and follow his choice if capable.' },
    { t: 'Follow the brother; he holds power of attorney.', why: 'A POA only acts when the patient lacks capacity.' },
    { t: 'Refuse: schizophrenia means no capacity.', why: 'A diagnosis alone does not remove capacity.' },
    { t: 'Do whatever the patient said first.', why: 'The most recent capable decision counts.' },
  ],
  rule: 'A capable patient’s current wishes override their POA.',
  hy: [] });

add('capacity', { id: 'p6', who: '🎗️', name: 'Daughter with power of attorney',
  says: 'My mother must have every life-saving measure!',
  ctx: 'Her mother is alert, capable and clearly declines further intervention.', tag: 'autonomy',
  opts: [
    { t: 'Follow the mother’s own stated wishes and do not give life-saving measures.' },
    { t: 'Follow the daughter — she has POA.', why: 'POA is irrelevant while the patient has capacity.' },
    { t: 'Ask the ethics committee to decide.', why: 'There is no dilemma: the capable patient decides.' },
    { t: 'Compromise with limited treatment.', why: 'Overrides a capable refusal.' },
  ],
  rule: 'POA matters only when the patient lacks capacity.',
  hy: [] });

add('capacity', { id: 'p7', who: '🫶', name: 'Patient’s brother',
  says: 'I think she would want to donate her organs.',
  ctx: 'She is brain dead, no directive; her parents strongly refuse; her 17-year-old son can’t be reached.', tag: 'autonomy',
  opts: [
    { t: 'Do not proceed — her parents are the next of kin and they refuse.' },
    { t: 'Proceed with the brother’s consent.', why: 'Parents rank above siblings.' },
    { t: 'Wait for the 17-year-old son to decide.', why: 'A minor cannot act as surrogate.' },
    { t: 'Proceed — organ donation saves lives.', why: 'Consent from the right surrogate is required.' },
  ],
  rule: 'Without a directive, organ donation needs the next of kin’s consent.',
  hy: [] });

// ── Minors ─────────────────────────────────────────────────────────────────
add('minors', { id: 'm1', who: '🕵️', name: 'Mother of a 16-year-old',
  says: 'Just run a drug test with his routine bloods. Don’t tell him.',
  ctx: 'His examination is normal.', tag: 'autonomy',
  opts: [
    { t: 'Refuse to deceive him; explore her concerns, talk to him alone, and test only with his consent.' },
    { t: 'Run the test secretly — she is his parent.', why: 'Never deceive a patient.' },
    { t: 'Test him and share results only with her.', why: 'Needs his consent and an agreed disclosure plan.' },
    { t: 'Refuse to discuss drug use at all.', why: 'Her concern deserves exploration.' },
  ],
  rule: 'Do not drug-test an adolescent without consent (unless impaired mental status or danger).',
  hy: ['A positive test does not prove a substance use disorder.'] });

add('minors', { id: 'm2', who: '🪪', name: 'Card in the father’s wallet',
  says: '“No blood transfusions — for me and my son.”',
  ctx: 'Father and 13-year-old son are both bleeding internally after a crash.', tag: 'beneficence',
  opts: [
    { t: 'Transfuse the son; respect the father’s refusal for himself.' },
    { t: 'Transfuse neither — the card covers both.', why: 'Parents cannot refuse life-saving care for a minor.' },
    { t: 'Transfuse both — it is an emergency.', why: 'The adult’s documented refusal stands.' },
    { t: 'Seek a court order before treating the son.', why: 'Emergency: treat now.' },
  ],
  rule: 'Parents cannot refuse emergency life-saving treatment for their child.',
  hy: [] });

add('minors', { id: 'm3', who: '👶', name: 'Parents of an infant with cancer',
  says: 'We just want him comfortable. No chemotherapy.',
  ctx: 'The tumour is curable but fatal without treatment; it is not an emergency today.', tag: 'beneficence',
  opts: [
    { t: 'Explain the stakes; if they still refuse, seek a court order.' },
    { t: 'Respect their wishes — they are the parents.', why: 'Parents cannot refuse life-saving treatment for a child.' },
    { t: 'Start chemotherapy now without consent.', why: 'Not immediately emergent — go through the court.' },
    { t: 'Transfer the baby to another hospital.', why: 'Does not resolve the problem.' },
  ],
  rule: 'For a non-emergent but life-threatening condition, seek a court order.',
  hy: [] });

add('minors', { id: 'm4', who: '🍼', name: 'Parents of a jaundiced newborn',
  says: 'We’re taking her home now.',
  ctx: 'She has kernicterus needing exchange transfusion and phototherapy.', tag: 'beneficence',
  opts: [
    { t: 'Explain it is life-threatening, admit her, and treat.' },
    { t: 'Discharge with sunlight advice.', why: 'This is an emergency.' },
    { t: 'Get a court order first.', why: 'Too slow — treat now.' },
    { t: 'Let them sign against medical advice.', why: 'Parents cannot refuse emergency life-saving care.' },
  ],
  rule: 'Emergencies in children: treat immediately.',
  hy: [] });

add('minors', { id: 'm5', who: '🧒', name: 'Nurse',
  says: 'The 4-year-old needs surgery now, and we can’t reach either parent.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Proceed with the emergency surgery.' },
    { t: 'Wait until a parent is found.', why: 'Emergency exception applies.' },
    { t: 'Ask the grandparents over the phone first.', why: 'Not required in an emergency.' },
    { t: 'Get a court order.', why: 'No time — treat.' },
  ],
  rule: 'Parental consent is waived for emergency care of a minor.',
  hy: [] });

add('minors', { id: 'm6', who: '💊', name: '14-year-old girl',
  says: 'Can I get birth control? Please don’t tell my parents.',
  ctx: '', tag: 'confidentiality',
  opts: [
    { t: 'Counsel on safer sex, prescribe contraception, and encourage her to talk with her parents.' },
    { t: 'Refuse without parental consent.', why: 'Minors can consent to contraception.' },
    { t: 'Prescribe and call her parents.', why: 'Breaches her confidentiality.' },
    { t: 'Advise abstinence only.', why: 'Withholds effective care.' },
  ],
  rule: 'Minors can consent to contraception, STI care and prenatal care.',
  hy: ['Also substance use treatment in most states.'] });

add('minors', { id: 'm7', who: '🤰', name: 'Pregnant 15-year-old',
  says: 'I want to keep my baby, but my parents say I can’t.',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Support her decision, give information on all options, and encourage family communication.' },
    { t: 'Side with her parents — she is a minor.', why: 'A pregnant person of any age decides about the pregnancy.' },
    { t: 'Refer her to social services for removal.', why: 'Inappropriate escalation.' },
    { t: 'Tell her she must decide on adoption.', why: 'The choice is hers.' },
  ],
  rule: 'A pregnant patient of any age decides whether to continue the pregnancy.',
  hy: ['Parental involvement for abortion varies by state law.'] });

add('minors', { id: 'm8', who: '🦠', name: 'Teenager with an STI',
  says: 'Can you treat me without my parents finding out?',
  ctx: 'It is gonorrhoea.', tag: 'confidentiality',
  opts: [
    { t: 'Treat him, report to public health, and encourage him to notify partners from the last 60 days.' },
    { t: 'Inform his parents first.', why: 'Parental consent is not required for STI care.' },
    { t: 'Treat but do not report.', why: 'Gonorrhoea is reportable.' },
    { t: 'Tell his partners yourself without asking.', why: 'Use confidential partner notification if he refuses.' },
  ],
  rule: 'STI treatment needs no parental consent; reportable diseases are still reported.',
  hy: [] });

add('minors', { id: 'm9', who: '😤', name: 'Mother at a 15-year-old’s check-up',
  says: 'Tell her off! She eats junk and sleeps all day.',
  ctx: '', tag: 'confidentiality',
  opts: [
    { t: 'Acknowledge the mother’s concern, ask her to step out, and talk to the teen privately and respectfully.' },
    { t: 'Scold the teenager as asked.', why: 'Damages trust; respect her developing independence.' },
    { t: 'Ignore the mother.', why: 'Address the parent’s concerns too.' },
    { t: 'Have the conversation with both present.', why: 'Adolescents need time alone with the physician.' },
  ],
  rule: 'Give adolescents private time with the physician.',
  hy: ['If a parent refuses to leave, offer a chaperone; if still refused, document it.'] });

add('minors', { id: 'm10', who: '💉', name: 'Parents at a well-child visit',
  says: 'We don’t want any vaccines for her.',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Address their concerns with accurate information, document the refusal, and revisit later.' },
    { t: 'Vaccinate anyway — it is in her interest.', why: 'Never vaccinate without parental consent.' },
    { t: 'Dismiss them from the practice.', why: 'Keep the relationship and keep talking.' },
    { t: 'Report them to child protective services.', why: 'Vaccine refusal is not abuse.' },
  ],
  rule: 'Respect vaccine refusal, educate, document and revisit.',
  hy: [] });

add('minors', { id: 'm11', who: '🍎', name: 'Mother of a child with strep throat',
  says: 'No antibiotics. I’ll use apple cider vinegar and ginger.',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Stay nonjudgmental, explain why antibiotics are advised and the risks, and arrange follow-up.' },
    { t: 'Call child protective services.', why: 'Low-risk choices are the parents’ right.' },
    { t: 'Insist and refuse further visits.', why: 'Keep trust and the relationship.' },
    { t: 'Get a court order.', why: 'Not life-threatening — disproportionate.' },
  ],
  rule: 'Parents may choose complementary therapy if it is not high-risk.',
  hy: [] });

add('minors', { id: 'm12', who: '🩹', name: 'Parent of a 6-year-old',
  says: 'He fell off the sofa.',
  ctx: 'The injuries do not match the story.', tag: 'safety',
  opts: [
    { t: 'Interview the child separately, document carefully, treat, admit if unsafe, and notify CPS.' },
    { t: 'Accept the explanation.', why: 'Inconsistent injuries need investigation.' },
    { t: 'Confront the parent with accusations.', why: 'Stay neutral; protect the child and report.' },
    { t: 'Report only if the child confirms abuse.', why: 'Reasonable suspicion is enough to report.' },
  ],
  rule: 'Suspected child abuse is a mandatory report to CPS.',
  hy: [] });

add('minors', { id: 'm13', who: '🏠', name: '17-year-old who lives alone',
  says: 'I support myself. Can I sign for my own lipoma removal?',
  ctx: 'No contact with parents for a year.', tag: 'autonomy',
  opts: [
    { t: 'Yes — an emancipated minor can consent to their own care.' },
    { t: 'No — he needs a parent’s signature.', why: 'Emancipated minors consent for themselves.' },
    { t: 'Wait until he turns 18.', why: 'No need to delay.' },
    { t: 'Ask a court to approve.', why: 'Not required.' },
  ],
  rule: 'Emancipated minors (self-supporting, married, military, parents) consent for themselves.',
  hy: [] });

// ── Records & reporting ────────────────────────────────────────────────────
add('reporting', { id: 'r1', who: '🙈', name: 'Embarrassed patient',
  says: 'I work in management here. Please change what you wrote in my chart.',
  ctx: '', tag: 'professionalism',
  opts: [
    { t: 'Decline to alter the record and reassure her it is confidential.' },
    { t: 'Change the wording to something vaguer.', why: 'Falsifying records is never acceptable.' },
    { t: 'Delete the entry entirely.', why: 'Falsification.' },
    { t: 'Keep a separate private record instead.', why: 'Still falsifying the official chart.' },
  ],
  rule: 'Never falsify or alter medical records.',
  hy: [] });

add('reporting', { id: 'r2', who: '🚗', name: 'Patient with Parkinson disease',
  says: 'I still drive to the shops and my appointments.',
  ctx: 'You are worried he is no longer safe to drive.', tag: 'safety',
  opts: [
    { t: 'Share your concerns, encourage further evaluation, and if you must report to the licensing authority, tell him first.' },
    { t: 'Secretly report him to the DMV.', why: 'Discuss and inform before reporting.' },
    { t: 'Confiscate his car keys.', why: 'Not your role.' },
    { t: 'Do nothing — driving is his business.', why: 'Public safety and state reporting laws apply.' },
  ],
  rule: 'Discuss driving concerns with the patient; report per state law and tell him first.',
  hy: [] });

add('reporting', { id: 'r3', who: '🌧️', name: 'Patient',
  says: 'My husband hits me.',
  ctx: '', tag: 'safety',
  opts: [
    { t: 'Assess her safety, help with a safety plan, offer support and counselling, and document carefully.' },
    { t: 'Tell her she must leave him.', why: 'Do not counsel her to leave — support her choices.' },
    { t: 'Call the police right away.', why: 'Do not report adult IPV without consent unless state law requires.' },
    { t: 'Confront her husband.', why: 'May increase her danger.' },
  ],
  rule: 'Intimate partner violence: safety plan, support, document — the adult patient decides.',
  hy: [] });

add('reporting', { id: 'r4', who: '🧓', name: 'Incapacitated 82-year-old',
  says: '…',
  ctx: 'Unexplained bruises, dehydration and malnutrition.', tag: 'safety',
  opts: [
    { t: 'Document the warning signs thoroughly and notify Adult Protective Services.' },
    { t: 'Ask the caregiver to explain and drop it if reasonable.', why: 'Suspicion warrants reporting.' },
    { t: 'Wait until the patient can confirm abuse.', why: 'He cannot speak for himself — report.' },
    { t: 'Discharge him home with the caregiver.', why: 'Potentially unsafe.' },
  ],
  rule: 'Suspected elder abuse is reported (Adult Protective Services).',
  hy: [] });

// ── Disclosure & errors ────────────────────────────────────────────────────
add('disclosure', { id: 'x1', who: '🤫', name: 'Patient’s children',
  says: 'Please don’t tell Dad it’s cancer. It will crush him.',
  ctx: 'He has capacity.', tag: 'autonomy',
  opts: [
    { t: 'Explore their fears, then ask the patient how much he wants to know and disclose accordingly.' },
    { t: 'Agree to keep it from him.', why: 'The patient has the right to his diagnosis.' },
    { t: 'Tell him everything immediately regardless of his wishes.', why: 'First ask how much he wants to know.' },
    { t: 'Let the family tell him later.', why: 'Disclosure is the physician’s duty.' },
  ],
  rule: 'Disclose to the patient according to their own preferences, not the family’s.',
  hy: ['Therapeutic privilege (withholding because of serious self-harm risk) is rare.'] });

add('disclosure', { id: 'x2', who: '🙉', name: 'Patient',
  says: 'Really — I don’t want to know my results.',
  ctx: 'He repeats this when asked again.', tag: 'autonomy',
  opts: [
    { t: 'Respect it, explore why, and ask whom he would like the results shared with.' },
    { t: 'Tell him anyway — he needs to know.', why: 'Patients may decline information.' },
    { t: 'Tell his wife without asking him.', why: 'Ask him whom to inform.' },
    { t: 'Stop his treatment.', why: 'Not knowing does not mean no treatment.' },
  ],
  rule: 'Patients may decline to know their diagnosis.',
  hy: [] });

add('disclosure', { id: 'x3', who: '🧑‍🎓', name: 'Patient (to you, a medical student)',
  says: 'Just tell me — is it cancer?',
  ctx: '', tag: 'professionalism',
  opts: [
    { t: 'Be honest that you can’t share that, and that the senior team will discuss it with them.' },
    { t: 'Tell them what you saw in the chart.', why: 'Students do not disclose diagnoses.' },
    { t: 'Say it is probably nothing to worry about.', why: 'Never mislead.' },
    { t: 'Change the subject.', why: 'Be honest about your role.' },
  ],
  rule: 'Medical students do not disclose diagnoses — the senior team does.',
  hy: [] });

add('disclosure', { id: 'x4', who: '📞', name: 'Insurance company',
  says: 'How long will the patient stay? Also, what’s her full history?',
  ctx: '', tag: 'confidentiality',
  opts: [
    { t: 'Give only the specific information requested and needed (expected length of stay).' },
    { t: 'Share the full record to speed approval.', why: 'Minimum necessary disclosure only.' },
    { t: 'Refuse to say anything.', why: 'Needed information can be shared.' },
    { t: 'Share everything if they promise confidentiality.', why: 'Still more than necessary.' },
  ],
  rule: 'Share only the minimum necessary information.',
  hy: [] });

add('disclosure', { id: 'x5', who: '🎗️', name: 'Patient newly diagnosed with HIV',
  says: 'I’m not telling my partner.',
  ctx: '', tag: 'confidentiality',
  opts: [
    { t: 'Report to public health, encourage disclosure, and use confidential partner notification if he refuses.' },
    { t: 'Call the partner yourself immediately.', why: 'Use the health department’s procedure.' },
    { t: 'Keep it confidential and do nothing.', why: 'HIV is reportable and the partner is at risk.' },
    { t: 'Refuse to treat until he tells.', why: 'Never withhold treatment.' },
  ],
  rule: 'Reportable diseases are reported; partner notification goes through public health.',
  hy: [] });

add('disclosure', { id: 'x6', who: '😬', name: 'Colleague',
  says: 'I gave the wrong dose. I don’t think anyone noticed…',
  ctx: 'It may have serious consequences.', tag: 'professionalism',
  opts: [
    { t: 'Talk privately with the colleague, make sure the patient is told, and push for system changes.' },
    { t: 'Keep it secret to protect the colleague.', why: 'Patients must be told about errors.' },
    { t: 'Report the colleague to the licensing board first.', why: 'Disclosure and care come first; not misconduct.' },
    { t: 'Tell the patient it was the colleague’s fault.', why: 'Focus on disclosure and care, not blame.' },
  ],
  rule: 'Disclose medical errors to the patient and fix the system.',
  hy: [] });

add('disclosure', { id: 'x7', who: '🧪', name: 'Patient',
  says: 'Wait — this isn’t the test I was supposed to have?',
  ctx: 'A wrong test was done; no harm resulted.', tag: 'professionalism',
  opts: [
    { t: 'Tell the patient what happened, apologise, and express regret.' },
    { t: 'Say nothing since there was no harm.', why: 'Disclose even without harm.' },
    { t: 'Blame the lab.', why: 'Be honest and apologise.' },
    { t: 'Cover it by ordering the right test quietly.', why: 'Still requires disclosure.' },
  ],
  rule: 'Disclose and apologise for errors even when no harm occurred.',
  hy: [] });

add('disclosure', { id: 'x8', who: '🌑', name: 'Patient',
  says: 'I have a plan to end my life this weekend.',
  ctx: '', tag: 'safety',
  opts: [
    { t: 'Assess the risk, offer voluntary admission, and admit involuntarily if she refuses.' },
    { t: 'Respect her autonomy and arrange follow-up.', why: 'Imminent risk overrides autonomy.' },
    { t: 'Tell her family but let her go home.', why: 'Unsafe — admit.' },
    { t: 'Prescribe an antidepressant and review in 4 weeks.', why: 'Too slow for an active plan.' },
  ],
  rule: 'Imminent suicide risk → voluntary admission, or involuntary if refused.',
  hy: [] });

add('disclosure', { id: 'x9', who: '🔫', name: 'Patient',
  says: 'I’m going to shoot my neighbour.',
  ctx: 'He names the person and owns a gun.', tag: 'safety',
  opts: [
    { t: 'Assess the threat and break confidentiality: warn the person at risk and notify law enforcement.' },
    { t: 'Keep it confidential.', why: 'Duty to protect (Tarasoff) overrides.' },
    { t: 'Only document it.', why: 'You must act on a serious, imminent threat.' },
    { t: 'Discharge him from your practice.', why: 'Does not protect anyone.' },
  ],
  rule: 'Serious, imminent threat to an identifiable person → warn and notify police (Tarasoff).',
  hy: [] });

add('disclosure', { id: 'x10', who: '🔬', name: 'Trial participant',
  says: 'I don’t want to be in the study anymore.',
  ctx: 'He consented fully at the start.', tag: 'autonomy',
  opts: [
    { t: 'Accept it, ask why (to catch adverse events), and clarify whether he wants full or partial withdrawal.' },
    { t: 'Remind him he signed and must finish.', why: 'Participants may withdraw at any time.' },
    { t: 'Delete all the data already collected.', why: 'Data collected so far may be kept.' },
    { t: 'Keep contacting him for follow-up anyway.', why: 'Not after full withdrawal.' },
  ],
  rule: 'Research participants can withdraw at any time without penalty.',
  hy: [] });

add('disclosure', { id: 'x11', who: '😠', name: 'Patient',
  says: 'Dr. Smith across town was so rude to me.',
  ctx: 'Dr. Smith is not part of your practice.', tag: 'professionalism',
  opts: [
    { t: 'Encourage the patient to raise the concern with that physician directly.' },
    { t: 'Agree that Dr. Smith is unprofessional.', why: 'Do not criticise colleagues.' },
    { t: 'Call Dr. Smith on her behalf.', why: 'Encourage her to address it herself.' },
    { t: 'Report Dr. Smith to the board.', why: 'Rudeness is not misconduct.' },
  ],
  rule: 'Complaints about another physician: encourage direct communication (handle your own staff yourself).',
  hy: [] });

// ── Colleagues & system ────────────────────────────────────────────────────
add('colleagues', { id: 'g1', who: '💳', name: 'Registration clerk',
  says: 'Chest pain guy has no insurance. Should we send him to the county hospital?',
  ctx: 'He has features of an MI.', tag: 'justice',
  opts: [
    { t: 'Screen, treat and stabilise him regardless of ability to pay (EMTALA).' },
    { t: 'Transfer him to the county hospital.', why: 'EMTALA forbids transfer for payment reasons before stabilisation.' },
    { t: 'Ask for a deposit first.', why: 'Payment cannot delay emergency care.' },
    { t: 'Give aspirin and discharge.', why: 'An emergency must be stabilised.' },
  ],
  rule: 'EMTALA: emergency departments must screen and stabilise everyone, including labour.',
  hy: [] });

add('colleagues', { id: 'g2', who: '📆', name: 'Patient',
  says: 'I keep forgetting my pills… and they’re expensive.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Identify the barriers without judgment and adapt the regimen (cheaper, simpler, reminders, teach-back).' },
    { t: 'Refer to another physician.', why: 'Work with him yourself.' },
    { t: 'Warn him of the consequences sternly.', why: 'Nonjudgmental problem-solving works better.' },
    { t: 'Add more drugs to compensate.', why: 'Makes adherence worse.' },
  ],
  rule: 'Nonadherence: find the barrier and adapt the plan.',
  hy: [] });

add('colleagues', { id: 'g3', who: '🎓', name: 'Medical student',
  says: 'Can I scrub in on Mrs. Lee’s operation?',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Introduce the student by name and training status to the patient and ask for her consent.' },
    { t: 'Let him scrub in — teaching hospitals assume consent.', why: 'The patient must agree.' },
    { t: 'Introduce him as a junior doctor.', why: 'Never misrepresent training status.' },
    { t: 'Ask after she is anaesthetised.', why: 'Consent must come first.' },
  ],
  rule: 'Patients consent to student involvement, with honest introductions.',
  hy: [] });

add('colleagues', { id: 'g4', who: '☕', name: 'Colleague not on the team',
  says: 'How’s my friend doing in bed 4?',
  ctx: '', tag: 'confidentiality',
  opts: [
    { t: 'Empathise but explain you can’t share without the patient’s permission.' },
    { t: 'Share — he is a doctor.', why: 'Not involved in care = no access.' },
    { t: 'Let him read the chart.', why: 'Same breach.' },
    { t: 'Share the basics only.', why: 'Still a breach without consent.' },
  ],
  rule: 'Colleagues outside the care team have no right to patient information.',
  hy: [] });

add('colleagues', { id: 'g5', who: '🥴', name: 'Colleague',
  says: '(slurring, smelling of alcohol on shift) I’m fine, I’m fine.',
  ctx: '', tag: 'safety',
  opts: [
    { t: 'Report to the hospital or a physician health programme.' },
    { t: 'Cover for him this once.', why: 'Patient safety comes first.' },
    { t: 'Call the police.', why: 'Use the hospital/physician health route.' },
    { t: 'Confront him publicly on the ward.', why: 'Unprofessional and does not ensure safety.' },
  ],
  rule: 'An impaired colleague is reported to the hospital or physician health programme.',
  hy: [] });

add('colleagues', { id: 'g6', who: '🛍️', name: 'Colleague',
  says: 'Sometimes I nip out to run errands during my shift.',
  ctx: '', tag: 'professionalism',
  opts: [
    { t: 'Report it to hospital authorities (chair/CMO); the licensing board if patients are endangered.' },
    { t: 'Ignore it — not your business.', why: 'Abandoning shifts can harm patients.' },
    { t: 'Tell patients about it.', why: 'Use the proper channels.' },
    { t: 'Report directly to the police.', why: 'Not a criminal matter.' },
  ],
  rule: 'Unprofessional conduct goes to hospital authorities first.',
  hy: [] });

add('colleagues', { id: 'g7', who: '💸', name: 'You notice…',
  says: 'A colleague sends all his Medicare patients to his own physio clinic — whether they need it or not.',
  ctx: '', tag: 'justice',
  opts: [
    { t: 'Report to the state medical board and the CMS office for suspected billing fraud.' },
    { t: 'Speak to him informally and leave it.', why: 'Fraud must be reported.' },
    { t: 'Tell his patients to stop going.', why: 'Use the official channels.' },
    { t: 'Report only to your department chair.', why: 'Billing fraud goes to the board and CMS.' },
  ],
  rule: 'Suspected Medicare/Medicaid fraud → state board and CMS.',
  hy: [] });

add('colleagues', { id: 'g8', who: '🪦', name: 'Resident',
  says: 'He just died. Can I practise a central line on him?',
  ctx: 'No directive, no contacts on file.', tag: 'autonomy',
  opts: [
    { t: 'Try to contact the family — practising procedures needs next-of-kin consent.' },
    { t: 'Go ahead; it’s non-invasive enough.', why: 'Consent is required regardless of invasiveness.' },
    { t: 'Go ahead if supervised.', why: 'Supervision does not replace consent.' },
    { t: 'Go ahead — the dead have no rights.', why: 'Respect for the deceased and family.' },
  ],
  rule: 'Training procedures on the newly deceased require next-of-kin consent.',
  hy: [] });

add('colleagues', { id: 'g9', who: '🧬', name: 'Patient with < 6 months to live',
  says: 'You say hospice, my neurologist says a new trial. Who do I listen to?',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Explain both options’ risks and benefits; the patient decides, then coordinate with the neurologist.' },
    { t: 'Tell her to follow you.', why: 'The patient decides.' },
    { t: 'Defer completely to the specialist.', why: 'Inform her fully.' },
    { t: 'Ask the ethics committee.', why: 'Not a dispute — an informed choice.' },
  ],
  rule: 'When doctors disagree, inform the patient — the patient chooses.',
  hy: [] });

// ── End of life ────────────────────────────────────────────────────────────
add('endoflife', { id: 'e1', who: '🥀', name: 'Terminally ill patient',
  says: 'I want you to help me end my life.',
  ctx: 'Your state does not permit physician-assisted death.', tag: 'beneficence',
  opts: [
    { t: 'Explore the reasons with empathy and optimise palliative care (eg pain control).' },
    { t: 'Prescribe a lethal dose discreetly.', why: 'Illegal in most states.' },
    { t: 'Refuse and end the conversation.', why: 'Explore suffering and address it.' },
    { t: 'Refer to psychiatry and step back.', why: 'Stay involved; treat the suffering.' },
  ],
  rule: 'Respond to requests for assisted death with empathy and better palliative care.',
  hy: [] });

add('endoflife', { id: 'e2', who: '🏠', name: 'Hospice patient with glioblastoma',
  says: 'The pain is terrible, but I already take too many pills.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Prioritise pain control; stop preventive drugs (statin, aspirin, antihypertensives) instead.' },
    { t: 'Stop her analgesics to reduce pill burden.', why: 'Comfort drugs are the priority.' },
    { t: 'Avoid opioids because of respiratory depression.', why: 'Double effect allows comfort-focused dosing.' },
    { t: 'Change nothing.', why: 'Address both pain and pill burden.' },
  ],
  rule: 'End of life: keep comfort drugs, deprescribe preventive ones.',
  hy: ['Principle of double effect: comfort dosing is acceptable even if it may hasten death.'] });

add('endoflife', { id: 'e3', who: '❤️‍🩹', name: '70-year-old with suspected MI',
  says: 'I signed a DNR a while ago.',
  ctx: '', tag: 'autonomy',
  opts: [
    { t: 'Confirm the DNR with her, document it, and give all appropriate treatment short of resuscitation.' },
    { t: 'Withhold all treatment because of the DNR.', why: 'DNR ≠ do not treat.' },
    { t: 'Ignore the DNR — this is acute.', why: 'Honour her documented wishes.' },
    { t: 'Ask her family to confirm instead.', why: 'Ask the patient herself.' },
  ],
  rule: 'A DNR means no CPR — not no treatment.',
  hy: [] });

// ── Hard conversations ─────────────────────────────────────────────────────
add('counseling', { id: 'h1', who: '🗣️', name: 'Patient',
  says: 'Could you talk to my sister? She won’t listen to me.',
  ctx: '', tag: 'professionalism',
  opts: [
    { t: 'Avoid triangulation — encourage her to speak to her sister directly.' },
    { t: 'Call the sister and mediate.', why: 'Triangulation.' },
    { t: 'Tell her it’s not your problem.', why: 'Be supportive while redirecting.' },
    { t: 'Prescribe a sedative for the stress.', why: 'Not indicated.' },
  ],
  rule: 'Avoid triangulation in family conflict (unless abuse or neglect).',
  hy: ['If the relative is also your patient: a family meeting or family therapy referral.'] });

add('counseling', { id: 'h2', who: '🪞', name: 'Patient after mastectomy',
  says: 'I feel so ugly now.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Express empathy and invite her to talk about her feelings.' },
    { t: '“Don’t worry, you look fine!”', why: 'Simplistic reassurance shuts down feelings.' },
    { t: 'Refer to plastic surgery right away.', why: 'Listen first.' },
    { t: 'Change the subject to follow-up scans.', why: 'Ignores her emotional need.' },
  ],
  rule: 'Respond to emotion with empathy and open questions — not false reassurance.',
  hy: [] });

add('counseling', { id: 'h3', who: '🧸', name: '6-year-old whose sibling died',
  says: 'It’s my fault because I was mean to him.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Use simple, honest words, reassure clearly that it is not their fault, and help name feelings.' },
    { t: 'Say the sibling is “just sleeping”.', why: 'Avoid euphemisms — they confuse children.' },
    { t: 'Avoid the topic to protect them.', why: 'Children need honest explanation.' },
    { t: 'Tell them they will understand when older.', why: 'Address the guilt now.' },
  ],
  rule: 'Children grasp that death is final around 5–7 years — be simple and honest.',
  hy: [] });

add('counseling', { id: 'h4', who: '🕊️', name: 'Mother with fetal demise at 22 weeks',
  says: 'Is there… really no heartbeat?',
  ctx: 'An emergency delivery is needed.', tag: 'beneficence',
  opts: [
    { t: 'Acknowledge her grief, ensure privacy, and offer to let her see and hold the baby.' },
    { t: 'Move quickly to the consent form.', why: 'Acknowledge the loss first.' },
    { t: 'Tell her she can try again soon.', why: 'Minimises her grief.' },
    { t: 'Discourage seeing the baby.', why: 'Offer it — many parents find it helps.' },
  ],
  rule: 'Perinatal loss: empathy, privacy, and the choice to see and hold the baby.',
  hy: [] });

add('counseling', { id: 'h5', who: '🌍', name: 'Patient',
  says: 'I’d like female genital cutting done — it’s part of my culture.',
  ctx: '', tag: 'nonmaleficence',
  opts: [
    { t: 'Be culturally sensitive, explain it is illegal and harmful, discourage it, and offer support groups.' },
    { t: 'Perform it safely to prevent an unsafe procedure elsewhere.', why: 'Illegal in the US.' },
    { t: 'Call the police.', why: 'Not a crime to ask; counsel instead.' },
    { t: 'Refuse to discuss it.', why: 'Explain the risks respectfully.' },
  ],
  rule: 'Decline illegal procedures respectfully and explain the risks.',
  hy: [] });

add('counseling', { id: 'h6', who: '😩', name: 'Wife of a man with dementia',
  says: '(distracted, irritable, struggling to focus)',
  ctx: 'She is his full-time carer.', tag: 'beneficence',
  opts: [
    { t: 'Ask how she is coping, screen for depression/anxiety, and offer caregiver support services.' },
    { t: 'Focus only on the patient.', why: 'Caregiver burnout harms both.' },
    { t: 'Tell her to try harder.', why: 'Dismissive.' },
    { t: 'Recommend nursing-home placement immediately.', why: 'Assess and support first.' },
  ],
  rule: 'Recognise caregiver burnout and offer support.',
  hy: [] });

add('counseling', { id: 'h7', who: '⌛', name: 'Angry patient',
  says: 'I’ve been waiting TWO HOURS!',
  ctx: '', tag: 'professionalism',
  opts: [
    { t: 'Apologise, acknowledge the anger, and move straight to the chief concern.' },
    { t: 'Explain the emergencies that delayed you.', why: 'Do not justify — acknowledge and move on.' },
    { t: 'Tell him to calm down.', why: 'Escalates anger.' },
    { t: 'Reschedule him.', why: 'Address his concern now.' },
  ],
  rule: 'Angry about waiting: apologise, acknowledge, address the complaint.',
  hy: [] });

add('counseling', { id: 'h8', who: '📱', name: 'Patient (11 pm call)',
  says: 'I just have a quick question about my cholesterol…',
  ctx: 'Non-urgent; it’s the third late call this week.', tag: 'professionalism',
  opts: [
    { t: 'Set firm, polite boundaries: office hours, after-hours rules, and emergency resources.' },
    { t: 'Answer every call to keep her happy.', why: 'Boundaries protect care.' },
    { t: 'Block her number.', why: 'Abandonment; set rules instead.' },
    { t: 'Dismiss her from the practice.', why: 'Try boundary-setting first.' },
  ],
  rule: 'Needy patients: clear, respectful boundaries.',
  hy: [] });

add('counseling', { id: 'h9', who: '😔', name: 'Patient with a chronic illness',
  says: 'Nothing works. I feel hopeless.',
  ctx: '', tag: 'beneficence',
  opts: [
    { t: 'Acknowledge feelings, revisit goals and options, and screen for depression.' },
    { t: 'Assure her it will definitely improve.', why: 'Do not make promises.' },
    { t: 'Refer to another doctor.', why: 'Stay involved.' },
    { t: 'Increase all her doses.', why: 'Explore first.' },
  ],
  rule: 'Chronic illness: manage expectations and watch for depression.',
  hy: [] });

add('counseling', { id: 'h10', who: '🤬', name: 'Intoxicated, agitated patient',
  says: 'Get away from me!',
  ctx: 'He is becoming aggressive during your exam.', tag: 'safety',
  opts: [
    { t: 'Remove dangerous objects, call for staff, stand by the exit, and try verbal de-escalation.' },
    { t: 'Restrain him immediately.', why: 'De-escalation first; restraint is a last resort.' },
    { t: 'Shout to establish authority.', why: 'Escalates.' },
    { t: 'Leave him alone in the room.', why: 'Unsafe for him and others.' },
  ],
  rule: 'Agitation: safety first, then verbal de-escalation.',
  hy: ['If de-escalation fails: IM calming medication, then physical restraint as a last resort.', 'Remove restraints once calm, then reassess capacity.'] });

add('counseling', { id: 'h11', who: '💊', name: 'Post-op patient',
  says: 'Ibuprofen won’t cut it. I NEED more oxycodone!',
  ctx: 'Two weeks after an uncomplicated operation; history of recreational drug use.', tag: 'safety',
  opts: [
    { t: 'Stay empathetic, ask about drug use, and check the prescription drug monitoring programme.' },
    { t: 'Refill the oxycodone to avoid conflict.', why: 'Risks misuse — assess first.' },
    { t: 'Accuse him of drug seeking and discharge him.', why: 'Be nonjudgmental.' },
    { t: 'Call the police.', why: 'No crime — assess and treat.' },
  ],
  rule: 'Suspected opioid misuse: empathetic history and check the PDMP.',
  hy: [] });

// A short label for each correct option, the same length as the wrong ones,
// so the right answer is never the obviously longest. The full wording is
// shown afterwards on the rule card as "The best move".
const SHORT = {
  b1: 'Politely decline and keep contact professional.', b2: 'Name the comment, add a chaperone, limit the exam.',
  b3: 'Decline and redirect her to her own doctor.', b4: 'Ask the attending if you may assist.',
  b5: 'Thank her and accept it.', b6: 'Politely decline and explain why.', b7: 'Gently decline it.',
  b8: 'Decline both offers.', b9: 'Accept the leaflets.',
  c1: 'Inform him fully and respect his refusal.', c2: 'Transfuse her.', c3: 'Explore and check the supplement’s safety.',
  c4: 'Ask for her permission first.', c5: 'Say the operator should obtain consent.', c6: 'Finish, then consent her when awake.',
  c7: 'Repair it now.', c8: 'Counsel him and suggest he talk to his wife.',
  d1: 'Inform her fairly and transfer her care.', d2: 'Explore his worry; don’t order the scan.',
  d3: 'Explore his reasons and compare the drugs.', d4: 'Gently tell her he has died.', d5: 'Explain brain death is death.',
  p1: 'Honour the advance directive.', p2: 'Keep him and reassess when sober.', p3: 'Contact the father first.',
  p4: 'Hold a family meeting; the husband decides.', p5: 'Reassess his capacity.', p6: 'Follow the mother’s wishes.',
  p7: 'Do not proceed with donation.',
  m1: 'Refuse to test him secretly.', m2: 'Transfuse the son only.', m3: 'Seek a court order if they refuse.',
  m4: 'Admit and treat her.', m5: 'Proceed with surgery.', m6: 'Counsel her and prescribe it.',
  m7: 'Support her decision.', m8: 'Treat him and report it.', m9: 'See the teen privately.',
  m10: 'Educate, document and revisit.', m11: 'Explain the risks and follow up.', m12: 'Investigate and notify CPS.',
  m13: 'Yes, he can consent himself.',
  r1: 'Decline to alter the record.', r2: 'Discuss it with him first.', r3: 'Assess safety and offer support.',
  r4: 'Document and notify Adult Protective Services.',
  x1: 'Ask the patient how much he wants to know.', x2: 'Respect it and ask whom to tell.',
  x3: 'Say the senior team will explain.', x4: 'Give only the length of stay.', x5: 'Report it and encourage disclosure.',
  x6: 'Speak to him and disclose it.', x7: 'Tell the patient and apologise.', x8: 'Admit her, involuntarily if needed.',
  x9: 'Warn the neighbour and tell police.', x10: 'Accept and ask why.', x11: 'Encourage her to talk to him.',
  g1: 'Treat and stabilise him.', g2: 'Find the barriers and adapt the plan.', g3: 'Ask the patient’s consent first.',
  g4: 'Decline without her permission.', g5: 'Report to a physician health programme.', g6: 'Report to hospital authorities.',
  g7: 'Report to the board and CMS.', g8: 'Seek the family’s consent first.', g9: 'Present both; she decides.',
  e1: 'Explore why and improve palliation.', e2: 'Keep comfort drugs, stop preventive ones.', e3: 'Confirm the DNR and treat her.',
  h1: 'Encourage her to talk to her sister.', h2: 'Empathise and invite her to talk.', h3: 'Reassure honestly it isn’t their fault.',
  h4: 'Acknowledge grief and offer to hold the baby.', h5: 'Explain it’s illegal and discourage it.', h6: 'Ask how she is coping.',
  h7: 'Apologise and address his concern.', h8: 'Set clear, polite boundaries.', h9: 'Acknowledge it and screen for depression.',
  h10: 'Secure the room and de-escalate.', h11: 'Ask about drug use and check the PDMP.',
};
for (const s of S) {
  s.best = s.opts[0].t;
  if (SHORT[s.id]) s.opts[0] = { ...s.opts[0], t: SHORT[s.id] };
}

export const SCENARIOS = S;
export const SCENARIOS_BY_CH = CHAPTERS.reduce((m, c) => ({ ...m, [c.id]: S.filter(s => s.ch === c.id) }), {});
