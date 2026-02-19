/**
 * PharmaGuard LLM Explainability Module
 * 
 * Template-based explainability engine that generates
 * clinically formatted AI explanations. No external API needed.
 */

/**
 * Generate comprehensive AI explanations for each drug-gene result
 */
export function generateExplanations(riskResults) {
    return riskResults.map(result => {
        if (result.error) {
            return { drug: result.drug, error: result.error };
        }

        return {
            drug: result.drug,
            gene: result.gene,
            clinicalSummary: generateClinicalSummary(result),
            biologicalMechanism: generateMechanismExplanation(result),
            variantInterpretation: generateVariantInterpretation(result),
            riskExplanation: generateRiskExplanation(result),
            evidenceLevel: assessEvidenceLevel(result),
            aiConfidenceNote: generateConfidenceNote(result),
        };
    });
}

function generateClinicalSummary(result) {
    const { drug, gene, pharmacogenomicProfile: pgx, riskAssessment: risk } = result;

    const riskDescriptions = {
        Safe: 'standard therapeutic response expected',
        'Adjust Dosage': 'dose modification recommended based on altered metabolism',
        Toxic: 'increased toxicity risk due to altered drug processing',
        Ineffective: 'reduced or absent therapeutic effect expected',
        Unknown: 'pharmacogenomic impact cannot be determined',
    };

    return `Pharmacogenomic analysis of ${drug} for a patient with ${gene} ${pgx.diplotype} ` +
        `(${pgx.phenotype}, Activity Score: ${pgx.activityScore}) indicates ` +
        `${riskDescriptions[risk.riskCategory] || 'uncertain clinical impact'}. ` +
        `This assessment is based on the patient's ${pgx.abbreviation} metabolizer status ` +
        `and established CPIC guidelines for ${drug}-${gene} interactions. ` +
        `Clinical confidence: ${(risk.confidenceScore * 100).toFixed(0)}%.`;
}

function generateMechanismExplanation(result) {
    const { drug, gene, pharmacogenomicProfile: pgx, clinicalRecommendation: rec } = result;

    const geneRoles = {
        CYP2D6: 'a cytochrome P450 enzyme responsible for the metabolism of approximately 25% of clinically used drugs',
        CYP2C19: 'a cytochrome P450 enzyme that metabolizes several important drug classes including proton pump inhibitors and antiplatelet agents',
        CYP2C9: 'a cytochrome P450 enzyme responsible for the metabolism of many drugs including warfarin, phenytoin, and NSAIDs',
        SLCO1B1: 'a hepatic uptake transporter (OATP1B1) that mediates the hepatic uptake of statins and other drugs from portal blood',
        TPMT: 'thiopurine S-methyltransferase, an enzyme that methylates and inactivates thiopurine drugs',
        DPYD: 'dihydropyrimidine dehydrogenase, the rate-limiting enzyme in fluoropyrimidine catabolism, responsible for degrading >80% of administered 5-fluorouracil',
    };

    return {
        geneRole: `${gene} encodes ${geneRoles[gene] || 'a pharmacogenomically relevant protein'}.`,
        patientImpact: `The patient's ${pgx.diplotype} diplotype results in ${pgx.phenotype.toLowerCase()} ` +
            `status (activity score: ${pgx.activityScore}), which ` +
            `${getMetabolismImpact(pgx.abbreviation)}.`,
        drugProcessing: rec.mechanism,
        clinicalConsequence: getClinicalConsequence(result),
    };
}

function getMetabolismImpact(abbreviation) {
    const impacts = {
        PM: 'indicates absent or severely reduced enzymatic activity, significantly altering drug metabolism',
        IM: 'indicates reduced enzymatic activity, moderately affecting drug processing',
        NM: 'indicates normal enzymatic activity with expected drug processing',
        RM: 'indicates increased enzymatic activity, potentially accelerating drug metabolism',
        URM: 'indicates markedly increased enzymatic activity, substantially accelerating drug metabolism',
    };
    return impacts[abbreviation] || 'has uncertain effects on drug metabolism';
}

function getClinicalConsequence(result) {
    const { riskAssessment: risk, drug, pharmacogenomicProfile: pgx } = result;

    const consequences = {
        Safe: `For ${pgx.phenotype} patients, ${drug} is expected to provide therapeutic benefit at standard doses without increased risk of adverse effects.`,
        'Adjust Dosage': `${pgx.phenotype} patients metabolizing ${drug} at altered rates require careful dose titration to achieve therapeutic drug levels while minimizing adverse effects.`,
        Toxic: `${pgx.phenotype} patients are at significantly increased risk for ${drug}-related toxicity. The altered metabolism leads to either drug accumulation or excessive active metabolite formation, necessitating alternative therapy.`,
        Ineffective: `${pgx.phenotype} patients are unlikely to achieve therapeutic benefit from ${drug} at standard doses due to altered metabolic processing. Alternative agents should be considered.`,
    };

    return consequences[risk.riskCategory] || 'Clinical significance requires further evaluation.';
}

