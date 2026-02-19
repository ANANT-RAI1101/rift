import { useState } from 'react';

export default function ResultsDashboard({ report }) {
    const [expandedCards, setExpandedCards] = useState({});
    const [activeTab, setActiveTab] = useState('results');

    // report is now an array of drug reports
    if (!report || !Array.isArray(report) || report.length === 0) return null;

    const toggleCard = (idx) => {
        setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // CRITICAL: Helper to prevent React crashes when a value is an object instead of a string
    const safeVal = (val, fallback = 'N/A') => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'object') {
            // If it has a .level or .text property, use that, otherwise stringify
            return val.level || val.text || val.value || JSON.stringify(val);
        }
        return String(val);
    };

    const getRiskClass = (riskVal) => {
        const risk = safeVal(riskVal, '').toLowerCase();
        if (risk.includes('safe')) return 'safe';
        if (risk.includes('adjust') || risk.includes('caution')) return 'adjust';
        if (risk.includes('toxic') || risk.includes('high') || risk.includes('critical')) return 'toxic';
        if (risk.includes('ineffective') || risk.includes('failure')) return 'ineffective';
        return 'unknown';
    };

    const getSeverityClass = (sevVal) => {
        const sev = safeVal(sevVal, 'low').toLowerCase();
        return sev.split(' ')[0];
    };

    const getPhenotypeColorClass = (phenoVal) => {
        const pheno = safeVal(phenoVal, '').toLowerCase();
        if (pheno.includes('poor') || pheno.includes('pm')) return 'pm';
        if (pheno.includes('intermediate') || pheno.includes('im')) return 'im';
        if (pheno.includes('normal') || pheno.includes('nm')) return 'nm';
        if (pheno.includes('rapid') || pheno.includes('rm')) return 'rm';
        if (pheno.includes('ultrarapid') || pheno.includes('urm')) return 'urm';
        return '';
    };

    // Calculate aggregate stats across the drug array
    const riskCounts = report.reduce((acc, d) => {
        const risk = safeVal(d?.risk_assessment?.risk_label, 'Unknown');
        const label = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const totalVariants = report.reduce((acc, d) => acc + (d?.quality_metrics?.variants_analyzed || 0), 0);
    const pgxVariants = report.reduce((acc, d) => acc + (d?.quality_metrics?.pgx_variants_found || 0), 0);
    const uniqueGenes = [...new Set(report.map(d => safeVal(d?.pharmacogenomic_profile?.primary_gene, '')).filter(Boolean))];
    const processingTime = report[0]?.quality_metrics?.processing_time_ms || 0;

    return (
        <div className="results-container">
            {/* Summary Header */}
            <div className="results-header">
                <div className="results-title">📊 Analysis Results</div>
                <div className="results-meta">
                    <span className="results-meta-item">🕐 {processingTime}ms</span>
                    <span className="results-meta-item">🧬 {pgxVariants} variants</span>
                    <span className="results-meta-item">💊 {report.length} drugs</span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="summary-stats">
                <div className="stat-card">
                    <div className="stat-value">{totalVariants}</div>
                    <div className="stat-label">Total Variants</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{pgxVariants}</div>
                    <div className="stat-label">PGx Variants</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{uniqueGenes.length}</div>
                    <div className="stat-label">Genes Found</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{riskCounts['Safe'] || 0}</div>
                    <div className="stat-label" style={{ color: 'var(--risk-safe)' }}>Safe</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{(riskCounts['Toxic'] || 0) + (riskCounts['Ineffective'] || 0) + (riskCounts['Alert'] || 0)}</div>
                    <div className="stat-label" style={{ color: 'var(--risk-toxic)' }}>Alerts</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
                    Drug Results
                </button>
                <button className={`tab ${activeTab === 'variants' ? 'active' : ''}`} onClick={() => setActiveTab('variants')}>
                    Variants
                </button>
                <button className={`tab ${activeTab === 'genes' ? 'active' : ''}`} onClick={() => setActiveTab('genes')}>
                    Genes
                </button>
            </div>

            {activeTab === 'results' && (
                <div className="results-list">
                    {report.map((drug, idx) => (
                        <div key={idx} className={`risk-card ${expandedCards[idx] ? 'expanded' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                            {/* Card Header */}
                            <div className="risk-card-header" onClick={() => toggleCard(idx)}>
                                <div className="risk-card-left">
                                    <span className="risk-drug-name">{safeVal(drug?.drug, 'Unknown Drug')}</span>
                                    <span className="risk-gene-badge">{safeVal(drug?.pharmacogenomic_profile?.primary_gene)}</span>
                                    <span className={`phenotype-badge ${getPhenotypeColorClass(drug?.pharmacogenomic_profile?.phenotype)}`}>
                                        {safeVal(drug?.pharmacogenomic_profile?.phenotype)}
                                    </span>
                                </div>
                                <div className="risk-card-right">
                                    <span className={`severity-dot ${getSeverityClass(drug?.risk_assessment?.severity)}`}></span>
                                    <span className={`risk-badge ${getRiskClass(drug?.risk_assessment?.risk_label)}`}>
                                        {safeVal(drug?.risk_assessment?.risk_label)}
                                    </span>
                                    <span className={`risk-expand-icon ${expandedCards[idx] ? 'expanded' : ''}`}>▼</span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedCards[idx] && (
                                <div className="risk-card-details">
                                    <div className="detail-grid">
                                        {/* Pharmacogenomic Profile */}
                                        <div className="detail-section">
                                            <h4>🧬 Pharmacogenomic Profile</h4>
                                            <div className="detail-row">
                                                <span className="detail-label">Diplotype</span>
                                                <span className="detail-value">{safeVal(drug?.pharmacogenomic_profile?.diplotype)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Phenotype</span>
                                                <span className="detail-value">{safeVal(drug?.pharmacogenomic_profile?.phenotype)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Gene Symbol</span>
                                                <span className="detail-value">{safeVal(drug?.pharmacogenomic_profile?.primary_gene)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Patient ID</span>
                                                <span className="detail-value">{safeVal(drug?.patient_id)}</span>
                                            </div>
                                        </div>

                                        {/* Risk Assessment */}
                                        <div className="detail-section">
                                            <h4>⚡ Risk Assessment</h4>
                                            <div className="detail-row">
                                                <span className="detail-label">Risk Label</span>
                                                <span className={`risk-badge ${getRiskClass(drug?.risk_assessment?.risk_label)}`}>
                                                    {safeVal(drug?.risk_assessment?.risk_label, 'Unknown')}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Severity</span>
                                                <span className="detail-value">
                                                    <span className={`severity-dot ${getSeverityClass(drug?.risk_assessment?.severity)}`}></span>
                                                    {safeVal(drug?.risk_assessment?.severity, 'Low')}
                                                </span>
                                            </div>
                                            {(drug?.risk_assessment?.confidence_score !== undefined && drug?.risk_assessment?.confidence_score !== null) && (
                                                <div className="confidence-meter">
                                                    <div className="meter-label">
                                                        <span>Confidence</span>
                                                        <span>{((Number(drug.risk_assessment.confidence_score) || 0) * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="meter-bar">
                                                        <div
                                                            className="meter-fill"
                                                            style={{ width: `${(Number(drug.risk_assessment.confidence_score) || 0) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Clinical Recommendation */}
                                        <div className="detail-section full">
                                            <h4>💊 Clinical Recommendation</h4>
                                            <p>{safeVal(drug?.clinical_recommendation?.recommendation, 'No recommendation available.')}</p>

                                            {drug?.clinical_recommendation?.dosage_advice && (
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Dosage Advice</span>
                                                        <span className="detail-value" style={{ textAlign: 'right', maxWidth: '60%' }}>
                                                            {safeVal(drug.clinical_recommendation.dosage_advice)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {Array.isArray(drug?.clinical_recommendation?.alternatives) && drug.clinical_recommendation.alternatives.length > 0 && (
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <span className="detail-label">Alternative Drugs:</span>
                                                    <div className="alternatives-list">
                                                        {drug.clinical_recommendation.alternatives.map((alt, i) => (
                                                            <span key={i} className="alt-pill">{safeVal(alt)}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Monitoring Plan */}
                                        {Array.isArray(drug?.clinical_recommendation?.monitoring) && drug.clinical_recommendation.monitoring.length > 0 && (
                                            <div className="detail-section">
                                                <h4>📋 Monitoring Plan</h4>
                                                <ul className="monitoring-list">
                                                    {drug.clinical_recommendation.monitoring.map((item, i) => (
                                                        <li key={i}>{safeVal(item)}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* AI Explanation */}
                                        {drug?.llm_generated_explanation && (
                                            <div className="ai-section detail-section full">
                                                <div className="ai-section-header">
                                                    <span className="ai-badge">AI Intelligence</span>
                                                    <h4>Mechanism & Clinical Interpretation</h4>
                                                </div>
                                                <div className="ai-content">
                                                    {drug.llm_generated_explanation.summary && (
                                                        <div className="ai-para"><strong>Summary:</strong> {safeVal(drug.llm_generated_explanation.summary)}</div>
                                                    )}
                                                    {drug.llm_generated_explanation.mechanism && (
                                                        <div className="ai-para" style={{ marginTop: '0.5rem' }}><strong>Mechanism:</strong> {safeVal(drug.llm_generated_explanation.mechanism)}</div>
                                                    )}
                                                    {drug.llm_generated_explanation.risk_explanation && (
                                                        <div className="ai-para" style={{ marginTop: '0.5rem' }}><strong>Risk Context:</strong> {safeVal(drug.llm_generated_explanation.risk_explanation)}</div>
                                                    )}
                                                    {drug.llm_generated_explanation.evidence_level && (
                                                        <div className="detail-row" style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                                            <span className="detail-label">Evidence Level</span>
                                                            <span className="detail-value text-accent">
                                                                {safeVal(drug.llm_generated_explanation.evidence_level)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'variants' && (
                <div className="detail-section">
                    <h4>🧬 Detected Pharmacogenomic Variants</h4>
                    {report.map((drug, idx) => (
                        Array.isArray(drug?.pharmacogenomic_profile?.detected_variants) && drug.pharmacogenomic_profile.detected_variants.length > 0 && (
                            <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span className="risk-gene-badge">{safeVal(drug.pharmacogenomic_profile.primary_gene)}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{safeVal(drug.drug)}</span>
                                </div>
                                <div className="variants-table">
                                    {drug.pharmacogenomic_profile.detected_variants.map((v, vi) => (
                                        <div key={vi} className="detail-row">
                                            <span className="detail-label">{safeVal(v?.rsid, 'Unknown rsID')}</span>
                                            <span className="detail-value">{safeVal(v?.zygosity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            {activeTab === 'genes' && (
                <div className="detail-section">
                    <h4>🧬 Genes Analyzed</h4>
                    {uniqueGenes.map((gene, idx) => (
                        <div key={idx} className="detail-row">
                            <span className="detail-label" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text-accent)' }}>{safeVal(gene)}</span>
                            <span className="detail-value">
                                {report.filter(d => safeVal(d?.pharmacogenomic_profile?.primary_gene) === gene).map(d => safeVal(d.drug)).join(', ')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
