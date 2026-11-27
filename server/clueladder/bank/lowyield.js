'use strict';
/**
 * Diagnoses left out when a match is set to "HY only".
 *
 * They stay in the answer list (so the autocomplete never hints at what is
 * coming) — they just never come up as a case. Names must match a bank row
 * exactly; check.js fails on a name that is not in the bank.
 */
module.exports = new Set([
  // Reproductive
  '47,XYY syndrome',
  'Ovotesticular disorder of sex development',
  'Aromatase deficiency',
  'Uterus didelphys',
  'Epispadias',
  'Sacrococcygeal teratoma',
  'Supine hypotensive syndrome',
  'Lichen simplex chronicus',
  'Extramammary Paget disease',
  'Brenner tumor',
  'Struma ovarii',
  'Thecoma',
  'Mucinous carcinoma of the ovary',
  'Sclerosing adenosis',
  'Mammary duct ectasia',
  'Spermatocele',
  'Testicular lymphoma',
  'Sertoli cell tumor',

  // Hematology
  'Alpha-thalassemia silent carrier',
  'Beta-thalassemia intermedia',
  'Sickle cell beta-thalassemia',
  'Hemoglobin SC disease',
  'Hereditary elliptocytosis',
  'Macroangiopathic hemolytic anemia',
  'Hemophilia C',
  'Acquired hemophilia',
  'Uremic platelet dysfunction',
  'Lymphocyte-rich Hodgkin lymphoma',
  'Lymphocyte-depleted Hodgkin lymphoma',
  'Acute megakaryoblastic leukemia',
  'Richter transformation',
  'Relative polycythemia',
  'Systemic mastocytosis',
]);
