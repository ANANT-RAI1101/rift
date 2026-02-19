/**
 * PharmaGuard VCF Parser
 * 
 * Parses VCF v4.2 files to extract pharmacogenomic variants.
 * Extracts GENE, STAR allele, and RSID from INFO fields.
 */

import { RSID_MAP, SUPPORTED_GENES } from './knowledgeBase.js';

/**
 * Validate VCF file structure
 */
export function validateVCF(content) {
    const errors = [];
    const lines = content.split('\n').filter(l => l.trim());

    if (lines.length === 0) {
        errors.push('Empty VCF file');
        return { valid: false, errors };
    }

    // Check for VCF header
    const hasFileFormat = lines.some(l => l.startsWith('##fileformat=VCF'));
    if (!hasFileFormat) {
        errors.push('Missing ##fileformat=VCF header. File may not be a valid VCF v4.2 file.');
    }

    // Check for column header
    const headerLine = lines.find(l => l.startsWith('#CHROM'));
    if (!headerLine) {
        errors.push('Missing #CHROM header line');
    }

    // Check for data lines
    const dataLines = lines.filter(l => !l.startsWith('#'));
    if (dataLines.length === 0) {
        errors.push('No variant data found in VCF file');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Parse INFO field into key-value pairs
 */
function parseInfo(infoStr) {
    const info = {};
    if (!infoStr || infoStr === '.') return info;

    const fields = infoStr.split(';');
    for (const field of fields) {
        const eqIdx = field.indexOf('=');
        if (eqIdx > 0) {
            const key = field.substring(0, eqIdx).trim();
            const value = field.substring(eqIdx + 1).trim();
            info[key] = value;
        } else {
            info[field.trim()] = true;
        }
    }
    return info;
}

/**
 * Parse a VCF file and extract pharmacogenomic variants
 */
export function parseVCF(content) {
    const lines = content.split('\n').filter(l => l.trim());
    const variants = [];
    const metadata = {
        fileformat: '',
        source: '',
        totalVariants: 0,
        pharmacogenomicVariants: 0,
        genes: new Set(),
    };

    for (const line of lines) {
        // Parse metadata
        if (line.startsWith('##fileformat=')) {
            metadata.fileformat = line.split('=')[1];
            continue;
        }
        if (line.startsWith('##source=')) {
            metadata.source = line.split('=')[1];
            continue;
        }
        if (line.startsWith('#')) continue;

        // Parse data line
        const cols = line.split('\t');
        if (cols.length < 8) continue;

        const [chrom, pos, id, ref, alt, qual, filter, info] = cols;
        const parsedInfo = parseInfo(info);

        metadata.totalVariants++;

        // Extract pharmacogenomic data
        const gene = parsedInfo.GENE || null;
        const star = parsedInfo.STAR || null;
        const rsid = parsedInfo.RSID || id || null;

        // Check if this is a pharmacogenomically relevant variant
        let isPGx = false;
        let mappedGene = gene;
        let mappedAllele = star;

        // Try to map via rsID if gene/star not in INFO
        if (rsid && RSID_MAP[rsid]) {
            const mapping = RSID_MAP[rsid];
            mappedGene = mappedGene || mapping.gene;
            mappedAllele = mappedAllele || mapping.allele;
            isPGx = true;
        }

        // Check if gene is in our supported list
        if (mappedGene && SUPPORTED_GENES.includes(mappedGene)) {
            isPGx = true;
        }

        if (isPGx && mappedGene) {
            metadata.pharmacogenomicVariants++;
            metadata.genes.add(mappedGene);

            variants.push({
                chromosome: chrom,
                position: parseInt(pos),
                rsid: rsid,
                reference: ref,
                alternate: alt,
                quality: qual !== '.' ? parseFloat(qual) : null,
                filter: filter,
                gene: mappedGene,
                starAllele: mappedAllele,
                info: parsedInfo,
                zygosity: determineZygosity(cols),
            });
        }
    }

    metadata.genes = Array.from(metadata.genes);

    return { variants, metadata };
}

/**
 * Determine zygosity from genotype field (if present)
 */
function determineZygosity(cols) {
    if (cols.length < 10) return 'Unknown';

    const format = cols[8];
    const sample = cols[9];

    if (!format || !sample) return 'Unknown';

    const formatFields = format.split(':');
    const sampleFields = sample.split(':');
    const gtIndex = formatFields.indexOf('GT');

    if (gtIndex === -1 || gtIndex >= sampleFields.length) return 'Unknown';

    const gt = sampleFields[gtIndex];
    const separator = gt.includes('/') ? '/' : '|';
    const alleles = gt.split(separator);

    if (alleles.length !== 2) return 'Unknown';
    if (alleles[0] === alleles[1]) {
        return alleles[0] === '0' ? 'Homozygous Reference' : 'Homozygous Alternate';
    }
    return 'Heterozygous';
}

/**
 * Group variants by gene and determine diplotypes
 */
export function groupVariantsByGene(variants) {
    const geneGroups = {};

    for (const variant of variants) {
        if (!geneGroups[variant.gene]) {
            geneGroups[variant.gene] = [];
        }
        geneGroups[variant.gene].push(variant);
    }

    return geneGroups;
}
