/**
 * PharmaGuard Clinical Recommendation Engine
 * 
 * Generates CPIC-aligned clinical recommendations from risk predictions.
 */

/**
 * Generate comprehensive clinical recommendations
 */
export function generateRecommendations(riskResults) {
    return riskResults.map(result => {
        if (result.error) {
            return {
                drug: result.drug,
                error: result.error,
                actionRequired: false,
            };
        }

        const risk = result.riskAssessment.riskCategory;
        const severity = result.riskAssessment.severity;

        return {
            drug: result.drug,
            gene: result.gene,
            actionRequired: risk !== 'Safe',
            urgencyLevel: getUrgencyLevel(risk, severity),
            summary: generateSummary(result),
            detailedRecommendation: result.clinicalRecommendation.recommendation,
            dosageGuidance: result.clinicalRecommendation.dosageAdvice,
            alternativeDrugs: result.clinicalRecommendation.alternatives,
            monitoringPlan: generateMonitoringPlan(result),
            cpicLevel: getCPICLevel(result),
            references: generateReferences(result),
        };
    });
}

function getUrgencyLevel(risk, severity) {
    if (severity === 'Critical') return 'URGENT';
    if (severity === 'High') return 'HIGH';
    if (risk === 'Adjust Dosage') return 'MODERATE';
    return 'ROUTINE';
}

function generateSummary(result) {
    const { drug, gene, pharmacogenomicProfile: pgx, riskAssessment: risk } = result;
    const summaries = {
        Safe: `${drug} can be used at standard doses for this ${pgx.phenotype} (${pgx.diplotype}) patient. No pharmacogenomic dose adjustments are recommended.`,
        'Adjust Dosage': `${drug} requires dose modification for this ${pgx.phenotype} (${pgx.diplotype}) patient. ${gene} ${pgx.abbreviation} status affects drug ${drug === 'Warfarin' ? 'clearance' : 'metabolism'}.`,
        Toxic: `${drug} poses a significant toxicity risk for this ${pgx.phenotype} (${pgx.diplotype}) patient. ${gene} ${pgx.abbreviation} status leads to ${drug === 'Codeine' ? 'excessive active metabolite formation' : 'drug accumulation'}.`,
        Ineffective: `${drug} is likely ineffective for this ${pgx.phenotype} (${pgx.diplotype}) patient. ${gene} ${pgx.abbreviation} status results in insufficient ${drug === 'Clopidogrel' ? 'prodrug activation' : 'therapeutic effect'}.`,
    };
    return summaries[risk.riskCategory] || `${drug} risk assessment requires clinical review for ${pgx.phenotype} patients.`;
}

function generateMonitoringPlan(result) {
    const risk = result.riskAssessment.riskCategory;
    const drug = result.drug;

    const plans = {
        Codeine: {
            Toxic: ['Monitor for respiratory depression', 'Watch for excessive sedation', 'Check for nausea/vomiting', 'Assess pain control adequacy'],
            Ineffective: ['Monitor pain control', 'Assess need for alternative analgesic', 'Document inadequate response'],
            Safe: ['Standard pain assessment', 'Routine monitoring'],
        },
        Warfarin: {
            Toxic: ['INR monitoring 2-3x weekly initially', 'Watch for signs of bleeding', 'Monitor for bruising', 'Check stool for occult blood'],
            'Adjust Dosage': ['INR monitoring weekly initially', 'Assess for bleeding signs', 'Titrate dose based on INR'],
            Safe: ['Routine INR monitoring', 'Standard follow-up'],
        },
        Clopidogrel: {
            Ineffective: ['Platelet function testing', 'Monitor for cardiovascular events', 'Assess stent thrombosis risk'],
            'Adjust Dosage': ['Platelet function testing recommended', 'Clinical response monitoring'],
            Safe: ['Standard follow-up', 'Routine monitoring'],
        },
        Simvastatin: {
            Toxic: ['Monitor CK levels', 'Assess for muscle pain/weakness', 'Check LFTs', 'Watch for dark urine (rhabdomyolysis)'],
            'Adjust Dosage': ['CK monitoring monthly initially', 'Assess muscle symptoms', 'Monitor lipid levels'],
            Safe: ['Routine lipid panel', 'Standard LFT monitoring'],
        },
        Azathioprine: {
            Toxic: ['CBC with differential weekly x8 weeks', 'Then biweekly x4 months', 'Monitor for infections', 'Watch for myelosuppression signs'],
            'Adjust Dosage': ['CBC weekly x4 weeks, then monthly', 'Monitor for infection', 'Assess therapeutic response'],
            Safe: ['Routine CBC monitoring', 'Standard follow-up'],
        },
        Fluorouracil: {
            Toxic: ['Daily assessment for mucositis', 'CBC monitoring', 'Monitor for neurotoxicity', 'Watch for hand-foot syndrome'],
            'Adjust Dosage': ['CBC 2x weekly', 'Daily mucositis assessment', 'Dose adjustment per toxicity'],
            Safe: ['Standard oncology monitoring', 'Routine CBC'],
        },
    };

    return plans[drug]?.[risk] || plans[drug]?.Safe || ['Clinical monitoring as appropriate'];
}

function getCPICLevel(result) {
    const risk = result.riskAssessment.riskCategory;
    if (risk === 'Safe') return 'A - Strong recommendation, standard dosing';
    if (risk === 'Adjust Dosage') return 'A - Strong recommendation, dose modification';
    if (risk === 'Toxic' || risk === 'Ineffective') return 'A - Strong recommendation, alternative therapy';
    return 'B - Moderate recommendation';
}

function generateReferences(result) {
    const refs = [
        `CPIC Guideline for ${result.drug} and ${result.gene}`,
        `PharmGKB Clinical Annotation - ${result.gene} ${result.pharmacogenomicProfile.diplotype}`,
    ];

    if (result.riskAssessment.riskCategory !== 'Safe') {
        refs.push(`FDA Drug Label - ${result.drug} pharmacogenomic information`);
    }

    return refs;
}
