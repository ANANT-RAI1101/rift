import { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DrugInput from './components/DrugInput';
import ResultsDashboard from './components/ResultsDashboard';
import JSONViewer from './components/JSONViewer';
import ErrorDisplay from './components/ErrorDisplay';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('Using API_URL:', API_URL);

const LOADING_STEPS = [
  'Validating VCF file...',
  'Extracting pharmacogenomic variants...',
  'Mapping gene alleles...',
  'Predicting drug risks...',
  'Generating clinical recommendations...',
  'Producing AI explanations...',
  'Building report...',
];

export default function App() {
  const [file, setFile] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [showJSON, setShowJSON] = useState(false);

  const canAnalyze = file && selectedDrugs.length > 0 && !loading;

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    setShowJSON(false);

    // Simulate loading steps
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < LOADING_STEPS.length) {
        setLoadingStep(LOADING_STEPS[stepIdx]);
        stepIdx++;
      }
    }, 400);

    try {
      const formData = new FormData();
      formData.append('vcf_file', file);
      formData.append('drugs', selectedDrugs.join(','));

      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data);
      } else {
        setReport(data);
      }
    } catch (err) {
      setError({
        code: 'NETWORK_ERROR',
        message: `Could not connect to the analysis server at ${API_URL}. Ensure the backend is running and accessible (check for CORS or Mixed Content issues).`,
      });
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div>
      <Header />
      <main className="app-main">
        <div className="analysis-grid">
          {/* Left Panel - Inputs */}
          <div>
            {/* File Upload */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header">
                <div className="card-header-icon">📄</div>
                <h2>VCF File Upload</h2>
              </div>
              <div className="card-body">
                <FileUpload file={file} onFileSelect={setFile} />
              </div>
            </div>

            {/* Drug Selection */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header">
                <div className="card-header-icon">💊</div>
                <h2>Drug Selection</h2>
              </div>
              <div className="card-body">
                <DrugInput selectedDrugs={selectedDrugs} onDrugsChange={setSelectedDrugs} />
              </div>
            </div>

            {/* Analyze Button */}
            <button
              className={`analyze-btn ${loading ? 'loading' : ''}`}
              disabled={!canAnalyze}
              onClick={analyze}
            >
              {loading ? (
                <><span className="spinner"></span>Analyzing...</>
              ) : (
                <>🧬 Analyze Pharmacogenomic Risks</>
              )}
            </button>

            {/* Quick Info */}
            <div
              className="card"
              style={{ marginTop: '1rem', opacity: 0.7 }}
            >
              <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Supported Genes:</strong>
                  <br />
                  CYP2D6 • CYP2C19 • CYP2C9 • SLCO1B1 • TPMT • DPYD
                  <br /><br />
                  <strong style={{ color: 'var(--text-secondary)' }}>Guidelines:</strong>
                  <br />
                  CPIC-aligned recommendations
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="results-area">
            {error && <ErrorDisplay error={error} />}

            {loading && (
              <div className="card">
                <div className="loading-overlay">
                  <div className="dna-loader"></div>
                  <div className="loading-text">Analyzing Genetic Data</div>
                  <div className="loading-step">{loadingStep}</div>
                </div>
              </div>
            )}

            {!loading && !report && !error && (
              <div className="card">
                <div className="results-empty">
                  <span className="results-empty-icon">🧬</span>
                  <h3>Ready for Analysis</h3>
                  <p>Upload a VCF file and select drugs to begin pharmacogenomic risk prediction.</p>
                </div>
              </div>
            )}

            {report && (
              <div className="card">
                <div className="card-body">
                  <ResultsDashboard report={report} />

                  {/* Toggle JSON */}
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                      className="json-btn"
                      onClick={() => setShowJSON(!showJSON)}
                      style={{ margin: '0 auto' }}
                    >
                      {showJSON ? '🔼 Hide JSON Report' : '🔽 View Full JSON Report'}
                    </button>
                  </div>

                  {showJSON && <JSONViewer report={report} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