function generateVariantInterpretation(result) {
    const { variants, gene, pharmacogenomicProfile: pgx } = result;

    if (!variants || variants.length === 0) {
        return {
            summary: `No ${gene} variants detected in the submitted VCF file. The patient is assumed to carry reference alleles (${pgx.diplotype}).`,
            variants: [],
            interpretation: 'Absence of detected variants suggests normal (reference) allele carriage. However, the VCF file may not cover all relevant genomic regions.',
            limitations: 'VCF coverage for the gene region should be confirmed. Some variants may not be captured depending on sequencing methodology.',
        };
    }

    return {
        summary: `${variants.length} pharmacogenomic variant(s) detected in ${gene}.`,
        variants: variants.map(v => ({
            rsid: v.rsid,
            position: `chr${v.chromosome}:${v.position}`,
            change: `${v.reference} → ${v.alternate}`,
            allele: v.starAllele,
            zygosity: v.zygosity,
            significance: `This variant corresponds to the ${gene} ${v.starAllele} allele, which is classified as a ${getVariantClassification(v.starAllele)} variant.`,
        })),
        interpretation: `The detected variant(s) support assignment of the ${pgx.diplotype} diplotype, ` +
            `conferring ${pgx.phenotype.toLowerCase()} status.`,
        limitations: 'Interpretation is based on detected variants only. Additional variants not captured in the VCF file could modify the diplotype assignment.',
    };
}

function getVariantClassification(allele) {
    if (!allele) return 'unknown significance';
    // Alleles with no function
    if (['*3', '*4', '*5', '*6', '*2A', '*13'].includes(allele) ||
        allele.includes('No Function')) return 'loss-of-function';
    // Alleles with decreased function
    if (['*9', '*10', '*17', '*41', '*2', '*3', '*5', '*15'].includes(allele) ||
        allele.includes('Decreased')) return 'decreased-function';
    // Increased function
    if (allele.includes('xN') || allele === '*17') return 'gain-of-function';
    return 'functional';
}

function generateRiskExplanation(result) {
    const { riskAssessment: risk, drug, gene, pharmacogenomicProfile: pgx } = result;

    return {
        riskLevel: risk.riskCategory,
        riskDescription: getRiskDescription(risk.riskCategory, drug),
        contributingFactors: [
            `${gene} ${pgx.diplotype} diplotype`,
            `${pgx.phenotype} (${pgx.abbreviation}) status`,
            `Activity score: ${pgx.activityScore}`,
            `Drug: ${drug} (${DRUG_GENE_RULES_DESC[drug] || 'pharmacogenomically relevant'})`,
        ],
        confidenceAssessment: `Confidence score of ${(risk.confidenceScore * 100).toFixed(0)}% based on ` +
            `established CPIC guidelines and clinical evidence for ${drug}-${gene} interactions.`,
        caveats: [
            'This is a pharmacogenomic prediction and should be used in conjunction with clinical judgment',
            'Other clinical factors (age, weight, organ function, drug interactions) should also be considered',
            'Results are based on the submitted VCF data and may not capture all relevant variants',
        ],
    };
}

const DRUG_GENE_RULES_DESC = {
    Codeine: 'CYP2D6-activated prodrug',
    Warfarin: 'CYP2C9-metabolized anticoagulant',
    Clopidogrel: 'CYP2C19-activated antiplatelet',
    Simvastatin: 'SLCO1B1-transported statin',
    Azathioprine: 'TPMT-metabolized immunosuppressant',
    Fluorouracil: 'DPYD-catabolized antimetabolite',
};

function getRiskDescription(category, drug) {
    const descriptions = {
        Safe: `${drug} use at standard doses is supported by pharmacogenomic evidence. The patient's genetic profile is consistent with normal drug processing.`,
        'Adjust Dosage': `${drug} dose adjustment is recommended. The patient's genetic variant(s) alter drug metabolism in a way that affects therapeutic outcomes, necessitating careful dose titration.`,
        Toxic: `${drug} use carries significant toxicity risk for this patient. Genetic variants substantially alter drug processing, potentially leading to dangerous drug or metabolite accumulation.`,
        Ineffective: `${drug} is predicted to be therapeutically ineffective for this patient. Genetic variants prevent adequate drug activation or maintenance of therapeutic levels.`,
    };
    return descriptions[category] || 'Risk level requires individualized clinical assessment.';
}

function assessEvidenceLevel(result) {
    const confidence = result.riskAssessment.confidenceScore;
    let level, description;

    if (confidence >= 0.90) {
        level = '1A';
        description = 'Strong evidence from CPIC guidelines and multiple clinical studies';
    } else if (confidence >= 0.80) {
        level = '1B';
        description = 'Good evidence from CPIC guidelines with clinical validation';
    } else if (confidence >= 0.70) {
        level = '2A';
        description = 'Moderate evidence based on pharmacogenomic principles and limited clinical data';
    } else {
        level = '2B';
        description = 'Limited evidence; extrapolated from known pharmacogenomic principles';
    }

    return { level, description };
}

function generateConfidenceNote(result) {
    const confidence = result.riskAssessment.confidenceScore;
    const risk = result.riskAssessment.riskCategory;

    return {
        score: confidence,
        percentageDisplay: `${(confidence * 100).toFixed(0)}%`,
        interpretation: confidence >= 0.90
            ? 'HIGH CONFIDENCE — Well-established pharmacogenomic interaction with strong clinical evidence.'
            : confidence >= 0.80
                ? 'GOOD CONFIDENCE — Supported by clinical evidence and CPIC guidelines.'
                : confidence >= 0.70
                    ? 'MODERATE CONFIDENCE — Based on pharmacogenomic principles with emerging clinical evidence.'
                    : 'LOW CONFIDENCE — Limited clinical evidence. Use with caution.',
        disclaimer: 'PharmaGuard AI predictions are intended as clinical decision support and should not replace professional medical judgment. Results should be interpreted in the context of the complete clinical picture.',
    };
}
