/**
 * PharmaGuard Risk Prediction Engine
 *
 * Determines diplotype, metabolizer phenotype, and drug-specific risk
 * from parsed VCF variants and selected drugs.
 */

import {
    getPhenotype,
    DRUG_GENE_RULES,
    DEFAULT_ALLELES,
    SUPPORTED_DRUGS,
    ALLELE_FUNCTIONS,
} from './knowledgeBase.js';
import { groupVariantsByGene } from './vcfParser.js';

/**
 * Predict risks for given variants and drug list
 */
export function predictRisks(variants, drugs) {
    const geneGroups = groupVariantsByGene(variants);
    const results = [];

    for (const drugName of drugs) {
        const normalizedDrug = normalizeDrugName(drugName);
        if (!normalizedDrug) {
            results.push({
                drug: drugName,
                error: `Unsupported drug: ${drugName}`,
                risk: 'Unknown',
                severity: 'Unknown',
                confidence: 0,
            });
            continue;
        }

        const rule = DRUG_GENE_RULES[normalizedDrug];
        if (!rule) continue;

        const gene = rule.gene;
        const geneVariants = geneGroups[gene] || [];

        // Determine alleles
        const alleles = determineAlleles(gene, geneVariants);
        const phenotypeResult = getPhenotype(gene, alleles.allele1, alleles.allele2);

        // Get risk rules for this phenotype
        const riskRule = rule.rules[phenotypeResult.abbreviation] || rule.rules['NM'];

        results.push({
            drug: normalizedDrug,
            gene: gene,
            geneDescription: rule.description,
            variants: geneVariants.map(v => ({
                rsid: v.rsid,
                chromosome: v.chromosome,
                position: v.position,
                reference: v.reference,
                alternate: v.alternate,
                starAllele: v.starAllele,
                zygosity: v.zygosity,
            })),
            pharmacogenomicProfile: {
                diplotype: phenotypeResult.diplotype,
                phenotype: phenotypeResult.phenotype,
                abbreviation: phenotypeResult.abbreviation,
                activityScore: phenotypeResult.activityScore,
                allele1: alleles.allele1,
                allele2: alleles.allele2,
                allele1Function: alleles.allele1Function,
                allele2Function: alleles.allele2Function,
            },
            riskAssessment: {
                riskCategory: riskRule.risk,
                severity: riskRule.severity,
                confidenceScore: riskRule.confidence,
            },
            clinicalRecommendation: {
                recommendation: riskRule.recommendation,
                dosageAdvice: riskRule.dosageAdvice,
                alternatives: riskRule.alternatives,
                mechanism: riskRule.mechanism,
            },
        });
    }

    return results;
}

/**
 * Determine the two alleles for a gene based on found variants
 */
function determineAlleles(gene, variants) {
    const defaultAllele = DEFAULT_ALLELES[gene] || '*1';

    if (variants.length === 0) {
        return {
            allele1: defaultAllele,
            allele2: defaultAllele,
            allele1Function: 'Normal Function (assumed)',
            allele2Function: 'Normal Function (assumed)',
        };
    }

    // Use the first variant found
    const primaryVariant = variants[0];
    let allele1, allele2;

    if (primaryVariant.zygosity === 'Homozygous Alternate') {
        allele1 = primaryVariant.starAllele || defaultAllele;
        allele2 = primaryVariant.starAllele || defaultAllele;
    } else if (primaryVariant.zygosity === 'Heterozygous') {
        allele1 = defaultAllele;
        allele2 = primaryVariant.starAllele || defaultAllele;
    } else {
        allele1 = defaultAllele;
        allele2 = variants.length > 1
            ? (variants[1].starAllele || defaultAllele)
            : defaultAllele;
    }

    // If there are additional variants for compound heterozygosity
    if (variants.length > 1 && primaryVariant.zygosity === 'Heterozygous') {
        allele2 = variants[1].starAllele || allele2;
    }

    return {
        allele1,
        allele2,
        allele1Function: getAlleleDescription(gene, allele1),
        allele2Function: getAlleleDescription(gene, allele2),
    };
}

function getAlleleDescription(gene, allele) {
    const func = ALLELE_FUNCTIONS[gene]?.[allele];
    return func ? `${allele} (${func})` : `${allele}`;
}

/**
 * Normalize drug name to match our knowledge base
 */
function normalizeDrugName(name) {
    const normalized = name.trim().toLowerCase();
    return SUPPORTED_DRUGS.find(d => d.toLowerCase() === normalized) || null;
}
