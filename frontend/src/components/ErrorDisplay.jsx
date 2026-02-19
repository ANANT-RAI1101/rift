export default function ErrorDisplay({ error }) {
    if (!error) return null;

    const getErrorInfo = () => {
        if (typeof error === 'string') {
            return { title: 'Error', message: error };
        }
        switch (error.code) {
            case 'INVALID_VCF':
                return {
                    title: 'Invalid VCF File',
                    message: 'The uploaded file does not conform to VCF v4.2 format.',
                    details: error.details?.join('\n'),
                };
            case 'MISSING_FILE':
                return { title: 'No File Uploaded', message: 'Please upload a VCF file to analyze.' };
            case 'MISSING_DRUGS':
                return { title: 'No Drugs Selected', message: 'Please select at least one drug to analyze.' };
            case 'INVALID_FILE_TYPE':
                return { title: 'Invalid File Type', message: 'Only .vcf files are accepted.' };
            case 'FILE_TOO_LARGE':
                return { title: 'File Too Large', message: 'Maximum file size is 5MB.' };
            case 'PROCESSING_ERROR':
                return { title: 'Processing Error', message: error.message || 'An error occurred during analysis.' };
            case 'NETWORK_ERROR':
                return { title: 'Connection Error', message: error.message || 'Could not connect to the analysis server. Ensure the backend is reachable.' };
            default:
                return { title: 'Error', message: error.message || error.error || 'An unexpected error occurred.' };
        }
    };

    const { title, message, details } = getErrorInfo();

    return (
        <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
                <h4>{title}</h4>
                <p>{message}</p>
                {details && <div className="error-details">{details}</div>}
            </div>
        </div>
    );
}
