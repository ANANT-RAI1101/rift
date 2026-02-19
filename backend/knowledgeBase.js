/**
 * PharmaGuard Pharmacogenomic Knowledge Base
 * 
 * Embedded knowledge covering 6 genes and 6 drugs with
 * star allele → diplotype → metabolizer phenotype → drug risk mappings.
 * Aligned with CPIC guidelines.
 */

// Star allele function classifications
export const ALLELE_FUNCTIONS = {
  CYP2D6: {
    '*1': 'Normal Function',
    '*2': 'Normal Function',
    '*3': 'No Function',
    '*4': 'No Function',
    '*5': 'No Function',
    '*6': 'No Function',
    '*9': 'Decreased Function',
    '*10': 'Decreased Function',
    '*17': 'Decreased Function',
    '*41': 'Decreased Function',
    '*1xN': 'Increased Function',
    '*2xN': 'Increased Function',
  },
  CYP2C19: {
    '*1': 'Normal Function',
    '*2': 'No Function',
    '*3': 'No Function',
    '*4': 'No Function',
    '*17': 'Increased Function',
  },
  CYP2C9: {
    '*1': 'Normal Function',
    '*2': 'Decreased Function',
    '*3': 'Decreased Function',
  },
  SLCO1B1: {
    '*1a': 'Normal Function',
    '*1b': 'Normal Function',
    '*5': 'Decreased Function',
    '*15': 'Decreased Function',
    '*17': 'Decreased Function',
  },
  TPMT: {
    '*1': 'Normal Function',
    '*2': 'No Function',
    '*3A': 'No Function',
    '*3B': 'No Function',
    '*3C': 'No Function',
  },
  DPYD: {
    'Reference': 'Normal Function',
    '*2A': 'No Function',
    '*13': 'No Function',
    'c.2846A>T': 'Decreased Function',
    'c.1129-5923C>G': 'Decreased Function',
  },
};

// Activity score calculations
function getAlleleScore(gene, allele) {
  const func = ALLELE_FUNCTIONS[gene]?.[allele];
  if (!func) return 1.0; // default normal
  switch (func) {
    case 'No Function': return 0;
    case 'Decreased Function': return 0.5;
    case 'Normal Function': return 1.0;
    case 'Increased Function': return 1.5;
    default: return 1.0;
  }
}

// Determine metabolizer phenotype from activity score
export function getPhenotype(gene, allele1, allele2) {
  const score = getAlleleScore(gene, allele1) + getAlleleScore(gene, allele2);
  const diplotype = `${allele1}/${allele2}`;

  let phenotype;
  if (score === 0) phenotype = 'Poor Metabolizer';
  else if (score <= 1.0) phenotype = 'Intermediate Metabolizer';
  else if (score <= 2.0) phenotype = 'Normal Metabolizer';
  else if (score <= 2.5) phenotype = 'Rapid Metabolizer';
  else phenotype = 'Ultra-Rapid Metabolizer';

  const abbreviation = {
    'Poor Metabolizer': 'PM',
    'Intermediate Metabolizer': 'IM',
    'Normal Metabolizer': 'NM',
    'Rapid Metabolizer': 'RM',
    'Ultra-Rapid Metabolizer': 'URM',
  }[phenotype];

  return { diplotype, phenotype, abbreviation, activityScore: score };
}

