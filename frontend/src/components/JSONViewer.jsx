import { useState } from 'react';

export default function JSONViewer({ report }) {
    const [copied, setCopied] = useState(false);

    if (!report) return null;

    const jsonString = JSON.stringify(report, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = jsonString;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmaguard-report-${report.analysisId?.slice(0, 8) || 'report'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Syntax highlight
    const highlight = (json) => {
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'json-key' : 'json-string';
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    return (
        <div className="json-viewer">
            <div className="json-toolbar">
                <button className="json-btn" onClick={handleDownload}>
                    📥 Download JSON
                </button>
                <button className={`json-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                </button>
            </div>
            <div className="json-content">
                <pre dangerouslySetInnerHTML={{ __html: highlight(jsonString) }} />
            </div>
        </div>
    );
}
