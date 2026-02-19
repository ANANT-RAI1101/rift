import { useState, useRef } from 'react';

export default function FileUpload({ onFileSelect, file }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) validateAndSet(droppedFile);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) validateAndSet(selected);
    };

    const validateAndSet = (f) => {
        if (!f.name.toLowerCase().endsWith('.vcf')) {
            alert('Please select a .vcf file');
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            alert('File size must be under 5MB');
            return;
        }
        onFileSelect(f);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (file) {
        return (
            <div className="upload-success">
                <span className="file-icon">🧬</span>
                <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatSize(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={() => onFileSelect(null)} title="Remove file">
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <span className="upload-icon">📁</span>
            <div className="upload-text">
                <strong>Drop your VCF file here</strong>
                <br />
                or click to browse
                <span className="file-types">VCF v4.2 format • Max 5MB</span>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".vcf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
}
