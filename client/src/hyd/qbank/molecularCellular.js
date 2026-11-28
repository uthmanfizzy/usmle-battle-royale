/**
 * HY Diseases Qbank cards — Molecular + Cellular. Format: see bioQbank.js.
 * Original wording.
 */
export default {
  ada_scid: {
    s: 'A 7-month-old girl has her fourth pneumonia, persistent **oral thrush** and chronic diarrhoea, and is falling off her growth curve. She has no palpable lymph nodes or tonsils. Lymphocytes (T and B) are very low and chest X-ray shows **no thymic shadow**.',
    w: {
      'oral thrush': 'Candida is normally kept in check by T cells. With almost no T cells, the fungus grows freely in the mouth.',
      'no thymic shadow': 'The thymus is where T cells mature. With no lymphocytes surviving to fill it, the thymus stays tiny and is invisible on X-ray.',
    },
    x: 'Adenosine deaminase normally clears adenosine. Without it, a toxic by-product (dATP) builds up inside lymphocytes and kills both T and B cells. With no working immune system, the baby gets bacterial, viral and fungal infections from early infancy.',
    hy: ['ADA deficiency is an autosomal recessive cause of SCID, and dATP blocks ribonucleotide reductase, which stops lymphocyte DNA synthesis.', 'Live vaccines must be avoided; the cure is a stem cell transplant (gene therapy and enzyme replacement are options).'],
    vs: ['digeorge', 'DiGeorge also lacks a thymus, but brings low calcium (tetany), a cleft palate and a conotruncal heart defect, and B cells are spared.'],
  },
  lesch_nyhan: {
    s: 'A 3-year-old boy **bites his lips and fingers** until they bleed and has dystonic limb postures. As a baby his nappies had **orange sand-like crystals**. Serum uric acid is high.',
    w: {
      'bites his lips and fingers': 'Purine build-up and low dopamine signalling in the basal ganglia drive compulsive self-injury. It is the signature of this disease.',
      'orange sand-like crystals': 'Purines that cannot be recycled are broken down to uric acid instead. So much is made that sodium urate crystals appear in the nappy.',
    },
    x: 'The enzyme HGPRT normally recycles purine bases. When it is missing, the bases are turned into uric acid instead, and the cell makes even more purines from scratch. The result is very high uric acid plus a neurological picture of self-harm, dystonia and intellectual disability.',
    hy: ['HGPRT deficiency is X-linked recessive, so it affects boys, and the classic triad is hyperuricaemia, self-mutilation and dystonia.', 'Allopurinol or febuxostat lowers the uric acid but does not fix the behaviour.'],
    vs: ['rett', 'Rett is a girl who regresses with hand-wringing; uric acid is normal and there is no self-biting.'],
  },
  orotic_aciduria: {
    s: 'A 10-month-old boy is pale and failing to thrive. He has a **megaloblastic anaemia that did not respond to B12 or folate**, and needle crystals in the urine. Blood **ammonia is normal**.',
    w: {
      'megaloblastic anaemia that did not respond to B12 or folate': 'The block is in making pyrimidines for DNA, not in the vitamins. Red cell precursors cannot copy their DNA, so they grow large, and extra B12 or folate cannot help.',
      'ammonia is normal': 'The urea cycle works fine here, so ammonia is not raised. That separates it from OTC deficiency, which also makes orotic acid.',
    },
    x: 'The enzyme UMP synthase, which finishes making pyrimidine nucleotides, is faulty. Orotic acid piles up and spills into the urine, and without pyrimidines the bone marrow cannot make DNA properly. That gives a big-cell anaemia that vitamins do not fix.',
    hy: ['Treatment is oral uridine, which bypasses the blocked step and supplies the missing pyrimidines.'],
    vs: ['otc_def', 'OTC deficiency also raises urine orotic acid, but with HIGH ammonia, encephalopathy and no megaloblastic anaemia.'],
  },
  xeroderma: {
    s: 'A 9-year-old boy has blistered after brief sun exposure since infancy, with **dense freckling on sun-exposed skin**. A cheek lesion is a **squamous cell carcinoma**.',
    w: {
      'dense freckling on sun-exposed skin': 'Every bit of UV leaves DNA damage that is never repaired. Melanocytes respond with heavy pigmentation exactly where the sun hits.',
      'squamous cell carcinoma': 'Unrepaired UV damage builds up mutations in skin cells very quickly, so skin cancers appear decades earlier than normal.',
    },
    x: 'UV light joins neighbouring thymine bases together into dimers. Normally nucleotide excision repair cuts these out and replaces them, but in this disease the repair enzymes do not work. Damage collects with every sun exposure, causing severe sun sensitivity and childhood skin cancers.',
    hy: ['Xeroderma pigmentosum is an autosomal recessive defect in nucleotide excision repair (the endonuclease that removes pyrimidine dimers).', 'It causes squamous cell carcinoma, basal cell carcinoma and melanoma in children.'],
    vs: ['pellagra', 'Pellagra also gives a sun-exposed rash, but with diarrhoea and dementia from low niacin, and no childhood skin cancer.'],
  },
  lynch: {
    s: 'A 38-year-old woman has iron-deficiency anaemia from a **single right-sided colon cancer** with few polyps. Her mother had colon cancer at 44 and her aunt **endometrial cancer** in her 40s. Tumour shows **microsatellite instability**.',
    w: {
      'single right-sided colon cancer': 'In this syndrome cancer can arise from only one or a few polyps, and it favours the proximal (right) colon.',
      'endometrial cancer': 'The same faulty repair genes are present in every cell, so the womb lining, ovaries and other organs are also at risk.',
      'microsatellite instability': 'Mismatch repair fixes copying slips in short repeated DNA stretches. Without it those repeats change length, which is what the test detects.',
    },
    x: 'Mismatch repair proteins proofread DNA after it is copied. When one copy of these genes is inherited faulty and the other is lost, copying errors pile up and cancers form early. The colon (often right side) and the endometrium are hit most.',
    hy: ['Lynch syndrome (HNPCC) is autosomal dominant, from mutations in mismatch repair genes such as MLH1 and MSH2.', 'Remember the "3-2-1" family rule: 3 relatives, 2 generations, 1 diagnosed before 50.'],
    vs: ['fap', 'FAP carpets the colon with hundreds to thousands of polyps from the teens (APC gene); Lynch has few polyps.'],
  },
  sma: {
    s: 'A 3-month-old girl is profoundly floppy and cannot lift her head, but is **alert, smiling and tracks with her eyes**. She has **tongue fasciculations** and absent reflexes.',
    w: {
      'alert, smiling and tracks with her eyes': 'Only the motor neurons in the spinal cord are lost. The brain and the nerves to the eye muscles are spared, so she is bright and engaged.',
      'tongue fasciculations': 'Dying lower motor neurons fire on their own, making the muscle twitch. The tongue is the easiest place to see it in a baby.',
    },
    x: 'A missing SMN1 gene means the anterior horn cells of the spinal cord slowly die. These are lower motor neurons, so the baby is weak and floppy with no reflexes and twitching muscles. Thinking and eye movements are untouched.',
    hy: ['Spinal muscular atrophy is autosomal recessive and is a classic cause of "floppy baby" syndrome, with lower motor neuron signs only.', 'New treatments include nusinersen (an antisense oligonucleotide) and onasemnogene (gene therapy).'],
    vs: ['pompe', 'Pompe is a floppy baby too, but with a huge heart and a big tongue, and no fasciculations.'],
  },
  i_cell: {
    s: 'A 14-month-old boy has increasingly **coarse facial features, gum overgrowth**, clouded corneas, claw hands and developmental delay. **Plasma lysosomal enzymes are high**.',
    w: {
      'coarse facial features, gum overgrowth': 'Undigested material collects in cells of the face and gums because their lysosomes are empty of enzymes, thickening the tissues.',
      'Plasma lysosomal enzymes are high': 'Enzymes that should go to lysosomes are not tagged, so the cell exports them into the blood instead.',
    },
    x: 'In the Golgi, enzymes destined for the lysosome get a mannose-6-phosphate tag. In I-cell disease the tagging enzyme is missing, so the enzymes are secreted out of the cell. Lysosomes stay empty, waste builds up in cells, and the blood is full of enzymes.',
    hy: ['I-cell disease is a defect of N-acetylglucosamine-1-phosphotransferase in the Golgi, so mannose-6-phosphate is never added.', 'It is autosomal recessive and usually fatal in childhood.'],
    vs: ['hurler', 'Hurler looks similar (coarse face, cloudy corneas), but plasma enzymes are LOW and urine has heparan and dermatan sulfate.'],
  },
  zellweger: {
    s: 'A 2-week-old girl has been **floppy since birth**, now has seizures, jaundice and hepatomegaly, with a high forehead and a wide fontanelle. Plasma **very-long-chain fatty acids are high**.',
    w: {
      'floppy since birth': 'Without peroxisomes, the brain cannot make normal myelin or break down certain fats, so muscle tone is poor from day one.',
      'very-long-chain fatty acids are high': 'Very long fatty acids can only be shortened inside peroxisomes. With no peroxisomes, they build up in the blood.',
    },
    x: 'Peroxisomes fail to form because of a mutation in a PEX gene. Peroxisomes break down very-long-chain fatty acids and make plasmalogens for myelin. Without them the baby has severe hypotonia, seizures, liver disease and a distinctive face, and usually dies in infancy.',
    hy: ['Zellweger syndrome is an autosomal recessive peroxisome biogenesis disorder with high VLCFA.'],
    vs: ['ald', 'Adrenoleukodystrophy also raises VLCFA, but in a school-age boy with neurological decline and adrenal failure.'],
  },
  refsum: {
    s: 'A 19-year-old woman has **night blindness**, scaly skin, numb feet and an unsteady gait. Her **fourth toes are short**. Plasma **phytanic acid is high**.',
    w: {
      'night blindness': 'Phytanic acid damages the retina (a retinitis pigmentosa picture), and the rods that work in dim light fail first.',
      'fourth toes are short': 'A bone development change in the feet that is a classic, oddly specific clue for this disease.',
      'phytanic acid is high': 'Phytanic acid comes from dairy and ruminant fat. It needs peroxisomal alpha-oxidation to be broken down, which is missing.',
    },
    x: 'Phytanic acid has a branch that blocks normal fat breakdown, so it must first be trimmed by alpha-oxidation in peroxisomes. In Refsum disease that step fails and phytanic acid builds up in nerves, retina and skin. This causes neuropathy, night blindness, scaly skin and ataxia.',
    hy: ['Refsum disease is an autosomal recessive peroxisomal alpha-oxidation defect; treat with a diet low in phytanic acid (avoid dairy and ruminant fat).'],
    vs: ['abetalipoproteinemia', 'Abetalipoproteinaemia also gives retinal disease and ataxia, but starts with infant fatty stools and acanthocytes.'],
  },
  ald: {
    s: 'An 8-year-old boy has **falling school performance**, worsening hearing, vision and gait, salt craving and **tanned skin**. Cortisol is low with high ACTH. Plasma VLCFA are high.',
    w: {
      'falling school performance': 'Very-long-chain fatty acids damage the brain\'s white matter, so thinking and behaviour decline first.',
      'tanned skin': 'The adrenal glands fail, cortisol falls and ACTH rises. ACTH comes from the same precursor as MSH, which darkens the skin.',
    },
    x: 'A faulty transporter (ABCD1) cannot carry very-long-chain fatty acids into peroxisomes. They build up in the brain\'s white matter and in the adrenal glands. The boy loses neurological skills and develops adrenal failure.',
    hy: ['Adrenoleukodystrophy is X-linked recessive, so it affects boys, and adrenal insufficiency can cause an adrenal crisis.'],
    vs: ['mld', 'MLD is also a demyelinating decline, but it is autosomal recessive with no adrenal failure and normal VLCFA.'],
  },
  kartagener: {
    s: 'A 29-year-old man has lifelong **chronic sinusitis**, wet cough and ear infections, and **infertility** with immotile sperm. Heart sounds are loudest on the **right**. Nasal nitric oxide is low.',
    w: {
      'chronic sinusitis': 'Cilia sweep mucus out of the sinuses and airways. When they cannot beat, mucus sits still and gets infected again and again.',
      'infertility': 'A sperm tail is a long cilium (flagellum) with the same dynein machinery, so sperm cannot swim.',
      'right': 'Beating cilia in the embryo decide which side the heart goes to. Without them it is chance, so about half have the heart on the right (situs inversus).',
    },
    x: 'Cilia move by sliding their microtubules using dynein arms. In this disease the dynein arms are missing, so cilia and sperm tails cannot beat. Mucus is not cleared, causing chronic sinus and lung infections, and sperm cannot swim, causing infertility.',
    hy: ['Primary ciliary dyskinesia is an autosomal recessive dynein arm defect; Kartagener syndrome is the subset with situs inversus.', 'Low nasal nitric oxide is used as a screening test, and sweat chloride is normal.'],
    vs: ['cystic_fibrosis', 'CF also causes bronchiectasis and male infertility, but with a high sweat chloride, pancreatic failure and no situs inversus.'],
  },
  oi: {
    s: 'A 6-year-old girl has had **five fractures after minor falls** (abuse was suspected). She has **blue sclerae** and worn, translucent teeth; her grandfather went deaf young. Calcium, phosphate and vitamin D are normal.',
    w: {
      'five fractures after minor falls': 'Type I collagen is the scaffold of bone. When it is faulty, bone is brittle and breaks with little force.',
      'blue sclerae': 'The sclera is made of type I collagen. When it is thin, the dark choroid underneath shows through as blue.',
    },
    x: 'Osteogenesis imperfecta is a defect in type I collagen, usually from a COL1A1 or COL1A2 mutation. Bone, sclera, teeth and the middle ear bones all depend on this collagen. So the child has brittle bones, blue sclerae, fragile teeth and hearing loss.',
    hy: ['Most cases are autosomal dominant, and the mnemonic is "BITE": Bones, I (eyes, blue sclerae), Teeth, Ears (hearing loss).', 'It can be mistaken for child abuse, so it must be considered before reporting.'],
    vs: ['rickets', 'Rickets gives bowed legs and a rachitic rosary with LOW phosphate and vitamin D and HIGH ALP; in OI these labs are normal.'],
  },
  ehlers_danlos: {
    s: 'A 17-year-old girl dislocates her shoulder reaching for a shelf. Her **skin stretches far and springs back**, joints are **hypermobile**, and cuts heal into wide papery scars. Clotting tests are normal.',
    w: {
      'skin stretches far and springs back': 'Faulty collagen leaves the skin without its normal tensile strength, so it stretches more than normal.',
      'hypermobile': 'Ligaments and joint capsules are made of collagen. When it is weak, joints move too far and dislocate easily.',
    },
    x: 'Ehlers-Danlos syndrome is a group of disorders of collagen production. The skin, joints and blood vessels are weak and over-stretchy. That causes stretchy skin, dislocating joints, easy bruising and poor wound healing.',
    hy: ['The classic type involves type V collagen; the vascular type involves type III collagen and can cause arterial, bowel or uterine rupture.', 'It is associated with berry aneurysms and organ rupture.'],
    vs: ['marfan', 'Marfan is tall and lanky with an upward lens dislocation and aortic root dilation; the skin is not stretchy.'],
  },
  menkes: {
    s: 'A 4-month-old boy has **brittle, kinky, steel-coloured hair**, hypotonia, seizures and growth delay. Serum **copper and ceruloplasmin are low**.',
    w: {
      'brittle, kinky, steel-coloured hair': 'Copper enzymes are needed to cross-link hair keratin and to make pigment. Without copper, hair is twisted, fragile and grey.',
      'copper and ceruloplasmin are low': 'Copper cannot get out of gut cells into the blood, so blood copper and its carrier protein ceruloplasmin are low.',
    },
    x: 'The ATP7A copper pump is faulty, so copper is trapped in the gut lining and does not reach the body. Many enzymes need copper, including lysyl oxidase, which cross-links collagen. The baby gets kinky hair, weak vessels and bones, and brain damage with seizures.',
    hy: ['Menkes disease is X-linked recessive, and low copper means lysyl oxidase cannot cross-link collagen.'],
    vs: ['zellweger', 'Zellweger is a floppy newborn with seizures, jaundice and high VLCFA, but normal hair and copper.'],
  },
  marfan: {
    s: 'A tall 16-year-old boy has very long arms and fingers, a sunken chest and a **lens dislocated upward and outward**. His father had aortic surgery. Echo shows **aortic root dilation**; homocysteine is normal.',
    w: {
      'lens dislocated upward and outward': 'The lens hangs by fibres made of fibrillin. When they are weak, the lens slips up and out.',
      'aortic root dilation': 'Fibrillin helps hold elastic fibres together in the aortic wall. A weak wall stretches under pressure, and can dissect.',
    },
    x: 'Marfan syndrome is a defect in fibrillin-1, the scaffold that elastic fibres are built on. Elastic tissue in the aorta, the lens ligaments and the skeleton is weak. The result is a tall lanky build, lens dislocation and a dangerously stretchy aorta.',
    hy: ['Marfan is autosomal dominant (FBN1 on chromosome 15), and the most common cause of death is aortic dissection.', 'Mitral valve prolapse is also common.'],
    vs: ['homocystinuria', 'Homocystinuria is also marfanoid, but the lens goes DOWN and in, with clots, intellectual disability and high homocysteine.'],
  },
  alport: {
    s: 'A 21-year-old man has had **haematuria** since childhood, wears a hearing aid for **sensorineural deafness** and has lens problems. His maternal uncle was on dialysis by 30.',
    w: {
      'haematuria': 'The glomerular basement membrane is built from type IV collagen. When it is faulty, it splits and leaks red cells into the urine.',
      'sensorineural deafness': 'The inner ear (cochlea) uses the same type IV collagen, so hearing is lost too.',
    },
    x: 'Alport syndrome is a defect in type IV collagen, which forms basement membranes. The kidney filter, the inner ear and the lens capsule all rely on it. So the patient has blood in the urine that progresses to kidney failure, plus deafness and eye problems.',
    hy: ['Alport syndrome is most often X-linked, and biopsy shows a split, "basket-weave" glomerular basement membrane.', 'The mnemonic is "can\'t see, can\'t pee, can\'t hear high C".'],
    vs: ['fabry', 'Fabry also causes kidney failure, but begins with burning hand and foot pain, angiokeratomas and poor sweating.'],
  },
};