// Drug-Gene interaction rules
export const DRUG_GENE_RULES = {
  Codeine: {
    gene: 'CYP2D6',
    description: 'CYP2D6 metabolizes codeine to its active form morphine',
    rules: {
      PM: {
        risk: 'Ineffective',
        severity: 'High',
        confidence: 0.95,
        recommendation: 'Avoid codeine. Use alternative analgesics not metabolized by CYP2D6 (e.g., morphine, non-opioid analgesics).',
        dosageAdvice: 'Do not use codeine',
        alternatives: ['Morphine', 'Acetaminophen', 'NSAIDs', 'Tramadol (with caution)'],
        mechanism: 'Codeine is a prodrug that requires CYP2D6-mediated O-demethylation to morphine for analgesic effect. Poor metabolizers have negligible CYP2D6 activity, resulting in minimal conversion to morphine and inadequate pain relief.',
      },
      IM: {
        risk: 'Ineffective',
        severity: 'Moderate',
        confidence: 0.85,
        recommendation: 'Use codeine with caution. May have reduced analgesic effect. Consider alternative analgesics if inadequate response.',
        dosageAdvice: 'Use label-recommended dose; monitor for efficacy',
        alternatives: ['Morphine', 'Acetaminophen'],
        mechanism: 'Intermediate metabolizers have reduced CYP2D6 activity, leading to decreased morphine formation and potentially suboptimal analgesic effect.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Use codeine per standard prescribing guidelines.',
        dosageAdvice: 'Standard dose as per label',
        alternatives: [],
        mechanism: 'Normal metabolizers convert codeine to morphine at expected rates, providing standard analgesic effect.',
      },
      RM: {
        risk: 'Toxic',
        severity: 'High',
        confidence: 0.90,
        recommendation: 'Avoid codeine due to risk of toxicity. Rapid conversion to morphine may cause respiratory depression, especially in children.',
        dosageAdvice: 'Do not use codeine',
        alternatives: ['Morphine (reduced dose)', 'Acetaminophen', 'NSAIDs'],
        mechanism: 'Rapid metabolizers have increased CYP2D6 activity resulting in faster and greater conversion of codeine to morphine, increasing the risk of morphine toxicity.',
      },
      URM: {
        risk: 'Toxic',
        severity: 'Critical',
        confidence: 0.95,
        recommendation: 'AVOID codeine. Ultra-rapid metabolism leads to dangerously high morphine levels. Life-threatening toxicity risk, particularly in pediatric patients and breastfeeding mothers.',
        dosageAdvice: 'CONTRAINDICATED',
        alternatives: ['Morphine (carefully titrated)', 'Acetaminophen', 'NSAIDs'],
        mechanism: 'Ultra-rapid metabolizers have multiple copies of functional CYP2D6 alleles, leading to excessively rapid conversion of codeine to morphine with dangerous accumulation.',
      },
    },
  },
  Warfarin: {
    gene: 'CYP2C9',
    description: 'CYP2C9 metabolizes S-warfarin, the more potent enantiomer',
    rules: {
      PM: {
        risk: 'Toxic',
        severity: 'Critical',
        confidence: 0.92,
        recommendation: 'Significantly reduce warfarin dose. Consider alternative anticoagulants. Increased bleeding risk.',
        dosageAdvice: 'Reduce initial dose by 50-80%. Frequent INR monitoring required.',
        alternatives: ['Direct Oral Anticoagulants (DOACs)', 'Apixaban', 'Rivaroxaban'],
        mechanism: 'Poor metabolizers accumulate S-warfarin due to severely reduced CYP2C9 activity, leading to excessive anticoagulation and bleeding risk.',
      },
      IM: {
        risk: 'Adjust Dosage',
        severity: 'Moderate',
        confidence: 0.88,
        recommendation: 'Reduce warfarin starting dose. Closer INR monitoring recommended.',
        dosageAdvice: 'Reduce initial dose by 20-40%. Monitor INR closely.',
        alternatives: ['Apixaban', 'Rivaroxaban'],
        mechanism: 'Intermediate metabolizers have reduced CYP2C9 activity, leading to higher S-warfarin levels and increased sensitivity.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Standard warfarin dosing per clinical guidelines.',
        dosageAdvice: 'Standard dose with routine INR monitoring',
        alternatives: [],
        mechanism: 'Normal CYP2C9 metabolizers clear S-warfarin at expected rates.',
      },
      RM: {
        risk: 'Adjust Dosage',
        severity: 'Moderate',
        confidence: 0.80,
        recommendation: 'May require higher warfarin doses to achieve therapeutic INR.',
        dosageAdvice: 'Standard or increased dose with INR monitoring',
        alternatives: [],
        mechanism: 'Rapid metabolizers clear S-warfarin faster, potentially requiring higher doses.',
      },
      URM: {
        risk: 'Ineffective',
        severity: 'High',
        confidence: 0.82,
        recommendation: 'Warfarin may be ineffective at standard doses. Consider higher doses or alternative anticoagulants.',
        dosageAdvice: 'Significantly increased dose likely needed. Close INR monitoring.',
        alternatives: ['Apixaban', 'Rivaroxaban', 'Edoxaban'],
        mechanism: 'Ultra-rapid metabolism leads to very fast clearance of S-warfarin, potentially making standard doses subtherapeutic.',
      },
    },
  },
  Clopidogrel: {
    gene: 'CYP2C19',
    description: 'CYP2C19 activates clopidogrel from prodrug to active metabolite',
    rules: {
      PM: {
        risk: 'Ineffective',
        severity: 'Critical',
        confidence: 0.93,
        recommendation: 'Avoid clopidogrel. Use alternative antiplatelet therapy. High risk of cardiovascular events due to lack of drug activation.',
        dosageAdvice: 'CONTRAINDICATED - use alternative',
        alternatives: ['Prasugrel', 'Ticagrelor'],
        mechanism: 'Clopidogrel is a prodrug requiring CYP2C19-mediated bioactivation. Poor metabolizers cannot effectively convert clopidogrel to its active thiol metabolite, resulting in inadequate platelet inhibition.',
      },
      IM: {
        risk: 'Adjust Dosage',
        severity: 'High',
        confidence: 0.87,
        recommendation: 'Consider alternative antiplatelet agent. If clopidogrel is used, consider platelet function testing.',
        dosageAdvice: 'Alternative therapy preferred; if used, monitor platelet function',
        alternatives: ['Prasugrel', 'Ticagrelor'],
        mechanism: 'Intermediate metabolizers have reduced CYP2C19 activity, leading to decreased formation of the active metabolite and potentially suboptimal platelet inhibition.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Standard clopidogrel dosing per clinical guidelines.',
        dosageAdvice: 'Standard 75mg daily maintenance dose',
        alternatives: [],
        mechanism: 'Normal metabolizers adequately convert clopidogrel to its active metabolite.',
      },
      RM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.88,
        recommendation: 'Standard clopidogrel dosing. Enhanced activation may provide improved antiplatelet effect.',
        dosageAdvice: 'Standard dose',
        alternatives: [],
        mechanism: 'Rapid metabolizers efficiently convert clopidogrel to its active form, providing effective platelet inhibition.',
      },
      URM: {
        risk: 'Adjust Dosage',
        severity: 'Moderate',
        confidence: 0.78,
        recommendation: 'Standard dose effective. Monitor for increased bleeding risk.',
        dosageAdvice: 'Standard dose; monitor for bleeding',
        alternatives: [],
        mechanism: 'Ultra-rapid metabolizers may generate higher levels of active metabolite, potentially increasing both efficacy and bleeding risk.',
      },
    },
  },
  Simvastatin: {
    gene: 'SLCO1B1',
    description: 'SLCO1B1 transports simvastatin acid into hepatocytes for metabolism',
    rules: {
      PM: {
        risk: 'Toxic',
        severity: 'Critical',
        confidence: 0.91,
        recommendation: 'Avoid simvastatin. High risk of myopathy/rhabdomyolysis. Use alternative statins (e.g., pravastatin, rosuvastatin).',
        dosageAdvice: 'CONTRAINDICATED at doses >20mg; consider alternatives',
        alternatives: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin'],
        mechanism: 'Decreased SLCO1B1 function leads to reduced hepatic uptake of simvastatin acid, causing increased systemic exposure and elevated risk of skeletal muscle toxicity.',
      },
      IM: {
        risk: 'Adjust Dosage',
        severity: 'High',
        confidence: 0.88,
        recommendation: 'Use lower dose simvastatin (≤20mg/day) or consider alternative statin. Monitor for muscle symptoms.',
        dosageAdvice: 'Maximum 20mg/day; monitor CK levels',
        alternatives: ['Pravastatin', 'Rosuvastatin'],
        mechanism: 'Partially decreased SLCO1B1 transporter function leads to moderately increased simvastatin exposure and elevated myopathy risk.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Standard simvastatin dosing per clinical guidelines.',
        dosageAdvice: 'Standard dose as per lipid targets',
        alternatives: [],
        mechanism: 'Normal SLCO1B1 function provides adequate hepatic uptake of simvastatin acid.',
      },
      RM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.85,
        recommendation: 'Standard dosing effective.',
        dosageAdvice: 'Standard dose',
        alternatives: [],
        mechanism: 'Normal to enhanced SLCO1B1 transport function.',
      },
      URM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.80,
        recommendation: 'Standard dosing effective.',
        dosageAdvice: 'Standard dose',
        alternatives: [],
        mechanism: 'Enhanced SLCO1B1 transport function with efficient hepatic uptake.',
      },
    },
  },
  Azathioprine: {
    gene: 'TPMT',
    description: 'TPMT methylates thiopurine drugs; reduced activity causes toxic metabolite accumulation',
    rules: {
      PM: {
        risk: 'Toxic',
        severity: 'Critical',
        confidence: 0.95,
        recommendation: 'Drastically reduce dose (10-fold reduction) or use alternative agent. Life-threatening myelosuppression risk.',
        dosageAdvice: 'Reduce to 10% of standard dose. Thrice-weekly dosing.',
        alternatives: ['Mycophenolate mofetil', 'Alternative immunosuppressants'],
        mechanism: 'Absent TPMT activity causes accumulation of cytotoxic thioguanine nucleotides (TGN), leading to severe and potentially fatal myelosuppression.',
      },
      IM: {
        risk: 'Adjust Dosage',
        severity: 'High',
        confidence: 0.90,
        recommendation: 'Reduce starting dose by 30-70%. Monitor CBC weekly for first months.',
        dosageAdvice: 'Start at 30-70% of standard dose',
        alternatives: ['Mycophenolate mofetil'],
        mechanism: 'Reduced TPMT activity leads to higher TGN levels with increased risk of dose-dependent myelosuppression.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Standard azathioprine dosing. Routine monitoring recommended.',
        dosageAdvice: 'Standard dose (2-3 mg/kg/day)',
        alternatives: [],
        mechanism: 'Normal TPMT activity provides adequate metabolism of thiopurines.',
      },
      RM: {
        risk: 'Adjust Dosage',
        severity: 'Moderate',
        confidence: 0.78,
        recommendation: 'May require higher doses. Monitor for therapeutic efficacy.',
        dosageAdvice: 'Standard or increased dose with efficacy monitoring',
        alternatives: [],
        mechanism: 'Increased TPMT activity leads to greater inactivation of thiopurines, potentially reducing therapeutic effect.',
      },
      URM: {
        risk: 'Ineffective',
        severity: 'High',
        confidence: 0.80,
        recommendation: 'Standard doses may be ineffective. Consider higher doses or alternative immunosuppressants.',
        dosageAdvice: 'Increased dose may be needed; monitor TGN levels',
        alternatives: ['Mycophenolate mofetil', 'Alternative immunosuppressants'],
        mechanism: 'Ultra-rapid TPMT activity excessively inactivates azathioprine, leading to subtherapeutic TGN levels.',
      },
    },
  },
  Fluorouracil: {
    gene: 'DPYD',
    description: 'DPD (encoded by DPYD) catabolizes >80% of administered fluorouracil',
    rules: {
      PM: {
        risk: 'Toxic',
        severity: 'Critical',
        confidence: 0.95,
        recommendation: 'AVOID fluorouracil and capecitabine. Complete DPD deficiency causes life-threatening toxicity.',
        dosageAdvice: 'CONTRAINDICATED',
        alternatives: ['Alternative chemotherapy regimens (consult oncologist)'],
        mechanism: 'Complete DPD deficiency prevents catabolism of fluorouracil, causing massive accumulation of cytotoxic metabolites leading to severe mucositis, myelosuppression, neurotoxicity, and potentially death.',
      },
      IM: {
        risk: 'Adjust Dosage',
        severity: 'Critical',
        confidence: 0.92,
        recommendation: 'Reduce fluorouracil dose by at least 50%. Close monitoring with dose titration based on toxicity.',
        dosageAdvice: 'Reduce to 25-50% of standard dose',
        alternatives: ['Dose-adjusted regimen with TDM'],
        mechanism: 'Partial DPD deficiency leads to reduced fluorouracil clearance and increased exposure to cytotoxic metabolites.',
      },
      NM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.90,
        recommendation: 'Standard fluorouracil dosing per oncology protocol.',
        dosageAdvice: 'Standard dose per BSA calculation',
        alternatives: [],
        mechanism: 'Normal DPD activity provides expected fluorouracil catabolism.',
      },
      RM: {
        risk: 'Safe',
        severity: 'Low',
        confidence: 0.82,
        recommendation: 'Standard dosing. Monitor for therapeutic efficacy.',
        dosageAdvice: 'Standard dose; consider TDM',
        alternatives: [],
        mechanism: 'Enhanced DPD activity with adequate drug catabolism.',
      },
      URM: {
        risk: 'Ineffective',
        severity: 'High',
        confidence: 0.78,
        recommendation: 'Fluorouracil may be rapidly inactivated. Consider dose increase with therapeutic drug monitoring or alternative agents.',
        dosageAdvice: 'Higher doses may be needed; TDM recommended',
        alternatives: ['Alternative chemotherapy regimens'],
        mechanism: 'Ultra-rapid DPD activity may excessively catabolize fluorouracil before therapeutic effect.',
      },
    },
  },
};

