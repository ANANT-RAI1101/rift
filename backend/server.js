/**
 * PharmaGuard Express.js Server
 * 
 * API endpoints for VCF analysis and pharmacogenomic risk prediction.
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { validateVCF, parseVCF } from './vcfParser.js';
import { predictRisks } from './riskEngine.js';
import { generateRecommendations } from './clinicalRecommendations.js';
import { generateExplanations } from './llmExplainer.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config for VCF file uploads (memory storage, no disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.vcf')) {
            cb(null, true);
        } else {
            cb(new Error('Only .vcf files are accepted'), false);
        }
    },
});

// Root route - Service discovery
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to PharmaGuard API',
        description: 'AI-powered Pharmacogenomic Risk Prediction System',
        endpoints: [
            { path: '/', method: 'GET', description: 'API index and service discovery' },
            { path: '/api/health', method: 'GET', description: 'Service health check' },
            { path: '/api/drugs', method: 'GET', description: 'List of supported drugs for analysis' },
            { path: '/api/analyze', method: 'POST', description: 'Analyze VCF file for drug risks (form-data: vcf_file, drugs)' }
        ],
        documentation: 'Visit /api/health for system status.'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'PharmaGuard API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Get supported drugs
app.get('/api/drugs', (req, res) => {
    res.json({
        drugs: [
            { name: 'Codeine', gene: 'CYP2D6', category: 'Analgesic (Opioid)' },
            { name: 'Warfarin', gene: 'CYP2C9', category: 'Anticoagulant' },
            { name: 'Clopidogrel', gene: 'CYP2C19', category: 'Antiplatelet' },
            { name: 'Simvastatin', gene: 'SLCO1B1', category: 'Statin (Lipid-lowering)' },
            { name: 'Azathioprine', gene: 'TPMT', category: 'Immunosuppressant' },
            { name: 'Fluorouracil', gene: 'DPYD', category: 'Antineoplastic' },
        ],
    });
});

// Main analysis endpoint
app.post('/api/analyze', upload.single('vcf_file'), async (req, res) => {
    const startTime = Date.now();
    const analysisId = uuidv4();

    try {
        // Validate inputs
        if (!req.file) {
            return res.status(400).json({
                error: 'No VCF file provided',
                code: 'MISSING_FILE',
            });
        }

        const drugsInput = req.body.drugs;
        if (!drugsInput || drugsInput.trim() === '') {
            return res.status(400).json({
                error: 'No drugs specified',
                code: 'MISSING_DRUGS',
            });
        }

        const drugs = drugsInput.split(',').map(d => d.trim()).filter(Boolean);
        if (drugs.length === 0) {
            return res.status(400).json({
                error: 'Invalid drug input',
                code: 'INVALID_DRUGS',
            });
        }

        // Parse VCF content
        const vcfContent = req.file.buffer.toString('utf-8');

        // Validate VCF
        const validation = validateVCF(vcfContent);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid VCF file',
                code: 'INVALID_VCF',
                details: validation.errors,
            });
        }

        // Parse variants
        const { variants, metadata } = parseVCF(vcfContent);

        // Predict risks
        const riskResults = predictRisks(variants, drugs);

        // Generate clinical recommendations
        const recommendations = generateRecommendations(riskResults);

        // Generate AI explanations
        const explanations = generateExplanations(riskResults);

        // Build the complete report array (one per drug)
        const reports = riskResults.map((risk, idx) => {
            const rec = recommendations[idx];
            const expl = explanations[idx];

            return {
                patient_id: `PGX-${analysisId.split('-')[0].toUpperCase()}`,
                drug: risk.drug,
                timestamp: new Date().toISOString(),
                risk_assessment: {
                    risk_label: risk.riskAssessment.riskCategory,
                    confidence_score: risk.riskAssessment.confidenceScore,
                    severity: risk.riskAssessment.severity.toLowerCase(),
                },
                pharmacogenomic_profile: {
                    primary_gene: risk.gene,
                    diplotype: risk.pharmacogenomicProfile.diplotype,
                    phenotype: risk.pharmacogenomicProfile.phenotype,
                    detected_variants: risk.variants.map(v => ({
                        rsid: v.rsid,
                        chromosome: v.chromosome,
                        position: v.position,
                        reference: v.reference,
                        alternate: v.alternate,
                        zygosity: v.zygosity
                    })),
                },
                clinical_recommendation: {
                    recommendation: rec.recommendation,
                    dosage_advice: rec.dosageAdvice,
                    alternatives: rec.alternatives,
                    monitoring: rec.monitoring,
                    urgency: rec.urgency
                },
                llm_generated_explanation: {
                    summary: expl.clinicalSummary,
                    mechanism: expl.mechanism,
                    interpretation: expl.interpretation,
                    risk_explanation: expl.riskExplanation,
                    evidence_level: expl.evidenceLevel
                },
                quality_metrics: {
                    vcf_parsing_success: true,
                    processing_time_ms: Date.now() - startTime,
                    variants_analyzed: metadata.totalVariants,
                    pgx_variants_found: metadata.pharmacogenomicVariants
                },
            };
        });

        res.json(reports);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Internal processing error',
            code: 'PROCESSING_ERROR',
            message: error.message,
            analysisId,
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 5MB.',
                code: 'FILE_TOO_LARGE',
            });
        }
        return res.status(400).json({
            error: `Upload error: ${err.message}`,
            code: 'UPLOAD_ERROR',
        });
    }

    if (err.message === 'Only .vcf files are accepted') {
        return res.status(400).json({
            error: 'Only .vcf files are accepted',
            code: 'INVALID_FILE_TYPE',
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        message: err.message,
    });
});

app.listen(PORT, () => {
    console.log(`🧬 PharmaGuard API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Drugs:  http://localhost:${PORT}/api/drugs`);
});