// rsID to gene/allele mapping
export const RSID_MAP = {
  'rs3892097': { gene: 'CYP2D6', allele: '*4' },
  'rs5030655': { gene: 'CYP2D6', allele: '*6' },
  'rs1065852': { gene: 'CYP2D6', allele: '*10' },
  'rs28371706': { gene: 'CYP2D6', allele: '*17' },
  'rs28371725': { gene: 'CYP2D6', allele: '*41' },
  'rs4244285': { gene: 'CYP2C19', allele: '*2' },
  'rs4986893': { gene: 'CYP2C19', allele: '*3' },
  'rs12248560': { gene: 'CYP2C19', allele: '*17' },
  'rs1799853': { gene: 'CYP2C9', allele: '*2' },
  'rs1057910': { gene: 'CYP2C9', allele: '*3' },
  'rs4149056': { gene: 'SLCO1B1', allele: '*5' },
  'rs2306283': { gene: 'SLCO1B1', allele: '*1b' },
  'rs1800460': { gene: 'TPMT', allele: '*3B' },
  'rs1142345': { gene: 'TPMT', allele: '*3C' },
  'rs1800462': { gene: 'TPMT', allele: '*2' },
  'rs3918290': { gene: 'DPYD', allele: '*2A' },
  'rs55886062': { gene: 'DPYD', allele: '*13' },
  'rs67376798': { gene: 'DPYD', allele: 'c.2846A>T' },
  'rs75017182': { gene: 'DPYD', allele: 'c.1129-5923C>G' },
};

// Supported drugs list
export const SUPPORTED_DRUGS = [
  'Codeine',
  'Warfarin',
  'Clopidogrel',
  'Simvastatin',
  'Azathioprine',
  'Fluorouracil',
];

// Supported genes
export const SUPPORTED_GENES = [
  'CYP2D6',
  'CYP2C19',
  'CYP2C9',
  'SLCO1B1',
  'TPMT',
  'DPYD',
];

// Default alleles for genes (when no variant is found)
export const DEFAULT_ALLELES = {
  CYP2D6: '*1',
  CYP2C19: '*1',
  CYP2C9: '*1',
  SLCO1B1: '*1a',
  TPMT: '*1',
  DPYD: 'Reference',
};
